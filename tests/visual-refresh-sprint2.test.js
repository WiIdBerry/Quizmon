"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("sprint 2 stylesheet is loaded and cached", () => {
  assert.match(read("styles.css"), /styles-visual-refresh-sprint2\.css/);
  assert.match(read("service-worker.js"), /styles-visual-refresh-sprint2\.css/);
  assert.ok(fs.existsSync(path.join(root, "styles-visual-refresh-sprint2.css")));
});

test("training hub uses the refreshed visual wrapper and hero artwork", () => {
  const app = read("app.js");
  assert.match(app, /adaptive-training-hub visual-refresh-training/);
  assert.match(app, /training-hero-visual/);
  assert.match(app, /training-adaptive-seal/);
});

test("all core quiz panels use the refreshed session wrapper", () => {
  const app = read("app.js");
  const matches = app.match(/quiz-session-panel visual-refresh-session/g) || [];
  assert.ok(matches.length >= 5, `expected at least five refreshed session panels, got ${matches.length}`);
});

test("setup and summary are explicitly part of sprint 2", () => {
  const app = read("app.js");
  assert.match(app, /setup-shell visual-refresh-setup mode-\$\{mode\}/);
  assert.match(app, /cleanup-summary visual-refresh-summary/);
});

test("learning path and flashcards use refreshed wrappers", () => {
  const app = read("app.js");
  for (const marker of [
    "learn-page visual-refresh-learn",
    "visual-refresh-learning-path",
    "visual-refresh-flashcards-setup",
    "visual-refresh-flashcard-session",
    "visual-refresh-flashcard-summary"
  ]) assert.match(app, new RegExp(marker));
});

test("answer explanation remains before reward and next action", () => {
  const app = read("app.js");
  const footer = app.slice(app.indexOf("function sessionFooter()"), app.indexOf("function hintHtml"));
  assert.match(footer, /id="feedback"[\s\S]*id="primaryAction"/);
  const effectiveness = app.slice(app.indexOf("function checkEffectiveness"), app.indexOf("function effectivenessExplanation"));
  assert.ok(effectiveness.indexOf("showFeedback") < effectiveness.indexOf("activateNextButton"));
});

test("sprint 2 stylesheet contains responsive and reduced-motion rules", () => {
  const css = read("styles-visual-refresh-sprint2.css");
  assert.match(css, /@media \(max-width:620px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /html\[data-animations="off"\]/);
});

test("sprint 2 keeps the public version and updates only the build", () => {
  assert.match(read("index.html"), /<small>Beta 1\.3<\/small>/);
  assert.match(read("service-worker.js"), /visual-refresh-sprint2-v1/);
  assert.match(read("package.json"), /visual-refresh-sprint2\.1/);
});
