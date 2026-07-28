"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const phase3 = require("../phase3-state.js");
const favorites = require("../favorites.js");
const lists = require("../training-lists.js");
const flashcards = require("../flashcards.js");

const options = {
  favoritesApi: favorites,
  trainingListsApi: lists,
  flashcardsApi: flashcards,
  pokemonIds: new Set([1, 25, 445]),
  types: new Set(["grass", "electric", "dragon"]),
  highlightedPokemonId: 25,
  highlightedType: "electric",
  flashcardKeys: new Set(["pokemon:1", "pokemon:25", "types:grass"]),
  fallbackName: kind => kind === "pokemon" ? "Pokémonliste" : "Typenliste"
};

test("Phase 3 state sanitizer preserves valid personal data and removes invalid duplicates", () => {
  const result = phase3.sanitize({
    favorites: { pokemon: [1, 1, 9999], types: ["grass", "missing"] },
    trainingLists: { lists: [
      { id: "team", kind: "pokemon", name: " Team ", entries: [1, 25, 25, 9999] },
      { id: "types", kind: "types", name: "", entries: ["grass", "dragon", "missing"] }
    ] },
    flashcards: { review: [
      { key: "pokemon:1", rating: "unknown", updatedAt: "2026-01-01" },
      { key: "pokemon:1", rating: "unsure", updatedAt: "2026-02-01" },
      { key: "pokemon:9999", rating: "unknown" }
    ], history: [] }
  }, options);
  assert.deepEqual(result.favorites.pokemon.map(item => item.id).sort((a,b)=>a-b), [1,25]);
  assert.deepEqual(result.favorites.types.map(item => item.type).sort(), ["electric","grass"]);
  assert.deepEqual(result.trainingLists.lists[0].entries, [1,25]);
  assert.deepEqual(result.trainingLists.lists[1].entries, ["grass","dragon"]);
  assert.equal(result.flashcards.review.length, 1);
  assert.equal(result.flashcards.review[0].rating, "unsure");
});

test("critical snapshot includes personal, learning and motivation data for roundtrip checks", () => {
  const state = {
    profile: { name:"Tom", avatarId:"a", bannerId:"b", titleId:"t", favoritePokemonId:25, favoriteType:"electric" },
    favorites:{pokemon:[{id:25}],types:[{type:"electric"}]}, trainingLists:{lists:[]}, flashcards:{review:[],history:[]},
    stats:{xp:345,learning:{events:[{id:1}]},errorAnalysis:{events:[{id:2}]}}, daily:{date:"2026-07-28",answered:10}
  };
  assert.deepEqual(phase3.criticalSnapshot(JSON.parse(JSON.stringify(state))), phase3.criticalSnapshot(state));
});
