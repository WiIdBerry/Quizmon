"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { read } = require("./helpers.js");
const files = ["styles-base.css","styles-home.css","styles-training.css","styles-learning.css","styles-progress.css","styles-profile.css","styles-motion.css","styles-feedback.css","styles-motivation.css","styles-intelligence.css"];
test("split stylesheet is complete and in the locked cascade order", () => {
  const hash = crypto.createHash("sha256").update(files.map(read).join("")).digest("hex");
  assert.equal(hash, read("tests/fixtures/css-cascade.sha256").trim());
});
