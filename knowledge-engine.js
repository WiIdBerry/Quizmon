(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonKnowledge = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const REGION_KEYS = Object.freeze({
    1: "kanto", 2: "johto", 3: "hoenn", 4: "sinnoh", 5: "unova",
    6: "kalos", 7: "alola", 8: "galar", 9: "paldea"
  });
  const STAT_KEYS = Object.freeze(["hp", "attack", "defense", "spAttack", "spDefense", "speed"]);

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase()
      .replace(/[♀]/g, " f ")
      .replace(/[♂]/g, " m ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function name(item, language = "de") {
    if (!item) return "";
    return item[language === "en" ? "en" : "de"] || item.en || item.de || item.slug || "";
  }

  function effect(item, language = "de") {
    if (!item) return "";
    const key = language === "en" ? "en" : "de";
    return item.effect?.[key] || item.effect?.en || item.effect?.de || "";
  }

  function regionKey(generation) { return REGION_KEYS[Number(generation)] || "unknown"; }

  function baseStatTotal(item) {
    return STAT_KEYS.reduce((sum, key) => sum + Math.max(0, Number(item?.stats?.[key]) || 0), 0);
  }

  function abilityNames(item, language = "de") {
    return (item?.abilities || []).map(ability => ability[language === "en" ? "en" : "de"] || ability.en || ability.de).filter(Boolean);
  }

  function evolutionItems(item, byId) {
    if (!item || !byId) return [];
    return (item.evolutionIds || []).map(id => byId.get(Number(id))).filter(Boolean);
  }

  function evolutionTree(item, byId, methods = {}) {
    const items = evolutionItems(item, byId);
    if (!items.length) return { roots: [], size: 0 };
    const order = new Map(items.map((entry, index) => [entry.id, index]));
    const nodes = new Map(items.map(entry => [entry.id, { item: entry, methods: methods?.[entry.id] || methods?.[String(entry.id)] || [], children: [] }]));
    const roots = [];
    for (const entry of items) {
      const node = nodes.get(entry.id);
      const parentId = Number(entry.evolvesFrom) || null;
      const parent = parentId && parentId !== entry.id ? nodes.get(parentId) : null;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    const sortNodes = list => {
      list.sort((left, right) => (order.get(left.item.id) ?? 0) - (order.get(right.item.id) ?? 0));
      list.forEach(node => sortNodes(node.children));
    };
    sortNodes(roots);
    return { roots, size: items.length };
  }

  function evolutionFamilies(items) {
    const source = Array.isArray(items) ? items : [];
    const byId = new Map(source.map(item => [item.id, item]));
    const seen = new Set();
    const families = [];
    for (const item of source) {
      const ids = [...new Set(item.evolutionIds || [item.id])].filter(id => byId.has(id));
      if (ids.length <= 1) continue;
      const signature = ids.join("-");
      if (seen.has(signature)) continue;
      seen.add(signature);
      const members = ids.map(id => byId.get(id));
      const memberIds = new Set(ids);
      const rootItem = members.find(member => !member.evolvesFrom || !memberIds.has(member.evolvesFrom)) || members[0];
      const generations = [...new Set(members.map(member => Number(member.generation)).filter(Number.isInteger))].sort((a, b) => a - b);
      families.push({ id: rootItem.id, root: rootItem, members, size: members.length, generation: rootItem.generation, generations });
    }
    return families.sort((a, b) => a.id - b.id);
  }

  function itemSearchText(item) {
    return normalizeText([
      item?.id, item?.slug, item?.de, item?.en,
      ...(item?.types || []), ...abilityNames(item, "de"), ...abilityNames(item, "en"),
      item?.type, item?.damageClass, item?.category, item?.pocket,
      effect(item, "de"), effect(item, "en"), regionKey(item?.generation)
    ].join(" "));
  }

  function listEntries(items, options = {}) {
    const source = Array.isArray(items) ? items : [];
    const query = normalizeText(options.query);
    const generation = options.generation === "all" || options.generation == null ? null : Number(options.generation);
    const type = options.type || null;
    const category = options.category || null;
    const filtered = source.filter(item => {
      if (generation && item.generation !== generation) return false;
      if (type && item.type !== type && !(item.types || []).includes(type)) return false;
      if (category && item.category !== category && String(item.pocket) !== String(category)) return false;
      if (query && !itemSearchText(item).includes(query)) return false;
      return true;
    });
    const offset = Math.max(0, Number(options.offset) || 0);
    const limit = Math.max(1, Number(options.limit) || filtered.length || 1);
    return { total: filtered.length, items: filtered.slice(offset, offset + limit) };
  }

  function listPokemon(items, options = {}) { return listEntries(items, options); }

  function validatePokemon(items) {
    const errors = [];
    const ids = new Set();
    for (const item of Array.isArray(items) ? items : []) {
      if (!Number.isInteger(item?.id) || item.id < 1) errors.push(`invalid-id:${item?.id}`);
      if (ids.has(item.id)) errors.push(`duplicate-id:${item.id}`);
      ids.add(item.id);
      if (!item.de || !item.en) errors.push(`missing-name:${item.id}`);
      if (!Array.isArray(item.types) || item.types.length < 1 || item.types.length > 2) errors.push(`invalid-types:${item.id}`);
      if (!Number.isInteger(item.generation) || item.generation < 1 || item.generation > 9) errors.push(`invalid-generation:${item.id}`);
      for (const key of STAT_KEYS) if (!Number.isFinite(item?.stats?.[key])) errors.push(`missing-stat:${item.id}:${key}`);
      for (const evolutionId of item.evolutionIds || []) if (!Number.isInteger(evolutionId)) errors.push(`invalid-evolution:${item.id}`);
    }
    return errors;
  }

  function validateContent(abilities, moves, items) {
    const errors = [];
    const checkBase = (entries, kind) => {
      const ids = new Set();
      for (const item of entries || []) {
        if (!Number.isInteger(item.id) || item.id < 1) errors.push(`${kind}:invalid-id:${item.id}`);
        if (ids.has(item.id)) errors.push(`${kind}:duplicate-id:${item.id}`);
        ids.add(item.id);
        if (!item.de || !item.en) errors.push(`${kind}:missing-name:${item.id}`);
        if (!Number.isInteger(item.generation) || item.generation < 1 || item.generation > 9) errors.push(`${kind}:invalid-generation:${item.id}`);
        if (!effect(item, "de") || !effect(item, "en")) errors.push(`${kind}:missing-effect:${item.id}`);
      }
    };
    checkBase(abilities, "ability");
    checkBase(moves, "move");
    checkBase(items, "item");
    for (const move of moves || []) {
      if (!move.type || !move.damageClass) errors.push(`move:invalid-battle-data:${move.id}`);
    }
    return errors;
  }

  return Object.freeze({
    REGION_KEYS, STAT_KEYS, normalizeText, name, effect, regionKey, baseStatTotal,
    abilityNames, evolutionItems, evolutionTree, evolutionFamilies, itemSearchText,
    listEntries, listPokemon, validatePokemon, validateContent
  });
});
