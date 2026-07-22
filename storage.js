(function (root) {
  "use strict";
  const BACKUP_MARKER = ".backup.";

  function backupPrefix(storageKey) { return `${storageKey}${BACKUP_MARKER}`; }
  function listBackupKeys(storage, storageKey) {
    const prefix = backupPrefix(storageKey);
    const keys = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(prefix)) keys.push(key);
    }
    return keys.sort();
  }
  function createBackup(storage, storageKey, value, timestamp = Date.now()) {
    const key = `${backupPrefix(storageKey)}${timestamp}`;
    storage.setItem(key, JSON.stringify(value));
    return key;
  }
  function clearQuizmonData(storage, storageKey, legacyKeys = []) {
    const keys = [...legacyKeys, storageKey, ...listBackupKeys(storage, storageKey)];
    [...new Set(keys)].forEach(key => storage.removeItem(key));
    return keys.length;
  }

  const api = Object.freeze({ backupPrefix, listBackupKeys, createBackup, clearQuizmonData });
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonStorage = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
