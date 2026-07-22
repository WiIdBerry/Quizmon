const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const css = fs.readFileSync('styles-base.css', 'utf8');

test('main content is not an oversized live region and has a skip target', () => {
  assert.match(html, /class="skip-link" href="#view"/);
  assert.match(html, /<main id="view" class="view" tabindex="-1"><\/main>/);
  assert.doesNotMatch(html, /<main[^>]+aria-live=/);
});

test('route changes use a dedicated polite announcer', () => {
  assert.match(html, /id="routeAnnouncer"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.match(app, /function announceRoute\(\)/);
});

test('settings selects receive programmatic labels and descriptions', () => {
  assert.match(app, /aria-labelledby="\$\{labelId\}" aria-describedby="\$\{descriptionId\}"/);
});

test('small header controls meet a 44px mobile touch target', () => {
  assert.match(css, /min-width:44px; min-height:44px/);
});
