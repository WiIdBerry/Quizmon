"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { read } = require("./helpers.js");

test("Phase 4.1 play mode remains integrated in the Sprint 3 build", () => {
  const app = read("app.js");
  const html = read("index.html");
  const sw = read("service-worker.js");
  assert.match(html, /<small>Beta 1\.3<\/small>/);
  assert.match(html, /whos-that-pokemon\.js/);
  assert.ok(html.indexOf("whos-that-pokemon.js") < html.indexOf("app.js"));
  assert.match(app, /const PUBLIC_VERSION = "Beta 1\.3"/);
  assert.match(app, /const BUILD_VERSION = "4\.1-sprint3-v1"/);
  assert.match(app, /const DATA_SCHEMA = 19/);
  assert.match(app, /state\.route === "play"\) renderPlay\(\)/);
  assert.match(app, /function renderWhosSetup/);
  assert.match(app, /function renderWhosRound/);
  assert.match(sw, /whos-that-pokemon\.js/);
  assert.match(sw, /styles-play\.css/);
});

test("the play UI exposes five lives, five clues, valid search and mobile layouts", () => {
  const app = read("app.js");
  const css = read("styles-play.css");
  assert.match(app, /Array\.from\(\{ length: round\.maxLives \}/);
  assert.match(app, /round\.hints\.map/);
  assert.match(app, /findPokemonByName/);
  assert.match(app, /reason === "duplicate"/);
  assert.match(app, /whosSuggestions/);
  assert.match(css, /\.whos-round-layout/);
  assert.match(css, /@media \(max-width:620px\)/);
  assert.match(css, /min-height:48px/);
  assert.match(css, /min-height:47px/);
});

test("Sprint 2 renders visual and audio clues with controls and fallbacks", () => {
  const engine = read("whos-that-pokemon.js");
  const app = read("app.js");
  const css = read("styles-play.css");
  assert.match(engine, /"shadow", "pixel", "crop", "cry"/);
  assert.match(engine, /mediaPositions = mediaCount === 2 \? \[4, 5\]/);
  assert.match(app, /function whosHintContentMarkup/);
  assert.match(app, /data-whos-cry-play/);
  assert.match(app, /whos-media-fallback/);
  assert.match(css, /\.whos-shadow-hint/);
  assert.match(css, /\.whos-pixel-hint/);
  assert.match(css, /\.whos-crop-hint/);
});
