"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const difficulty = require("../difficulty-engine.js");

test("difficulty shifts stay within bounds", () => {
  assert.equal(difficulty.shiftedDifficulty("easy", -1), "easy");
  assert.equal(difficulty.shiftedDifficulty("easy", 1), "medium");
  assert.equal(difficulty.shiftedDifficulty("medium", 1), "hard");
  assert.equal(difficulty.shiftedDifficulty("hard", 1), "hard");
});

test("speed signal waits for enough data", () => {
  assert.deepEqual(difficulty.speedSignal([5000, 6000], 15000), { value: .5, known: false, average: null });
  assert.equal(difficulty.speedSignal([5000, 6000, 7000], 15000).value, 1);
  assert.equal(difficulty.speedSignal([25000, 26000, 27000], 15000).value, .28);
});

test("three clear successes raise the next block", () => {
  const result = difficulty.blockAdjustment([
    { correct: true, duration: 6000 }, { correct: true, duration: 7000 }, { correct: true, duration: 8000 }
  ], "medium");
  assert.deepEqual(result, { level: "hard", changed: true, signal: "raise" });
});

test("uncertain blocks lower difficulty without oscillating past easy", () => {
  const result = difficulty.blockAdjustment([
    { correct: false, duration: 9000 }, { correct: false, duration: 12000 }, { correct: true, duration: 30000 }
  ], "medium");
  assert.deepEqual(result, { level: "easy", changed: true, signal: "lower" });
  assert.equal(difficulty.blockAdjustment([{ correct:false },{ correct:false },{ correct:false }], "easy").level, "easy");
});

test("manual-looking mixed blocks hold their current difficulty", () => {
  const result = difficulty.blockAdjustment([
    { correct: true, duration: 14000 }, { correct: false, duration: 9000 }, { correct: true, duration: 15000 }
  ], "medium");
  assert.deepEqual(result, { level: "medium", changed: false, signal: "hold" });
});
