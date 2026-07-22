"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");

test("all local script and stylesheet references exist", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match => match[1]);
  for (const ref of refs.filter(ref => !ref.startsWith("http") && !ref.startsWith("manifest"))) {
    assert.ok(fs.existsSync(path.join(root, ref)), `missing ${ref}`);
  }
});

test("stylesheet imports exist", () => {
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const imports = [...css.matchAll(/@import url\("(.+?)"\)/g)].map(match => match[1]);
  assert.equal(imports.length, 3);
  for (const ref of imports) assert.ok(fs.existsSync(path.resolve(root, ref)), `missing ${ref}`);
});

test("service worker shell entries exist locally", () => {
  const sw = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
  const shellBlock = sw.match(/const SHELL = \[([\s\S]*?)\];/)[1];
  const refs = [...shellBlock.matchAll(/"\.\/(.*?)"/g)].map(match => match[1]).filter(Boolean);
  for (const ref of refs) assert.ok(fs.existsSync(path.join(root, ref)), `missing shell asset ${ref}`);
});
