"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Speedrun = require("../speedrun.js");

const ROOT = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");

test("Speedrun accepts only the three planned durations", () => {
  assert.deepEqual(Speedrun.DURATIONS, [30, 60, 90]);
  assert.equal(Speedrun.normalizeDuration("30"), 30);
  assert.equal(Speedrun.normalizeDuration(60), 60);
  assert.equal(Speedrun.normalizeDuration(45), 0);
  assert.equal(Speedrun.normalizeDuration("off"), 0);
});

test("statistics keep every quiz and duration separate", () => {
  const statistics = Speedrun.blankStatistics();
  assert.deepEqual(Object.keys(statistics.modes), ["effectiveness", "multiplier", "impact", "pokemon"]);
  Object.values(statistics.modes).forEach(records => assert.deepEqual(Object.keys(records), ["30", "60", "90"]));
  const first = Speedrun.recordRun(statistics, { id:"one", date:"2026-08-10T10:00:00Z", mode:"impact", duration:30, answers:9, correct:7 });
  assert.equal(first.record.bestCorrect, 7);
  assert.equal(Speedrun.bestFor(first.statistics, "impact", 60).runs, 0);
  assert.equal(Speedrun.bestFor(first.statistics, "pokemon", 30).runs, 0);
});

test("more correct answers beat accuracy while ties use accuracy", () => {
  let statistics = Speedrun.blankStatistics();
  let result = Speedrun.recordRun(statistics, { id:"one", date:"2026-08-10T10:00:00Z", mode:"effectiveness", duration:60, answers:10, correct:8 });
  statistics = result.statistics;
  result = Speedrun.recordRun(statistics, { id:"two", date:"2026-08-10T10:01:00Z", mode:"effectiveness", duration:60, answers:8, correct:7 });
  assert.equal(result.newBest, false, "higher accuracy cannot replace a run with more correct answers");
  result = Speedrun.recordRun(result.statistics, { id:"three", date:"2026-08-10T10:02:00Z", mode:"effectiveness", duration:60, answers:8, correct:8 });
  assert.equal(result.newBest, true);
  assert.equal(result.record.bestCorrect, 8);
  assert.equal(result.record.bestAccuracy, 100);
});

test("a deadline uses wall-clock time and therefore survives background pauses", () => {
  const deadline = 100000;
  assert.equal(Speedrun.remainingSeconds(deadline, 69501), 31);
  assert.equal(Speedrun.remainingSeconds(deadline, 70000), 30);
  assert.equal(Speedrun.remainingMs(deadline, 120000), 0);
});

test("malformed imported speedrun data is repaired", () => {
  const repaired = Speedrun.sanitizeStatistics({
    modes: { impact: { 30: { runs:-4, bestAnswered:5, bestCorrect:20, bestAccuracy:200 } } },
    history: [{ id:"bad", date:"invalid", mode:"impact", duration:30, answers:4, correct:2 }]
  });
  assert.equal(repaired.modes.impact["30"].runs, 0);
  assert.equal(repaired.modes.impact["30"].bestCorrect, 5);
  assert.equal(repaired.modes.impact["30"].bestAccuracy, 100);
  assert.deepEqual(repaired.history, []);
});

test("speedrun is wired into setup, countdown, timer, automatic feedback and summary", () => {
  const app = read("app.js");
  const html = read("index.html");
  const sw = read("service-worker.js");
  assert.match(html, /<script src="speedrun\.js"><\/script>/);
  assert.match(sw, /"\.\/speedrun\.js"/);
  assert.match(app, /\[\[0,t\("speedrun\.off"\)\],\[30,"30 s"\],\[60,"60 s"\],\[90,"90 s"\]\]/);
  assert.match(app, /function renderSpeedrunCountdown/);
  assert.match(app, /session\.speedrun\.deadlineAt = now \+ duration \* 1000/);
  assert.match(app, /setInterval\(updateSpeedrunClock, 100\)/);
  assert.match(app, /function showSpeedrunFeedback/);
  assert.match(app, /speedrunAdvanceId = setTimeout/);
  assert.match(app, /function renderSpeedrunSummary/);
});

test("Speedrun rewards are isolated from normal learning metrics", () => {
  const app = read("app.js");
  assert.match(app, /const learningEvent=isSpeedrun\?null:recordLearningEvent/);
  assert.match(app, /if\(!isSpeedrun\)\{const modeStats=/);
  assert.match(app, /if\(!isReview&&!isSpeedrun\)/);
  assert.match(app, /if\(!isSpeedrun\|\|!correct\)updateMistakeBook/);
  assert.match(app, /const bonusXp=correct&&!isSpeedrun\?comboBonusFor/);
  assert.match(app, /isSpeedrun&&!correct\?\{\.\.\.dailyGoalInfo\(\)/);
});

test("PokéIdle remains outside Speedrun", () => {
  assert.deepEqual(Speedrun.MODES, ["effectiveness", "multiplier", "impact", "pokemon"]);
  assert.equal(Speedrun.MODES.includes("whosThat"), false);
  assert.equal(Speedrun.MODES.includes("daily"), false);
  assert.equal(Speedrun.MODES.includes("review"), false);
});
