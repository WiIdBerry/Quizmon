"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const router = require("../router.js");

test("expanded main-menu routes are valid without becoming inner routes", () => {
  for (const route of ["play", "knowledge", "support"]) {
    assert.equal(router.validRoute(route), true, route);
    assert.equal(router.isInnerRoute(route), false, route);
  }
  assert.equal(router.isInnerRoute("learn-detail"), true);
  assert.equal(router.validRoute("pokeidle"), true);
  assert.equal(router.isInnerRoute("pokeidle"), true);
});
