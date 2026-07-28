(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonQuiz = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function normalized(values) {
    return [...new Set([...(values || [])].filter(Boolean))].sort();
  }

  function isExactSelection(selected, expected) {
    const left = normalized(selected);
    const right = normalized(expected);
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }

  function selectionDifference(selected, expected) {
    const selectedValues = normalized(selected);
    const expectedValues = normalized(expected);
    return [...new Set([
      ...selectedValues.filter(value => !expectedValues.includes(value)),
      ...expectedValues.filter(value => !selectedValues.includes(value))
    ])];
  }

  function questionSignature(spec) {
    if (!spec || typeof spec !== "object") return "unknown";
    if (spec.kind === "effectiveness") return `e:${spec.attackingType}:${spec.questionKind}:${normalized(spec.correctTargets).join(",")}`;
    if (spec.kind === "multiplier") return `m:${normalized(spec.defendingTypes).join(",")}`;
    if (spec.kind === "impact") return `i:${spec.attackingType}:${normalized(spec.defendingTypes).join(",")}`;
    if (spec.kind === "pokemon") return `p:${Number(spec.pokemon?.id || 0)}`;
    return `unknown:${String(spec.kind || "")}`;
  }

  return Object.freeze({ normalized, isExactSelection, selectionDifference, questionSignature });
});
