(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonLearning = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function confidenceId(total, legacy = false) {
    if (total < 3) return "insufficient";
    if (total < 6) return "first";
    if (total < 12 || legacy) return "solid";
    return "reliable";
  }
  function confidenceRank(id) { return ({ insufficient: 0, first: 1, solid: 2, reliable: 3 })[id] ?? 0; }
  function status(score, total, trend, openMistakes) {
    if (total < 3) return "unassessed";
    if (score < .55 || (score < .62 && openMistakes >= 2)) return "need";
    if (trend === "up" && score < .88) return "improving";
    if (score >= .86 && total >= 6 && openMistakes === 0) return "strong";
    if (score >= .72) return "stable";
    return "developing";
  }
  function trend(recentScores, olderScores, threshold = .08) {
    const average = values => values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 0;
    const recent = average(recentScores || []);
    const older = average(olderScores || []);
    const delta = recent - older;
    return { id: delta > threshold ? "up" : delta < -threshold ? "down" : "same", delta, recent, older };
  }
  function recommendationPriority(area) {
    return (1 - Number(area.score || 0)) * 100
      + Number(area.openMistakes || 0) * 9
      + (area.trend === "down" ? 12 : 0)
      + Math.min(12, Number(area.daysSince || 0) / 2)
      - Math.min(12, Number(area.recentExposure || 0) * 1.5);
  }
  return Object.freeze({ confidenceId, confidenceRank, status, trend, recommendationPriority });
});
