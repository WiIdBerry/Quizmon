(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonKnowledgeLearnsetLoader = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";
  const SCRIPT_URL = "./knowledge-learnset-data.js";
  const LOAD_TIMEOUT_MS = 20000;
  let loadPromise = null;
  let lastError = null;

  function isLoaded() {
    return Boolean(root.QuizmonKnowledgeLearnsets && !root.QuizmonKnowledgeLearnsets.metaOnly && root.QuizmonKnowledgeLearnsets.BY_GROUP);
  }

  function load() {
    if (isLoaded()) return Promise.resolve(root.QuizmonKnowledgeLearnsets);
    if (loadPromise) return loadPromise;
    if (typeof document === "undefined") return Promise.reject(new Error("Learnset data requires a browser document"));
    loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-quizmon-learnsets="full"]`);
      const script = existing || document.createElement("script");
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error || !isLoaded()) {
          lastError = error || new Error("Learnset data did not initialize");
          loadPromise = null;
          reject(lastError);
          return;
        }
        lastError = null;
        resolve(root.QuizmonKnowledgeLearnsets);
      };
      const timer = setTimeout(() => finish(new Error("Learnset data load timeout")), LOAD_TIMEOUT_MS);
      script.addEventListener("load", () => finish(null), { once: true });
      script.addEventListener("error", () => finish(new Error("Learnset data could not be loaded")), { once: true });
      if (!existing) {
        script.src = SCRIPT_URL;
        script.async = true;
        script.dataset.quizmonLearnsets = "full";
        document.head.appendChild(script);
      }
    });
    return loadPromise;
  }

  function error() { return lastError; }
  return Object.freeze({ SCRIPT_URL, LOAD_TIMEOUT_MS, isLoaded, load, error });
});
