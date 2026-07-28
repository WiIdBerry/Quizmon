"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../core-utils.js");
const { loadScript } = require("./helpers.js");
const { TYPES, TYPE_CHART } = loadScript("data.js", "({ TYPES, TYPE_CHART })");

test("type chart contains all 18 attack and defense types", () => {
  assert.equal(TYPES.length, 18);
  assert.equal(new Set(TYPES).size, 18);
  for (const attacking of TYPES) {
    assert.ok(TYPE_CHART[attacking], `missing attack type ${attacking}`);
    for (const defending of TYPES) assert.equal(typeof (TYPE_CHART[attacking][defending] ?? 1), "number");
  }
});

test("known strengths, resistances and immunities are correct", () => {
  assert.equal(core.effectiveness(TYPE_CHART, "fire", ["grass"]), 2);
  assert.equal(core.effectiveness(TYPE_CHART, "fire", ["water"]), .5);
  assert.equal(core.effectiveness(TYPE_CHART, "electric", ["ground"]), 0);
  assert.equal(core.effectiveness(TYPE_CHART, "normal", ["ghost"]), 0);
  assert.equal(core.effectiveness(TYPE_CHART, "fighting", ["normal"]), 2);
});

test("dual types produce all supported multipliers", () => {
  assert.equal(core.effectiveness(TYPE_CHART, "fire", ["grass", "steel"]), 4);
  assert.equal(core.effectiveness(TYPE_CHART, "grass", ["fire", "flying"]), .25);
  assert.equal(core.effectiveness(TYPE_CHART, "ice", ["water", "dragon"]), 1);
  assert.equal(core.effectiveness(TYPE_CHART, "electric", ["water", "ground"]), 0);
  assert.equal(core.effectiveness(TYPE_CHART, "water", ["fire", "dragon"]), 1);
});

test("multiplier display is stable", () => {
  assert.equal(core.formatMultiplier(0), "0×");
  assert.equal(core.formatMultiplier(.25), "¼×");
  assert.equal(core.formatMultiplier(.5), "½×");
  assert.equal(core.formatMultiplier(1), "1×");
  assert.equal(core.formatMultiplier(2), "2×");
  assert.equal(core.formatMultiplier(4), "4×");
});

test("pokemon cache sanitizer rejects malformed data", () => {
  const valid = { id: 25, name: "Pikachu", types: ["electric"], image: "pikachu.png" };
  const cache = {
    valid,
    invalidType: { id: 1, name: "Bad", types: ["unknown"], image: "bad.png" },
    invalidId: { id: 0, name: "Bad", types: ["fire"], image: "bad.png" },
    missingImage: { id: 4, name: "Charmander", types: ["fire"] }
  };
  assert.deepEqual(core.sanitizePokemonCache(cache, TYPES), { valid });
});

test("collection helpers are deterministic", () => {
  assert.deepEqual(core.unique(["fire", "fire", null, "water"]), ["fire", "water"]);
  assert.equal(core.percent(8, 10), 80);
  assert.equal(core.percent(0, 0), 0);
  assert.equal(core.finiteNonNegative(-1, 5), 5);
  assert.equal(core.clampScore(2), 1);
  assert.equal(core.clampScore(-2), 0);
});
