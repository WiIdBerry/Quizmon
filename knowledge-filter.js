(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonKnowledgeFilter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const GENERATIONS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const UNFILTERED_KINDS = new Set(["type", "competitive"]);

  function normalizeGeneration(value) {
    if (value === "all" || value == null || value === "") return null;
    const generation = Number(value);
    return GENERATIONS.includes(generation) ? generation : null;
  }

  function uniqueGenerations(values) {
    return Object.freeze([...new Set((values || []).map(Number).filter(value => GENERATIONS.includes(value)))].sort((a, b) => a - b));
  }

  function generationsFor(kind, item, context = {}) {
    if (!item || UNFILTERED_KINDS.has(kind)) return Object.freeze([]);
    if (kind === "evolution") {
      if (Array.isArray(item.generations)) return uniqueGenerations(item.generations);
      return uniqueGenerations((item.members || []).map(member => member?.generation));
    }
    if (kind === "trainer") {
      const region = context.regionById?.get?.(String(item.region)) || context.regionById?.(item.region) || null;
      return uniqueGenerations([region?.generation]);
    }
    if (Array.isArray(item.generations)) return uniqueGenerations(item.generations);
    return uniqueGenerations([item.generation]);
  }

  function matches(kind, item, generation, context = {}) {
    const selected = normalizeGeneration(generation);
    if (!selected || UNFILTERED_KINDS.has(kind)) return true;
    return generationsFor(kind, item, context).includes(selected);
  }

  function filter(kind, items, generation, context = {}) {
    const source = Array.isArray(items) ? items : [];
    return source.filter(item => matches(kind, item, generation, context));
  }

  function searchEntryMatches(entry, generation) {
    const selected = normalizeGeneration(generation);
    if (!selected || !entry || UNFILTERED_KINDS.has(entry.kind)) return true;
    return uniqueGenerations(entry.generations).includes(selected);
  }

  return Object.freeze({
    GENERATIONS,
    UNFILTERED_KINDS,
    normalizeGeneration,
    uniqueGenerations,
    generationsFor,
    matches,
    filter,
    searchEntryMatches
  });
});
