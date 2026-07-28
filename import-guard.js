(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonImportGuard = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function isRecord(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
  function inspect(parsed, allowedVersions) {
    if (!isRecord(parsed)) throw new Error("shape");
    const incoming = isRecord(parsed.state) ? parsed.state : parsed;
    if (!isRecord(incoming)) throw new Error("state");
    const version = String(incoming.version || parsed.exportVersion || "");
    if (!allowedVersions.has(version)) throw new Error("version");
    return Object.freeze({ incoming, version });
  }
  function parse(text, allowedVersions) {
    if (typeof text !== "string" || !text.trim()) throw new Error("empty");
    return inspect(JSON.parse(text), allowedVersions);
  }
  return Object.freeze({ isRecord, inspect, parse });
});
