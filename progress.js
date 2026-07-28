(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonProgress = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function comparisonInfo({ rate = 0, duration = 0, total = 0, correct = 0, previous = null } = {}) {
    if (!previous) return { kind: "baseline", previous: null, delta: null, errorDelta: null, timeDelta: null };
    const previousRate = Number(previous.rate || 0);
    const delta = Number(rate || 0) - previousRate;
    const sameLength = Number(previous.answers) === Number(total);
    const previousErrors = Math.max(0, Number(previous.answers || 0) - Number(previous.correct || 0));
    const currentErrors = Math.max(0, Number(total || 0) - Number(correct || 0));
    const errorDelta = sameLength ? previousErrors - currentErrors : null;
    const timeDelta = sameLength && Number(previous.duration) > 0 ? Number(previous.duration) - Number(duration || 0) : null;
    return {
      kind: delta > 0 ? "better" : delta === 0 ? "steady" : "target",
      previous, previousRate, delta, errorDelta, timeDelta
    };
  }

  return Object.freeze({ comparisonInfo });
});
