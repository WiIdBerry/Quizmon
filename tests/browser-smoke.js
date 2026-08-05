"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const MIME = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8", ".webmanifest":"application/manifest+json", ".svg":"image/svg+xml", ".png":"image/png" };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function startServer() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://localhost");
    const relative = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const file = path.resolve(ROOT, `.${relative}`);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404); response.end("Not found"); return;
    }
    response.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream");
    response.setHeader("Cache-Control", "no-store");
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve({ server, port:server.address().port }));
  });
}

function chromeExecutable() {
  const candidates = [process.env.CHROME_PATH, process.env.CHROMIUM_PATH, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

async function launchChrome() {
  const executable = chromeExecutable();
  if (!executable) throw new Error("Chrome/Chromium executable not found");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "quizmon-browser-"));
  const child = spawn(executable, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--allow-file-access-from-files",
    "--disable-background-networking", "--disable-default-apps", "--no-first-run",
    "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"
  ], { stdio:["ignore","ignore","pipe"] });
  let stderr = "";
  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Chrome DevTools timeout\n${stderr.slice(-2000)}`)), 15000);
    child.stderr.on("data", chunk => {
      stderr += chunk.toString();
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    child.once("exit", code => { clearTimeout(timer); reject(new Error(`Chrome exited early (${code})\n${stderr.slice(-2000)}`)); });
  });
  return { child, profile, wsUrl };
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }
  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once:true });
      this.ws.addEventListener("error", reject, { once:true });
    });
    this.ws.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id); this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message)); else resolve(message.result || {});
        return;
      }
      const list = this.listeners.get(message.method) || [];
      list.forEach(listener => listener(message.params || {}, message.sessionId));
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  on(method, listener) { this.listeners.set(method, [...(this.listeners.get(method) || []), listener]); }
  close() { this.ws.close(); }
}

async function run() {
  const { server, port } = await startServer();
  const chrome = await launchChrome();
  const cdp = new CDP(chrome.wsUrl);
  const exceptions = [];
  try {
    await cdp.open();
    const { targetId } = await cdp.send("Target.createTarget", { url:"about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten:true });
    cdp.on("Runtime.exceptionThrown", params => exceptions.push(params.exceptionDetails?.text || "Runtime exception"));
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Log.enable", {}, sessionId);
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source:`localStorage.setItem("quizmon.beta1", JSON.stringify({version:"phase3-cleanup-v1",dataSchema:17,onboardingComplete:true,route:"home"}));` }, sessionId);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width:1440,height:1000,deviceScaleFactor:1,mobile:false }, sessionId);
    await cdp.send("Page.navigate", { url:`http://127.0.0.1:${port}/index.html` }, sessionId);
    await sleep(1500);

    async function evaluate(expression) {
      const result = await cdp.send("Runtime.evaluate", { expression, returnByValue:true, awaitPromise:true }, sessionId);
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Evaluation failed");
      return result.result?.value;
    }
    let managedBlock = await evaluate(`location.protocol === "chrome-error:" && /blocked|organization/i.test(document.body?.innerText || "")`);
    if (managedBlock) {
      const localFile = `file://${ROOT.replace(/\\/g, "/")}/index.html`;
      await cdp.send("Page.navigate", { url:localFile }, sessionId);
      await sleep(1500);
      managedBlock = await evaluate(`location.protocol === "chrome-error:" && /blocked|organization/i.test(document.body?.innerText || "")`);
    }
    if (managedBlock) {
      console.log("Browser smoke skipped locally: managed browser policy blocks loopback and file pages. GitHub browser gate remains enabled.");
      return;
    }

    async function waitFor(expression, timeout = 7000) {
      const started = Date.now();
      while (Date.now() - started < timeout) {
        if (await evaluate(`Boolean(${expression})`)) return;
        await sleep(100);
      }
      const debug = await evaluate(`({title:document.title,body:document.body?.innerText?.slice(0,500),html:document.body?.innerHTML?.slice(0,500),url:location.href})`).catch(error => ({ evaluateError:error.message }));
      throw new Error(`Timed out waiting for ${expression}
${JSON.stringify(debug)}
Exceptions: ${exceptions.join(" | ")}`);
    }
    async function click(selector) {
      const clicked = await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return false;el.click();return true;})()`);
      assert.equal(clicked, true, `Missing clickable ${selector}`);
      await sleep(350);
    }
    async function noOverflow(label) {
      const value = await evaluate(`Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-window.innerWidth`);
      assert.ok(value <= 1, `${label} horizontal overflow: ${value}px`);
    }
    async function noInternalKeys(label) {
      const keys = await evaluate(`document.body.innerText.split(/\\s+/).filter(value=>/^(knowledge|flashcards|trainingLists|favorites|whos)\\.[A-Za-z]/.test(value)).slice(0,5)`);
      assert.deepEqual(keys, [], `${label} exposes translation keys`);
    }
    async function capture(name) {
      const directory = process.env.QUIZMON_SCREENSHOT_DIR;
      if (!directory) return;
      if (name.includes("mobile")) await sleep(3000);
      fs.mkdirSync(directory, { recursive:true });
      const { data } = await cdp.send("Page.captureScreenshot", { format:"png", captureBeyondViewport:false }, sessionId);
      fs.writeFileSync(path.join(directory, `${name}.png`), Buffer.from(data, "base64"));
    }

    await waitFor('document.querySelector(".refresh-home")');
    await noOverflow("home desktop");
    await noInternalKeys("home desktop");
    await click('[data-route="learn"]');
    await waitFor('document.querySelector(".learn-page")');
    await click('#openKnowledgeWorldFromLearn');
    await waitFor('document.querySelector(".knowledge-home")');
    assert.match(await evaluate('document.querySelector(".brand small").textContent'), /Wissenswelt|Knowledge Hub/);
    await noOverflow("knowledge desktop");
    await click('[data-knowledge-section="pokemon"]');
    await waitFor('document.querySelector(".knowledge-pokemon-page")');
    await click('.knowledge-pokemon-card');
    await waitFor('document.querySelector(".knowledge-detail-page")');
    await evaluate('history.back()');
    await waitFor('document.querySelector(".knowledge-pokemon-page")');
    await click('[data-open-knowledge-search]');
    await waitFor('document.querySelector("#knowledgeSearchPageInput")');
    await evaluate(`(()=>{const input=document.querySelector("#knowledgeSearchPageInput");input.value="Pikachu";input.dispatchEvent(new Event("input",{bubbles:true}));})()`);
    await waitFor('document.querySelector(".knowledge-search-result")');
    await noInternalKeys("search desktop");

    await evaluate('document.getElementById("homeButton").click()');
    await waitFor('document.querySelector(".refresh-home")');
    await click('[data-home-play="pokeidle"]');
    await waitFor('document.querySelector(".whos-setup-page")');
    assert.match(await evaluate('document.querySelector("#whosTitle").textContent'), /PokéIdle/);
    await noOverflow("Who’s That setup desktop");
    await noInternalKeys("Who’s That setup desktop");
    await capture("whos-setup-desktop");
    await click('[data-whos-difficulty="easy"]');
    await click('#startWhosRound');
    await waitFor('document.querySelector(".whos-round-page")');
    await waitFor('document.querySelector(".whos-current-stage .whos-cry-hint")');
    assert.equal(await evaluate('Boolean(document.querySelector(".whos-current-stage audio") && document.querySelector(".whos-current-stage [data-whos-cry-play]"))'), true, "Easy PokéIdle must start with a cry player");
    await click('.whos-current-stage [data-whos-mute]');
    assert.equal(await evaluate('document.querySelector(".whos-current-stage .whos-media-fallback").hidden'), false, "Muted easy cry must reveal its data fallback");
    await capture("pokeidle-easy-cry-desktop");
    for (let reveal = 2; reveal <= 4; reveal += 1) {
      await evaluate(`(()=>{const saved=JSON.parse(localStorage.getItem("quizmon.beta1"));const used=new Set([saved.whosThat.round.targetId,...saved.whosThat.round.guesses]);const item=QuizmonKnowledgeData.POKEMON.find(row=>!used.has(row.id));const input=document.querySelector("#whosGuessInput");input.value=item[saved.language]||item.en;input.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("#whosGuessSubmit").click();})()`);
      await waitFor(`document.querySelectorAll(".whos-progress-step.unlocked").length === ${reveal}`);
    }
    assert.equal(await evaluate('Boolean(document.querySelector(".whos-current-stage .whos-shadow-hint.strength-full"))'), true, "Easy clue four must be the full shadow");
    await capture("pokeidle-easy-shadow-desktop");
    await evaluate(`(()=>{const saved=JSON.parse(localStorage.getItem("quizmon.beta1"));const used=new Set([saved.whosThat.round.targetId,...saved.whosThat.round.guesses]);const item=QuizmonKnowledgeData.POKEMON.find(row=>!used.has(row.id));const input=document.querySelector("#whosGuessInput");input.value=item[saved.language]||item.en;input.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("#whosGuessSubmit").click();})()`);
    await waitFor('document.querySelectorAll(".whos-progress-step.unlocked").length === 5');
    assert.equal(await evaluate('Boolean(document.querySelector(".whos-current-stage .whos-crop-hint.strength-large"))'), true, "Easy clue five must be the large colour crop");
    assert.equal(await evaluate('(()=>{const stage=document.querySelector(".whos-current-stage .whos-media-stage");const anchor=Number(stage?.style.getPropertyValue("--media-anchor").replace("%",""));return anchor>=42&&anchor<=58;})()'), true, "Easy final crop must stay centred on the artwork");
    await capture("pokeidle-easy-crop-desktop");
    await waitFor('document.querySelector("#leaveWhosRound")');
    await click('#leaveWhosRound');
    await waitFor('document.querySelector(".whos-setup-page")');
    await click('[data-whos-difficulty="hard"]');
    assert.equal(await evaluate('document.querySelector("[data-whos-difficulty=hard]").classList.contains("selected")'), true);
    await click('#startWhosRound');
    await waitFor('document.querySelector(".whos-round-page")');
    assert.equal(await evaluate('document.querySelectorAll(".whos-lives>span").length'), 5);
    assert.equal(await evaluate('document.querySelectorAll(".whos-progress-step").length'), 5);
    assert.equal(await evaluate('document.querySelectorAll(".whos-progress-step.unlocked").length'), 1);
    await evaluate(`(()=>{const saved=JSON.parse(localStorage.getItem("quizmon.beta1"));const target=saved.whosThat.round.targetId;const item=QuizmonKnowledgeData.POKEMON.find(row=>row.id!==target);const name=item[saved.language]||item.en;const input=document.querySelector("#whosGuessInput");input.value=name.slice(0,Math.max(2,name.length-1));input.dispatchEvent(new Event("input",{bubbles:true}));window.__quizmonWrongGuessId=item.id;})()`);
    await waitFor('!document.querySelector("#whosSuggestions").hidden');
    assert.equal(await evaluate('Boolean(document.querySelector("#whosGuessSubmit"))'), true, "Guess action disappeared while suggestions were open");
    assert.equal(await evaluate('(()=>{const list=document.querySelector("#whosSuggestions").getBoundingClientRect();const submit=document.querySelector("#whosGuessSubmit").getBoundingClientRect();return list.bottom<=submit.top+1&&submit.height>=44;})()'), true, "Suggestions must stay in flow above the persistent guess action");
    await capture("whos-search-open-desktop");
    await click('[data-whos-suggestion="'+await evaluate('window.__quizmonWrongGuessId')+'"]');
    assert.equal(await evaluate('document.querySelector("#whosGuessSubmit").disabled'), false, "Selecting a Pokémon must enable the guess action");
    await click('#whosGuessSubmit');
    await waitFor('document.querySelectorAll(".whos-progress-step.unlocked").length === 2');
    await waitFor('document.querySelector(".whos-comparison")');
    await sleep(350);
    await capture("whos-comparison-desktop");
    assert.equal(await evaluate('document.querySelectorAll(".whos-lives>span.available").length'), 4);
    for (let reveal = 3; reveal <= 5; reveal += 1) {
      await evaluate(`(()=>{const saved=JSON.parse(localStorage.getItem("quizmon.beta1"));const used=new Set([saved.whosThat.round.targetId,...saved.whosThat.round.guesses]);const item=QuizmonKnowledgeData.POKEMON.find(row=>!used.has(row.id));const input=document.querySelector("#whosGuessInput");input.value=item[saved.language]||item.en;input.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("#whosGuessSubmit").click();})()`);
      await waitFor(`document.querySelectorAll(".whos-progress-step.unlocked").length === ${reveal}`);
    }
    assert.ok(await evaluate('document.querySelectorAll(".whos-current-stage [data-whos-media],.whos-discovered [data-whos-media]").length') >= 1, "No media clue was revealed");
    await noOverflow("Who’s That media desktop");
    await capture("whos-media-desktop");
    await evaluate(`(()=>{const saved=JSON.parse(localStorage.getItem("quizmon.beta1"));const item=QuizmonKnowledgeData.BY_ID.get(saved.whosThat.round.targetId);const input=document.querySelector("#whosGuessInput");input.value=item[saved.language]||item.en;input.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("#whosGuessSubmit").click();})()`);
    await waitFor('document.querySelector(".whos-result")');
    await noOverflow("Who’s That result desktop");
    await click('#nextWhosRound');
    await waitFor('document.querySelector("#whosGuessInput")');

    await cdp.send("Emulation.setDeviceMetricsOverride", { width:390,height:844,deviceScaleFactor:2,mobile:true }, sessionId);
    await noOverflow("Who’s That round mobile");
    await capture("whos-round-mobile");
    const playTouchFailures = await evaluate(`[...document.querySelectorAll('#whosGuessInput,#whosGuessSubmit,.whos-leave-round')].map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})).filter(size=>size.w<43.5||size.h<43.5)`);
    assert.deepEqual(playTouchFailures, [], "Phase-4 play controls must be at least 44px");
    await click('#leaveWhosRound');
    await waitFor('document.querySelector(".whos-setup-page")');
    await click('#startWhosDaily');
    await waitFor('document.querySelector(".whos-round-page")');
    assert.equal(await evaluate('Boolean(document.querySelector("#leaveWhosRound"))'), false, "Daily PokéIdle must not expose a restart loophole");
    await evaluate(`(()=>{const saved=JSON.parse(localStorage.getItem("quizmon.beta1"));const item=QuizmonKnowledgeData.BY_ID.get(saved.whosThat.round.targetId);const input=document.querySelector("#whosGuessInput");input.value=item[saved.language]||item.en;input.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("#whosGuessSubmit").click();})()`);
    await waitFor('document.querySelector(".whos-result")');
    await capture("pokeidle-daily-result-mobile");
    await evaluate('document.getElementById("homeButton").click()');
    await waitFor('document.querySelector(".refresh-home")');
    assert.equal(await evaluate('document.querySelector(".refresh-motivation-card.daily").classList.contains("is-complete")'), true, "Daily PokéIdle win must complete the menu goal");
    assert.equal(await evaluate('[...document.querySelectorAll(".daily-goal-week .is-today")].some(day=>day.classList.contains("is-complete"))'), true, "Today must be checked off");
    await capture("home-daily-complete-mobile");
    await noOverflow("home mobile");
    await click('[data-route="learn"]');
    await waitFor('document.querySelector(".learn-page")');
    await click('#openKnowledgeWorldFromLearn');
    await waitFor('document.querySelector(".knowledge-home")');
    await noOverflow("knowledge mobile");
    const touchFailures = await evaluate(`[...document.querySelectorAll('.knowledge-favorite-button,.knowledge-training-list-button,.knowledge-search-field button')].map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})).filter(size=>size.w<43.5||size.h<43.5)`);
    assert.deepEqual(touchFailures, [], "Phase-3 touch controls must be at least 44px");

    await click('[data-route="stats"]');
    await waitFor('document.querySelector(".visual-refresh-progress")');
    await noOverflow("progress mobile");
    await capture("progress-mobile");

    await click('[data-route="settings"]');
    await waitFor('document.querySelector(".visual-refresh-settings")');
    await noOverflow("settings mobile");
    const beforeTheme = await evaluate('document.documentElement.dataset.theme');
    await click('#themeToggle');
    const afterTheme = await evaluate('document.documentElement.dataset.theme');
    assert.notEqual(afterTheme, beforeTheme, "Theme toggle must update the active theme");
    await capture("settings-mobile");

    await click('#levelButton');
    await waitFor('document.querySelector(".visual-refresh-profile")');
    await noOverflow("profile mobile");
    await capture("profile-mobile");

    assert.deepEqual(exceptions, [], `Browser exceptions: ${exceptions.join(" | ")}`);
    console.log("Browser smoke passed: desktop/mobile, play round, knowledge, progress, profile, settings, themes, overflow and touch targets");
  } finally {
    cdp.close();
    chrome.child.kill("SIGKILL");
    await Promise.race([
      new Promise(resolve => chrome.child.once("exit", resolve)),
      sleep(2000)
    ]);
    await new Promise(resolve => server.close(resolve));
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try { fs.rmSync(chrome.profile, { recursive:true, force:true, maxRetries:3, retryDelay:100 }); break; }
      catch (error) { if (attempt === 4) console.warn(`Could not remove temporary Chrome profile: ${error.message}`); else await sleep(250); }
    }
  }
}

run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
