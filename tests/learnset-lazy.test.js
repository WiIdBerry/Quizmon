"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const meta = require("../knowledge-learnset-meta.js");
const full = require("../knowledge-learnset-data.js");
const loader = require("../knowledge-learnset-loader.js");
const { read } = require("./helpers.js");

test("lightweight learnset metadata matches the complete game availability maps", () => {
  assert.equal(meta.metaOnly, true);
  assert.equal(full.metaOnly, undefined);
  assert.deepEqual(meta.VERSION_GROUPS, full.VERSION_GROUPS);
  for (let id=1; id<=1025; id++) assert.deepEqual(meta.availableGroupsForPokemon(id).map(g=>g.id), full.availableGroupsForPokemon(id).map(g=>g.id), `pokemon:${id}`);
  for (let id=1; id<=919; id++) assert.deepEqual(meta.availableGroupsForMove(id).map(g=>g.id), full.availableGroupsForMove(id).map(g=>g.id), `move:${id}`);
});

test("full learnsets are cached offline but not executed during the general app start", () => {
  const html=read("index.html"), sw=read("service-worker.js"), app=read("app.js");
  assert.doesNotMatch(html, /<script[^>]+src="knowledge-learnset-data\.js"/);
  assert.match(html, /knowledge-learnset-meta\.js/);
  assert.match(html, /knowledge-learnset-loader\.js/);
  assert.match(sw, /knowledge-learnset-data\.js/);
  assert.match(app, /QuizmonKnowledgeLearnsetLoader\.load/);
  assert.match(app, /knowledgeLearnsetDeferredMarkup/);
  assert.equal(loader.SCRIPT_URL, "./knowledge-learnset-data.js");
  assert.equal(loader.LOAD_TIMEOUT_MS, 20000);
});
