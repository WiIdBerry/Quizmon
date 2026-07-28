"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const flashcards = require("../flashcards.js");

test("flashcard kinds and count options are explicit and sanitized", () => {
  assert.deepEqual(flashcards.KINDS, ["types","pokemon","moves","abilities","items"]);
  assert.deepEqual(flashcards.COUNT_OPTIONS, [10,20,"all"]);
  assert.equal(flashcards.normalizeKind("moves"), "moves");
  assert.equal(flashcards.normalizeKind("unknown"), "pokemon");
  assert.equal(flashcards.normalizeCount("all"), "all");
  assert.equal(flashcards.normalizeCount(20), 20);
  assert.equal(flashcards.normalizeCount(7), 10);
});

test("card selection shuffles without mutating the source and respects session size", () => {
  const source = Array.from({length:15},(_,index)=>index+1);
  const selected = flashcards.select(source, 10, () => 0);
  assert.deepEqual(source, Array.from({length:15},(_,index)=>index+1));
  assert.equal(selected.length, 10);
  assert.deepEqual(flashcards.select(source, "all", () => 0).sort((a,b)=>a-b), source);
});

test("flashcard sessions reveal and navigate within deck bounds", () => {
  const session = flashcards.createSession(["a","b","c"], { kind:"types", count:"all", random:()=>0.99, startedAt:"2026-07-28T00:00:00.000Z" });
  assert.equal(session.kind, "types");
  assert.equal(flashcards.current(session), "a");
  flashcards.reveal(session, true);
  assert.equal(session.revealed, true);
  flashcards.move(session, 1);
  assert.equal(session.index, 1);
  assert.equal(session.revealed, false);
  flashcards.move(session, 99);
  assert.equal(session.index, 2);
  flashcards.move(session, -99);
  assert.equal(session.index, 0);
});

test("progress reports first, last and percentage states", () => {
  const session = { deck:[1,2,3,4], index:0, revealed:false };
  assert.deepEqual(flashcards.progress(session), { current:1,total:4,percent:25,first:true,last:false });
  session.index = 3;
  assert.deepEqual(flashcards.progress(session), { current:4,total:4,percent:100,first:false,last:true });
});

test("reshuffle resets the visible card and swipe detection stays deliberate", () => {
  const session = { deck:[1,2,3], index:2, revealed:true };
  flashcards.reshuffle(session, () => 0);
  assert.equal(session.index, 0);
  assert.equal(session.revealed, false);
  assert.equal(flashcards.swipeAction(200,100), "next");
  assert.equal(flashcards.swipeAction(100,200), "previous");
  assert.equal(flashcards.swipeAction(100,130), null);
});

test("self-assessment moves unsure cards into an automatic review round", () => {
  const session = flashcards.createSession(["fire","water","grass"], { kind:"types", count:"all", random:()=>0.99, id:"session-1" });
  flashcards.reveal(session, true);
  assert.equal(flashcards.rateCurrent(session, "known").transition, "next");
  flashcards.reveal(session, true);
  assert.equal(flashcards.rateCurrent(session, "unsure").transition, "next");
  flashcards.reveal(session, true);
  const transition = flashcards.rateCurrent(session, "unknown", { random:()=>0.99 });
  assert.equal(transition.transition, "review");
  assert.equal(transition.reviewCount, 2);
  assert.equal(session.phase, "review");
  assert.equal(session.reviewRound, 1);
  assert.deepEqual(new Set(session.deck), new Set(["water","grass"]));
  assert.equal(flashcards.ratingFor(session), null, "review round must require a fresh assessment");
});

test("review ratings finish in a summary without changing the initial assessment", () => {
  const session = flashcards.createSession(["fire","water"], { kind:"types", count:"all", random:()=>0.99, id:"session-2" });
  flashcards.reveal(session, true);
  flashcards.rateCurrent(session, "unsure", { random:()=>0.99 });
  flashcards.reveal(session, true);
  flashcards.rateCurrent(session, "known", { random:()=>0.99 });
  assert.equal(session.phase, "review");
  flashcards.reveal(session, true);
  const result = flashcards.rateCurrent(session, "known", { completedAt:"2026-07-28T18:00:00.000Z" });
  assert.equal(result.transition, "summary");
  assert.deepEqual(flashcards.summary(session), {
    total:2, known:1, unsure:1, unknown:0, reviewed:1, unresolved:0, reviewRounds:1,
    startedAt:session.startedAt, completedAt:"2026-07-28T18:00:00.000Z"
  });
});

test("unresolved cards persist separately from objective quiz statistics", () => {
  const session = flashcards.createSession([{id:25},{id:1}], { kind:"pokemon", count:"all", random:()=>0.99, id:"session-3" });
  flashcards.reveal(session, true);
  flashcards.rateCurrent(session, "unknown", { random:()=>0.99 });
  flashcards.reveal(session, true);
  flashcards.rateCurrent(session, "known", { random:()=>0.99 });
  assert.equal(session.phase, "review");
  flashcards.reveal(session, true);
  flashcards.rateCurrent(session, "unsure", { completedAt:"2026-07-28T18:05:00.000Z" });
  const state = flashcards.applySessionToLearningState({}, session, { validKeys:new Set(["pokemon:1","pokemon:25"]), now:"2026-07-28T18:05:00.000Z" });
  assert.equal(state.review.length, 1);
  assert.equal(state.review[0].key, "pokemon:25");
  assert.equal(state.review[0].rating, "unsure");
  assert.equal(state.history.length, 1);
  assert.equal(state.history[0].unresolved, 1);
});

test("stored review data is sanitized, deduplicated and limited to valid card keys", () => {
  const state = flashcards.sanitizeLearningState({
    review:[
      {key:"types:fire",rating:"unknown",updatedAt:"2026-07-27T10:00:00Z"},
      {key:"types:fire",rating:"unsure",updatedAt:"2026-07-28T10:00:00Z"},
      {key:"pokemon:9999",rating:"unknown"},
      {key:"items:1",rating:"known"}
    ]
  }, {validKeys:new Set(["types:fire","items:1"])});
  assert.deepEqual(state.review.map(entry=>[entry.key,entry.rating]), [["types:fire","unsure"]]);
  assert.deepEqual(flashcards.parseCardKey("moves:15"), {key:"moves:15",kind:"moves",id:15});
  assert.equal(flashcards.cardKey("types","water"), "types:water");
});
