"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const guard = require("../import-guard.js");

const allowed = new Set(["phase3-cleanup-v1", "3.5-sprint2-v2", "phase2-finalization-sprint-v1"]);

test("import guard accepts current and supported legacy state shapes", () => {
  assert.equal(guard.parse(JSON.stringify({ version: "3.5-sprint2-v2", stats: {} }), allowed).version, "3.5-sprint2-v2");
  const wrapped = guard.parse(JSON.stringify({ exportVersion: "phase3-cleanup-v1", state: { version: "phase3-cleanup-v1", profile: {} } }), allowed);
  assert.equal(wrapped.version, "phase3-cleanup-v1");
  assert.deepEqual(wrapped.incoming.profile, {});
});

test("import guard rejects empty, malformed, unsupported and non-object imports", () => {
  assert.throws(() => guard.parse("", allowed), /empty/);
  assert.throws(() => guard.parse("not-json", allowed), SyntaxError);
  assert.throws(() => guard.parse("[]", allowed), /shape/);
  assert.throws(() => guard.parse(JSON.stringify({ version: "unknown" }), allowed), /version/);
});
