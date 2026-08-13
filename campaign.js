(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonCampaign = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const REGION_ID = "kanto";
  const CHAPTER_ID = "journey-begins";
  const NEXT_SECTION_ID = "kanto-chapter-2";
  const CURRENT_NODE_ID = "pallet-town";
  const TUTORIAL_STEPS = 4;
  const REWARD_LEDGER_VERSION = 1;
  const STAR_XP = Object.freeze({ 1:20, 2:30, 3:50 });
  const BEST_IMPROVEMENT_XP = 10;
  const CHAPTER_REWARD_XP = 250;
  const MAX_CAMPAIGN_XP = 2147483647;

  const NODES = Object.freeze([
    Object.freeze({ id:"pallet-town", order:1, x:50, y:145, type:"start", icon:"city", titleKey:"campaign.node.pallet.title", subtitleKey:"campaign.node.pallet.subtitle", descriptionKey:"campaign.node.pallet.description", reward:"", required:true }),
    Object.freeze({ id:"rival-one", order:2, x:48, y:300, type:"rival", icon:"battle", titleKey:"campaign.node.rival.title", subtitleKey:"campaign.node.rival.subtitle", descriptionKey:"campaign.node.rival.description", reward:"", required:true }),
    Object.freeze({ id:"route-one", order:3, x:49, y:500, type:"route", icon:"route", titleKey:"campaign.node.routeOne.title", subtitleKey:"campaign.node.routeOne.subtitle", descriptionKey:"campaign.node.routeOne.description", reward:"", required:true }),
    Object.freeze({ id:"viridian-city", order:4, x:51, y:735, type:"city", icon:"city", titleKey:"campaign.node.viridian.title", subtitleKey:"campaign.node.viridian.subtitle", descriptionKey:"campaign.node.viridian.description", reward:"", required:true }),
    Object.freeze({ id:"route-twenty-two", order:5, x:24, y:830, type:"route", icon:"route", titleKey:"campaign.node.routeTwentyTwo.title", subtitleKey:"campaign.node.routeTwentyTwo.subtitle", descriptionKey:"campaign.node.routeTwentyTwo.description", reward:"", required:false, branch:true, optionalEntry:true }),
    Object.freeze({ id:"rival-two", order:6, x:22, y:980, type:"rival", icon:"battle", titleKey:"campaign.node.rivalTwo.title", subtitleKey:"campaign.node.rivalTwo.subtitle", descriptionKey:"campaign.node.rivalTwo.description", reward:"", required:false, branch:true }),
    Object.freeze({ id:"route-two", order:7, x:50, y:1100, type:"route", icon:"route", titleKey:"campaign.node.routeTwo.title", subtitleKey:"campaign.node.routeTwo.subtitle", descriptionKey:"campaign.node.routeTwo.description", reward:"", required:true }),
    Object.freeze({ id:"viridian-forest", order:8, x:50, y:1350, type:"forest", icon:"route", titleKey:"campaign.node.forest.title", subtitleKey:"campaign.node.forest.subtitle", descriptionKey:"campaign.node.forest.description", reward:"", required:true }),
    Object.freeze({ id:"pewter-gym", order:9, x:50, y:1630, type:"arena", icon:"arena", titleKey:"campaign.node.pewterGym.title", subtitleKey:"campaign.node.pewterGym.subtitle", descriptionKey:"campaign.node.pewterGym.description", reward:"", required:true }),
    Object.freeze({ id:"chapter-reward", order:10, x:50, y:1820, type:"reward", icon:"reward", titleKey:"campaign.node.chapterReward.title", subtitleKey:"campaign.node.chapterReward.subtitle", descriptionKey:"campaign.node.chapterReward.description", rewardKey:"campaign.reward.boulderBadge", required:true })
  ]);

  const NODE_IDS = new Set(NODES.map(node => node.id));
  const MISSION_TOTALS = Object.freeze({
    "pallet-town":10, "rival-one":10, "route-one":10, "viridian-city":10,
    "route-twenty-two":10, "rival-two":10, "route-two":10, "viridian-forest":10, "pewter-gym":15
  });
  const MISSION_GOALS = Object.freeze({ ...Object.fromEntries(Object.keys(MISSION_TOTALS).map(id => [id,8])), "pewter-gym":12 });
  const MISSION_REWARDS = Object.freeze(Object.fromEntries(NODES.filter(node => MISSION_TOTALS[node.id]).map(node => [node.id, Object.freeze({
    completion:node.type === "arena" ? 150 : node.type === "rival" ? 80 : 60,
    repeat:node.type === "arena" ? 30 : node.type === "rival" ? 20 : 15
  })])));
  const MAX_PENDING_REWARD_XP = Object.values(MISSION_REWARDS).reduce((sum, reward) => sum + reward.completion, 0)
    + Object.keys(MISSION_TOTALS).length * Object.values(STAR_XP).reduce((sum, xp) => sum + xp, 0)
    + CHAPTER_REWARD_XP;
  const PREREQUISITES = Object.freeze({
    "pallet-town": Object.freeze([]),
    "rival-one": Object.freeze(["pallet-town"]),
    "route-one": Object.freeze(["rival-one"]),
    "viridian-city": Object.freeze(["route-one"]),
    "route-twenty-two": Object.freeze(["viridian-city"]),
    "rival-two": Object.freeze(["route-twenty-two"]),
    "route-two": Object.freeze(["viridian-city"]),
    "viridian-forest": Object.freeze(["route-two"]),
    "pewter-gym": Object.freeze(["viridian-forest"]),
    "chapter-reward": Object.freeze(["pewter-gym"])
  });

  function blankProgress() {
    return {
      tutorialComplete: false,
      tutorialStep: 0,
      regionId: REGION_ID,
      chapterId: CHAPTER_ID,
      currentNodeId: CURRENT_NODE_ID,
      selectedNodeId: CURRENT_NODE_ID,
      completedNodeIds: [],
      unlockedNodeIds: [CURRENT_NODE_ID],
      missionResults: {},
      claimedRewardIds: [],
      campaignXpEarned: 0,
      pendingRewardXp: 0,
      rewardLedgerVersion: REWARD_LEDGER_VERSION,
      chapterCompletedAt: null,
      nextSectionId: null,
      nextSectionUnlocked: false,
      lastMapScroll: 0
    };
  }

  function validTimestamp(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function finiteInteger(value, minimum = 0, maximum = MAX_CAMPAIGN_XP, fallback = minimum) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(minimum, Math.min(maximum, Math.floor(numeric)));
  }

  function starsForResult(nodeId, correct) {
    const total = MISSION_TOTALS[nodeId];
    const goal = MISSION_GOALS[nodeId];
    if (!total || !goal) return 0;
    const score = Math.max(0, Math.min(total, Math.floor(Number(correct) || 0)));
    if (score >= total) return 3;
    if (score >= goal) return 2;
    return 1;
  }

  function missionRewardId(nodeId, kind, level = null) {
    return level == null ? `mission:${nodeId}:${kind}` : `mission:${nodeId}:${kind}:${level}`;
  }

  function chapterRewardId() { return `chapter:${CHAPTER_ID}:boulder-badge`; }

  function validRewardIds(value) {
    const allowed = new Set([chapterRewardId()]);
    Object.keys(MISSION_TOTALS).forEach(nodeId => {
      allowed.add(missionRewardId(nodeId, "complete"));
      [1,2,3].forEach(star => allowed.add(missionRewardId(nodeId, "star", star)));
    });
    return [...new Set(Array.isArray(value) ? value.filter(id => allowed.has(id)) : [])];
  }

  function rewardXpTotal(rewardIds) {
    return rewardIds.reduce((sum, id) => {
      if (id === chapterRewardId()) return sum + CHAPTER_REWARD_XP;
      const parts = id.split(":");
      if (parts[0] !== "mission" || !MISSION_REWARDS[parts[1]]) return sum;
      if (parts[2] === "complete") return sum + MISSION_REWARDS[parts[1]].completion;
      if (parts[2] === "star" && STAR_XP[parts[3]]) return sum + STAR_XP[parts[3]];
      return sum;
    }, 0);
  }

  function uniqueNodeIds(value) {
    return [...new Set(Array.isArray(value) ? value.filter(id => NODE_IDS.has(id)) : [])];
  }

  function validCompletedNodeIds(value) {
    const requested = new Set(uniqueNodeIds(value));
    const completed = [];
    for (const node of NODES) {
      if (!requested.has(node.id)) continue;
      if ((PREREQUISITES[node.id] || []).every(id => completed.includes(id))) completed.push(node.id);
    }
    return completed;
  }

  function unlockedFromCompleted(completedNodeIds) {
    const completed = new Set(completedNodeIds);
    return NODES.filter(node => completed.has(node.id) || (PREREQUISITES[node.id] || []).every(id => completed.has(id))).map(node => node.id);
  }

  function currentFromCompleted(completedNodeIds) {
    const completed = new Set(completedNodeIds);
    return NODES.find(node => node.required && !completed.has(node.id) && (PREREQUISITES[node.id] || []).every(id => completed.has(id)))?.id || "chapter-reward";
  }

  function sanitizeMissionResults(value) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const results = {};
    for (const [nodeId, total] of Object.entries(MISSION_TOTALS)) {
      const candidate = source[nodeId];
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
      const lastFirstRunCorrect = finiteInteger(candidate.lastFirstRunCorrect, 0, total, 0);
      const bestFirstRunCorrect = Math.max(lastFirstRunCorrect, finiteInteger(candidate.bestFirstRunCorrect, 0, total, lastFirstRunCorrect));
      const lastStars = starsForResult(nodeId, lastFirstRunCorrect);
      const bestStars = starsForResult(nodeId, bestFirstRunCorrect);
      const firstCompletedAt = validTimestamp(candidate.firstCompletedAt);
      let lastCompletedAt = validTimestamp(candidate.lastCompletedAt);
      if (firstCompletedAt && lastCompletedAt && lastCompletedAt < firstCompletedAt) lastCompletedAt = firstCompletedAt;
      results[nodeId] = {
        lastFirstRunCorrect,
        bestFirstRunCorrect,
        lastStars,
        bestStars,
        total,
        requiredCorrect:MISSION_GOALS[nodeId],
        lastDirectGoalMet:lastFirstRunCorrect >= MISSION_GOALS[nodeId],
        masteredMistakes:finiteInteger(candidate.masteredMistakes, 0, total, 0),
        attempts:finiteInteger(candidate.attempts, 1, 100000, 1),
        firstCompletedAt,
        lastCompletedAt
      };
    }
    return results;
  }

  function legacyRewardLedger(source, completedNodeIds, missionResults) {
    const claimedRewardIds = validRewardIds(source.claimedRewardIds);
    let pendingRewardXp = finiteInteger(source.pendingRewardXp, 0, MAX_PENDING_REWARD_XP, 0);
    if (Number(source.rewardLedgerVersion) >= REWARD_LEDGER_VERSION) {
      return { claimedRewardIds, pendingRewardXp:Math.min(pendingRewardXp, rewardXpTotal(claimedRewardIds)), rewardLedgerVersion:REWARD_LEDGER_VERSION };
    }
    const claimed = new Set(claimedRewardIds);
    completedNodeIds.filter(id => MISSION_TOTALS[id]).forEach(nodeId => {
      const result = missionResults[nodeId];
      const completionId = missionRewardId(nodeId, "complete");
      if (!claimed.has(completionId)) {
        claimed.add(completionId);
        pendingRewardXp += MISSION_REWARDS[nodeId].completion;
      }
      const stars = Math.max(1, result?.bestStars || 1);
      for (let star = 1; star <= stars; star += 1) {
        const id = missionRewardId(nodeId, "star", star);
        if (!claimed.has(id)) { claimed.add(id); pendingRewardXp += STAR_XP[star]; }
      }
    });
    if (completedNodeIds.includes("chapter-reward") && !claimed.has(chapterRewardId())) {
      claimed.add(chapterRewardId());
      pendingRewardXp += CHAPTER_REWARD_XP;
    }
    const migratedRewardIds = [...claimed];
    return { claimedRewardIds:migratedRewardIds, pendingRewardXp:Math.min(finiteInteger(pendingRewardXp, 0, MAX_PENDING_REWARD_XP, 0), rewardXpTotal(migratedRewardIds)), rewardLedgerVersion:REWARD_LEDGER_VERSION };
  }

  function sanitizeProgress(value) {
    const source = value && typeof value === "object" ? value : {};
    const completedNodeIds = validCompletedNodeIds(source.completedNodeIds);
    const unlockedNodeIds = unlockedFromCompleted(completedNodeIds);
    const currentNodeId = currentFromCompleted(completedNodeIds);
    const selectedNodeId = NODE_IDS.has(source.selectedNodeId) ? source.selectedNodeId : currentNodeId;
    const missionResults = sanitizeMissionResults(source.missionResults);
    const ledger = legacyRewardLedger(source, completedNodeIds, missionResults);
    const chapterCompleted = completedNodeIds.includes("chapter-reward");
    return {
      tutorialComplete: Boolean(source.tutorialComplete),
      tutorialStep:finiteInteger(source.tutorialStep, 0, TUTORIAL_STEPS - 1, 0),
      regionId: REGION_ID,
      chapterId: CHAPTER_ID,
      currentNodeId,
      selectedNodeId,
      completedNodeIds,
      unlockedNodeIds,
      missionResults,
      claimedRewardIds:ledger.claimedRewardIds,
      campaignXpEarned:finiteInteger(source.campaignXpEarned, 0, MAX_CAMPAIGN_XP, 0),
      pendingRewardXp:ledger.pendingRewardXp,
      rewardLedgerVersion:ledger.rewardLedgerVersion,
      chapterCompletedAt:chapterCompleted ? validTimestamp(source.chapterCompletedAt) : null,
      nextSectionId:chapterCompleted ? NEXT_SECTION_ID : null,
      nextSectionUnlocked:chapterCompleted,
      lastMapScroll:finiteInteger(source.lastMapScroll, 0, 200000, 0)
    };
  }

  function consumePendingRewards(progress) {
    const safe = sanitizeProgress(progress);
    return { progress:{ ...safe, campaignXpEarned:finiteInteger(safe.campaignXpEarned + safe.pendingRewardXp, 0, MAX_CAMPAIGN_XP, MAX_CAMPAIGN_XP), pendingRewardXp:0 }, xp:safe.pendingRewardXp };
  }

  function nodeById(id) {
    return NODES.find(node => node.id === id) || NODES[0];
  }

  function nodeStatus(progress, nodeId) {
    const safe = sanitizeProgress(progress);
    if (safe.completedNodeIds.includes(nodeId)) return "complete";
    if (safe.currentNodeId === nodeId) return "current";
    if (safe.unlockedNodeIds.includes(nodeId)) return "available";
    return "locked";
  }

  function chapterProgress(progress) {
    const completed = sanitizeProgress(progress).completedNodeIds.filter(id => nodeById(id).required).length;
    const total = NODES.filter(node => node.required).length;
    return { completed, total, percent: total ? Math.round(completed / total * 100) : 0 };
  }

  function canStartNode(progress, nodeId) {
    const node = NODE_IDS.has(nodeId) ? nodeById(nodeId) : null;
    if (!node || node.type === "reward") return false;
    return nodeStatus(progress, nodeId) !== "locked";
  }

  function completeNode(progress, nodeId) {
    const safe = sanitizeProgress(progress);
    if (!canStartNode(safe, nodeId) || !safe.missionResults[nodeId]) return safe;
    const completedNodeIds = uniqueNodeIds([...safe.completedNodeIds, nodeId]);
    return sanitizeProgress({ ...safe, completedNodeIds, selectedNodeId:nodeId });
  }

  function missionReward(progress, nodeId, result = {}) {
    const safe = sanitizeProgress(progress);
    const rule = MISSION_REWARDS[nodeId];
    if (!rule) return Object.freeze({ nodeId, stars:0, previousStars:0, newStars:[], firstCompletion:false, bestImproved:false, completionXp:0, starXp:0, repeatXp:0, improvementXp:0, totalXp:0, claimedRewardIds:[] });
    const previous = safe.missionResults[nodeId];
    const correct = finiteInteger(result.firstRunCorrect, 0, MISSION_TOTALS[nodeId], 0);
    const stars = starsForResult(nodeId, correct);
    const previousStars = previous?.bestStars || 0;
    const firstCompletion = !safe.completedNodeIds.includes(nodeId);
    const bestImproved = Boolean(previous && correct > previous.bestFirstRunCorrect);
    const claimed = new Set(safe.claimedRewardIds);
    const newlyClaimed = [];
    const completionId = missionRewardId(nodeId, "complete");
    const completionXp = firstCompletion && !claimed.has(completionId) ? rule.completion : 0;
    if (completionXp) newlyClaimed.push(completionId);
    const newStars = [];
    let starXp = 0;
    for (let star = 1; star <= stars; star += 1) {
      const id = missionRewardId(nodeId, "star", star);
      if (claimed.has(id)) continue;
      newlyClaimed.push(id);
      newStars.push(star);
      starXp += STAR_XP[star];
    }
    const repeatXp = firstCompletion ? 0 : rule.repeat;
    const improvementXp = !firstCompletion && bestImproved ? BEST_IMPROVEMENT_XP : 0;
    return Object.freeze({ nodeId, stars, previousStars, newStars:Object.freeze(newStars), firstCompletion, bestImproved, completionXp, starXp, repeatXp, improvementXp, totalXp:completionXp + starXp + repeatXp + improvementXp, claimedRewardIds:Object.freeze(newlyClaimed) });
  }

  function recordMissionResult(progress, nodeId, result = {}) {
    const safe = sanitizeProgress(progress);
    const total = MISSION_TOTALS[nodeId];
    if (!total || !canStartNode(safe, nodeId)) return safe;
    const previous = safe.missionResults[nodeId];
    const reward = missionReward(safe, nodeId, result);
    const lastFirstRunCorrect = finiteInteger(result.firstRunCorrect, 0, total, 0);
    const completedAt = validTimestamp(result.completedAt) || new Date().toISOString();
    const missionResults = {
      ...safe.missionResults,
      [nodeId]:{
        lastFirstRunCorrect,
        bestFirstRunCorrect:Math.max(previous?.bestFirstRunCorrect || 0, lastFirstRunCorrect),
        lastStars:reward.stars,
        bestStars:Math.max(previous?.bestStars || 0, reward.stars),
        total,
        requiredCorrect:MISSION_GOALS[nodeId],
        lastDirectGoalMet:lastFirstRunCorrect >= MISSION_GOALS[nodeId],
        masteredMistakes:finiteInteger(result.masteredMistakes, 0, total, 0),
        attempts:(previous?.attempts || 0) + 1,
        firstCompletedAt:previous?.firstCompletedAt || completedAt,
        lastCompletedAt:completedAt
      }
    };
    return sanitizeProgress({ ...safe, missionResults, claimedRewardIds:[...safe.claimedRewardIds, ...reward.claimedRewardIds], campaignXpEarned:safe.campaignXpEarned + reward.totalXp });
  }

  function canClaimChapterReward(progress) {
    const safe = sanitizeProgress(progress);
    return !safe.completedNodeIds.includes("chapter-reward") && (PREREQUISITES["chapter-reward"] || []).every(id => safe.completedNodeIds.includes(id));
  }

  function claimChapterReward(progress, claimedAt = new Date().toISOString()) {
    const safe = sanitizeProgress(progress);
    if (!canClaimChapterReward(safe)) return safe;
    return sanitizeProgress({
      ...safe,
      completedNodeIds:[...safe.completedNodeIds, "chapter-reward"],
      selectedNodeId:"chapter-reward",
      claimedRewardIds:[...safe.claimedRewardIds, chapterRewardId()],
      campaignXpEarned:safe.campaignXpEarned + CHAPTER_REWARD_XP,
      chapterCompletedAt:validTimestamp(claimedAt) || new Date().toISOString(),
      nextSectionId:NEXT_SECTION_ID,
      nextSectionUnlocked:true
    });
  }

  function missionRewardPreview(progress, nodeId) {
    const safe = sanitizeProgress(progress);
    const rule = MISSION_REWARDS[nodeId];
    if (!rule) return null;
    const completed = safe.completedNodeIds.includes(nodeId);
    return Object.freeze({ completed, xp:completed ? rule.repeat : rule.completion, maxStarXp:STAR_XP[1] + STAR_XP[2] + STAR_XP[3] });
  }

  function normalizeTutorialStep(step) {
    return Math.max(0, Math.min(TUTORIAL_STEPS - 1, Math.floor(Number(step) || 0)));
  }

  return Object.freeze({
    REGION_ID,
    CHAPTER_ID,
    NEXT_SECTION_ID,
    CURRENT_NODE_ID,
    TUTORIAL_STEPS,
    NODES,
    PREREQUISITES,
    MISSION_TOTALS,
    MISSION_GOALS,
    MISSION_REWARDS,
    STAR_XP,
    BEST_IMPROVEMENT_XP,
    CHAPTER_REWARD_XP,
    blankProgress,
    sanitizeProgress,
    consumePendingRewards,
    nodeById,
    nodeStatus,
    chapterProgress,
    canStartNode,
    completeNode,
    starsForResult,
    missionReward,
    missionRewardPreview,
    recordMissionResult,
    canClaimChapterReward,
    claimChapterReward,
    normalizeTutorialStep
  });
});
