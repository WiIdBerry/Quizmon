"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const campaign = require("../campaign.js");
const missions = require("../campaign-missions.js");
const pokemonData = require("../knowledge-data.js");
const contentData = require("../knowledge-content-data.js");
const { read } = require("./helpers.js");

const dataSandbox = {};
const dataSource = fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8");
vm.runInNewContext(`${dataSource}\n;globalThis.__campaignTypeChart=TYPE_CHART;`, dataSandbox, { filename:"data.js" });
const missionContext = Object.freeze({
  pokemonById:pokemonData.BY_ID,
  itemById:contentData.ITEM_BY_ID,
  typeChart:dataSandbox.__campaignTypeChart
});

const ALL_MISSIONS = Object.freeze([
  "pallet-town", "rival-one", "route-one", "viridian-city", "route-twenty-two",
  "rival-two", "route-two", "viridian-forest", "pewter-gym"
]);
const REQUIRED_MISSIONS = Object.freeze([
  "pallet-town", "rival-one", "route-one", "viridian-city", "route-two", "viridian-forest", "pewter-gym"
]);

function finish(progress, nodeId, correct = campaign.MISSION_TOTALS[nodeId], completedAt = "2026-08-13T12:00:00.000Z") {
  const result = { firstRunCorrect:correct, masteredMistakes:campaign.MISSION_TOTALS[nodeId] - correct, completedAt };
  const reward = campaign.missionReward(progress, nodeId, result);
  const recorded = campaign.recordMissionResult(progress, nodeId, result);
  return { progress:campaign.completeNode(recorded, nodeId), reward };
}

test("all five mission types build and every planned answer remains solvable", () => {
  assert.deepEqual(new Set(Object.values(missions.MISSION_SPECS).map(spec => spec.kind)), new Set(["research","trainer","encounter","route","arena"]));
  for (const nodeId of ALL_MISSIONS) {
    const built = missions.buildMission(nodeId, missionContext, () => .37);
    assert.equal(built.length, campaign.MISSION_TOTALS[nodeId], nodeId);
    assert.equal(built.questions.length, built.length, nodeId);
    for (const question of built.questions) {
      assert.equal(question.options.filter(option => option.id === question.correctOptionId).length, 1, question.id);
      assert.equal(missions.isCorrect(question, question.correctOptionId), true, question.id);
      assert.equal(missions.isCorrect(question, "definitely-wrong"), false, question.id);
      const review = missions.buildReviewQuestion(question, 0, () => .42);
      const guided = missions.buildReviewQuestion(question, 2, () => .42);
      assert.ok(review.options.some(option => option.id === question.correctOptionId), `${question.id} review`);
      assert.equal(guided.options.length, 2, `${question.id} guided review`);
      assert.ok(guided.options.some(option => option.id === question.correctOptionId), `${question.id} guided answer`);
    }
  }
});

test("a complete campaign including the optional branch survives a JSON roundtrip", () => {
  let progress = campaign.blankProgress();
  let earnedXp = 0;
  for (const nodeId of ALL_MISSIONS) {
    const completed = finish(progress, nodeId);
    progress = JSON.parse(JSON.stringify(completed.progress));
    earnedXp += completed.reward.totalXp;
    assert.equal(progress.missionResults[nodeId].attempts, 1, nodeId);
    assert.equal(progress.missionResults[nodeId].bestStars, 3, nodeId);
    assert.ok(progress.completedNodeIds.includes(nodeId), nodeId);
  }
  assert.equal(campaign.canClaimChapterReward(progress), true);
  progress = campaign.claimChapterReward(progress, "2026-08-13T13:00:00.000Z");
  earnedXp += campaign.CHAPTER_REWARD_XP;
  const restored = campaign.sanitizeProgress(JSON.parse(JSON.stringify(progress)));
  assert.equal(restored.completedNodeIds.length, 10);
  assert.equal(Object.keys(restored.missionResults).length, 9);
  assert.equal(restored.nextSectionUnlocked, true);
  assert.equal(restored.chapterCompletedAt, "2026-08-13T13:00:00.000Z");
  assert.equal(restored.campaignXpEarned, earnedXp);
  assert.equal(earnedXp, 1820);
});

test("the required story completes without forcing the optional Route 22 branch", () => {
  let progress = campaign.blankProgress();
  for (const nodeId of REQUIRED_MISSIONS) progress = finish(progress, nodeId).progress;
  assert.equal(progress.currentNodeId, "chapter-reward");
  assert.equal(campaign.canClaimChapterReward(progress), true);
  assert.equal(progress.completedNodeIds.includes("route-twenty-two"), false);
  assert.equal(progress.completedNodeIds.includes("rival-two"), false);
  const claimed = campaign.claimChapterReward(progress);
  assert.equal(claimed.nextSectionUnlocked, true);
  assert.equal(campaign.canClaimChapterReward(claimed), false);
  assert.deepEqual(campaign.claimChapterReward(claimed), claimed);
});

test("repeats preserve the best score and never pay completion or star rewards twice", () => {
  let progress = campaign.blankProgress();
  const rewards = [];
  for (const score of [7,7,9,10,10]) {
    const completed = finish(progress, "pallet-town", score);
    progress = completed.progress;
    rewards.push(completed.reward);
  }
  assert.deepEqual(rewards.map(reward => reward.totalXp), [80,15,55,75,15]);
  assert.deepEqual(rewards.map(reward => reward.newStars), [[1],[],[2],[3],[]]);
  assert.deepEqual(rewards.map(reward => reward.completionXp), [60,0,0,0,0]);
  assert.equal(progress.missionResults["pallet-town"].attempts, 5);
  assert.equal(progress.missionResults["pallet-town"].lastFirstRunCorrect, 10);
  assert.equal(progress.missionResults["pallet-town"].bestFirstRunCorrect, 10);
  assert.equal(progress.missionResults["pallet-town"].bestStars, 3);
  assert.equal(progress.campaignXpEarned, 240);
  assert.deepEqual(progress.claimedRewardIds, [
    "mission:pallet-town:complete", "mission:pallet-town:star:1",
    "mission:pallet-town:star:2", "mission:pallet-town:star:3"
  ]);
});

test("legacy campaign rewards migrate once and cannot be collected again after reload", () => {
  const legacy = campaign.sanitizeProgress({
    completedNodeIds:["pallet-town"],
    missionResults:{ "pallet-town":{ lastFirstRunCorrect:9, bestFirstRunCorrect:9, attempts:1 } },
    rewardLedgerVersion:0
  });
  assert.equal(legacy.pendingRewardXp, 110);
  assert.deepEqual(legacy.claimedRewardIds, [
    "mission:pallet-town:complete", "mission:pallet-town:star:1", "mission:pallet-town:star:2"
  ]);
  const consumed = campaign.consumePendingRewards(legacy);
  assert.equal(consumed.xp, 110);
  assert.equal(consumed.progress.pendingRewardXp, 0);
  assert.equal(consumed.progress.campaignXpEarned, 110);
  const reloaded = campaign.consumePendingRewards(JSON.parse(JSON.stringify(consumed.progress)));
  assert.equal(reloaded.xp, 0);
  assert.equal(reloaded.progress.campaignXpEarned, 110);
});

test("damaged saves repair impossible progress, forged rewards and non-finite numbers", () => {
  const repaired = campaign.sanitizeProgress({
    tutorialStep:Infinity,
    completedNodeIds:["pallet-town","pewter-gym","chapter-reward","unknown"],
    unlockedNodeIds:ALL_MISSIONS,
    selectedNodeId:"unknown",
    campaignXpEarned:Infinity,
    pendingRewardXp:999999999,
    rewardLedgerVersion:1,
    claimedRewardIds:["forged","mission:pallet-town:star:1","mission:pallet-town:star:1"],
    lastMapScroll:Infinity,
    chapterCompletedAt:"not-a-date",
    nextSectionUnlocked:true,
    missionResults:{
      "pallet-town":{
        lastFirstRunCorrect:2,
        bestFirstRunCorrect:2,
        bestStars:3,
        masteredMistakes:Infinity,
        attempts:Infinity,
        firstCompletedAt:"2030-01-01T00:00:00.000Z",
        lastCompletedAt:"2020-01-01T00:00:00.000Z"
      },
      "pewter-gym":{ lastFirstRunCorrect:Infinity, bestFirstRunCorrect:Infinity, attempts:-4 }
    }
  });
  assert.deepEqual(repaired.completedNodeIds, ["pallet-town"]);
  assert.deepEqual(repaired.unlockedNodeIds, ["pallet-town","rival-one"]);
  assert.equal(repaired.currentNodeId, "rival-one");
  assert.equal(repaired.selectedNodeId, "rival-one");
  assert.equal(repaired.nextSectionUnlocked, false);
  assert.equal(repaired.chapterCompletedAt, null);
  assert.equal(repaired.campaignXpEarned, 0);
  assert.equal(repaired.pendingRewardXp, 20);
  assert.equal(repaired.lastMapScroll, 0);
  assert.deepEqual(repaired.claimedRewardIds, ["mission:pallet-town:star:1"]);
  assert.equal(repaired.missionResults["pallet-town"].bestStars, 1);
  assert.equal(repaired.missionResults["pallet-town"].masteredMistakes, 0);
  assert.equal(repaired.missionResults["pallet-town"].attempts, 1);
  assert.equal(repaired.missionResults["pallet-town"].lastCompletedAt, "2030-01-01T00:00:00.000Z");
  assert.equal(repaired.missionResults["pewter-gym"].lastFirstRunCorrect, 0);
});

test("campaign animations are staged and respect both reduced motion controls", () => {
  const ui = read("campaign-ui.js");
  const css = read("styles-campaign.css");
  assert.match(ui, /animateMissionIntro:true, animateQuestion:true, animateSummary:false/);
  assert.match(ui, /campaign-result-animated/);
  assert.match(ui, /returnNotice = \{ nodeId:targetId, kind:[^}]+animate:true \}/);
  assert.match(css, /@keyframes campaign-mission-card-in/);
  assert.match(css, /@keyframes campaign-reward-star/);
  assert.match(css, /@keyframes campaign-unlock-ring/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /html\[data-animations="off"\] \.campaign-node\.just-unlocked::before/);
});

test("campaign accessibility covers focus, progress, feedback and keyboard movement", () => {
  const ui = read("campaign-ui.js");
  const css = read("styles-campaign.css");
  assert.match(ui, /role="progressbar" aria-valuemin="0" aria-valuemax=/);
  assert.match(ui, /id="campaignQuestionTitle" tabindex="-1"/);
  assert.match(ui, /role="group" aria-labelledby="campaignQuestionTitle"/);
  assert.match(ui, /id="campaignMissionFeedback"[^>]+role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(ui, /\['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'\]/);
  assert.match(ui, /campaignMissionSummaryTitle" tabindex="-1"/);
  assert.match(ui, /campaignDetailTitle" tabindex="-1"/);
  assert.match(css, /@media \(forced-colors:active\)/);
  assert.match(css, /touch-action:manipulation/);
});

test("the iPhone profile removes the expensive map effects while keeping the artwork", () => {
  const ui = read("campaign-ui.js");
  const css = read("styles-campaign.css");
  assert.match(ui, /fetchpriority="high"/);
  assert.match(css, /@supports \(-webkit-touch-callout:none\)/);
  assert.match(css, /\.campaign-map-landscape img \{ opacity:\.76; filter:none; \}/);
  assert.match(css, /\.campaign-path-line,\.campaign-branch-line[^}]+filter:none/);
  assert.match(css, /\.campaign-node\.current \.campaign-node-button \{ animation:none; \}/);
  assert.match(css, /-webkit-overflow-scrolling:touch/);
});

test("return and storage recovery logic targets the saved map position", () => {
  const ui = read("campaign-ui.js");
  const app = read("app.js");
  assert.match(ui, /function restoreSavedMapPosition/);
  assert.match(ui, /state\(\)\.campaign\.lastMapScroll = top/);
  assert.match(ui, /restoreSavedMapPosition\(targetId, true\)/);
  assert.match(ui, /returnNotice = \{ nodeId:targetId,[^}]+animate:true \}/);
  assert.match(app, /Invalid current save/);
  assert.match(app, /for \(const key of OLD_KEYS\)/);
  assert.match(app, /loadState\.legacy/);
  assert.match(app, /loadState\.storage/);
});
