"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fallback = require("../image-fallback.js");
function image(src, kind="") {
  return { src, currentSrc:src, dataset: kind ? { imageKind:kind } : {}, classList:{ added:[], add(value){this.added.push(value);} }, closest(){ return null; } };
}
test("image fallbacks distinguish Pokémon, items and generic images", () => {
  assert.equal(fallback.kindFor(image("https://x/sprites/pokemon/25.png")), "pokemon");
  assert.equal(fallback.kindFor(image("https://x/sprites/items/potion.png")), "item");
  assert.equal(fallback.kindFor(image("https://x/banner.png")), "generic");
  assert.equal(fallback.kindFor(image("x", "item")), "item");
});
test("image fallback applies once and uses the matching local asset", () => {
  const target=image("https://x/sprites/items/potion.png");
  assert.equal(fallback.apply(target), true);
  assert.equal(target.src, "assets/item-placeholder.svg");
  assert.equal(target.dataset.fallbackApplied, "true");
  assert.equal(fallback.apply(target), false);
});
