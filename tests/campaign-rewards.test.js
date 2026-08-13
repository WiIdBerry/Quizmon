"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const campaign = require("../campaign.js");

const REQUIRED_MISSIONS = ["pallet-town", "rival-one", "route-one", "viridian-city", "route-two", "viridian-forest", "pewter-gym"];

function finish(progress, nodeId, correct, completedAt = "2026-08-13T12:00:00.000Z") {
  const result = { firstRunCorrect:correct, masteredMistakes:campaign.MISSION_TOTALS[nodeId] - correct, completedAt };
  const reward = campaign.missionReward(progress, nodeId, result);
  const recorded = campaign.recordMissionResult(progress, nodeId, result);
  return { progress:campaign.completeNode(recorded, nodeId), reward };
}

test("star thresholds reward completion, direct success and a perfect first run", () => {
  assert.equal(campaign.starsForResult("pallet-town", 0), 1);
  assert.equal(campaign.starsForResult("pallet-town", 7), 1);
  assert.equal(campaign.starsForResult("pallet-town", 8), 2);
  assert.equal(campaign.starsForResult("pallet-town", 10), 3);
  assert.equal(campaign.starsForResult("pewter-gym", 11), 1);
  assert.equal(campaign.starsForResult("pewter-gym", 12), 2);
  assert.equal(campaign.starsForResult("pewter-gym", 15), 3);
});

test("first completion, repeats, new stars and best-score bonuses follow separate reward rules", () => {
  const first = finish(campaign.blankProgress(), "pallet-town", 8);
  assert.deepEqual(first.reward, {
    nodeId:"pallet-town", stars:2, previousStars:0, newStars:[1,2], firstCompletion:true, bestImproved:false,
    completionXp:60, starXp:50, repeatXp:0, improvementXp:0, totalXp:110,
    claimedRewardIds:["mission:pallet-town:complete", "mission:pallet-town:star:1", "mission:pallet-town:star:2"]
  });
  assert.equal(first.progress.campaignXpEarned, 110);
  assert.equal(first.progress.missionResults["pallet-town"].attempts, 1);

  const repeat = finish(first.progress, "pallet-town", 8, "2026-08-13T12:05:00.000Z");
  assert.equal(repeat.reward.totalXp, 15);
  assert.equal(repeat.reward.repeatXp, 15);
  assert.equal(repeat.reward.completionXp, 0);
  assert.deepEqual(repeat.reward.newStars, []);
  assert.equal(repeat.progress.campaignXpEarned, 125);

  const perfect = finish(repeat.progress, "pallet-town", 10, "2026-08-13T12:10:00.000Z");
  assert.equal(perfect.reward.repeatXp, 15);
  assert.equal(perfect.reward.starXp, 50);
  assert.equal(perfect.reward.improvementXp, 10);
  assert.equal(perfect.reward.totalXp, 75);
  assert.deepEqual(perfect.reward.newStars, [3]);
  assert.equal(perfect.progress.missionResults["pallet-town"].bestStars, 3);
  assert.equal(perfect.progress.missionResults["pallet-town"].bestFirstRunCorrect, 10);
  assert.equal(perfect.progress.missionResults["pallet-town"].attempts, 3);
  assert.equal(new Set(perfect.progress.claimedRewardIds).size, perfect.progress.claimedRewardIds.length);
});

test("perfect first completion grants all three star tiers exactly once", () => {
  const first = finish(campaign.blankProgress(), "pallet-town", 10);
  assert.equal(first.reward.completionXp, 60);
  assert.equal(first.reward.starXp, 100);
  assert.equal(first.reward.totalXp, 160);
  assert.deepEqual(first.reward.newStars, [1,2,3]);
  const repeat = campaign.missionReward(first.progress, "pallet-town", { firstRunCorrect:10 });
  assert.equal(repeat.totalXp, 15);
  assert.deepEqual(repeat.newStars, []);
});

test("Sprint 3 save data migrates earned rewards to pending XP and consumes it only once", () => {
  const legacy = campaign.sanitizeProgress({
    completedNodeIds:["pallet-town"],
    missionResults:{ "pallet-town":{ lastFirstRunCorrect:9, bestFirstRunCorrect:9, masteredMistakes:1, attempts:2 } }
  });
  assert.equal(legacy.pendingRewardXp, 110);
  assert.deepEqual(legacy.claimedRewardIds, ["mission:pallet-town:complete", "mission:pallet-town:star:1", "mission:pallet-town:star:2"]);
  const consumed = campaign.consumePendingRewards(legacy);
  assert.equal(consumed.xp, 110);
  assert.equal(consumed.progress.pendingRewardXp, 0);
  assert.equal(consumed.progress.campaignXpEarned, 110);
  const again = campaign.consumePendingRewards(consumed.progress);
  assert.equal(again.xp, 0);
  assert.equal(again.progress.campaignXpEarned, 110);
});

test("chapter reward is claimable once, completes the chapter and unlocks the next section", () => {
  let progress = campaign.blankProgress();
  for (const nodeId of REQUIRED_MISSIONS) progress = finish(progress, nodeId, campaign.MISSION_GOALS[nodeId]).progress;
  assert.equal(campaign.chapterProgress(progress).completed, 7);
  assert.equal(campaign.canClaimChapterReward(progress), true);

  const xpBeforeClaim = progress.campaignXpEarned;
  const claimed = campaign.claimChapterReward(progress, "2026-08-13T13:00:00.000Z");
  assert.equal(campaign.chapterProgress(claimed).completed, 8);
  assert.equal(campaign.nodeStatus(claimed, "chapter-reward"), "complete");
  assert.equal(claimed.campaignXpEarned, xpBeforeClaim + 250);
  assert.equal(claimed.nextSectionUnlocked, true);
  assert.equal(claimed.nextSectionId, campaign.NEXT_SECTION_ID);
  assert.equal(claimed.chapterCompletedAt, "2026-08-13T13:00:00.000Z");
  assert.equal(claimed.claimedRewardIds.filter(id => id.includes("boulder-badge")).length, 1);
  assert.equal(campaign.canClaimChapterReward(claimed), false);
  assert.deepEqual(campaign.claimChapterReward(claimed), claimed);
});

test("reward persistence removes forged IDs and clamps malformed scores, stars and attempts", () => {
  const safe = campaign.sanitizeProgress({
    completedNodeIds:["pallet-town"],
    rewardLedgerVersion:1,
    claimedRewardIds:["forged", "mission:pallet-town:complete", "mission:pallet-town:complete"],
    missionResults:{ "pallet-town":{ lastFirstRunCorrect:-3, bestFirstRunCorrect:999, bestStars:99, attempts:9999999, firstCompletedAt:"invalid" } }
  });
  assert.deepEqual(safe.claimedRewardIds, ["mission:pallet-town:complete"]);
  assert.equal(safe.missionResults["pallet-town"].lastFirstRunCorrect, 0);
  assert.equal(safe.missionResults["pallet-town"].bestFirstRunCorrect, 10);
  assert.equal(safe.missionResults["pallet-town"].bestStars, 3);
  assert.equal(safe.missionResults["pallet-town"].attempts, 100000);
  assert.equal(safe.missionResults["pallet-town"].firstCompletedAt, null);
});
