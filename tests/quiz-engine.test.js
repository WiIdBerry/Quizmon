"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const quiz = require("../quiz-engine.js");

test("answer selections are compared independent of order", () => {
  assert.equal(quiz.isExactSelection(["steel", "grass"], ["grass", "steel"]), true);
  assert.equal(quiz.isExactSelection(["grass"], ["grass", "steel"]), false);
  assert.deepEqual(quiz.selectionDifference(["fire", "water"], ["water", "grass"]), ["fire", "grass"]);
});

test("question signatures are stable for every quiz family", () => {
  assert.equal(quiz.questionSignature({ kind:"effectiveness", attackingType:"fire", questionKind:"effective", correctTargets:["steel","grass"] }), "e:fire:effective:grass,steel");
  assert.equal(quiz.questionSignature({ kind:"multiplier", defendingTypes:["steel","grass"] }), "m:grass,steel");
  assert.equal(quiz.questionSignature({ kind:"impact", attackingType:"fire", defendingTypes:["steel","grass"] }), "i:fire:grass,steel");
  assert.equal(quiz.questionSignature({ kind:"pokemon", pokemon:{ id:25 } }), "p:25");
});
