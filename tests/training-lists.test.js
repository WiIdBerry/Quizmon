"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const lists = require("../training-lists.js");

const options = {
  pokemonIds: new Set([1, 4, 7, 25, 133]),
  types: new Set(["fire", "water", "grass", "electric"]),
  now: "2026-07-28T17:55:00.000Z",
  fallbackName: (kind, index) => `${kind}-${index + 1}`
};

test("training-list repair removes invalid lists, entries and duplicates", () => {
  const state = lists.sanitize({ lists: [
    { id:"types-a", kind:"types", name:"  Kanto Typen  ", entries:["fire","fire","missing","water"], createdAt:"bad" },
    { id:"pokemon-a", kind:"pokemon", name:"", entries:[25,"25",999,1] },
    { id:"invalid", kind:"mixed", entries:[1] }
  ] }, options);
  assert.equal(state.lists.length, 2);
  assert.deepEqual(state.lists[0].entries, ["fire","water"]);
  assert.deepEqual(state.lists[1].entries, [25,1]);
  assert.equal(state.lists[0].name, "Kanto Typen");
  assert.equal(state.lists[1].name, "pokemon-2");
});

test("training lists support create, rename, add, remove and ordered movement", () => {
  let state = lists.create({ lists:[] }, { id:"list-a", kind:"types", name:"Starter", entries:["fire","water"] }, options);
  state = lists.rename(state, "list-a", "Starter-Typen", options);
  state = lists.addEntry(state, "list-a", "grass", options);
  state = lists.addEntry(state, "list-a", "grass", options);
  state = lists.moveEntry(state, "list-a", 2, 0, options);
  assert.deepEqual(lists.get(state,"list-a").entries, ["grass","fire","water"]);
  state = lists.removeEntry(state, "list-a", "fire", options);
  assert.deepEqual(lists.get(state,"list-a").entries, ["grass","water"]);
  assert.equal(lists.get(state,"list-a").name, "Starter-Typen");
});

test("duplicate and delete preserve the original list", () => {
  let state = lists.create({ lists:[] }, { id:"pokemon-a", kind:"pokemon", name:"Team", entries:[1,4,7] }, options);
  state = lists.duplicate(state, "pokemon-a", { newId:"pokemon-copy", name:"Team – Kopie" }, options);
  assert.equal(state.lists.length, 2);
  assert.deepEqual(lists.get(state,"pokemon-copy").entries, [1,4,7]);
  state = lists.removeList(state, "pokemon-copy", options);
  assert.equal(state.lists.length, 1);
  assert.ok(lists.get(state,"pokemon-a"));
});

test("compatible quiz modes and minimum list size are explicit", () => {
  assert.deepEqual(lists.compatibleModes("types"), ["effectiveness","multiplier","impact"]);
  assert.deepEqual(lists.compatibleModes("pokemon"), ["pokemon"]);
  assert.equal(lists.canStart({ kind:"types", entries:["fire"] }), false);
  assert.equal(lists.canStart({ kind:"types", entries:["fire","water"] }), true);
  assert.equal(lists.canStart({ kind:"pokemon", entries:[1,4] }), true);
});
