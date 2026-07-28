"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { read } = require("./helpers.js");

test("browser history is integrated with route snapshots and popstate", () => {
  const app=read("app.js");
  assert.match(app, /history\.pushState/);
  assert.match(app, /history\.replaceState/);
  assert.match(app, /addEventListener\("popstate"/);
  assert.match(app, /function captureRouteSnapshot/);
  assert.match(app, /function restoreRouteSnapshot/);
  assert.match(app, /knowledgeSearchResultScrollY/);
});

test("Phase 3 home information is progressively grouped without changing the core areas", () => {
  const app=read("app.js"), css=read("styles-knowledge.css");
  assert.match(app, /knowledge-personal-hub/);
  assert.match(app, /knowledge-world-hub/);
  assert.match(app, /knowledgeSectionButton\("favorites"/);
  assert.match(app, /knowledgeSectionButton\("training-lists"/);
  for (const section of ["types","pokemon","moves","items","regions","trainers","competitive"]) assert.match(app,new RegExp(`knowledgeSectionButton\\(\\"${section}\\"`));
  assert.match(css, /knowledge-home-group/);
  assert.match(css, /knowledge-home-group:not\(\[open\]\)/);
});

test("important Phase 3 touch targets have a minimum 44 pixel hit area", () => {
  const knowledge=read("styles-knowledge.css"), learning=read("styles-learning.css");
  assert.match(knowledge, /knowledge-favorite-button[^}]*min-width:44px[^}]*min-height:44px/);
  assert.match(knowledge, /knowledge-training-list-button[^}]*min-width:44px[^}]*min-height:44px/);
  assert.match(knowledge, /knowledge-search-field button[^}]*min-width:44px[^}]*min-height:44px/);
  assert.match(knowledge, /knowledge-search-personal-actions button\{width:44px;height:44px/);
  assert.match(knowledge, /training-list-card-actions button\{min-height:44px/);
  assert.match(knowledge, /knowledge-pokemon-tabs button\{min-height:44px/);
  assert.match(learning, /flashcard-session-head button[^}]*min-height:44px/);
});

test("visible Phase 3 labels avoid stale future roadmap copy and use Fortschritt consistently", () => {
  const i18n=read("i18n.js");
  assert.doesNotMatch(i18n, /im nächsten Lexikon-Sprint|in a later lexicon sprint|späteren Weltinhalten|later world content/);
  assert.match(i18n, /"home\.gameProgress": "Fortschritt"/);
  assert.match(i18n, /"home\.gameProgress": "Progress"/);
});

test("GitHub verification includes browser smoke tests before deployment", () => {
  const workflow=read(".github/workflows/static.yml"), pkg=JSON.parse(read("package.json"));
  assert.match(workflow, /browser-actions\/setup-chrome@v1/);
  assert.match(workflow, /npm run test:browser/);
  assert.match(workflow, /needs: verify/);
  assert.equal(pkg.scripts["test:browser"], "node tests/browser-smoke.js");
});
