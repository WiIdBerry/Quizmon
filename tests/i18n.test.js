"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScript, placeholders } = require("./helpers.js");
const I18N = loadScript("i18n.js", "I18N");

test("German and English contain exactly the same keys", () => {
  assert.deepEqual(Object.keys(I18N.de).sort(), Object.keys(I18N.en).sort());
});

test("translated placeholders stay compatible", () => {
  for (const key of Object.keys(I18N.de)) {
    assert.deepEqual(placeholders(I18N.de[key]), placeholders(I18N.en[key]), `placeholder mismatch in ${key}`);
  }
});

test("singular and plural forms are grammatically distinct where needed", () => {
  assert.equal(I18N.de["daily.remainingOne"], "Noch {count} Frage");
  assert.equal(I18N.de["daily.remaining"], "Noch {count} Fragen");
  assert.match(I18N.de["daily.streakLabelOne"], /Tag/);
  assert.match(I18N.de["daily.streakLabel"], /Tage/);
  assert.match(I18N.de["daily.goalRewardToastOne"], /1|\{streak\} Tag/);
});
