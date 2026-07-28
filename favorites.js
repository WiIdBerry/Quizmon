(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonFavorites = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const POKEMON_SORTS = Object.freeze(["recent", "name", "number"]);
  const TYPE_SORTS = Object.freeze(["recent", "name"]);

  function validIso(value, fallback) {
    const date = new Date(value || "");
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
  }

  function uniqueEntries(source, keyName, validValues, now) {
    const allowed = validValues instanceof Set ? validValues : new Set(validValues || []);
    const seen = new Set();
    const result = [];
    (Array.isArray(source) ? source : []).forEach((entry, index) => {
      const raw = entry && typeof entry === "object" ? entry[keyName] : entry;
      const key = keyName === "id" ? Number(raw) : String(raw || "");
      if (!allowed.has(key) || seen.has(key)) return;
      seen.add(key);
      const addedAt = entry && typeof entry === "object" ? validIso(entry.addedAt, now) : now;
      result.push({ [keyName]: key, addedAt, order: index });
    });
    return result.map(({ order, ...entry }) => entry);
  }

  function ensureEntry(entries, keyName, value, validValues, now) {
    const allowed = validValues instanceof Set ? validValues : new Set(validValues || []);
    const key = keyName === "id" ? Number(value) : String(value || "");
    if (!allowed.has(key) || entries.some(entry => entry[keyName] === key)) return entries;
    return [...entries, { [keyName]: key, addedAt: now }];
  }

  function sanitize(source, options = {}) {
    const now = validIso(options.now, new Date().toISOString());
    const pokemonIds = options.pokemonIds instanceof Set ? options.pokemonIds : new Set(options.pokemonIds || []);
    const types = options.types instanceof Set ? options.types : new Set(options.types || []);
    let pokemon = uniqueEntries(source?.pokemon, "id", pokemonIds, now);
    let typeEntries = uniqueEntries(source?.types, "type", types, now);
    pokemon = ensureEntry(pokemon, "id", options.highlightedPokemonId, pokemonIds, now);
    typeEntries = ensureEntry(typeEntries, "type", options.highlightedType, types, now);
    return {
      pokemon,
      types: typeEntries,
      sortPokemon: POKEMON_SORTS.includes(source?.sortPokemon) ? source.sortPokemon : "recent",
      sortTypes: TYPE_SORTS.includes(source?.sortTypes) ? source.sortTypes : "recent"
    };
  }

  function toggle(entries, keyName, value, addedAt = new Date().toISOString()) {
    const key = keyName === "id" ? Number(value) : String(value || "");
    const current = Array.isArray(entries) ? entries : [];
    if (current.some(entry => entry[keyName] === key)) return current.filter(entry => entry[keyName] !== key);
    return [...current, { [keyName]: key, addedAt: validIso(addedAt, new Date().toISOString()) }];
  }

  function isFavorite(entries, keyName, value) {
    const key = keyName === "id" ? Number(value) : String(value || "");
    return (Array.isArray(entries) ? entries : []).some(entry => entry[keyName] === key);
  }

  function sortPokemon(entries, catalogById, language = "de", mode = "recent") {
    const locale = language === "de" ? "de-DE" : "en-GB";
    const rows = (entries || []).map(entry => ({ ...entry, item: catalogById.get(Number(entry.id)) })).filter(row => row.item);
    if (mode === "number") return rows.sort((a, b) => Number(a.id) - Number(b.id));
    if (mode === "name") return rows.sort((a, b) => {
      const left = a.item.names?.[language] || a.item.names?.en || String(a.id);
      const right = b.item.names?.[language] || b.item.names?.en || String(b.id);
      return left.localeCompare(right, locale, { sensitivity: "base" });
    });
    return rows.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime() || Number(a.id) - Number(b.id));
  }

  function sortTypes(entries, labels, language = "de", mode = "recent") {
    const locale = language === "de" ? "de-DE" : "en-GB";
    const rows = [...(entries || [])];
    if (mode === "name") return rows.sort((a, b) => String(labels[a.type] || a.type).localeCompare(String(labels[b.type] || b.type), locale, { sensitivity: "base" }));
    return rows.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime() || String(a.type).localeCompare(String(b.type)));
  }

  return Object.freeze({ POKEMON_SORTS, TYPE_SORTS, sanitize, toggle, isFavorite, sortPokemon, sortTypes });
});
