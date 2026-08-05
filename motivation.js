(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonMotivation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function comboBonusFor(combo, isReview = false) {
    let amount = 0;
    if (combo === 3) amount = 3;
    else if (combo === 5) amount = 5;
    else if (combo === 10) amount = 10;
    else if (combo > 10 && combo % 5 === 0) amount = 10;
    return isReview ? Math.ceil(amount / 2) : amount;
  }
  function nextComboTarget(combo, isReview = false) {
    let target;
    if (combo < 3) target = 3;
    else if (combo < 5) target = 5;
    else if (combo < 10) target = 10;
    else target = Math.ceil((combo + 1) / 5) * 5;
    return { target, remaining: Math.max(1, target - combo), bonus: comboBonusFor(target, isReview) };
  }
  function dailyGoal(progress, target = 10) {
    const safeTarget = Math.max(1, Number(target) || 10);
    const safeProgress = Math.max(0, Math.min(safeTarget, Number(progress) || 0));
    return { progress: safeProgress, target: safeTarget, remaining: Math.max(0, safeTarget - safeProgress), complete: safeProgress >= safeTarget, percent: Math.round(safeProgress / safeTarget * 100) };
  }
  function completeDailyGoal(value, options = {}) {
    const source = value && typeof value === "object" ? value : {};
    const today = String(options.today || source.date || "");
    const yesterday = String(options.yesterday || "");
    const target = 10;
    const wasCompleted = Boolean(source.goalCompleted || Number(source.goalProgress) >= target);
    const completedNow = !wasCompleted;
    const streak = completedNow
      ? (source.lastCompletedDate === yesterday ? Math.max(0, Number(source.streak) || 0) + 1 : 1)
      : Math.max(0, Number(source.streak) || 0);
    const bonusXp = completedNow && !source.goalRewardClaimed ? 25 : 0;
    const history = source.history && typeof source.history === "object" && !Array.isArray(source.history) ? { ...source.history } : {};
    if (today) history[today] = { progress: target, completed: true };
    return {
      state: {
        ...source,
        date: today || source.date || null,
        completed: true,
        result: options.result || source.result || null,
        streak,
        bestStreak: Math.max(streak, Math.max(0, Number(source.bestStreak) || 0)),
        lastCompletedDate: completedNow ? (today || source.lastCompletedDate || null) : source.lastCompletedDate || today || null,
        goalTarget: target,
        goalProgress: target,
        goalCompleted: true,
        goalRewardClaimed: true,
        history
      },
      completedNow,
      bonusXp,
      streak
    };
  }
  function levelInfo(levels, xp) {
    let current = levels[0];
    let next = null;
    for (let index = 0; index < levels.length; index += 1) {
      if (xp >= levels[index].xp) current = levels[index];
      if (xp < levels[index].xp) { next = levels[index]; break; }
    }
    const start = current.xp;
    const end = next ? next.xp : start;
    return { current, next, progress: next ? Math.min(100, Math.round(((xp - start) / (end - start)) * 100)) : 100 };
  }
  return Object.freeze({ comboBonusFor, nextComboTarget, dailyGoal, completeDailyGoal, levelInfo });
});
