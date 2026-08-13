"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { read } = require("./helpers.js");
const html = read("index.html");
const app = read("app.js");
const css = read("styles-intelligence.css");

test("main content is not an oversized live region and has a skip target", () => {
  assert.match(html, /class="skip-link" href="#view"/);
  assert.match(html, /<main id="view" class="view" tabindex="-1"><\/main>/);
  assert.doesNotMatch(html, /<main[^>]+aria-live=/);
});

test("route changes use a dedicated polite announcer", () => {
  assert.match(html, /id="routeAnnouncer"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.match(app, /function announceRoute\(\)/);
  assert.match(app, /announceRoute\(\);/);
});

test("settings select has programmatic label and description", () => {
  assert.match(app, /aria-labelledby="\$\{labelId\}" aria-describedby="\$\{descriptionId\}"/);
});

test("mobile primary controls keep a 44-pixel touch target", () => {
  assert.match(css, /min-width:44px; min-height:44px/);
});

test("summary score cannot split 10\/10 across lines", () => {
  assert.match(css, /summary-score\.answers strong[\s\S]*white-space:nowrap/);
  assert.match(app, /summary-score answers[\s\S]*aria-hidden="true">\/<\/span>/);
});


test("locked training answers leave the keyboard order", () => {
  assert.match(app, /\[data-answer\][\s\S]*?button\.disabled=true/);
  assert.match(app, /\[data-pokemon-type\][\s\S]*?button\.disabled=true/);
  assert.doesNotMatch(app, /button\.setAttribute\("aria-live","polite"\)/);
});

test("permanent dark mode keeps the browser chrome color in sync", () => {
  assert.match(app, /querySelectorAll\('meta\[name="theme-color"\]'\)/);
  assert.match(app, /meta\.setAttribute\("content", "#071426"\)/);
  assert.match(app, /meta\.removeAttribute\("media"\)/);
  assert.doesNotMatch(app, /id="themeToggle"/);
});


test("central knowledge search has a programmatic label and polite result status", () => {
  const app = read("app.js");
  assert.match(app, /<label class=\"sr-only\" for=\"knowledgeSearchInput\">/);
  assert.match(app, /id=\"knowledgeSearchInput\" type=\"search\"/);
  assert.match(app, /data-knowledge-search-status aria-live=\"polite\" aria-atomic=\"true\"/);
});

test("full knowledge search exposes labelled filters, status updates and pressed states", () => {
  assert.match(app, /id=\"knowledgeSearchPageInput\" type=\"search\"/);
  assert.match(app, /data-search-page-status aria-live=\"polite\" aria-atomic=\"true\"/);
  assert.match(app, /data-search-page-filters aria-label=/);
  assert.match(app, /aria-pressed=\"\$\{active\}\"/);
  assert.match(app, /data-search-return aria-label=/);
});

test("generation filter uses native labelled selects and a clear reset action", () => {
  assert.match(app, /data-knowledge-generation-filter aria-label=/);
  assert.match(app, /<select data-knowledge-generation-filter/);
  assert.match(app, /data-knowledge-generation-reset/);
  assert.match(app, /knowledge\.generationFilter\.typeRules/);
});

test("favorite controls expose pressed state, accessible labels and native sort selects", () => {
  const app = read("app.js");
  assert.match(app, /class=\"knowledge-favorite-button/);
  assert.match(app, /aria-pressed=\"\$\{active\}\"/);
  assert.match(app, /aria-label=\"\$\{escapeHtml\(label\)\}\"/);
  assert.match(app, /<label>\$\{t\(\"favorites\.sortLabel\"\)\}<select data-favorite-sort=\"pokemon\"/);
  assert.match(app, /<label>\$\{t\(\"favorites\.sortLabel\"\)\}<select data-favorite-sort=\"types\"/);
});
