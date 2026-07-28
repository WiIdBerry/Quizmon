"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.join(__dirname, "..");
function read(file) { return fs.readFileSync(path.join(ROOT, file), "utf8"); }
function loadScript(file, expression) {
  const source = read(file);
  const context = { console, Intl, Date, Math, Object, Array, Set, Map, JSON };
  vm.createContext(context);
  vm.runInContext(`${source}\nglobalThis.__result = ${expression};`, context, { filename: file });
  return context.__result;
}
function placeholders(value) {
  return [...String(value).matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();
}
module.exports = { ROOT, read, loadScript, placeholders };
