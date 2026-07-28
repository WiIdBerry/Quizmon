(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonImageFallback = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const FALLBACKS = Object.freeze({
    pokemon: "assets/pokemon-placeholder.svg",
    item: "assets/item-placeholder.svg",
    generic: "assets/generic-placeholder.svg"
  });
  function kindFor(image) {
    const explicit = String(image?.dataset?.imageKind || "").toLowerCase();
    if (FALLBACKS[explicit]) return explicit;
    const src = String(image?.currentSrc || image?.src || "").toLowerCase();
    if (src.includes("/sprites/items/") || image?.closest?.(".item-sprite,.flashcard-front-visual.item,.knowledge-entry-hero.item")) return "item";
    if (src.includes("/sprites/pokemon/") || src.includes("official-artwork") || image?.closest?.(".knowledge-pokemon-art,.knowledge-detail-art,.flashcard-front-visual.pokemon,.trainer-team")) return "pokemon";
    return "generic";
  }
  function apply(image) {
    if (!image || image.dataset.fallbackApplied === "true") return false;
    image.dataset.fallbackApplied = "true";
    image.classList.add("image-load-failed");
    image.src = FALLBACKS[kindFor(image)] || FALLBACKS.generic;
    return true;
  }
  return Object.freeze({ FALLBACKS, kindFor, apply });
});
