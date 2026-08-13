"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const locator = require("./browser-locator.js");

test("browser locator includes Chrome and Edge paths on Windows", () => {
  const candidates = locator.standardCandidates({
    PROGRAMFILES: "C:\\Program Files",
    "PROGRAMFILES(X86)": "C:\\Program Files (x86)",
    LOCALAPPDATA: "C:\\Users\\Quizmon\\AppData\\Local"
  }, "win32");
  assert.ok(candidates.some(candidate => /Google[\\/]Chrome[\\/]Application[\\/]chrome\.exe$/i.test(candidate)));
  assert.ok(candidates.some(candidate => /Microsoft[\\/]Edge[\\/]Application[\\/]msedge\.exe$/i.test(candidate)));
});

test("browser locator discovers a non-empty Playwright Chromium executable", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "quizmon-browser-locator-"));
  try {
    const browser = path.join(temporary, "chromium-1234", "chrome-linux64", "chrome");
    fs.mkdirSync(path.dirname(browser), { recursive: true });
    fs.writeFileSync(browser, "#!/bin/sh\nexit 0\n", { mode: 0o700 });
    assert.equal(locator.findInBrowserCache(temporary, process.platform), browser);
    assert.equal(locator.findBrowser({ env: { PLAYWRIGHT_BROWSERS_PATH: temporary }, home: temporary, skipPlaywrightApi: true }), browser);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("browser locator rejects empty placeholder executables", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "quizmon-browser-empty-"));
  try {
    const browser = path.join(temporary, "chromium");
    fs.writeFileSync(browser, "", { mode: 0o700 });
    assert.equal(locator.isBrowserFile(browser), false);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
