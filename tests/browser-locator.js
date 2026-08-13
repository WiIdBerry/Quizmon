"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function isBrowserFile(candidate, platform = process.platform) {
  if (!candidate) return false;
  try {
    const stat = fs.statSync(candidate);
    if (!stat.isFile() || stat.size === 0) return false;
    if (platform !== "win32") fs.accessSync(candidate, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function standardCandidates(env = process.env, platform = process.platform) {
  const candidates = [env.CHROME_PATH, env.CHROMIUM_PATH, env.BROWSER_PATH];
  if (platform === "win32") {
    for (const root of [env.PROGRAMFILES, env["PROGRAMFILES(X86)"], env.LOCALAPPDATA].filter(Boolean)) {
      candidates.push(
        path.join(root, "Google", "Chrome", "Application", "chrome.exe"),
        path.join(root, "Microsoft", "Edge", "Application", "msedge.exe"),
        path.join(root, "Chromium", "Application", "chrome.exe")
      );
    }
  } else if (platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium"
    );
  } else {
    candidates.push(
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/microsoft-edge",
      "/usr/bin/microsoft-edge-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/snap/bin/chromium"
    );
  }
  return [...new Set(candidates.filter(Boolean))];
}

function playwrightApiCandidate() {
  for (const packageName of ["playwright", "playwright-core", "@playwright/test"]) {
    try {
      const api = require(packageName);
      const candidate = api.chromium?.executablePath?.();
      if (isBrowserFile(candidate)) return candidate;
    } catch {
      // The smoke test works without Playwright when a system browser exists.
    }
  }
  return null;
}

function cacheRoots(env = process.env, platform = process.platform, home = os.homedir()) {
  const roots = [env.PLAYWRIGHT_BROWSERS_PATH];
  if (platform === "win32") {
    if (env.LOCALAPPDATA) roots.push(path.join(env.LOCALAPPDATA, "ms-playwright"));
  } else if (platform === "darwin") {
    roots.push(path.join(home, "Library", "Caches", "ms-playwright"));
  } else {
    roots.push(path.join(home, ".cache", "ms-playwright"), "/ms-playwright");
  }
  return [...new Set(roots.filter(Boolean))];
}

function browserName(name) {
  return /^(chrome|chromium|chrome-headless-shell|headless_shell|chrome\.exe|chromium\.exe|headless_shell\.exe)$/i.test(name);
}

function findInBrowserCache(root, platform = process.platform, maxDepth = 5) {
  if (!root || !fs.existsSync(root)) return null;
  const queue = [{ directory: root, depth: 0 }];
  while (queue.length) {
    const { directory, depth } = queue.shift();
    let entries = [];
    try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch { continue; }
    entries.sort((left, right) => right.name.localeCompare(left.name, undefined, { numeric: true }));
    for (const entry of entries) {
      const candidate = path.join(directory, entry.name);
      if (entry.isFile() && browserName(entry.name) && isBrowserFile(candidate, platform)) return candidate;
      if (entry.isDirectory() && depth < maxDepth) queue.push({ directory: candidate, depth: depth + 1 });
    }
  }
  return null;
}

function findBrowser(options = {}) {
  const env = options.env || process.env;
  const platform = options.platform || process.platform;
  const home = options.home || os.homedir();
  for (const candidate of standardCandidates(env, platform)) {
    if (isBrowserFile(candidate, platform)) return candidate;
  }
  const apiCandidate = options.skipPlaywrightApi ? null : playwrightApiCandidate();
  if (apiCandidate) return apiCandidate;
  for (const root of cacheRoots(env, platform, home)) {
    const candidate = findInBrowserCache(root, platform);
    if (candidate) return candidate;
  }
  return null;
}

module.exports = Object.freeze({ findBrowser, isBrowserFile, standardCandidates, cacheRoots, findInBrowserCache });
