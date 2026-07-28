"use strict";

(function initFlashcards(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.QuizmonFlashcards = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const KINDS = Object.freeze(["types", "pokemon", "moves", "abilities", "items"]);
  const COUNT_OPTIONS = Object.freeze([10, 20, "all"]);
  const RATINGS = Object.freeze(["known", "unsure", "unknown"]);
  const HISTORY_LIMIT = 30;

  function normalizeKind(value) {
    const kind = String(value || "").toLowerCase();
    return KINDS.includes(kind) ? kind : "pokemon";
  }

  function normalizeCount(value) {
    if (String(value).toLowerCase() === "all") return "all";
    const number = Number(value);
    return number === 20 ? 20 : 10;
  }

  function normalizeRating(value) {
    const rating = String(value || "").toLowerCase();
    return RATINGS.includes(rating) ? rating : null;
  }

  function itemId(kind, item) {
    const safeKind = normalizeKind(kind);
    if (safeKind === "types") return String(item || "");
    const id = Number(item?.id ?? item);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  function cardKey(kind, item) {
    const safeKind = normalizeKind(kind);
    const id = itemId(safeKind, item);
    return id == null || id === "" ? "" : `${safeKind}:${id}`;
  }

  function parseCardKey(value) {
    const match = String(value || "").match(/^(types|pokemon|moves|abilities|items):(.+)$/);
    if (!match) return null;
    const kind = normalizeKind(match[1]);
    const id = kind === "types" ? String(match[2] || "") : Number(match[2]);
    if (id === "" || (kind !== "types" && (!Number.isInteger(id) || id <= 0))) return null;
    return { key: `${kind}:${id}`, kind, id };
  }

  function fisherYates(items, random = Math.random) {
    const output = [...items];
    for (let index = output.length - 1; index > 0; index -= 1) {
      const next = Math.max(0, Math.min(index, Math.floor(Number(random()) * (index + 1))));
      [output[index], output[next]] = [output[next], output[index]];
    }
    return output;
  }

  function select(items, count = 10, random = Math.random) {
    const source = Array.isArray(items) ? items : [];
    const selectedCount = normalizeCount(count);
    const shuffled = fisherYates(source, random);
    return selectedCount === "all" ? shuffled : shuffled.slice(0, Math.min(selectedCount, shuffled.length));
  }

  function createSession(items, options = {}) {
    const kind = normalizeKind(options.kind);
    const count = normalizeCount(options.count);
    const deck = select(items, count, options.random);
    return {
      id: String(options.id || `cards-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      kind,
      count,
      sourceId: String(options.sourceId || "all"),
      sourceLabel: String(options.sourceLabel || ""),
      generation: String(options.generation || "all"),
      initialDeck: [...deck],
      deck,
      index: 0,
      revealed: false,
      phase: "learning",
      initialRatings: {},
      latestRatings: {},
      roundRatings: {},
      reviewRound: 0,
      startedAt: options.startedAt || new Date().toISOString(),
      completedAt: null,
      persisted: false
    };
  }

  function current(session) {
    if (!session?.deck?.length) return null;
    const index = Math.max(0, Math.min(session.deck.length - 1, Number(session.index) || 0));
    return session.deck[index] ?? null;
  }

  function move(session, delta) {
    if (!session?.deck?.length || session.phase === "summary") return session;
    const max = session.deck.length - 1;
    session.index = Math.max(0, Math.min(max, (Number(session.index) || 0) + Number(delta || 0)));
    session.revealed = false;
    return session;
  }

  function reveal(session, value = true) {
    if (session && session.phase !== "summary") session.revealed = Boolean(value);
    return session;
  }

  function reshuffle(session, random = Math.random) {
    if (!session?.deck || session.phase === "summary") return session;
    session.deck = fisherYates(session.deck, random);
    session.index = 0;
    session.revealed = false;
    return session;
  }

  function progress(session) {
    const total = session?.deck?.length || 0;
    if (!total) return { current: 0, total: 0, percent: 0, first: true, last: true };
    const index = Math.max(0, Math.min(total - 1, Number(session.index) || 0));
    return {
      current: index + 1,
      total,
      percent: Math.round(((index + 1) / total) * 100),
      first: index === 0,
      last: index === total - 1
    };
  }

  function ratingFor(session, item = current(session)) {
    if (!session || !item) return null;
    const key = cardKey(session.kind, item);
    if (session.phase === "learning") return normalizeRating(session.initialRatings?.[key]);
    return normalizeRating(session.roundRatings?.[key]);
  }

  function unresolvedItems(session) {
    if (!session?.initialDeck?.length) return [];
    return session.initialDeck.filter(item => {
      const key = cardKey(session.kind, item);
      const initial = normalizeRating(session.initialRatings?.[key]);
      if (!initial || initial === "known") return false;
      return normalizeRating(session.latestRatings?.[key] || initial) !== "known";
    });
  }

  function allCurrentDeckRated(session) {
    return Boolean(session?.deck?.length) && session.deck.every(item => normalizeRating(session.roundRatings?.[cardKey(session.kind, item)]));
  }

  function nextUnratedIndex(session, fromIndex = Number(session?.index) || 0) {
    if (!session?.deck?.length) return -1;
    const total = session.deck.length;
    for (let offset = 1; offset <= total; offset += 1) {
      const index = (fromIndex + offset) % total;
      const key = cardKey(session.kind, session.deck[index]);
      if (!normalizeRating(session.roundRatings?.[key])) return index;
    }
    return -1;
  }

  function beginReview(session, items = unresolvedItems(session)) {
    if (!session || !items.length) return false;
    session.phase = "review";
    session.reviewRound = Math.max(0, Number(session.reviewRound) || 0) + 1;
    session.deck = [...items];
    session.index = 0;
    session.revealed = false;
    session.roundRatings = {};
    return true;
  }

  function complete(session, completedAt = new Date().toISOString()) {
    if (!session) return session;
    session.phase = "summary";
    session.completedAt = completedAt;
    session.revealed = false;
    return session;
  }

  function rateCurrent(session, value, options = {}) {
    const rating = normalizeRating(value);
    const item = current(session);
    if (!session || !item || !rating || session.phase === "summary") return { accepted: false, transition: null };
    const key = cardKey(session.kind, item);
    if (!key) return { accepted: false, transition: null };
    if (session.phase === "learning") {
      session.initialRatings[key] = rating;
      session.latestRatings[key] = rating;
    } else {
      session.latestRatings[key] = rating;
    }
    session.roundRatings[key] = rating;
    session.revealed = false;

    if (!allCurrentDeckRated(session)) {
      const next = nextUnratedIndex(session, session.index);
      if (next >= 0) session.index = next;
      return { accepted: true, transition: "next", rating };
    }

    if (session.phase === "learning") {
      const review = unresolvedItems(session);
      if (review.length) {
        beginReview(session, fisherYates(review, options.random));
        return { accepted: true, transition: "review", rating, reviewCount: review.length };
      }
    }

    complete(session, options.completedAt);
    return { accepted: true, transition: "summary", rating };
  }

  function repeatUnresolved(session, random = Math.random) {
    const unresolved = unresolvedItems(session);
    if (!unresolved.length) return false;
    return beginReview(session, fisherYates(unresolved, random));
  }

  function summary(session) {
    const ratings = Object.values(session?.initialRatings || {}).map(normalizeRating).filter(Boolean);
    const counts = Object.fromEntries(RATINGS.map(rating => [rating, ratings.filter(value => value === rating).length]));
    const unresolved = unresolvedItems(session);
    return {
      total: session?.initialDeck?.length || 0,
      known: counts.known || 0,
      unsure: counts.unsure || 0,
      unknown: counts.unknown || 0,
      reviewed: Object.keys(session?.latestRatings || {}).filter(key => normalizeRating(session?.initialRatings?.[key]) !== "known").length,
      unresolved: unresolved.length,
      reviewRounds: Math.max(0, Number(session?.reviewRound) || 0),
      startedAt: session?.startedAt || null,
      completedAt: session?.completedAt || null
    };
  }

  function sanitizeLearningState(source, options = {}) {
    const validKeys = options.validKeys instanceof Set ? options.validKeys : null;
    const reviewByKey = new Map();
    (Array.isArray(source?.review) ? source.review : []).forEach(entry => {
      const parsed = parseCardKey(entry?.key || `${entry?.kind || ""}:${entry?.id ?? ""}`);
      const rating = normalizeRating(entry?.rating);
      if (!parsed || rating === "known" || !rating || (validKeys && !validKeys.has(parsed.key))) return;
      const updated = new Date(entry?.updatedAt || "");
      const updatedAt = Number.isNaN(updated.getTime()) ? new Date().toISOString() : updated.toISOString();
      const previous = reviewByKey.get(parsed.key);
      if (!previous || new Date(previous.updatedAt).getTime() <= new Date(updatedAt).getTime()) reviewByKey.set(parsed.key, { ...parsed, rating, updatedAt });
    });
    const history = (Array.isArray(source?.history) ? source.history : []).filter(entry => entry && typeof entry === "object").map(entry => ({
      id: String(entry.id || `cards-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      at: new Date(entry.at || "").toString() === "Invalid Date" ? new Date().toISOString() : new Date(entry.at).toISOString(),
      kind: normalizeKind(entry.kind),
      sourceId: String(entry.sourceId || "all"),
      total: Math.max(0, Number(entry.total) || 0),
      known: Math.max(0, Number(entry.known) || 0),
      unsure: Math.max(0, Number(entry.unsure) || 0),
      unknown: Math.max(0, Number(entry.unknown) || 0),
      unresolved: Math.max(0, Number(entry.unresolved) || 0),
      reviewRounds: Math.max(0, Number(entry.reviewRounds) || 0)
    })).slice(-HISTORY_LIMIT);
    return { review: [...reviewByKey.values()], history };
  }

  function applySessionToLearningState(source, session, options = {}) {
    const state = sanitizeLearningState(source, options);
    const now = options.now || session?.completedAt || new Date().toISOString();
    const sessionKeys = new Set((session?.initialDeck || []).map(item => cardKey(session.kind, item)).filter(Boolean));
    const review = state.review.filter(entry => !sessionKeys.has(entry.key));
    unresolvedItems(session).forEach(item => {
      const parsed = parseCardKey(cardKey(session.kind, item));
      if (!parsed) return;
      const rating = normalizeRating(session.latestRatings?.[parsed.key] || session.initialRatings?.[parsed.key]);
      if (rating && rating !== "known") review.push({ ...parsed, rating, updatedAt: now });
    });
    const result = summary(session);
    const historyEntry = {
      id: String(session?.id || `cards-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      at: now,
      kind: normalizeKind(session?.kind),
      sourceId: String(session?.sourceId || "all"),
      total: result.total,
      known: result.known,
      unsure: result.unsure,
      unknown: result.unknown,
      unresolved: result.unresolved,
      reviewRounds: result.reviewRounds
    };
    return sanitizeLearningState({ review, history: [...state.history.filter(entry => entry.id !== historyEntry.id), historyEntry] }, options);
  }

  function swipeAction(startX, endX, threshold = 54) {
    const delta = Number(endX) - Number(startX);
    if (!Number.isFinite(delta) || Math.abs(delta) < Math.max(20, Number(threshold) || 54)) return null;
    return delta < 0 ? "next" : "previous";
  }

  return Object.freeze({
    KINDS,
    COUNT_OPTIONS,
    RATINGS,
    normalizeKind,
    normalizeCount,
    normalizeRating,
    itemId,
    cardKey,
    parseCardKey,
    fisherYates,
    select,
    createSession,
    current,
    move,
    reveal,
    reshuffle,
    progress,
    ratingFor,
    unresolvedItems,
    rateCurrent,
    repeatUnresolved,
    summary,
    sanitizeLearningState,
    applySessionToLearningState,
    swipeAction
  });
});
