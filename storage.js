(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonStorage = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const BACKUP_MARKER = ".backup.";
  const DEFAULT_NAMESPACES = Object.freeze(["quizmon.", "pokemonTypeLearner.", "pokemontyplearner."]);

  function backupPrefix(storageKey) { return `${storageKey}${BACKUP_MARKER}`; }
  function allKeys(storage) {
    const keys = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key) keys.push(key);
    }
    return keys;
  }
  function listBackupKeys(storage, storageKey) {
    const prefix = backupPrefix(storageKey);
    return allKeys(storage).filter(key => key.startsWith(prefix)).sort((a, b) => {
      return Number(b.slice(prefix.length)) - Number(a.slice(prefix.length));
    });
  }
  function createBackup(storage, storageKey, value, timestamp = Date.now()) {
    const key = `${backupPrefix(storageKey)}${timestamp}`;
    storage.setItem(key, JSON.stringify(value));
    return key;
  }
  function pruneBackups(storage, storageKey, limit = 3) {
    const keep = Math.max(0, Number(limit) || 0);
    const removed = listBackupKeys(storage, storageKey).slice(keep);
    removed.forEach(key => storage.removeItem(key));
    return removed;
  }
  function quizmonDataKeys(storage, storageKey, legacyKeys = [], namespacePrefixes = DEFAULT_NAMESPACES) {
    const exact = new Set([storageKey, ...(legacyKeys || [])].filter(Boolean));
    return allKeys(storage).filter(key => exact.has(key) || namespacePrefixes.some(prefix => key.startsWith(prefix)));
  }
  function clearQuizmonData(storage, storageKey, legacyKeys = [], namespacePrefixes = DEFAULT_NAMESPACES) {
    const keys = quizmonDataKeys(storage, storageKey, legacyKeys, namespacePrefixes);
    keys.forEach(key => storage.removeItem(key));
    return keys;
  }

  return Object.freeze({
    BACKUP_MARKER, DEFAULT_NAMESPACES, backupPrefix, allKeys, listBackupKeys,
    createBackup, pruneBackups, quizmonDataKeys, clearQuizmonData
  });
});
