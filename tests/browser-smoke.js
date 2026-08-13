"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { findBrowser } = require("./browser-locator.js");

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

async function launchChrome() {
  const executable = findBrowser();
  if (!executable) throw new Error("Chrome/Chromium executable not found. Run `npm run setup:browser` once, then retry `npm run test:browser`.");
  console.log(`Browser smoke uses: ${executable}`);
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
  let chrome;
  try {
    chrome = await launchChrome();
  } catch (error) {
    await new Promise(resolve => server.close(resolve));
    throw error;
  }
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
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source:`localStorage.setItem("quizmon.beta1", JSON.stringify({version:"phase3-cleanup-v1",dataSchema:17,onboardingComplete:true,route:"home",language:"de"}));` }, sessionId);
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
      const keys = await evaluate(`document.body.innerText.split(/\\s+/).filter(value=>/^(knowledge|flashcards|trainingLists|favorites|whos|campaign)\\.[A-Za-z]/.test(value)).slice(0,5)`);
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
    async function captureFull(name) {
      const directory = process.env.QUIZMON_SCREENSHOT_DIR;
      if (!directory) return;
      fs.mkdirSync(directory, { recursive:true });
      const { contentSize } = await cdp.send("Page.getLayoutMetrics", {}, sessionId);
      const { data } = await cdp.send("Page.captureScreenshot", { format:"png", captureBeyondViewport:true, clip:{ x:0, y:0, width:contentSize.width, height:contentSize.height, scale:1 } }, sessionId);
      fs.writeFileSync(path.join(directory, `${name}.png`), Buffer.from(data, "base64"));
    }

    await waitFor('document.querySelector(".game-home")');
    await noOverflow("home desktop");
    await noInternalKeys("home desktop");
    await click('[data-destination="knowledge"]');
    await waitFor('document.querySelector(".knowledge-home")');
    assert.match(await evaluate('document.querySelector(".brand small").textContent'), /Wissenswelt|Knowledge Hub/);
    await noOverflow("knowledge desktop");
    await click('[data-knowledge-section="pokemon"]');
    await waitFor('document.querySelector(".knowledge-pokemon-page")');
    await waitFor('document.querySelector(".knowledge-pokemon-card img")?.complete&&document.querySelector(".knowledge-pokemon-card img")?.naturalWidth>0');
    await evaluate('window.__quizmonKnowledgeFirstArtwork=document.querySelector(".knowledge-pokemon-card img").src');
    assert.match(await evaluate('window.__quizmonKnowledgeFirstArtwork'), /\/assets\/pokemon-artwork\/1\.png$/);
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
    await waitFor('document.querySelector(".game-home")');
    await click('[data-destination="train"]');
    await waitFor('document.querySelector(".training-hub")');
    await click('[data-mode="impact"]');
    await waitFor('document.querySelector(".setup-shell")');
    assert.equal(await evaluate('document.querySelectorAll("[data-config-key=speedrun]").length'), 4, "Speedrun setup must offer Off, 30, 60 and 90 seconds");
    assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-config-key=speedrun]")].map(button=>button.dataset.configValue)'), ["0","30","60","90"]);
    await click('[data-config-key="speedrun"][data-config-value="30"]');
    await waitFor('document.querySelector(".speedrun-setting-card.is-active")');
    assert.equal(await evaluate('Boolean(document.querySelector("[data-config-key=length]"))'), false, "Question count must be replaced by the selected Speedrun duration");
    await noOverflow("Speedrun setup desktop");
    await capture("speedrun-setup-desktop");
    const learningEventsBeforeSpeedrun = await evaluate('JSON.parse(localStorage.getItem("quizmon.beta1")).stats.learning.events.length');
    const normalImpactTotalBeforeSpeedrun = await evaluate('JSON.parse(localStorage.getItem("quizmon.beta1")).stats.modes.impact.total');
    await click('#startConfigured');
    await waitFor('document.querySelector(".speedrun-countdown-panel")');
    assert.equal(await evaluate('document.querySelector("#speedrunCountdown").textContent'), "3");
    await capture("speedrun-countdown-desktop");
    await waitFor('document.querySelector(".speedrun-command-bar")', 6000);
    assert.equal(await evaluate('Boolean(document.querySelector("#finishSession"))'), false, "Speedrun must run until the selected time ends");
    assert.equal(await evaluate('document.querySelector("#speedrunClock").getAttribute("role")'), "timer");
    await click('[data-impact-value]');
    await click('#primaryAction');
    await waitFor('document.querySelector(".speedrun-answer-flash")');
    await waitFor('document.querySelector(".speedrun-command-bar") && !document.querySelector(".speedrun-answer-flash")', 4000);
    await evaluate('window.__quizmonRealDateNow=Date.now;Date.now=()=>window.__quizmonRealDateNow()+31000;');
    await waitFor('document.querySelector(".speedrun-summary-shell")', 3000);
    await evaluate('Date.now=window.__quizmonRealDateNow;delete window.__quizmonRealDateNow;');
    assert.equal(await evaluate('document.querySelectorAll(".speedrun-result-grid article").length'), 4);
    assert.equal(await evaluate('document.querySelectorAll(".speedrun-summary-actions button").length'), 3);
    assert.equal(await evaluate('JSON.parse(localStorage.getItem("quizmon.beta1")).speedrun.statistics.history.length'), 1, "Speedrun result must be persisted separately");
    assert.equal(await evaluate('JSON.parse(localStorage.getItem("quizmon.beta1")).stats.learning.events.length'), learningEventsBeforeSpeedrun, "Speedrun must not change learning intelligence");
    assert.equal(await evaluate('JSON.parse(localStorage.getItem("quizmon.beta1")).stats.modes.impact.total'), normalImpactTotalBeforeSpeedrun, "Speedrun must not change normal mode statistics");
    await noOverflow("Speedrun summary desktop");
    await capture("speedrun-summary-desktop");
    await click('#changeSpeedrunTime');
    await waitFor('document.querySelector(".setup-shell")');
    assert.equal(await evaluate('document.querySelector("[data-config-key=\\"speedrun\\"][data-config-value=\\"30\\"]").classList.contains("active")'), true);
    await click('[data-config-key="speedrun"][data-config-value="0"]');
    await waitFor('document.querySelector("[data-config-key=\\"length\\"]")');
    assert.equal(await evaluate('document.querySelectorAll("[data-config-key=\\"length\\"]").length'), 3, "Switching Speedrun off must restore the normal question-length controls");
    await evaluate('document.getElementById("homeButton").click()');
    await waitFor('document.querySelector(".game-home")');
    await click('[data-destination="play"]');
    await waitFor('document.querySelector(".play-hub")');
    assert.equal(await evaluate('document.documentElement.dataset.theme'), "dark", "Quizmon must always start in dark mode");
    assert.equal(await evaluate('Boolean(document.querySelector("#themeToggle"))'), false, "The removed theme switch must stay absent");
    assert.equal(await evaluate('document.querySelectorAll(".play-mode-card").length'), 2, "Play must expose exactly PokéIdle and Campaign");
    assert.equal(await evaluate('Boolean(document.querySelector("#openPokeidle")) && Boolean(document.querySelector("#openCampaign"))'), true, "Both play modes need a direct entry");
    assert.equal(await evaluate('(()=>{const cards=[...document.querySelectorAll(".play-mode-card")].map(card=>card.getBoundingClientRect());return Math.abs(cards[0].width-cards[1].width)<=1&&Math.abs(cards[0].height-cards[1].height)<=1;})()'), true, "PokéIdle and Campaign must have equal visual weight");
    await waitFor('[...document.querySelectorAll(".play-mode-card img")].every(image=>image.complete&&image.naturalWidth>0)');
    await noOverflow("play mode selection desktop");
    await noInternalKeys("play mode selection desktop");
    await capture("play-mode-selection-desktop");
    await click('#openCampaign');
    await waitFor('document.querySelector(".campaign-page")');
    await waitFor('document.querySelector(".campaign-tutorial-backdrop")');
    await waitFor('document.querySelector(".campaign-tutorial-berry img")?.complete && document.querySelector(".campaign-tutorial-berry img")?.naturalWidth > 0');
    assert.equal(await evaluate('document.querySelectorAll("[data-campaign-node]").length'), 10, "The first Kanto section must expose the ten approved story nodes");
    await waitFor('document.querySelector(".campaign-map-landscape img")?.complete && document.querySelector(".campaign-map-landscape img")?.naturalWidth > 0');
    assert.equal(await evaluate('document.querySelector(".campaign-map-landscape img").naturalWidth >= 800'), true, "The premium campaign landscape must load at production resolution");
    await waitFor('[...document.querySelectorAll(".campaign-node>.campaign-node-button .campaign-node-icon")].every(icon=>icon.complete&&icon.naturalWidth>0)');
    assert.deepEqual(await evaluate('Object.fromEntries([...document.querySelectorAll(".campaign-node>.campaign-node-button .campaign-node-icon")].reduce((map,icon)=>map.set(icon.dataset.campaignIcon,(map.get(icon.dataset.campaignIcon)||0)+1),new Map()))'), { city:2, battle:2, route:4, arena:1, reward:1 }, "Campaign node icons must follow the approved map categories");
    assert.equal(await evaluate('document.querySelectorAll(".campaign-node.locked .campaign-node-state-badge.is-locked").length'), 9, "Every locked node must show a separate lock badge");
    assert.deepEqual(await evaluate('[...document.querySelectorAll(".campaign-node.branch")].map(node=>node.querySelector("[data-campaign-node]").dataset.campaignNode)'), ["route-twenty-two","rival-two"], "The optional Route 22 branch must contain exactly two ordered nodes");
    assert.equal(await evaluate('Boolean(document.querySelector(".campaign-node.current .campaign-node-state-badge"))'), false, "The blue current node must not show a lock or completion badge");
    assert.equal(await evaluate('document.querySelector(".campaign-tutorial-step b").textContent'), "1/4");
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".campaign-tutorial-focus")).opacity'), "0", "The welcome popup must keep its persistent spotlight hidden");
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".campaign-tutorial-backdrop")).backdropFilter === "none"'), true, "The tutorial must keep the map legible instead of blurring it");
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#campaignTutorialBack")).display'), "none", "The first tutorial step must not expose a back action");
    assert.equal(await evaluate('document.querySelector(".campaign-tutorial-modal").getBoundingClientRect().bottom <= window.innerHeight - 64'), true, "The desktop tutorial dialog must be visibly raised from the screen edge");
    await evaluate('window.__quizmonTutorialBackdrop=document.querySelector(".campaign-tutorial-backdrop");window.__quizmonTutorialModal=document.querySelector(".campaign-tutorial-modal");window.__quizmonTutorialScrollY=window.scrollY;window.__quizmonTutorialModalRect=window.__quizmonTutorialModal.getBoundingClientRect().toJSON();');
    await capture("campaign-tutorial-1-desktop");
    await click('#campaignTutorialNext');
    await waitFor('document.querySelector(".campaign-tutorial-step b")?.textContent === "2/4"');
    await sleep(350);
    assert.equal(await evaluate('document.querySelector(".campaign-tutorial-backdrop")===window.__quizmonTutorialBackdrop&&document.querySelector(".campaign-tutorial-modal")===window.__quizmonTutorialModal'), true, "Tutorial steps must update one persistent dialog instead of remounting the modal");
    assert.equal(Math.round(await evaluate('window.scrollY')), Math.round(await evaluate('window.__quizmonTutorialScrollY')), "The page must stay fixed when the tutorial advances");
    assert.equal(await evaluate('Math.abs(document.querySelector(".campaign-tutorial-modal").getBoundingClientRect().top-window.__quizmonTutorialModalRect.top)<=1&&Math.abs(document.querySelector(".campaign-tutorial-modal").getBoundingClientRect().bottom-window.__quizmonTutorialModalRect.bottom)<=1'), true, "The Professor Berry dialog must not jump between tutorial steps");
    assert.equal(await evaluate('document.documentElement.classList.contains("campaign-tutorial-scroll-locked")'), true, "The tutorial must lock the page scroll");
    assert.equal(await evaluate('getComputedStyle(document.documentElement).overflowY'), "hidden", "The tutorial scroll lock must also hide the root scrollbar");
    const desktopTutorialScrollY = Math.round(await evaluate('window.scrollY'));
    await cdp.send("Input.dispatchMouseEvent", { type:"mouseWheel", x:720, y:300, deltaX:0, deltaY:560 }, sessionId);
    await sleep(250);
    assert.equal(Math.round(await evaluate('window.scrollY')), desktopTutorialScrollY, "Mouse-wheel scrolling must stay disabled during the tutorial");
    await cdp.send("Input.dispatchKeyEvent", { type:"rawKeyDown", key:"PageDown", code:"PageDown", windowsVirtualKeyCode:34 }, sessionId);
    await cdp.send("Input.dispatchKeyEvent", { type:"keyUp", key:"PageDown", code:"PageDown", windowsVirtualKeyCode:34 }, sessionId);
    await sleep(250);
    assert.equal(Math.round(await evaluate('window.scrollY')), desktopTutorialScrollY, "Keyboard scrolling must stay disabled during the tutorial");
    assert.equal(await evaluate(`(()=>{const rect=document.querySelector('[data-campaign-node="pallet-town"]').getBoundingClientRect();return Math.abs(rect.width-rect.height)<=1&&rect.width>=80;})()`), true, "The current campaign node must stay round on desktop");
    assert.equal(await evaluate(`(()=>{const rect=document.querySelector('.campaign-tutorial-focus').getBoundingClientRect();return Math.abs(rect.width-rect.height)<=1&&rect.width>=98;})()`), true, "The tutorial spotlight must match the round campaign node");
    assert.equal(await evaluate(`(()=>{const focus=document.querySelector('.campaign-tutorial-focus').getBoundingClientRect();const node=document.querySelector('[data-campaign-tutorial-target="current"] .campaign-node-button').getBoundingClientRect();return Math.abs(focus.width-node.width-20)<=1&&Math.abs(focus.height-node.height-20)<=1&&Math.abs((focus.left+focus.width/2)-(node.left+node.width/2))<=1&&Math.abs((focus.top+focus.height/2)-(node.top+node.height/2))<=1;})()`), true, "The tutorial spotlight must use the visible button bounds, not its zero-size position anchor");
    assert.equal(await evaluate('document.querySelector(".campaign-tutorial-focus").getBoundingClientRect().bottom<=document.querySelector(".campaign-tutorial-modal").getBoundingClientRect().top-12'), true, "The current-node spotlight must stay fully above the tutorial dialog");
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".campaign-node-button")).maxWidth'), "none", "The global button safety rule must not squeeze campaign nodes");
    let previousTutorialFocusTop = await evaluate('document.querySelector(".campaign-tutorial-focus").getBoundingClientRect().top');
    await capture("campaign-tutorial-2-desktop");
    for (let step = 3; step <= 4; step += 1) {
      await click('#campaignTutorialNext');
      await waitFor(`document.querySelector(".campaign-tutorial-step b")?.textContent === "${step}/4"`);
      await sleep(350);
      assert.equal(await evaluate('document.querySelector(".campaign-tutorial-backdrop")===window.__quizmonTutorialBackdrop&&document.querySelector(".campaign-tutorial-modal")===window.__quizmonTutorialModal'), true, `Tutorial step ${step} must keep the original dialog nodes`);
      assert.equal(Math.round(await evaluate('window.scrollY')), Math.round(await evaluate('window.__quizmonTutorialScrollY')), `Tutorial step ${step} must not reposition the page`);
      assert.equal(await evaluate('Math.abs(document.querySelector(".campaign-tutorial-modal").getBoundingClientRect().top-window.__quizmonTutorialModalRect.top)<=1&&Math.abs(document.querySelector(".campaign-tutorial-modal").getBoundingClientRect().bottom-window.__quizmonTutorialModalRect.bottom)<=1'), true, `Tutorial step ${step} must keep the Professor Berry dialog fixed`);
      assert.equal(await evaluate(`(()=>{const focus=document.querySelector('.campaign-tutorial-focus').getBoundingClientRect();const key=${step}===3?'special':'locked';const node=document.querySelector('[data-campaign-tutorial-target="'+key+'"] .campaign-node-button').getBoundingClientRect();return Math.abs(focus.width-node.width-20)<=1&&Math.abs(focus.height-node.height-20)<=1;})()`), true, `Tutorial step ${step} must frame its intended round node`);
      const tutorialClearance = await evaluate('(()=>{const focus=document.querySelector(".campaign-tutorial-focus").getBoundingClientRect();const modal=document.querySelector(".campaign-tutorial-modal").getBoundingClientRect();return {focusBottom:focus.bottom,modalTop:modal.top,clearance:modal.top-focus.bottom,scrollY:window.scrollY};})()');
      assert.equal(tutorialClearance.clearance >= 12, true, `Tutorial step ${step} spotlight must stay fully above the dialog: ${JSON.stringify(tutorialClearance)}`);
      const currentTutorialFocusTop = await evaluate('document.querySelector(".campaign-tutorial-focus").getBoundingClientRect().top');
      assert.equal(currentTutorialFocusTop > previousTutorialFocusTop, true, `Tutorial step ${step} spotlight must move forward down the fixed path without bouncing`);
      previousTutorialFocusTop = currentTutorialFocusTop;
    }
    await capture("campaign-tutorial-4-desktop");
    await click('#campaignTutorialNext');
    await waitFor('!document.querySelector(".campaign-tutorial-backdrop")');
    assert.equal(await evaluate('document.documentElement.classList.contains("campaign-tutorial-scroll-locked")'), false, "Completing the tutorial must release the page scroll");
    assert.equal(await evaluate('Boolean(document.querySelector(".campaign-page img[src*=professor-berry]"))'), false, "Professor Berry must disappear after the tutorial");
    assert.equal(await evaluate('(()=>{const nodes=[...document.querySelectorAll(".campaign-node")];return nodes.every((node,index)=>index===0||node.getBoundingClientRect().top>nodes[index-1].getBoundingClientRect().top);})()'), true, "Campaign nodes must run from top to bottom");
    assert.equal(await evaluate('document.querySelector("[data-campaign-node=pallet-town]").getAttribute("aria-current")'), "step");
    await noOverflow("campaign desktop");
    await noInternalKeys("campaign desktop");
    await capture("campaign-map-desktop");
    await captureFull("campaign-map-full-desktop");
    await click('[data-campaign-node="pallet-town"]');
    assert.equal(await evaluate('document.querySelector(".campaign-mission-panel").classList.contains("is-open")'), true);
    assert.equal(await evaluate('document.querySelector("#campaignMissionStart").disabled'), false, "The current campaign node must start a real mission");
    await evaluate('window.__quizmonRealRandom=Math.random;Math.random=()=>0.314159;');
    await click('#campaignMissionStart');
    await waitFor('document.querySelector(".campaign-mission-shell")');
    assert.equal(await evaluate('document.querySelector(".campaign-mission-progress strong").textContent'), "1/10");
    assert.match(await evaluate('document.querySelector(".campaign-mission-rule").textContent'), /alle 10 Fragen|all 10 questions/i);
    assert.equal(await evaluate('!/(KP|Angriff|Verteidigung|Initiative|Größe|Gewicht|HP|Attack|Defense|Speed|height|weight|effektiv|effective|Schwäche|weakness|Vorteil|advantage|Attacke|move type)/i.test(document.querySelector(".campaign-mission-card").innerText)'), true, "Alabastia must begin with starter names and types only");
    await waitFor('[...document.querySelectorAll(".campaign-mission-card [data-image-kind=pokemon]")].length>0&&[...document.querySelectorAll(".campaign-mission-card [data-image-kind=pokemon]")].every(image=>image.complete&&image.naturalWidth>0)');
    assert.equal(await evaluate('document.querySelector(".campaign-mission-card [data-image-kind=pokemon]").src===window.__quizmonKnowledgeFirstArtwork'), true, "Campaign and knowledge world must render the exact same Bulbasaur artwork file");
    assert.equal(await evaluate('document.querySelectorAll(".campaign-mission-card .campaign-type-chip").length>0'), true, "Alabastia must render its type knowledge with colored Quizmon chips");
    assert.equal(await evaluate('[...document.querySelectorAll(".campaign-mission-card .campaign-type-chip")].every(chip=>getComputedStyle(chip).getPropertyValue("--type-color").trim().length>0)'), true, "Every campaign type chip needs its established type color");
    assert.equal(await evaluate('document.querySelectorAll(".campaign-answer.answer-kind-pokemon .type-chip").length'), 0, "Pokémon artwork choices must not reveal their types");
    await noOverflow("campaign mission desktop");
    await capture("campaign-mission-desktop");
    let firstMissedPrompt = "";
    const palletAnswerCounts = [2,2,2,2,2,2,3,3,3,3];
    for (let questionIndex = 0; questionIndex < 10; questionIndex += 1) {
      if (questionIndex === 6) firstMissedPrompt = await evaluate('document.querySelector(".campaign-question-copy h2").textContent');
      assert.equal(await evaluate('!/(KP|Angriff|Verteidigung|Initiative|Größe|Gewicht|HP|Attack|Defense|Speed|height|weight|effektiv|effective|Schwäche|weakness|Vorteil|advantage|Attacke|move type)/i.test(document.querySelector(".campaign-mission-card").innerText)'), true, `Alabastia question ${questionIndex + 1} must remain fundamental`);
      assert.equal(await evaluate('document.querySelectorAll(".campaign-answer").length'), palletAnswerCounts[questionIndex], `Alabastia question ${questionIndex + 1} needs its planned answer count`);
      assert.equal(await evaluate('document.querySelectorAll(".campaign-mission-card [data-image-kind=pokemon]").length>0'), true, `Alabastia question ${questionIndex + 1} needs Pokémon artwork`);
      assert.equal(await evaluate('document.querySelectorAll(".campaign-mission-card .campaign-type-chip").length>0'), true, `Alabastia question ${questionIndex + 1} needs colored type presentation`);
      const answerId = await evaluate(`(()=>{const mission=QuizmonCampaignMissions.buildMission("pallet-town",{pokemonById:QuizmonKnowledgeData.BY_ID,itemById:QuizmonKnowledgeContent.ITEM_BY_ID,typeChart:TYPE_CHART});const question=mission.questions[${questionIndex}];return ${questionIndex}===6?question.options.find(option=>option.id!==question.correctOptionId).id:question.correctOptionId;})()`);
      await click(`[data-campaign-answer="${answerId}"]`);
      await click('#campaignMissionPrimary');
      await waitFor('document.querySelector(".campaign-mission-feedback")');
      assert.equal(await evaluate(`document.querySelector(".campaign-mission-feedback").classList.contains("${questionIndex === 6 ? "error" : "success"}")`), true, `Question ${questionIndex + 1} must show immediate answer feedback`);
      assert.equal(await evaluate('document.querySelector(".campaign-mission-feedback p").textContent.trim().length>0'), true, "Every answer needs an explanation");
      if (questionIndex < 9) {
        await click('#campaignMissionPrimary');
        await waitFor(`document.querySelector(".campaign-mission-progress strong")?.textContent === "${questionIndex + 2}/10"`);
      } else {
        await click('#campaignMissionPrimary');
      }
    }
    await waitFor('document.querySelector(".campaign-mastery-intro")');
    assert.match(await evaluate('document.querySelector("#campaignMasteryTitle").textContent'), /Bereit, deine Fehler zu meistern|Ready to master your mistakes/i);
    assert.equal(await evaluate('document.querySelectorAll(".campaign-mastery-intro button").length'), 1, "Mistake review transition must offer one clear action");
    assert.equal(await evaluate('JSON.parse(localStorage.getItem("quizmon.beta1")).campaign.currentNodeId'), "pallet-town", "The next node must stay locked until every mistake is mastered");
    await capture("campaign-mastery-ready-desktop");
    await click('#campaignMasteryStart');
    await waitFor('document.querySelector(".campaign-mission-rule.is-mastery")');
    assert.notEqual(await evaluate('document.querySelector(".campaign-question-copy h2").textContent'), firstMissedPrompt, "The mistake must be asked with new wording");
    assert.equal(await evaluate('document.querySelectorAll(".campaign-answer").length'), 3, "The first review keeps the planned recall challenge");
    const reviewAnswerId = await evaluate('QuizmonCampaignMissions.buildMission("pallet-town",{pokemonById:QuizmonKnowledgeData.BY_ID,itemById:QuizmonKnowledgeContent.ITEM_BY_ID,typeChart:TYPE_CHART}).questions[6].correctOptionId');
    for (let reviewMiss = 0; reviewMiss < 2; reviewMiss += 1) {
      const wrongReviewAnswerId = await evaluate(`document.querySelector('.campaign-answer:not([data-campaign-answer="${reviewAnswerId}"])').dataset.campaignAnswer`);
      await click(`[data-campaign-answer="${wrongReviewAnswerId}"]`);
      await click('#campaignMissionPrimary');
      await waitFor('document.querySelector(".campaign-mission-feedback.error")');
      await click('#campaignMissionPrimary');
      await waitFor('document.querySelector(".campaign-mission-rule.is-mastery") && !document.querySelector(".campaign-mission-feedback")');
    }
    assert.match(await evaluate('document.querySelector(".campaign-mission-rule").textContent'), /Lernhilfe aktiv|Learning support active/i, "Repeated misses must activate the binary learning aid");
    assert.equal(await evaluate('document.querySelectorAll(".campaign-answer").length'), 2, "The learning aid must reduce the review to two answers");
    await click(`[data-campaign-answer="${reviewAnswerId}"]`);
    await click('#campaignMissionPrimary');
    await waitFor('document.querySelector(".campaign-mission-feedback.success")');
    await click('#campaignMissionPrimary');
    await waitFor('document.querySelector(".campaign-mission-summary.passed")');
    assert.equal(await evaluate('document.querySelector(".campaign-mission-score-grid article:first-child strong").textContent'), "9/10");
    assert.equal(await evaluate('document.querySelector(".campaign-mission-score-grid article:nth-child(2) strong").textContent'), "1/1");
    assert.equal(await evaluate('document.querySelector(".campaign-mission-score-grid article.xp strong").textContent'), "+110");
    assert.equal(await evaluate('document.querySelectorAll(".campaign-summary-stars .earned").length'), 2);
    assert.equal(await evaluate('JSON.parse(localStorage.getItem("quizmon.beta1")).campaign.currentNodeId'), "rival-one", "Passing Alabastia must unlock the first rival mission");
    assert.deepEqual(await evaluate('(()=>{const result=JSON.parse(localStorage.getItem("quizmon.beta1")).campaign.missionResults["pallet-town"];return {lastFirstRunCorrect:result.lastFirstRunCorrect,bestFirstRunCorrect:result.bestFirstRunCorrect,lastStars:result.lastStars,bestStars:result.bestStars,total:result.total,requiredCorrect:result.requiredCorrect,lastDirectGoalMet:result.lastDirectGoalMet,masteredMistakes:result.masteredMistakes,attempts:result.attempts,hasDates:Boolean(result.firstCompletedAt&&result.lastCompletedAt)};})()'), { lastFirstRunCorrect:9, bestFirstRunCorrect:9, lastStars:2, bestStars:2, total:10, requiredCorrect:8, lastDirectGoalMet:true, masteredMistakes:1, attempts:1, hasDates:true }, "The first-run score, stars and attempts must persist");
    assert.deepEqual(await evaluate('JSON.parse(localStorage.getItem("quizmon.beta1")).campaign.claimedRewardIds'), ["mission:pallet-town:complete","mission:pallet-town:star:1","mission:pallet-town:star:2"]);
    await capture("campaign-mission-passed-desktop");
    await click('#campaignMissionMap');
    await waitFor('document.querySelector(".campaign-page")');
    assert.equal(await evaluate('document.querySelector("[data-campaign-node=pallet-town]").closest(".campaign-node").classList.contains("complete")'), true);
    assert.equal(await evaluate('document.querySelector("[data-campaign-node=rival-one]").getAttribute("aria-current")'), "step");
    assert.equal(await evaluate('document.querySelector("[data-campaign-node=rival-one]").closest(".campaign-node").classList.contains("just-unlocked")'), true);
    assert.match(await evaluate('document.querySelector(".campaign-map-return").textContent'), /Neuer Knoten|New node/i);
    assert.equal(await evaluate('document.querySelectorAll(".campaign-node-label small").length'), 0, "Map nodes must omit descriptive subtitles");
    assert.equal(await evaluate('(()=>{const node=document.querySelector("[data-campaign-node=pallet-town]").closest(".campaign-node");const stars=node.querySelector(".campaign-node-stars").getBoundingClientRect();const button=node.querySelector(".campaign-node-button").getBoundingClientRect();return Math.abs(stars.bottom-button.top)<=1;})()'), true, "Mission stars must touch the top of their node");
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".campaign-node-stars i")).fontSize'), "30px", "Map stars must remain clearly visible");
    await evaluate('Math.random=window.__quizmonRealRandom;delete window.__quizmonRealRandom;');
    await evaluate('document.getElementById("backButton").click()');
    await waitFor('document.querySelector(".play-hub")');
    assert.equal(await evaluate('document.querySelector("[data-route=play]").getAttribute("aria-current")'), "page", "Campaign must remain grouped under Play navigation");
    await click('#openPokeidle');
    await waitFor('document.querySelector(".whos-setup-page")');
    assert.match(await evaluate('document.querySelector("#whosTitle").textContent'), /PokéIdle/);
    await waitFor('document.querySelector(".whos-hero-symbol img")?.complete && document.querySelector(".whos-hero-symbol img")?.naturalWidth > 0');
    assert.equal(await evaluate('Boolean(document.querySelector(".whos-mode-meta,.whos-rules-card,.whos-stats-card"))'), false, "Removed setup sections must stay absent");
    assert.equal(await evaluate('document.querySelectorAll(".whos-difficulty-card p").length'), 0, "Difficulty descriptions must stay removed");
    await noOverflow("Who’s That setup desktop");
    await noInternalKeys("Who’s That setup desktop");
    await capture("whos-setup-desktop");
    await click('[data-whos-difficulty="easy"]');
    await click('#startWhosRound');
    await waitFor('document.querySelector(".whos-round-page")');
    await waitFor('document.querySelector(".whos-current-stage .whos-cry-hint")');
    await waitFor('document.querySelector(".whos-mystery-symbol img")?.complete && document.querySelector(".whos-mystery-symbol img")?.naturalWidth > 0');
    assert.equal(await evaluate('(()=>{const text=document.body.innerText;return ["Hinweis 1 von 5","Aktueller Hinweis","Wer verbirgt sich dahinter?","Rate jetzt oder öffne den nächsten Hinweis","Kein Leben verloren · danach"].some(value=>text.includes(value));})()'), false, "Marked round copy must stay removed");
    assert.equal(await evaluate('(()=>{const symbol=document.querySelector(".whos-mystery-symbol").getBoundingClientRect();const hint=document.querySelector("#whosCurrentHintTitle").getBoundingClientRect();const discovered=document.querySelector(".whos-discovered").getBoundingClientRect();const answer=document.querySelector(".whos-answer-panel").getBoundingClientRect();return symbol.top<hint.top&&hint.bottom<discovered.top&&discovered.bottom<answer.top;})()'), true, "Pokémon, clues and answer field must form one vertical hierarchy");
    assert.equal(await evaluate('Boolean(document.querySelector(".whos-current-stage audio") && document.querySelector(".whos-current-stage [data-whos-cry-play]"))'), true, "Easy PokéIdle must start with a cry player");
    assert.deepEqual(await evaluate('[...document.querySelectorAll(".whos-current-stage audio source")].map(source=>source.type)'), ["audio/mpeg", "audio/ogg"], "Cry player must prefer MP3 and retain OGG fallback");
    assert.match(await evaluate('document.querySelector(".whos-current-stage audio source").src'), /play\.pokemonshowdown\.com\/audio\/cries\/.+\.mp3$/);
    await evaluate('(()=>{const audio=document.querySelector(".whos-current-stage audio");audio.play=()=>{window.__quizmonCryPlayCalled=true;return Promise.resolve();};})()');
    await click('.whos-current-stage [data-whos-cry-play]');
    assert.equal(await evaluate('window.__quizmonCryPlayCalled === true && document.querySelector(".whos-current-stage [data-whos-cry-play] span").textContent === "■"'), true, "Cry must start directly from the user tap even before metadata is ready");
    await click('.whos-current-stage [data-whos-mute]');
    assert.equal(await evaluate('document.querySelector(".whos-current-stage .whos-media-fallback").hidden'), false, "Muted easy cry must reveal its data fallback");
    await capture("pokeidle-easy-cry-desktop");
    const easyFirstScore = await evaluate('Number(document.querySelector(".whos-stage-potential strong").textContent)');
    for (let reveal = 2; reveal <= 4; reveal += 1) {
      await click('#skipWhosHint');
      await waitFor(`document.querySelectorAll(".whos-progress-step.unlocked").length === ${reveal}`);
      assert.equal(await evaluate('document.querySelectorAll(".whos-lives>span.available").length'), 5, "Skipping a clue must not cost a life");
    }
    assert.ok(await evaluate('Number(document.querySelector(".whos-stage-potential strong").textContent)') < easyFirstScore, "Revealing more clues must lower the available score");
    assert.equal(await evaluate('Boolean(document.querySelector(".whos-current-stage .whos-shadow-hint.strength-full"))'), true, "Easy clue four must be the full shadow");
    assert.equal(await evaluate('(()=>{const failed=Boolean(document.querySelector(".whos-current-stage .whos-media-stage[hidden]"));const symbol=document.querySelector(".whos-mystery-symbol");return !failed||getComputedStyle(symbol).display!=="none";})()'), true, "Failed visual media must restore the approved PokéIdle symbol");
    await capture("pokeidle-easy-shadow-desktop");
    await click('#skipWhosHint');
    await waitFor('document.querySelectorAll(".whos-progress-step.unlocked").length === 5');
    assert.equal(await evaluate('document.querySelectorAll(".whos-lives>span.available").length'), 5, "Skipping to clue five must preserve all lives");
    assert.equal(await evaluate('Boolean(document.querySelector("#skipWhosHint"))'), false, "The final clue cannot be skipped");
    assert.equal(await evaluate('Boolean(document.querySelector("#giveUpWhosRound"))'), true, "Giving up must appear after all five clues are revealed");
    assert.equal(await evaluate('document.querySelector("#giveUpWhosRound").getBoundingClientRect().height >= 44'), true, "Give-up action must remain touch sized");
    assert.equal(await evaluate('Boolean(document.querySelector(".whos-current-stage .whos-crop-hint.strength-large"))'), true, "Easy clue five must be the large colour crop");
    assert.equal(await evaluate('(()=>{const stage=document.querySelector(".whos-current-stage .whos-media-stage");const anchor=Number(stage?.style.getPropertyValue("--media-anchor").replace("%",""));return anchor>=42&&anchor<=58;})()'), true, "Easy final crop must stay centred on the artwork");
    await capture("pokeidle-easy-crop-desktop");
    await click('#giveUpWhosRound');
    await waitFor('document.querySelector(".whos-result.lost")');
    assert.equal(await evaluate('JSON.parse(localStorage.getItem("quizmon.beta1")).whosThat.round.forfeited'), true, "A surrendered round must survive saving and rendering");
    await click('#changeWhosDifficulty');
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
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled:true, maxTouchPoints:5 }, sessionId);
    await noOverflow("Who’s That round mobile");
    assert.equal(await evaluate('(()=>{const current=document.querySelector(".whos-current-stage").getBoundingClientRect();const discovered=document.querySelector(".whos-discovered").getBoundingClientRect();const answer=document.querySelector(".whos-answer-panel").getBoundingClientRect();return current.bottom<discovered.top&&discovered.bottom<answer.top;})()'), true, "Mobile round hierarchy must stay vertical");
    await capture("whos-round-mobile");
    const playTouchFailures = await evaluate(`[...document.querySelectorAll('#whosGuessInput,#whosGuessSubmit,#skipWhosHint,.whos-leave-round')].map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})).filter(size=>size.w<43.5||size.h<43.5)`);
    assert.deepEqual(playTouchFailures, [], "Phase-4 play controls must be at least 44px");
    await click('#leaveWhosRound');
    await waitFor('document.querySelector(".whos-setup-page")');
    await evaluate('document.getElementById("backButton").click()');
    await waitFor('document.querySelector(".play-hub")');
    assert.equal(await evaluate('(()=>{const cards=[...document.querySelectorAll(".play-mode-card")].map(card=>card.getBoundingClientRect());return cards.length===2&&cards[1].top>cards[0].bottom&&cards.every(card=>card.width>=300&&card.height>=200);})()'), true, "The iPhone play selection must stack two large mode cards");
    const playHubTouchFailures = await evaluate(`[...document.querySelectorAll('.play-mode-card')].map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})).filter(size=>size.w<43.5||size.h<43.5)`);
    assert.deepEqual(playHubTouchFailures, [], "Play mode cards must remain touch sized on iPhone");
    await noOverflow("play mode selection mobile");
    await capture("play-mode-selection-mobile");
    await click('#openPokeidle');
    await waitFor('document.querySelector(".whos-setup-page")');
    await click('#startWhosDaily');
    await waitFor('document.querySelector(".whos-round-page")');
    assert.equal(await evaluate('Boolean(document.querySelector("#leaveWhosRound"))'), false, "Daily PokéIdle must not expose a restart loophole");
    await evaluate(`(()=>{const saved=JSON.parse(localStorage.getItem("quizmon.beta1"));const item=QuizmonKnowledgeData.BY_ID.get(saved.whosThat.round.targetId);const input=document.querySelector("#whosGuessInput");input.value=item[saved.language]||item.en;input.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("#whosGuessSubmit").click();})()`);
    await waitFor('document.querySelector(".whos-result")');
    await capture("pokeidle-daily-result-mobile");
    await evaluate('document.getElementById("homeButton").click()');
    await waitFor('document.querySelector(".game-home")');
    assert.equal(await evaluate('document.querySelector(".daily-goal-card").classList.contains("is-complete")'), true, "Daily PokéIdle win must complete the menu goal");
    assert.equal(await evaluate('[...document.querySelectorAll(".daily-goal-week .is-today")].some(day=>day.classList.contains("is-complete"))'), true, "Today must be checked off");
    await capture("home-daily-complete-mobile");
    await noOverflow("home mobile");
    await click('[data-destination="train"]');
    await waitFor('document.querySelector(".training-hub")');
    await click('[data-mode="pokemon"]');
    await waitFor('document.querySelector(".setup-shell")');
    await click('[data-config-key="speedrun"][data-config-value="90"]');
    await waitFor('document.querySelector(".speedrun-setting-card.is-active")');
    await noOverflow("Speedrun setup mobile");
    const speedrunTouchFailures = await evaluate(`[...document.querySelectorAll('[data-config-key="speedrun"],#startConfigured')].map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})).filter(size=>size.w<43.5||size.h<43.5)`);
    assert.deepEqual(speedrunTouchFailures, [], "Speedrun setup controls must be at least 44px on iPhone size");
    await capture("speedrun-setup-mobile");
    await click('#startConfigured');
    await waitFor('document.querySelector(".speedrun-countdown-panel")');
    await waitFor('document.querySelector(".speedrun-command-bar")', 6000);
    await noOverflow("Speedrun round mobile");
    assert.equal(await evaluate('document.querySelector("#primaryAction").getBoundingClientRect().height >= 44'), true);
    await capture("speedrun-round-mobile");
    await click('[data-pokemon-type]');
    await click('#primaryAction');
    await waitFor('document.querySelector(".speedrun-answer-flash")');
    await evaluate('window.__quizmonRealDateNow=Date.now;Date.now=()=>window.__quizmonRealDateNow()+91000;');
    await waitFor('document.querySelector(".speedrun-summary-shell")', 3000);
    await evaluate('Date.now=window.__quizmonRealDateNow;delete window.__quizmonRealDateNow;');
    await noOverflow("Speedrun summary mobile");
    const speedrunSummaryTouchFailures = await evaluate(`[...document.querySelectorAll('.speedrun-summary-actions button')].map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})).filter(size=>size.w<43.5||size.h<43.5)`);
    assert.deepEqual(speedrunSummaryTouchFailures, [], "Speedrun summary actions must be touch sized on iPhone");
    await capture("speedrun-summary-mobile");
    await click('#backToTraining');
    await waitFor('document.querySelector(".training-hub")');
    await evaluate('document.getElementById("homeButton").click()');
    await waitFor('document.querySelector(".game-home")');
    await click('[data-route="settings"]');
    await waitFor('document.querySelector("#restartCampaignTutorial")');
    await click('#restartCampaignTutorial');
    await waitFor('document.querySelector(".campaign-page")');
    await waitFor('document.querySelector(".campaign-tutorial-backdrop")');
    assert.equal(await evaluate('Boolean(document.querySelector(".campaign-mission-panel.is-open"))'), false, "Restarting the tutorial must close an open mission preview");
    await noOverflow("campaign tutorial mobile");
    const campaignTutorialTouchFailures = await evaluate(`[...document.querySelectorAll('.campaign-tutorial-actions button')].filter(el=>!el.hidden&&getComputedStyle(el).display!=='none').map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})).filter(size=>size.w<43.5||size.h<43.5)`);
    assert.deepEqual(campaignTutorialTouchFailures, [], "Campaign tutorial actions must be touch sized on iPhone");
    assert.equal(await evaluate('document.querySelector(".campaign-tutorial-modal").getBoundingClientRect().bottom <= window.innerHeight - 70'), true, "The mobile tutorial must stay above the bottom navigation");
    await evaluate('window.__quizmonMobileTutorialBackdrop=document.querySelector(".campaign-tutorial-backdrop");window.__quizmonMobileTutorialModal=document.querySelector(".campaign-tutorial-modal");window.__quizmonMobileTutorialModalRect=window.__quizmonMobileTutorialModal.getBoundingClientRect().toJSON();window.__quizmonMobileTutorialScrollY=window.scrollY;');
    await click('#campaignTutorialNext');
    await waitFor('document.querySelector(".campaign-tutorial-step b")?.textContent === "2/4"');
    await sleep(350);
    assert.equal(await evaluate('document.querySelector(".campaign-tutorial-backdrop")===window.__quizmonMobileTutorialBackdrop'), true, "The mobile tutorial must reuse its existing dialog between steps");
    assert.ok(Math.abs(Math.round(await evaluate('window.scrollY')) - Math.round(await evaluate('window.__quizmonMobileTutorialScrollY'))) <= 2, "The mobile page must stay fixed during tutorial step changes");
    const mobileTutorialRect = await evaluate('document.querySelector(".campaign-tutorial-modal").getBoundingClientRect().toJSON()');
    const initialMobileTutorialRect = await evaluate('window.__quizmonMobileTutorialModalRect');
    assert.equal(Math.abs(mobileTutorialRect.top - initialMobileTutorialRect.top) <= 1 && Math.abs(mobileTutorialRect.bottom - initialMobileTutorialRect.bottom) <= 1, true, `The mobile Professor Berry dialog must not jump between tutorial steps: ${JSON.stringify({ initial:initialMobileTutorialRect, current:mobileTutorialRect })}`);
    assert.equal(await evaluate(`(()=>{const rect=document.querySelector('.campaign-tutorial-focus').getBoundingClientRect();return Math.abs(rect.width-rect.height)<=1&&rect.width>=94;})()`), true, "The mobile tutorial spotlight must remain round");
    const mobileTutorialScrollY = Math.round(await evaluate('window.scrollY'));
    await cdp.send("Input.dispatchTouchEvent", { type:"touchStart", touchPoints:[{ x:195, y:360, id:1, radiusX:3, radiusY:3, force:1 }] }, sessionId);
    await cdp.send("Input.dispatchTouchEvent", { type:"touchMove", touchPoints:[{ x:195, y:260, id:1, radiusX:3, radiusY:3, force:1 }] }, sessionId);
    await cdp.send("Input.dispatchTouchEvent", { type:"touchEnd", touchPoints:[] }, sessionId);
    await sleep(250);
    assert.equal(Math.round(await evaluate('window.scrollY')), mobileTutorialScrollY, "Touch scrolling must stay disabled during the tutorial");
    await capture("campaign-tutorial-2-mobile");
    for (let step = 3; step <= 4; step += 1) {
      await click('#campaignTutorialNext');
      await waitFor(`document.querySelector(".campaign-tutorial-step b")?.textContent === "${step}/4"`);
      await sleep(350);
      assert.equal(await evaluate('document.querySelector(".campaign-tutorial-backdrop")===window.__quizmonMobileTutorialBackdrop'), true, `Mobile tutorial step ${step} must reuse its dialog`);
      assert.ok(Math.abs(Math.round(await evaluate('window.scrollY')) - Math.round(await evaluate('window.__quizmonMobileTutorialScrollY'))) <= 2, `Mobile tutorial step ${step} must keep the page fixed`);
      assert.equal(await evaluate('Math.abs(document.querySelector(".campaign-tutorial-modal").getBoundingClientRect().top-window.__quizmonMobileTutorialModalRect.top)<=1&&Math.abs(document.querySelector(".campaign-tutorial-modal").getBoundingClientRect().bottom-window.__quizmonMobileTutorialModalRect.bottom)<=1'), true, `Mobile tutorial step ${step} must keep the Professor Berry dialog fixed`);
      assert.equal(await evaluate('document.querySelector(".campaign-tutorial-focus").getBoundingClientRect().bottom<=document.querySelector(".campaign-tutorial-modal").getBoundingClientRect().top-10'), true, `Mobile tutorial step ${step} spotlight must stay fully above the dialog`);
    }
    await capture("campaign-tutorial-4-mobile");
    await click('#campaignTutorialSkip');
    await waitFor('!document.querySelector(".campaign-tutorial-backdrop")');
    assert.equal(await evaluate('document.documentElement.classList.contains("campaign-tutorial-scroll-locked")'), false, "Skipping the tutorial must release the mobile page scroll");
    await noOverflow("campaign mobile");
    assert.equal(await evaluate('[...document.querySelectorAll(".campaign-node-button")].every(button=>button.getBoundingClientRect().width>=43.5&&button.getBoundingClientRect().height>=43.5)'), true, "Campaign nodes must remain touch sized on iPhone");
    await capture("campaign-map-mobile");
    await captureFull("campaign-map-full-mobile");
    await click('[data-campaign-node="rival-one"]');
    assert.equal(await evaluate('document.querySelector(".campaign-mission-panel").classList.contains("is-open")&&getComputedStyle(document.querySelector(".campaign-mission-panel")).display!=="none"'), true, "Mission preview must open above the mobile map");
    assert.equal(await evaluate('document.querySelector("#campaignDetailClose").getBoundingClientRect().height>=40'), true);
    await evaluate('window.__quizmonRealRandom=Math.random;Math.random=()=>0.271828;');
    await click('#campaignMissionStart');
    await waitFor('document.querySelector(".campaign-mission-shell")');
    await waitFor('[...document.querySelectorAll(".campaign-mission-card [data-image-kind=pokemon]")].every(image=>image.complete&&image.naturalWidth>0)');
    assert.equal(await evaluate('document.querySelectorAll(".campaign-mission-card [data-image-kind=pokemon],.campaign-mission-card .campaign-type-chip").length>0'), true, "The iPhone mission must use visual Pokémon or type choices");
    assert.equal(await evaluate('[...document.querySelectorAll(".campaign-answer .campaign-type-chip")].every(chip=>getComputedStyle(chip).whiteSpace==="nowrap")'), true, "Campaign type names must not break across lines on iPhone");
    assert.equal(await evaluate('document.querySelector(".campaign-mission-shell").classList.contains("mission-kind-trainer")'), true, "Trainer missions need their own accent palette");
    await noOverflow("campaign mission mobile");
    const campaignMissionTouchFailures = await evaluate(`[...document.querySelectorAll('.campaign-answer,#campaignMissionExit,#campaignMissionPrimary')].map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})).filter(size=>size.w<43.5||size.h<43.5)`);
    assert.deepEqual(campaignMissionTouchFailures, [], "Campaign mission controls must be touch sized on iPhone");
    await click('.campaign-answer');
    await click('#campaignMissionPrimary');
    await waitFor('document.querySelector(".campaign-mission-feedback")');
    await sleep(500);
    await capture("campaign-mission-mobile");
    await click('#campaignMissionExit');
    await waitFor('document.querySelector("[data-dialog-confirm]")');
    await click('[data-dialog-confirm]');
    await waitFor('document.querySelector(".campaign-page")');
    await evaluate('Math.random=window.__quizmonRealRandom;delete window.__quizmonRealRandom;');
    await evaluate('document.getElementById("homeButton").click()');
    await waitFor('document.querySelector(".game-home")');
    await click('[data-destination="knowledge"]');
    await waitFor('document.querySelector(".knowledge-home")');
    await noOverflow("knowledge mobile");
    const touchFailures = await evaluate(`[...document.querySelectorAll('.knowledge-favorite-button,.knowledge-training-list-button,.knowledge-search-field button')].map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})).filter(size=>size.w<43.5||size.h<43.5)`);
    assert.deepEqual(touchFailures, [], "Phase-3 touch controls must be at least 44px");
    assert.deepEqual(exceptions, [], `Browser exceptions: ${exceptions.join(" | ")}`);
    console.log("Browser smoke passed: desktop/mobile, campaign missions, Speedrun, PokéIdle, navigation, search, history, overflow, touch targets");
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
