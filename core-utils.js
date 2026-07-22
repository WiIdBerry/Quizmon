(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function unique(items) { return [...new Set((items || []).filter(Boolean))]; }
  function finiteNonNegative(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  }
  function shuffle(items, random = Math.random) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function randomItem(items, random = Math.random) { return items[Math.floor(random() * items.length)]; }
  function effectiveness(typeChart, attackingType, defendingTypes) {
    return defendingTypes.reduce((value, defendingType) => value * (typeChart[attackingType]?.[defendingType] ?? 1), 1);
  }
  function percent(correct, total) { return total ? Math.round((correct / total) * 100) : 0; }
  function formatMultiplier(value) { return value === .25 ? "¼×" : value === .5 ? "½×" : `${value}×`; }
  function sanitizePokemonCache(cache, types, limit = 160) {
    if (!cache || typeof cache !== "object" || Array.isArray(cache)) return {};
    const entries = Object.entries(cache).slice(-limit).filter(([, item]) => {
      if (!item || typeof item !== "object") return false;
      const id = Number(item.id);
      return Number.isInteger(id) && id > 0 && typeof item.name === "string"
        && Array.isArray(item.types) && item.types.length > 0 && item.types.every(type => types.includes(type))
        && typeof item.image === "string";
    });
    return Object.fromEntries(entries);
  }
  return Object.freeze({ clone, unique, finiteNonNegative, shuffle, randomItem, effectiveness, percent, formatMultiplier, sanitizePokemonCache });
});
