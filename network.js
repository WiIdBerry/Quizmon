(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonNetwork = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const DEFAULT_TIMEOUT_MS = 6500;

  async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const externalSignal = options.signal;
    const abortFromExternal = () => controller.abort(externalSignal?.reason);
    if (externalSignal?.aborted) abortFromExternal();
    else externalSignal?.addEventListener?.("abort", abortFromExternal, { once: true });
    const timeout = setTimeout(() => controller.abort(new DOMException("Network timeout", "TimeoutError")), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
      externalSignal?.removeEventListener?.("abort", abortFromExternal);
    }
  }
  async function fetchJson(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const response = await fetchWithTimeout(url, options, timeoutMs);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
  function artworkUrl(id) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }
  return Object.freeze({ DEFAULT_TIMEOUT_MS, fetchWithTimeout, fetchJson, artworkUrl });
});
