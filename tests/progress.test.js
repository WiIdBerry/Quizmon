"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const progress = require("../progress.js");

test("first comparable round creates a neutral baseline", () => {
  assert.deepEqual(progress.comparisonInfo({ rate:80, duration:30, total:10, correct:8 }), {
    kind:"baseline", previous:null, delta:null, errorDelta:null, timeDelta:null
  });
});

test("comparable sessions calculate improvement, errors and time", () => {
  const previous = { rate:60, answers:10, correct:6, duration:55 };
  assert.deepEqual(progress.comparisonInfo({ rate:80, duration:40, total:10, correct:8, previous }), {
    kind:"better", previous, previousRate:60, delta:20, errorDelta:2, timeDelta:15
  });
});
