(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonCampaign = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const REGION_ID = "kanto";
  const CHAPTER_ID = "journey-begins";
  const CURRENT_NODE_ID = "pallet-town";
  const TUTORIAL_STEPS = 4;

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
      lastMapScroll: 0
    };
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
      const lastFirstRunCorrect = Math.max(0, Math.min(total, Math.floor(Number(candidate.lastFirstRunCorrect) || 0)));
      const bestFirstRunCorrect = Math.max(lastFirstRunCorrect, Math.min(total, Math.floor(Number(candidate.bestFirstRunCorrect) || 0)));
      results[nodeId] = {
        lastFirstRunCorrect,
        bestFirstRunCorrect,
        total,
        requiredCorrect:MISSION_GOALS[nodeId],
        lastDirectGoalMet:lastFirstRunCorrect >= MISSION_GOALS[nodeId],
        masteredMistakes:Math.max(0, Math.min(total, Math.floor(Number(candidate.masteredMistakes) || 0))),
        attempts:Math.max(1, Math.min(100000, Math.floor(Number(candidate.attempts) || 1)))
      };
    }
    return results;
  }

  function sanitizeProgress(value) {
    const source = value && typeof value === "object" ? value : {};
    const completedNodeIds = validCompletedNodeIds(source.completedNodeIds);
    const unlockedNodeIds = unlockedFromCompleted(completedNodeIds);
    const currentNodeId = currentFromCompleted(completedNodeIds);
    const selectedNodeId = NODE_IDS.has(source.selectedNodeId) ? source.selectedNodeId : currentNodeId;
    return {
      tutorialComplete: Boolean(source.tutorialComplete),
      tutorialStep: Math.max(0, Math.min(TUTORIAL_STEPS - 1, Math.floor(Number(source.tutorialStep) || 0))),
      regionId: REGION_ID,
      chapterId: CHAPTER_ID,
      currentNodeId,
      selectedNodeId,
      completedNodeIds,
      unlockedNodeIds,
      missionResults:sanitizeMissionResults(source.missionResults),
      lastMapScroll: Math.max(0, Math.min(200000, Math.floor(Number(source.lastMapScroll) || 0)))
    };
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
    if (!canStartNode(safe, nodeId)) return safe;
    const completedNodeIds = uniqueNodeIds([...safe.completedNodeIds, nodeId]);
    return sanitizeProgress({ ...safe, completedNodeIds, selectedNodeId:nodeId });
  }

  function recordMissionResult(progress, nodeId, result = {}) {
    const safe = sanitizeProgress(progress);
    const total = MISSION_TOTALS[nodeId];
    if (!total) return safe;
    const previous = safe.missionResults[nodeId];
    const lastFirstRunCorrect = Math.max(0, Math.min(total, Math.floor(Number(result.firstRunCorrect) || 0)));
    const missionResults = {
      ...safe.missionResults,
      [nodeId]:{
        lastFirstRunCorrect,
        bestFirstRunCorrect:Math.max(previous?.bestFirstRunCorrect || 0, lastFirstRunCorrect),
        total,
        requiredCorrect:MISSION_GOALS[nodeId],
        lastDirectGoalMet:lastFirstRunCorrect >= MISSION_GOALS[nodeId],
        masteredMistakes:Math.max(0, Math.min(total, Math.floor(Number(result.masteredMistakes) || 0))),
        attempts:(previous?.attempts || 0) + 1
      }
    };
    return sanitizeProgress({ ...safe, missionResults });
  }

  function normalizeTutorialStep(step) {
    return Math.max(0, Math.min(TUTORIAL_STEPS - 1, Math.floor(Number(step) || 0)));
  }

  return Object.freeze({
    REGION_ID,
    CHAPTER_ID,
    CURRENT_NODE_ID,
    TUTORIAL_STEPS,
    NODES,
    PREREQUISITES,
    MISSION_TOTALS,
    MISSION_GOALS,
    blankProgress,
    sanitizeProgress,
    nodeById,
    nodeStatus,
    chapterProgress,
    canStartNode,
    completeNode,
    recordMissionResult,
    normalizeTutorialStep
  });
});
