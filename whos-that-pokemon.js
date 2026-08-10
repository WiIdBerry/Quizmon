(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonWhosThatPokemon = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DIFFICULTIES = Object.freeze(["easy", "medium", "hard"]);
  const MAX_LIVES = 5;
  const HINT_COUNT = 5;
  const STAT_KEYS = Object.freeze(["hp", "attack", "defense", "spAttack", "spDefense", "speed"]);
  const HINT_KINDS = Object.freeze([
    "statSignature", "abilityProfile", "measurements", "originProfile", "defenseProfile",
    "baseTotal", "generation", "dexRange", "strongestStat", "weakestStat", "battleStyle",
    "typeCount", "typeOne", "typeCombo", "matchup", "singleAbility", "evolutionStage",
    "familySize", "evolutionNeighbor", "evolutionMethod", "specialGroup", "heightBand",
    "weightBand", "namePattern", "evolutionGap", "shadow", "pixel", "crop", "cry"
  ]);
  const HINT_KIND_SET = new Set(HINT_KINDS);
  const DAILY_EPOCH = "2026-08-01";

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function unique(items) { return [...new Set((items || []).filter(value => value !== null && value !== undefined))]; }
  function canonical(values) { return [...values].map(String).sort().join("|"); }
  function randomItem(items, random = Math.random) { return items[Math.floor(random() * items.length)]; }
  function hashString(value) {
    let hash = 2166136261;
    for (const character of String(value || "")) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function seededRandom(seed) {
    let value = Number(seed) >>> 0;
    return function () {
      value += 0x6D2B79F5;
      let next = value;
      next = Math.imul(next ^ next >>> 15, next | 1);
      next ^= next + Math.imul(next ^ next >>> 7, next | 61);
      return ((next ^ next >>> 14) >>> 0) / 4294967296;
    };
  }
  function utcDateKey(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }
  function shuffle(items, random = Math.random) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }
  function normalizedName(value) {
    return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase().replace(/[♀]/g, "f").replace(/[♂]/g, "m").replace(/[^a-z0-9]+/g, "");
  }
  function validDifficulty(value) { return DIFFICULTIES.includes(value) ? value : "medium"; }
  function effectiveness(typeChart, attackingType, defendingTypes) {
    return (defendingTypes || []).reduce((value, defender) => value * (typeChart?.[attackingType]?.[defender] ?? 1), 1);
  }
  function statTotal(item) { return STAT_KEYS.reduce((sum, key) => sum + (Number(item?.stats?.[key]) || 0), 0); }
  function statEdge(item, direction) {
    const values = STAT_KEYS.map(key => ({ key, value: Number(item?.stats?.[key]) || 0 }));
    const edge = direction === "min" ? Math.min(...values.map(row => row.value)) : Math.max(...values.map(row => row.value));
    return { value: edge, keys: values.filter(row => row.value === edge).map(row => row.key).sort() };
  }
  function familyIds(item) { return unique((item?.evolutionIds || [item?.id]).map(Number).filter(Number.isInteger)).sort((a, b) => a - b); }
  function familySize(item) { return familyIds(item).length || 1; }
  function evolutionStage(item, context) {
    let stage = 1;
    let current = item;
    const seen = new Set([Number(item?.id)]);
    while (Number.isInteger(Number(current?.evolvesFrom)) && !seen.has(Number(current.evolvesFrom))) {
      const parent = context.byId.get(Number(current.evolvesFrom));
      if (!parent) break;
      stage += 1;
      current = parent;
      seen.add(Number(parent.id));
    }
    return stage;
  }
  function childrenOf(item, context) {
    return context.children.get(Number(item?.id)) || [];
  }
  function methodValue(item, context) {
    const methods = context.evolutionMethods?.[String(item?.id)] || context.evolutionMethods?.[Number(item?.id)] || [];
    const method = Array.isArray(methods) ? methods[0] : null;
    if (!method || !item?.evolvesFrom) return null;
    const trigger = String(method.trigger || "");
    if (trigger === "trade" && method.trade_species_id) return { method: "tradeSpecies", speciesId: Number(method.trade_species_id) };
    if (trigger === "trade" && method.held_item_id) return { method: "tradeHeldItem", itemId: Number(method.held_item_id) };
    if (trigger === "trade") return { method: "trade" };
    if (trigger === "use-item" && method.gender_id) return { method: "itemGender", itemId: Number(method.trigger_item_id) || null, genderId: Number(method.gender_id) };
    if (trigger === "use-item") return { method: "item", itemId: Number(method.trigger_item_id) || null };
    if (trigger === "shed") return { method: "special" };
    if (trigger === "spin") return { method: "spin" };
    if (trigger === "three-critical-hits") return { method: "critical" };
    if (trigger === "take-damage") return { method: "damage" };
    if (trigger === "agile-style-move" || trigger === "strong-style-move") return { method: "moveStyle" };
    if (trigger === "recoil-damage") return { method: "recoil" };
    if (trigger === "other") return { method: "special" };
    if (method.needs_multiplayer) return { method: "multiplayer" };
    if (method.turn_upside_down) return { method: "upsideDown" };
    if (method.minimum_happiness && method.known_move_type_id) return { method: "friendshipMoveType", typeId: Number(method.known_move_type_id) };
    if (method.minimum_happiness && method.time) return { method: "friendshipTime", time: method.time };
    if (method.minimum_happiness) return { method: "friendship" };
    if (method.minimum_affection) return { method: "affection" };
    if (method.minimum_beauty) return { method: "beauty" };
    if (method.known_move_id) return { method: "knownMove", moveId: Number(method.known_move_id) };
    if (method.known_move_type_id) return { method: "knownMoveType", typeId: Number(method.known_move_type_id) };
    if (method.location_id || method.near_special_rock) return { method: "location" };
    if (method.minimum_steps) return { method: "steps", steps: Number(method.minimum_steps) };
    if (method.held_item_id && method.time) return { method: "heldItemTime", itemId: Number(method.held_item_id), time: method.time };
    if (method.held_item_id) return { method: "heldItem", itemId: Number(method.held_item_id) };
    if (method.relative_physical_stats !== null && method.relative_physical_stats !== undefined) return { method: "statRelation", level: Number(method.minimum_level) || null, relation: Number(method.relative_physical_stats) };
    if (method.party_species_id) return { method: "partySpecies", speciesId: Number(method.party_species_id) };
    if (method.party_type_id) return { method: "partyType", typeId: Number(method.party_type_id), level: Number(method.minimum_level) || null };
    if (method.needs_overworld_rain) return { method: "rainLevel", level: Number(method.minimum_level) || null };
    if (method.gender_id) return { method: "genderLevel", level: Number(method.minimum_level) || null, genderId: Number(method.gender_id) };
    if (method.minimum_level && method.time) return { method: "timeLevel", level: Number(method.minimum_level), time: method.time };
    if (method.minimum_level) return { method: "level", level: Number(method.minimum_level), time: method.time || null };
    if (trigger === "level-up") return { method: "levelOther", time: method.time || null };
    return { method: trigger || "special" };
  }
  function methodKey(item, context) { return JSON.stringify(methodValue(item, context)); }
  function defenseProfile(item, context) {
    const values = context.types.map(type => effectiveness(context.typeChart, type, item.types));
    return {
      weaknesses: values.filter(value => value > 1).length,
      resistances: values.filter(value => value > 0 && value < 1).length,
      immunities: values.filter(value => value === 0).length
    };
  }
  function battleStyle(item) {
    const attack = Number(item?.stats?.attack) || 0;
    const special = Number(item?.stats?.spAttack) || 0;
    if (attack >= special + 18) return "physical";
    if (special >= attack + 18) return "special";
    return "balanced";
  }
  function heightBand(item) {
    const value = Number(item?.height) || 0;
    if (value < 5) return "tiny";
    if (value < 10) return "small";
    if (value < 20) return "medium";
    if (value < 40) return "large";
    return "giant";
  }
  function weightBand(item) {
    const value = Number(item?.weight) || 0;
    if (value < 50) return "veryLight";
    if (value < 250) return "light";
    if (value < 750) return "medium";
    if (value < 2000) return "heavy";
    return "veryHeavy";
  }
  function namePattern(item, language) {
    const name = String(item?.[language] || item?.en || item?.de || "").trim();
    const letters = Array.from(name.replace(/[^\p{L}\p{N}]/gu, ""));
    return { first: letters[0] || "", last: letters.at(-1) || "", length: letters.length };
  }
  function mediaStrength(kind, difficulty) {
    const levels = {
      shadow: { easy: "full", medium: "partial", hard: "detail" },
      pixel: { easy: "light", medium: "medium", hard: "strong" },
      crop: { easy: "large", medium: "medium", hard: "small" },
      cry: { easy: "long", medium: "medium", hard: "short" }
    };
    return levels[kind]?.[validDifficulty(difficulty)] || levels[kind]?.medium || "medium";
  }
  function mediaDescriptor(kind, target, difficulty, position) {
    return hint(kind, {
      pokemonId: Number(target.id),
      strength: mediaStrength(kind, difficulty),
      anchor: (Number(target.id) * 37 + position * 19) % 100
    }, `media-${kind}`, ["media"], [position]);
  }
  function sameObject(left, right) { return JSON.stringify(left) === JSON.stringify(right); }

  function createContext(options = {}) {
    const pokemon = (Array.isArray(options.pokemon) ? options.pokemon : []).filter(item => Number.isInteger(Number(item?.id)));
    const byId = new Map(pokemon.map(item => [Number(item.id), item]));
    const children = new Map();
    pokemon.forEach(item => {
      const parent = Number(item.evolvesFrom);
      if (!Number.isInteger(parent)) return;
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(Number(item.id));
    });
    const types = Array.isArray(options.types) && options.types.length ? [...options.types] : unique(pokemon.flatMap(item => item.types || []));
    return {
      pokemon, byId, children, types, typeChart: options.typeChart || {},
      evolutionMethods: options.evolutionMethods || {}, starterIds: new Set((options.starterIds || []).map(Number))
    };
  }

  function hint(kind, value, family, topics, positions) {
    return { kind, value, family, topics: unique(topics), positions: unique(positions).sort() };
  }

  function buildHintPool(target, context, difficulty = "medium") {
    if (!target) return [];
    const pool = [];
    const add = (kind, value, family, topics, positions) => pool.push(hint(kind, value, family, topics, positions));
    const high = statEdge(target, "max");
    const low = statEdge(target, "min");
    const abilities = (target.abilities || []).map(row => ({ id: Number(row.id), hidden: Boolean(row.hidden) })).sort((a, b) => a.id - b.id || Number(a.hidden) - Number(b.hidden));
    const defense = defenseProfile(target, context);
    const stage = evolutionStage(target, context);
    const size = familySize(target);
    const method = methodValue(target, context);
    const physicalBand = heightBand(target);
    const massBand = weightBand(target);

    add("statSignature", { high, low }, "stats-signature", ["stats"], [1, 2]);
    add("abilityProfile", abilities, "ability-profile", ["abilities"], [1, 2]);
    add("measurements", { height: Number(target.height), weight: Number(target.weight) }, "measurements", ["body"], [1, 2]);
    add("originProfile", { generation: Number(target.generation), stage, familySize: size }, "origin-profile", ["origin", "evolution"], [1, 2]);
    add("defenseProfile", defense, "defense-profile", ["battle"], [1, 2, 3]);
    add("baseTotal", statTotal(target), "base-total", ["stats"], [1, 2, 4]);
    add("generation", Number(target.generation), "generation", ["origin"], [2, 3]);
    add("strongestStat", high, "strongest-stat", ["stats"], [2, 3]);
    add("weakestStat", low, "weakest-stat", ["stats"], [2, 3]);
    add("battleStyle", battleStyle(target), "battle-style", ["stats", "battle"], [2, 3]);
    add("typeCount", (target.types || []).length, "type-count", ["types"], [2, 3]);
    add("evolutionStage", stage, "evolution-stage", ["evolution"], [2, 3]);
    add("familySize", size, "family-size", ["evolution"], [2, 3]);
    add("heightBand", physicalBand, "height-band", ["body"], [2, 3]);
    add("weightBand", massBand, "weight-band", ["body"], [2, 3]);
    if (method) add("evolutionMethod", method, "evolution-method", ["evolution"], [1, 2, 4]);

    const dexSizes = difficulty === "easy" ? [25, 50] : difficulty === "hard" ? [100, 50] : [50, 25];
    dexSizes.forEach(sizeValue => {
      const start = Math.floor((Number(target.id) - 1) / sizeValue) * sizeValue + 1;
      add("dexRange", { start, end: Math.min(1025, start + sizeValue - 1) }, `dex-range-${sizeValue}`, ["origin"], [2, 3, 4, 5]);
    });

    (target.types || []).forEach(type => add("typeOne", type, `type-one-${type}`, ["types"], [4]));
    add("typeCombo", canonical(target.types || []), "type-combo", ["types"], [4, 5]);

    context.types.forEach(type => {
      const multiplier = effectiveness(context.typeChart, type, target.types || []);
      if (multiplier > 1) add("matchup", { relation: "weak", type, multiplier }, `matchup-weak-${type}`, ["battle", "types"], [2, 3, 4]);
      else if (multiplier === 0) add("matchup", { relation: "immune", type, multiplier }, `matchup-immune-${type}`, ["battle", "types"], [2, 3, 4]);
      else if (multiplier < 1) add("matchup", { relation: "resist", type, multiplier }, `matchup-resist-${type}`, ["battle", "types"], [2, 3, 4]);
    });

    (target.abilities || []).forEach(row => add("singleAbility", { id: Number(row.id), hidden: Boolean(row.hidden) }, `ability-${row.id}-${row.hidden ? "hidden" : "normal"}`, ["abilities"], [2, 4]));
    if (target.evolvesFrom) add("evolutionNeighbor", { direction: "from", id: Number(target.evolvesFrom) }, "evolution-from", ["evolution"], [4, 5]);
    childrenOf(target, context).forEach(id => add("evolutionNeighbor", { direction: "to", id }, `evolution-to-${id}`, ["evolution"], [4, 5]));

    if (target.legendary) add("specialGroup", "legendary", "group-legendary", ["group"], [2, 3]);
    if (target.mythical) add("specialGroup", "mythical", "group-mythical", ["group"], [2, 3]);
    if (context.starterIds.has(Number(target.id))) add("specialGroup", "starter", "group-starter", ["group"], [2, 3]);

    const ids = familyIds(target);
    if (ids.length > 1) add("evolutionGap", ids, "evolution-gap", ["evolution", "name"], [5]);
    add("namePattern", { de: namePattern(target, "de"), en: namePattern(target, "en") }, "name-pattern", ["name"], [5]);
    return pool;
  }

  function matchesHint(candidate, descriptor, context) {
    if (!candidate || !descriptor || !HINT_KIND_SET.has(descriptor.kind)) return false;
    const value = descriptor.value;
    switch (descriptor.kind) {
      case "statSignature": return sameObject({ high: statEdge(candidate, "max"), low: statEdge(candidate, "min") }, value);
      case "abilityProfile": return sameObject((candidate.abilities || []).map(row => ({ id: Number(row.id), hidden: Boolean(row.hidden) })).sort((a, b) => a.id - b.id || Number(a.hidden) - Number(b.hidden)), value);
      case "measurements": return Number(candidate.height) === Number(value.height) && Number(candidate.weight) === Number(value.weight);
      case "originProfile": return Number(candidate.generation) === Number(value.generation) && evolutionStage(candidate, context) === Number(value.stage) && familySize(candidate) === Number(value.familySize);
      case "defenseProfile": return sameObject(defenseProfile(candidate, context), value);
      case "baseTotal": return statTotal(candidate) === Number(value);
      case "generation": return Number(candidate.generation) === Number(value);
      case "dexRange": return Number(candidate.id) >= Number(value.start) && Number(candidate.id) <= Number(value.end);
      case "strongestStat": return sameObject(statEdge(candidate, "max"), value);
      case "weakestStat": return sameObject(statEdge(candidate, "min"), value);
      case "battleStyle": return battleStyle(candidate) === value;
      case "typeCount": return (candidate.types || []).length === Number(value);
      case "typeOne": return (candidate.types || []).includes(value);
      case "typeCombo": return canonical(candidate.types || []) === value;
      case "matchup": {
        const multiplier = effectiveness(context.typeChart, value.type, candidate.types || []);
        if (value.relation === "weak") return multiplier === Number(value.multiplier);
        if (value.relation === "immune") return multiplier === 0;
        return multiplier === Number(value.multiplier);
      }
      case "singleAbility": return (candidate.abilities || []).some(row => Number(row.id) === Number(value.id) && Boolean(row.hidden) === Boolean(value.hidden));
      case "evolutionStage": return evolutionStage(candidate, context) === Number(value);
      case "familySize": return familySize(candidate) === Number(value);
      case "evolutionNeighbor": return value.direction === "from"
        ? Number(candidate.evolvesFrom) === Number(value.id)
        : childrenOf(candidate, context).includes(Number(value.id));
      case "evolutionMethod": return methodKey(candidate, context) === JSON.stringify(value);
      case "specialGroup": return value === "legendary" ? Boolean(candidate.legendary) : value === "mythical" ? Boolean(candidate.mythical) : context.starterIds.has(Number(candidate.id));
      case "heightBand": return heightBand(candidate) === value;
      case "weightBand": return weightBand(candidate) === value;
      case "namePattern": return sameObject(namePattern(candidate, "de"), value.de) && sameObject(namePattern(candidate, "en"), value.en);
      case "evolutionGap": return canonical(familyIds(candidate)) === canonical(value);
      case "shadow":
      case "pixel":
      case "crop":
      case "cry": return Number(candidate.id) === Number(value.pokemonId);
      default: return false;
    }
  }

  function matchingPokemon(hints, context) {
    return context.pokemon.filter(candidate => (hints || []).every(descriptor => matchesHint(candidate, descriptor, context)));
  }
  function decorateHint(descriptor, context) {
    return { ...clone(descriptor), candidateCount: matchingPokemon([descriptor], context).length };
  }
  function topicConflict(descriptor, selected) {
    const used = new Set(selected.flatMap(row => row.topics || []));
    return (descriptor.topics || []).some(topic => used.has(topic));
  }
  function selectByTargetCount(items, desired, random) {
    if (!items.length) return null;
    const ranked = items.map(item => ({ item, score: Math.abs(Math.log2(Math.max(1, item.candidateCount)) - Math.log2(Math.max(1, desired))) + random() * 0.7 }))
      .sort((a, b) => a.score - b.score);
    return randomItem(ranked.slice(0, Math.min(5, ranked.length)).map(row => row.item), random);
  }
  function eligible(pool, position, selected, strictTopics = true) {
    return pool.filter(row => row.positions.includes(position) && !selected.some(chosen => chosen.family === row.family) && (!strictTopics || !topicConflict(row, selected)));
  }
  function ensureSecondHint(pool, first, target, context, difficulty, random) {
    const desired = difficulty === "easy" ? 18 : difficulty === "hard" ? 90 : 45;
    const find = strictTopics => pool.filter(row => row.positions.includes(2) && row.family !== first.family && (!strictTopics || !topicConflict(row, [first])))
      .filter(row => matchingPokemon([first, row], context).length === 1);
    let candidates = find(true);
    if (!candidates.length) candidates = find(false);
    if (!candidates.length) {
      [100, 50, 25, 10, 5, 1].forEach(size => {
        const start = Math.floor((Number(target.id) - 1) / size) * size + 1;
        const extra = decorateHint(hint("dexRange", { start, end: Math.min(1025, start + size - 1) }, `dex-range-fallback-${size}`, ["origin"], [2]), context);
        pool.push(extra);
      });
      candidates = find(false);
    }
    return selectByTargetCount(candidates, desired, random) || pool.find(row => row.kind === "namePattern") || null;
  }

  function selectHints(target, context, difficulty = "medium", random = Math.random) {
    const safeDifficulty = validDifficulty(difficulty);
    const pool = buildHintPool(target, context, safeDifficulty).map(row => decorateHint(row, context));
    const firstLimit = safeDifficulty === "easy" ? 12 : safeDifficulty === "hard" ? 60 : 28;
    const desiredFirst = safeDifficulty === "easy" ? 4 : safeDifficulty === "hard" ? 24 : 10;
    let firstPool = pool.filter(row => row.positions.includes(1) && row.candidateCount > 0 && row.candidateCount <= firstLimit);
    if (!firstPool.length) firstPool = pool.filter(row => row.positions.includes(1)).sort((a, b) => a.candidateCount - b.candidateCount).slice(0, 8);
    const first = selectByTargetCount(firstPool, desiredFirst, random);
    const second = ensureSecondHint(pool, first, target, context, safeDifficulty, random);
    const selected = [first, second].filter(Boolean);

    const desiredByPosition = safeDifficulty === "easy" ? { 3: 80, 4: 24, 5: 5 } : safeDifficulty === "hard" ? { 3: 240, 4: 80, 5: 16 } : { 3: 140, 4: 45, 5: 9 };
    [3, 4, 5].forEach(position => {
      let candidates = eligible(pool, position, selected, true);
      if (!candidates.length) candidates = eligible(pool, position, selected, false);
      if (!candidates.length) candidates = pool.filter(row => row.positions.includes(position) && !selected.some(chosen => chosen.family === row.family));
      const chosen = selectByTargetCount(candidates, desiredByPosition[position], random);
      if (chosen) selected.push(chosen);
    });
    if (selected.length < HINT_COUNT) {
      shuffle(pool, random).forEach(row => {
        if (selected.length >= HINT_COUNT || selected.some(chosen => chosen.family === row.family)) return;
        selected.push(row);
      });
    }
    const mediaKinds = shuffle(["shadow", "pixel", "crop", "cry"], random);
    const mediaCount = random() < 0.28 ? 2 : 1;
    const mediaPositions = mediaCount === 2 ? [4, 5] : [random() < 0.56 ? 4 : 5];
    mediaPositions.forEach((position, index) => {
      const descriptor = mediaDescriptor(mediaKinds[index], target, safeDifficulty, position);
      descriptor.value.fallback = clone(selected[position - 1]);
      selected[position - 1] = decorateHint(descriptor, context);
    });
    const finalHints = selected.slice(0, HINT_COUNT).map((row, index) => ({ ...clone(row), position: index + 1 }));
    return {
      hints: finalHints,
      candidatesAfterFirst: matchingPokemon(finalHints.slice(0, 1), context).length,
      candidatesAfterSecond: matchingPokemon(finalHints.slice(0, 2), context).length
    };
  }

  function createRound(options = {}) {
    const context = options.context || createContext(options);
    if (!context.pokemon.length) throw new Error("A Pokémon catalogue is required.");
    const random = typeof options.random === "function" ? options.random : Math.random;
    const difficulty = validDifficulty(options.difficulty);
    const target = options.targetId ? context.byId.get(Number(options.targetId)) : randomItem(context.pokemon, random);
    if (!target) throw new Error("The selected Pokémon does not exist.");
    const selection = selectHints(target, context, difficulty, random);
    if (selection.hints.length !== HINT_COUNT || selection.candidatesAfterSecond !== 1) throw new Error("A fair five-hint package could not be created.");
    const now = typeof options.now === "function" ? options.now() : new Date();
    return {
      id: `wttp-${new Date(now).getTime()}-${target.id}`,
      targetId: Number(target.id), difficulty, maxLives: MAX_LIVES, lives: MAX_LIVES,
      revealed: 1, guesses: [], status: "active", createdAt: new Date(now).toISOString(), completedAt: null,
      hints: selection.hints,
      balance: { afterFirst: selection.candidatesAfterFirst, afterSecond: selection.candidatesAfterSecond }
    };
  }

  function createDailyRound(options = {}) {
    const context = options.context || createContext(options);
    if (!context.pokemon.length) throw new Error("A Pokémon catalogue is required.");
    const dateKey = utcDateKey(options.date || new Date());
    if (!dateKey || dateKey < DAILY_EPOCH) throw new Error("A valid daily date is required.");
    const seed = hashString(`quizmon-wttp-v1:${dateKey}`);
    const random = seededRandom(seed);
    const target = context.pokemon[Math.floor(random() * context.pokemon.length)];
    const round = createRound({ context, difficulty: "medium", targetId: target.id, random, now: () => new Date(`${dateKey}T00:00:00.000Z`) });
    return { ...round, id: `wttp-daily-${dateKey}`, mode: "daily", dailyDate: dateKey, seedVersion: 1 };
  }

  function scoreRound(round) {
    if (!round || !["won", "lost"].includes(round.status)) return { points: 0, xp: 0, solvedAtHint: null };
    const solvedAtHint = round.status === "won" ? Math.min(HINT_COUNT, Math.max(1, Number(round.revealed) || 1)) : null;
    if (!solvedAtHint) return { points: 0, xp: 5, solvedAtHint: null };
    const multiplier = round.difficulty === "hard" ? 1.35 : round.difficulty === "easy" ? .85 : 1;
    const base = [0, 1000, 760, 540, 360, 220][solvedAtHint];
    const dailyBonus = round.mode === "daily" ? 150 : 0;
    const points = Math.round(base * multiplier + dailyBonus);
    const xp = Math.max(10, Math.round(points / 20));
    return { points, xp, solvedAtHint };
  }

  function blankStatistics() {
    return { played: 0, won: 0, lost: 0, totalHints: 0, firstHintWins: 0, bestPoints: 0, byDifficulty: { easy: { played: 0, won: 0 }, medium: { played: 0, won: 0 }, hard: { played: 0, won: 0 } }, dailyPlayed: 0 };
  }
  function recordStatistics(value, round, score = scoreRound(round)) {
    const stats = sanitizeStatistics(value);
    if (!round || !["won", "lost"].includes(round.status)) return stats;
    stats.played += 1;
    stats[round.status] += 1;
    stats.totalHints += Math.min(HINT_COUNT, Math.max(1, Number(round.revealed) || 1));
    if (score.solvedAtHint === 1) stats.firstHintWins += 1;
    stats.bestPoints = Math.max(stats.bestPoints, Number(score.points) || 0);
    const difficulty = validDifficulty(round.difficulty);
    stats.byDifficulty[difficulty].played += 1;
    if (round.status === "won") stats.byDifficulty[difficulty].won += 1;
    if (round.mode === "daily") stats.dailyPlayed += 1;
    return stats;
  }
  function sanitizeStatistics(value) {
    const base = blankStatistics();
    const source = value && typeof value === "object" ? value : {};
    ["played", "won", "lost", "totalHints", "firstHintWins", "bestPoints", "dailyPlayed"].forEach(key => { base[key] = Math.max(0, Math.floor(Number(source[key]) || 0)); });
    DIFFICULTIES.forEach(key => {
      base.byDifficulty[key].played = Math.max(0, Math.floor(Number(source.byDifficulty?.[key]?.played) || 0));
      base.byDifficulty[key].won = Math.min(base.byDifficulty[key].played, Math.max(0, Math.floor(Number(source.byDifficulty?.[key]?.won) || 0)));
    });
    base.won = Math.min(base.played, base.won);
    base.lost = Math.min(base.played - base.won, base.lost);
    return base;
  }

  function submitGuess(round, pokemonId, context, options = {}) {
    if (!round || round.status !== "active") return { accepted: false, reason: "finished", round };
    const id = Number(pokemonId);
    if (!context?.byId?.has(id)) return { accepted: false, reason: "invalid", round };
    if ((round.guesses || []).includes(id)) return { accepted: false, reason: "duplicate", round };
    const next = clone(round);
    next.guesses.push(id);
    const correct = id === Number(next.targetId);
    const now = typeof options.now === "function" ? options.now() : new Date();
    if (correct) {
      next.status = "won";
      next.completedAt = new Date(now).toISOString();
    } else {
      next.lives = Math.max(0, Number(next.lives) - 1);
      next.revealed = Math.min(HINT_COUNT, Number(next.revealed) + 1);
      if (next.lives === 0) {
        next.status = "lost";
        next.completedAt = new Date(now).toISOString();
      }
    }
    return { accepted: true, correct, round: next };
  }

  function sanitizeRound(value, context) {
    if (!value || typeof value !== "object" || !context?.byId?.has(Number(value.targetId))) return null;
    const targetId = Number(value.targetId);
    const hints = Array.isArray(value.hints) ? value.hints.filter(row => row && HINT_KIND_SET.has(row.kind)).slice(0, HINT_COUNT).map((row, index) => ({ ...clone(row), position: index + 1 })) : [];
    if (hints.length !== HINT_COUNT || hints.some(row => !matchesHint(context.byId.get(targetId), row, context))) return null;
    const guesses = unique((Array.isArray(value.guesses) ? value.guesses : []).map(Number).filter(id => context.byId.has(id))).slice(0, MAX_LIVES);
    const won = guesses.includes(targetId);
    const wrongCount = guesses.filter(id => id !== targetId).length;
    const lost = !won && wrongCount >= MAX_LIVES;
    const status = won ? "won" : lost ? "lost" : "active";
    const created = new Date(value.createdAt || "");
    const completed = new Date(value.completedAt || "");
    return {
      id: typeof value.id === "string" ? value.id.slice(0, 100) : `wttp-restored-${targetId}`,
      targetId, difficulty: validDifficulty(value.difficulty), maxLives: MAX_LIVES,
      lives: Math.max(0, MAX_LIVES - wrongCount), revealed: Math.min(HINT_COUNT, wrongCount + 1),
      guesses, status, createdAt: Number.isNaN(created.getTime()) ? new Date(0).toISOString() : created.toISOString(),
      completedAt: status === "active" || Number.isNaN(completed.getTime()) ? null : completed.toISOString(),
      hints, mode: value.mode === "daily" ? "daily" : "free",
      dailyDate: value.mode === "daily" ? utcDateKey(value.dailyDate) : null,
      seedVersion: value.mode === "daily" ? 1 : null,
      balance: {
        afterFirst: matchingPokemon(hints.slice(0, 1), context).length,
        afterSecond: matchingPokemon(hints.slice(0, 2), context).length
      }
    };
  }

  function findPokemonByName(query, language, context) {
    const normalized = normalizedName(query);
    if (!normalized) return null;
    const lang = language === "de" ? "de" : "en";
    return context.pokemon.find(item => normalizedName(item[lang]) === normalized) || null;
  }

  return Object.freeze({
    DIFFICULTIES, MAX_LIVES, HINT_COUNT, HINT_KINDS, STAT_KEYS, DAILY_EPOCH,
    createContext, buildHintPool, matchesHint, matchingPokemon, selectHints,
    createRound, createDailyRound, submitGuess, sanitizeRound, findPokemonByName, normalizedName,
    hashString, seededRandom, utcDateKey, scoreRound, blankStatistics, recordStatistics, sanitizeStatistics,
    statTotal, statEdge, evolutionStage, defenseProfile, battleStyle, heightBand, weightBand, methodValue,
    mediaStrength, mediaDescriptor
  });
});
