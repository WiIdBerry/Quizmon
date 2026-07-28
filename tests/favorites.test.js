"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const favorites = require("../favorites.js");

test("favorite repair removes invalid and duplicate entries while preserving highlighted choices", () => {
  const repaired = favorites.sanitize({
    pokemon: [{ id: 25, addedAt: "2026-07-01T00:00:00.000Z" }, 25, 9999],
    types: [{ type: "fire", addedAt: "invalid" }, "fire", "missing"],
    sortPokemon: "name",
    sortTypes: "broken"
  }, {
    pokemonIds: new Set([1, 25, 133]),
    types: new Set(["fire", "water"]),
    highlightedPokemonId: 133,
    highlightedType: "water",
    now: "2026-07-28T17:00:00.000Z"
  });
  assert.deepEqual(repaired.pokemon.map(entry => entry.id), [25, 133]);
  assert.deepEqual(repaired.types.map(entry => entry.type), ["fire", "water"]);
  assert.equal(repaired.sortPokemon, "name");
  assert.equal(repaired.sortTypes, "recent");
});

test("favorite toggles add and remove without mutating the original list", () => {
  const source = [{ id: 1, addedAt: "2026-07-01T00:00:00.000Z" }];
  const added = favorites.toggle(source, "id", 25, "2026-07-02T00:00:00.000Z");
  assert.deepEqual(source.map(entry => entry.id), [1]);
  assert.deepEqual(added.map(entry => entry.id), [1, 25]);
  const removed = favorites.toggle(added, "id", 1);
  assert.deepEqual(removed.map(entry => entry.id), [25]);
});

test("Pokémon favorites support recent, name and Pokédex-number sorting", () => {
  const catalog = new Map([
    [1, { id: 1, names: { de: "Bisasam", en: "Bulbasaur" } }],
    [25, { id: 25, names: { de: "Pikachu", en: "Pikachu" } }],
    [133, { id: 133, names: { de: "Evoli", en: "Eevee" } }]
  ]);
  const entries = [
    { id: 25, addedAt: "2026-07-01T00:00:00.000Z" },
    { id: 1, addedAt: "2026-07-03T00:00:00.000Z" },
    { id: 133, addedAt: "2026-07-02T00:00:00.000Z" }
  ];
  assert.deepEqual(favorites.sortPokemon(entries, catalog, "de", "recent").map(row => row.id), [1, 133, 25]);
  assert.deepEqual(favorites.sortPokemon(entries, catalog, "de", "name").map(row => row.id), [1, 133, 25]);
  assert.deepEqual(favorites.sortPokemon(entries, catalog, "de", "number").map(row => row.id), [1, 25, 133]);
});
