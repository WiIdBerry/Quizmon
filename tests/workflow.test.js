"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { read } = require("./helpers.js");
const workflow = read(".github/workflows/static.yml");

test("deployment is blocked until verification passes", () => {
  assert.match(workflow, /actions\/setup-node@v4/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /browser-actions\/setup-chrome@v1/);
  assert.match(workflow, /npm run test:browser/);
  assert.match(workflow, /needs: verify/);
  assert.ok(workflow.indexOf("npm run check") < workflow.indexOf("actions\/upload-pages-artifact@v3"));
});
