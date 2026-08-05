(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonDailyService = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const RESULT_KEYS = Object.freeze(["hint1", "hint2", "hint3", "hint4", "hint5", "lost"]);
  function endpoint(documentRef = typeof document !== "undefined" ? document : null) { return String(documentRef?.querySelector('meta[name="quizmon-daily-api"]')?.content || "").trim().replace(/\/$/, ""); }
  function resultBucket(result) { const hint = Number(result?.solvedAtHint); return hint >= 1 && hint <= 5 ? `hint${hint}` : "lost"; }
  function sanitizeDistribution(value) {
    if (!value || typeof value !== "object") return null;
    const counts = Object.fromEntries(RESULT_KEYS.map(key => [key, Math.max(0, Math.floor(Number(value.counts?.[key]) || 0))]));
    const total = RESULT_KEYS.reduce((sum, key) => sum + counts[key], 0);
    if (!total) return null;
    return { total, counts, percentages: Object.fromEntries(RESULT_KEYS.map(key => [key, Math.round(counts[key] / total * 100)])) };
  }
  async function submit(baseUrl, installationId, result, fetchJson) {
    if (!baseUrl || !installationId || !result?.date) throw new Error("Daily service is not configured.");
    return fetchJson(`${baseUrl}/v1/wttp/${encodeURIComponent(result.date)}/results`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ installationId, bucket: resultBucket(result), seedVersion: 1 }) });
  }
  async function distribution(baseUrl, date, fetchJson) {
    if (!baseUrl || !date) throw new Error("Daily service is not configured.");
    return sanitizeDistribution(await fetchJson(`${baseUrl}/v1/wttp/${encodeURIComponent(date)}/distribution`));
  }
  return Object.freeze({ RESULT_KEYS, endpoint, resultBucket, sanitizeDistribution, submit, distribution });
});
