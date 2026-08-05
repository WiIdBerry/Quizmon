"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScript } = require("./helpers.js");
const engine = require("../whos-that-pokemon.js");
const knowledge = require("../knowledge-data.js");
const content = require("../knowledge-content-data.js");
const world = require("../knowledge-world-data.js");

const battle = loadScript("data.js", "({ TYPES, TYPE_CHART })");
const context = engine.createContext({
  pokemon: knowledge.POKEMON,
  types: battle.TYPES,
  typeChart: battle.TYPE_CHART,
  evolutionMethods: content.EVOLUTION_METHODS,
  starterIds: world.REGIONS.flatMap(region => region.starters)
});

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

test("Sprint 2 extends the 25 data clues with four media clue kinds", () => {
  assert.equal(engine.HINT_KINDS.length, 29);
  assert.equal(new Set(engine.HINT_KINDS).size, 29);
  assert.ok(engine.HINT_KINDS.includes("statSignature"));
  assert.ok(engine.HINT_KINDS.includes("matchup"));
  assert.ok(engine.HINT_KINDS.includes("evolutionGap"));
  assert.ok(engine.HINT_KINDS.includes("namePattern"));
  assert.deepEqual(engine.HINT_KINDS.slice(-4), ["shadow", "pixel", "crop", "cry"]);
});

test("all difficulties build five valid clues and become conclusive after clue two", () => {
  const ids = [1, 25, 94, 132, 150, 152, 251, 252, 386, 387, 493, 494, 649, 650, 721, 722, 809, 810, 905, 906, 1000, 1025];
  const limits = { easy: 12, medium: 28, hard: 60 };
  for (const difficulty of engine.DIFFICULTIES) {
    for (const id of ids) {
      const target = context.byId.get(id);
      const selection = engine.selectHints(target, context, difficulty, seeded(id * 31 + difficulty.length));
      assert.equal(selection.hints.length, 5, `${difficulty} #${id}`);
      assert.deepEqual(selection.hints.map(hint => hint.position), [1, 2, 3, 4, 5]);
      assert.ok(selection.candidatesAfterFirst >= 1 && selection.candidatesAfterFirst <= limits[difficulty], `${difficulty} #${id} first clue candidates`);
      assert.equal(selection.candidatesAfterSecond, 1, `${difficulty} #${id} second clue candidates`);
      assert.equal(new Set(selection.hints.map(hint => hint.family)).size, 5, `${difficulty} #${id} clue families`);
      assert.ok(!["typeOne", "typeCombo", "evolutionNeighbor", "namePattern", "evolutionGap"].includes(selection.hints[0].kind));
      assert.ok(!["typeOne", "typeCombo", "evolutionNeighbor", "namePattern", "evolutionGap"].includes(selection.hints[1].kind));
      const media = selection.hints.filter(hint => ["shadow", "pixel", "crop", "cry"].includes(hint.kind));
      if (difficulty === "easy") {
        assert.deepEqual(media.map(hint => hint.kind), ["cry", "shadow", "crop"], `${difficulty} #${id} fixed media sequence`);
        assert.deepEqual(media.map(hint => hint.position), [1, 4, 5], `${difficulty} #${id} fixed media positions`);
      } else {
        assert.ok(media.length >= 1 && media.length <= 2, `${difficulty} #${id} media count`);
        assert.ok(media.every(hint => hint.position >= 4), `${difficulty} #${id} media position`);
      }
      assert.ok(media.every(hint => hint.value.pokemonId === id && hint.value.fallback), `${difficulty} #${id} media fallback`);
      if (difficulty !== "easy" && media.length === 2) assert.ok(engine.mediaRevealRank(media[0].kind) <= engine.mediaRevealRank(media[1].kind), `${difficulty} #${id} progressive media order`);
      if (selection.hints.some(hint => hint.kind === "namePattern")) assert.equal(selection.hints.find(hint => hint.kind === "namePattern").position, 5);
      if (selection.hints.some(hint => hint.kind === "evolutionGap")) assert.equal(selection.hints.find(hint => hint.kind === "evolutionGap").position, 5);
    }
  }
});

test("random media pairs in normal and hard never move backwards in reveal strength", () => {
  assert.ok(engine.mediaRevealRank("crop") < engine.mediaRevealRank("shadow"));
  assert.ok(engine.mediaRevealRank("crop") < engine.mediaRevealRank("pixel"));
  for (let seed = 1; seed <= 300; seed += 1) {
    const difficulty = seed % 2 ? "medium" : "hard";
    const selection = engine.selectHints(context.byId.get((seed % 1025) + 1), context, difficulty, seeded(seed));
    const media = selection.hints.filter(hint => ["shadow", "pixel", "crop", "cry"].includes(hint.kind));
    if (media.length === 2) assert.ok(engine.mediaRevealRank(media[0].kind) <= engine.mediaRevealRank(media[1].kind));
  }
});

test("media strength becomes less revealing with higher difficulty", () => {
  assert.equal(engine.mediaStrength("shadow", "easy"), "full");
  assert.equal(engine.mediaStrength("shadow", "hard"), "detail");
  assert.equal(engine.mediaStrength("pixel", "easy"), "light");
  assert.equal(engine.mediaStrength("pixel", "hard"), "strong");
  assert.equal(engine.mediaStrength("crop", "easy"), "large");
  assert.equal(engine.mediaStrength("crop", "hard"), "small");
  assert.equal(engine.mediaStrength("cry", "easy"), "full");
  assert.equal(engine.mediaStrength("cry", "hard"), "short");
});

test("easy mode uses the fixed accessible five-clue sequence for the complete catalogue", () => {
  const lightFacts = new Set(["generation", "dexRange", "typeCount", "evolutionStage", "familySize", "heightBand", "weightBand"]);
  const clearFacts = new Set(["typeCombo", "evolutionNeighbor", "singleAbility", "evolutionMethod", "specialGroup", "measurements", "originProfile", "abilityProfile", "statSignature"]);
  for (const target of context.pokemon) {
    const selection = engine.selectHints(target, context, "easy", seeded(target.id * 97));
    assert.deepEqual(selection.hints.map(hint => hint.kind), ["cry", selection.hints[1].kind, selection.hints[2].kind, "shadow", "crop"], `#${target.id} clue sequence`);
    assert.ok(lightFacts.has(selection.hints[1].kind), `#${target.id} light fact`);
    assert.ok(clearFacts.has(selection.hints[2].kind), `#${target.id} clear fact`);
    assert.equal(selection.hints[0].value.strength, "full", `#${target.id} full cry`);
    assert.equal(selection.hints[3].value.strength, "full", `#${target.id} full shadow`);
    assert.equal(selection.hints[4].value.strength, "large", `#${target.id} large crop`);
    assert.ok(selection.hints[4].value.anchor >= 42 && selection.hints[4].value.anchor <= 58, `#${target.id} centred crop`);
    assert.ok(selection.hints.filter(hint => ["cry", "shadow", "crop"].includes(hint.kind)).every(hint => hint.value.fallback), `#${target.id} media fallbacks`);
    assert.equal(selection.candidatesAfterSecond, 1, `#${target.id} conclusive after clue two`);
  }
});

test("five lives reveal one clue per accepted wrong guess", () => {
  let round = engine.createRound({ context, difficulty: "medium", targetId: 25, random: seeded(25), now: () => new Date("2026-08-04T12:00:00Z") });
  assert.equal(round.lives, 5);
  assert.equal(round.revealed, 1);
  assert.equal(round.balance.afterSecond, 1);

  const invalid = engine.submitGuess(round, 9999, context);
  assert.equal(invalid.accepted, false);
  assert.equal(invalid.reason, "invalid");
  assert.equal(round.lives, 5);

  const wrong = engine.submitGuess(round, 1, context);
  assert.equal(wrong.accepted, true);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.round.lives, 4);
  assert.equal(wrong.round.revealed, 2);
  round = wrong.round;

  const duplicate = engine.submitGuess(round, 1, context);
  assert.equal(duplicate.accepted, false);
  assert.equal(duplicate.reason, "duplicate");
  assert.equal(duplicate.round.lives, 4);

  const correct = engine.submitGuess(round, 25, context, { now: () => new Date("2026-08-04T12:01:00Z") });
  assert.equal(correct.accepted, true);
  assert.equal(correct.correct, true);
  assert.equal(correct.round.status, "won");
  assert.equal(correct.round.lives, 4);
});

test("the fifth accepted wrong guess ends the round without accepting spam", () => {
  let round = engine.createRound({ context, difficulty: "hard", targetId: 25, random: seeded(125) });
  for (const id of [1, 2, 3, 4, 5]) round = engine.submitGuess(round, id, context).round;
  assert.equal(round.status, "lost");
  assert.equal(round.lives, 0);
  assert.equal(round.revealed, 5);
  assert.equal(engine.submitGuess(round, 6, context).reason, "finished");
});

test("name lookup follows the active language and tolerates punctuation variants", () => {
  assert.equal(engine.findPokemonByName("Bisasam", "de", context).id, 1);
  assert.equal(engine.findPokemonByName("Bulbasaur", "en", context).id, 1);
  assert.equal(engine.findPokemonByName("Bulbasaur", "de", context), null);
  assert.equal(engine.findPokemonByName("Farfetch'd", "en", context).id, 83);
  assert.equal(engine.findPokemonByName("farfetch d", "en", context).id, 83);
});

test("saved rounds are repaired from catalogue facts instead of trusting counters", () => {
  const round = engine.createRound({ context, difficulty: "easy", targetId: 94, random: seeded(94) });
  const tampered = { ...round, lives: 0, revealed: 5, guesses: [25, 25, 1] };
  const repaired = engine.sanitizeRound(tampered, context);
  assert.equal(repaired.status, "active");
  assert.deepEqual(repaired.guesses, [25, 1]);
  assert.equal(repaired.lives, 3);
  assert.equal(repaired.revealed, 3);
  assert.equal(repaired.balance.afterSecond, 1);
});
