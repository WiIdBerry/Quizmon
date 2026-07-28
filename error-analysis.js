(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonErrors = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const RULE_CODES = Object.freeze([
    "direction-reversal", "immunity-overlooked", "immunity-assumed",
    "quarter-half-confusion", "double-quad-confusion", "dual-neutralization",
    "dual-multiplication", "pokemon-missing-secondary", "pokemon-extra-type",
    "pokemon-wrong-type"
  ]);
  function ruleKey(code) { return RULE_CODES.includes(code) ? `rule:${code}` : null; }
  function sortedTypes(types, allTypes) {
    return [...new Set((Array.isArray(types) ? types : []).filter(type => allTypes.includes(type)))]
      .sort((a, b) => allTypes.indexOf(a) - allTypes.indexOf(b));
  }
  function matchupKey(attackingType, defendingTypes, allTypes) {
    const defenders = sortedTypes(defendingTypes, allTypes);
    return allTypes.includes(attackingType) && defenders.length ? `matchup:${attackingType}:${defenders.join("+")}` : null;
  }
  function pokemonKey(pokemonId) {
    const id = Number(pokemonId);
    return Number.isFinite(id) ? `pokemon:${id}` : null;
  }
  function classifyMultiplier(expected, actual, factors = [], defendersLength = factors.length) {
    const issues = [];
    const numericActual = Number(actual);
    if (!Number.isFinite(numericActual) || numericActual === expected) return issues;
    if (expected === 0 && numericActual !== 0) issues.push("immunity-overlooked");
    if (expected !== 0 && numericActual === 0) issues.push("immunity-assumed");
    if ((expected === .25 && numericActual === .5) || (expected === .5 && numericActual === .25)) issues.push("quarter-half-confusion");
    if ((expected === 4 && numericActual === 2) || (expected === 2 && numericActual === 4)) issues.push("double-quad-confusion");
    if (defendersLength === 2 && factors.includes(numericActual)) issues.push("dual-multiplication");
    if (defendersLength === 2 && expected === 1 && factors.includes(2) && factors.includes(.5) && numericActual !== 1) issues.push("dual-neutralization");
    return [...new Set(issues)];
  }
  function patternStatus({ opportunities = 0, errors = 0, recentCorrect = 0, correctStreak = 0 }) {
    if (opportunities < 2) return "observing";
    if (correctStreak >= 3 && recentCorrect >= 3) return "resolved";
    if (errors >= 2 && recentCorrect >= 2) return "improved";
    if (errors >= 2) return "open";
    return "observing";
  }
  return Object.freeze({ RULE_CODES, ruleKey, sortedTypes, matchupKey, pokemonKey, classifyMultiplier, patternStatus });
});
