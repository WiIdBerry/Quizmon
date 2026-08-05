const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("visual refresh stylesheet is loaded and cached", () => {
  assert.match(read("styles.css"), /styles-visual-refresh\.css/);
  assert.match(read("service-worker.js"), /styles-visual-refresh\.css/);
  assert.ok(fs.existsSync(path.join(root, "styles-visual-refresh.css")));
});

test("home prioritizes PokéIdle and campaign without duplicate menu", () => {
  const app = read("app.js");
  const home = app.slice(app.indexOf("function renderHome()"), app.indexOf("function renderProfile()"));
  assert.match(home, /refreshedHomePlayMarkup/);
  assert.match(home, /data-home-play='pokeidle'/);
  assert.doesNotMatch(home, /expanded-main-menu/);
  assert.doesNotMatch(home, /homeAdaptiveCardMarkup/);
});

test("campaign teaser is non-interactive and clearly marked", () => {
  const app = read("app.js");
  assert.match(app, /refresh-play-card campaign is-coming/);
  assert.match(app, /home\.refreshCampaignComing/);
  assert.doesNotMatch(app, /data-home-play="campaign"/);
});

test("bottom navigation contains exactly five concise destinations", () => {
  const html = read("index.html");
  const nav = html.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || "";
  const routes = [...nav.matchAll(/data-route="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(routes, ["home", "train", "learn", "stats", "settings"]);
});

test("new home labels exist in German and English", () => {
  const i18n = read("i18n.js");
  for (const key of ["home.refreshTitleLead", "home.refreshPokeidleTitle", "home.refreshCampaignComing", "home.refreshStreakTitle"]) {
    assert.equal(i18n.split(`"${key}"`).length - 1, 2, key);
  }
});

test("visual refresh uses original abstract home artwork", () => {
  const app = read("app.js");
  const css = read("styles-visual-refresh.css");
  assert.match(app, /refresh-hero-orb/);
  assert.match(app, /campaign-path/);
  assert.match(css, /\.idle-orb/);
  assert.match(css, /\.campaign-gate/);
  assert.doesNotMatch(css, /url\(/i);
});
test("knowledge world stays reachable from the Learn area", () => {
  const app = read("app.js");
  assert.match(app, /id="openKnowledgeWorldFromLearn"/);
  assert.match(app, /setRoute\("knowledge"\)/);
});

