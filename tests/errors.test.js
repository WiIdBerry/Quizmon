"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const errors = require("../error-analysis.js");
const { loadScript } = require("./helpers.js");
const { TYPES } = loadScript("data.js", "({ TYPES })");

test("error keys are stable and normalized", () => {
  assert.equal(errors.ruleKey("direction-reversal"), "rule:direction-reversal");
  assert.equal(errors.ruleKey("unknown"), null);
  assert.equal(errors.matchupKey("fire", ["steel", "grass", "grass"], TYPES), "matchup:fire:grass+steel");
  assert.equal(errors.pokemonKey(25), "pokemon:25");
});

test("immunity mistakes are classified", () => {
  assert.deepEqual(errors.classifyMultiplier(0, 1, [0], 1), ["immunity-overlooked"]);
  assert.deepEqual(errors.classifyMultiplier(2, 0, [2], 1), ["immunity-assumed"]);
});

test("quarter and double multiplier confusion is classified", () => {
  assert.ok(errors.classifyMultiplier(.25, .5, [.5, .5], 2).includes("quarter-half-confusion"));
  assert.ok(errors.classifyMultiplier(4, 2, [2, 2], 2).includes("double-quad-confusion"));
});

test("dual neutralization and multiplication are classified", () => {
  const issues = errors.classifyMultiplier(1, 2, [2, .5], 2);
  assert.ok(issues.includes("dual-neutralization"));
  assert.ok(issues.includes("dual-multiplication"));
});

test("pattern status moves from observation to open, improved and resolved", () => {
  assert.equal(errors.patternStatus({ opportunities:1, errors:1 }), "observing");
  assert.equal(errors.patternStatus({ opportunities:5, errors:3 }), "open");
  assert.equal(errors.patternStatus({ opportunities:6, errors:3, recentCorrect:2 }), "improved");
  assert.equal(errors.patternStatus({ opportunities:7, errors:3, recentCorrect:3, correctStreak:3 }), "resolved");
});
