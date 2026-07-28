(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonDifficulty = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const LEVELS = Object.freeze(["easy", "medium", "hard"]);
  function shiftedDifficulty(level, offset = 0, levels = LEVELS) {
    const index = levels.indexOf(level);
    const safeIndex = index >= 0 ? index : 1;
    return levels[Math.max(0, Math.min(levels.length - 1, safeIndex + Number(offset || 0)))];
  }
  function speedSignal(durations, benchmark = 15000) {
    const values = (durations || []).map(Number).filter(value => value >= 500 && value <= 180000).slice(-6);
    if (values.length < 3) return { value: .5, known: false, average: null };
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const ratio = average / benchmark;
    const value = ratio <= .75 ? 1 : ratio <= 1.05 ? .78 : ratio <= 1.4 ? .52 : ratio <= 1.8 ? .28 : 0;
    return { value, known: true, average };
  }
  function blockAdjustment(results, current = "medium") {
    const block = (results || []).slice(-3);
    if (block.length < 3) return { level: current, changed: false, signal: "hold" };
    const correct = block.filter(item => item?.correct).length;
    const fast = block.filter(item => item?.correct && Number(item.duration) > 0 && Number(item.duration) < 10000).length;
    const slowOrWrong = block.filter(item => !item?.correct || Number(item.duration) > 25000).length;
    if (correct === 3 && fast >= 2) return { level: shiftedDifficulty(current, 1), changed: current !== "hard", signal: "raise" };
    if (correct <= 1 || slowOrWrong >= 2) return { level: shiftedDifficulty(current, -1), changed: current !== "easy", signal: "lower" };
    return { level: current, changed: false, signal: "hold" };
  }
  return Object.freeze({ LEVELS, shiftedDifficulty, speedSignal, blockAdjustment });
});
