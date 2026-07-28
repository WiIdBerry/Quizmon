"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const filter = require("../knowledge-filter.js");
const pokemon = require("../knowledge-data.js");
const content = require("../knowledge-content-data.js");
const world = require("../knowledge-world-data.js");
const knowledge = require("../knowledge-engine.js");

const context = { regionById: world.REGION_BY_ID };
const coreRoles = new Set(["gym", "elite", "champion"]);
const coreTrainers = world.TRAINERS.filter(trainer => trainer.roles.some(role => coreRoles.has(role)));
const families = knowledge.evolutionFamilies(pokemon.POKEMON);

test("generation values are normalized to All or Generation 1 through 9", () => {
  assert.equal(filter.normalizeGeneration("all"), null);
  assert.equal(filter.normalizeGeneration(""), null);
  assert.equal(filter.normalizeGeneration(1), 1);
  assert.equal(filter.normalizeGeneration("9"), 9);
  assert.equal(filter.normalizeGeneration(0), null);
  assert.equal(filter.normalizeGeneration(10), null);
  assert.deepEqual(filter.GENERATIONS, [1,2,3,4,5,6,7,8,9]);
});

test("Pokémon, moves, abilities, items and regions filter by introduction generation", () => {
  assert.equal(filter.filter("pokemon", pokemon.POKEMON, 1, context).length, 151);
  assert.equal(filter.filter("pokemon", pokemon.POKEMON, 9, context).length, 120);
  assert.equal(filter.filter("move", content.MOVES, 1, context).length, 165);
  assert.equal(filter.filter("ability", content.ABILITIES, 1, context).length, 0);
  assert.equal(filter.filter("ability", content.ABILITIES, 3, context).length, 76);
  assert.equal(filter.filter("item", content.ITEMS, 8, context).length, 541);
  assert.equal(filter.filter("region", world.REGIONS, 6, context).map(item => item.id).join(), "kalos");
});

test("Trainer filtering follows the generation of their region", () => {
  const kanto = filter.filter("trainer", coreTrainers, 1, context);
  const paldea = filter.filter("trainer", coreTrainers, 9, context);
  assert.equal(kanto.length, 13);
  assert.equal(paldea.length, 14);
  assert.ok(kanto.every(trainer => trainer.region === "kanto"));
  assert.ok(paldea.every(trainer => trainer.region === "paldea"));
});

test("evolution families match every generation represented by their members", () => {
  const eevee = families.find(family => family.members.some(member => member.id === 133));
  assert.ok(eevee);
  assert.ok(filter.matches("evolution", eevee, 1, context));
  assert.ok(filter.matches("evolution", eevee, 2, context));
  assert.ok(filter.matches("evolution", eevee, 4, context));
  assert.ok(filter.matches("evolution", eevee, 6, context));
  assert.equal(filter.matches("evolution", eevee, 3, context), false);
  assert.equal(filter.matches("evolution", eevee, 8, context), false);
});

test("types and timeless battle fundamentals remain visible for every generation", () => {
  assert.ok(filter.matches("type", { id: "fire" }, 1, context));
  assert.ok(filter.matches("type", { id: "fire" }, 9, context));
  assert.ok(filter.matches("competitive", { id: "stab" }, 1, context));
  assert.ok(filter.matches("competitive", { id: "stab" }, 9, context));
});

test("all nine generations have deterministic catalogue counts", () => {
  const expected = {
    pokemon: [151,100,135,107,156,72,88,96,120],
    move: [165,86,103,113,92,62,121,108,69],
    ability: [0,0,76,47,41,27,42,34,46],
    item: [131,93,121,219,122,128,272,541,549],
    evolution: [67,55,47,54,56,27,23,39,38],
    trainer: [13,13,15,13,20,13,5,11,14]
  };
  const sources = {
    pokemon: pokemon.POKEMON,
    move: content.MOVES,
    ability: content.ABILITIES,
    item: content.ITEMS,
    evolution: families,
    trainer: coreTrainers
  };
  for (const [kind, counts] of Object.entries(expected)) {
    assert.deepEqual(filter.GENERATIONS.map(generation => filter.filter(kind, sources[kind], generation, context).length), counts, kind);
  }
  assert.deepEqual(filter.GENERATIONS.map(generation => filter.filter("region", world.REGIONS, generation, context).length), [1,1,1,1,1,1,1,1,1]);
});
