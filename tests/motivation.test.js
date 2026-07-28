"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const motivation = require("../motivation.js");
const i18n = require("../i18n-utils.js");

test("combo milestones grant the intended XP", () => {
  assert.equal(motivation.comboBonusFor(2), 0);
  assert.equal(motivation.comboBonusFor(3), 3);
  assert.equal(motivation.comboBonusFor(5), 5);
  assert.equal(motivation.comboBonusFor(10), 10);
  assert.equal(motivation.comboBonusFor(15), 10);
  assert.equal(motivation.comboBonusFor(5, true), 3);
});

test("next combo goal is always ahead", () => {
  assert.deepEqual(motivation.nextComboTarget(0), { target:3, remaining:3, bonus:3 });
  assert.equal(motivation.nextComboTarget(3).target, 5);
  assert.equal(motivation.nextComboTarget(10).target, 15);
});

test("daily goal never exceeds its target", () => {
  assert.deepEqual(motivation.dailyGoal(12, 10), { progress:10, target:10, remaining:0, complete:true, percent:100 });
  assert.equal(motivation.dailyGoal(4, 10).remaining, 6);
});

test("level progress and plural categories are stable", () => {
  const levels = [{ level:1, xp:0 }, { level:2, xp:100 }, { level:3, xp:250 }];
  assert.equal(motivation.levelInfo(levels, 50).progress, 50);
  assert.equal(motivation.levelInfo(levels, 100).current.level, 2);
  assert.equal(i18n.pluralCategory("de", 1), "one");
  assert.equal(i18n.pluralCategory("de", 2), "other");
});
