"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const storageApi = require("../storage.js");

class MemoryStorage {
  constructor() { this.data = new Map(); }
  get length() { return this.data.size; }
  key(index) { return [...this.data.keys()][index] ?? null; }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
}

test("backup creation uses the Quizmon backup namespace", () => {
  const storage = new MemoryStorage();
  const key = storageApi.createBackup(storage, "quizmon.beta1", { stats: { total: 4 } }, 1234);
  assert.equal(key, "quizmon.beta1.backup.1234");
  assert.deepEqual(JSON.parse(storage.getItem(key)), { stats: { total: 4 } });
});

test("full reset deletes current, legacy and backup data but not unrelated keys", () => {
  const storage = new MemoryStorage();
  storage.setItem("quizmon.beta1", "current");
  storage.setItem("quizmon.beta1.backup.1", "backup");
  storage.setItem("pokemonTypeLearner.v0.6.1", "legacy");
  storage.setItem("unrelated", "keep");
  storageApi.clearQuizmonData(storage, "quizmon.beta1", ["pokemonTypeLearner.v0.6.1"]);
  assert.equal(storage.getItem("quizmon.beta1"), null);
  assert.equal(storage.getItem("quizmon.beta1.backup.1"), null);
  assert.equal(storage.getItem("pokemonTypeLearner.v0.6.1"), null);
  assert.equal(storage.getItem("unrelated"), "keep");
});
