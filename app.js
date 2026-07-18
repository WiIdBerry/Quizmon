(() => {
  "use strict";

  const STORAGE_KEY = "pokemonTypeLearner.v0.6.1";
  const OLD_KEYS = ["pokemonTypeLearner.v0.5", "pokemonTypeLearner.v0.4", "pokemonTypeLearner.v0.3", "pokemonTypeLearner.v0.2", "pokemonTypeLearner.v0.1"];

  const view = document.getElementById("view");
  const modalRoot = document.getElementById("modalRoot");
  const toastRoot = document.getElementById("toastRoot");
  const backButton = document.getElementById("backButton");
  const brandButton = document.getElementById("brandButton");
  const levelButton = document.getElementById("levelButton");
  const levelNumber = document.getElementById("levelNumber");
  const headerStreak = document.getElementById("headerStreak");
  const navButtons = [...document.querySelectorAll(".nav-item")];

  const blankTypeStats = () => Object.fromEntries(
    TYPES.map(type => [type, { total: 0, correct: 0, recent: [], lastSeen: null }])
  );
  const blankModeStats = () => ({ total: 0, correct: 0, sessions: 0 });

  const defaultLanguage = navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
  const defaults = {
    version: "0.6.1",
    dataSchema: 2,
    diagnostics: { errors: [], repairs: [], lastBackup: null },
    route: "home",
    language: defaultLanguage,
    theme: "system",
    animations: true,
    haptics: true,
    onboardingComplete: false,
    seenHints: { effectiveness: false, multiplier: false, impact: false, pokemon: false },
    statsTab: "overview",
    learnTab: "lexicon",
    lastMode: null,
    lastConfig: null,
    config: {
      effectiveness: { length: 10, kind: "mixed", difficulty: "medium" },
      multiplier: { length: 10, defense: "mixed", difficulty: "medium" },
      impact: { length: 10, defense: "mixed", difficulty: "medium" },
      pokemon: { length: 10, generation: "all", display: "both", difficulty: "medium" }
    },
    stats: {
      total: 0,
      correct: 0,
      streak: 0,
      bestStreak: 0,
      sessions: 0,
      totalSeconds: 0,
      xp: 0,
      modes: {
        effectiveness: blankModeStats(), multiplier: blankModeStats(), impact: blankModeStats(), pokemon: blankModeStats(),
        weak: blankModeStats(), daily: blankModeStats(), review: blankModeStats()
      },
      types: blankTypeStats(),
      history: [],
      achievements: {},
      mistakes: []
    },
    daily: { date: null, completed: false, result: null, streak: 0, lastCompletedDate: null },
    pokemonCache: {}
  };

  let state = loadState();
  let session = null;
  let learnType = null;
  let onboardingOpen = false;
  let onboardingPage = 0;
  let deferredInstallPrompt = null;
  let toastQueue = [];
  let toastBusy = false;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function deepMerge(base, saved) {
    const output = { ...clone(base), ...(saved || {}) };
    output.config = { ...clone(base.config), ...((saved || {}).config || {}) };
    ["effectiveness", "multiplier", "impact", "pokemon"].forEach(mode => {
      output.config[mode] = { ...clone(base.config[mode]), ...(output.config[mode] || {}) };
    });
    output.seenHints = { ...base.seenHints, ...((saved || {}).seenHints || {}) };
    output.stats = { ...clone(base.stats), ...((saved || {}).stats || {}) };
    output.stats.modes = { ...clone(base.stats.modes), ...(((saved || {}).stats || {}).modes || {}) };
    Object.keys(base.stats.modes).forEach(key => {
      output.stats.modes[key] = { ...blankModeStats(), ...(output.stats.modes[key] || {}) };
    });
    output.stats.types = { ...blankTypeStats(), ...(((saved || {}).stats || {}).types || {}) };
    TYPES.forEach(type => {
      output.stats.types[type] = { total: 0, correct: 0, recent: [], lastSeen: null, ...(output.stats.types[type] || {}) };
      if (!Array.isArray(output.stats.types[type].recent)) output.stats.types[type].recent = [];
    });
    output.stats.history = Array.isArray(output.stats.history) ? output.stats.history : [];
    output.stats.mistakes = Array.isArray(output.stats.mistakes) ? output.stats.mistakes : [];
    output.stats.achievements = output.stats.achievements || {};
    output.daily = { ...clone(base.daily), ...((saved || {}).daily || {}) };
    output.pokemonCache = output.pokemonCache || {};
    output.diagnostics = { errors: [], repairs: [], lastBackup: null, ...(output.diagnostics || {}) };
    output.diagnostics.errors = Array.isArray(output.diagnostics.errors) ? output.diagnostics.errors.slice(-50) : [];
    output.diagnostics.repairs = Array.isArray(output.diagnostics.repairs) ? output.diagnostics.repairs.slice(-50) : [];
    output.language = ["de", "en"].includes(output.language) ? output.language : defaultLanguage;
    return output;
  }

  function migrateLegacy(old) {
    const migrated = deepMerge(defaults, old || {});
    migrated.version = "0.6";
    migrated.dataSchema = 2;
    migrated.route = "home";
    migrated.onboardingComplete = Boolean(old?.onboardingComplete);
    migrated.language = old?.language || defaultLanguage;
    migrated.stats.mistakes = Array.isArray(old?.stats?.mistakes) ? clone(old.stats.mistakes) : [];

    const oldTypes = old?.stats?.types || {};
    Object.entries(oldTypes).forEach(([key, value]) => {
      const newKey = OLD_TYPE_TO_NEW[key] || key;
      if (TYPES.includes(newKey)) migrated.stats.types[newKey] = { ...migrated.stats.types[newKey], ...value };
    });
    if (!Number.isFinite(migrated.stats.xp) || migrated.stats.xp === 0) {
      migrated.stats.xp = Math.max(0, Number(migrated.stats.correct || 0) * 10);
    }
    return migrated;
  }

  function logError(error, context = "unknown") {
    try {
      const entry = { time: new Date().toISOString(), context, message: String(error?.message || error), route: state?.route || "startup", language: state?.language || defaultLanguage, userAgent: navigator.userAgent };
      if (state?.diagnostics) { state.diagnostics.errors.push(entry); state.diagnostics.errors = state.diagnostics.errors.slice(-50); localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    } catch (_) {}
  }

  function repairState(candidate) {
    const repaired = deepMerge(defaults, candidate || {});
    const fixes = [];
    const numeric = ["total","correct","streak","bestStreak","sessions","totalSeconds","xp"];
    numeric.forEach(key => { if (!Number.isFinite(Number(repaired.stats[key])) || Number(repaired.stats[key]) < 0) { repaired.stats[key] = 0; fixes.push(`stats.${key}`); } else repaired.stats[key] = Number(repaired.stats[key]); });
    if (repaired.stats.correct > repaired.stats.total) { repaired.stats.correct = repaired.stats.total; fixes.push("stats.correct"); }
    repaired.stats.history = repaired.stats.history.filter(Boolean).slice(-100);
    repaired.stats.mistakes = repaired.stats.mistakes.filter(item => item && typeof item === "object").slice(-300);
    repaired.diagnostics.repairs.push(...fixes.map(field => ({ time: new Date().toISOString(), field })));
    repaired.diagnostics.repairs = repaired.diagnostics.repairs.slice(-50);
    repaired.version = "0.6"; repaired.dataSchema = 2;
    return repaired;
  }

  function loadState() {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current) {
        const loaded = repairState(JSON.parse(current));
        if (["session", "summary"].includes(loaded.route) || loaded.route.startsWith("setup-")) loaded.route = "home";
        return loaded;
      }
      for (const key of OLD_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw) return repairState(migrateLegacy(JSON.parse(raw)));
      }
    } catch (error) {
      console.warn("Could not load save data", error); logError(error, "loadState");
    }
    return clone(defaults);
  }

  function saveState() {
    state.version = "0.6";
    state.dataSchema = 2;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { console.warn("Could not save progress", error); logError(error, "saveState"); }
    updateHeader();
  }

  function t(key, vars = {}) {
    const dict = I18N[state.language] || I18N.en;
    const fallback = I18N.en[key] || key;
    let value = dict[key] ?? fallback;
    Object.entries(vars).forEach(([name, replacement]) => {
      value = value.replaceAll(`{${name}}`, String(replacement));
    });
    return value;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function typeLabel(type) { return t(`type.${type}`); }

  function typeChip(type, extraClass = "") {
    const meta = TYPE_META[type];
    return `<span class="type-chip ${extraClass}" data-type="${type}" style="--type-color:${meta.color}"><span class="type-symbol" aria-hidden="true">${meta.icon}</span><span>${escapeHtml(typeLabel(type))}</span></span>`;
  }

  function shuffle(items, random = Math.random) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function randomItem(items, random = Math.random) { return items[Math.floor(random() * items.length)]; }
  function unique(items) { return [...new Set(items.filter(Boolean))]; }
  function effectiveness(attackingType, defendingTypes) {
    return defendingTypes.reduce((value, defendingType) => value * (TYPE_CHART[attackingType]?.[defendingType] ?? 1), 1);
  }
  function percent(correct, total) { return total ? Math.round((correct / total) * 100) : 0; }
  function formatMultiplier(value) { return value === .25 ? "¼×" : value === .5 ? "½×" : `${value}×`; }
  function formatDuration(seconds) {
    const safe = Math.max(0, Math.round(seconds || 0));
    const minutes = Math.floor(safe / 60);
    const rest = safe % 60;
    return minutes ? `${minutes}:${String(rest).padStart(2, "0")} min` : `${rest} s`;
  }
  function formatDate(iso) {
    if (!iso) return "–";
    return new Intl.DateTimeFormat(state.language === "de" ? "de-DE" : "en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(iso));
  }
  function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
  function normalizeDailyState() {
    const today = todayKey();
    if (state.daily.date !== today) {
      state.daily.date = today;
      state.daily.completed = false;
      state.daily.result = null;
      saveState();
    }
  }
  function seededRandom(seedText) {
    let hash = 2166136261;
    for (let i = 0; i < seedText.length; i += 1) { hash ^= seedText.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return () => {
      hash += 0x6D2B79F5;
      let value = hash;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function actualTheme() {
    return state.theme === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : state.theme;
  }
  function applyPreferences() {
    document.documentElement.dataset.theme = actualTheme();
    document.documentElement.dataset.animations = state.animations ? "on" : "off";
    document.documentElement.lang = state.language;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", actualTheme() === "dark" ? "#15111b" : "#6841c6");
    document.querySelectorAll("[data-nav-label]").forEach(item => item.textContent = t(`nav.${item.dataset.navLabel}`));
    backButton.setAttribute("aria-label", t("common.back"));
  }
  function vibrate(pattern = 8) {
    if (state.haptics && navigator.vibrate) navigator.vibrate(pattern);
  }

  function getLevelInfo(xp = state.stats.xp) {
    let current = LEVELS[0];
    let next = null;
    for (let i = 0; i < LEVELS.length; i += 1) {
      if (xp >= LEVELS[i].xp) current = LEVELS[i];
      if (xp < LEVELS[i].xp) { next = LEVELS[i]; break; }
    }
    const start = current.xp;
    const end = next ? next.xp : current.xp;
    const progress = next ? Math.min(100, Math.round(((xp - start) / (end - start)) * 100)) : 100;
    return { current, next, progress, inLevel: xp - start, needed: next ? next.xp - start : 0 };
  }

  function addXp(amount) {
    if (!amount) return;
    const before = getLevelInfo();
    state.stats.xp += amount;
    const after = getLevelInfo();
    if (after.current.level > before.current.level) enqueueToast("⬆", t("toast.level", { level: after.current.level }), t(after.current.key));
  }

  function modeName(mode) { return t(`mode.${mode}`); }

  function setRoute(route) {
    state.route = route;
    saveState();
    render();
  }

  function isInnerRoute(route) { return route.startsWith("setup-") || ["session", "summary", "learn-detail"].includes(route); }

  function updateHeader() {
    const level = getLevelInfo();
    levelNumber.textContent = `Lv. ${level.current.level}`;
    headerStreak.textContent = `🔥 ${state.stats.streak}`;
  }

  function updateNavigation() {
    const inner = isInnerRoute(state.route);
    const active = inner ? "" : state.route;
    navButtons.forEach(button => button.classList.toggle("active", button.dataset.route === active));
    backButton.classList.toggle("hidden", !inner);
    document.querySelector(".bottom-nav").classList.toggle("hidden-nav", ["session", "summary"].includes(state.route));
  }

  function render() {
    normalizeDailyState();
    applyPreferences();
    updateHeader();
    updateNavigation();

    if (state.route === "home") renderHome();
    else if (state.route === "learn") renderLearn();
    else if (state.route === "learn-detail") renderLearnDetail();
    else if (state.route === "stats") renderStats();
    else if (state.route === "settings") renderSettings();
    else if (state.route.startsWith("setup-")) renderSetup(state.route.replace("setup-", ""));
    else if (state.route === "session") renderQuestion();
    else if (state.route === "summary") renderSummary();
    else { state.route = "home"; renderHome(); }

    if (!state.onboardingComplete && !onboardingOpen) openOnboarding(0);
  }

  function getWeakTypes(limit = 3) {
    return TYPES.map(type => {
      const stats = state.stats.types[type];
      const rate = percent(stats.correct, stats.total);
      const confidence = Math.min(1, stats.total / 12);
      const score = stats.total ? (100 - rate) * (.55 + confidence * .45) : -1;
      return { type, rate, total: stats.total, score };
    }).filter(item => item.total >= 3).sort((a, b) => b.score - a.score || b.total - a.total).slice(0, limit);
  }

  function renderHome() {
    session = null;
    const level = getLevelInfo();
    const weak = getWeakTypes(3);
    const last = state.stats.history[0];
    const accuracy = percent(state.stats.correct, state.stats.total);

    view.innerHTML = `
      <section class="hero">
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="kicker">${t("home.kicker")}</p>
            <h1>${t("home.title")}</h1>
            <p>${t("home.subtitle")}</p>
          </div>
          <div class="hero-level">
            <div class="level-orb">${level.current.level}</div>
            <div><strong>${escapeHtml(t(level.current.key))}</strong><small>${state.stats.xp} XP${level.next ? ` · ${level.next.xp - state.stats.xp} XP` : ""}</small><div class="hero-progress"><span style="width:${level.progress}%"></span></div></div>
          </div>
        </div>
      </section>

      <section class="action-grid">
        <button class="action-card primary-action" id="dailyTraining">
          <span class="action-icon">☀</span><span><h3>${state.daily.completed ? t("home.dailyDone") : t("home.daily")}</h3><p>${t("home.dailyDesc")}</p></span><span class="arrow">›</span>
        </button>
        <button class="action-card" id="weakTraining">
          <span class="action-icon">🎯</span><span><h3>${t("home.weak")}</h3><p>${t("home.weakDesc")}</p></span><span class="arrow">›</span>
        </button>
        <button class="action-card" id="openLearn">
          <span class="action-icon">◇</span><span><h3>${t("home.learn")}</h3><p>${t("learn.subtitle")}</p></span><span class="arrow">›</span>
        </button>
        ${state.lastMode && state.lastConfig ? `<button class="action-card" id="repeatLastTraining"><span class="action-icon">↻</span><span><h3>${t("home.continue")}</h3><p>${t("home.continueDesc",{mode:modeName(state.lastMode)})}</p></span><span class="arrow">›</span></button>` : ""}
      </section>

      <div class="section-title"><h2>${t("home.modes")}</h2><p>${t("home.free")}</p></div>
      <section class="mode-grid">
        ${modeCard("effectiveness", "ATK", t("mode.effectivenessDesc"))}
        ${modeCard("multiplier", "18", t("mode.multiplierDesc"))}
        ${modeCard("impact", "2×", t("mode.impactDesc"))}
        ${modeCard("pokemon", "DEX", t("mode.pokemonDesc"))}
      </section>

      <div class="section-title"><h2>${t("home.progress")}</h2><p>${state.stats.sessions} sessions</p></div>
      <section class="stats-grid">
        <article class="stat-card"><small>${t("stats.answered")}</small><strong>${state.stats.total}</strong></article>
        <article class="stat-card"><small>${t("stats.accuracy")}</small><strong>${accuracy}%</strong></article>
        <article class="stat-card"><small>${t("summary.streak")}</small><strong>${state.stats.streak}</strong></article>
        <article class="stat-card"><small>${t("summary.best")}</small><strong>${state.stats.bestStreak}</strong></article>
      </section>

      <div class="section-title"><h2>${t("home.currentWeak")}</h2><p>${weak.length ? "" : "–"}</p></div>
      ${weak.length ? `<div class="weak-strip">${weak.map(item => `<span class="weak-pill">${typeChip(item.type,"small")}<strong>${item.rate}%</strong></span>`).join("")}</div>` : `<p class="helper-text">${t("home.noWeak")}</p>`}

      <div class="section-title"><h2>${t("home.lastSession")}</h2><p>${last ? formatDate(last.date) : ""}</p></div>
      ${last ? `<div class="history-item"><div><strong>${escapeHtml(modeName(last.mode))}</strong><small>${formatDuration(last.duration)}</small></div><strong>${last.correct}/${last.answers} · ${last.rate}%</strong></div>` : `<p class="helper-text">${t("home.noSession")}</p>`}

      ${deferredInstallPrompt ? `<div class="section-title"><h2>${t("home.install")}</h2></div><button class="action-card" id="installApp"><span class="action-icon">＋</span><span><h3>${t("home.install")}</h3><p>${t("home.installDesc")}</p></span><span class="arrow">›</span></button>` : ""}
    `;

    document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => setRoute(`setup-${button.dataset.mode}`)));
    document.getElementById("dailyTraining").addEventListener("click", startDailySession);
    document.getElementById("weakTraining").addEventListener("click", startWeakSession);
    document.getElementById("openLearn").addEventListener("click", () => setRoute("learn"));
    document.getElementById("repeatLastTraining")?.addEventListener("click", () => {
      if (!state.lastMode || !state.lastConfig) return;
      state.config[state.lastMode] = { ...state.config[state.lastMode], ...clone(state.lastConfig) };
      startSession(state.lastMode);
    });
    document.getElementById("installApp")?.addEventListener("click", installApp);
  }

  function modeCard(mode, icon, description) {
    return `<button class="mode-card" data-mode="${mode}"><span class="mode-icon">${icon}</span><h3>${escapeHtml(modeName(mode))}</h3><p>${escapeHtml(description)}</p></button>`;
  }

  function renderSetup(mode) {
    const config = state.config[mode];
    const modeDescription = t(`mode.${mode}Desc`);
    view.innerHTML = `
      <section class="panel">
        <div class="quiz-head"><p class="quiz-kicker">${escapeHtml(modeName(mode))}</p><h1>${t("setup.title")}</h1><p>${escapeHtml(modeDescription)}</p></div>
        <div class="settings-list">
          ${segmentedSetting("length", t("setup.length"), [[10,"10"],[20,"20"],["infinite",t("setup.endless")]], String(config.length))}
          ${segmentedSetting("difficulty", t("setup.difficulty"), [["easy",t("setup.easy")],["medium",t("setup.medium")],["hard",t("setup.hard")]], config.difficulty)}
          ${mode === "effectiveness" ? segmentedSetting("kind", t("setup.kind"), [["mixed",t("setup.mixed")],["effective",t("setup.effective")],["resisted",t("setup.resisted")]], config.kind) : ""}
          ${["multiplier","impact"].includes(mode) ? segmentedSetting("defense", t("setup.defense"), [["mixed",t("setup.mixed")],["single",t("setup.single")],["dual",t("setup.dual")]], config.defense) : ""}
          ${mode === "pokemon" ? pokemonSetupSettings(config) : ""}
        </div>
        <div class="actions stack"><button id="startConfigured" class="primary-button">${t("setup.begin")}</button></div>
      </section>`;

    document.querySelectorAll("[data-config-key]").forEach(button => {
      button.addEventListener("click", () => {
        const key = button.dataset.configKey;
        let value = button.dataset.configValue;
        if (key === "length") value = value === "infinite" ? "infinite" : Number(value);
        config[key] = value;
        saveState();
        renderSetup(mode);
      });
    });
    document.getElementById("startConfigured").addEventListener("click", () => startSession(mode));
  }

  function segmentedSetting(key, title, options, selected) {
    return `<div class="setting-row" style="display:block"><div><h3>${escapeHtml(title)}</h3></div><div class="tabs" style="--tab-count:${options.length};margin:12px 0 0">${options.map(([value,label]) => `<button class="tab-button ${String(value) === String(selected) ? "active" : ""}" data-config-key="${key}" data-config-value="${value}">${escapeHtml(label)}</button>`).join("")}</div></div>`;
  }

  function pokemonSetupSettings(config) {
    const generationOptions = [["all",t("common.all")], ...Object.keys(GENERATION_RANGES).map(g => [g,`Gen ${g}`])];
    return `${segmentedSetting("display",t("setup.display"),[["both",t("setup.both")],["image",t("setup.image")],["name",t("setup.name")]],config.display)}
      <div class="setting-row" style="display:block"><div><h3>${t("setup.generation")}</h3></div><div class="tabs" style="--tab-count:5;grid-template-columns:repeat(5,1fr);margin:12px 0 0">${generationOptions.map(([value,label]) => `<button class="tab-button ${String(value)===String(config.generation)?"active":""}" data-config-key="generation" data-config-value="${value}">${label}</button>`).join("")}</div></div>`;
  }

  function newSession(mode, config = {}, sequence = null) {
    const lengthValue = config.length === "infinite" ? Infinity : Number(config.length || sequence?.length || 10);
    return {
      mode, config: clone(config), length: sequence ? sequence.length : lengthValue, sequence: sequence ? clone(sequence) : null,
      index: 0, correct: 0, answers: [], wrongQuestions: [], wrongTypes: {}, startedAt: Date.now(), startXp: state.stats.xp,
      answered: false, ended: false, currentSpec: null, usedSignatures: [], usedPokemonIds: [],
      reviewPending: mode === "review" && sequence ? unique(sequence.map(questionSignature)) : []
    };
  }

  function startSession(mode) {
    state.lastMode = mode;
    state.lastConfig = clone(state.config[mode]);
    session = newSession(mode, state.config[mode]);
    state.route = "session";
    saveState();
    updateNavigation();
    renderQuestion();
  }

  function startDailySession() {
    const random = seededRandom(`daily-${todayKey()}`);
    const sequence = [];
    for (let i = 0; i < 3; i += 1) sequence.push(generateEffectivenessSpec({ random, kind: "mixed", difficulty: "medium" }));
    for (let i = 0; i < 2; i += 1) sequence.push(generateMultiplierSpec({ random, defense: "mixed", difficulty: "medium" }));
    for (let i = 0; i < 2; i += 1) sequence.push(generateImpactSpec({ random, defense: "mixed", difficulty: "medium" }));
    const fallbacks = shuffle(FALLBACK_POKEMON, random).slice(0, 3);
    fallbacks.forEach(p => sequence.push({ kind:"pokemon", pokemon: formatFallbackPokemon(p), display:"both", focusTypes:[...p.types] }));
    session = newSession("daily", { length:10 }, shuffle(sequence, random));
    state.route = "session"; saveState(); updateNavigation(); renderQuestion();
  }

  function startWeakSession() {
    const weak = getWeakTypes(5);
    if (!weak.length) {
      enqueueToast("ℹ", t("home.weak"), t("home.noWeak"));
      setRoute("setup-effectiveness");
      return;
    }
    const sequence = [];
    for (let i = 0; i < 10; i += 1) {
      const focusType = weak[i % weak.length].type;
      const kind = i % 4;
      if (kind === 0) sequence.push(generateEffectivenessSpec({ focusType, difficulty:"hard", kind:"mixed" }));
      else if (kind === 1) sequence.push(generateMultiplierSpec({ focusType, difficulty:"medium", defense:"mixed" }));
      else if (kind === 2) sequence.push(generateImpactSpec({ focusType, difficulty:"hard", defense:"mixed" }));
      else {
        const candidates = FALLBACK_POKEMON.filter(p => p.types.includes(focusType));
        if (candidates.length) {
          const p = clone(randomItem(candidates));
          sequence.push({ kind:"pokemon", pokemon:formatFallbackPokemon(p), display:"both", focusTypes:[...p.types] });
        } else sequence.push(generateEffectivenessSpec({ focusType, difficulty:"hard", kind:"mixed" }));
      }
    }
    session = newSession("weak", { length:10 }, shuffle(sequence));
    state.route = "session"; saveState(); updateNavigation(); renderQuestion();
  }

  function startReviewSession(specs) {
    if (!specs?.length) return;
    session = newSession("review", { length: specs.length }, specs);
    state.route = "session"; saveState(); updateNavigation(); renderQuestion();
  }

  function generateEffectivenessSpec(options = {}) {
    const random = options.random || Math.random;
    const difficulty = options.difficulty || "medium";
    let questionKind = options.kind || "mixed";
    if (questionKind === "mixed") questionKind = random() < .55 ? "effective" : "resisted";

    let attackingType = options.focusType && random() < .68 ? options.focusType : randomItem(TYPES, random);
    let correctPool = TYPES.filter(type => {
      const value = effectiveness(attackingType,[type]);
      return questionKind === "effective" ? value === 2 : value < 1;
    });
    if (!correctPool.length) return generateEffectivenessSpec({ ...options, focusType:null, random });

    if (options.focusType && attackingType !== options.focusType && correctPool.includes(options.focusType)) {
      correctPool = [options.focusType, ...correctPool.filter(t => t !== options.focusType)];
    } else correctPool = shuffle(correctPool, random);

    const optionCount = difficulty === "easy" ? 4 : 6;
    const maxAnswers = difficulty === "easy" ? 1 : Math.min(3, correctPool.length);
    const answerCount = difficulty === "easy" ? 1 : 1 + Math.floor(random() * maxAnswers);
    const correctTargets = correctPool.slice(0, answerCount);
    const distractors = shuffle(TYPES.filter(t => !correctPool.includes(t)), random).slice(0, optionCount - answerCount);
    return { kind:"effectiveness", questionKind, attackingType, options:shuffle([...correctTargets,...distractors],random), correctTargets, focusTypes:[attackingType] };
  }

  function generateMultiplierSpec(options = {}) {
    const random = options.random || Math.random;
    let defense = options.defense || "mixed";
    if (defense === "mixed") defense = random() < .52 ? "single" : "dual";
    let defendingTypes;
    if (options.focusType && random() < .72) {
      defendingTypes = defense === "single" ? [options.focusType] : [options.focusType, randomItem(TYPES.filter(t => t !== options.focusType),random)];
    } else defendingTypes = defense === "single" ? [randomItem(TYPES,random)] : shuffle(TYPES,random).slice(0,2);
    return { kind:"multiplier", defendingTypes, focusTypes:[...defendingTypes] };
  }

  function generateImpactSpec(options = {}) {
    const random = options.random || Math.random;
    let defense = options.defense || "mixed";
    if (defense === "mixed") defense = random() < .48 ? "single" : "dual";
    const attackingType = options.focusType && random() < .55 ? options.focusType : randomItem(TYPES, random);
    let defendingTypes;
    if (options.focusType && attackingType !== options.focusType && random() < .7) {
      defendingTypes = defense === "single" ? [options.focusType] : [options.focusType, randomItem(TYPES.filter(type => type !== options.focusType), random)];
    } else {
      defendingTypes = defense === "single" ? [randomItem(TYPES, random)] : shuffle(TYPES, random).slice(0, 2);
    }
    const correctMultiplier = effectiveness(attackingType, defendingTypes);
    const all = [0, .25, .5, 1, 2, 4];
    const optionCount = options.difficulty === "easy" ? 4 : 6;
    const nearby = shuffle(all.filter(value => value !== correctMultiplier), random).slice(0, optionCount - 1);
    return {
      kind: "impact", attackingType, defendingTypes,
      options: shuffle([correctMultiplier, ...nearby], random), correctMultiplier,
      focusTypes: unique([attackingType, ...defendingTypes])
    };
  }

  async function generatePokemonSpec(config = {}, excludedIds = []) {
    const pokemon = await loadRandomPokemon(config.generation, excludedIds);
    return { kind:"pokemon", pokemon, display:config.display || "both", focusTypes:[...pokemon.types] };
  }

  async function generateFreshSpec() {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      let spec;
      if (session.mode === "effectiveness") spec = generateEffectivenessSpec(session.config);
      else if (session.mode === "multiplier") spec = generateMultiplierSpec(session.config);
      else if (session.mode === "impact") spec = generateImpactSpec(session.config);
      else if (session.mode === "pokemon") spec = await generatePokemonSpec(session.config, session.usedPokemonIds);
      if (!spec) continue;
      if (!session.usedSignatures.includes(questionSignature(spec))) return spec;
    }
    session.usedSignatures = [];
    if (session.mode === "effectiveness") return generateEffectivenessSpec(session.config);
    if (session.mode === "multiplier") return generateMultiplierSpec(session.config);
    if (session.mode === "impact") return generateImpactSpec(session.config);
    return generatePokemonSpec(session.config, []);
  }

  async function renderQuestion() {
    if (!session) { setRoute("home"); return; }
    if (session.index >= session.length || (session.sequence && session.index >= session.sequence.length)) { finishSession(); return; }
    session.answered = false;
    let spec = session.sequence ? clone(session.sequence[session.index]) : await generateFreshSpec();
    if (!session || state.route !== "session" || !spec) return;
    const signature = questionSignature(spec);
    session.usedSignatures.push(signature);
    session.usedSignatures = session.usedSignatures.slice(-60);
    if (spec.kind === "pokemon") {
      session.usedPokemonIds.push(spec.pokemon.id);
      session.usedPokemonIds = session.usedPokemonIds.slice(-30);
    }
    session.currentSpec = spec;
    if (spec.kind === "effectiveness") renderEffectivenessQuestion(spec);
    else if (spec.kind === "multiplier") renderMultiplierQuestion(spec);
    else if (spec.kind === "impact") renderImpactQuestion(spec);
    else renderPokemonQuestion(spec);
  }

  function sessionHeader() {
    const finite = Number.isFinite(session.length);
    const progress = finite ? Math.min(100,Math.round((session.index/session.length)*100)) : 100;
    const label = finite ? t("session.question",{current:session.index+1,total:session.length}) : t("session.questionEndless",{current:session.index+1});
    return `<div class="session-bar"><small>${label}</small><div class="session-progress"><span style="width:${progress}%"></span></div><span class="session-score">✓ ${session.correct}</span></div>`;
  }

  function hintHtml(key,title,text) {
    if (state.seenHints[key]) return "";
    state.seenHints[key] = true; saveState();
    return `<div class="hint-card"><span>💡</span><span><strong>${escapeHtml(title)}</strong><br>${escapeHtml(text)}</span><button class="hint-close" aria-label="${t("common.close")}">×</button></div>`;
  }
  function bindHintClose() { document.querySelector(".hint-close")?.addEventListener("click", e => e.currentTarget.closest(".hint-card")?.remove()); }

  function renderEffectivenessQuestion(spec) {
    const effective = spec.questionKind === "effective";
    spec.selected = new Set();
    view.innerHTML = `<section class="panel">${sessionHeader()}${hintHtml("effectiveness",t("session.multiHint"),t("session.multiHintText"))}
      <div class="quiz-head"><p class="quiz-kicker">${escapeHtml(modeName(session.mode))}</p><h1>${t("session.effectQuestion",{relation:effective?t("session.veryEffective"):t("session.notEffective")})}</h1><p>${spec.correctTargets.length===1?t("session.answerCountOne"):t("session.answerCountMany",{count:spec.correctTargets.length})}</p><div class="type-prompt">${typeChip(spec.attackingType,"large")}</div></div>
      <div class="answer-grid">${spec.options.map(type=>`<button class="answer-button" data-answer="${type}">${typeChip(type)}</button>`).join("")}</div>
      <div class="actions"><button id="primaryAction" class="primary-button">${t("common.check")}</button><button id="finishSession" class="secondary-button">${t("common.finish")}</button></div><div id="feedback" class="feedback"></div></section>`;
    document.querySelectorAll("[data-answer]").forEach(button => button.addEventListener("click",()=>{
      if(session.answered)return; const type=button.dataset.answer; vibrate(5);
      if(spec.selected.has(type)){spec.selected.delete(type);button.classList.remove("selected");}else{spec.selected.add(type);button.classList.add("selected");}
    }));
    document.getElementById("primaryAction").addEventListener("click",()=>checkEffectiveness(spec)); bindFinishButton(); bindHintClose();
  }

  function checkEffectiveness(spec) {
    if(session.answered)return;
    if(!spec.selected.size){showFeedback("neutral",t("session.chooseFirst"));return;}
    session.answered=true;
    const selected=[...spec.selected];
    const correct=selected.length===spec.correctTargets.length&&selected.every(type=>spec.correctTargets.includes(type));
    const errorTypes=unique([...selected.filter(t=>!spec.correctTargets.includes(t)),...spec.correctTargets.filter(t=>!spec.selected.has(t))]);
    document.querySelectorAll("[data-answer]").forEach(button=>{const type=button.dataset.answer;if(spec.correctTargets.includes(type))button.classList.add("correct");else if(spec.selected.has(type))button.classList.add("incorrect");});
    recordQuestion(correct,unique([spec.attackingType,...errorTypes]),selected);
    const details=spec.correctTargets.map(type=>`${typeChip(type,"small")} ${formatMultiplier(effectiveness(spec.attackingType,[type]))}`).join(" ");
    showFeedback(correct?"success":"error",correct?`${t("session.right")} ${typeChip(spec.attackingType,"small")}`:`${t("session.notQuite")} ${t("session.correctTypes",{types:details})}<div class="explanation">${effectivenessExplanation(spec)}</div>`);
    vibrate(correct?15:[25,30,25]); activateNextButton();
  }

  function effectivenessExplanation(spec) {
    return spec.correctTargets.map(target=>`${typeLabel(spec.attackingType)} → ${typeLabel(target)}: ${formatMultiplier(effectiveness(spec.attackingType,[target]))}`).join(" · ");
  }

  function renderMultiplierQuestion(spec) {
    spec.assignments=Object.fromEntries(TYPES.map(type=>[type,null])); spec.selectedType=null;
    const buckets=[0,.25,.5,1,2,4];
    view.innerHTML=`<section class="panel">${sessionHeader()}${hintHtml("multiplier",t("session.sortHint"),t("session.sortHintText"))}
      <div class="quiz-head"><p class="quiz-kicker">${escapeHtml(modeName(session.mode))}</p><h1>${t("session.multiplierQuestion")}</h1><p>${t("session.multiplierSubtitle")}</p><div class="defender-types">${spec.defendingTypes.map(type=>typeChip(type,"large")).join("")}</div></div>
      <div class="bucket-grid">${buckets.map(value=>`<button class="bucket" data-bucket="${value}"><span class="bucket-title">${formatMultiplier(value)}</span><span class="bucket-items"></span></button>`).join("")}</div>
      <div class="type-pool"><div class="pool-heading"><strong>${t("session.unassigned")}</strong><span id="remainingCount"></span></div><div class="type-pool-items"></div></div>
      <div class="actions"><button id="primaryAction" class="primary-button">${t("common.check")}</button><button id="finishSession" class="secondary-button">${t("common.finish")}</button></div><div id="feedback" class="feedback"></div></section>`;
    refreshMultiplierBoard(spec);
    document.querySelectorAll("[data-bucket]").forEach(bucket=>bucket.addEventListener("click",event=>{
      if(session.answered||!spec.selectedType||event.target.closest(".type-chip"))return;
      spec.assignments[spec.selectedType]=Number(bucket.dataset.bucket); spec.selectedType=null; vibrate(6); refreshMultiplierBoard(spec);
    }));
    document.getElementById("primaryAction").addEventListener("click",()=>checkMultiplier(spec)); bindFinishButton(); bindHintClose();
  }

  function refreshMultiplierBoard(spec) {
    document.querySelectorAll(".bucket-items").forEach(item=>item.innerHTML="");
    const pool=document.querySelector(".type-pool-items"); if(!pool)return; pool.innerHTML="";
    TYPES.forEach(type=>{
      const temp=document.createElement("div"); temp.innerHTML=typeChip(type,"small"); const chip=temp.firstElementChild;
      if(spec.selectedType===type)chip.classList.add("is-selected");
      chip.addEventListener("click",event=>{event.stopPropagation();if(session.answered)return;spec.selectedType=spec.selectedType===type?null:type;vibrate(4);refreshMultiplierBoard(spec);});
      const assigned=spec.assignments[type];
      if(assigned===null)pool.appendChild(chip);else document.querySelector(`[data-bucket="${assigned}"] .bucket-items`).appendChild(chip);
    });
    const remaining=TYPES.filter(type=>spec.assignments[type]===null).length;
    document.getElementById("remainingCount").textContent=t("session.remaining",{count:remaining});
  }

  function checkMultiplier(spec) {
    if(session.answered)return;
    const missing=TYPES.filter(type=>spec.assignments[type]===null);
    if(missing.length){showFeedback("neutral",t("session.missingTypes",{count:missing.length}));return;}
    session.answered=true;
    const wrong=TYPES.filter(type=>spec.assignments[type]!==effectiveness(type,spec.defendingTypes));
    const correct=!wrong.length;
    document.querySelectorAll(".bucket .type-chip").forEach(chip=>{const type=chip.dataset.type;chip.classList.add(spec.assignments[type]===effectiveness(type,spec.defendingTypes)?"is-correct":"is-wrong");});
    recordQuestion(correct,spec.defendingTypes,clone(spec.assignments));
    const formulas=wrong.slice(0,5).map(type=>multiplierFormula(type,spec.defendingTypes)).join("");
    showFeedback(correct?"success":"error",correct?t("session.allCorrect"):`${t("session.correctCount",{correct:18-wrong.length})} ${t("session.wrongAssigned",{types:wrong.map(type=>typeChip(type,"small")).join(" ")})}${formulas?`<div class="explanation">${formulas}</div>`:""}`);
    vibrate(correct?15:[25,30,25]); activateNextButton();
  }

  function multiplierFormula(attacker,defenders) {
    const values=defenders.map(def=>TYPE_CHART[attacker]?.[def]??1);
    const result=values.reduce((a,b)=>a*b,1);
    return `<div class="formula">${typeChip(attacker,"small")} ${values.map(formatMultiplier).join(" × ")} = ${formatMultiplier(result)}</div>`;
  }

  function renderImpactQuestion(spec) {
    spec.selectedMultiplier = null;
    view.innerHTML = `<section class="panel">${sessionHeader()}${hintHtml("impact",t("session.impactHint"),t("session.impactHintText"))}
      <div class="quiz-head"><p class="quiz-kicker">${escapeHtml(modeName(session.mode))}</p><h1>${t("session.impactQuestion")}</h1><p>${t("session.impactSubtitle")}</p>
      <div class="matchup-display"><div><small>${t("learn.attackType")}</small>${typeChip(spec.attackingType,"large")}</div><span class="matchup-arrow">→</span><div><small>${t("learn.defendingType")}</small><div class="defender-types compact">${spec.defendingTypes.map(type=>typeChip(type,"large")).join("")}</div></div></div></div>
      <div class="multiplier-options">${spec.options.map(value=>`<button class="multiplier-option" data-impact-value="${value}"><strong>${formatMultiplier(value)}</strong><small>${impactOptionLabel(value)}</small></button>`).join("")}</div>
      <div class="actions"><button id="primaryAction" class="primary-button">${t("common.check")}</button><button id="finishSession" class="secondary-button">${t("common.finish")}</button></div><div id="feedback" class="feedback"></div></section>`;
    document.querySelectorAll("[data-impact-value]").forEach(button=>button.addEventListener("click",()=>{
      if(session.answered)return;
      spec.selectedMultiplier=Number(button.dataset.impactValue);
      document.querySelectorAll("[data-impact-value]").forEach(item=>item.classList.toggle("selected",item===button));
      vibrate(5);
    }));
    document.getElementById("primaryAction").addEventListener("click",()=>checkImpact(spec));bindFinishButton();bindHintClose();
  }

  function impactOptionLabel(value) {
    if (value === 0) return t("onboarding.none");
    if (value < 1) return t("onboarding.half");
    if (value === 1) return t("onboarding.normal");
    if (value === 4) return t("onboarding.quad");
    return t("onboarding.double");
  }

  function checkImpact(spec) {
    if(session.answered)return;
    if(spec.selectedMultiplier===null){showFeedback("neutral",t("session.chooseMultiplier"));return;}
    session.answered=true;
    const correct=spec.selectedMultiplier===spec.correctMultiplier;
    document.querySelectorAll("[data-impact-value]").forEach(button=>{
      const value=Number(button.dataset.impactValue);
      if(value===spec.correctMultiplier)button.classList.add("correct");
      else if(value===spec.selectedMultiplier)button.classList.add("incorrect");
    });
    recordQuestion(correct,unique([spec.attackingType,...spec.defendingTypes]),spec.selectedMultiplier);
    const formula=multiplierFormula(spec.attackingType,spec.defendingTypes);
    showFeedback(correct?"success":"error",`${correct?t("session.right"):t("session.notQuite")} ${t("session.impactResult",{result:formatMultiplier(spec.correctMultiplier)})}<div class="explanation">${formula}</div>`);
    vibrate(correct?15:[25,30,25]);activateNextButton();
  }

  async function renderPokemonQuestion(spec) {
    spec.selected=new Set();
    const showImage=spec.display!=="name"; const showName=spec.display!=="image";
    view.innerHTML=`<section class="panel pokemon-stage">${sessionHeader()}${hintHtml("pokemon",t("session.pokemonHint"),t("session.pokemonHintText"))}
      <div class="quiz-head"><p class="quiz-kicker">${escapeHtml(modeName(session.mode))}</p><h1>${t("session.pokemonQuestion")}</h1><p>${t("session.chooseOneTwo")}</p></div>
      ${showImage?`<div class="pokemon-frame"><img class="pokemon-art" src="${escapeHtml(spec.pokemon.image)}" alt="${escapeHtml(spec.pokemon.name)}"><span class="pokemon-placeholder" hidden>?</span></div>`:""}
      ${showName?`<h2 class="pokemon-name">${escapeHtml(spec.pokemon.name)}</h2>`:""}
      <div class="type-picker">${TYPES.map(type=>`<button class="type-option" data-pokemon-type="${type}">${typeChip(type)}</button>`).join("")}</div>
      <div class="actions"><button id="primaryAction" class="primary-button">${t("common.check")}</button><button id="finishSession" class="secondary-button">${t("common.finish")}</button></div><div id="feedback" class="feedback"></div></section>`;
    const image=document.querySelector(".pokemon-art"); if(image)image.addEventListener("error",()=>{image.hidden=true;document.querySelector(".pokemon-placeholder").hidden=false;});
    document.querySelectorAll("[data-pokemon-type]").forEach(button=>button.addEventListener("click",()=>{
      if(session.answered)return; const type=button.dataset.pokemonType; vibrate(5);
      if(spec.selected.has(type)){spec.selected.delete(type);button.classList.remove("selected");return;}
      if(spec.selected.size>=2)return; spec.selected.add(type);button.classList.add("selected");
    }));
    document.getElementById("primaryAction").addEventListener("click",()=>checkPokemon(spec)); bindFinishButton(); bindHintClose();
  }

  function checkPokemon(spec) {
    if(session.answered)return;
    if(!spec.selected.size){showFeedback("neutral",t("session.chooseFirst"));return;}
    session.answered=true;
    const expected=spec.pokemon.types; const selected=[...spec.selected];
    const correct=selected.length===expected.length&&selected.every(type=>expected.includes(type));
    document.querySelectorAll("[data-pokemon-type]").forEach(button=>{const type=button.dataset.pokemonType;if(expected.includes(type))button.classList.add("correct");else if(spec.selected.has(type))button.classList.add("incorrect");});
    recordQuestion(correct,expected,selected);
    showFeedback(correct?"success":"error",correct?`${t("session.right")} ${escapeHtml(spec.pokemon.name)}`:`${t("session.correctTypes",{types:expected.map(type=>typeChip(type)).join(" ")})}`);
    vibrate(correct?15:[25,30,25]); activateNextButton();
  }

  function questionSignature(spec) {
    if(spec.kind==="effectiveness")return `e:${spec.attackingType}:${spec.questionKind}:${[...spec.correctTargets].sort().join(",")}`;
    if(spec.kind==="multiplier")return `m:${[...spec.defendingTypes].sort().join(",")}`;
    if(spec.kind==="impact")return `i:${spec.attackingType}:${[...spec.defendingTypes].sort().join(",")}`;
    return `p:${spec.pokemon.id}`;
  }

  function recordQuestion(correct,relatedTypes,userAnswer) {
    const specForReview=serializeCurrentQuestion(); const isReview=session.mode==="review";
    const modeStats=state.stats.modes[session.mode]||blankModeStats(); state.stats.modes[session.mode]=modeStats; modeStats.total+=1;if(correct)modeStats.correct+=1;
    if(!isReview){
      state.stats.total+=1;
      if(correct){state.stats.correct+=1;state.stats.streak+=1;state.stats.bestStreak=Math.max(state.stats.bestStreak,state.stats.streak);}else state.stats.streak=0;
      unique(relatedTypes).forEach(type=>{const stats=state.stats.types[type];if(!stats)return;stats.total+=1;if(correct)stats.correct+=1;stats.lastSeen=new Date().toISOString();stats.recent.push(Boolean(correct));stats.recent=stats.recent.slice(-10);if(!correct)session.wrongTypes[type]=(session.wrongTypes[type]||0)+1;});
    }
    updateMistakeBook(correct,specForReview,userAnswer);
    session.answers.push({correct,kind:session.currentSpec.kind,relatedTypes:unique(relatedTypes)});
    if(correct){
      session.correct+=1;
      if(isReview) session.reviewPending = session.reviewPending.filter(signature => signature !== questionSignature(specForReview));
    }else{
      session.wrongQuestions.push(specForReview);
      if(isReview&&session.sequence){session.sequence.push(clone(specForReview));session.length+=1;}
    }
    addXp(correct?(isReview?5:10):0); checkAchievements(); saveState();
  }

  function updateMistakeBook(correct,spec,userAnswer) {
    const signature=questionSignature(spec); let item=state.stats.mistakes.find(entry=>entry.signature===signature);
    if(correct){
      if(item&&item.status!=="resolved"){item.correctReviews=(item.correctReviews||0)+1;item.lastSeen=new Date().toISOString();if(item.correctReviews>=2)item.status="resolved";}
      return;
    }
    if(!item){item={id:`mistake-${Date.now()}-${Math.random().toString(16).slice(2)}`,signature,spec:clone(spec),wrongCount:0,correctReviews:0,status:"open",createdAt:new Date().toISOString(),lastSeen:new Date().toISOString(),lastAnswer:null};state.stats.mistakes.unshift(item);}
    item.wrongCount+=1;item.correctReviews=0;item.status="open";item.lastSeen=new Date().toISOString();item.lastAnswer=clone(userAnswer);
    state.stats.mistakes=state.stats.mistakes.slice(0,100);
  }

  function serializeCurrentQuestion() {
    const spec=session.currentSpec;
    if(spec.kind==="effectiveness")return {kind:"effectiveness",questionKind:spec.questionKind,attackingType:spec.attackingType,options:[...spec.options],correctTargets:[...spec.correctTargets],focusTypes:[...spec.focusTypes]};
    if(spec.kind==="multiplier")return {kind:"multiplier",defendingTypes:[...spec.defendingTypes],focusTypes:[...spec.focusTypes]};
    if(spec.kind==="impact")return {kind:"impact",attackingType:spec.attackingType,defendingTypes:[...spec.defendingTypes],options:[...spec.options],correctMultiplier:spec.correctMultiplier,focusTypes:[...spec.focusTypes]};
    return {kind:"pokemon",pokemon:clone(spec.pokemon),display:spec.display,focusTypes:[...spec.focusTypes]};
  }

  function checkAchievements() {
    unlockAchievement("first_answer",state.stats.total>=1);
    unlockAchievement("ten_correct",state.stats.correct>=10);
    unlockAchievement("hundred_answers",state.stats.total>=100);
    unlockAchievement("streak_5",state.stats.bestStreak>=5);
    unlockAchievement("streak_20",state.stats.bestStreak>=20);
  }
  function unlockAchievement(id,condition) {
    if(!condition||state.stats.achievements[id])return; const achievement=ACHIEVEMENTS.find(a=>a.id===id);if(!achievement)return;
    state.stats.achievements[id]=new Date().toISOString(); enqueueToast(achievement.icon,t("toast.achievement"),t(achievement.titleKey));
  }

  function showFeedback(kind,html){const box=document.getElementById("feedback");if(!box)return;box.className=`feedback visible ${kind}`;box.innerHTML=html;}
  function activateNextButton(){const button=document.getElementById("primaryAction");if(!button)return;const last=Number.isFinite(session.length)&&session.index+1>=session.length;const end=session.sequence&&session.index+1>=session.sequence.length;button.textContent=last||end?t("common.results"):t("common.next");button.onclick=advanceQuestion;}
  function advanceQuestion(){session.index+=1;renderQuestion();}
  function bindFinishButton(){document.getElementById("finishSession")?.addEventListener("click",()=>{if(!session.answers.length){session=null;setRoute("home");return;}if(confirm(t("session.leaveConfirm")))finishSession();});}

  function finishSession() {
    if(!session){setRoute("home");return;}
    if(session.ended){state.route="summary";saveState();renderSummary();return;}
    session.ended=true;
    const duration=Math.max(1,Math.round((Date.now()-session.startedAt)/1000)); const total=session.answers.length; const rate=percent(session.correct,total); const isReview=session.mode==="review";
    if(!isReview&&total){
      state.stats.sessions+=1;state.stats.totalSeconds+=duration;state.stats.modes[session.mode].sessions+=1;
      const weakTypes=Object.entries(session.wrongTypes).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([type])=>type);
      state.stats.history.unshift({date:new Date().toISOString(),mode:session.mode,answers:total,correct:session.correct,rate,duration,weakTypes});state.stats.history=state.stats.history.slice(0,30);
      if(rate===100){addXp(50);unlockAchievement("perfect_session",total>=5);}
      if(session.mode==="daily")completeDaily(rate,duration);
      if(session.mode==="weak")unlockAchievement("weakness_session",true);
    }else if(isReview)state.stats.modes.review.sessions+=1;
    saveState();state.route="summary";saveState();renderSummary();
  }

  function completeDaily(rate,duration){const today=todayKey();if(!state.daily.completed){const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);const yesterdayKey=`${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;state.daily.streak=state.daily.lastCompletedDate===yesterdayKey?state.daily.streak+1:1;state.daily.lastCompletedDate=today;state.daily.completed=true;state.daily.result={rate,duration};addXp(100);unlockAchievement("daily_first",true);}else state.daily.result={rate,duration};}

  function renderSummary() {
    if(!session){setRoute("home");return;}
    const total=session.answers.length;const rate=percent(session.correct,total);const xpEarned=state.stats.xp-session.startXp;const wrongTypes=Object.entries(session.wrongTypes).sort((a,b)=>b[1]-a[1]).slice(0,5);const canReview=session.mode!=="review"&&session.wrongQuestions.length>0;const reviewComplete=session.mode==="review"&&session.reviewPending.length===0;
    view.innerHTML=`<section class="panel"><div class="quiz-head"><p class="quiz-kicker">${t("summary.kicker")}</p><h1>${escapeHtml(modeName(session.mode))}</h1><p>${reviewComplete?t("summary.reviewComplete"):t("summary.compact")}</p></div>
      <div class="summary-score" style="--score:${rate}%"><span>${rate}%</span></div><div class="summary-sub">${t("summary.answers",{correct:session.correct,total})}</div>
      <div class="summary-list"><div class="summary-item"><span>${t("summary.xp")}</span><strong>+${Math.max(0,xpEarned)} XP</strong></div><div class="summary-item"><span>${t("summary.streak")}</span><strong>${state.stats.streak}</strong></div><div class="summary-item"><span>${t("summary.best")}</span><strong>${state.stats.bestStreak}</strong></div><div class="summary-item"><span>${t("summary.errors")}</span><strong>${session.wrongQuestions.length}</strong></div></div>
      ${wrongTypes.length?`<div class="section-title"><h2>${t("summary.focus")}</h2><p>${t("summary.thisSession")}</p></div><div class="weak-list">${wrongTypes.map(([type,count])=>`${typeChip(type)} <strong>${count}×</strong>`).join(" ")}</div>`:""}
      <div class="actions stack">${canReview?`<button id="reviewErrors" class="primary-button">${t("summary.review")}</button>`:""}${session.mode!=="review"&&["effectiveness","multiplier","impact","pokemon"].includes(session.mode)?`<button id="repeatSession" class="secondary-button">${t("summary.repeat")}</button>`:""}<button id="goHome" class="ghost-button">${t("summary.home")}</button></div></section>`;
    document.getElementById("reviewErrors")?.addEventListener("click",()=>startReviewSession(session.wrongQuestions));
    document.getElementById("repeatSession")?.addEventListener("click",()=>startSession(session.mode));
    document.getElementById("goHome").addEventListener("click",()=>{session=null;setRoute("home");});
  }

  function renderLearn() {
    learnType=null;
    view.innerHTML=`<section class="panel"><div class="quiz-head"><p class="quiz-kicker">${t("learn.kicker")}</p><h1>${t("learn.title")}</h1><p>${t("learn.subtitle")}</p></div>
      <div class="tabs" style="--tab-count:2"><button class="tab-button ${state.learnTab==="lexicon"?"active":""}" data-learn-tab="lexicon">${t("learn.lexicon")}</button><button class="tab-button ${state.learnTab==="lab"?"active":""}" data-learn-tab="lab">${t("learn.lab")}</button></div><div id="learnContent"></div></section>`;
    document.querySelectorAll("[data-learn-tab]").forEach(button=>button.addEventListener("click",()=>{state.learnTab=button.dataset.learnTab;saveState();renderLearn();}));
    if(state.learnTab==="lab")renderTypeLab();else renderLexicon();
  }

  function renderLexicon() {
    const content=document.getElementById("learnContent");
    content.innerHTML=`<div class="learn-grid">${TYPES.map(type=>{const s=state.stats.types[type];const rate=percent(s.correct,s.total);return `<button class="learn-card" data-learn-type="${type}">${typeChip(type)}<small>${s.total?t("learn.typeAccuracy",{rate,total:s.total}):t("learn.noData")}</small></button>`;}).join("")}</div>`;
    document.querySelectorAll("[data-learn-type]").forEach(button=>button.addEventListener("click",()=>{learnType=button.dataset.learnType;setRoute("learn-detail");}));
  }

  function groupByMultiplier(types,resolver){const groups={0:[],0.5:[],1:[],2:[]};types.forEach(type=>{const value=resolver(type);if(!groups[value])groups[value]=[];groups[value].push(type);});return groups;}
  function renderLearnDetail() {
    if(!learnType){setRoute("learn");return;}
    const attack=groupByMultiplier(TYPES,target=>effectiveness(learnType,[target]));
    const defense=groupByMultiplier(TYPES,attacker=>effectiveness(attacker,[learnType]));
    const s=state.stats.types[learnType];
    const memory=memoryAid(learnType,attack,defense);
    view.innerHTML=`<section class="panel"><div class="quiz-head"><div class="type-prompt">${typeChip(learnType,"large")}</div><h1>${escapeHtml(typeLabel(learnType))}</h1><p>${s.total?t("learn.typeAccuracy",{rate:percent(s.correct,s.total),total:s.total}):t("learn.noData")}</p></div>
      <div class="memory-card"><strong>${t("learn.memory")}:</strong> ${escapeHtml(memory)}</div>
      <div class="learn-sections"><section class="learn-block"><h3>${t("learn.attack")}</h3>${learnGroup(t("learn.strongAgainst"),attack[2])}${learnGroup(t("learn.weakAgainst"),attack[.5])}${learnGroup(t("learn.noEffect"),attack[0])}</section>
      <section class="learn-block"><h3>${t("learn.defense")}</h3>${learnGroup(t("learn.vulnerable"),defense[2])}${learnGroup(t("learn.resists"),defense[.5])}${learnGroup(t("learn.immune"),defense[0])}</section></div></section>`;
  }
  function learnGroup(title,types){return `<div class="learn-row"><strong>${escapeHtml(title)}</strong><div class="chip-wrap">${types?.length?types.map(type=>typeChip(type,"small")).join(""):"–"}</div></div>`;}
  function memoryAid(type,attack,defense){
    const strong=(attack[2]||[]).slice(0,3).map(typeLabel).join(", ");const vulnerable=(defense[2]||[]).slice(0,3).map(typeLabel).join(", ");
    if(state.language==="de")return `${typeLabel(type)} trifft ${strong||"wenige Typen"} stark und muss besonders auf ${vulnerable||"keine typischen Schwächen"} achten.`;
    return `${typeLabel(type)} hits ${strong||"few types"} hard and should watch out for ${vulnerable||"no common weaknesses"}.`;
  }

  function renderTypeLab() {
    const content=document.getElementById("learnContent");
    content.innerHTML=`<div class="lab-grid"><div class="field"><label>${t("learn.attackType")}</label><select id="labAttack" class="select-control">${typeOptions("fire")}</select></div><div class="field"><label>${t("learn.defendingType")}</label><select id="labDefense1" class="select-control">${typeOptions("grass")}</select></div><div class="field"><label>${t("learn.secondType")}</label><select id="labDefense2" class="select-control"><option value="">${t("common.none")}</option>${typeOptions("")}</select></div><div class="lab-result" id="labResult"></div></div>`;
    ["labAttack","labDefense1","labDefense2"].forEach(id=>document.getElementById(id).addEventListener("change",updateLabResult));updateLabResult();
  }
  function typeOptions(selected){return TYPES.map(type=>`<option value="${type}" ${type===selected?"selected":""}>${escapeHtml(typeLabel(type))}</option>`).join("");}
  function updateLabResult(){const attack=document.getElementById("labAttack")?.value;const d1=document.getElementById("labDefense1")?.value;const d2=document.getElementById("labDefense2")?.value;if(!attack||!d1)return;const defenders=[d1,d2].filter(Boolean);const values=defenders.map(d=>TYPE_CHART[attack]?.[d]??1);const result=values.reduce((a,b)=>a*b,1);document.getElementById("labResult").innerHTML=`<small>${t("learn.result")}</small><div class="result-multiplier">${formatMultiplier(result)}</div><div class="type-prompt">${typeChip(attack)} → ${defenders.map(type=>typeChip(type)).join(" ")}</div><div class="formula"><span>${t("learn.breakdown")}:</span> ${values.map(formatMultiplier).join(" × ")} = ${formatMultiplier(result)}</div>`;}

  function renderStats() {
    const tabs=[["overview",t("stats.overview")],["types",t("stats.types")],["errors",t("stats.errors")],["achievements",t("stats.achievements")]];
    view.innerHTML=`<section class="panel"><div class="quiz-head"><p class="quiz-kicker">${t("stats.kicker")}</p><h1>${t("stats.title")}</h1><p>${t("stats.subtitle")}</p></div><div class="tabs" style="--tab-count:4">${tabs.map(([key,label])=>`<button class="tab-button ${state.statsTab===key?"active":""}" data-stats-tab="${key}">${escapeHtml(label)}</button>`).join("")}</div><div id="statsContent"></div></section>`;
    document.querySelectorAll("[data-stats-tab]").forEach(button=>button.addEventListener("click",()=>{state.statsTab=button.dataset.statsTab;saveState();renderStats();}));
    if(state.statsTab==="types")renderTypeStats();else if(state.statsTab==="errors")renderMistakes();else if(state.statsTab==="achievements")renderAchievements();else renderStatsOverview();
  }

  function renderStatsOverview() {
    const content=document.getElementById("statsContent");const level=getLevelInfo();const modes=["effectiveness","multiplier","impact","pokemon","weak","daily","review"];
    content.innerHTML=`<section class="stats-grid"><article class="stat-card"><small>${t("stats.answered")}</small><strong>${state.stats.total}</strong></article><article class="stat-card"><small>${t("stats.accuracy")}</small><strong>${percent(state.stats.correct,state.stats.total)}%</strong></article><article class="stat-card"><small>${t("stats.time")}</small><strong>${Math.round(state.stats.totalSeconds/60)} min</strong></article><article class="stat-card"><small>${t("stats.level")}</small><strong>${level.current.level}</strong></article></section>
      ${statsRecommendationHtml()}
      <div class="section-title"><h2>${t("stats.modes")}</h2><p>${t("stats.accuracy")}</p></div>${modes.map(mode=>{const s=state.stats.modes[mode];const rate=percent(s.correct,s.total);return `<div class="progress-row"><strong>${escapeHtml(modeName(mode))}</strong><div class="progress-track"><div class="progress-fill" style="width:${rate}%"></div></div><span>${rate}%</span></div>`;}).join("")}
      <div class="section-title"><h2>${t("stats.lastSessions")}</h2><p>${t("stats.saved",{count:state.stats.history.length})}</p></div><div class="history-list">${state.stats.history.length?state.stats.history.slice(0,10).map(item=>`<div class="history-item"><div><strong>${escapeHtml(modeName(item.mode))}</strong><small>${formatDate(item.date)} · ${formatDuration(item.duration)}</small></div><strong>${item.correct}/${item.answers} · ${item.rate}%</strong></div>`).join(""):`<p class="helper-text">${t("stats.noSessions")}</p>`}</div>`;
    bindRecommendation();
  }

  function statsRecommendationHtml() {
    const weak = getWeakTypes(1)[0];
    const modeEntries = ["effectiveness","multiplier","impact","pokemon"].map(mode => {
      const values = state.stats.modes[mode];
      return { mode, total: values.total, rate: percent(values.correct, values.total) };
    }).filter(item => item.total >= 3).sort((a,b)=>a.rate-b.rate);
    const weakestMode = modeEntries[0];
    if (!weak && !weakestMode) return `<div class="recommendation-card"><span class="recommendation-icon">◎</span><div><strong>${t("stats.recommendation")}</strong><p>${t("stats.recommendationEmpty")}</p></div></div>`;
    const mode = weakestMode?.mode || "effectiveness";
    const typeText = weak ? typeLabel(weak.type) : t("common.none");
    return `<button class="recommendation-card interactive" id="startRecommendation"><span class="recommendation-icon">↗</span><div><strong>${t("stats.recommendation")}</strong><p>${t("stats.recommendationText",{mode:modeName(mode),type:typeText})}</p></div><span class="arrow">›</span></button>`;
  }

  function bindRecommendation() {
    const button=document.getElementById("startRecommendation");
    if(!button)return;
    const entries=["effectiveness","multiplier","impact","pokemon"].map(mode=>({mode,total:state.stats.modes[mode].total,rate:percent(state.stats.modes[mode].correct,state.stats.modes[mode].total)})).filter(item=>item.total>=3).sort((a,b)=>a.rate-b.rate);
    button.addEventListener("click",()=>setRoute(`setup-${entries[0]?.mode||"effectiveness"}`));
  }

  function renderTypeStats() {
    const content=document.getElementById("statsContent");const items=TYPES.map(type=>{const s=state.stats.types[type];const rate=percent(s.correct,s.total);const recentRate=s.recent.length?percent(s.recent.filter(Boolean).length,s.recent.length):rate;const trend=recentRate>rate+5?"up":recentRate<rate-5?"down":"same";return{type,...s,rate,trend};}).sort((a,b)=>{if(!a.total&&b.total)return 1;if(a.total&&!b.total)return-1;return a.rate-b.rate||b.total-a.total;});
    content.innerHTML=`<p class="helper-text">${t("stats.typeHelp")}</p><div class="type-stat-list">${items.map(item=>`<div class="type-stat-row">${typeChip(item.type,"small")}<div><strong>${item.total?`${item.rate}%`:t("stats.open")}</strong><br><small>${t("stats.questionsCount",{count:item.total})} · ${t("stats.last",{date:formatDate(item.lastSeen)})}</small></div><span class="trend ${item.trend}">${item.trend==="up"?"↑":item.trend==="down"?"↓":"→"}</span></div>`).join("")}</div>`;
  }

  function mistakeTitle(item) {
    const s=item.spec;
    if(s.kind==="effectiveness")return `${typeLabel(s.attackingType)} → ${s.correctTargets.map(typeLabel).join(", ")}`;
    if(s.kind==="multiplier")return s.defendingTypes.map(typeLabel).join(" + ");
    if(s.kind==="impact")return `${typeLabel(s.attackingType)} → ${s.defendingTypes.map(typeLabel).join(" + ")}`;
    return s.pokemon.name;
  }
  function mistakeAnswer(item) {
    const s=item.spec;
    if(s.kind==="effectiveness")return s.correctTargets.map(type=>typeChip(type,"small")).join(" ");
    if(s.kind==="multiplier")return TYPES.filter(type=>effectiveness(type,s.defendingTypes)!==1).map(type=>`${typeChip(type,"small")} ${formatMultiplier(effectiveness(type,s.defendingTypes))}`).join(" ");
    if(s.kind==="impact")return `<strong>${formatMultiplier(s.correctMultiplier)}</strong> ${multiplierFormula(s.attackingType,s.defendingTypes)}`;
    return s.pokemon.types.map(type=>typeChip(type,"small")).join(" ");
  }
  function renderMistakes() {
    const content=document.getElementById("statsContent");const open=state.stats.mistakes.filter(item=>item.status!=="resolved").sort((a,b)=>new Date(b.lastSeen)-new Date(a.lastSeen));
    content.innerHTML=`<p class="helper-text">${t("stats.errorHelp")}</p><div class="error-list">${open.length?open.map(item=>`<article class="error-card"><div class="error-top"><div><h3>${escapeHtml(mistakeTitle(item))}</h3><small>${escapeHtml(modeName(item.spec.kind))} · ${formatDate(item.lastSeen)}</small></div><span class="type-chip small" style="--type-color:var(--danger)"><span class="type-symbol">!</span><span>${t("stats.wrongCount",{count:item.wrongCount})}</span></span></div><div class="error-answer"><strong>${t("session.correctTypes",{types:""})}</strong> ${mistakeAnswer(item)}</div><div class="error-meta"><span>${t("stats.resolvedProgress",{count:item.correctReviews||0})}</span></div></article>`).join(""):`<p class="helper-text">${t("stats.noErrors")}</p>`}</div>`;
  }

  function renderAchievements() {
    const content=document.getElementById("statsContent");const unlocked=Object.keys(state.stats.achievements).length;
    content.innerHTML=`<p class="helper-text">${t("stats.achievementsCount",{unlocked,total:ACHIEVEMENTS.length})}</p><div class="achievement-grid">${ACHIEVEMENTS.map(a=>{const date=state.stats.achievements[a.id];return `<article class="achievement-card ${date?"":"locked"}"><span class="achievement-icon">${date?a.icon:"🔒"}</span><div><h3>${escapeHtml(t(a.titleKey))}</h3><p>${escapeHtml(t(a.descriptionKey))}${date?` · ${formatDate(date)}`:""}</p></div></article>`;}).join("")}</div>`;
  }

  function renderSettings() {
    const dark=actualTheme()==="dark";
    view.innerHTML=`<div class="quiz-head"><p class="quiz-kicker">${t("settings.kicker")}</p><h1>${t("settings.title")}</h1><p>${t("settings.subtitle")}</p></div><section class="settings-list">
      <div class="setting-row"><div><h3>${t("settings.language")}</h3><p>${t("settings.languageDesc")}</p></div><select id="languageSelect" class="select-control"><option value="de" ${state.language==="de"?"selected":""}>Deutsch</option><option value="en" ${state.language==="en"?"selected":""}>English</option></select></div>
      <div class="setting-row"><div><h3>${t("settings.theme")}</h3><p>${t("settings.themeDesc")}</p></div><button id="themeToggle" class="switch ${dark?"on":""}" aria-label="${t("settings.theme")}"></button></div>
      <div class="setting-row"><div><h3>${t("settings.animations")}</h3><p>${t("settings.animationsDesc")}</p></div><button id="animationToggle" class="switch ${state.animations?"on":""}"></button></div>
      <div class="setting-row"><div><h3>${t("settings.haptics")}</h3><p>${t("settings.hapticsDesc")}</p></div><button id="hapticToggle" class="switch ${state.haptics?"on":""}"></button></div>
      <div class="setting-row"><div><h3>${t("settings.tutorial")}</h3><p>${t("settings.tutorialDesc")}</p></div><button id="restartTutorial" class="secondary-button">${t("common.start")}</button></div>
      <div class="setting-row"><div><h3>${t("settings.export")}</h3><p>${t("settings.exportDesc")}</p></div><button id="exportProgress" class="secondary-button">Export</button></div>
      <div class="setting-row"><div><h3>${t("settings.import")}</h3><p>${t("settings.importDesc")}</p></div><button id="importProgress" class="secondary-button">Import</button><input id="importFile" type="file" accept="application/json" hidden></div>
      <div class="setting-row"><div><h3>${t("settings.feedback")}</h3><p>${t("settings.feedbackDesc")}</p></div><button id="exportFeedback" class="secondary-button">${t("settings.createReport")}</button></div>
      <div class="setting-row"><div><h3>${t("settings.diagnostics")}</h3><p>${t("settings.diagnosticsDesc")}</p></div><button id="exportDiagnostics" class="secondary-button">Export</button></div>
      <div class="setting-row"><div><h3>${t("settings.reset")}</h3><p>${t("settings.resetDesc")}</p></div><button id="resetProgress" class="danger-button">${t("settings.delete")}</button></div>
    </section><div class="note"><strong>v0.6.1 Alpha · letzter Alpha-Build</strong><br>${t("settings.versionNote")}</div><div class="note">${t("settings.offlineNote")}<br><br>${t("settings.installIos")}</div>`;
    document.getElementById("languageSelect").addEventListener("change",event=>{state.language=event.target.value;saveState();applyPreferences();renderSettings();});
    document.getElementById("themeToggle").addEventListener("click",()=>{state.theme=dark?"light":"dark";saveState();applyPreferences();renderSettings();});
    document.getElementById("animationToggle").addEventListener("click",()=>{state.animations=!state.animations;saveState();applyPreferences();renderSettings();});
    document.getElementById("hapticToggle").addEventListener("click",()=>{state.haptics=!state.haptics;saveState();renderSettings();});
    document.getElementById("restartTutorial").addEventListener("click",()=>{state.onboardingComplete=false;saveState();openOnboarding(0);});
    document.getElementById("exportProgress").addEventListener("click",exportProgress);
    document.getElementById("importProgress").addEventListener("click",()=>document.getElementById("importFile").click());
    document.getElementById("importFile").addEventListener("change",importProgress);
    document.getElementById("exportFeedback").addEventListener("click",exportFeedback);
    document.getElementById("exportDiagnostics").addEventListener("click",exportDiagnostics);
    document.getElementById("resetProgress").addEventListener("click",()=>{if(!confirm(t("settings.resetConfirm")))return;OLD_KEYS.concat(STORAGE_KEY).forEach(key=>localStorage.removeItem(key));state=clone(defaults);state.language=defaultLanguage;saveState();render();});
  }

  function downloadJson(data, filename) { const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url); }
  function exportProgress(){ const payload={app:"PokemonTypLearner",exportVersion:"0.6.1",schema:2,exportedAt:new Date().toISOString(),state}; downloadJson(payload,`PokemonTypLearner-v0.6.1-${todayKey()}.json`); state.diagnostics.lastBackup=new Date().toISOString(); saveState(); }
  function exportDiagnostics(){ downloadJson({app:"PokemonTypLearner",version:"0.6.1",createdAt:new Date().toISOString(),route:state.route,language:state.language,userAgent:navigator.userAgent,online:navigator.onLine,diagnostics:state.diagnostics},`PokemonTypLearner-Diagnose-${todayKey()}.json`); }
  function exportFeedback(){ const report={category:"",description:"",expected:"",steps:"",appVersion:"0.6.1 Alpha",createdAt:new Date().toISOString(),route:state.route,language:state.language,userAgent:navigator.userAgent,recentErrors:state.diagnostics.errors.slice(-5)}; downloadJson(report,`PokemonTypLearner-Feedback-${todayKey()}.json`); }
  async function importProgress(event){const file=event.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());const incoming=parsed.state||parsed;const ver=String(incoming.version||parsed.exportVersion||"");if(!["0.6.1","0.6","0.5","0.4","0.3"].includes(ver))throw new Error("version");const backup=clone(state);localStorage.setItem(`${STORAGE_KEY}.backup.${Date.now()}`,JSON.stringify(backup));state=["0.6.1","0.6"].includes(ver)?repairState(incoming):repairState(migrateLegacy(incoming));state.route="settings";saveState();enqueueToast("✓",t("toast.imported"),"");renderSettings();}catch(error){logError(error,"importProgress");alert(t("import.invalid"));}finally{event.target.value="";}}

  function openOnboarding(page=0){onboardingOpen=true;onboardingPage=page;renderOnboarding();}
  function renderOnboarding(){
    const pages=6;let content="";
    if(onboardingPage===0)content=`<div class="onboarding-visual">PT</div><h2>${t("onboarding.welcomeTitle")}</h2><p>${t("onboarding.welcomeText")}</p><div class="language-picks"><button class="language-pick ${state.language==="de"?"active":""}" data-language="de">🇩🇪 Deutsch</button><button class="language-pick ${state.language==="en"?"active":""}" data-language="en">🇬🇧 English</button></div>`;
    else if(onboardingPage===1)content=`<div class="onboarding-visual">×</div><h2>${t("onboarding.basicsTitle")}</h2><p>${t("onboarding.basicsText")}</p><div class="multiplier-guide"><div><strong>0×</strong><small>${t("onboarding.none")}</small></div><div><strong>½×</strong><small>${t("onboarding.half")}</small></div><div><strong>1×</strong><small>${t("onboarding.normal")}</small></div><div><strong>2×</strong><small>${t("onboarding.double")}</small></div><div><strong>4×</strong><small>${t("onboarding.quad")}</small></div></div><div class="formula">${typeChip("fire","small")} 2× × ${typeChip("steel","small")} 2× = 4×</div>`;
    else if(onboardingPage===2)content=`<div class="onboarding-visual">⚔</div><h2>${t("onboarding.effectTitle")}</h2><p>${t("onboarding.effectText")}</p><div class="demo-question"><div class="type-prompt">${typeChip("fire","large")}</div><div class="demo-options">${["water","grass","dragon","fire"].map(type=>`<button class="demo-option" data-demo-effect="${type}">${typeChip(type)}</button>`).join("")}</div><div id="demoMessage" class="demo-message"></div></div>`;
    else if(onboardingPage===3)content=`<div class="onboarding-visual">×4</div><h2>${t("onboarding.sortTitle")}</h2><p>${t("onboarding.sortText")}</p><div class="demo-sort"><button class="demo-option" id="demoWater">${typeChip("water")}</button><div class="demo-buckets">${[.5,1,2].map(value=>`<button class="demo-bucket" data-demo-bucket="${value}">${formatMultiplier(value)}</button>`).join("")}</div><div id="demoMessage" class="demo-message"></div></div>`;
    else if(onboardingPage===4)content=`<div class="onboarding-visual">◉</div><h2>${t("onboarding.pokemonTitle")}</h2><p>${t("onboarding.pokemonText")}</p><div class="demo-question"><div class="pokemon-frame" style="width:150px;height:150px"><img class="pokemon-art" src="${artworkUrl(25)}" alt="Pikachu"></div><div class="demo-options">${["electric","normal","fairy","fire"].map(type=>`<button class="demo-option" data-demo-pokemon="${type}">${typeChip(type)}</button>`).join("")}</div><div id="demoMessage" class="demo-message"></div></div>`;
    else content=`<div class="onboarding-visual">🎯</div><h2>${t("onboarding.personalTitle")}</h2><p>${t("onboarding.personalText")}</p><div class="feature-list"><div class="feature-item"><span class="feature-icon">!</span><span><strong>${t("stats.errors")}</strong><small>${t("stats.errorHelp")}</small></span></div><div class="feature-item"><span class="feature-icon">◇</span><span><strong>${t("learn.title")}</strong><small>${t("learn.subtitle")}</small></span></div><div class="feature-item"><span class="feature-icon">XP</span><span><strong>${t("stats.level")}</strong><small>${t("home.progress")}</small></span></div></div>`;
    modalRoot.innerHTML=`<div class="modal-backdrop" role="dialog" aria-modal="true"><section class="modal-card"><div class="onboarding-progress">${Array.from({length:pages},(_,i)=>`<span class="${i===onboardingPage?"active":""}"></span>`).join("")}</div>${content}<div class="modal-actions"><button id="skipOnboarding" class="ghost-button">${t("common.skip")}</button><button id="nextOnboarding" class="primary-button">${onboardingPage===pages-1?t("onboarding.startTraining"):t("common.next")}</button></div></section></div>`;
    document.querySelectorAll("[data-language]").forEach(button=>button.addEventListener("click",()=>{state.language=button.dataset.language;saveState();applyPreferences();renderOnboarding();}));
    document.querySelectorAll("[data-demo-effect]").forEach(button=>button.addEventListener("click",()=>{const correct=button.dataset.demoEffect==="grass";document.querySelectorAll("[data-demo-effect]").forEach(item=>{item.classList.toggle("correct",item.dataset.demoEffect==="grass");item.classList.toggle("incorrect",item===button&&!correct);});document.getElementById("demoMessage").textContent=correct?t("onboarding.effectCorrect"):t("onboarding.effectWrong");}));
    let waterSelected=false;document.getElementById("demoWater")?.addEventListener("click",event=>{waterSelected=!waterSelected;event.currentTarget.classList.toggle("selected",waterSelected);});
    document.querySelectorAll("[data-demo-bucket]").forEach(button=>button.addEventListener("click",()=>{if(!waterSelected)return;const correct=Number(button.dataset.demoBucket)===2;document.querySelectorAll("[data-demo-bucket]").forEach(item=>item.classList.toggle("correct",Number(item.dataset.demoBucket)===2));document.getElementById("demoMessage").textContent=correct?t("onboarding.sortDone"):t("onboarding.sortText");}));
    document.querySelectorAll("[data-demo-pokemon]").forEach(button=>button.addEventListener("click",()=>{const correct=button.dataset.demoPokemon==="electric";document.querySelectorAll("[data-demo-pokemon]").forEach(item=>{item.classList.toggle("correct",item.dataset.demoPokemon==="electric");item.classList.toggle("incorrect",item===button&&!correct);});document.getElementById("demoMessage").textContent=correct?t("onboarding.pokemonCorrect"):t("onboarding.pokemonWrong");}));
    document.getElementById("skipOnboarding").addEventListener("click",()=>completeOnboarding(false));
    document.getElementById("nextOnboarding").addEventListener("click",()=>{if(onboardingPage<pages-1){onboardingPage+=1;renderOnboarding();}else completeOnboarding(true);});
  }
  function completeOnboarding(startTraining){onboardingOpen=false;modalRoot.innerHTML="";state.onboardingComplete=true;saveState();if(startTraining)setRoute("setup-effectiveness");else render();}

  function showLevelModal(){const level=getLevelInfo();modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal-card"><div class="onboarding-visual">${level.current.level}</div><h2>${escapeHtml(t(level.current.key))}</h2><p>${level.next?`${state.stats.xp} / ${level.next.xp} XP`:`${state.stats.xp} XP`}</p><div class="progress-track" style="margin-top:18px"><div class="progress-fill" style="width:${level.progress}%"></div></div><div class="actions stack"><button id="closeLevel" class="primary-button">${t("common.close")}</button></div></section></div>`;document.getElementById("closeLevel").addEventListener("click",()=>modalRoot.innerHTML="");}
  function enqueueToast(icon,title,description){toastQueue.push({icon,title,description});if(!toastBusy)showNextToast();}
  function showNextToast(){const item=toastQueue.shift();if(!item){toastBusy=false;return;}toastBusy=true;const toast=document.createElement("div");toast.className="toast";toast.innerHTML=`<span class="toast-icon">${item.icon}</span><span><strong>${escapeHtml(item.title)}</strong>${item.description?`<small>${escapeHtml(item.description)}</small>`:""}</span>`;toastRoot.appendChild(toast);setTimeout(()=>{toast.remove();toastBusy=false;showNextToast();},2800);}

  async function loadRandomPokemon(generation="all", excludedIds=[]) {
    const range=generation==="all"?[1,1025]:GENERATION_RANGES[generation]||[1,1025];
    const excluded=new Set(excludedIds.map(Number));
    for(let attempt=0;attempt<4;attempt+=1){
      let randomId;
      do{randomId=range[0]+Math.floor(Math.random()*(range[1]-range[0]+1));}while(excluded.has(randomId)&&excluded.size<(range[1]-range[0]));
      const cacheKey=`${randomId}-${state.language}`;
      if(state.pokemonCache[cacheKey])return state.pokemonCache[cacheKey];
      try{
        const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),6500);
        const [pokemonResponse,speciesResponse]=await Promise.all([fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`,{signal:controller.signal}),fetch(`https://pokeapi.co/api/v2/pokemon-species/${randomId}`,{signal:controller.signal})]);clearTimeout(timeout);
        if(!pokemonResponse.ok||!speciesResponse.ok)throw new Error("api");
        const pokemonData=await pokemonResponse.json();const speciesData=await speciesResponse.json();const lang=state.language==="de"?"de":"en";const name=speciesData.names.find(entry=>entry.language.name===lang)?.name||speciesData.names.find(entry=>entry.language.name==="en")?.name||pokemonData.name;
        const types=pokemonData.types.sort((a,b)=>a.slot-b.slot).map(entry=>API_TYPE_MAP[entry.type.name]).filter(Boolean);const image=pokemonData.sprites.other?.["official-artwork"]?.front_default||pokemonData.sprites.front_default||artworkUrl(randomId);
        if(!types.length||!image)throw new Error("incomplete");
        const result={id:randomId,name,types,image};state.pokemonCache[cacheKey]=result;const keys=Object.keys(state.pokemonCache);if(keys.length>160)delete state.pokemonCache[keys[0]];saveState();return result;
      }catch(error){if(attempt===3)console.warn("Pokémon fallback used",error);}
    }
    const candidates=FALLBACK_POKEMON.filter(p=>(generation==="all"||String(p.generation)===String(generation))&&!excluded.has(p.id));
    const pool=candidates.length?candidates:FALLBACK_POKEMON.filter(p=>generation==="all"||String(p.generation)===String(generation));
    return formatFallbackPokemon(randomItem(pool.length?pool:FALLBACK_POKEMON));
  }
  function formatFallbackPokemon(p){return{id:p.id,name:p.names[state.language]||p.names.en,types:[...p.types],image:artworkUrl(p.id)};}
  function artworkUrl(id){return`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;}


  function isIosDevice(){return /iphone|ipad|ipod/i.test(navigator.userAgent);}
  function isStandalone(){return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true;}
  function showInstallGuide(){
    const ios=isIosDevice();
    modalRoot.innerHTML=`<div class="modal-backdrop" role="dialog" aria-modal="true">
      <section class="modal-card install-guide">
        <div class="onboarding-visual">＋</div>
        <h2>${t("install.guideTitle")}</h2>
        <p>${ios?t("install.iosIntro"):t("install.browserIntro")}</p>
        <div class="install-steps">
          ${ios?`
            <div><span>1</span><p>${t("install.iosStep1")}</p></div>
            <div><span>2</span><p>${t("install.iosStep2")}</p></div>
            <div><span>3</span><p>${t("install.iosStep3")}</p></div>
          `:`
            <div><span>1</span><p>${t("install.browserStep1")}</p></div>
            <div><span>2</span><p>${t("install.browserStep2")}</p></div>
          `}
        </div>
        <div class="modal-actions"><button id="closeInstallGuide" class="primary-button">${t("common.close")}</button></div>
      </section>
    </div>`;
    document.getElementById("closeInstallGuide").addEventListener("click",()=>modalRoot.innerHTML="");
  }

  async function installApp(){if(isStandalone()){enqueueToast("✓",t("home.install"),t("install.alreadyInstalled"));return;}if(!deferredInstallPrompt){showInstallGuide();return;}deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;renderHome();}

  backButton.addEventListener("click",()=>{
    if(state.route==="learn-detail"){setRoute("learn");return;}
    if(state.route==="session"&&session?.answers.length){if(confirm(t("session.exitConfirm")))finishSession();return;}
    if(state.route==="summary"){session=null;setRoute("home");return;}
    setRoute("home");
  });
  brandButton.addEventListener("click",()=>{if(state.route==="session"&&session?.answers.length&&!confirm(t("session.exitConfirm")))return;session=null;setRoute("home");});
  levelButton.addEventListener("click",showLevelModal);
  navButtons.forEach(button=>button.addEventListener("click",()=>{if(state.route==="session"&&session?.answers.length&&!confirm(t("session.exitConfirm")))return;session=null;setRoute(button.dataset.route);}));
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{if(state.theme==="system")applyPreferences();});
  window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;if(state.route==="home")renderHome();});

  window.addEventListener("error", e => logError(e.error || e.message, "window.error"));
  window.addEventListener("unhandledrejection", e => logError(e.reason, "unhandledrejection"));

  if("serviceWorker"in navigator&&location.protocol.startsWith("http")){
    addEventListener("load",async()=>{try{const registration=await navigator.serviceWorker.register("./service-worker.js");registration.addEventListener("updatefound",()=>{const worker=registration.installing;worker?.addEventListener("statechange",()=>{if(worker.state==="installed"&&navigator.serviceWorker.controller)enqueueToast("↻",t("toast.updated"),t("toast.updatedDesc"));});});}catch(error){console.warn("Service worker registration failed",error);}});
  }

  saveState();
  render();
})();
