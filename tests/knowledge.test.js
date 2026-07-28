"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const data = require("../knowledge-data.js");
const knowledge = require("../knowledge-engine.js");

test("the Phase 3 Pokémon catalog contains every species from 1 to 1025", () => {
  assert.equal(data.POKEMON.length, 1025);
  assert.equal(data.POKEMON[0].id, 1);
  assert.equal(data.POKEMON.at(-1).id, 1025);
  assert.equal(new Set(data.POKEMON.map(item => item.id)).size, 1025);
});

test("every Pokémon has bilingual names, types, generation and six base stats", () => {
  assert.deepEqual(knowledge.validatePokemon(data.POKEMON), []);
  for (const item of data.POKEMON) {
    assert.ok(item.de && item.en, `missing name ${item.id}`);
    assert.ok(item.types.length === 1 || item.types.length === 2, `types ${item.id}`);
    assert.ok(item.abilities.length >= 1, `abilities ${item.id}`);
    assert.ok(knowledge.baseStatTotal(item) > 0, `stats ${item.id}`);
  }
});

test("evolution references point to catalog entries", () => {
  for (const item of data.POKEMON) {
    for (const id of item.evolutionIds) assert.ok(data.BY_ID.has(id), `${item.id} -> ${id}`);
    if (item.evolvesFrom) assert.ok(data.BY_ID.has(item.evolvesFrom), `${item.id} evolves from ${item.evolvesFrom}`);
  }
});

test("catalog pagination and bilingual name lookup are deterministic", () => {
  const first = knowledge.listPokemon(data.POKEMON, { offset: 0, limit: 48 });
  const last = knowledge.listPokemon(data.POKEMON, { offset: 1008, limit: 48 });
  assert.equal(first.total, 1025);
  assert.equal(first.items.length, 48);
  assert.equal(last.items.length, 17);
  assert.equal(knowledge.name(data.BY_ID.get(1), "de"), "Bisasam");
  assert.equal(knowledge.name(data.BY_ID.get(1), "en"), "Bulbasaur");
});

test("knowledge core data covers all nine generations", () => {
  assert.deepEqual([...new Set(data.POKEMON.map(item => item.generation))].sort(), [1,2,3,4,5,6,7,8,9]);
});

test("branched evolution families preserve their actual parent-child structure", () => {
  const tyrogue = knowledge.evolutionTree(data.BY_ID.get(107), data.BY_ID);
  assert.equal(tyrogue.size, 4);
  assert.deepEqual(tyrogue.roots.map(node => node.item.id), [236]);
  assert.deepEqual(tyrogue.roots[0].children.map(node => node.item.id), [106, 107, 237]);

  const wurmple = knowledge.evolutionTree(data.BY_ID.get(269), data.BY_ID);
  assert.deepEqual(wurmple.roots.map(node => node.item.id), [265]);
  assert.deepEqual(wurmple.roots[0].children.map(node => node.item.id), [266, 268]);
  assert.deepEqual(wurmple.roots[0].children[0].children.map(node => node.item.id), [267]);
  assert.deepEqual(wurmple.roots[0].children[1].children.map(node => node.item.id), [269]);

  const eevee = knowledge.evolutionTree(data.BY_ID.get(700), data.BY_ID);
  assert.equal(eevee.roots[0].item.id, 133);
  assert.deepEqual(eevee.roots[0].children.map(node => node.item.id), [134, 135, 136, 196, 197, 470, 471, 700]);
});

test("every stored evolution family becomes an acyclic tree with every member exactly once", () => {
  for (const item of data.POKEMON) {
    const tree = knowledge.evolutionTree(item, data.BY_ID);
    const visited = new Set();
    const walk = node => {
      assert.ok(!visited.has(node.item.id), `cycle or duplicate in family of ${item.id}: ${node.item.id}`);
      visited.add(node.item.id);
      node.children.forEach(walk);
    };
    tree.roots.forEach(walk);
    assert.equal(visited.size, new Set(item.evolutionIds).size, `incomplete family for ${item.id}`);
    assert.equal(tree.size, visited.size, `tree size mismatch for ${item.id}`);
  }
});

test("single-stage Pokémon remain a one-node tree for clean UI suppression", () => {
  const zapdos = knowledge.evolutionTree(data.BY_ID.get(145), data.BY_ID);
  assert.equal(zapdos.size, 1);
  assert.deepEqual(zapdos.roots.map(node => node.item.id), [145]);
  assert.equal(zapdos.roots[0].children.length, 0);
});

const content = require("../knowledge-content-data.js");

const validTypes = new Set(["normal","fighting","flying","poison","ground","rock","bug","ghost","steel","fire","water","grass","electric","psychic","ice","dragon","dark","fairy"]);

test("Sprint 2 provides complete local core catalogs for moves, abilities and items", () => {
  assert.equal(content.MOVES.length, 919);
  assert.equal(content.ABILITIES.length, 313);
  assert.equal(content.ITEMS.length, 2176);
  assert.deepEqual(knowledge.validateContent(content.ABILITIES, content.MOVES, content.ITEMS), []);
  assert.equal(new Set(content.MOVES.map(item => item.id)).size, content.MOVES.length);
  assert.equal(new Set(content.ABILITIES.map(item => item.id)).size, content.ABILITIES.length);
  assert.equal(new Set(content.ITEMS.map(item => item.id)).size, content.ITEMS.length);
});

test("move and item core data stays valid across all supported generations", () => {
  for (const move of content.MOVES) {
    assert.ok(validTypes.has(move.type), `invalid move type ${move.id}: ${move.type}`);
    assert.ok(["physical","special","status"].includes(move.damageClass), `invalid class ${move.id}`);
    assert.ok(move.effect.de && move.effect.en, `missing move effect ${move.id}`);
  }
  for (const item of content.ITEMS) {
    assert.ok(item.generation >= 1 && item.generation <= 9, `item generation ${item.id}`);
    assert.ok(item.pocket >= 1 && item.pocket <= 8, `item pocket ${item.id}`);
    assert.ok(item.effect.de && item.effect.en, `missing item effect ${item.id}`);
  }
  assert.equal(content.ITEM_BY_ID.get(543).generation, 1);
  assert.equal(content.ITEM_BY_ID.get(2232).generation, 9);
});

test("ability links only reference supported Pokémon", () => {
  for (const ability of content.ABILITIES) {
    for (const pokemonId of ability.pokemonIds) assert.ok(data.BY_ID.has(pokemonId), `${ability.id} -> ${pokemonId}`);
  }
});

test("evolution catalog contains each multi-stage family once", () => {
  const families = knowledge.evolutionFamilies(data.POKEMON);
  assert.equal(families.length, 340);
  assert.equal(new Set(families.map(family => family.id)).size, families.length);
  assert.ok(families.every(family => family.size > 1));
});

test("known evolution methods are attached to the correct child species", () => {
  const bulbasaur = knowledge.evolutionTree(data.BY_ID.get(1), data.BY_ID, content.EVOLUTION_METHODS);
  const ivysaur = bulbasaur.roots[0].children.find(node => node.item.id === 2);
  assert.equal(ivysaur.methods[0].trigger, "level-up");
  assert.equal(ivysaur.methods[0].minimum_level, 16);

  const alakazam = knowledge.evolutionTree(data.BY_ID.get(65), data.BY_ID, content.EVOLUTION_METHODS);
  const kadabra = alakazam.roots[0].children.find(node => node.item.id === 64);
  const final = kadabra.children.find(node => node.item.id === 65);
  assert.equal(final.methods[0].trigger, "trade");

  const eevee = knowledge.evolutionTree(data.BY_ID.get(133), data.BY_ID, content.EVOLUTION_METHODS);
  const jolteon = eevee.roots[0].children.find(node => node.item.id === 135);
  assert.equal(jolteon.methods[0].trigger, "use-item");
  assert.equal(jolteon.methods[0].trigger_item_id, 83);
});

test("generic knowledge pagination is deterministic", () => {
  const firstMoves = knowledge.listEntries(content.MOVES, { offset: 0, limit: 48 });
  const lastMoves = knowledge.listEntries(content.MOVES, { offset: 912, limit: 48 });
  assert.equal(firstMoves.total, 919);
  assert.equal(firstMoves.items.length, 48);
  assert.equal(lastMoves.items.length, 7);
  const abilities = knowledge.listEntries(content.ABILITIES, { offset: 0, limit: 48 });
  assert.equal(abilities.items.length, 48);
});

test("Pokémon ability buttons and evolution conditions resolve to local content", () => {
  for (const pokemon of data.POKEMON) {
    for (const ability of pokemon.abilities || []) assert.ok(content.ABILITY_BY_ID.has(ability.id), `${pokemon.id} ability ${ability.id}`);
  }
  for (const methods of Object.values(content.EVOLUTION_METHODS)) {
    for (const method of methods) {
      for (const key of ["trigger_item_id", "held_item_id"]) if (method[key]) assert.ok(content.ITEM_BY_ID.has(method[key]), `${key}:${method[key]}`);
      for (const key of ["known_move_id", "used_move_id"]) if (method[key]) assert.ok(content.MOVE_BY_ID.has(method[key]), `${key}:${method[key]}`);
    }
  }
});

test("German knowledge effects avoid generic or misleading placeholder copy", () => {
  for (const move of content.MOVES) {
    assert.ok(!/^Eine (physische|spezielle|Status)-Attacke/.test(move.effect.de), `generic move text ${move.id}`);
  }
  for (const ability of content.ABILITIES) {
    assert.ok(!/^Eine Fähigkeit/.test(ability.effect.de), `generic ability text ${ability.id}`);
  }
  for (const item of content.ITEMS) {
    assert.notEqual(item.effect.de, "Ein Item mit einer besonderen Wirkung im Kampf oder außerhalb davon.", `generic item text ${item.id}`);
  }
  assert.match(content.MOVE_BY_ID.get(237).effect.de, /Typ.*Anwender|Wirkung und Typ/);
  assert.doesNotMatch(content.MOVE_BY_ID.get(312).effect.en, /can't be used.*forgotten/i);
  assert.match(content.ABILITY_BY_ID.get(281).effect.de, /Sonnenschein|Energiekapsel/);
});

const learnsets = require("../knowledge-learnset-data.js");

test("main-series learnsets cover all supported games without mixing version groups", () => {
  assert.equal(learnsets.DEFAULT_VERSION_GROUP_ID, 25);
  assert.equal(learnsets.VERSION_GROUPS.length, 21);
  assert.deepEqual(learnsets.VERSION_GROUPS.map(group => group.id), [25,24,23,20,19,18,17,16,15,14,11,10,9,8,7,6,5,4,3,2,1]);
  const allEntries = Object.values(learnsets.BY_GROUP).flatMap(group => Object.values(group).flat());
  assert.equal(allEntries.length, 531261);
  assert.ok(allEntries.every(entry => content.MOVE_BY_ID.has(entry[0])), "every learnset move must exist in the move catalog");
  assert.ok(allEntries.every(entry => Number.isInteger(entry[1]) && entry[1] >= 1), "unexpected learning method");
});

test("game-specific Pokémon learnsets stay separated and resolve the latest available game", () => {
  const bulbasaurRedBlue = learnsets.groupPokemonEntries(1, 1);
  const bulbasaurScarletViolet = learnsets.groupPokemonEntries(1, 25);
  assert.ok(bulbasaurRedBlue.level.some(entry => entry.moveId === 22 && entry.level === 13));
  assert.ok(bulbasaurScarletViolet.level.some(entry => entry.moveId === 22 && entry.level === 3));
  assert.notDeepEqual(bulbasaurRedBlue.level, bulbasaurScarletViolet.level);
  assert.equal(learnsets.resolveGroupForPokemon(1000, 1), 25);
  assert.equal(learnsets.resolveGroupForPokemon(1, 10), 10);
  assert.equal(learnsets.hasPokemon(1, 1), true);
  assert.equal(learnsets.hasPokemon(1000, 1), false);
});

test("available game lists are newest-first and only include games with actual data", () => {
  assert.deepEqual(learnsets.availableGroupsForPokemon(1000).map(group => group.id), [25]);
  assert.equal(learnsets.availableGroupsForPokemon(1)[0].id, 25);
  assert.equal(learnsets.availableGroupsForPokemon(1).at(-1).id, 1);
  assert.equal(learnsets.availableGroupsForMove(33)[0].id, 25);
  assert.equal(learnsets.resolveGroupForMove(15, 25), 23);
});

test("machine labels correctly distinguish TM, HM/VM and TR by language", () => {
  assert.equal(learnsets.machineLabel(1001, "de"), "TM01");
  assert.equal(learnsets.machineLabel(2001, "de"), "VM01");
  assert.equal(learnsets.machineLabel(2001, "en"), "HM01");
  assert.equal(learnsets.machineLabel(3000, "de"), "TR00");
  const redBlue = learnsets.groupPokemonEntries(1, 1);
  assert.ok(redBlue.machine.some(entry => learnsets.machineLabel(entry.machine, "de").startsWith("TM")));
});

test("move details use the selected game for reverse Pokémon relations", () => {
  const tackleRedBlue = learnsets.entriesForMove(33, 1);
  const tackleScarletViolet = learnsets.entriesForMove(33, 25);
  assert.ok(tackleRedBlue.some(entry => entry[0] === 1 && entry[1] === learnsets.METHOD.LEVEL));
  assert.ok(tackleScarletViolet.some(entry => entry[0] === 1 && entry[1] === learnsets.METHOD.LEVEL));
  assert.ok(tackleRedBlue.every(entry => data.BY_ID.has(entry[0])));
  assert.notEqual(tackleRedBlue.length, tackleScarletViolet.length);
});
