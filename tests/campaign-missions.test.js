"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const campaign = require("../campaign.js");
const missions = require("../campaign-missions.js");
const pokemonData = require("../knowledge-data.js");
const contentData = require("../knowledge-content-data.js");

const dataSandbox = {};
const dataSource = fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8");
vm.runInNewContext(`${dataSource}\n;globalThis.__campaignTypeChart=TYPE_CHART;`, dataSandbox, { filename:"data.js" });
const missionContext = Object.freeze({
  pokemonById:pokemonData.BY_ID,
  itemById:contentData.ITEM_BY_ID,
  typeChart:dataSandbox.__campaignTypeChart
});

const EXPECTED_LOCATIONS = Object.freeze({
  "pallet-town": { pokemon:[1,4,7], items:[] },
  "rival-one": { pokemon:[1,4,7], items:[] },
  "route-one": { pokemon:[16,19], items:[] },
  "viridian-city": { pokemon:[], items:[4,17,18,22,28] },
  "route-twenty-two": { pokemon:[19,21,56], items:[] },
  "rival-two": { pokemon:[1,4,7,16], items:[] },
  "route-two": { pokemon:[10,13,16,19], items:[] },
  "viridian-forest": { pokemon:[10,11,13,14,25], items:[] },
  "pewter-gym": { pokemon:[74,95], items:[] }
});

const EXPECTED_TOPICS = Object.freeze({
  "pallet-town":["identity","types"],
  "rival-one":["types","starter-matchup"],
  "route-one":["identity","types","weakness","strategy"],
  "viridian-city":["items","item-scenario"],
  "route-twenty-two":["identity","types","weakness","strategy"],
  "rival-two":["identity","types","starter-matchup","weakness","strategy"],
  "route-two":["identity","types","weakness","strategy"],
  "viridian-forest":["identity","types","weakness","strategy","evolution"],
  "pewter-gym":["identity","types","weakness","strategy"]
});
const PROMPT_TYPE_NAMES = Object.freeze({
  normal:["Normal","Normal"], fire:["Feuer","Fire"], water:["Wasser","Water"], grass:["Pflanze","Grass"],
  electric:["Elektro","Electric"], ice:["Eis","Ice"], fighting:["Kampf","Fighting"], poison:["Gift","Poison"],
  ground:["Boden","Ground"], flying:["Flug","Flying"], psychic:["Psycho","Psychic"], bug:["Käfer","Bug"],
  rock:["Gestein","Rock"], ghost:["Geist","Ghost"], dragon:["Drache","Dragon"], dark:["Unlicht","Dark"],
  steel:["Stahl","Steel"]
});

test("Sprint 3 defines eight ten-question missions plus Rocko's fifteen-question arena", () => {
  assert.deepEqual(Object.keys(missions.MISSION_SPECS), Object.keys(EXPECTED_LOCATIONS));
  assert.equal(missions.MISSION_SPECS["chapter-reward"], undefined);
  for (const [nodeId, expected] of Object.entries(EXPECTED_LOCATIONS)) {
    const spec = missions.MISSION_SPECS[nodeId];
    assert.deepEqual(spec.allowedPokemonIds, expected.pokemon, nodeId);
    assert.deepEqual(spec.allowedItemIds, expected.items, nodeId);
    const arena = nodeId === "pewter-gym";
    assert.equal(spec.length, arena ? 15 : 10, nodeId);
    assert.equal(spec.requiredCorrect, arena ? 12 : 8, nodeId);
    assert.deepEqual(spec.allowedTopics, EXPECTED_TOPICS[nodeId], `${nodeId} topics`);
    assert.equal(spec.topicPlan.length, spec.length, `${nodeId} topic plan length`);
    assert.equal(missions.MISSION_QUESTION_PLANS[nodeId].length, spec.length, `${nodeId} fixed questions`);
    assert.equal(new Set(missions.MISSION_QUESTION_PLANS[nodeId]).size, spec.length, `${nodeId} fixed question IDs`);
    assert.equal(missions.MISSION_ANSWER_COUNTS[nodeId].length, spec.length, `${nodeId} answer counts`);
    spec.topicPlan.forEach(topic => assert.ok(spec.allowedTopics.includes(topic), `${nodeId} plans forbidden topic ${topic}`));
  }
});

test("every question pool is large enough, unique and restricted to its location", () => {
  for (const [nodeId, spec] of Object.entries(missions.MISSION_SPECS)) {
    const allowedPokemon = new Set(spec.allowedPokemonIds);
    const allowedItems = new Set(spec.allowedItemIds);
    const pool = missions.questionPool(nodeId, missionContext);
    assert.ok(pool.length >= spec.length, `${nodeId} has ${pool.length}/${spec.length} questions`);
    assert.equal(new Set(pool.map(question => question.id)).size, pool.length, `${nodeId} question IDs`);
    for (const question of pool) {
      assert.ok(question.prompt.de && question.prompt.en, `${question.id} prompt`);
      assert.ok(question.reviewPrompt.de && question.reviewPrompt.en, `${question.id} review prompt`);
      assert.notEqual(question.reviewPrompt.de, question.prompt.de, `${question.id} German review wording`);
      assert.notEqual(question.reviewPrompt.en, question.prompt.en, `${question.id} English review wording`);
      assert.ok(question.explanation.de && question.explanation.en, `${question.id} explanation`);
      assert.ok(spec.allowedTopics.includes(question.topic), `${question.id} uses forbidden topic ${question.topic}`);
      assert.ok(question.options.some(option => option.id === question.correctOptionId), `${question.id} correct option`);
      question.subjectPokemonIds.forEach(id => assert.ok(allowedPokemon.has(id), `${question.id} leaks Pokémon ${id}`));
      question.subjectItemIds.forEach(id => assert.ok(allowedItems.has(id), `${question.id} leaks item ${id}`));
      question.options.forEach(option => {
        if (option.id.startsWith("pokemon:")) assert.ok(allowedPokemon.has(Number(option.id.slice(8))), `${question.id} offers non-local ${option.id}`);
        if (option.id.startsWith("item:")) assert.ok(allowedItems.has(Number(option.id.slice(5))), `${question.id} offers non-local ${option.id}`);
      });
    }
  }
});

test("Alabastia contains only positive starter-name and starter-type fundamentals", () => {
  const pool = missions.questionPool("pallet-town", missionContext);
  const starterTypes = new Set(["grass","poison","fire","water"]);
  assert.deepEqual([...new Set(pool.map(question => question.topic))].sort(), ["identity","types"]);
  for (const question of pool) {
    const copy = [question.prompt.de,question.prompt.en,question.explanation.de,question.explanation.en,...question.options.flatMap(option => [option.label.de,option.label.en])].join(" ");
    assert.doesNotMatch(copy, /effektiv|effective|Schwäche|weakness|Vorteil|advantage|Attacke|move type|Schaden|damage|immun/i, question.id);
    for (const candidate of question.options) {
      const encodedTypes = candidate.id.startsWith("type:") ? [candidate.id.slice(5)]
        : candidate.id.startsWith("combo:") ? candidate.id.slice(6).split("+")
          : candidate.id.startsWith("statement:") ? candidate.id.split(":").at(-1).split("+") : [];
      encodedTypes.forEach(type => assert.ok(starterTypes.has(type), `${question.id} introduces ${type}`));
    }
  }
});

test("colored prompt types repeat only information already stated in the question", () => {
  for (const nodeId of Object.keys(missions.MISSION_SPECS)) {
    for (const question of missions.questionPool(nodeId, missionContext)) {
      assert.ok(Array.isArray(question.promptTypes), `${question.id} prompt types`);
      for (const type of question.promptTypes) {
        const labels = PROMPT_TYPE_NAMES[type];
        assert.ok(labels, `${question.id} uses an unapproved visual prompt type ${type}`);
        assert.match(question.prompt.de, new RegExp(labels[0], "i"), `${question.id} reveals ${type} before it is stated in German`);
        assert.match(question.prompt.en, new RegExp(labels[1], "i"), `${question.id} reveals ${type} before it is stated in English`);
      }
    }
  }
});

test("campaign questions never use base stats, size, weight or Pokédex-number trivia", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "campaign-missions.js"), "utf8");
  assert.doesNotMatch(source, /STAT_NAMES|pokemon\.stats|\.height\b|\.weight\b|topic:\s*"comparison"|higher-|lower-|Pokédexnummer|Pokédex number/);
  for (const nodeId of Object.keys(missions.MISSION_SPECS)) {
    const pool = missions.questionPool(nodeId, missionContext);
    assert.equal(pool.some(question => ["stats","comparison","height","weight","dex-number","encounter-rate"].includes(question.topic)), false, nodeId);
  }
});

test("type effectiveness starts with the rival and evolutions start in Viridian Forest", () => {
  const palletTopics = new Set(missions.questionPool("pallet-town", missionContext).map(question => question.topic));
  const rivalTopics = new Set(missions.questionPool("rival-one", missionContext).map(question => question.topic));
  assert.equal(palletTopics.has("weakness"), false);
  assert.equal(palletTopics.has("starter-matchup"), false);
  assert.equal(rivalTopics.has("starter-matchup"), true);
  for (const nodeId of Object.keys(missions.MISSION_SPECS)) {
    const hasEvolution = missions.questionPool(nodeId, missionContext).some(question => question.topic === "evolution");
    assert.equal(hasEvolution, nodeId === "viridian-forest", nodeId);
  }
});

test("every generated weakness answer follows the stored type chart", () => {
  for (const nodeId of Object.keys(missions.MISSION_SPECS)) {
    for (const question of missions.questionPool(nodeId, missionContext)) {
      if (question.topic !== "weakness" || question.subjectPokemonIds.length !== 1 || !question.correctOptionId.startsWith("type:")) continue;
      const pokemon = pokemonData.BY_ID.get(question.subjectPokemonIds[0]);
      const correctType = question.correctOptionId.slice(5);
      assert.ok(missions.multiplier(missionContext.typeChart, correctType, pokemon.types) > 1, question.id);
      for (const candidate of question.options.filter(option => option.id.startsWith("type:") && option.id !== question.correctOptionId)) {
        assert.ok(missions.multiplier(missionContext.typeChart, candidate.id.slice(5), pokemon.types) <= 1, `${question.id} has false distractor ${candidate.id}`);
      }
    }
  }
});

test("curated type-relation questions contain exactly one effective type", () => {
  for (const nodeId of Object.keys(missions.MISSION_SPECS)) {
    for (const question of missions.questionPool(nodeId, missionContext).filter(item => item.id.includes("-relation-"))) {
      const defendingType = question.promptTypes[0];
      assert.ok(defendingType, `${question.id} defending type`);
      const effectiveOptions = question.options.filter(candidate => candidate.id.startsWith("type:") && missions.multiplier(missionContext.typeChart, candidate.id.slice(5), [defendingType]) > 1);
      assert.deepEqual(effectiveOptions.map(candidate => candidate.id), [question.correctOptionId], question.id);
    }
  }
});

test("built missions use fixed learning order and progressively larger answer sets", () => {
  let seed = 13579;
  const random = () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (const [nodeId, spec] of Object.entries(missions.MISSION_SPECS)) {
    const mission = missions.buildMission(nodeId, missionContext, random);
    assert.equal(mission.questions.length, spec.length, nodeId);
    assert.equal(new Set(mission.questions.map(question => question.id)).size, spec.length, nodeId);
    assert.deepEqual(mission.questions.map(question => question.id), [...missions.MISSION_QUESTION_PLANS[nodeId]], `${nodeId} fixed set and order`);
    assert.deepEqual(mission.questions.map(question => question.topic), [...spec.topicPlan], `${nodeId} learning order`);
    assert.deepEqual(mission.questions.map(question => question.options.length), [...missions.MISSION_ANSWER_COUNTS[nodeId]], `${nodeId} answer progression`);
    assert.equal(new Set(mission.questions.map(question => question.prompt.de)).size, spec.length, `${nodeId} unique German prompts`);
    assert.equal(new Set(mission.questions.map(question => question.prompt.en)).size, spec.length, `${nodeId} unique English prompts`);
    assert.equal(missions.isCorrect(mission.questions[0], mission.questions[0].correctOptionId), true);
    assert.equal(missions.isCorrect(mission.questions[0], "definitely-wrong"), false);
    const repeatedMission = missions.buildMission(nodeId, missionContext, () => .91);
    assert.deepEqual(repeatedMission.questions.map(question => question.id), mission.questions.map(question => question.id), `${nodeId} repeat set`);
  }
});

test("mistake reviews are rephrased and become guided binary questions after repeated misses", () => {
  for (const nodeId of Object.keys(missions.MISSION_SPECS)) {
    const original = missions.buildMission(nodeId, missionContext, () => .37).questions[0];
    const review = missions.buildReviewQuestion(original, 0, () => .37);
    assert.equal(review.reviewOf, original.id, nodeId);
    assert.notEqual(review.prompt.de, original.prompt.de, `${nodeId} German rephrasing`);
    assert.notEqual(review.prompt.en, original.prompt.en, `${nodeId} English rephrasing`);
    assert.equal(review.correctOptionId, original.correctOptionId, nodeId);
    assert.ok(review.options.some(option => option.id === original.correctOptionId), `${nodeId} correct review option`);
    const guided = missions.buildReviewQuestion(original, 2, () => .37);
    assert.equal(guided.guided, true, nodeId);
    assert.equal(guided.options.length, 2, nodeId);
    assert.ok(guided.options.some(option => option.id === original.correctOptionId), `${nodeId} guided correct option`);
  }
});

test("required progress unlocks in order while Route 22 and the second rival remain optional", () => {
  let progress = campaign.blankProgress();
  assert.equal(progress.currentNodeId, "pallet-town");
  assert.equal(campaign.canStartNode(progress, "route-one"), false);
  for (const nodeId of ["pallet-town","rival-one","route-one","viridian-city"]) progress = campaign.completeNode(progress, nodeId);
  assert.equal(progress.currentNodeId, "route-two");
  assert.equal(campaign.nodeStatus(progress, "route-twenty-two"), "available");
  assert.equal(campaign.nodeStatus(progress, "rival-two"), "locked");
  progress = campaign.completeNode(progress, "route-twenty-two");
  assert.equal(progress.currentNodeId, "route-two");
  assert.equal(campaign.nodeStatus(progress, "rival-two"), "available");
  progress = campaign.completeNode(progress, "rival-two");
  assert.equal(progress.currentNodeId, "route-two");
  for (const nodeId of ["route-two","viridian-forest","pewter-gym"]) progress = campaign.completeNode(progress, nodeId);
  assert.equal(progress.currentNodeId, "chapter-reward");
  assert.equal(campaign.canStartNode(progress, "chapter-reward"), false);
  assert.deepEqual(campaign.chapterProgress(progress), { completed:7, total:8, percent:88 });
});
