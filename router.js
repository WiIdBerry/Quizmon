(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonRouter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const ROUTES = Object.freeze(["home", "play", "pokeidle", "campaign", "train", "learn", "knowledge", "learn-detail", "stats", "settings", "support", "profile", "session", "summary"]);
  function validRoute(route) {
    return ROUTES.includes(route) || /^setup-(effectiveness|multiplier|impact|pokemon)$/.test(route || "");
  }
  function isInnerRoute(route) {
    return String(route || "").startsWith("setup-") || ["pokeidle", "campaign", "session", "summary", "learn-detail", "profile"].includes(route);
  }
  function announce(element, text) {
    if (!element) return;
    element.textContent = "";
    const write = () => { element.textContent = String(text || ""); };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(write);
    else setTimeout(write, 0);
  }
  return Object.freeze({ ROUTES, validRoute, isInnerRoute, announce });
});
