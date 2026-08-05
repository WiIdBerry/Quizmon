"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("sprint 3 stylesheet is loaded and cached", () => {
  assert.match(read("styles.css"), /styles-visual-refresh-sprint3\.css/);
  assert.match(read("service-worker.js"), /styles-visual-refresh-sprint3\.css/);
  assert.ok(fs.existsSync(path.join(root, "styles-visual-refresh-sprint3.css")));
});

test("remaining major areas opt into the refreshed design", () => {
  const app = read("app.js");
  for (const marker of [
    "visual-refresh-knowledge",
    "visual-refresh-profile",
    "visual-refresh-progress",
    "visual-refresh-settings",
    "visual-refresh-type-detail"
  ]) assert.match(app, new RegExp(marker));
});

test("settings and profile use the shared SVG icon language", () => {
  const app = read("app.js");
  for (const icon of ["language", "theme", "motion", "haptic", "download", "upload", "feedback", "diagnostics", "trash", "trophy", "back"]) {
    assert.ok(app.includes(`${icon}: \`<svg`), icon);
  }
  const settings = app.slice(app.indexOf("function renderSettings()"), app.indexOf("function downloadJson"));
  assert.match(settings, /iconSvg\("language"\)/);
  assert.match(settings, /iconSvg\("trash"\)/);
});

test("knowledge back navigation uses the shared icon instead of a text glyph", () => {
  const app = read("app.js");
  const header = app.slice(app.indexOf("function knowledgeSubpageHeader"), app.indexOf("function bindKnowledgeHome"));
  assert.match(header, /iconSvg\("back"\)/);
  assert.doesNotMatch(header, />‹<\/button>/);
});

test("sprint 3 covers knowledge, progress, profile and settings responsively", () => {
  const css = read("styles-visual-refresh-sprint3.css");
  for (const selector of ["visual-refresh-knowledge", "visual-refresh-progress", "visual-refresh-profile", "visual-refresh-settings", "visual-refresh-type-detail"]) {
    assert.match(css, new RegExp(selector));
  }
  assert.match(css, /@media \(max-width:620px\)/);
  assert.match(css, /@media \(max-width:390px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /html\[data-animations="off"\]/);
});

test("sprint 3 preserves public version and imports previous refresh saves", () => {
  const app = read("app.js");
  assert.match(app, /const BUILD_VERSION = "visual-refresh-sprint3-v1"/);
  assert.match(app, /const PUBLIC_VERSION = "Beta 1\.3"/);
  assert.match(app, /"visual-refresh-sprint2-v1"/);
  assert.match(read("service-worker.js"), /visual-refresh-sprint3-v1/);
  assert.match(read("package.json"), /visual-refresh-sprint3\.1/);
});
