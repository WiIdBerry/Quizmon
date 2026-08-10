"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { ROOT, read } = require("./helpers.js");

test("all local script, stylesheet and manifest references exist", () => {
  const html = read("index.html");
  const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match => match[1]);
  for (const ref of refs.filter(ref => !ref.startsWith("http") && !ref.startsWith("#"))) {
    assert.ok(fs.existsSync(path.join(ROOT, ref)), `missing ${ref}`);
  }
});

test("CSS imports preserve the intended app-wide cascade", () => {
  const imports = [...read("styles.css").matchAll(/@import url\("(.+?)"\)/g)].map(match => match[1]);
  assert.deepEqual(imports, [
    "./styles-base.css", "./styles-home.css", "./styles-play.css", "./styles-training.css", "./styles-learning.css",
    "./styles-knowledge.css", "./styles-progress.css", "./styles-profile.css", "./styles-motion.css", "./styles-feedback.css",
    "./styles-motivation.css", "./styles-intelligence.css"
  ]);
  for (const ref of imports) assert.ok(fs.existsSync(path.resolve(ROOT, ref)), `missing ${ref}`);
});

test("service worker precaches only the core app shell", () => {
  const sw = read("service-worker.js");
  const block = sw.match(/const SHELL = Object\.freeze\(\[([\s\S]*?)\]\);/)[1];
  const refs = [...block.matchAll(/"\.\/(.*?)"/g)].map(match => match[1]).filter(Boolean);
  for (const ref of refs) assert.ok(fs.existsSync(path.join(ROOT, ref)), `missing shell asset ${ref}`);
  assert.doesNotMatch(block, /assets\/cosmetics/);
  assert.match(sw, /NETWORK_TIMEOUT_MS = 6500/);
  assert.match(sw, /RUNTIME_LIMIT = 180/);
});

test("manifest is valid and exposes PWA shortcuts", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.equal(manifest.name, "Quizmon");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.shortcuts.length, 4);
  assert.equal(manifest.shortcuts[0].url, "./?route=play");
});

test("old product-name remnants are absent from user-facing source", () => {
  const source = ["index.html", "app.js", "i18n.js"].map(read).join("\n");
  assert.doesNotMatch(source, /PokémonTypLearner|PokemonTypLearner/);
});


test("the accepted Phase 2 finalization export remains import-compatible", () => {
  const app = read("app.js");
  assert.match(app, /"phase2-finalization-sprint-v1"/);
});


test("Beta 1.3 preserves the complete Phase 3 knowledge data without eagerly parsing full learnsets", () => {
  const html = read("index.html");
  const sw = read("service-worker.js");
  assert.match(html, /<small>Beta 1\.3<\/small>/);
  assert.match(html, /knowledge-data\.js/);
  assert.match(html, /knowledge-content-data\.js/);
  assert.match(html, /knowledge-learnset-meta\.js/);
  assert.match(html, /knowledge-learnset-loader\.js/);
  assert.doesNotMatch(html, /<script[^>]+src="knowledge-learnset-data\.js"/);
  assert.match(html, /knowledge-engine\.js/);
  assert.match(read("app.js"), /const PUBLIC_VERSION = "Beta 1\.3"/);
  assert.match(read("app.js"), /"3\.1-sprint1-v2"/);
  assert.match(sw, /knowledge-content-data\.js/);
  assert.match(sw, /knowledge-learnset-data\.js/);
  assert.match(sw, /knowledge-learnset-meta\.js/);
  assert.match(sw, /knowledge-learnset-loader\.js/);
});


test("Sprint 2 v3 keeps only the four high-value knowledge categories on the overview", () => {
  const app = read("app.js");
  const home = app.slice(app.indexOf("function renderKnowledgeHome"), app.indexOf("function knowledgeSubpageHeader"));
  assert.match(home, /knowledgeSectionButton\("types"/);
  assert.match(home, /knowledgeSectionButton\("pokemon"/);
  assert.match(home, /knowledgeSectionButton\("moves"/);
  assert.match(home, /knowledgeSectionButton\("items"/);
  assert.doesNotMatch(home, /knowledgeSectionButton\("abilities"/);
  assert.doesNotMatch(home, /knowledgeSectionButton\("evolutions"/);
});

test("Pokémon details expose progressive overview, moves and evolution tabs", () => {
  const app = read("app.js");
  assert.match(app, /knowledgePokemonDetailTab = "overview"/);
  assert.match(app, /data-pokemon-detail-tab/);
  assert.match(app, /QuizmonKnowledgeLearnsets\.groupPokemonEntries/);
  assert.match(app, /knowledgeMovePokemonMarkup/);
});


test("Sprint 2 v3 exposes game selectors and readable evolution conditions", () => {
  const app = read("app.js");
  const css = read("styles-knowledge.css");
  assert.match(app, /data-knowledge-version/);
  assert.match(app, /availableGroupsForPokemon/);
  assert.match(app, /availableGroupsForMove/);
  assert.match(css, /knowledge-version-picker/);
  assert.match(css, /knowledge-evolution-edge small\{[^}]*font-size:11px/);
});

test("Sprint 3 loads and precaches the world knowledge module", () => {
  const html = read("index.html");
  const sw = read("service-worker.js");
  const app = read("app.js");
  assert.match(html, /knowledge-world-data\.js/);
  assert.match(sw, /knowledge-world-data\.js/);
  assert.match(app, /"3\.1-sprint3-v1"/);
  assert.match(app, /"3\.1-sprint2-v3"/);
});

test("Sprint 3 adds world and strategy without changing the four core knowledge categories", () => {
  const app = read("app.js");
  const home = app.slice(app.indexOf("function renderKnowledgeHome"), app.indexOf("function knowledgeSubpageHeader"));
  for (const section of ["types", "pokemon", "moves", "items", "regions", "trainers", "competitive"]) {
    assert.match(home, new RegExp(`knowledgeSectionButton\\(\\"${section}\\"`), section);
  }
  assert.doesNotMatch(home, /knowledgeSectionButton\("abilities"/);
  assert.doesNotMatch(home, /knowledgeSectionButton\("evolutions"/);
});


test("Phase 3.2 Sprint 1 loads, precaches and renders the central knowledge search", () => {
  const html = read("index.html");
  const sw = read("service-worker.js");
  const app = read("app.js");
  const css = read("styles-knowledge.css");
  assert.match(html, /knowledge-search\.js/);
  assert.match(sw, /knowledge-search\.js/);
  assert.match(app, /3\.2-sprint1-v2/);
  assert.match(app, /knowledgeSearchMarkup/);
  assert.match(app, /QuizmonKnowledgeSearch\.search/);
  assert.match(css, /knowledge-search-panel/);
});


test("Phase 3.2 Sprint 1 v2 shows real artwork or sprites in search results where available", () => {
  const app = read("app.js");
  const css = read("styles-knowledge.css");
  assert.match(app, /function knowledgeSearchVisual/);
  assert.match(app, /knowledgeSearchResultCard/);
  assert.match(app, /className:"pokemon-art"/);
  assert.match(app, /className:"item-art"/);
  assert.match(app, /className:"evolution-art"/);
  assert.match(app, /knowledge-search-family-art/);
  assert.match(css, /knowledge-search-result-icon\.pokemon-art/);
  assert.match(css, /knowledge-search-result-icon\.item-art/);
  assert.match(css, /knowledge-search-family-art/);
});

test("Phase 3.2 Sprint 2 provides a full search page, category filters and return navigation", () => {
  const app = read("app.js");
  const css = read("styles-knowledge.css");
  assert.match(app, /function renderKnowledgeSearchPage/);
  assert.match(app, /function renderKnowledgeSearchPageResults/);
  assert.match(app, /knowledgeSearchFilterMarkup/);
  assert.match(app, /data-search-filter/);
  assert.match(app, /data-search-load-more/);
  assert.match(app, /function captureKnowledgeSearchOrigin/);
  assert.match(app, /function returnToKnowledgeSearchResults/);
  assert.match(app, /knowledgeSearchResultScrollY/);
  assert.match(css, /knowledge-search-page-grid/);
  assert.match(css, /knowledge-search-filter\.active/);
});

test("Phase 3.2 Sprint 2 exposes search from catalogues and detail pages with a keyboard shortcut", () => {
  const app = read("app.js");
  assert.match(app, /data-open-knowledge-search/);
  assert.match(app, /function attachKnowledgeDetailSearchLauncher/);
  assert.match(app, /knowledgeSubpageHeader[\s\S]*knowledgeSearchLauncherMarkup/);
  assert.match(app, /event\.key===\"\/\"/);
  assert.match(app, /event\.key\.toLowerCase\(\)===\"k\"/);
});

test("Phase 3.3 Sprint 1 loads and precaches the generation filter", () => {
  const app = read("app.js");
  const html = read("index.html");
  const sw = read("service-worker.js");
  const css = read("styles-knowledge.css");
  assert.match(html, /knowledge-filter\.js/);
  assert.match(sw, /knowledge-filter\.js/);
  assert.match(app, /KNOWLEDGE_GENERATION_FILTER_KEY/);
  assert.match(app, /knowledgeGenerationFilterMarkup/);
  assert.match(app, /data-knowledge-generation-filter/);
  assert.match(app, /knowledgeFilteredItems/);
  assert.match(app, /generation:knowledgeSelectedGeneration\(\)/);
  assert.match(css, /knowledge-generation-filter/);
  assert.match(css, /knowledge-generation-empty/);
});

test("current build and the single service-worker registration are consistent", () => {
  const app = read("app.js");
  const html = read("index.html");
  const sw = read("service-worker.js");
  const pkg = JSON.parse(read("package.json"));
  const combined = `${html}
${app}`;
  assert.match(app, /const BUILD_VERSION = "4\.1-sprint3-v8"/);
  assert.match(app, /service-worker\.js\?build=4\.1-sprint3-v8/);
  assert.doesNotMatch(html, /navigator\.serviceWorker\.register/);
  assert.equal((combined.match(/navigator\.serviceWorker\.register/g) || []).length, 1);
  assert.match(sw, /const BUILD = "4\.1-sprint3-v8"/);
  assert.equal(pkg.version, "1.3.0-4.1-sprint3.8");
  assert.match(app, /"3\.5-sprint2-v2"/);
});


test("Phase 3.3 Sprint 1 v2 separates learning and knowledge in the seven-area main menu", () => {
  const app = read("app.js");
  const router = read("router.js");
  const home = app.slice(app.indexOf("function renderHome"), app.indexOf("function renderProfile"));
  const learn = app.slice(app.indexOf("function renderLearn()"), app.indexOf("function pathImpactSpec"));
  const routes = ["play","train","learn","knowledge","stats","settings","support"];
  const positions = routes.map(route => home.indexOf(`gameMenuButton("${route}"`));
  positions.forEach((position,index) => assert.ok(position >= 0, routes[index]));
  assert.deepEqual(positions, [...positions].sort((a,b)=>a-b));
  assert.match(home, /expanded-main-menu/);
  assert.match(app, /function renderKnowledgePage/);
  assert.match(app, /function renderFutureArea/);
  assert.match(learn, /--tab-count:3/);
  assert.doesNotMatch(learn, /data-learn-tab=\"knowledge\"/);
  assert.match(router, /\"play\"/);
  assert.match(router, /\"knowledge\"/);
  assert.match(router, /\"support\"/);
  assert.match(read("styles-home.css"), /expanded-main-menu.*repeat\(7/s);
  assert.match(read("styles-intelligence.css"), /daily-goal-card\{margin-top:auto\}/);
});


test("Phase 3.3 Sprint 1 v3 enlarges the desktop main-menu typography and unifies Trainieren colors", () => {
  const app = read("app.js");
  const css = read("styles-home.css");
  const home = app.slice(app.indexOf("function renderHome"), app.indexOf("function renderProfile"));
  const trainingCall = 'gameMenuButton("train", iconSvg("train"), "02", t("home.gameTrain"), t("home.gameTrainDesc"))';
  assert.ok(home.includes(trainingCall));
  assert.ok(!home.includes(`${trainingCall.slice(0,-1)}, true)`));
  assert.match(css, /expanded-main-menu-panel \.game-panel-heading span\{font-size:16px\}/);
  assert.match(css, /expanded-main-menu-panel \.game-panel-heading small\{font-size:12px\}/);
  assert.match(css, /expanded-main-menu \.game-menu-number\{font-size:10px\}/);
  assert.match(css, /expanded-main-menu \.game-menu-copy strong\{font-size:17px/);
  assert.match(css, /expanded-main-menu \.game-menu-copy small\{[^}]*font-size:11px/);
});


test("Phase 3.4 Sprint 1 integrates local Pokémon and type favorites throughout the knowledge world", () => {
  const app = read("app.js");
  const html = read("index.html");
  const sw = read("service-worker.js");
  const css = read("styles-knowledge.css");
  assert.match(html, /favorites\.js/);
  assert.match(sw, /favorites\.js/);
  assert.match(app, /favorites: \{ pokemon: \[\], types: \[\]/);
  assert.match(app, /QuizmonFavorites\.sanitize/);
  assert.match(app, /knowledgeFavoriteButton/);
  assert.match(app, /renderKnowledgeFavorites/);
  assert.match(app, /knowledgeSectionButton\("favorites"/);
  assert.match(app, /data-favorite-kind/);
  assert.match(app, /syncProfileFavoritesIntoCollection/);
  assert.match(css, /knowledge-favorite-button/);
  assert.match(css, /knowledge-favorites-page/);
});


test("Phase 3.4 Sprint 2 integrates local training lists with knowledge and quiz systems", () => {
  const app = read("app.js");
  const html = read("index.html");
  const sw = read("service-worker.js");
  const css = read("styles-knowledge.css");
  assert.match(html, /training-lists\.js/);
  assert.match(sw, /training-lists\.js/);
  assert.match(app, /trainingLists: \{ lists: \[\] \}/);
  assert.match(app, /QuizmonTrainingLists\.sanitize/);
  assert.match(app, /renderKnowledgeTrainingLists/);
  assert.match(app, /openTrainingListEditor/);
  assert.match(app, /openTrainingListLaunch/);
  assert.match(app, /startTrainingListSession/);
  assert.match(app, /allowedTypes/);
  assert.match(app, /trainingListId:session\.trainingList/);
  assert.match(css, /training-list-editor-modal/);
  assert.match(css, /training-lists-grid/);
});

test("Phase 3.5 Sprint 1 integrates the complete flashcard foundation", () => {
  const html = read("index.html");
  const sw = read("service-worker.js");
  const app = read("app.js");
  const css = read("styles-learning.css");
  assert.match(html, /flashcards\.js/);
  assert.match(sw, /flashcards\.js/);
  assert.match(app, /data-learn-tab="cards"/);
  assert.match(app, /function renderFlashcardSetup/);
  assert.match(app, /function renderFlashcards/);
  assert.match(app, /QuizmonFlashcards\.createSession/);
  assert.match(app, /data-flashcard-count/);
  assert.match(app, /data-flashcard-reveal/);
  assert.match(app, /flashcardSwipeStartX/);
  assert.match(app, /event\.key==="ArrowRight"/);
  assert.match(css, /flashcard-kind-grid/);
  assert.match(css, /flashcard-card\.is-revealed/);
  assert.match(css, /data-animations="off".*flashcard-card-inner/s);
});


test("Phase 3.5 Sprint 1 v2 labels type-card effects with explicit multipliers", () => {
  const app = read("app.js");
  const css = read("styles-learning.css");
  assert.match(app, /flashcardTypeList\("2×",t\("learn\.strongAgainst"\)/);
  assert.match(app, /flashcardTypeList\("2×",t\("learn\.vulnerable"\)/);
  assert.match(app, /flashcardTypeList\("½×",t\("learn\.resists"\)/);
  assert.match(app, /flashcardTypeList\("0×",t\("learn\.immune"\)/);
  assert.match(css, /flashcard-fact-group>small b\{[^}]*font-size:16px/);
});

test("Phase 3.5 Sprint 2 integrates personal card sources, self-assessment and review summaries", () => {
  const app = read("app.js");
  const flashcards = read("flashcards.js");
  const css = read("styles-learning.css");
  assert.match(app, /flashcards: \{ review: \[\], history: \[\] \}/);
  assert.match(app, /function flashcardSourceOptions/);
  assert.match(app, /function flashcardWeakTypes/);
  assert.match(app, /function flashcardFavoriteItems/);
  assert.match(app, /function flashcardListItems/);
  assert.match(app, /data-flashcard-source/);
  assert.match(app, /data-flashcard-generation/);
  assert.match(app, /data-flashcard-rating/);
  assert.match(app, /function flashcardSummaryMarkup/);
  assert.match(app, /QuizmonFlashcards\.applySessionToLearningState/);
  assert.match(flashcards, /const RATINGS = Object\.freeze\(\["known", "unsure", "unknown"\]\)/);
  assert.match(flashcards, /function rateCurrent/);
  assert.match(flashcards, /function repeatUnresolved/);
  assert.match(flashcards, /function sanitizeLearningState/);
  assert.match(css, /flashcard-rating/);
  assert.match(css, /flashcard-summary/);
  assert.match(css, /flashcards-source-section/);
});


test("Phase 3.5 Sprint 2 v2 uses clear personal-source wording and translated generation options", () => {
  const app = read("app.js");
  const i18n = read("i18n.js");
  assert.match(i18n, /"flashcards\.sourceWeakPokemon": "Pokémon aus schwierigen Typbereichen"/);
  assert.match(i18n, /deren Typen dir im Training bisher häufiger Schwierigkeiten bereiten/);
  assert.match(app, /t\("knowledge\.generationFilter\.all"\)/);
  assert.match(app, /t\("knowledge\.generationFilter\.option",\{generation\}\)/);
  assert.doesNotMatch(app, /t\("knowledge\.filter\.(?:all|generation)"/);
});
