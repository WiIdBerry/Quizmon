(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.QuizmonSpeedrun = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DURATIONS = Object.freeze([30, 60, 90]);
  const MODES = Object.freeze(["effectiveness", "multiplier", "impact", "pokemon"]);
  const HISTORY_LIMIT = 60;

  function finiteNonNegative(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
  }

  function normalizeDuration(value) {
    const duration = Number(value);
    return DURATIONS.includes(duration) ? duration : 0;
  }

  function blankRecord() {
    return {
      runs: 0,
      bestCorrect: 0,
      bestAnswered: 0,
      bestAccuracy: 0,
      achievedAt: null,
      lastCorrect: 0,
      lastAnswered: 0,
      lastAccuracy: 0
    };
  }

  function sanitizeDate(value) {
    const date = new Date(value || "");
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function sanitizeRecord(value) {
    const source = value && typeof value === "object" ? value : {};
    const bestAnswered = finiteNonNegative(source.bestAnswered);
    const bestCorrect = Math.min(bestAnswered, finiteNonNegative(source.bestCorrect));
    const lastAnswered = finiteNonNegative(source.lastAnswered);
    const lastCorrect = Math.min(lastAnswered, finiteNonNegative(source.lastCorrect));
    return {
      runs: finiteNonNegative(source.runs),
      bestCorrect,
      bestAnswered,
      bestAccuracy: Math.min(100, finiteNonNegative(source.bestAccuracy)),
      achievedAt: sanitizeDate(source.achievedAt),
      lastCorrect,
      lastAnswered,
      lastAccuracy: Math.min(100, finiteNonNegative(source.lastAccuracy))
    };
  }

  function blankStatistics() {
    return {
      modes: Object.fromEntries(MODES.map(mode => [mode, Object.fromEntries(DURATIONS.map(duration => [String(duration), blankRecord()]))])),
      history: []
    };
  }

  function sanitizeHistoryItem(value) {
    if (!value || typeof value !== "object" || !MODES.includes(value.mode)) return null;
    const duration = normalizeDuration(value.duration);
    const date = sanitizeDate(value.date);
    if (!duration || !date) return null;
    const answers = finiteNonNegative(value.answers);
    const correct = Math.min(answers, finiteNonNegative(value.correct));
    return {
      id: typeof value.id === "string" && value.id.length <= 100 ? value.id : `speedrun-${new Date(date).getTime()}`,
      date,
      mode: value.mode,
      duration,
      answers,
      correct,
      wrong: Math.max(0, answers - correct),
      accuracy: answers ? Math.round((correct / answers) * 100) : 0,
      newBest: Boolean(value.newBest)
    };
  }

  function sanitizeStatistics(value) {
    const source = value && typeof value === "object" ? value : {};
    const output = blankStatistics();
    MODES.forEach(mode => DURATIONS.forEach(duration => {
      output.modes[mode][String(duration)] = sanitizeRecord(source.modes?.[mode]?.[String(duration)]);
    }));
    const history = (Array.isArray(source.history) ? source.history : []).map(sanitizeHistoryItem).filter(Boolean);
    const seen = new Set();
    output.history = history.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, HISTORY_LIMIT);
    return output;
  }

  function bestFor(statistics, mode, duration) {
    const safe = sanitizeStatistics(statistics);
    const seconds = normalizeDuration(duration);
    if (!MODES.includes(mode) || !seconds) return blankRecord();
    return safe.modes[mode][String(seconds)];
  }

  function isBetterRun(run, record) {
    if (!record.runs) return true;
    if (run.correct !== record.bestCorrect) return run.correct > record.bestCorrect;
    return run.accuracy > record.bestAccuracy;
  }

  function recordRun(statistics, value) {
    const safe = sanitizeStatistics(statistics);
    const mode = MODES.includes(value?.mode) ? value.mode : null;
    const duration = normalizeDuration(value?.duration);
    if (!mode || !duration) return { statistics: safe, record: blankRecord(), previous: blankRecord(), newBest: false, historyItem: null };
    const answers = finiteNonNegative(value.answers);
    const correct = Math.min(answers, finiteNonNegative(value.correct));
    const accuracy = answers ? Math.round((correct / answers) * 100) : 0;
    const previous = { ...safe.modes[mode][String(duration)] };
    const newBest = isBetterRun({ correct, accuracy }, previous);
    const date = sanitizeDate(value.date) || new Date().toISOString();
    const record = {
      ...previous,
      runs: previous.runs + 1,
      lastCorrect: correct,
      lastAnswered: answers,
      lastAccuracy: accuracy
    };
    if (newBest) {
      record.bestCorrect = correct;
      record.bestAnswered = answers;
      record.bestAccuracy = accuracy;
      record.achievedAt = date;
    }
    safe.modes[mode][String(duration)] = record;
    const historyItem = sanitizeHistoryItem({
      id: typeof value.id === "string" ? value.id : `speedrun-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date,
      mode,
      duration,
      answers,
      correct,
      newBest
    });
    safe.history = [historyItem, ...safe.history.filter(item => item.id !== historyItem.id)].slice(0, HISTORY_LIMIT);
    return { statistics: safe, record: { ...record }, previous, newBest, historyItem };
  }

  function remainingMs(deadlineAt, now = Date.now()) {
    const deadline = Number(deadlineAt);
    return Number.isFinite(deadline) ? Math.max(0, deadline - Number(now || 0)) : 0;
  }

  function remainingSeconds(deadlineAt, now = Date.now()) {
    return Math.max(0, Math.ceil(remainingMs(deadlineAt, now) / 1000));
  }

  return Object.freeze({
    DURATIONS,
    MODES,
    HISTORY_LIMIT,
    normalizeDuration,
    blankRecord,
    blankStatistics,
    sanitizeRecord,
    sanitizeStatistics,
    bestFor,
    isBetterRun,
    recordRun,
    remainingMs,
    remainingSeconds
  });
});
