(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonTrainingLists = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const KINDS = Object.freeze(["types", "pokemon"]);
  const MAX_LISTS = 40;
  const MAX_NAME_LENGTH = 40;

  function validIso(value, fallback = new Date().toISOString()) {
    const date = new Date(value || "");
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
  }

  function cleanName(value, fallback = "Training list") {
    const name = String(value || "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
    return name || fallback;
  }

  function normalizeId(value, fallback) {
    const id = String(value || "").trim();
    return /^[a-zA-Z0-9_-]{1,80}$/.test(id) ? id : fallback;
  }

  function allowedEntries(kind, options) {
    return kind === "pokemon"
      ? (options.pokemonIds instanceof Set ? options.pokemonIds : new Set(options.pokemonIds || []))
      : (options.types instanceof Set ? options.types : new Set(options.types || []));
  }

  function sanitizeEntries(entries, kind, options) {
    const allowed = allowedEntries(kind, options);
    const seen = new Set();
    return (Array.isArray(entries) ? entries : []).reduce((result, raw) => {
      const value = kind === "pokemon" ? Number(raw) : String(raw || "");
      if (!allowed.has(value) || seen.has(value)) return result;
      seen.add(value);
      result.push(value);
      return result;
    }, []);
  }

  function sanitize(source, options = {}) {
    const now = validIso(options.now);
    const ids = new Set();
    const lists = [];
    (Array.isArray(source?.lists) ? source.lists : []).slice(0, MAX_LISTS).forEach((raw, index) => {
      const kind = KINDS.includes(raw?.kind) ? raw.kind : null;
      if (!kind) return;
      let id = normalizeId(raw?.id, `list-${index + 1}`);
      while (ids.has(id)) id = `${id}-${index + 1}`;
      ids.add(id);
      const createdAt = validIso(raw?.createdAt, now);
      const updatedAt = validIso(raw?.updatedAt, createdAt);
      lists.push({
        id,
        kind,
        name: cleanName(raw?.name, options.fallbackName?.(kind, index) || `List ${index + 1}`),
        entries: sanitizeEntries(raw?.entries, kind, options),
        createdAt,
        updatedAt
      });
    });
    return { lists };
  }

  function generateId(prefix = "list") {
    if (typeof globalThis.crypto?.randomUUID === "function") return `${prefix}-${globalThis.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function create(source, { kind, name, entries = [], now = new Date().toISOString(), id = generateId("list") } = {}, options = {}) {
    if (!KINDS.includes(kind)) return sanitize(source, options);
    const state = sanitize(source, options);
    if (state.lists.length >= MAX_LISTS) return state;
    const date = validIso(now);
    const list = {
      id: normalizeId(id, generateId("list")),
      kind,
      name: cleanName(name, kind === "pokemon" ? "Pokémon list" : "Type list"),
      entries: sanitizeEntries(entries, kind, options),
      createdAt: date,
      updatedAt: date
    };
    while (state.lists.some(item => item.id === list.id)) list.id = generateId("list");
    return { lists: [...state.lists, list] };
  }

  function update(source, id, updater, options = {}) {
    const state = sanitize(source, options);
    const date = validIso(options.now);
    return {
      lists: state.lists.map(list => {
        if (list.id !== String(id)) return list;
        const next = typeof updater === "function" ? updater({ ...list, entries: [...list.entries] }) : list;
        return {
          ...list,
          ...next,
          id: list.id,
          kind: list.kind,
          name: cleanName(next?.name, list.name),
          entries: sanitizeEntries(next?.entries, list.kind, options),
          createdAt: list.createdAt,
          updatedAt: date
        };
      })
    };
  }

  function rename(source, id, name, options = {}) {
    return update(source, id, list => ({ ...list, name }), options);
  }

  function addEntry(source, id, value, options = {}) {
    return update(source, id, list => ({ ...list, entries: [...list.entries, value] }), options);
  }

  function removeEntry(source, id, value, options = {}) {
    return update(source, id, list => {
      const normalized = list.kind === "pokemon" ? Number(value) : String(value || "");
      return { ...list, entries: list.entries.filter(entry => entry !== normalized) };
    }, options);
  }

  function moveEntry(source, id, fromIndex, toIndex, options = {}) {
    return update(source, id, list => {
      const from = Number(fromIndex);
      const to = Number(toIndex);
      if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || from >= list.entries.length || to < 0 || to >= list.entries.length || from === to) return list;
      const entries = [...list.entries];
      const [entry] = entries.splice(from, 1);
      entries.splice(to, 0, entry);
      return { ...list, entries };
    }, options);
  }

  function duplicate(source, id, { name, now = new Date().toISOString(), newId = generateId("list") } = {}, options = {}) {
    const state = sanitize(source, options);
    const original = state.lists.find(list => list.id === String(id));
    if (!original || state.lists.length >= MAX_LISTS) return state;
    return create(state, {
      id: newId,
      kind: original.kind,
      name: cleanName(name, `${original.name} copy`),
      entries: original.entries,
      now
    }, options);
  }

  function removeList(source, id, options = {}) {
    const state = sanitize(source, options);
    return { lists: state.lists.filter(list => list.id !== String(id)) };
  }

  function get(source, id) {
    return (Array.isArray(source?.lists) ? source.lists : []).find(list => list.id === String(id)) || null;
  }

  function contains(list, value) {
    if (!list) return false;
    const normalized = list.kind === "pokemon" ? Number(value) : String(value || "");
    return Array.isArray(list.entries) && list.entries.includes(normalized);
  }

  function compatibleModes(kind) {
    return kind === "pokemon" ? ["pokemon"] : ["effectiveness", "multiplier", "impact"];
  }

  function canStart(list) {
    return Boolean(list && KINDS.includes(list.kind) && Array.isArray(list.entries) && list.entries.length >= 2);
  }

  return Object.freeze({
    KINDS, MAX_LISTS, MAX_NAME_LENGTH,
    cleanName, sanitize, create, rename, addEntry, removeEntry, moveEntry, duplicate, removeList, get, contains, compatibleModes, canStart
  });
});
