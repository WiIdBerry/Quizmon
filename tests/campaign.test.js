"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const campaign = require("../campaign.js");
const campaignUI = require("../campaign-ui.js");
const router = require("../router.js");
const { ROOT, read } = require("./helpers.js");

test("campaign chapter follows the approved ten-stop story with a two-node optional branch", () => {
  assert.equal(campaign.REGION_ID, "kanto");
  assert.equal(campaign.CHAPTER_ID, "journey-begins");
  assert.equal(campaign.NODES.length, 10);
  assert.equal(campaign.NODES[0].id, "pallet-town");
  assert.equal(campaign.NODES.at(-1).id, "chapter-reward");
  assert.ok(campaign.NODES.every((node, index, nodes) => index === 0 || node.y > nodes[index - 1].y));
  assert.deepEqual(campaign.NODES.filter(node => !node.required).map(node => node.id), ["route-twenty-two", "rival-two"]);
  assert.deepEqual(campaign.NODES.filter(node => node.branch).map(node => node.id), ["route-twenty-two", "rival-two"]);
  assert.equal(campaign.NODES.filter(node => node.required).length, 8);
});

test("campaign nodes use the approved place and event icon system", () => {
  const expected = {
    "pallet-town":"city",
    "rival-one":"battle",
    "route-one":"route",
    "viridian-city":"city",
    "route-twenty-two":"route",
    "rival-two":"battle",
    "route-two":"route",
    "viridian-forest":"route",
    "pewter-gym":"arena",
    "chapter-reward":"reward"
  };
  assert.deepEqual(Object.fromEntries(campaign.NODES.map(node => [node.id, node.icon])), expected);
  assert.deepEqual(Object.keys(campaignUI.ICON_FILES), ["route", "city", "battle", "reward", "arena"]);
});

test("all five approved campaign icons are valid transparent SVG assets and cached offline", () => {
  const sw = read("service-worker.js");
  for (const [kind, relative] of Object.entries(campaignUI.ICON_FILES)) {
    const markup = fs.readFileSync(path.join(ROOT, relative), "utf8");
    const visibleMarkup = markup.replace(/<defs>[\s\S]*?<\/defs>/g, "");
    assert.match(markup, /<svg[^>]+viewBox="0 0 96 96"/);
    assert.match(markup, /currentColor/);
    assert.doesNotMatch(visibleMarkup, /<rect[^>]+width="(?:96|100%)"[^>]+fill=/, `${kind} must not add a rectangular background`);
    assert.match(sw, new RegExp(relative.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("premium campaign landscape is a real PNG background cached offline", () => {
  const relative = "assets/campaign-kanto-chapter-1-background.png";
  const bytes = fs.readFileSync(path.join(ROOT, relative));
  assert.deepEqual([...bytes.subarray(0, 8)], [137,80,78,71,13,10,26,10]);
  assert.ok(bytes.length > 1000000);
  assert.match(read("campaign-ui.js"), new RegExp(relative.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(read("service-worker.js"), new RegExp(relative.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("campaign progress repairs imported data without unlocking future nodes", () => {
  const clean = campaign.sanitizeProgress({
    tutorialComplete: true,
    tutorialStep: 99,
    currentNodeId: "missing",
    selectedNodeId: "route-one",
    completedNodeIds: ["pallet-town", "missing", "pallet-town"],
    unlockedNodeIds: ["route-one", "missing"],
    missionResults:{
      "pallet-town":{ lastFirstRunCorrect:9, bestFirstRunCorrect:99, masteredMistakes:1, attempts:2 },
      "missing":{ lastFirstRunCorrect:10 }
    },
    lastMapScroll: -30
  });
  assert.equal(clean.tutorialComplete, true);
  assert.equal(clean.tutorialStep, 3);
  assert.equal(clean.currentNodeId, "rival-one");
  assert.equal(clean.selectedNodeId, "route-one");
  assert.deepEqual(clean.completedNodeIds, ["pallet-town"]);
  assert.deepEqual(clean.unlockedNodeIds, ["pallet-town", "rival-one"]);
  assert.deepEqual(clean.missionResults, {
    "pallet-town":{ lastFirstRunCorrect:9, bestFirstRunCorrect:10, total:10, requiredCorrect:8, lastDirectGoalMet:true, masteredMistakes:1, attempts:2 }
  });
  assert.equal(clean.lastMapScroll, 0);
  assert.equal(campaign.nodeStatus(clean, "pallet-town"), "complete");
  assert.equal(campaign.nodeStatus(clean, "route-one"), "locked");
  assert.equal(campaign.nodeStatus(clean, "rival-one"), "current");
});

test("campaign retains first-run scores separately from mastered mistakes", () => {
  let progress = campaign.recordMissionResult(campaign.blankProgress(), "pallet-town", { firstRunCorrect:7, masteredMistakes:3 });
  assert.deepEqual(progress.missionResults["pallet-town"], {
    lastFirstRunCorrect:7, bestFirstRunCorrect:7, total:10, requiredCorrect:8, lastDirectGoalMet:false, masteredMistakes:3, attempts:1
  });
  progress = campaign.recordMissionResult(progress, "pallet-town", { firstRunCorrect:9, masteredMistakes:1 });
  assert.deepEqual(progress.missionResults["pallet-town"], {
    lastFirstRunCorrect:9, bestFirstRunCorrect:9, total:10, requiredCorrect:8, lastDirectGoalMet:true, masteredMistakes:1, attempts:2
  });
  progress = campaign.recordMissionResult(progress, "pallet-town", { firstRunCorrect:8, masteredMistakes:2 });
  assert.equal(progress.missionResults["pallet-town"].lastFirstRunCorrect, 8);
  assert.equal(progress.missionResults["pallet-town"].bestFirstRunCorrect, 9);
});

test("campaign is integrated as an inner route and remains separate from PokéIdle", () => {
  const app = read("app.js");
  const ui = read("campaign-ui.js");
  const playUi = read("play-mode-ui.js");
  const html = read("index.html");
  const sw = read("service-worker.js");
  assert.equal(router.validRoute("campaign"), true);
  assert.equal(router.isInnerRoute("campaign"), true);
  assert.match(app, /state\.route === "campaign"\) renderCampaign\(\)/);
  assert.match(app, /getElementById\("openCampaign"\)/);
  assert.match(playUi, /id="openCampaign"/);
  assert.match(app, /function renderWhosSetup/);
  assert.match(app, /function renderCampaign\(\) \{\s*campaignUI\.render\(\);/);
  assert.match(app, /QuizmonCampaignUI\.createController/);
  assert.equal(typeof campaignUI.createController, "function");
  assert.match(ui, /function createController/);
  assert.ok(html.indexOf("campaign.js") < html.indexOf("campaign-ui.js"));
  assert.ok(html.indexOf("campaign-missions.js") < html.indexOf("campaign-ui.js"));
  assert.ok(html.indexOf("campaign-ui.js") < html.indexOf("app.js"));
  assert.match(sw, /campaign\.js/);
  assert.match(sw, /campaign-missions\.js/);
  assert.match(sw, /campaign-ui\.js/);
  assert.match(sw, /styles-campaign\.css/);
});

test("Professor Berry exists only inside the four-step campaign tutorial", () => {
  const app = read("app.js");
  const ui = read("campaign-ui.js");
  const occurrences = ui.match(/assets\/professor-berry\.png/g) || [];
  assert.equal(campaign.TUTORIAL_STEPS, 4);
  assert.equal(occurrences.length, 1);
  assert.doesNotMatch(app, /assets\/professor-berry\.png/);
  assert.match(ui, /campaign-tutorial-berry/);
  assert.match(ui, /tutorialStep === campaign\.TUTORIAL_STEPS - 1/);
  assert.match(ui, /state\(\)\.campaign\.tutorialComplete = true/);
  assert.match(app, /restartCampaignTutorial/);
});

test("Professor Berry asset is a real transparent PNG", () => {
  const bytes = fs.readFileSync(path.join(ROOT, "assets/professor-berry.png"));
  assert.deepEqual([...bytes.subarray(0, 8)], [137,80,78,71,13,10,26,10]);
  assert.equal(bytes[25], 6, "PNG must use RGBA colour type");
  assert.ok(bytes.length > 100000);
});

test("campaign map exposes distinct current, locked, special and responsive states", () => {
  const ui = read("campaign-ui.js");
  const css = read("styles-campaign.css");
  assert.match(ui, /data-campaign-tutorial-target="\$\{node\.id === currentState\.campaign\.currentNodeId \? "current"/);
  assert.match(ui, /campaign-path-line/);
  assert.match(ui, /campaign-branch-line/);
  assert.match(css, /\.campaign-node\.current \.campaign-node-button/);
  assert.match(css, /\.campaign-node\.locked \.campaign-node-button/);
  assert.match(css, /\.campaign-node-state-badge\.is-locked/);
  assert.match(css, /\.campaign-node-state-badge\.is-complete/);
  assert.match(css, /\.campaign-node-icon/);
  assert.match(ui, /\$\{icon\(node\.icon\)\}\$\{stateBadge\(status\)\}/);
  assert.doesNotMatch(ui, /status === "complete" \? '<svg/);
  assert.match(css, /\.campaign-node-button \{[^}]*max-width:none/);
  assert.match(css, /\.campaign-tutorial-backdrop\.is-intro/);
  assert.match(css, /\.campaign-tutorial-actions button\[hidden\] \{ display:none; \}/);
  assert.match(css, /box-shadow:[^;]*9999px/);
  assert.match(css, /@media \(max-width:760px\)/);
  assert.match(css, /min-height:44px/);
});

test("campaign tutorial targets real node buttons and keeps the dialog raised", () => {
  const ui = read("campaign-ui.js");
  const css = read("styles-campaign.css");
  assert.match(ui, /if \(!target\) return null;\s*return target\?\.querySelector\("\.campaign-node-button"\) \|\| target;/);
  assert.match(ui, /if \(campaign\.normalizeTutorialStep\(step\) === 0\) return null;/);
  assert.match(ui, /prepareTutorialViewport/);
  assert.match(ui, /if \(startingTutorial\) \{\s*preparedScrollTop = prepareTutorialViewport\(\);\s*win\.requestAnimationFrame\(finishReveal\)/);
  assert.match(ui, /if \(modalRoot\.querySelector\("\.campaign-tutorial-backdrop"\)\) return;/);
  assert.match(ui, /win\.addEventListener\("scroll", update, true\)/);
  assert.match(ui, /lockTutorialScroll/);
  assert.match(ui, /keepTutorialPosition/);
  assert.match(ui, /"wheel", preventUserScroll/);
  assert.match(ui, /"touchmove", preventUserScroll/);
  assert.match(css, /\.campaign-tutorial-scroll-locked/);
  assert.match(css, /padding:24px 24px clamp\(68px,9vh,104px\)/);
});

test("Quizmon is permanently dark and no theme switch remains", () => {
  const app = read("app.js");
  const html = read("index.html");
  const base = read("styles-base.css");
  assert.match(html, /<html lang="de" data-theme="dark">/);
  assert.doesNotMatch(html, /prefers-color-scheme: light/);
  assert.match(app, /function actualTheme\(\) \{\s*return "dark";/);
  assert.match(app, /repaired\.theme = "dark"/);
  assert.doesNotMatch(app, /id="themeToggle"/);
  assert.match(base, /:root \{\s*color-scheme: dark;/);
});
