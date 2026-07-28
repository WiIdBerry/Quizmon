"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const pathApi = require("../learning-path.js");
const { loadScript } = require("./helpers.js");
const { TYPES } = loadScript("data.js", "({ TYPES })");
const impact = (attackingType, defendingTypes) => ({ kind:"impact", attackingType, defendingTypes });
const pokemon = id => ({ kind:"pokemon", pokemon:{ id } });
const pokemonImpact = (id, attackingType) => ({ kind:"impact", pokemon:{ id }, attackingType });
const exam = (spec, area, source) => ({ ...spec, area, source });
const modules = pathApi.createModules({ TYPES, pathImpactSpec:impact, pathPokemonSpec:pokemon, pathPokemonImpactSpec:pokemonImpact, pathExamSpec:exam });

test("learning path contains the complete 20-module roadmap", () => {
  assert.equal(modules.length, 20);
  assert.equal(new Set(modules.map(module => module.id)).size, 20);
  assert.equal(modules.filter(module => module.exam).length, 5);
});

test("every prerequisite points to an existing module", () => {
  const ids = new Set(modules.map(module => module.id));
  for (const module of modules) for (const prerequisite of module.prerequisites) assert.ok(ids.has(prerequisite), `${module.id}: ${prerequisite}`);
});

test("all modules contain a usable assessment", () => {
  for (const module of modules) {
    assert.ok(Array.isArray(module.questions));
    assert.ok(module.questions.length >= 5, module.id);
  }
});
