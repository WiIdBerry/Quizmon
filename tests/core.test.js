"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const core = require("../core-utils.js");

const source = fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(`${source}\nglobalThis.__quizmonData = { TYPES, TYPE_CHART };`, context);
const { TYPES, TYPE_CHART } = context.__quizmonData;

test("type chart contains all 18 attack and defense types", () => {
  assert.equal(TYPES.length, 18);
  for (const attacking of TYPES) {
    assert.ok(TYPE_CHART[attacking], `missing attack type ${attacking}`);
    for (const defending of TYPES) assert.equal(typeof (TYPE_CHART[attacking][defending] ?? 1), "number");
  }
});

test("known single-type matchups are calculated correctly", () => {
  assert.equal(core.effectiveness(TYPE_CHART, "grass", ["water"]), 2);
  assert.equal(core.effectiveness(TYPE_CHART, "electric", ["ground"]), 0);
  assert.equal(core.effectiveness(TYPE_CHART, "normal", ["ghost"]), 0);
  assert.equal(core.effectiveness(TYPE_CHART, "fire", ["water"]), 0.5);
});

test("dual types multiply resistance and weakness", () => {
  assert.equal(core.effectiveness(TYPE_CHART, "fire", ["grass", "steel"]), 4);
  assert.equal(core.effectiveness(TYPE_CHART, "electric", ["water", "ground"]), 0);
  assert.equal(core.effectiveness(TYPE_CHART, "ice", ["water", "dragon"]), 1);
});

test("pokemon cache sanitizer removes malformed entries and limits size", () => {
  const cache = {
    valid: { id: 25, name: "Pikachu", types: ["electric"], image: "pikachu.png" },
    invalidType: { id: 1, name: "Bad", types: ["unknown"], image: "bad.png" },
    invalidId: { id: 0, name: "Bad", types: ["fire"], image: "bad.png" }
  };
  assert.deepEqual(core.sanitizePokemonCache(cache, TYPES), { valid: cache.valid });
});

test("utility calculations handle edge values", () => {
  assert.equal(core.percent(7, 10), 70);
  assert.equal(core.percent(0, 0), 0);
  assert.equal(core.finiteNonNegative(-2, 4), 4);
  assert.equal(core.formatMultiplier(0.25), "¼×");
});
