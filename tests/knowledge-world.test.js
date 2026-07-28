"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const world = require("../knowledge-world-data.js");
const pokemon = require("../knowledge-data.js");

const idsAreUnique = items => new Set(items.map(item => item.id)).size === items.length;

test("world knowledge contains the nine core regions", () => {
  assert.equal(world.REGIONS.length, 9);
  assert.ok(idsAreUnique(world.REGIONS));
  assert.deepEqual(world.REGIONS.map(item => item.generation), [1,2,3,4,5,6,7,8,9]);
  for (const region of world.REGIONS) {
    assert.equal(region.starters.length, 3, `${region.id} starter count`);
    assert.ok(region.de && region.en && region.summary.de && region.summary.en);
  }
});

test("trainer knowledge is structured, linked and role-diverse", () => {
  assert.equal(world.TRAINERS.length, 145);
  assert.ok(idsAreUnique(world.TRAINERS));
  const roles = new Set(world.TRAINERS.flatMap(item => item.roles));
  for (const role of ["gym", "elite", "champion", "captain", "kahuna"]) assert.ok(roles.has(role), role);
  for (const trainer of world.TRAINERS) {
    assert.ok(world.REGION_BY_ID.has(trainer.region), trainer.id);
    assert.ok(trainer.de && trainer.en && trainer.roles.length);
    for (const id of trainer.pokemonIds) assert.ok(pokemon.BY_ID.has(Number(id)), `${trainer.id}:${id}`);
  }
});

test("competitive knowledge stays timeless and complete", () => {
  assert.equal(world.COMPETITIVE_TOPICS.length, 16);
  assert.ok(idsAreUnique(world.COMPETITIVE_TOPICS));
  const groups = new Set(world.COMPETITIVE_TOPICS.map(item => item.group));
  assert.deepEqual([...groups].sort(), ["battle", "field", "stats", "team"]);
  for (const topic of world.COMPETITIVE_TOPICS) {
    assert.ok(topic.de && topic.en);
    for (const key of ["summary", "why", "example"]) {
      assert.ok(topic[key]?.de, `${topic.id}:${key}:de`);
      assert.ok(topic[key]?.en, `${topic.id}:${key}:en`);
    }
    assert.ok(topic.steps.de.length >= 3 && topic.steps.en.length >= 3, topic.id);
    for (const related of topic.related) assert.ok(world.TOPIC_BY_ID.has(related), `${topic.id}:${related}`);
  }
  const text = JSON.stringify(world.COMPETITIVE_TOPICS).toLowerCase();
  assert.doesNotMatch(text, /tier list|tierliste|current meta|aktuelles meta|vgc regulation/);
});

test("world-data validation passes against the local Pokémon catalogue", () => {
  assert.deepEqual(world.validate(pokemon.BY_ID), []);
});


test("all core Trainers have explicit full teams, levels, source games and display order", () => {
  const coreRoles = new Set(["gym", "elite", "champion"]);
  const core = world.TRAINERS.filter(trainer => trainer.roles.some(role => coreRoles.has(role)));
  assert.equal(core.length, 117);
  for (const trainer of core) {
    assert.ok(Number.isInteger(trainer.order) && trainer.order >= 1, `${trainer.id}:order`);
    assert.ok(trainer.teamSource?.de && trainer.teamSource?.en, `${trainer.id}:source`);
    assert.ok(Array.isArray(trainer.pokemonTeam), `${trainer.id}:team`);
    assert.ok(trainer.pokemonTeam.length >= 2 && trainer.pokemonTeam.length <= 6, `${trainer.id}:team-size`);
    assert.deepEqual(trainer.pokemonIds, trainer.pokemonTeam.map(entry => entry.id), `${trainer.id}:team-links`);
    for (const entry of trainer.pokemonTeam) {
      assert.ok(pokemon.BY_ID.has(Number(entry.id)), `${trainer.id}:${entry.id}`);
      assert.ok(Number.isInteger(entry.level) && entry.level >= 1 && entry.level <= 100, `${trainer.id}:${entry.level}`);
    }
  }
});

test("Gym Leader order is stored for representative regions", () => {
  const sortedGymIds = region => world.TRAINERS
    .filter(trainer => trainer.region === region && trainer.roles.includes("gym"))
    .sort((a, b) => a.order - b.order || (a.orderVariant || 0) - (b.orderVariant || 0))
    .map(trainer => trainer.id);
  assert.deepEqual(sortedGymIds("kanto"), ["brock","misty","lt-surge","erika","koga-kanto","sabrina","blaine","giovanni"]);
  assert.deepEqual(sortedGymIds("johto"), ["falkner","bugsy","whitney","morty","chuck","jasmine","pryce","clair"]);
  assert.deepEqual(sortedGymIds("galar"), ["milo","nessa","kabu","bea","allister","opal","gordie","melony","piers","raihan"]);
  assert.deepEqual(sortedGymIds("paldea"), ["katy","brassius","iono","kofu","larry-gym","ryme","tulip","grusha"]);
});

test("representative Trainer pages contain the complete battle team", () => {
  const byId = id => world.TRAINER_BY_ID.get(id);
  assert.deepEqual(byId("brock").pokemonTeam.map(entry => [entry.id, entry.level]), [[74,12],[95,14]]);
  assert.deepEqual(byId("giovanni").pokemonTeam.map(entry => entry.level), [45,42,44,45,50]);
  assert.equal(byId("cynthia").pokemonTeam.length, 6);
  assert.equal(byId("leon").pokemonTeam.length, 6);
  assert.equal(byId("geeta").pokemonTeam.length, 6);
});
