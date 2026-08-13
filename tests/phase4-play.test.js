"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { read } = require("./helpers.js");

test("Phase 4.1 play mode remains integrated in the Phase 4.3 build", () => {
  const app = read("app.js");
  const html = read("index.html");
  const sw = read("service-worker.js");
  assert.match(html, /<small>Beta 1\.3<\/small>/);
  assert.match(html, /whos-that-pokemon\.js/);
  assert.ok(html.indexOf("whos-that-pokemon.js") < html.indexOf("app.js"));
  assert.match(app, /const PUBLIC_VERSION = "Beta 1\.3"/);
  assert.match(app, /const BUILD_VERSION = "4\.3-sprint5-v1"/);
  assert.match(app, /const DATA_SCHEMA = 23/);
  assert.match(app, /state\.route === "play"\) renderPlay\(\)/);
  assert.match(app, /state\.route === "pokeidle"\) renderPokeidle\(\)/);
  assert.match(app, /function renderWhosSetup/);
  assert.match(app, /function renderWhosRound/);
  assert.match(sw, /whos-that-pokemon\.js/);
  assert.match(sw, /styles-play\.css/);
});

test("Play presents PokéIdle and Campaign as two equal mode cards", () => {
  const app = read("app.js");
  const ui = read("play-mode-ui.js");
  const css = read("styles-play.css");
  const play = app.slice(app.indexOf("function renderPlay"), app.indexOf("function renderCampaign"));
  assert.match(play, /QuizmonPlayModeUI\.markup/);
  assert.match(play, /getElementById\("openPokeidle"\)/);
  assert.match(play, /getElementById\("openCampaign"\)/);
  assert.match(ui, /class="play-mode-grid"/);
  assert.equal((ui.match(/class="play-mode-card/g) || []).length, 2);
  assert.match(ui, /assets\/pokeidle-symbol\.png/);
  assert.match(ui, /assets\/campaign-kanto-chapter-1-background\.png/);
  assert.match(css, /\.play-mode-grid \{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/s);
  assert.match(css, /@media \(max-width:620px\)[\s\S]*\.play-mode-grid \{ grid-template-columns:1fr/);
});

test("the PokéIdle setup uses the approved symbol and contains only its retained controls", () => {
  const app = read("app.js");
  const css = read("styles-play.css");
  const setup = app.slice(app.indexOf("function renderWhosSetup"), app.indexOf("function whosLivesMarkup"));
  assert.match(setup, /assets\/pokeidle-symbol\.png/);
  assert.match(setup, /whosDailyCardMarkup/);
  assert.match(setup, /whosDifficultyCard\("easy"/);
  assert.match(setup, /id="startWhosRound"/);
  assert.doesNotMatch(setup, /campaign-entry-card|id="openCampaign"/);
  assert.doesNotMatch(setup, /whos-mode-meta|whos\.kicker|whos\.difficultyText|whos-rules-card|whosStatisticsMarkup/);
  assert.doesNotMatch(setup, /difficulty\.[^`]+Desc/);
  assert.match(css, /\.whos-hero-symbol/);
  assert.doesNotMatch(css, /\.whos-hero-orb/);
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
  assert.match(app, /id="skipWhosHint"/);
  assert.match(app, /QuizmonWhosThatPokemon\.skipHint/);
  assert.match(app, /id="giveUpWhosRound"/);
  assert.match(app, /QuizmonWhosThatPokemon\.giveUp/);
  assert.match(app, /state\.whosThat\.round = null; whosSuggestionQuery = ""/);
  assert.match(css, /\.whos-leave-round/);
  assert.match(css, /\.whos-skip-hint/);
  assert.match(css, /\.whos-give-up/);
});

test("the active round uses the approved reduced single-column hierarchy", () => {
  const app = read("app.js");
  const css = read("styles-play.css");
  const stage = app.slice(app.indexOf("function whosCurrentStageMarkup"), app.indexOf("function whosDiscoveredHintsMarkup"));
  const round = app.slice(app.indexOf("function renderWhosRound"), app.indexOf("function renderPlay"));
  assert.match(stage, /assets\/pokeidle-symbol\.png/);
  assert.doesNotMatch(stage, /whos-mystery-orb|whos\.currentHint|whos\.stageQuestion|whos\.riskHint|whos\.lastHint|whos\.skipHintMeta/);
  assert.doesNotMatch(round, /whos\.roundProgress/);
  assert.ok(round.indexOf("whosCurrentStageMarkup") < round.indexOf("whosDiscoveredHintsMarkup"));
  assert.ok(round.indexOf("whosDiscoveredHintsMarkup") < round.indexOf("whos-answer-panel"));
  assert.match(css, /\.whos-game-layout \{[^}]*grid-template-columns:minmax\(0,1fr\)/s);
  assert.match(css, /\.whos-stage-body \{[^}]*grid-template-columns:minmax\(0,1fr\)/s);
  assert.match(css, /\.whos-answer-panel \{[^}]*position:static/s);
});

test("the score is tied to revealed clues while skips preserve lives", () => {
  const engine = read("whos-that-pokemon.js");
  const translations = read("i18n.js");
  assert.match(engine, /const POINTS_BY_HINT/);
  assert.match(engine, /function skipHint/);
  assert.match(translations, /"whos\.skipHint": "Hinweis überspringen"/);
  assert.match(translations, /"whos\.skipHintMeta"/);
  assert.match(translations, /"whos\.ruleBalance": "Innerhalb der gewählten Schwierigkeit richten sich die Punkte nach dem höchsten freigeschalteten Hinweis/);
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
  const sw = read("service-worker.js");
  assert.match(app, /difficulty === "easy" \? Number\.POSITIVE_INFINITY/);
  assert.match(app, /difficulty === "hard" \? 0\.55 : 1\.6/);
  assert.match(app, /<source src="\$\{escapeHtml\(cry\.mp3\)\}" type="audio\/mpeg">/);
  assert.match(app, /<source src="\$\{escapeHtml\(cry\.ogg\)\}" type="audio\/ogg">/);
  assert.ok(app.indexOf('type="audio/mpeg"') < app.indexOf('type="audio/ogg"'));
  assert.match(app, /audio\.readyState === 0/);
  assert.match(app, /const playback = audio\.play\(\)/);
  assert.match(sw, /play\.pokemonshowdown\.com/);
});

test("the give-up action replaces skipping only after clue five", () => {
  const engine = read("whos-that-pokemon.js");
  const app = read("app.js");
  const translations = read("i18n.js");
  assert.match(engine, /function giveUp/);
  assert.match(engine, /reason: "hintsRemaining"/);
  assert.match(app, /const canGiveUp = round\.status === "active" && round\.revealed >= round\.hints\.length/);
  assert.match(app, /canSkip \? .*id="skipWhosHint".*: canGiveUp \? .*id="giveUpWhosRound"/s);
  assert.match(translations, /"whos\.giveUp": "Aufgeben"/);
  assert.match(translations, /"whos\.giveUp": "Give up"/);
});

test("the public play-mode name is PokéIdle in German and English", () => {
  const translations = read("i18n.js");
  assert.match(translations, /"whos\.title": "PokéIdle"/);
  assert.match(translations, /"whos\.daily\.title": "Tages-PokéIdle"/);
  assert.match(translations, /"whos\.daily\.title": "Daily PokéIdle"/);
  assert.doesNotMatch(translations, /"whos\.title": "Who's That Pokémon\?"/);
});
