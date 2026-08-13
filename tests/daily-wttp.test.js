"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../whos-that-pokemon.js");
const service = require("../daily-service.js");
const { read } = require("./helpers.js");
const dataSource = require("../knowledge-data.js");
const data = require("../data.js");

function context() {
  return engine.createContext({ pokemon: dataSource.POKEMON, types: data.TYPES, typeChart: data.TYPE_CHART });
}

test("daily rounds are identical for a date and change across dates", () => {
  const ctx = context();
  const first = engine.createDailyRound({ context: ctx, date: "2026-08-04T01:00:00Z" });
  const repeat = engine.createDailyRound({ context: ctx, date: "2026-08-04T22:00:00Z" });
  const next = engine.createDailyRound({ context: ctx, date: "2026-08-05T12:00:00Z" });
  assert.deepEqual(first, repeat);
  assert.equal(first.mode, "daily");
  assert.equal(first.difficulty, "medium");
  assert.equal(first.balance.afterSecond, 1);
  assert.notEqual(first.id, next.id);
});

test("scoring rewards early solutions and statistics count once when called once", () => {
  const early = { status: "won", difficulty: "medium", revealed: 1, mode: "free" };
  const late = { status: "won", difficulty: "medium", revealed: 5, mode: "free" };
  assert.ok(engine.scoreRound(early).points > engine.scoreRound(late).points);
  const stats = engine.recordStatistics(null, early);
  assert.equal(stats.played, 1);
  assert.equal(stats.won, 1);
  assert.equal(stats.firstHintWins, 1);
});

test("remaining lives never change points at the same clue", () => {
  const fullLives = { status: "won", difficulty: "hard", revealed: 3, lives: 5, mode: "free" };
  const lastLife = { ...fullLives, lives: 1 };
  assert.equal(engine.scoreRound(fullLives).points, engine.scoreRound(lastLife).points);
  assert.equal(engine.scoreRound(fullLives).xp, engine.scoreRound(lastLife).xp);
});

test("daily service validates anonymous result buckets and distributions", () => {
  assert.equal(service.resultBucket({ solvedAtHint: 3 }), "hint3");
  assert.equal(service.resultBucket({ solvedAtHint: null }), "lost");
  const result = service.sanitizeDistribution({ counts: { hint1: 1, hint2: 1, lost: 2 } });
  assert.equal(result.total, 4);
  assert.equal(result.percentages.lost, 50);
});

test("Sprint 3 UI contains daily, XP, statistics and online-ready integration", () => {
  const app = read("app.js");
  const html = read("index.html");
  const css = read("styles-play.css");
  assert.match(app, /const BUILD_VERSION = "4\.3-sprint5-v1"/);
  assert.match(app, /createDailyRound/);
  assert.match(app, /completeWhosRound/);
  assert.match(app, /addXp\(score\.xp\)/);
  assert.match(app, /completeDailyGoalFromPokeidle/);
  assert.match(app, /round\?\.mode !== "daily" \|\| round\.status !== "won"/);
  assert.match(app, /dailyGoalCompleted:round\.status === "won"/);
  assert.match(app, /pendingUploads/);
  assert.match(html, /daily-service\.js/);
  assert.match(css, /\.whos-daily-card/);
  assert.match(css, /\.whos-stat-grid/);
});
