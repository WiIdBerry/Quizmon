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

test("backup creation and listing use the Quizmon namespace", () => {
  const storage = new MemoryStorage();
  storageApi.createBackup(storage, "quizmon.beta1", { value: 1 }, 100);
  storageApi.createBackup(storage, "quizmon.beta1", { value: 2 }, 200);
  assert.deepEqual(storageApi.listBackupKeys(storage, "quizmon.beta1"), ["quizmon.beta1.backup.200", "quizmon.beta1.backup.100"]);
});

test("backup pruning keeps the newest backups", () => {
  const storage = new MemoryStorage();
  [100, 200, 300, 400].forEach(time => storageApi.createBackup(storage, "quizmon.beta1", { time }, time));
  assert.deepEqual(storageApi.pruneBackups(storage, "quizmon.beta1", 2), ["quizmon.beta1.backup.200", "quizmon.beta1.backup.100"]);
  assert.deepEqual(storageApi.listBackupKeys(storage, "quizmon.beta1"), ["quizmon.beta1.backup.400", "quizmon.beta1.backup.300"]);
});

test("full reset removes current, legacy, backups and migration data only", () => {
  const storage = new MemoryStorage();
  [
    ["quizmon.beta1", "current"],
    ["quizmon.beta1.backup.1", "backup"],
    ["quizmon.temp.migration", "temp"],
    ["pokemonTypeLearner.v0.6.1", "legacy"],
    ["unrelated", "keep"]
  ].forEach(([key, value]) => storage.setItem(key, value));
  const removed = storageApi.clearQuizmonData(storage, "quizmon.beta1", ["pokemonTypeLearner.v0.6.1"]);
  assert.ok(removed.includes("quizmon.beta1"));
  assert.equal(storage.getItem("quizmon.beta1"), null);
  assert.equal(storage.getItem("quizmon.beta1.backup.1"), null);
  assert.equal(storage.getItem("quizmon.temp.migration"), null);
  assert.equal(storage.getItem("pokemonTypeLearner.v0.6.1"), null);
  assert.equal(storage.getItem("unrelated"), "keep");
});
