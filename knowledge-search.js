(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonKnowledgeSearch = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const KIND_ORDER = Object.freeze([
    "type", "pokemon", "move", "ability", "item",
    "evolution", "region", "trainer", "competitive"
  ]);
  const KIND_PRIORITY = Object.freeze(Object.fromEntries(KIND_ORDER.map((kind, index) => [kind, index])));

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[♀]/g, " f ")
      .replace(/[♂]/g, " m ")
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function localText(value, language) {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    const key = language === "en" ? "en" : "de";
    return value[key] || value.en || value.de || "";
  }

  function textList(value, language) {
    if (!value) return [];
    const source = Array.isArray(value) ? value : value[language === "en" ? "en" : "de"] || value.en || value.de || [];
    return (Array.isArray(source) ? source : [source]).map(String).filter(Boolean);
  }

  function makeEntry(kind, id, de, en, deParts = [], enParts = [], sharedParts = [], generations = []) {
    const paddedId = Number.isInteger(Number(id)) ? String(Number(id)).padStart(4, "0") : String(id || "");
    const deName = String(de || en || id || "");
    const enName = String(en || de || id || "");
    const shared = [id, paddedId, ...sharedParts].filter(value => value != null && value !== "").join(" ");
    const deText = normalize([deName, ...deParts, shared].join(" "));
    const enText = normalize([enName, ...enParts, shared].join(" "));
    return Object.freeze({
      kind,
      id,
      de: deName,
      en: enName,
      nameDe: normalize(deName),
      nameEn: normalize(enName),
      textDe: deText,
      textEn: enText,
      textAll: `${deText} ${enText}`.trim(),
      generations: Object.freeze([...new Set((generations || []).map(Number).filter(value => Number.isInteger(value) && value >= 1 && value <= 9))].sort((a, b) => a - b))
    });
  }

  function buildIndex(sources = {}) {
    const pokemon = Array.isArray(sources.pokemon) ? sources.pokemon : [];
    const pokemonById = new Map(pokemon.map(item => [Number(item.id), item]));
    const regionById = new Map((sources.regions || []).map(item => [String(item.id), item]));
    const entries = [];

    for (const type of sources.types || []) {
      entries.push(makeEntry("type", type.id, type.de, type.en, type.aliasesDe || [], type.aliasesEn || [], [type.id], []));
    }

    for (const item of pokemon) {
      const abilityDe = (item.abilities || []).map(ability => ability.de || ability.en).filter(Boolean);
      const abilityEn = (item.abilities || []).map(ability => ability.en || ability.de).filter(Boolean);
      entries.push(makeEntry(
        "pokemon", item.id, item.de, item.en,
        [item.slug, ...abilityDe], [item.slug, ...abilityEn],
        [...(item.types || []), item.generation, `generation ${item.generation}`],
        [item.generation]
      ));
    }

    for (const item of sources.moves || []) {
      entries.push(makeEntry(
        "move", item.id, item.de, item.en,
        [item.slug, localText(item.effect, "de")], [item.slug, localText(item.effect, "en")],
        [item.type, item.damageClass, item.generation],
        [item.generation]
      ));
    }

    for (const item of sources.abilities || []) {
      const linkedDe = (item.pokemonIds || []).map(id => pokemonById.get(Number(id))?.de).filter(Boolean);
      const linkedEn = (item.pokemonIds || []).map(id => pokemonById.get(Number(id))?.en).filter(Boolean);
      entries.push(makeEntry(
        "ability", item.id, item.de, item.en,
        [item.slug, localText(item.effect, "de"), ...linkedDe],
        [item.slug, localText(item.effect, "en"), ...linkedEn],
        [item.generation],
        [item.generation]
      ));
    }

    for (const item of sources.items || []) {
      entries.push(makeEntry(
        "item", item.id, item.de, item.en,
        [item.slug, localText(item.effect, "de")], [item.slug, localText(item.effect, "en")],
        [item.category, item.pocket, item.generation],
        [item.generation]
      ));
    }

    for (const family of sources.evolutions || []) {
      const members = family.members || [];
      const rootItem = family.root || members[0] || {};
      entries.push(makeEntry(
        "evolution", family.id, rootItem.de, rootItem.en,
        members.map(member => member.de).filter(Boolean),
        members.map(member => member.en).filter(Boolean),
        [family.generation, family.size],
        family.generations || members.map(member => member.generation)
      ));
    }

    for (const region of sources.regions || []) {
      entries.push(makeEntry(
        "region", region.id, region.de, region.en,
        [localText(region.league, "de"), localText(region.summary, "de"), ...(region.locations || []).map(value => localText(value, "de")), ...textList(region.traits, "de")],
        [localText(region.league, "en"), localText(region.summary, "en"), ...(region.locations || []).map(value => localText(value, "en")), ...textList(region.traits, "en")],
        [region.generation],
        [region.generation]
      ));
    }

    for (const trainer of sources.trainers || []) {
      const region = regionById.get(String(trainer.region));
      const teamDe = (trainer.pokemonTeam || []).map(entry => pokemonById.get(Number(entry.id))?.de).filter(Boolean);
      const teamEn = (trainer.pokemonTeam || []).map(entry => pokemonById.get(Number(entry.id))?.en).filter(Boolean);
      entries.push(makeEntry(
        "trainer", trainer.id, trainer.de, trainer.en,
        [localText(trainer.location, "de"), region?.de, localText(trainer.teamSource, "de"), ...teamDe],
        [localText(trainer.location, "en"), region?.en, localText(trainer.teamSource, "en"), ...teamEn],
        [...(trainer.roles || []), ...(trainer.types || []), trainer.order],
        [region?.generation]
      ));
    }

    for (const topic of sources.competitive || []) {
      entries.push(makeEntry(
        "competitive", topic.id, topic.de, topic.en,
        [localText(topic.summary, "de"), localText(topic.why, "de"), localText(topic.example, "de"), ...textList(topic.steps, "de")],
        [localText(topic.summary, "en"), localText(topic.why, "en"), localText(topic.example, "en"), ...textList(topic.steps, "en")],
        [topic.group, ...(topic.related || [])],
        []
      ));
    }

    return Object.freeze(entries);
  }

  function nameScore(entry, query, language) {
    const primary = language === "en" ? entry.nameEn : entry.nameDe;
    const secondary = language === "en" ? entry.nameDe : entry.nameEn;
    const wordStarts = (value) => value.split(" ").some(word => word.startsWith(query));
    if (primary === query) return 0;
    if (primary.startsWith(query)) return 10;
    if (wordStarts(primary)) return 20;
    if (primary.includes(query)) return 30;
    if (secondary === query) return 40;
    if (secondary.startsWith(query)) return 50;
    if (wordStarts(secondary)) return 60;
    if (secondary.includes(query)) return 70;
    return 100;
  }

  function editDistanceWithin(left, right, maximum) {
    const a = String(left || "");
    const b = String(right || "");
    const max = Math.max(0, Number(maximum) || 0);
    if (Math.abs(a.length - b.length) > max) return max + 1;
    if (a === b) return 0;
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let row = 1; row <= a.length; row += 1) {
      const current = [row];
      let rowMinimum = current[0];
      for (let column = 1; column <= b.length; column += 1) {
        const cost = a[row - 1] === b[column - 1] ? 0 : 1;
        const value = Math.min(
          previous[column] + 1,
          current[column - 1] + 1,
          previous[column - 1] + cost
        );
        current[column] = value;
        rowMinimum = Math.min(rowMinimum, value);
      }
      if (rowMinimum > max) return max + 1;
      previous = current;
    }
    return previous[b.length];
  }

  function fuzzyNameScore(entry, query, language) {
    if (query.length < 4 || query.includes(" ")) return null;
    const maximum = query.length >= 8 ? 2 : 1;
    const primary = language === "en" ? entry.nameEn : entry.nameDe;
    const secondary = language === "en" ? entry.nameDe : entry.nameEn;
    const candidates = [
      ...primary.split(" ").map(value => ({ value, score: 82 })),
      ...secondary.split(" ").map(value => ({ value, score: 92 }))
    ].filter(candidate => candidate.value.length >= 3);
    let best = null;
    for (const candidate of candidates) {
      const distance = editDistanceWithin(candidate.value, query, maximum);
      if (distance > maximum) continue;
      const score = candidate.score + distance * 4;
      if (best == null || score < best) best = score;
    }
    return best;
  }

  function search(index, query, options = {}) {
    const normalizedQuery = normalize(query);
    const language = options.language === "en" ? "en" : "de";
    const perKind = Math.max(1, Number(options.perKind) || 8);
    const limit = Math.max(1, Number(options.limit) || (KIND_ORDER.length * perKind));
    const offset = Math.max(0, Number(options.offset) || 0);
    const kind = KIND_ORDER.includes(options.kind) ? options.kind : null;
    const generation = Number.isInteger(Number(options.generation)) && Number(options.generation) >= 1 && Number(options.generation) <= 9 ? Number(options.generation) : null;
    const flat = Boolean(options.flat);
    const allowFuzzy = options.fuzzy !== false;
    if (!normalizedQuery) return { query: "", total: 0, allTotal: 0, counts: {}, items: [], fuzzy: false };
    const tokens = normalizedQuery.split(" ").filter(Boolean);
    const source = Array.isArray(index) ? index : [];
    const matches = [];
    for (const entry of source) {
      if (generation && entry.generations.length && !entry.generations.includes(generation)) continue;
      if (!tokens.every(token => entry.textAll.includes(token))) continue;
      const score = nameScore(entry, normalizedQuery, language) * 100 + (KIND_PRIORITY[entry.kind] ?? 99);
      matches.push({ entry, score, fuzzy: false });
    }
    if (!matches.length && allowFuzzy && tokens.length === 1) {
      for (const entry of source) {
        if (generation && entry.generations.length && !entry.generations.includes(generation)) continue;
        const fuzzyScore = fuzzyNameScore(entry, normalizedQuery, language);
        if (fuzzyScore == null) continue;
        const score = fuzzyScore * 100 + (KIND_PRIORITY[entry.kind] ?? 99);
        matches.push({ entry, score, fuzzy: true });
      }
    }
    matches.sort((left, right) => left.score - right.score ||
      (language === "en" ? left.entry.en : left.entry.de).localeCompare(language === "en" ? right.entry.en : right.entry.de, language, { sensitivity: "base" }));

    const counts = {};
    for (const match of matches) counts[match.entry.kind] = (counts[match.entry.kind] || 0) + 1;
    const relevant = kind ? matches.filter(match => match.entry.kind === kind) : matches;
    const selected = [];
    if (flat) {
      for (const match of relevant.slice(offset, offset + limit)) {
        selected.push(Object.freeze({ ...match.entry, score: match.score, fuzzy: match.fuzzy }));
      }
    } else {
      for (const currentKind of KIND_ORDER) {
        const group = relevant.filter(match => match.entry.kind === currentKind).slice(0, perKind);
        for (const match of group) {
          if (selected.length >= limit) break;
          selected.push(Object.freeze({ ...match.entry, score: match.score, fuzzy: match.fuzzy }));
        }
        if (selected.length >= limit) break;
      }
    }
    return {
      query: normalizedQuery,
      total: relevant.length,
      allTotal: matches.length,
      counts: Object.freeze(counts),
      items: Object.freeze(selected),
      fuzzy: relevant.some(match => match.fuzzy)
    };
  }

  return Object.freeze({ KIND_ORDER, normalize, buildIndex, search, editDistanceWithin });
});
