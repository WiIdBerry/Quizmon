"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const campaign = require("../campaign.js");
const missions = require("../campaign-missions.js");
const campaignUI = require("../campaign-ui.js");

function createHarness({ onboardingComplete = false } = {}) {
  function createClassList() {
    const values = new Set();
    return {
      add(...names) { names.forEach(name => values.add(name)); },
      remove(...names) { names.forEach(name => values.delete(name)); },
      contains(name) { return values.has(name); }
    };
  }
  const listeners = new Map();
  const on = (type, callback) => listeners.set(type, [...(listeners.get(type) || []), callback]);
  const off = (type, callback) => listeners.set(type, (listeners.get(type) || []).filter(item => item !== callback));
  const state = {
    route: "campaign",
    onboardingComplete,
    campaign: campaign.blankProgress()
  };
  function createElement() {
    const handlers = new Map();
    return {
      classList: createClassList(),
      dataset: {},
      style: { setProperty(name, value) { this[name] = value; } },
      textContent: "",
      hidden: false,
      offsetWidth: 1,
      addEventListener(type, callback) { handlers.set(type, callback); },
      click() { handlers.get("click")?.(); }
    };
  }
  const focus = createElement();
  const backdrop = createElement();
  const elements = new Map([
    [".campaign-tutorial-backdrop", backdrop],
    [".campaign-tutorial-focus", focus],
    [".campaign-tutorial-copy", createElement()],
    [".campaign-tutorial-step i", createElement()],
    [".campaign-tutorial-step b", createElement()],
    ["#campaignTutorialTitle", createElement()],
    ["#campaignTutorialText", createElement()],
    ["#campaignTutorialBack", createElement()],
    ["#campaignTutorialSkip", createElement()],
    ["#campaignTutorialNext", createElement()]
  ]);
  const target = {
    scrollIntoView() {},
    getBoundingClientRect() { return { top: 100, left: 100, width: 80, height: 80 }; },
    querySelector() { return this; }
  };
  const win = {
    scrollY: 0,
    innerWidth: 1440,
    innerHeight: 1000,
    scrollTo() {},
    scrollBy() {},
    requestAnimationFrame(callback) { callback(); },
    setTimeout(callback) { callback(); },
    addEventListener(type, callback) { on(type, callback); },
    removeEventListener(type, callback) { off(type, callback); }
  };
  const documentElement = { classList: createClassList() };
  const body = { classList: createClassList() };
  const doc = { defaultView: win, documentElement, body };
  const view = {
    ownerDocument: doc,
    innerHTML: "",
    querySelectorAll() { return []; },
    querySelector(selector) {
      if (selector.includes("data-campaign-tutorial-target") || selector === ".campaign-map-card") return target;
      return null;
    }
  };
  const modalRoot = {
    querySelector(selector) { return shellMounted ? elements.get(selector) || null : null; }
  };
  let modalMarkup = "";
  let shellMounted = false;
  let modalMounts = 0;
  const controller = campaignUI.createController({
    campaign,
    missions,
    view,
    modalRoot,
    getState: () => state,
    getMissionContext: () => ({ pokemonById:new Map(), itemById:new Map(), typeChart:{} }),
    t: (key, values) => values ? `${key}:${values.completed}/${values.total}` : key,
    escapeHtml: value => String(value),
    saveState() {},
    haptic() {},
    motionEnabled: () => false,
    setModalMarkup(markup) {
      modalMarkup = markup;
      shellMounted = true;
      modalMounts += 1;
    },
    closeModal(callback) { callback?.(); },
    showConfirmDialog({ onConfirm }) { onConfirm?.(); }
  });
  return {
    controller,
    state,
    view,
    focus,
    documentElement,
    body,
    modalMarkup: () => modalMarkup,
    modalMounts: () => modalMounts,
    element: selector => elements.get(selector),
    click: selector => elements.get(selector)?.click(),
    dispatch(type, properties = {}) {
      const event = {
        type,
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        ...properties
      };
      (listeners.get(type) || []).forEach(callback => callback(event));
      return event;
    }
  };
}

test("campaign UI controller renders all ten map nodes through its module boundary", () => {
  const harness = createHarness();
  harness.controller.render();
  assert.match(harness.view.innerHTML, /class="campaign-page"/);
  assert.equal((harness.view.innerHTML.match(/data-campaign-node=/g) || []).length, 10);
  assert.match(harness.view.innerHTML, /campaign-path-line/);
  assert.match(harness.view.innerHTML, /campaign-branch-line/);
  assert.match(harness.view.innerHTML, /campaign-kanto-chapter-1-background\.png/);
  assert.match(harness.view.innerHTML, /campaign-mission-panel/);
});

test("campaign UI keeps approved icons visible and adds separate state badges", () => {
  const harness = createHarness();
  harness.state.campaign = campaign.sanitizeProgress({
    currentNodeId: "rival-one",
    selectedNodeId: "pallet-town",
    completedNodeIds: ["pallet-town"],
    unlockedNodeIds: ["pallet-town", "rival-one"]
  });
  harness.controller.render();
  const markup = harness.view.innerHTML;
  assert.match(markup, /data-campaign-node="pallet-town"[^>]*><img[^>]+data-campaign-icon="city"[^>]*><span class="campaign-node-state-badge is-complete"/);
  assert.match(markup, /data-campaign-node="rival-one"[^>]*aria-current="step"><img[^>]+data-campaign-icon="battle"/);
  assert.match(markup, /data-campaign-node="route-one"[^>]*><img[^>]+data-campaign-icon="route"[^>]*><span class="campaign-node-state-badge is-locked"/);
  assert.match(markup, /data-campaign-node="pewter-gym"[^>]*><img[^>]+data-campaign-icon="arena"/);
  assert.match(markup, /data-campaign-node="chapter-reward"[^>]*><img[^>]+data-campaign-icon="reward"/);
  assert.equal((markup.match(/campaign-node-badge/g) || []).length, 1, "Only the Route 22 branch entry should carry the optional badge");
  const currentButton = markup.match(/<button[^>]+data-campaign-node="rival-one"[\s\S]*?<\/button>/)?.[0] || "";
  assert.doesNotMatch(currentButton, /campaign-node-state-badge/);
});

test("campaign missions reuse Pokémon artwork and the existing colored type chips", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "campaign-ui.js"), "utf8");
  assert.match(source, /data-image-kind=\"pokemon\"/);
  assert.match(source, /data-image-kind=\"item\"/);
  assert.match(source, /renderTypeChip\(type, `campaign-type-chip/);
  assert.match(source, /answer-kind-\$\{presentation\.kind\}/);
  assert.match(source, /campaign-question-showcase/);
  const pokemonAnswerBranch = source.match(/if \(id\.startsWith\(\"pokemon:\"\)\)[\s\S]*?if \(id\.startsWith\(\"type:\"\)\)/)?.[0] || "";
  assert.doesNotMatch(pokemonAnswerBranch, /\.types|typeChipMarkup/, "Pokémon answer artwork must not reveal its type before checking");
});

test("campaign mission colors vary by mission kind without encoding a Pokémon answer", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "styles-campaign.css"), "utf8");
  for (const kind of ["trainer","encounter","route","arena"]) assert.match(source, new RegExp(`mission-kind-${kind}`));
  assert.match(source, /--mission-accent/);
  assert.match(source, /campaign-answer-types/);
  assert.doesNotMatch(source, /campaign-pokemon-art[^}]*--type-color/s);
});

test("campaign and knowledge world share the same local official Pokémon artwork", () => {
  const root = path.join(__dirname, "..");
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const network = fs.readFileSync(path.join(root, "network.js"), "utf8");
  const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
  const ids = [1, 4, 7, 10, 11, 13, 14, 16, 19, 21, 25, 56, 74, 95];
  assert.match(app, /function knowledgeArtwork\(item\) \{ return artworkUrl\(item\.id\); \}/);
  assert.match(app, /pokemonArtwork:id=>artworkUrl\(id\)/);
  assert.match(network, /assets\/pokemon-artwork\/\$\{numericId\}\.png/);
  assert.match(network, /other\/official-artwork\/\$\{id\}\.png/);
  for (const id of ids) {
    const relative = `assets/pokemon-artwork/${id}.png`;
    const artwork = fs.readFileSync(path.join(root, relative));
    assert.deepEqual([...artwork.subarray(0, 8)], [137,80,78,71,13,10,26,10], `${relative} PNG signature`);
    assert.ok(artwork.length > 50_000, `${relative} should contain official artwork`);
    assert.ok(worker.includes(`./${relative}`), `${relative} should be available offline`);
  }
});

test("campaign UI controller creates the Professor Berry tutorial without app.js", () => {
  const harness = createHarness();
  harness.controller.render();
  harness.controller.openTutorial(0);
  assert.match(harness.modalMarkup(), /campaign-tutorial-backdrop/);
  assert.match(harness.modalMarkup(), /assets\/professor-berry\.png/);
  assert.match(harness.modalMarkup(), />1\/4</);
  assert.match(harness.modalMarkup(), /campaign-tutorial-backdrop is-intro/);
  assert.match(harness.modalMarkup(), /campaign-tutorial-focus/);
  assert.equal(harness.element(".campaign-tutorial-backdrop").classList.contains("is-intro"), true);
  assert.equal(harness.state.campaign.tutorialStep, 0);
});

test("tutorial spotlight keeps campaign nodes square and inside the viewport", () => {
  assert.deepEqual(campaignUI.calculateFocusRect(
    { top: 100, left: 100, width: 82, height: 82 },
    { width: 1440, height: 1000 }
  ), { top: 90, left: 90, width: 102, height: 102 });
  assert.deepEqual(campaignUI.calculateFocusRect(
    { top: -30, left: 1375, width: 82, height: 82 },
    { width: 1440, height: 1000 }
  ), { top: 12, left: 1326, width: 102, height: 102 });
});

test("tutorial highlights only the explained node after the welcome step", () => {
  const harness = createHarness();
  harness.controller.render();
  harness.controller.openTutorial(1);
  assert.equal(harness.element(".campaign-tutorial-backdrop").classList.contains("has-spotlight"), true);
  assert.match(harness.modalMarkup(), /campaign-tutorial-focus/);
  assert.equal(harness.element(".campaign-tutorial-step b").textContent, "2/4");
  assert.equal(harness.focus.style.width, "100px");
  assert.equal(harness.focus.style.height, "100px");
});

test("tutorial step changes reuse one stable dialog and update only its content", () => {
  const harness = createHarness();
  harness.controller.render();
  harness.controller.openTutorial(0);
  const backdrop = harness.element(".campaign-tutorial-backdrop");
  harness.click("#campaignTutorialNext");
  assert.equal(harness.modalMounts(), 1);
  assert.equal(harness.element(".campaign-tutorial-backdrop"), backdrop);
  assert.equal(backdrop.dataset.tutorialStep, "2");
  assert.equal(backdrop.classList.contains("has-spotlight"), true);
  assert.equal(harness.element(".campaign-tutorial-step b").textContent, "2/4");
  assert.equal(harness.element("#campaignTutorialTitle").textContent, "campaign.tutorial.currentTitle");
});

test("tutorial locks wheel, touch and keyboard scrolling until it closes", () => {
  const harness = createHarness();
  harness.controller.render();
  harness.controller.openTutorial(1);
  assert.equal(harness.documentElement.classList.contains("campaign-tutorial-scroll-locked"), true);
  assert.equal(harness.body.classList.contains("campaign-tutorial-scroll-locked"), true);
  assert.equal(harness.dispatch("wheel").defaultPrevented, true);
  assert.equal(harness.dispatch("touchmove").defaultPrevented, true);
  assert.equal(harness.dispatch("keydown", { key: "PageDown" }).defaultPrevented, true);
  assert.equal(harness.dispatch("keydown", { key: "Enter" }).defaultPrevented, false);
  harness.click("#campaignTutorialSkip");
  assert.equal(harness.documentElement.classList.contains("campaign-tutorial-scroll-locked"), false);
  assert.equal(harness.body.classList.contains("campaign-tutorial-scroll-locked"), false);
  assert.equal(harness.dispatch("wheel").defaultPrevented, false);
});
