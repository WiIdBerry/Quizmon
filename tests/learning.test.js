"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const learning = require("../learning-engine.js");

test("confidence grows cautiously with the evidence base", () => {
  assert.equal(learning.confidenceId(0), "insufficient");
  assert.equal(learning.confidenceId(3), "first");
  assert.equal(learning.confidenceId(7), "solid");
  assert.equal(learning.confidenceId(12), "reliable");
  assert.equal(learning.confidenceId(20, true), "solid");
});

test("learning status distinguishes need, improvement, stability and strength", () => {
  assert.equal(learning.status(.9, 2, "same", 0), "unassessed");
  assert.equal(learning.status(.45, 10, "same", 0), "need");
  assert.equal(learning.status(.76, 10, "up", 0), "improving");
  assert.equal(learning.status(.9, 10, "same", 0), "strong");
  assert.equal(learning.status(.78, 10, "same", 0), "stable");
});

test("trend calculation recognizes meaningful improvement and decline", () => {
  assert.equal(learning.trend([.9, 1], [.5, .6]).id, "up");
  assert.equal(learning.trend([.4, .5], [.8, .9]).id, "down");
  assert.equal(learning.trend([.75, .8], [.74, .79]).id, "same");
});

test("recommendation priority favors weak, stale and error-prone areas", () => {
  const secure = learning.recommendationPriority({ score: .9, openMistakes: 0, trend: "same", daysSince: 2, recentExposure: 5 });
  const weak = learning.recommendationPriority({ score: .45, openMistakes: 3, trend: "down", daysSince: 20, recentExposure: 0 });
  assert.ok(weak > secure);
});
