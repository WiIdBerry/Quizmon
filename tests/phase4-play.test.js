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
  assert.match(app, /const BUILD_VERSION = "4\.1-sprint3-v4"/);
  assert.match(app, /const DATA_SCHEMA = 19/);
  assert.match(app, /state\.route === "play"\) renderPlay\(\)/);
  assert.match(app, /function renderWhosSetup/);
  assert.match(app, /function renderWhosRound/);
  assert.match(sw, /whos-that-pokemon\.js/);
  assert.match(sw, /styles-play\.css/);
});

test("the play UI exposes five lives, a focused clue stage and a persistent guess action", () => {
  const app = read("app.js");
  const css = read("styles-play.css");
  assert.match(app, /Array\.from\(\{ length: round\.maxLives \}/);
  assert.match(app, /round\.hints\.map/);
  assert.match(app, /findPokemonByName/);
  assert.match(app, /reason === "duplicate"/);
  assert.match(app, /whosSuggestions/);
  assert.match(css, /\.whos-game-layout/);
  assert.match(css, /\.whos-current-stage/);
  assert.match(css, /\.whos-progress-step/);
  assert.match(app, /id="whosGuessSubmit"/);
  assert.match(app, /id="whosGuessSelection"/);
  assert.match(css, /\.whos-guess-submit/);
  assert.match(css, /\.whos-suggestions \{[^}]*position:relative/s);
  assert.doesNotMatch(css, /\.whos-suggestions \{[^}]*position:absolute/s);
  assert.match(css, /@media \(max-width:620px\)/);
  assert.match(css, /min-height:50px/);
  assert.match(css, /min-height:49px/);
  assert.match(app, /id="leaveWhosRound"/);
  assert.match(app, /state\.whosThat\.round = null; whosSuggestionQuery = ""/);
  assert.match(css, /\.whos-leave-round/);
});

test("wrong guesses add strategic generation, type, height and weight comparisons", () => {
  const app = read("app.js");
  const css = read("styles-play.css");
  const translations = read("i18n.js");
  assert.match(app, /function whosComparisonMarkup/);
  assert.match(app, /matchingTypes/);
  assert.match(app, /guessed\.generation/);
  assert.match(app, /guessed\.height/);
  assert.match(app, /guessed\.weight/);
  assert.match(css, /\.whos-compare-grid/);
  assert.match(translations, /"whos\.compare\.typesNone"/);
});

test("Sprint 2 renders visual and audio clues with controls and fallbacks", () => {
  const engine = read("whos-that-pokemon.js");
  const app = read("app.js");
  const css = read("styles-play.css");
  assert.match(engine, /"shadow", "pixel", "crop", "cry"/);
  assert.match(engine, /selectedMediaKinds.*sort/);
  assert.match(app, /function whosHintContentMarkup/);
  assert.match(app, /data-whos-cry-play/);
  assert.match(app, /whos-media-fallback/);
  assert.match(css, /\.whos-shadow-hint/);
  assert.match(css, /\.whos-pixel-hint/);
  assert.match(css, /\.whos-crop-hint/);
});

test("easy PokéIdle plays the complete cry and keeps medium and hard excerpts", () => {
  const app = read("app.js");
  assert.match(app, /difficulty === "easy" \? Number\.POSITIVE_INFINITY/);
  assert.match(app, /difficulty === "hard" \? 0\.55 : 1\.6/);
});

test("the public play-mode name is PokéIdle in German and English", () => {
  const translations = read("i18n.js");
  assert.match(translations, /"whos\.title": "PokéIdle"/);
  assert.match(translations, /"whos\.daily\.title": "Tages-PokéIdle"/);
  assert.match(translations, /"whos\.daily\.title": "Daily PokéIdle"/);
  assert.doesNotMatch(translations, /"whos\.title": "Who's That Pokémon\?"/);
});
