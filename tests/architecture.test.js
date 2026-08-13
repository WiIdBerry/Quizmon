"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { ROOT, read } = require("./helpers.js");

const APP_JS_MAX_BYTES = 619000;
const APP_JS_MAX_LINES = 8390;

test("app.js stays below the post-extraction architecture budget", () => {
  const file = path.join(ROOT, "app.js");
  const source = fs.readFileSync(file, "utf8");
  assert.ok(fs.statSync(file).size <= APP_JS_MAX_BYTES, `app.js exceeds ${APP_JS_MAX_BYTES} bytes`);
  assert.ok(source.split("\n").length <= APP_JS_MAX_LINES, `app.js exceeds ${APP_JS_MAX_LINES} lines`);
});

test("campaign presentation and tutorial stay outside app.js", () => {
  const app = read("app.js");
  const ui = read("campaign-ui.js");
  for (const implementationName of [
    "campaignNodeMarkup",
    "campaignSceneryMarkup",
    "campaignPathMarkup",
    "campaignDetailMarkup",
    "openCampaignTutorial",
    "renderCampaignTutorial"
  ]) {
    assert.doesNotMatch(app, new RegExp(`function ${implementationName}\\b`), implementationName);
  }
  assert.doesNotMatch(app, /campaign-tutorial-berry|campaign-path-line|assets\/professor-berry\.png/);
  assert.match(ui, /campaign-tutorial-berry/);
  assert.match(ui, /campaign-path-line/);
  assert.match(ui, /assets\/professor-berry\.png/);
});

test("app.js keeps only the campaign composition boundary", () => {
  const app = read("app.js");
  assert.match(app, /"4\.3-sprint1-v7", "4\.3-sprint1-v6", "4\.3-sprint1-v5", "4\.3-sprint1-v4", "4\.3-sprint1-v3", "4\.3-sprint1-v2", "4\.3-sprint1-v1"/);
  assert.match(app, /QuizmonCampaignUI\.createController/);
  assert.match(app, /function renderCampaign\(\) \{\s*campaignUI\.render\(\);\s*\}/);
});
