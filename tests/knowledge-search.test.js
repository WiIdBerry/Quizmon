"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const pokemon = require("../knowledge-data.js");
const content = require("../knowledge-content-data.js");
const world = require("../knowledge-world-data.js");
const knowledge = require("../knowledge-engine.js");
const search = require("../knowledge-search.js");
const { loadScript } = require("./helpers.js");

const TYPES = loadScript("data.js", "TYPES");
const I18N = loadScript("i18n.js", "I18N");
const coreRoles = new Set(["gym", "elite", "champion"]);
const index = search.buildIndex({
  types: TYPES.map(type => ({ id: type, de: I18N.de[`type.${type}`], en: I18N.en[`type.${type}`] })),
  pokemon: pokemon.POKEMON,
  moves: content.MOVES,
  abilities: content.ABILITIES,
  items: content.ITEMS,
  evolutions: knowledge.evolutionFamilies(pokemon.POKEMON),
  regions: world.REGIONS,
  trainers: world.TRAINERS.filter(trainer => trainer.roles.some(role => coreRoles.has(role))),
  competitive: world.COMPETITIVE_TOPICS
});

test("Sprint 1 builds one central index from every visible knowledge area", () => {
  assert.equal(index.length, 4933);
  const counts = index.reduce((groups, entry) => {
    (groups[entry.kind] ||= []).push(entry);
    return groups;
  }, {});
  assert.equal(counts.type.length, 18);
  assert.equal(counts.pokemon.length, 1025);
  assert.equal(counts.move.length, 919);
  assert.equal(counts.ability.length, 313);
  assert.equal(counts.item.length, 2176);
  assert.equal(counts.evolution.length, 340);
  assert.equal(counts.region.length, 9);
  assert.equal(counts.trainer.length, 117);
  assert.equal(counts.competitive.length, 16);
});

test("exact names rank before keyword-only matches in the active language", () => {
  const result = search.search(index, "Bisasam", { language: "de", perKind: 6 });
  assert.equal(result.items[0].kind, "pokemon");
  assert.equal(result.items[0].id, 1);
  assert.equal(result.items[0].de, "Bisasam");

  const english = search.search(index, "Bulbasaur", { language: "en", perKind: 6 });
  assert.equal(english.items[0].kind, "pokemon");
  assert.equal(english.items[0].id, 1);
});

test("search is accent-insensitive, bilingual and understands Pokédex numbers", () => {
  assert.equal(search.normalize("Pokémon"), "pokemon");
  assert.ok(search.search(index, "Flabébé", { language: "de" }).items.some(item => item.kind === "pokemon" && item.id === 669));
  assert.ok(search.search(index, "Pewter City", { language: "de" }).items.some(item => item.kind === "region" && item.id === "kanto"));
  assert.ok(search.search(index, "0001", { language: "de" }).items.some(item => item.kind === "pokemon" && item.id === 1));
});

test("linked content is searchable without duplicating its source data", () => {
  const ability = search.search(index, "Chlorophyll", { language: "en" });
  assert.ok(ability.items.some(item => item.kind === "ability" && item.id === 34));
  assert.ok(ability.items.some(item => item.kind === "pokemon" && item.id === 1));

  const evolution = search.search(index, "Bisaknosp", { language: "de" });
  assert.ok(evolution.items.some(item => item.kind === "evolution" && item.id === 1));

  const trainer = search.search(index, "Knakrack", { language: "de" });
  assert.ok(trainer.items.some(item => item.kind === "trainer" && item.id === "cynthia"));
});

test("common concepts return grouped results from several knowledge kinds", () => {
  const result = search.search(index, "Feuer", { language: "de", perKind: 6 });
  assert.ok(result.total > result.items.length);
  assert.ok(result.counts.type >= 1);
  assert.ok(result.counts.pokemon >= 1);
  assert.ok(result.counts.move >= 1);
  assert.ok(result.items.some(item => item.kind === "type" && item.id === "fire"));
});

test("every indexed result resolves to an existing detail target", () => {
  const families = new Set(knowledge.evolutionFamilies(pokemon.POKEMON).map(family => Number(family.id)));
  const types = new Set(TYPES);
  for (const entry of index) {
    if (entry.kind === "type") assert.ok(types.has(entry.id), `type:${entry.id}`);
    else if (entry.kind === "pokemon") assert.ok(pokemon.BY_ID.has(Number(entry.id)), `pokemon:${entry.id}`);
    else if (entry.kind === "move") assert.ok(content.MOVE_BY_ID.has(Number(entry.id)), `move:${entry.id}`);
    else if (entry.kind === "ability") assert.ok(content.ABILITY_BY_ID.has(Number(entry.id)), `ability:${entry.id}`);
    else if (entry.kind === "item") assert.ok(content.ITEM_BY_ID.has(Number(entry.id)), `item:${entry.id}`);
    else if (entry.kind === "evolution") assert.ok(families.has(Number(entry.id)), `evolution:${entry.id}`);
    else if (entry.kind === "region") assert.ok(world.REGION_BY_ID.has(String(entry.id)), `region:${entry.id}`);
    else if (entry.kind === "trainer") assert.ok(world.TRAINER_BY_ID.has(String(entry.id)), `trainer:${entry.id}`);
    else if (entry.kind === "competitive") assert.ok(world.TOPIC_BY_ID.has(String(entry.id)), `competitive:${entry.id}`);
    else assert.fail(`unknown kind:${entry.kind}`);
  }
});

test("Sprint 2 tolerates a small typo only when no direct result exists", () => {
  const result = search.search(index, "Pikatchu", { language: "de", flat: true, limit: 10 });
  assert.ok(result.fuzzy);
  assert.ok(result.items.some(item => item.kind === "pokemon" && item.id === 25 && item.fuzzy));
  assert.equal(search.editDistanceWithin("pikachu", "pikatchu", 2), 1);
});

test("Sprint 2 supports category filters and deterministic load-more pagination", () => {
  const first = search.search(index, "Feuer", { language: "de", kind: "move", flat: true, limit: 2, offset: 0 });
  const second = search.search(index, "Feuer", { language: "de", kind: "move", flat: true, limit: 2, offset: 2 });
  assert.equal(first.total, first.counts.move);
  assert.ok(first.allTotal >= first.total);
  assert.equal(first.items.length, 2);
  assert.ok(first.items.every(item => item.kind === "move"));
  assert.ok(second.items.every(item => item.kind === "move"));
  assert.deepEqual(
    new Set(first.items.map(item => item.id)).intersection(new Set(second.items.map(item => item.id))).size,
    0
  );
});

test("Phase 3.3 stores generation metadata on every generation-bound search entry", () => {
  for (const entry of index) {
    if (["type", "competitive"].includes(entry.kind)) assert.deepEqual(entry.generations, []);
    else {
      assert.ok(entry.generations.length >= 1, `${entry.kind}:${entry.id}`);
      assert.ok(entry.generations.every(generation => generation >= 1 && generation <= 9));
    }
  }
});

test("Phase 3.3 filters search results by generation while keeping timeless content visible", () => {
  const gen1 = search.search(index, "Feuer", { language: "de", generation: 1, flat: true, limit: 100 });
  assert.ok(gen1.items.some(item => item.kind === "type" && item.id === "fire"));
  assert.ok(gen1.items.filter(item => !["type", "competitive"].includes(item.kind)).every(item => item.generations.includes(1)));

  const gen9Name = pokemon.BY_ID.get(906).de;
  const gen9Pokemon = search.search(index, gen9Name, { language: "de", generation: 9, kind: "pokemon", flat: true, limit: 20 });
  assert.equal(gen9Pokemon.total, 1);
  assert.ok(gen9Pokemon.items.every(item => item.kind === "pokemon" && item.generations.includes(9)));

  const firstAbilityName = content.ABILITIES[0].de;
  const gen1Abilities = search.search(index, firstAbilityName, { language: "de", generation: 1, kind: "ability", flat: true, limit: 100 });
  assert.equal(gen1Abilities.total, 0);
});
