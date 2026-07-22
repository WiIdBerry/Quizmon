(() => {
  "use strict";

  const STORAGE_KEY = "quizmon.beta1";
  const BUILD_VERSION = "1.6-sprint2-v2-hotfix1";
  const OLD_KEYS = ["pokemonTypeLearner.v0.6.1", "pokemonTypeLearner.v0.5", "pokemonTypeLearner.v0.4", "pokemonTypeLearner.v0.3", "pokemonTypeLearner.v0.2", "pokemonTypeLearner.v0.1"];

  const view = document.getElementById("view");
  const modalRoot = document.getElementById("modalRoot");
  const toastRoot = document.getElementById("toastRoot");
  const backButton = document.getElementById("backButton");
  const homeButton = document.getElementById("homeButton");
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
    version: BUILD_VERSION,
    dataSchema: 6,
    diagnostics: { errors: [], repairs: [], lastBackup: null },
    route: "home",
    language: defaultLanguage,
    theme: "system",
    animations: true,
    haptics: true,
    onboardingComplete: false,
    profile: {
      name: "",
      joinedAt: new Date().toISOString(),
      avatarId: "pokeball",
      bannerId: "neon-grid",
      titleId: "trainer-neuling",
      favoritePokemonId: null,
      favoriteType: null,
      unlocked: { avatars: [...STARTER_COSMETICS.avatars], banners: [...STARTER_COSMETICS.banners], titles: [...STARTER_COSMETICS.titles], sets: [...STARTER_COSMETICS.sets] }
    },
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
  let profileCustomizerDraft = null;
  let profileFavoritesDraft = null;
  let favoritePokemonQuery = "";
  let profileCustomizerTab = "avatar";
  let profileCustomizerQuery = "";
  let profileCustomizerCategory = "all";
  let deferredInstallPrompt = null;
  let toastQueue = [];
  let toastBusy = false;
  let modalStack = [];
  let interactionSequence = 0;
  const reducedMotionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let motionFrame = 0;
  let lastActiveNavRoute = null;
  let routeMotionDirection = "replace";
  const HAPTIC_PATTERNS = Object.freeze({
    selection: 5, move: 8, success: [12,28,18], error: [26,32,26],
    level: [14,34,14,34,34], unlock: [10,24,10]
  });

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function deepMerge(base, saved) {
    const output = { ...clone(base), ...(saved || {}) };
    output.config = { ...clone(base.config), ...((saved || {}).config || {}) };
    ["effectiveness", "multiplier", "impact", "pokemon"].forEach(mode => {
      output.config[mode] = { ...clone(base.config[mode]), ...(output.config[mode] || {}) };
    });
    output.seenHints = { ...base.seenHints, ...((saved || {}).seenHints || {}) };
    output.profile = { ...clone(base.profile), ...((saved || {}).profile || {}) };
    output.profile.unlocked = {
      avatars: unique([...(base.profile.unlocked?.avatars || []), ...(((saved || {}).profile?.unlocked?.avatars) || [])]),
      banners: unique([...(base.profile.unlocked?.banners || []), ...(((saved || {}).profile?.unlocked?.banners) || [])]),
      titles: unique([...(base.profile.unlocked?.titles || []), ...(((saved || {}).profile?.unlocked?.titles) || [])]),
      sets: unique([...(base.profile.unlocked?.sets || []), ...(((saved || {}).profile?.unlocked?.sets) || [])])
    };
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
    output.pokemonCache = sanitizePokemonCache(output.pokemonCache);
    output.diagnostics = { errors: [], repairs: [], lastBackup: null, ...(output.diagnostics || {}) };
    output.diagnostics.errors = Array.isArray(output.diagnostics.errors) ? output.diagnostics.errors.slice(-50) : [];
    output.diagnostics.repairs = Array.isArray(output.diagnostics.repairs) ? output.diagnostics.repairs.slice(-50) : [];
    output.language = ["de", "en"].includes(output.language) ? output.language : defaultLanguage;
    return output;
  }

  function migrateLegacy(old) {
    const migrated = deepMerge(defaults, old || {});
    migrated.version = BUILD_VERSION;
    migrated.dataSchema = 5;
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
    const profileSource = candidate?.profile || {};
    repaired.profile.name = typeof profileSource.name === "string" ? profileSource.name.trim().slice(0, 24) : "";
    const joinedCandidate = new Date(profileSource.joinedAt || "");
    if (Number.isNaN(joinedCandidate.getTime())) {
      const historyDates = repaired.stats.history.map(item => new Date(item?.date || "")).filter(date => !Number.isNaN(date.getTime())).sort((a,b)=>a-b);
      repaired.profile.joinedAt = (historyDates[0] || new Date()).toISOString();
      if (candidate && Object.keys(candidate).length) fixes.push("profile.joinedAt");
    } else repaired.profile.joinedAt = joinedCandidate.toISOString();
    const mapLegacyChoice = (value, kind) => LEGACY_COSMETIC_MAPS[kind]?.[value] || value;
    const validProfileChoice = (value, collection, fallback) => collection.some(item => item.id === value) ? value : fallback;
    const mappedAvatar = mapLegacyChoice(profileSource.avatarId, "avatars");
    const mappedBanner = mapLegacyChoice(profileSource.bannerId, "banners");
    const mappedTitle = mapLegacyChoice(profileSource.titleId, "titles");
    repaired.profile.avatarId = validProfileChoice(mappedAvatar, PROFILE_AVATARS, "pokeball");
    repaired.profile.bannerId = validProfileChoice(mappedBanner, PROFILE_BANNERS, "neon-grid");
    repaired.profile.titleId = validProfileChoice(mappedTitle, PROFILE_TITLES, "trainer-neuling");
    const favoritePokemonId = Number(profileSource.favoritePokemonId);
    repaired.profile.favoritePokemonId = FAVORITE_POKEMON_CATALOG.some(item => item.id === favoritePokemonId) ? favoritePokemonId : null;
    repaired.profile.favoriteType = TYPES.includes(profileSource.favoriteType) ? profileSource.favoriteType : null;
    if (profileSource.favoritePokemonId != null && repaired.profile.favoritePokemonId == null) fixes.push("profile.favoritePokemonId");
    if (profileSource.favoriteType != null && repaired.profile.favoriteType == null) fixes.push("profile.favoriteType");

    const oldLevel = getLevelInfo(repaired.stats.xp).current.level;
    const oldMastered = TYPES.filter(type => repaired.stats.types[type].total >= 5 && percent(repaired.stats.types[type].correct, repaired.stats.types[type].total) >= 80).length;
    const oldExplored = TYPES.filter(type => repaired.stats.types[type].total > 0).length;
    const oldAccuracy = percent(repaired.stats.correct, repaired.stats.total);
    const legacyUnlocks = {
      avatars: ["compass","flame","wave","leaf", ...(oldLevel >= 3 ? ["bolt"] : []), ...(repaired.stats.bestStreak >= 10 ? ["moon"] : []), ...(oldMastered >= 5 ? ["crystal"] : []), ...(oldLevel >= 7 ? ["crown"] : [])],
      banners: ["horizon","aurora","ember","ocean", ...(oldLevel >= 4 ? ["midnight"] : []), ...(oldMastered >= 8 ? ["summit"] : [])],
      titles: ["trainer", ...(oldExplored >= 3 ? ["explorer"] : []), ...(repaired.stats.total >= 20 && oldAccuracy >= 70 ? ["tactician"] : []), ...(repaired.stats.bestStreak >= 10 ? ["streak"] : []), ...(repaired.stats.achievements.perfect_session ? ["perfect"] : []), ...(repaired.stats.achievements.daily_first ? ["daily"] : []), ...(repaired.stats.achievements.weakness_session ? ["weakness"] : []), ...(oldLevel >= 7 ? ["champion"] : [])]
    };
    const explicitUnlocked = profileSource.unlocked || {};
    repaired.profile.unlocked = {
      avatars: unique([...STARTER_COSMETICS.avatars, ...(explicitUnlocked.avatars || []).map(id => mapLegacyChoice(id,"avatars")), repaired.profile.avatarId]).filter(id => PROFILE_AVATARS.some(item => item.id === id)),
      banners: unique([...STARTER_COSMETICS.banners, ...(explicitUnlocked.banners || []).map(id => mapLegacyChoice(id,"banners")), repaired.profile.bannerId]).filter(id => PROFILE_BANNERS.some(item => item.id === id)),
      titles: unique([...STARTER_COSMETICS.titles, ...(explicitUnlocked.titles || []).map(id => mapLegacyChoice(id,"titles")), repaired.profile.titleId]).filter(id => PROFILE_TITLES.some(item => item.id === id)),
      sets: unique([...STARTER_COSMETICS.sets, ...(explicitUnlocked.sets || [])]).filter(id => PROFILE_SETS.some(item => item.id === id))
    };
    ["avatarId", "bannerId", "titleId"].forEach(field => {
      if (profileSource[field] && repaired.profile[field] !== profileSource[field]) fixes.push(`profile.${field}`);
    });
    if (!validRoute(repaired.route)) { repaired.route = "home"; fixes.push("route"); }
    repaired.theme = ["system","light","dark"].includes(repaired.theme) ? repaired.theme : "system";
    repaired.animations = repaired.animations !== false;
    repaired.haptics = repaired.haptics !== false;
    repaired.onboardingComplete = Boolean(repaired.onboardingComplete);
    repaired.statsTab = ["overview","types","errors","achievements"].includes(repaired.statsTab) ? repaired.statsTab : "overview";
    repaired.learnTab = ["lexicon","lab"].includes(repaired.learnTab) ? repaired.learnTab : "lexicon";
    Object.keys(repaired.stats.modes).forEach(mode => {
      const value = repaired.stats.modes[mode] || {};
      value.total = finiteNonNegative(value.total);
      value.correct = Math.min(value.total, finiteNonNegative(value.correct));
      value.sessions = finiteNonNegative(value.sessions);
      repaired.stats.modes[mode] = value;
    });
    TYPES.forEach(type => {
      const value = repaired.stats.types[type];
      value.total = finiteNonNegative(value.total);
      value.correct = Math.min(value.total, finiteNonNegative(value.correct));
      value.recent = value.recent.slice(-20).map(Boolean);
      if (value.lastSeen && Number.isNaN(new Date(value.lastSeen).getTime())) value.lastSeen = null;
    });
    const allowedLengths = [10,20,"infinite"];
    const allowedDifficulties = ["easy","medium","hard"];
    Object.entries(repaired.config).forEach(([mode, config]) => {
      config.length = allowedLengths.includes(config.length) ? config.length : 10;
      config.difficulty = allowedDifficulties.includes(config.difficulty) ? config.difficulty : "medium";
      if (mode === "effectiveness") config.kind = ["mixed","effective","resisted"].includes(config.kind) ? config.kind : "mixed";
      if (["multiplier","impact"].includes(mode)) config.defense = ["mixed","single","dual"].includes(config.defense) ? config.defense : "mixed";
      if (mode === "pokemon") {
        config.generation = config.generation === "all" || Object.hasOwn(GENERATION_RANGES, String(config.generation)) ? String(config.generation) : "all";
        config.display = ["both","image","name"].includes(config.display) ? config.display : "both";
      }
    });
    const playableModes = ["effectiveness","multiplier","impact","pokemon"];
    if (!playableModes.includes(repaired.lastMode)) { repaired.lastMode = null; repaired.lastConfig = null; }
    else repaired.lastConfig = { ...clone(repaired.config[repaired.lastMode]), ...(repaired.lastConfig && typeof repaired.lastConfig === "object" ? repaired.lastConfig : {}) };
    const historyModes = new Set([...playableModes,"weak","daily","review"]);
    repaired.stats.history = repaired.stats.history.filter(item => item && typeof item === "object" && historyModes.has(item.mode)).map(item => ({
      ...item,
      correct: finiteNonNegative(item.correct),
      total: finiteNonNegative(item.total),
      rate: Math.min(100, finiteNonNegative(item.rate)),
      duration: finiteNonNegative(item.duration)
    })).slice(-100);
    repaired.stats.mistakes = repaired.stats.mistakes.filter(item => item && typeof item === "object" && item.spec && ["effectiveness","multiplier","impact","pokemon"].includes(item.spec.kind)).slice(-300);
    repaired.daily.streak = finiteNonNegative(repaired.daily.streak);
    repaired.daily.completed = Boolean(repaired.daily.completed);
    repaired.pokemonCache = sanitizePokemonCache(repaired.pokemonCache);
    repaired.diagnostics.repairs.push(...fixes.map(field => ({ time: new Date().toISOString(), field })));
    repaired.diagnostics.repairs = repaired.diagnostics.repairs.slice(-50);
    repaired.version = BUILD_VERSION; repaired.dataSchema = 6;
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
    state.version = BUILD_VERSION;
    state.dataSchema = 6;
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
  function finiteNonNegative(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  }
  function validRoute(route) {
    return ["home","train","learn","learn-detail","stats","settings","profile","session","summary"].includes(route)
      || /^setup-(effectiveness|multiplier|impact|pokemon)$/.test(route || "");
  }
  function sanitizePokemonCache(cache) {
    if (!cache || typeof cache !== "object" || Array.isArray(cache)) return {};
    const entries = Object.entries(cache).slice(-160).filter(([, item]) => {
      if (!item || typeof item !== "object") return false;
      const id = Number(item.id);
      return Number.isInteger(id) && id > 0 && typeof item.name === "string"
        && Array.isArray(item.types) && item.types.length > 0 && item.types.every(type => TYPES.includes(type))
        && typeof item.image === "string";
    });
    return Object.fromEntries(entries);
  }
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
  function formatLongDate(iso) {
    if (!iso) return "–";
    return new Intl.DateTimeFormat(state.language === "de" ? "de-DE" : "en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso));
  }
  function trainerName() { return state.profile?.name || t("profile.defaultName"); }
  function profileChoice(collection, id, fallbackId) { return collection.find(item => item.id === id) || collection.find(item => item.id === fallbackId) || collection[0]; }
  function cosmeticName(item) { return item?.nameKey ? t(item.nameKey) : (item?.name || ""); }
  function cosmeticDescription(item) { return item?.description?.[state.language] || item?.description?.de || ""; }
  function cosmeticCategoryLabel(kind, category) { return t(`profile.category.${kind}.${category}`); }
  function selectedAvatar() { return profileChoice(PROFILE_AVATARS, state.profile?.avatarId, "pokeball"); }
  function selectedBanner() { return profileChoice(PROFILE_BANNERS, state.profile?.bannerId, "neon-grid"); }
  function selectedTitle() { return profileChoice(PROFILE_TITLES, state.profile?.titleId, "trainer-neuling"); }
  function favoritePokemonEntry(id = state.profile?.favoritePokemonId) {
    const numericId = Number(id);
    return FAVORITE_POKEMON_CATALOG.find(item => item.id === numericId) || null;
  }
  function favoritePokemonName(item) { return item ? (item.names?.[state.language] || item.names?.en || `#${item.id}`) : ""; }
  function favoritePokemonAsset(item) { return item ? artworkUrl(item.id) : ""; }
  function favoritePokemonVisual(item, extraClass = "") {
    if (!item) return `<span class="favorite-pokemon-visual empty ${extraClass}" aria-hidden="true"><span>?</span></span>`;
    const name = favoritePokemonName(item);
    const asset = favoritePokemonAsset(item);
    return `<span class="favorite-pokemon-visual ${extraClass}" role="img" aria-label="${escapeHtml(name)}" style="--favorite-image:url(${escapeHtml(asset)})"><span aria-hidden="true">◉</span></span>`;
  }
  function profileAvatarMarkup(id = selectedAvatar().id, extraClass = "") {
    const avatar = profileChoice(PROFILE_AVATARS, id, "pokeball");
    const palette = avatar.palette || ["#315f72", "#4f8794"];
    const asset = avatar.asset || `assets/cosmetics/avatars/${avatar.id}.svg`;
    return `<span class="trainer-avatar trainer-avatar-${avatar.id} avatar-kind-${avatar.category} ${extraClass}" style="--avatar-a:${palette[0]};--avatar-b:${palette[1]}" aria-hidden="true"><img src="${escapeHtml(asset)}" alt="" loading="lazy" decoding="async"></span>`;
  }
  function profileUnlockBucket(item) {
    if (item?.kind === "avatar") return "avatars";
    if (item?.kind === "banner") return "banners";
    if (item?.kind === "set") return "sets";
    return "titles";
  }
  function profileUnlockStatus(item) {
    const unlock = item?.unlock || { kind: "planned" };
    const bucket = profileUnlockBucket(item);
    const stored = state.profile?.unlocked?.[bucket] || [];
    if (stored.includes(item.id) || unlock.kind === "always") return { unlocked: true, label: t("profile.available") };
    const level = getLevelInfo().current.level;
    const mastered = masteredTypeCount();
    const explored = exploredTypeCount();
    if (unlock.kind === "planned") return { unlocked: false, label: t("profile.requirement.planned") };
    if (unlock.kind === "level") return { unlocked: level >= unlock.value, label: t("profile.requirement.level", { level: unlock.value }) };
    if (unlock.kind === "streak") return { unlocked: state.stats.bestStreak >= unlock.value, label: t("profile.requirement.streak", { count: unlock.value }) };
    if (unlock.kind === "mastered") return { unlocked: mastered >= unlock.value, label: t("profile.requirement.mastered", { count: unlock.value }) };
    if (unlock.kind === "explored") return { unlocked: explored >= unlock.value, label: t("profile.requirement.explored", { count: unlock.value }) };
    if (unlock.kind === "accuracy") {
      const rate = percent(state.stats.correct, state.stats.total);
      return { unlocked: state.stats.total >= unlock.total && rate >= unlock.rate, label: t("profile.requirement.accuracy", { count: unlock.total, rate: unlock.rate }) };
    }
    if (unlock.kind === "achievement") {
      const achievement = ACHIEVEMENTS.find(entry => entry.id === unlock.achievementId);
      return { unlocked: Boolean(state.stats.achievements[unlock.achievementId]), label: t("profile.requirement.achievement", { achievement: achievement ? t(achievement.titleKey) : "" }) };
    }
    return { unlocked: false, label: t("profile.locked") };
  }
  function unlockedProfileCount(collection) { return collection.filter(item => profileUnlockStatus(item).unlocked).length; }
  function exploredTypeCount() { return TYPES.filter(type => state.stats.types[type].total > 0).length; }
  function masteredTypeCount() { return TYPES.filter(type => state.stats.types[type].total >= 5 && percent(state.stats.types[type].correct, state.stats.types[type].total) >= 80).length; }
  function strongestType() {
    return TYPES.map(type => ({ type, ...state.stats.types[type], rate: percent(state.stats.types[type].correct, state.stats.types[type].total) }))
      .filter(item => item.total >= 3)
      .sort((a,b) => b.rate - a.rate || b.total - a.total)[0] || null;
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
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", actualTheme() === "dark" ? "#10171b" : "#f4f6f8");
    document.querySelectorAll("[data-nav-label]").forEach(item => item.textContent = t(`nav.${item.dataset.navLabel}`));
    backButton.setAttribute("aria-label", t("common.back"));
    backButton.setAttribute("title", t("common.back"));
    homeButton.setAttribute("aria-label", t("nav.home"));
    homeButton.setAttribute("title", t("nav.home"));
    levelButton.setAttribute("aria-label", t("profile.openLabel"));
    levelButton.setAttribute("title", t("profile.openLabel"));
  }
  function motionEnabled() {
    return Boolean(state.animations) && !reducedMotionQuery.matches;
  }

  function initializeMotionSystem() {
    const observer = new MutationObserver(mutations => {
      const viewChanged = mutations.some(mutation => mutation.target === view && mutation.addedNodes.length);
      if (viewChanged) scheduleViewMotion();
    });
    observer.observe(view, { childList: true });
  }

  function scheduleViewMotion() {
    if (motionFrame) cancelAnimationFrame(motionFrame);
    motionFrame = requestAnimationFrame(() => {
      motionFrame = 0;
      runViewMotion();
    });
  }

  function runViewMotion() {
    view.classList.remove("route-enter", "route-enter-forward", "route-enter-back", "route-enter-replace");
    if (!motionEnabled()) return;

    view.classList.add("route-enter", `route-enter-${routeMotionDirection}`);
    setTimeout(() => view.classList.remove("route-enter", "route-enter-forward", "route-enter-back", "route-enter-replace"), 520);

    Array.from(view.children).slice(0, 16).forEach((element, index) => {
      element.classList.add("motion-page-item");
      element.style.setProperty("--motion-delay", `${Math.min(index * 34, 238)}ms`);
    });

    const selector = [
      ".action-card", ".mode-card", ".learn-card", ".stat-card", ".setting-row",
      ".history-item", ".type-stat-row", ".error-card", ".achievement-card",
      ".recommendation-card", ".answer-button", ".type-option", ".multiplier-option",
      ".bucket", ".summary-item", ".feature-item", ".choice-tile",
      ".type-library-card", ".matchup-group", ".lab-selection-card",
      ".profile-kpi-card", ".profile-panel", ".profile-activity-card", ".profile-choice-card",
      ".setup-setting-card", ".summary-metric-grid article", ".summary-focus-card", ".summary-actions-card",
      ".favorite-pokemon-option", ".favorite-type-option", ".profile-set-card"
    ].join(",");
    Array.from(view.querySelectorAll(selector)).slice(0, 32).forEach((element, index) => {
      element.classList.add("motion-stagger-item");
      element.style.setProperty("--motion-delay", `${Math.min(70 + index * 24, 310)}ms`);
    });

    view.querySelectorAll(".progress-fill, .hero-progress span, .session-progress span, .summary-xp-track i, .profile-progress-track i, .game-level-track i").forEach(element => {
      element.classList.add(element.closest(".session-progress") ? "motion-progress-step" : "motion-progress-reveal");
    });
    view.querySelector(".pokemon-art")?.classList.add("motion-artwork");
    view.querySelector(".summary-score")?.classList.add("motion-summary-score");
    animateSummaryCounter();
  }

  function animateSummaryCounter() {
    const counter = view.querySelector(".summary-score span");
    if (!counter || !motionEnabled()) return;
    const match = counter.textContent.trim().match(/^(\d+)(.*)$/);
    if (!match) return;
    const target = Number(match[1]);
    const suffix = match[2];
    const duration = 620;
    const started = performance.now();
    counter.textContent = `0${suffix}`;
    const tick = now => {
      if (!counter.isConnected) return;
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function focusableElements(container) {
    if (!container) return [];
    return [...container.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.hidden && element.getAttribute("aria-hidden") !== "true" && element.getClientRects().length);
  }

  function topModalContext() { return modalStack[modalStack.length - 1] || null; }

  function registerModal(backdrop, options = {}) {
    if (!backdrop) return null;
    const context = {
      backdrop,
      returnFocus: options.returnFocus || document.activeElement,
      closeOnBackdrop: options.closeOnBackdrop !== false,
      closeOnEscape: options.closeOnEscape !== false,
      onRequestClose: options.onRequestClose || (() => closeModal()),
      initialFocus: options.initialFocus || null
    };
    modalStack.push(context);
    document.body.classList.add("modal-open");
    backdrop.addEventListener("pointerdown", event => {
      if (event.target === backdrop && context.closeOnBackdrop && topModalContext() === context) context.onRequestClose("backdrop");
    });
    requestAnimationFrame(() => {
      const target = typeof context.initialFocus === "string"
        ? backdrop.querySelector(context.initialFocus)
        : context.initialFocus instanceof HTMLElement
          ? context.initialFocus
          : focusableElements(backdrop)[0] || backdrop.querySelector(".modal-card");
      target?.focus?.({ preventScroll: true });
    });
    return context;
  }

  function setModalMarkup(markup, options = {}) {
    modalStack = [];
    modalRoot.innerHTML = markup;
    return registerModal(modalRoot.querySelector(".modal-backdrop"), options);
  }

  function closeModal(afterClose, backdrop = topModalContext()?.backdrop || modalRoot.querySelector(".modal-backdrop:last-child")) {
    const contextIndex = modalStack.findIndex(entry => entry.backdrop === backdrop);
    const context = contextIndex >= 0 ? modalStack[contextIndex] : null;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      backdrop?.remove();
      if (contextIndex >= 0) modalStack.splice(contextIndex, 1);
      if (!modalStack.length) document.body.classList.remove("modal-open");
      const returnFocus = context?.returnFocus;
      if (returnFocus?.isConnected) requestAnimationFrame(() => returnFocus.focus?.({ preventScroll: true }));
      afterClose?.();
    };
    if (!backdrop || !motionEnabled()) { finish(); return; }
    backdrop.classList.add("is-closing");
    backdrop.addEventListener("animationend", event => {
      if (event.target === backdrop) finish();
    });
    setTimeout(finish, 280);
  }

  function setButtonBusy(button, busy, busyLabel = t("common.working")) {
    if (!button) return;
    if (busy) {
      if (!button.dataset.originalLabel) button.dataset.originalLabel = button.innerHTML;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.classList.add("is-busy");
      button.innerHTML = `<span class="button-spinner" aria-hidden="true"></span><span>${escapeHtml(busyLabel)}</span>`;
    } else {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.classList.remove("is-busy");
      if (button.dataset.originalLabel) {
        button.innerHTML = button.dataset.originalLabel;
        delete button.dataset.originalLabel;
      }
    }
  }

  function showConfirmDialog({ title, message, confirmLabel, cancelLabel = t("common.cancel"), kind = "warning", icon = "!", onConfirm }) {
    const returnFocus = document.activeElement;
    const shell = document.createElement("div");
    shell.innerHTML = `<div class="modal-backdrop nested-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirmDialogTitle">
      <section class="modal-card confirmation-dialog confirmation-${escapeHtml(kind)}" tabindex="-1">
        <div class="dialog-status-icon" aria-hidden="true">${escapeHtml(icon)}</div>
        <h2 id="confirmDialogTitle">${escapeHtml(title)}</h2>
        <p>${escapeHtml(message)}</p>
        <div class="modal-actions confirmation-actions"><button type="button" class="secondary-button" data-dialog-cancel>${escapeHtml(cancelLabel)}</button><button type="button" class="${kind === "danger" ? "danger-button" : "primary-button"}" data-dialog-confirm>${escapeHtml(confirmLabel)}</button></div>
      </section>
    </div>`;
    const backdrop = shell.firstElementChild;
    modalRoot.appendChild(backdrop);
    const cancelButton = backdrop.querySelector("[data-dialog-cancel]");
    const confirmButton = backdrop.querySelector("[data-dialog-confirm]");
    const close = () => closeModal(null, backdrop);
    registerModal(backdrop, { returnFocus, closeOnBackdrop: false, onRequestClose: close, initialFocus: cancelButton });
    cancelButton.addEventListener("click", close);
    confirmButton.addEventListener("click", () => {
      if (confirmButton.disabled) return;
      setButtonBusy(confirmButton, true);
      closeModal(() => onConfirm?.(), backdrop);
    });
    return backdrop;
  }

  function showMessageDialog({ title, message, buttonLabel = t("common.close"), kind = "info", icon = "i" }) {
    const returnFocus = document.activeElement;
    const shell = document.createElement("div");
    shell.innerHTML = `<div class="modal-backdrop nested-modal-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="messageDialogTitle">
      <section class="modal-card confirmation-dialog confirmation-${escapeHtml(kind)}" tabindex="-1">
        <div class="dialog-status-icon" aria-hidden="true">${escapeHtml(icon)}</div>
        <h2 id="messageDialogTitle">${escapeHtml(title)}</h2>
        <p>${escapeHtml(message)}</p>
        <div class="modal-actions single-action"><button type="button" class="primary-button" data-message-close>${escapeHtml(buttonLabel)}</button></div>
      </section>
    </div>`;
    const backdrop = shell.firstElementChild;
    modalRoot.appendChild(backdrop);
    const button = backdrop.querySelector("[data-message-close]");
    const close = () => closeModal(null, backdrop);
    registerModal(backdrop, { returnFocus, closeOnBackdrop: false, onRequestClose: close, initialFocus: button });
    button.addEventListener("click", close);
  }

  function confirmDiscardChanges(isDirty, parentBackdrop, onDiscard) {
    if (!isDirty) { closeModal(onDiscard, parentBackdrop); return; }
    showConfirmDialog({
      title: t("dialog.unsavedTitle"),
      message: t("dialog.unsavedText"),
      confirmLabel: t("common.discard"),
      cancelLabel: t("common.keepEditing"),
      kind: "danger",
      icon: "!",
      onConfirm: () => closeModal(onDiscard, parentBackdrop)
    });
  }

  function lockInteraction(button, callback, delay = 420) {
    if (!button || button.dataset.interactionLock === "true") return;
    button.dataset.interactionLock = "true";
    const token = ++interactionSequence;
    try { callback?.(); } finally {
      setTimeout(() => {
        if (button.isConnected && token <= interactionSequence) delete button.dataset.interactionLock;
      }, delay);
    }
  }

  function vibrate(pattern = 8) {
    if (state.haptics && navigator.vibrate) navigator.vibrate(pattern);
  }
  function haptic(kind = "selection") { vibrate(HAPTIC_PATTERNS[kind] || HAPTIC_PATTERNS.selection); }

  function routeRank(route) {
    if (route === "home") return 0;
    if (route === "train") return 10;
    if (route.startsWith("setup-")) return 11;
    if (route === "session") return 12;
    if (route === "summary") return 13;
    if (route === "learn") return 20;
    if (route === "learn-detail") return 21;
    if (route === "stats") return 30;
    if (route === "profile") return 31;
    if (route === "settings") return 40;
    return 0;
  }
  function prepareRouteMotion(fromRoute, toRoute, explicitDirection) {
    if (explicitDirection) routeMotionDirection = explicitDirection;
    else if (routeRank(toRoute) > routeRank(fromRoute)) routeMotionDirection = "forward";
    else if (routeRank(toRoute) < routeRank(fromRoute)) routeMotionDirection = "back";
    else routeMotionDirection = "replace";
    view.dataset.motionDirection = routeMotionDirection;
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

  function levelUnlocksAt(level) {
    return [...PROFILE_AVATARS, ...PROFILE_BANNERS, ...PROFILE_TITLES, ...PROFILE_SETS]
      .filter(item => item?.unlock?.kind === "level" && Number(item.unlock.value) === Number(level));
  }

  function addXp(amount) {
    if (!amount) return;
    const before = getLevelInfo();
    state.stats.xp += amount;
    const after = getLevelInfo();
    if (session) session.xpEarned = (session.xpEarned || 0) + amount;
    if (after.current.level > before.current.level) {
      const gainedLevels = [];
      const unlocks = [];
      for (let level = before.current.level + 1; level <= after.current.level; level += 1) {
        gainedLevels.push(level);
        unlocks.push(...levelUnlocksAt(level));
      }
      if (session) {
        session.levelUps = unique([...(session.levelUps || []), ...gainedLevels]);
        session.newUnlocks = unique([...(session.newUnlocks || []), ...unlocks.map(item => item.id)]);
      } else {
        haptic("level");
        enqueueToast("⬆", t("toast.level", { level: after.current.level }), unlocks.length ? t("toast.unlocks", { count: unlocks.length }) : t(after.current.key), "level");
      }
    }
  }

  function modeName(mode) { return t(`mode.${mode}`); }

  function setRoute(route, options = {}) {
    const fromRoute = state.route;
    const changed = fromRoute !== route;
    prepareRouteMotion(fromRoute, route, options.direction);
    state.route = route;
    saveState();
    render();

    if (!changed) {
      window.scrollTo({ top: 0, behavior: motionEnabled() ? "smooth" : "auto" });
      return;
    }

    if (!options.preserveScroll) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    requestAnimationFrame(() => view.focus({ preventScroll: true }));
  }

  function isInnerRoute(route) { return route.startsWith("setup-") || ["session", "summary", "learn-detail", "profile"].includes(route); }

  function updateHeader() {
    const level = getLevelInfo();
    levelNumber.textContent = `Lv. ${level.current.level}`;
    headerStreak.textContent = `🔥 ${state.stats.streak}`;
  }

  function updateNavigation() {
    const inner = isInnerRoute(state.route);
    let active = state.route;
    if (state.route.startsWith("setup-") || ["session", "summary"].includes(state.route)) active = "train";
    if (state.route === "learn-detail") active = "learn";
    if (state.route === "profile") active = "home";

    navButtons.forEach(button => {
      const isActive = button.dataset.route === active;
      button.classList.toggle("active", isActive);
      if (isActive && lastActiveNavRoute !== active && motionEnabled()) {
        button.classList.remove("nav-just-activated");
        void button.offsetWidth;
        button.classList.add("nav-just-activated");
        setTimeout(() => button.classList.remove("nav-just-activated"), 420);
      }
      if (isActive) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
      button.setAttribute("title", t(`nav.${button.dataset.route}`));
      button.setAttribute("aria-label", t(`nav.${button.dataset.route}`));
    });

    lastActiveNavRoute = active;
    const showHomeButton = state.route !== "home";
    backButton.classList.toggle("hidden", !inner);
    homeButton.classList.toggle("hidden", !showHomeButton);
    document.querySelector(".bottom-nav").classList.toggle("hidden-nav", ["session", "summary"].includes(state.route));
  }

  function updateDocumentTitle() {
    let label = t("nav.home");
    if (state.route === "train" || state.route.startsWith("setup-") || ["session", "summary"].includes(state.route)) label = t("nav.train");
    else if (["learn", "learn-detail"].includes(state.route)) label = t("nav.learn");
    else if (state.route === "stats") label = t("nav.stats");
    else if (state.route === "settings") label = t("nav.settings");
    else if (state.route === "profile") label = t("profile.title");
    document.title = state.route === "home" ? "Quizmon" : `Quizmon – ${label}`;
  }

  function renderRecoveryState(error) {
    logError(error, "render");
    const title = t("error.recoveryTitle");
    const text = t("error.recoveryText");
    view.innerHTML = `<section class="panel app-recovery-state" role="alert"><span aria-hidden="true">!</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p><div><button id="recoverHome" class="primary-button">${escapeHtml(t("error.backHome"))}</button><button id="recoverReload" class="secondary-button">${escapeHtml(t("error.reload"))}</button></div></section>`;
    document.getElementById("recoverHome")?.addEventListener("click", () => {
      session = null; state.route = "home"; saveState(); render();
    });
    document.getElementById("recoverReload")?.addEventListener("click", () => location.reload());
  }

  function render() {
    try {
      normalizeDailyState();
      applyPreferences();
      updateHeader();
      updateNavigation();
      updateDocumentTitle();

      if (state.route === "home") renderHome();
      else if (state.route === "train") renderTrain();
      else if (state.route === "learn") renderLearn();
      else if (state.route === "learn-detail") renderLearnDetail();
      else if (state.route === "stats") renderStats();
      else if (state.route === "settings") renderSettings();
      else if (state.route === "profile") renderProfile();
      else if (state.route.startsWith("setup-")) renderSetup(state.route.replace("setup-", ""));
      else if (state.route === "session") renderQuestion();
      else if (state.route === "summary") renderSummary();
      else { state.route = "home"; renderHome(); }

      if (!state.onboardingComplete && !onboardingOpen) openOnboarding(0);
    } catch (error) {
      renderRecoveryState(error);
    }
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
    const weak = getWeakTypes(1);
    const last = state.stats.history[0];
    const accuracy = percent(state.stats.correct, state.stats.total);
    const focus = weak[0];
    const homeBanner = selectedBanner();

    view.innerHTML = `
      <section class="game-home" aria-labelledby="gameHomeTitle">
        <section class="game-home-stage">
          <div class="home-banner-layer profile-banner profile-banner-${homeBanner.id}" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="game-home-decoration" aria-hidden="true"><span></span><span></span><span></span></div>

          <div class="game-home-header">
            <div class="game-home-intro">
              <p class="game-home-eyebrow">${t("home.gameEyebrow")}</p>
              <h1 id="gameHomeTitle">${t("home.gameTitle")}</h1>
              <p>${t("home.gameSubtitle")}</p>
            </div>

            <button class="game-trainer-card" id="openTrainerProfile" type="button" aria-label="${escapeHtml(t("profile.openLabel"))}">
              <div class="game-profile-avatar-wrap">${profileAvatarMarkup(selectedAvatar().id, "game-profile-avatar")}<span>Lv. ${level.current.level}</span></div>
              <div class="game-trainer-copy">
                <small>${t("profile.homeLabel")}</small>
                <strong>${escapeHtml(trainerName())}</strong>
                <span>${escapeHtml(cosmeticName(selectedTitle()))} · ${state.stats.xp} XP</span>
                <div class="game-level-track" aria-label="${level.progress}%"><i style="width:${level.progress}%"></i></div>
              </div>
              <div class="game-streak-pill" title="${t("home.gameStreak")}">🔥 ${state.stats.streak}</div>
              <span class="game-trainer-arrow" aria-hidden="true">›</span>
            </button>
          </div>

          <div class="game-home-layout">
            <section class="game-menu-panel" aria-labelledby="gameMenuTitle">
              <div class="game-panel-heading">
                <span>${t("home.gameMenuTitle")}</span>
                <small>${t("home.gameMenuHint")}</small>
              </div>
              <div class="game-menu-list">
                ${gameMenuButton("train", iconSvg("train"), "01", t("home.gameTrain"), t("home.gameTrainDesc"), true)}
                ${gameMenuButton("learn", iconSvg("learn"), "02", t("home.gameLearn"), t("home.gameLearnDesc"))}
                ${gameMenuButton("stats", iconSvg("stats"), "03", t("home.gameProgress"), t("home.gameProgressDesc"))}
                ${gameMenuButton("settings", iconSvg("settings"), "04", t("home.gameSettings"), t("home.gameSettingsDesc"))}
              </div>
            </section>

            <aside class="game-command-panel" aria-labelledby="gameTodayTitle">
              <div class="game-panel-heading">
                <span id="gameTodayTitle">${t("home.gameToday")}</span>
                <small>${t("home.gameTodayHint")}</small>
              </div>

              <div class="game-quick-list">
                <button class="game-quick-action recommended" id="dailyTraining">
                  <span class="game-quick-icon">${iconSvg("daily")}</span>
                  <span><strong>${state.daily.completed ? t("home.dailyDone") : t("home.daily")}</strong><small>${t("home.dailyDesc")}</small></span>
                  <span class="game-quick-state">${state.daily.completed ? "✓" : "›"}</span>
                </button>
                <button class="game-quick-action" id="weakTraining">
                  <span class="game-quick-icon">${iconSvg("weak")}</span>
                  <span><strong>${t("home.weak")}</strong><small>${t("home.weakDesc")}</small></span>
                  <span class="game-quick-state">›</span>
                </button>
                ${state.lastMode && state.lastConfig
                  ? `<button class="game-quick-action" id="repeatLastTraining"><span class="game-quick-icon">${iconSvg("repeat")}</span><span><strong>${t("home.continue")}</strong><small>${t("home.continueDesc",{mode:modeName(state.lastMode)})}</small></span><span class="game-quick-state">›</span></button>`
                  : `<button class="game-quick-action" id="openTrainingHub"><span class="game-quick-icon">${iconSvg("train")}</span><span><strong>${t("home.gameTrain")}</strong><small>${t("home.gameTrainDesc")}</small></span><span class="game-quick-state">›</span></button>`}
              </div>

              <div class="game-status-grid">
                <div><small>${t("home.gameAccuracy")}</small><strong>${accuracy}%</strong></div>
                <div><small>${t("home.gameSessions")}</small><strong>${state.stats.sessions}</strong></div>
                <div><small>${t("home.gameStreak")}</small><strong>${state.stats.streak}</strong></div>
              </div>

              <div class="game-focus-grid">
                <div class="game-focus-card">
                  <small>${t("home.gameWeakSpot")}</small>
                  ${focus ? `<strong>${typeChip(focus.type,"small")}<span>${focus.rate}%</span></strong>` : `<strong class="game-empty-focus">${t("home.gameNoFocus")}</strong>`}
                </div>
                <div class="game-focus-card">
                  <small>${t("home.gameLastSession")}</small>
                  ${last ? `<strong><span>${escapeHtml(modeName(last.mode))}</span><span>${last.rate}%</span></strong>` : `<strong class="game-empty-focus">${t("home.noSession")}</strong>`}
                </div>
              </div>
            </aside>
          </div>
        </section>

        ${deferredInstallPrompt ? `<button class="game-install-card" id="installApp"><span>＋</span><strong>${t("home.install")}</strong><small>${t("home.installDesc")}</small><i>›</i></button>` : ""}
      </section>
    `;

    document.querySelectorAll("[data-destination]").forEach(button => button.addEventListener("click", () => setRoute(button.dataset.destination)));
    document.getElementById("openTrainerProfile").addEventListener("click", () => setRoute("profile"));
    document.getElementById("dailyTraining").addEventListener("click", startDailySession);
    document.getElementById("weakTraining").addEventListener("click", startWeakSession);
    document.getElementById("openTrainingHub")?.addEventListener("click", () => setRoute("train"));
    document.getElementById("repeatLastTraining")?.addEventListener("click", () => {
      if (!state.lastMode || !state.lastConfig) return;
      state.config[state.lastMode] = { ...state.config[state.lastMode], ...clone(state.lastConfig) };
      startSession(state.lastMode);
    });
    document.getElementById("installApp")?.addEventListener("click", installApp);
  }

  function renderProfile() {
    session = null;
    const level = getLevelInfo();
    const accuracy = percent(state.stats.correct, state.stats.total);
    const explored = exploredTypeCount();
    const mastered = masteredTypeCount();
    const bestType = strongestType();
    const last = state.stats.history[0];
    const remainingXp = level.next ? Math.max(0, level.next.xp - state.stats.xp) : 0;
    const avatar = selectedAvatar();
    const banner = selectedBanner();
    const title = selectedTitle();
    const favoritePokemon = favoritePokemonEntry();
    const favoriteType = TYPES.includes(state.profile.favoriteType) ? state.profile.favoriteType : null;

    view.innerHTML = `
      <section class="trainer-profile-page" aria-labelledby="trainerProfileTitle">
        <section class="trainer-profile-hero profile-banner profile-banner-${banner.id}">
          <div class="profile-banner-pattern" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="profile-hero-main">
            <div class="profile-avatar-stage">
              ${profileAvatarMarkup(avatar.id, "profile-main-avatar")}
              <span class="profile-avatar-level">Lv. ${level.current.level}</span>
            </div>
            <div class="profile-identity-copy">
              <p class="quiz-kicker">${t("profile.kicker")}</p>
              <h1 id="trainerProfileTitle">${escapeHtml(trainerName())}</h1>
              <span class="profile-title-badge">${escapeHtml(cosmeticName(title))}</span>
              <p>${t("profile.subtitle")}</p>
            </div>
            <div class="profile-hero-actions">
              <button id="customizeTrainerProfile" class="primary-button profile-customize-button">${t("profile.customize")}</button>
              <button id="editTrainerName" class="ghost-button profile-edit-button">${t("profile.editName")}</button>
            </div>
          </div>
          <div class="profile-hero-meta">
            <span><small>${t("profile.currentRank")}</small><strong>${escapeHtml(t(level.current.key))}</strong></span>
            <span><small>${t("profile.trainerSince")}</small><strong>${escapeHtml(formatLongDate(state.profile.joinedAt))}</strong></span>
            <span><small>${t("profile.bestType")}</small><strong>${bestType ? `${escapeHtml(typeLabel(bestType.type))} · ${bestType.rate}%` : t("profile.notEnoughData")}</strong></span>
          </div>
        </section>

        <section class="profile-collection-strip" aria-label="${escapeHtml(t("profile.collection"))}">
          <div><span>${profileAvatarMarkup(avatar.id, "collection-mini-avatar")}</span><p><small>${t("profile.avatar")}</small><strong>${escapeHtml(cosmeticName(avatar))}</strong></p></div>
          <div><span class="profile-banner-swatch profile-banner profile-banner-${banner.id}"><i></i></span><p><small>${t("profile.banner")}</small><strong>${escapeHtml(cosmeticName(banner))}</strong></p></div>
          <div><span class="profile-title-symbol">T</span><p><small>${t("profile.trainerTitle")}</small><strong>${escapeHtml(cosmeticName(title))}</strong></p></div>
          <button id="customizeTrainerProfileSecondary" class="secondary-button">${t("profile.changeLook")}</button>
        </section>

        <section class="profile-favorites-section" aria-labelledby="profileFavoritesTitle">
          <div class="profile-favorites-heading">
            <div><p class="quiz-kicker">${t("profile.favoritesKicker")}</p><h2 id="profileFavoritesTitle">${t("profile.favoritesTitle")}</h2><p>${t("profile.favoritesHint")}</p></div>
            <button id="editProfileFavorites" class="secondary-button">${t("profile.editFavorites")}</button>
          </div>
          <div class="profile-favorites-grid">
            <article class="profile-favorite-card favorite-pokemon-card">
              ${favoritePokemonVisual(favoritePokemon, "profile-favorite-pokemon")}
              <div><small>${t("profile.favoritePokemon")}</small><strong>${favoritePokemon ? escapeHtml(favoritePokemonName(favoritePokemon)) : t("profile.noFavoritePokemon")}</strong>${favoritePokemon ? `<span class="profile-favorite-types">${favoritePokemon.types.map(type => typeChip(type,"small")).join("")}</span>` : ""}</div>
            </article>
            <article class="profile-favorite-card favorite-type-card" style="--favorite-type:${favoriteType ? TYPE_META[favoriteType].color : "var(--line)"}">
              <span class="profile-favorite-type-symbol">${favoriteType ? TYPE_META[favoriteType].icon : "?"}</span>
              <div><small>${t("profile.favoriteType")}</small><strong>${favoriteType ? escapeHtml(typeLabel(favoriteType)) : t("profile.noFavoriteType")}</strong>${favoriteType ? typeChip(favoriteType,"small") : ""}</div>
            </article>
          </div>
        </section>

        <section class="profile-kpi-grid" aria-label="${escapeHtml(t("profile.overview"))}">
          ${profileKpi("XP", t("profile.xp"), state.stats.xp, level.next ? t("profile.xpRemaining", { count: remainingXp }) : t("profile.maxLevel"))}
          ${profileKpi("◎", t("profile.accuracy"), `${accuracy}%`, `${state.stats.correct}/${state.stats.total} ${t("common.correct").toLowerCase()}`)}
          ${profileKpi("▦", t("profile.sessions"), state.stats.sessions, t("profile.completedSessions"))}
          ${profileKpi("◇", t("profile.types"), `${mastered}/18`, t("profile.typesHint", { explored }))}
        </section>

        <section class="profile-dashboard-grid">
          <article class="profile-panel profile-level-panel">
            <div class="profile-panel-heading">
              <span>↗</span>
              <div><small>${t("profile.journey")}</small><h2>${t("profile.levelProgress")}</h2></div>
            </div>
            <div class="profile-level-summary">
              <div><strong>Lv. ${level.current.level}</strong><span>${escapeHtml(t(level.current.key))}</span></div>
              <b>${level.progress}%</b>
            </div>
            <div class="profile-progress-track" aria-label="${level.progress}%"><i style="width:${level.progress}%"></i></div>
            <p>${level.next ? t("profile.nextLevel", { count: remainingXp, level: level.next.level }) : t("profile.maxLevelText")}</p>
          </article>

          <article class="profile-panel profile-record-panel">
            <div class="profile-panel-heading">
              <span>✦</span>
              <div><small>${t("profile.personalBest")}</small><h2>${t("profile.records")}</h2></div>
            </div>
            <div class="profile-record-list">
              <span><small>${t("profile.bestStreak")}</small><strong>${state.stats.bestStreak}</strong></span>
              <span><small>${t("profile.learningTime")}</small><strong>${formatDuration(state.stats.totalSeconds)}</strong></span>
              <span><small>${t("profile.answered")}</small><strong>${state.stats.total}</strong></span>
              <span><small>${t("profile.exploredTypes")}</small><strong>${explored}/18</strong></span>
            </div>
          </article>
        </section>

        <section class="profile-activity-card">
          <div class="profile-activity-copy">
            <p class="quiz-kicker">${t("profile.latestActivity")}</p>
            ${last ? `<h2>${escapeHtml(modeName(last.mode))}</h2><p>${formatDate(last.date)} · ${last.correct}/${last.answers} ${t("common.correct").toLowerCase()} · ${last.rate}%</p>` : `<h2>${t("profile.noActivity")}</h2><p>${t("profile.noActivityHint")}</p>`}
          </div>
          <div class="profile-actions">
            <button id="profileStartTraining" class="primary-button">${t("profile.startTraining")}</button>
            <button id="profileViewProgress" class="secondary-button">${t("profile.viewProgress")}</button>
          </div>
        </section>
      </section>`;

    document.getElementById("editTrainerName").addEventListener("click", showProfileNameModal);
    document.getElementById("customizeTrainerProfile").addEventListener("click", openProfileCustomizer);
    document.getElementById("customizeTrainerProfileSecondary").addEventListener("click", openProfileCustomizer);
    document.getElementById("editProfileFavorites").addEventListener("click", openProfileFavorites);
    document.getElementById("profileStartTraining").addEventListener("click", () => setRoute("train"));
    document.getElementById("profileViewProgress").addEventListener("click", () => setRoute("stats"));
  }

  function profileLockIconMarkup() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>`;
  }

  function favoritePokemonPickerCard(item) {
    const selected = Number(profileFavoritesDraft?.favoritePokemonId) === item.id;
    return `<button type="button" class="favorite-pokemon-picker-card ${selected ? "selected" : ""}" data-favorite-pokemon="${item.id}" aria-pressed="${selected}">
      ${favoritePokemonVisual(item,"favorite-picker-visual")}
      <span><strong>${escapeHtml(favoritePokemonName(item))}</strong><small>${t("profile.generation",{generation:item.generation})}</small><span>${item.types.map(type => typeChip(type,"small")).join("")}</span></span>
      <i aria-hidden="true">${selected ? "✓" : ""}</i>
    </button>`;
  }

  function renderProfileFavoritesContent() {
    if (!profileFavoritesDraft) return;
    const selectedPokemon = favoritePokemonEntry(profileFavoritesDraft.favoritePokemonId);
    const selectedType = TYPES.includes(profileFavoritesDraft.favoriteType) ? profileFavoritesDraft.favoriteType : null;
    const preview = document.getElementById("profileFavoritesPreview");
    preview.innerHTML = `<div>${favoritePokemonVisual(selectedPokemon,"favorite-modal-preview-pokemon")}<span><small>${t("profile.favoritePreview")}</small><strong>${selectedPokemon ? escapeHtml(favoritePokemonName(selectedPokemon)) : t("profile.noFavoritePokemon")}</strong></span></div><div>${selectedType ? typeChip(selectedType) : `<span class="favorite-type-empty">?</span>`}<span><small>${t("profile.favoriteType")}</small><strong>${selectedType ? escapeHtml(typeLabel(selectedType)) : t("profile.noFavoriteType")}</strong></span></div>`;

    const query = favoritePokemonQuery.trim().toLocaleLowerCase(state.language === "de" ? "de-DE" : "en-GB");
    const filteredPokemon = FAVORITE_POKEMON_CATALOG.filter(item => {
      const names = Object.values(item.names || {}).join(" ").toLocaleLowerCase(state.language === "de" ? "de-DE" : "en-GB");
      return !query || names.includes(query) || String(item.id).includes(query);
    });
    const pokemonGrid = document.getElementById("favoritePokemonGrid");
    pokemonGrid.innerHTML = filteredPokemon.length ? filteredPokemon.map(favoritePokemonPickerCard).join("") : `<div class="favorite-picker-empty">${t("profile.noPokemonFound")}</div>`;
    document.querySelectorAll("[data-favorite-pokemon]").forEach(button => button.addEventListener("click", () => {
      profileFavoritesDraft.favoritePokemonId = Number(button.dataset.favoritePokemon);
      renderProfileFavoritesContent();
    }));

    const typeGrid = document.getElementById("favoriteTypeGrid");
    typeGrid.innerHTML = TYPES.map(type => `<button type="button" class="favorite-type-picker ${selectedType === type ? "selected" : ""}" data-favorite-type="${type}" aria-pressed="${selectedType === type}">${typeChip(type)}<i aria-hidden="true">${selectedType === type ? "✓" : ""}</i></button>`).join("");
    document.querySelectorAll("[data-favorite-type]").forEach(button => button.addEventListener("click", () => {
      profileFavoritesDraft.favoriteType = button.dataset.favoriteType;
      renderProfileFavoritesContent();
    }));
    const saveButton = document.getElementById("saveProfileFavorites");
    if (saveButton) saveButton.disabled = Number(profileFavoritesDraft.favoritePokemonId || 0) === Number(state.profile.favoritePokemonId || 0) && (profileFavoritesDraft.favoriteType || null) === (state.profile.favoriteType || null);
  }

  function openProfileFavorites() {
    profileFavoritesDraft = { favoritePokemonId: state.profile.favoritePokemonId, favoriteType: state.profile.favoriteType };
    favoritePokemonQuery = "";
    const originalFavorites = clone(profileFavoritesDraft);
    setModalMarkup(`<div class="modal-backdrop profile-favorites-backdrop" role="dialog" aria-modal="true" aria-labelledby="profileFavoritesModalTitle">
      <section class="modal-card profile-favorites-dialog">
        <div class="profile-favorites-modal-heading"><div><p class="quiz-kicker">${t("profile.favoritesKicker")}</p><h2 id="profileFavoritesModalTitle">${t("profile.favoritesTitle")}</h2><p>${t("profile.favoritesHint")}</p></div><button id="closeProfileFavorites" class="icon-button" aria-label="${escapeHtml(t("common.close"))}" title="${escapeHtml(t("common.close"))}">×</button></div>
        <div id="profileFavoritesPreview" class="profile-favorites-preview"></div>
        <div class="profile-favorites-scroll">
          <section class="favorite-picker-section"><div class="favorite-picker-heading"><div><h3>${t("profile.chooseFavoritePokemon")}</h3><p>${t("profile.favoritePokemonHint")}</p></div><label><span>${t("profile.searchPokemon")}</span><input id="favoritePokemonSearch" type="search" placeholder="${escapeHtml(t("profile.searchPokemonPlaceholder"))}"></label></div><div id="favoritePokemonGrid" class="favorite-pokemon-picker-grid"></div></section>
          <section class="favorite-picker-section"><div class="favorite-picker-heading"><div><h3>${t("profile.chooseFavoriteType")}</h3><p>${t("profile.favoriteTypeHint")}</p></div></div><div id="favoriteTypeGrid" class="favorite-type-picker-grid"></div></section>
        </div>
        <div class="modal-actions profile-favorites-actions"><button id="cancelProfileFavorites" class="secondary-button">${t("common.cancel")}</button><button id="saveProfileFavorites" class="primary-button">${t("profile.saveFavorites")}</button></div>
      </section>
    </div>`, { closeOnBackdrop: false, initialFocus: "#favoritePokemonSearch" });
    const favoritesBackdrop = modalRoot.querySelector(".profile-favorites-backdrop");
    const favoritesDirty = () => JSON.stringify(profileFavoritesDraft) !== JSON.stringify(originalFavorites);
    const updateFavoritesSaveState = () => { const button = document.getElementById("saveProfileFavorites"); if (button) button.disabled = !favoritesDirty(); };
    renderProfileFavoritesContent();
    updateFavoritesSaveState();
    const search = document.getElementById("favoritePokemonSearch");
    search.addEventListener("input", event => { favoritePokemonQuery = event.target.value; renderProfileFavoritesContent(); updateFavoritesSaveState(); });
    favoritesBackdrop.addEventListener("click", event => { if (event.target.closest("[data-favorite-pokemon], [data-favorite-type]")) requestAnimationFrame(updateFavoritesSaveState); });
    const requestCloseFavorites = () => confirmDiscardChanges(favoritesDirty(), favoritesBackdrop, () => { profileFavoritesDraft = null; });
    const favoritesContext = modalStack.find(entry => entry.backdrop === favoritesBackdrop);
    if (favoritesContext) favoritesContext.onRequestClose = requestCloseFavorites;
    document.getElementById("closeProfileFavorites").addEventListener("click", requestCloseFavorites);
    document.getElementById("cancelProfileFavorites").addEventListener("click", requestCloseFavorites);
    document.getElementById("saveProfileFavorites").addEventListener("click", event => {
      const saveButton = event.currentTarget;
      if (saveButton.disabled) return;
      setButtonBusy(saveButton, true, t("common.saving"));
      state.profile.favoritePokemonId = favoritePokemonEntry(profileFavoritesDraft.favoritePokemonId)?.id || null;
      state.profile.favoriteType = TYPES.includes(profileFavoritesDraft.favoriteType) ? profileFavoritesDraft.favoriteType : null;
      saveState();
      profileFavoritesDraft = null;
      closeModal(() => { renderProfile(); enqueueToast("♥", t("profile.favoritesSaved"), t("profile.favoritesSavedHint"), "success"); });
    });
  }

  function profileChoiceCard(item, kind, selectedId) {
    const status = profileUnlockStatus(item);
    const selected = item.id === selectedId;
    const visual = kind === "avatar"
      ? profileAvatarMarkup(item.id, "profile-choice-avatar")
      : kind === "banner"
        ? `<span class="profile-choice-banner profile-banner profile-banner-${item.id}"><i></i></span>`
        : `<span class="profile-choice-title-symbol">${escapeHtml(cosmeticName(item).slice(0,2).toUpperCase())}</span>`;
    const placeholder = item.placeholder ? `<em class="profile-placeholder-label">${t("profile.placeholder")}</em>` : "";
    const description = kind === "banner" && cosmeticDescription(item) ? `<span class="profile-choice-description">${escapeHtml(cosmeticDescription(item))}</span>` : "";
    return `<button type="button" class="profile-choice-card ${selected ? "selected" : ""} ${status.unlocked ? "" : "locked"}" data-profile-${kind}="${item.id}" aria-pressed="${selected}" aria-disabled="${!status.unlocked}" ${status.unlocked ? "" : "disabled"}>
      ${visual}
      <span class="profile-choice-copy"><strong>${escapeHtml(cosmeticName(item))}</strong>${description}<small>${escapeHtml(status.label)}</small>${placeholder}</span>
      <span class="profile-choice-state" aria-hidden="true">${selected ? "✓" : status.unlocked ? "" : profileLockIconMarkup()}</span>
    </button>`;
  }

  function profileSetStatus(set) {
    const unlockStatus = profileUnlockStatus(set);
    const title = set.titleIds.map(id => PROFILE_TITLES.find(item => item.id === id)).find(item => item && profileUnlockStatus(item).unlocked);
    const avatar = set.avatarIds.map(id => PROFILE_AVATARS.find(item => item.id === id)).find(item => item && profileUnlockStatus(item).unlocked);
    const banner = set.bannerIds.map(id => PROFILE_BANNERS.find(item => item.id === id)).find(item => item && profileUnlockStatus(item).unlocked);
    const complete = Boolean(unlockStatus.unlocked && title && avatar && banner && !set.incomplete);
    return { title, avatar, banner, complete, unlockStatus };
  }

  function profileSetCard(set) {
    const status = profileSetStatus(set);
    const titlePreview = PROFILE_TITLES.find(item => item.id === set.titleIds[0]);
    const avatarPreview = PROFILE_AVATARS.find(item => item.id === set.avatarIds[0]);
    const bannerPreview = PROFILE_BANNERS.find(item => item.id === set.bannerIds[0]);
    return `<button type="button" class="profile-set-card ${status.complete ? "" : "locked"}" data-profile-set="${set.id}" aria-disabled="${!status.complete}" ${status.complete ? "" : "disabled"}>
      <span class="profile-set-banner profile-banner profile-banner-${bannerPreview?.id || "neon-grid"}"><i></i></span>
      <span class="profile-set-body">${avatarPreview ? profileAvatarMarkup(avatarPreview.id,"profile-set-avatar") : `<span class="profile-set-avatar-missing">?</span>`}<span><strong>${escapeHtml(set.name)}</strong><small>${escapeHtml(titlePreview ? cosmeticName(titlePreview) : t("profile.setMissing"))}</small><em>${status.complete ? t("profile.setReady") : escapeHtml(status.unlockStatus.label)}</em></span></span>
      <span class="profile-set-lock" aria-hidden="true">${status.complete ? "" : profileLockIconMarkup()}</span>
    </button>`;
  }

  function profileCustomizerCollection() {
    if (profileCustomizerTab === "avatar") return PROFILE_AVATARS;
    if (profileCustomizerTab === "banner") return PROFILE_BANNERS;
    if (profileCustomizerTab === "title") return PROFILE_TITLES;
    return PROFILE_SETS;
  }

  function profileCustomizerCategories() {
    if (profileCustomizerTab === "avatar") return PROFILE_AVATAR_CATEGORIES;
    if (profileCustomizerTab === "banner") return PROFILE_BANNER_CATEGORIES;
    if (profileCustomizerTab === "title") return PROFILE_TITLE_CATEGORIES;
    return [];
  }

  function renderProfileCustomizerContent() {
    if (!profileCustomizerDraft) return;
    const avatar = profileChoice(PROFILE_AVATARS, profileCustomizerDraft.avatarId, "pokeball");
    const banner = profileChoice(PROFILE_BANNERS, profileCustomizerDraft.bannerId, "neon-grid");
    const title = profileChoice(PROFILE_TITLES, profileCustomizerDraft.titleId, "trainer-neuling");
    const unlockedSets = PROFILE_SETS.filter(set => profileSetStatus(set).complete).length;
    const unlocked = unlockedProfileCount(PROFILE_AVATARS) + unlockedProfileCount(PROFILE_BANNERS) + unlockedProfileCount(PROFILE_TITLES) + unlockedSets;
    const total = PROFILE_AVATARS.length + PROFILE_BANNERS.length + PROFILE_TITLES.length + PROFILE_SETS.length;
    const preview = document.getElementById("profileCustomizerPreview");
    preview.className = `profile-customizer-top profile-banner profile-banner-${banner.id}`;
    preview.innerHTML = `<div class="profile-customizer-preview">${profileAvatarMarkup(avatar.id, "profile-customizer-avatar")}<div><small>${t("profile.preview")}</small><strong>${escapeHtml(trainerName())}</strong><span>${escapeHtml(cosmeticName(title))}</span></div></div><div class="profile-customizer-progress"><strong>${unlocked}/${total}</strong><small>${t("profile.unlockedCount")}</small></div>`;

    document.querySelectorAll("[data-customizer-tab]").forEach(button => {
      const active = button.dataset.customizerTab === profileCustomizerTab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });

    const categories = profileCustomizerCategories();
    const categorySelect = document.getElementById("profileCosmeticCategory");
    categorySelect.hidden = !categories.length;
    categorySelect.innerHTML = `<option value="all">${t("profile.allCategories")}</option>${categories.map(category => `<option value="${category}">${escapeHtml(cosmeticCategoryLabel(profileCustomizerTab,category))}</option>`).join("")}`;
    categorySelect.value = categories.includes(profileCustomizerCategory) ? profileCustomizerCategory : "all";
    if (!categories.includes(profileCustomizerCategory)) profileCustomizerCategory = "all";

    const collection = profileCustomizerCollection();
    const query = profileCustomizerQuery.trim().toLocaleLowerCase(state.language === "de" ? "de-DE" : "en-GB");
    const filtered = collection.filter(item => {
      const name = (item.name || cosmeticName(item)).toLocaleLowerCase(state.language === "de" ? "de-DE" : "en-GB");
      const matchesQuery = !query || name.includes(query);
      const matchesCategory = profileCustomizerCategory === "all" || item.category === profileCustomizerCategory;
      return matchesQuery && matchesCategory;
    });
    const grid = document.getElementById("profileCustomizerGrid");
    grid.className = `profile-choice-grid ${profileCustomizerTab === "sets" ? "profile-set-grid" : `profile-${profileCustomizerTab}-grid`}`;
    grid.innerHTML = filtered.length
      ? filtered.map(item => profileCustomizerTab === "sets" ? profileSetCard(item) : profileChoiceCard(item, profileCustomizerTab, profileCustomizerDraft[`${profileCustomizerTab}Id`])).join("")
      : `<div class="profile-cosmetic-empty"><strong>${t("profile.noCosmeticsFound")}</strong><p>${t("profile.noCosmeticsFoundHint")}</p></div>`;

    document.querySelectorAll(`[data-profile-${profileCustomizerTab}]`).forEach(button => button.addEventListener("click", () => {
      profileCustomizerDraft[`${profileCustomizerTab}Id`] = button.getAttribute(`data-profile-${profileCustomizerTab}`);
      renderProfileCustomizerContent();
    }));
    document.querySelectorAll("[data-profile-set]").forEach(button => button.addEventListener("click", () => {
      const set = PROFILE_SETS.find(item => item.id === button.dataset.profileSet);
      const status = profileSetStatus(set);
      if (!status.complete) return;
      profileCustomizerDraft.avatarId = status.avatar.id;
      profileCustomizerDraft.bannerId = status.banner.id;
      profileCustomizerDraft.titleId = status.title.id;
      renderProfileCustomizerContent();
    }));
    const saveButton = document.getElementById("finishProfileCustomizer");
    if (saveButton) saveButton.disabled = profileCustomizerDraft.avatarId === state.profile.avatarId && profileCustomizerDraft.bannerId === state.profile.bannerId && profileCustomizerDraft.titleId === state.profile.titleId;
  }

  function openProfileCustomizer() {
    profileCustomizerDraft = { avatarId:selectedAvatar().id, bannerId:selectedBanner().id, titleId:selectedTitle().id };
    profileCustomizerTab = "avatar";
    profileCustomizerQuery = "";
    profileCustomizerCategory = "all";
    const originalCustomizer = clone(profileCustomizerDraft);
    setModalMarkup(`<div class="modal-backdrop profile-customizer-backdrop" role="dialog" aria-modal="true" aria-labelledby="profileCustomizerTitle">
      <section class="modal-card profile-customizer-dialog">
        <div id="profileCustomizerPreview" class="profile-customizer-top"></div>
        <div class="profile-customizer-heading"><div><p class="quiz-kicker">${t("profile.identity")}</p><h2 id="profileCustomizerTitle">${t("profile.customizeTitle")}</h2><p>${t("profile.customizeHintExpanded")}</p></div><button id="closeProfileCustomizer" class="icon-button" aria-label="${escapeHtml(t("common.close"))}" title="${escapeHtml(t("common.close"))}">×</button></div>
        <div class="profile-customizer-tabs" role="tablist">
          <button data-customizer-tab="avatar" role="tab">${t("profile.avatarsTab")} <small>${unlockedProfileCount(PROFILE_AVATARS)}/${PROFILE_AVATARS.length}</small></button>
          <button data-customizer-tab="banner" role="tab">${t("profile.bannersTab")} <small>${unlockedProfileCount(PROFILE_BANNERS)}/${PROFILE_BANNERS.length}</small></button>
          <button data-customizer-tab="title" role="tab">${t("profile.titlesTab")} <small>${unlockedProfileCount(PROFILE_TITLES)}/${PROFILE_TITLES.length}</small></button>
          <button data-customizer-tab="sets" role="tab">${t("profile.setsTab")} <small>${PROFILE_SETS.filter(set => profileSetStatus(set).complete).length}/${PROFILE_SETS.length}</small></button>
        </div>
        <div class="profile-customizer-toolbar"><label><span>${t("profile.search")}</span><input id="profileCosmeticSearch" type="search" placeholder="${escapeHtml(t("profile.searchPlaceholder"))}"></label><label><span>${t("profile.category")}</span><select id="profileCosmeticCategory"></select></label></div>
        <section class="profile-customizer-section"><div id="profileCustomizerGrid"></div></section>
        <div class="profile-customizer-actions"><p>${t("profile.unlockHintPlanned")}</p><div><button id="cancelProfileCustomizer" class="ghost-button">${t("common.cancel")}</button><button id="finishProfileCustomizer" class="primary-button">${t("profile.done")}</button></div></div>
      </section>
    </div>`, { closeOnBackdrop: false, initialFocus: "[data-customizer-tab=\"avatar\"]" });
    const customizerBackdrop = modalRoot.querySelector(".profile-customizer-backdrop");
    const customizerDirty = () => JSON.stringify(profileCustomizerDraft) !== JSON.stringify(originalCustomizer);
    const updateCustomizerSaveState = () => { const button = document.getElementById("finishProfileCustomizer"); if (button) button.disabled = !customizerDirty(); };
    document.querySelectorAll("[data-customizer-tab]").forEach(button => button.addEventListener("click", () => {
      profileCustomizerTab = button.dataset.customizerTab;
      profileCustomizerCategory = "all";
      renderProfileCustomizerContent();
    }));
    const search = document.getElementById("profileCosmeticSearch");
    search.addEventListener("input", () => { profileCustomizerQuery = search.value; renderProfileCustomizerContent(); requestAnimationFrame(() => { const input=document.getElementById("profileCosmeticSearch"); input.value=profileCustomizerQuery; input.focus(); input.setSelectionRange(input.value.length,input.value.length); }); });
    document.getElementById("profileCosmeticCategory").addEventListener("change", event => { profileCustomizerCategory=event.target.value; renderProfileCustomizerContent(); });
    customizerBackdrop.addEventListener("click", event => { if (event.target.closest("[data-profile-avatar], [data-profile-banner], [data-profile-title], [data-profile-set]")) requestAnimationFrame(updateCustomizerSaveState); });
    const closeWithoutSaving = () => confirmDiscardChanges(customizerDirty(), customizerBackdrop, () => { profileCustomizerDraft=null; });
    const customizerContext = modalStack.find(entry => entry.backdrop === customizerBackdrop);
    if (customizerContext) customizerContext.onRequestClose = closeWithoutSaving;
    document.getElementById("closeProfileCustomizer").addEventListener("click", closeWithoutSaving);
    document.getElementById("cancelProfileCustomizer").addEventListener("click", closeWithoutSaving);
    document.getElementById("finishProfileCustomizer").addEventListener("click", event => {
      const saveButton = event.currentTarget;
      if (saveButton.disabled) return;
      setButtonBusy(saveButton, true, t("common.saving"));
      state.profile.avatarId = profileCustomizerDraft.avatarId;
      state.profile.bannerId = profileCustomizerDraft.bannerId;
      state.profile.titleId = profileCustomizerDraft.titleId;
      saveState();
      profileCustomizerDraft=null;
      closeModal(() => { renderProfile(); enqueueToast("✓",t("profile.designSaved"),t("profile.designSavedHint"),"success"); });
    });
    renderProfileCustomizerContent();
    updateCustomizerSaveState();
  }

  function profileKpi(icon, label, value, hint) {
    return `<article class="profile-kpi-card"><span>${icon}</span><div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><p>${escapeHtml(hint)}</p></div></article>`;
  }

  function showProfileNameModal() {
    const originalName = state.profile.name || "";
    setModalMarkup(`<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="profileNameDialogTitle">
      <form class="modal-card profile-name-dialog" id="profileNameForm" novalidate>
        <div class="onboarding-visual">ID</div>
        <h2 id="profileNameDialogTitle">${t("profile.editName")}</h2>
        <p>${t("profile.editNameHint")}</p>
        <label class="profile-name-field"><span>${t("profile.nameLabel")}</span><input id="profileNameInput" type="text" maxlength="24" autocomplete="nickname" value="${escapeHtml(originalName)}" placeholder="${escapeHtml(t("profile.namePlaceholder"))}" aria-describedby="profileNameMeta"></label>
        <div id="profileNameMeta" class="field-meta"><span>${t("profile.nameOptional")}</span><strong><span id="profileNameCount">${originalName.length}</span>/24</strong></div>
        <div id="profileNameError" class="field-error" role="alert"></div>
        <div class="modal-actions"><button type="button" id="cancelProfileName" class="ghost-button">${t("common.cancel")}</button><button type="submit" id="saveProfileName" class="primary-button" disabled>${t("common.save")}</button></div>
      </form>
    </div>`, { closeOnBackdrop: false, initialFocus: "#profileNameInput" });
    const backdrop = modalRoot.querySelector(".modal-backdrop");
    const input = document.getElementById("profileNameInput");
    const saveButton = document.getElementById("saveProfileName");
    const counter = document.getElementById("profileNameCount");
    const error = document.getElementById("profileNameError");
    const normalized = () => input.value.trim().slice(0, 24);
    const isDirty = () => normalized() !== originalName;
    const validate = () => {
      counter.textContent = String(input.value.length);
      const invalid = /[\u0000-\u001F\u007F]/.test(input.value);
      error.textContent = invalid ? t("profile.nameInvalid") : "";
      input.setAttribute("aria-invalid", invalid ? "true" : "false");
      saveButton.disabled = invalid || !isDirty();
      return !invalid;
    };
    input.addEventListener("input", validate);
    const requestClose = () => confirmDiscardChanges(isDirty(), backdrop);
    const context = modalStack.find(entry => entry.backdrop === backdrop);
    if (context) context.onRequestClose = requestClose;
    document.getElementById("cancelProfileName").addEventListener("click", requestClose);
    document.getElementById("profileNameForm").addEventListener("submit", event => {
      event.preventDefault();
      if (!validate() || saveButton.disabled) return;
      setButtonBusy(saveButton, true, t("common.saving"));
      state.profile.name = normalized();
      saveState();
      closeModal(() => {
        renderProfile();
        enqueueToast("✓", t("profile.nameSaved"), t("profile.nameSavedHint"), "success");
      }, backdrop);
    });
  }

  function iconSvg(name, className = "") {
    const svgClass = className ? ` class="${className}"` : "";
    const attrs = `${svgClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
    const icons = {
      home: `<svg ${attrs}><path d="M3.5 10.5 12 4l8.5 6.5"></path><path d="M5.5 9.5V20h13V9.5"></path></svg>`,
      train: `<svg ${attrs}><path d="M6 4v4"></path><path d="M18 16v4"></path><path d="M4 6h4"></path><path d="M16 18h4"></path><path d="m8 8 8 8"></path><path d="m16 8-2-2"></path><path d="m8 16 2 2"></path></svg>`,
      learn: `<svg ${attrs}><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v17H7.5A2.5 2.5 0 0 0 5 22z"></path><path d="M5 5.5v14"></path><path d="M9 7h6"></path><path d="M9 11h6"></path></svg>`,
      stats: `<svg ${attrs}><path d="M4 20h16"></path><path d="M7 16v-4"></path><path d="M12 16V8"></path><path d="M17 16v-7"></path></svg>`,
      settings: `<svg ${attrs}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1 0 2.8 2 2 0 0 1-2.8 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.7z"></path></svg>`,
      daily: `<svg ${attrs}><circle cx="12" cy="12" r="4"></circle><path d="M12 2.5v2"></path><path d="M12 19.5v2"></path><path d="M4.9 4.9 6.3 6.3"></path><path d="M17.7 17.7 19.1 19.1"></path><path d="M2.5 12h2"></path><path d="M19.5 12h2"></path><path d="M4.9 19.1 6.3 17.7"></path><path d="M17.7 6.3 19.1 4.9"></path></svg>`,
      weak: `<svg ${attrs}><circle cx="12" cy="12" r="7"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 5v2"></path><path d="M12 17v2"></path><path d="M5 12h2"></path><path d="M17 12h2"></path></svg>`,
      repeat: `<svg ${attrs}><path d="M20 7v5h-5"></path><path d="M4 17v-5h5"></path><path d="M7.5 8.5A7 7 0 0 1 18 10"></path><path d="M16.5 15.5A7 7 0 0 1 6 14"></path></svg>`,
      review: `<svg ${attrs}><circle cx="12" cy="12" r="9"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>`,
      effectiveness: `<svg ${attrs}><path d="M4 12h6"></path><path d="M14 12h6"></path><path d="m16 9 4 3-4 3"></path><circle cx="9" cy="12" r="3"></circle></svg>`,
      multiplier: `<svg ${attrs}><rect x="4" y="5" width="6" height="6" rx="1.5"></rect><rect x="14" y="5" width="6" height="6" rx="1.5"></rect><rect x="4" y="13" width="6" height="6" rx="1.5"></rect><rect x="14" y="13" width="6" height="6" rx="1.5"></rect></svg>`,
      impact: `<svg ${attrs}><path d="M5 19 19 5"></path><path d="M7 7h4V3"></path><path d="M17 17h-4v4"></path></svg>`,
      pokemon: `<svg ${attrs}><path d="M4 12a8 8 0 0 1 16 0"></path><path d="M4 12a8 8 0 0 0 16 0"></path><path d="M4 12h16"></path><circle cx="12" cy="12" r="2"></circle></svg>`,
      answered: `<svg ${attrs}><circle cx="12" cy="12" r="9"></circle><path d="M9.2 9.5a3 3 0 1 1 4.3 2.7c-.9.4-1.5 1.1-1.5 1.8"></path><path d="M12 17h.01"></path></svg>`,
      accuracy: `<svg ${attrs}><path d="M20 6 9 17l-5-5"></path></svg>`,
      time: `<svg ${attrs}><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>`,
      sessions: `<svg ${attrs}><rect x="5" y="4" width="14" height="16" rx="2"></rect><path d="M8 8h8"></path><path d="M8 12h8"></path><path d="M8 16h5"></path></svg>`
    };
    return icons[name] || icons.home;
  }

  function gameMenuButton(route, icon, number, title, description, primary = false) {
    return `<button class="game-menu-button${primary ? " primary" : ""}" data-destination="${route}"><span class="game-menu-number">${number}</span><span class="game-menu-icon" aria-hidden="true">${icon}</span><span class="game-menu-copy"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></span><span class="game-menu-arrow" aria-hidden="true">›</span></button>`;
  }

  function modeVisual(mode) {
    const visuals = {
      effectiveness: { icon: iconSvg("effectiveness"), number: "01" },
      multiplier: { icon: iconSvg("multiplier"), number: "02" },
      impact: { icon: iconSvg("impact"), number: "03" },
      pokemon: { icon: iconSvg("pokemon"), number: "04" },
      daily: { icon: iconSvg("daily"), number: "" },
      weak: { icon: iconSvg("weak"), number: "" },
      review: { icon: iconSvg("review"), number: "" }
    };
    return visuals[mode] || { icon: "Q", number: "" };
  }

  function difficultyLabel(value) {
    return t(`setup.${value || "medium"}`);
  }

  function configSummary(mode, config = state.config[mode] || {}) {
    const length = config.length === "infinite" ? t("setup.endless") : t("train.questionCount", { count: config.length || 10 });
    const parts = [length, difficultyLabel(config.difficulty)];
    if (mode === "effectiveness") parts.push(t(`setup.${config.kind || "mixed"}`));
    if (["multiplier", "impact"].includes(mode)) parts.push(t(`setup.${config.defense || "mixed"}`));
    if (mode === "pokemon") parts.push(config.generation === "all" ? t("common.all") : `Gen ${config.generation}`);
    return parts.join(" · ");
  }

  function renderTrain() {
    session = null;
    const openMistakes = state.stats.mistakes.filter(item => item?.status !== "resolved" && item?.spec).map(item => clone(item.spec));
    const accuracy = percent(state.stats.correct, state.stats.total);
    const last = state.stats.history[0];
    const quickActions = [
      `<button class="training-focus-card primary" id="dailyTraining"><span class="training-focus-icon">${iconSvg("daily")}</span><span class="training-focus-copy"><small>${t("train.recommended")}</small><strong>${state.daily.completed ? t("home.dailyDone") : t("home.daily")}</strong><p>${t("home.dailyDesc")}</p></span><span class="training-focus-arrow">›</span></button>`,
      `<button class="training-focus-card" id="weakTraining"><span class="training-focus-icon">${iconSvg("weak")}</span><span class="training-focus-copy"><small>${t("train.personal")}</small><strong>${t("home.weak")}</strong><p>${t("home.weakDesc")}</p></span><span class="training-focus-arrow">›</span></button>`,
      state.lastMode && state.lastConfig
        ? `<button class="training-focus-card" id="repeatLastTraining"><span class="training-focus-icon">${iconSvg("repeat")}</span><span class="training-focus-copy"><small>${t("train.continueLabel")}</small><strong>${t("home.continue")}</strong><p>${t("home.continueDesc",{mode:modeName(state.lastMode)})}</p></span><span class="training-focus-arrow">›</span></button>`
        : `<button class="training-focus-card" data-mode-shortcut="effectiveness"><span class="training-focus-icon">${iconSvg("effectiveness")}</span><span class="training-focus-copy"><small>${t("train.free")}</small><strong>${escapeHtml(modeName("effectiveness"))}</strong><p>${t("mode.effectivenessDesc")}</p></span><span class="training-focus-arrow">›</span></button>`,
      openMistakes.length
        ? `<button class="training-focus-card warning" id="reviewOpenMistakes"><span class="training-focus-icon">${iconSvg("review")}</span><span class="training-focus-copy"><small>${t("train.reviewLabel")}</small><strong>${t("train.review")}</strong><p>${t("train.reviewDesc")}</p></span><span class="training-focus-count">${openMistakes.length}</span></button>`
        : ""
    ].filter(Boolean).join("");

    view.innerHTML = `
      <section class="training-hub">
        <section class="training-command-hero">
          <div class="training-command-copy">
            <p class="quiz-kicker">${t("train.kicker")}</p>
            <h1>${t("train.title")}</h1>
            <p>${t("train.subtitle")}</p>
          </div>
          <div class="training-command-stats" aria-label="${t("train.status")}">
            <div><small>${t("train.accuracy")}</small><strong>${accuracy}%</strong></div>
            <div><small>${t("train.streak")}</small><strong>${state.stats.streak}</strong></div>
            <div><small>${t("train.sessions")}</small><strong>${state.stats.sessions}</strong></div>
            <div><small>${t("train.openErrors")}</small><strong>${openMistakes.length}</strong></div>
          </div>
        </section>

        <section class="training-section" aria-labelledby="trainingQuickTitle">
          <div class="training-section-heading"><div><small>${t("train.quickKicker")}</small><h2 id="trainingQuickTitle">${t("train.forYou")}</h2></div><p>${last ? t("train.lastResult", { mode: modeName(last.mode), rate: last.rate }) : t("train.forYouHint")}</p></div>
          <div class="training-focus-grid">${quickActions}</div>
        </section>

        <section class="training-section" aria-labelledby="trainingModesTitle">
          <div class="training-section-heading"><div><small>${t("train.modeKicker")}</small><h2 id="trainingModesTitle">${t("train.free")}</h2></div><p>${t("train.freeHint")}</p></div>
          <div class="training-mode-grid">
            ${trainingModeCard("effectiveness", t("mode.effectivenessDesc"))}
            ${trainingModeCard("multiplier", t("mode.multiplierDesc"))}
            ${trainingModeCard("impact", t("mode.impactDesc"))}
            ${trainingModeCard("pokemon", t("mode.pokemonDesc"))}
          </div>
        </section>
      </section>
    `;

    document.querySelectorAll("[data-mode], [data-mode-shortcut]").forEach(button => button.addEventListener("click", () => setRoute(`setup-${button.dataset.mode || button.dataset.modeShortcut}`)));
    document.getElementById("dailyTraining").addEventListener("click", startDailySession);
    document.getElementById("weakTraining").addEventListener("click", startWeakSession);
    document.getElementById("repeatLastTraining")?.addEventListener("click", () => {
      if (!state.lastMode || !state.lastConfig) return;
      state.config[state.lastMode] = { ...state.config[state.lastMode], ...clone(state.lastConfig) };
      startSession(state.lastMode);
    });
    document.getElementById("reviewOpenMistakes")?.addEventListener("click", () => startReviewSession(openMistakes));
  }

  function trainingModeCard(mode, description) {
    const visual = modeVisual(mode);
    const modeStats = state.stats.modes[mode] || blankModeStats();
    const accuracy = percent(modeStats.correct, modeStats.total);
    return `<button class="training-mode-card" data-mode="${mode}">
      <span class="training-mode-number">${visual.number}</span>
      <span class="training-mode-icon">${visual.icon}</span>
      <span class="training-mode-copy"><strong>${escapeHtml(modeName(mode))}</strong><p>${escapeHtml(description)}</p><small>${escapeHtml(configSummary(mode))}</small></span>
      <span class="training-mode-progress"><i style="width:${modeStats.total ? accuracy : 0}%"></i></span>
      <span class="training-mode-meta">${modeStats.total ? `${accuracy}%` : t("train.notStarted")}</span>
      <span class="training-mode-arrow">›</span>
    </button>`;
  }

  function renderSetup(mode) {
    const config = state.config[mode];
    const modeDescription = t(`mode.${mode}Desc`);
    const visual = modeVisual(mode);
    view.innerHTML = `
      <section class="setup-shell">
        <aside class="setup-mode-preview">
          <div class="setup-preview-top"><span class="setup-preview-number">${visual.number}</span><span class="setup-preview-icon">${visual.icon}</span></div>
          <p class="quiz-kicker">${t("setup.kicker")}</p>
          <h1>${escapeHtml(modeName(mode))}</h1>
          <p>${escapeHtml(modeDescription)}</p>
          <div class="setup-preview-summary">
            <small>${t("setup.currentSelection")}</small>
            <strong>${escapeHtml(configSummary(mode, config))}</strong>
          </div>
          <div class="setup-preview-note"><span>✓</span><p>${t("setup.readyNote")}</p></div>
        </aside>

        <section class="setup-config-panel">
          <div class="setup-config-head">
            <p class="quiz-kicker">${t("setup.configure")}</p>
            <h2>${t("setup.title")}</h2>
            <p>${t("setup.subtitle")}</p>
          </div>
          <div class="setup-settings-list">
            ${segmentedSetting("length", t("setup.length"), [[10,"10"],[20,"20"],["infinite",t("setup.endless")]], String(config.length), "01")}
            ${segmentedSetting("difficulty", t("setup.difficulty"), [["easy",t("setup.easy")],["medium",t("setup.medium")],["hard",t("setup.hard")]], config.difficulty, "02")}
            ${mode === "effectiveness" ? segmentedSetting("kind", t("setup.kind"), [["mixed",t("setup.mixed")],["effective",t("setup.effective")],["resisted",t("setup.resisted")]], config.kind, "03") : ""}
            ${["multiplier","impact"].includes(mode) ? segmentedSetting("defense", t("setup.defense"), [["mixed",t("setup.mixed")],["single",t("setup.single")],["dual",t("setup.dual")]], config.defense, "03") : ""}
            ${mode === "pokemon" ? pokemonSetupSettings(config) : ""}
          </div>
          <div class="setup-launch-bar">
            <div><small>${t("setup.selected")}</small><strong>${escapeHtml(configSummary(mode, config))}</strong></div>
            <button id="startConfigured" class="primary-button">${t("setup.begin")} <span aria-hidden="true">›</span></button>
          </div>
        </section>
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

  function segmentedSetting(key, title, options, selected, step = "") {
    return `<div class="setup-setting-card"><div class="setup-setting-title">${step ? `<span>${step}</span>` : ""}<h3>${escapeHtml(title)}</h3></div><div class="tabs segmented-control" role="group" aria-label="${escapeHtml(title)}" style="--tab-count:${options.length}">${options.map(([value,label]) => `<button class="tab-button ${String(value) === String(selected) ? "active" : ""}" aria-pressed="${String(value) === String(selected)}" data-config-key="${key}" data-config-value="${value}">${escapeHtml(label)}</button>`).join("")}</div></div>`;
  }

  function pokemonSetupSettings(config) {
    const generationOptions = [["all",t("common.all")], ...Object.keys(GENERATION_RANGES).map(g => [g,`Gen ${g}`])];
    return `${segmentedSetting("display",t("setup.display"),[["both",t("setup.both")],["image",t("setup.image")],["name",t("setup.name")]],config.display,"03")}
      <div class="setup-setting-card"><div class="setup-setting-title"><span>04</span><h3>${t("setup.generation")}</h3></div><div class="tabs segmented-control generation-control" role="group" aria-label="${t("setup.generation")}">${generationOptions.map(([value,label]) => `<button class="tab-button ${String(value)===String(config.generation)?"active":""}" aria-pressed="${String(value)===String(config.generation)}" data-config-key="generation" data-config-value="${value}">${label}</button>`).join("")}</div></div>`;
  }

  function newSession(mode, config = {}, sequence = null) {
    const lengthValue = config.length === "infinite" ? Infinity : Number(config.length || sequence?.length || 10);
    return {
      mode, config: clone(config), length: sequence ? sequence.length : lengthValue, sequence: sequence ? clone(sequence) : null,
      index: 0, correct: 0, answers: [], wrongQuestions: [], wrongTypes: {}, startedAt: Date.now(), startXp: state.stats.xp,
      answered: false, ended: false, currentSpec: null, usedSignatures: [], usedPokemonIds: [],
      xpEarned: 0, levelUps: [], newUnlocks: [], rewardCelebrated: false,
      reviewPending: mode === "review" && sequence ? unique(sequence.map(questionSignature)) : []
    };
  }

  function startSession(mode) {
    state.lastMode = mode;
    state.lastConfig = clone(state.config[mode]);
    session = newSession(mode, state.config[mode]);
    prepareRouteMotion(state.route, "session", "forward");
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
    prepareRouteMotion(state.route, "session", "forward"); state.route = "session"; saveState(); updateNavigation(); renderQuestion();
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
    prepareRouteMotion(state.route, "session", "forward"); state.route = "session"; saveState(); updateNavigation(); renderQuestion();
  }

  function startReviewSession(specs) {
    if (!specs?.length) return;
    session = newSession("review", { length: specs.length }, specs);
    prepareRouteMotion(state.route, "session", "forward"); state.route = "session"; saveState(); updateNavigation(); renderQuestion();
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

  function renderSessionLoading() {
    if (!session) return;
    view.innerHTML = `<section class="panel quiz-session-panel session-loading-panel" aria-busy="true">${sessionHeader()}<div class="loading-state-card"><span class="loading-orbit" aria-hidden="true"><i></i></span><h1>${t("session.loadingPokemon")}</h1><p>${t("session.loadingHint")}</p></div></section>`;
  }

  async function renderQuestion() {
    if (!session) { setRoute("home"); return; }
    if (session.index >= session.length || (session.sequence && session.index >= session.sequence.length)) { finishSession(); return; }
    session.answered = false;
    if (!session.sequence && session.mode === "pokemon") renderSessionLoading();
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
    const visual = modeVisual(session.mode);
    return `<header class="session-command-bar">
      <div class="session-mode-identity"><span>${visual.icon}</span><div><small>${t("session.activeMode")}</small><strong>${escapeHtml(modeName(session.mode))}</strong></div></div>
      <div class="session-progress-block"><div><strong>${label}</strong><span>${progress}%</span></div><div class="session-progress"><span style="width:${progress}%"></span></div></div>
      <div class="session-live-score"><small>${t("session.correctLive")}</small><strong>✓ ${session.correct}</strong></div>
    </header>`;
  }

  function sessionFooter() {
    return `<div id="feedback" class="feedback"></div><div class="actions session-actions"><button id="primaryAction" class="primary-button">${t("common.check")}</button><button id="finishSession" class="secondary-button">${t("common.finish")}</button></div>`;
  }

  function hintHtml(key,title,text) {
    if (state.seenHints[key]) return "";
    state.seenHints[key] = true; saveState();
    return `<div class="hint-card"><span>💡</span><span><strong>${escapeHtml(title)}</strong><br>${escapeHtml(text)}</span><button class="hint-close" aria-label="${t("common.close")}">×</button></div>`;
  }
  function bindHintClose() {
    document.querySelector(".hint-close")?.addEventListener("click", event => {
      const card = event.currentTarget.closest(".hint-card");
      if (!card) return;
      if (!motionEnabled()) { card.remove(); return; }
      card.classList.add("is-dismissing");
      setTimeout(() => card.remove(), 190);
    });
  }

  function renderEffectivenessQuestion(spec) {
    const effective = spec.questionKind === "effective";
    spec.selected = new Set();
    view.innerHTML = `<section class="panel quiz-session-panel">${sessionHeader()}${hintHtml("effectiveness",t("session.multiHint"),t("session.multiHintText"))}
      <div class="quiz-question-stage">
        <div class="quiz-head"><p class="quiz-kicker">${t("session.chooseAnswer")}</p><h1>${t("session.effectQuestion",{relation:effective?t("session.veryEffective"):t("session.notEffective")})}</h1><p>${spec.correctTargets.length===1?t("session.answerCountOne"):t("session.answerCountMany",{count:spec.correctTargets.length})}</p><div class="type-prompt question-type-prompt">${typeChip(spec.attackingType,"large")}</div></div>
        <div class="answer-grid">${spec.options.map(type=>`<button class="answer-button" data-answer="${type}" aria-pressed="false">${typeChip(type)}</button>`).join("")}</div>
      </div>${sessionFooter()}</section>`;
    document.querySelectorAll("[data-answer]").forEach(button => button.addEventListener("click",()=>{
      if(session.answered)return; const type=button.dataset.answer; haptic("selection");
      if(spec.selected.has(type)){spec.selected.delete(type);button.classList.remove("selected");button.setAttribute("aria-pressed","false");}else{spec.selected.add(type);button.classList.add("selected");button.setAttribute("aria-pressed","true");}
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
    document.querySelectorAll("[data-answer]").forEach(button=>{const type=button.dataset.answer;button.classList.add("is-locked");button.setAttribute("aria-disabled","true");if(spec.correctTargets.includes(type))button.classList.add("correct");else if(spec.selected.has(type))button.classList.add("incorrect");});
    recordQuestion(correct,unique([spec.attackingType,...errorTypes]),selected);
    const details=spec.correctTargets.map(type=>`${typeChip(type,"small")} ${formatMultiplier(effectiveness(spec.attackingType,[type]))}`).join(" ");
    showFeedback(correct?"success":"error",correct?`${t("session.right")} ${typeChip(spec.attackingType,"small")}`:`${t("session.notQuite")} ${t("session.correctTypes",{types:details})}<div class="explanation">${effectivenessExplanation(spec)}</div>`);
    haptic(correct?"success":"error"); activateNextButton();
  }

  function effectivenessExplanation(spec) {
    return spec.correctTargets.map(target=>`${typeLabel(spec.attackingType)} → ${typeLabel(target)}: ${formatMultiplier(effectiveness(spec.attackingType,[target]))}`).join(" · ");
  }

  function renderMultiplierQuestion(spec) {
    spec.assignments=Object.fromEntries(TYPES.map(type=>[type,null])); spec.selectedType=null;
    const buckets=[0,.25,.5,1,2,4];
    view.innerHTML=`<section class="panel quiz-session-panel multiplier-panel">${sessionHeader()}${hintHtml("multiplier",t("session.sortHint"),t("session.sortHintText"))}
      <div class="quiz-question-stage multiplier-question-stage">
        <div class="quiz-head"><p class="quiz-kicker">${t("session.sortTypes")}</p><h1>${t("session.multiplierQuestion")}</h1><p>${t("session.multiplierSubtitle")}</p><div class="defender-types question-type-prompt">${spec.defendingTypes.map(type=>typeChip(type,"large")).join("")}</div></div>
        <div class="bucket-grid">${buckets.map(value=>`<button class="bucket" data-bucket="${value}" aria-label="${escapeHtml(t("session.assignTo",{value:formatMultiplier(value)}))}"><span class="bucket-title">${formatMultiplier(value)}</span><span class="bucket-items"></span></button>`).join("")}</div>
        <div class="type-pool" data-unassigned-pool="true"><div class="pool-heading"><strong>${t("session.unassigned")}</strong><span id="remainingCount"></span></div><div class="type-pool-items"></div></div>
      </div>${sessionFooter()}</section>`;
    refreshMultiplierBoard(spec);
    document.querySelectorAll("[data-bucket]").forEach(bucket=>bucket.addEventListener("click",event=>{
      if(session.answered||!spec.selectedType||event.target.closest(".type-chip"))return;
      assignMultiplierType(spec,spec.selectedType,Number(bucket.dataset.bucket));
    }));
    document.getElementById("primaryAction").addEventListener("click",()=>checkMultiplier(spec)); bindFinishButton(); bindHintClose();
  }

  function assignMultiplierType(spec,type,bucketValue) {
    if(session.answered||!TYPES.includes(type))return;
    spec.assignments[type]=bucketValue;
    spec.selectedType=null;
    haptic("move");
    refreshMultiplierBoard(spec);
    const movedChip = document.querySelector(`.multiplier-panel .type-chip[data-type="${type}"]`);
    if (movedChip && motionEnabled()) {
      movedChip.classList.add("just-moved");
      movedChip.addEventListener("animationend", () => movedChip.classList.remove("just-moved"), { once: true });
    }
  }

  function multiplierDropTargetAt(clientX,clientY) {
    const element=document.elementFromPoint(clientX,clientY);
    const bucket=element?.closest?.("[data-bucket]");
    if(bucket)return {element:bucket,value:Number(bucket.dataset.bucket)};
    const pool=element?.closest?.("[data-unassigned-pool]");
    if(pool)return {element:pool,value:null};
    return null;
  }

  function bindMultiplierChip(spec,chip,type) {
    let pointerState=null;
    let suppressClick=false;
    chip.setAttribute("role","button");
    chip.setAttribute("tabindex","0");
    chip.setAttribute("aria-pressed",String(spec.selectedType===type));
    chip.setAttribute("aria-label",t("session.typeInteraction",{type:typeLabel(type)}));

    const toggleSelection=()=>{
      if(session.answered)return;
      spec.selectedType=spec.selectedType===type?null:type;
      haptic("selection");
      refreshMultiplierBoard(spec);
    };

    chip.addEventListener("click",event=>{
      event.stopPropagation();
      if(suppressClick)return;
      toggleSelection();
    });
    chip.addEventListener("keydown",event=>{
      if(event.key!=="Enter"&&event.key!==" ")return;
      event.preventDefault();
      toggleSelection();
    });

    const clearDropTarget=()=>{
      document.querySelectorAll(".bucket.is-drop-target,.type-pool.is-drop-target").forEach(item=>item.classList.remove("is-drop-target"));
    };
    const updateDropTarget=()=>{
      if(!pointerState)return;
      clearDropTarget();
      pointerState.target=multiplierDropTargetAt(pointerState.clientX,pointerState.clientY);
      pointerState.target?.element.classList.add("is-drop-target");
    };
    const runDragAutoScroll=()=>{
      if(!pointerState?.dragging)return;
      const edge=Math.min(96,Math.max(62,window.innerHeight*.16));
      let delta=0;
      if(pointerState.clientY<edge)delta=-Math.ceil((edge-pointerState.clientY)/edge*18);
      else if(pointerState.clientY>window.innerHeight-edge)delta=Math.ceil((pointerState.clientY-(window.innerHeight-edge))/edge*18);
      if(delta){window.scrollBy(0,delta);updateDropTarget();}
      pointerState.scrollFrame=requestAnimationFrame(runDragAutoScroll);
    };
    const cleanupPointerDrag=()=>{
      clearDropTarget();
      if(pointerState?.scrollFrame)cancelAnimationFrame(pointerState.scrollFrame);
      pointerState?.ghost?.remove();
      chip.classList.remove("is-dragging");
      document.body.classList.remove("multiplier-drag-active");
      pointerState=null;
    };

    chip.addEventListener("pointerdown",event=>{
      if(session.answered||(event.pointerType==="mouse"&&event.button!==0))return;
      pointerState={id:event.pointerId,startX:event.clientX,startY:event.clientY,clientX:event.clientX,clientY:event.clientY,dragging:false,ghost:null,target:null,scrollFrame:null};
      try{chip.setPointerCapture(event.pointerId);}catch(_){ }
    });
    chip.addEventListener("pointermove",event=>{
      if(!pointerState||pointerState.id!==event.pointerId)return;
      pointerState.clientX=event.clientX;pointerState.clientY=event.clientY;
      const distance=Math.hypot(event.clientX-pointerState.startX,event.clientY-pointerState.startY);
      if(!pointerState.dragging&&distance<7)return;
      event.preventDefault();
      if(!pointerState.dragging){
        pointerState.dragging=true;
        pointerState.ghost=chip.cloneNode(true);
        pointerState.ghost.classList.add("multiplier-drag-ghost");
        pointerState.ghost.removeAttribute("tabindex");
        pointerState.ghost.removeAttribute("role");
        document.body.appendChild(pointerState.ghost);
        chip.classList.add("is-dragging");
        document.body.classList.add("multiplier-drag-active");
        pointerState.scrollFrame=requestAnimationFrame(runDragAutoScroll);
        haptic("selection");
      }
      pointerState.ghost.style.transform=`translate3d(${event.clientX}px,${event.clientY}px,0)`;
      updateDropTarget();
    });
    chip.addEventListener("pointerup",event=>{
      if(!pointerState||pointerState.id!==event.pointerId)return;
      if(pointerState.dragging){
        event.preventDefault();
        suppressClick=true;
        const target=pointerState.target||multiplierDropTargetAt(event.clientX,event.clientY);
        cleanupPointerDrag();
        setTimeout(()=>{suppressClick=false;},0);
        if(target)assignMultiplierType(spec,type,target.value);
        return;
      }
      cleanupPointerDrag();
    });
    chip.addEventListener("pointercancel",cleanupPointerDrag);
    chip.addEventListener("lostpointercapture",()=>{if(pointerState?.dragging)cleanupPointerDrag();});
  }

  function refreshMultiplierBoard(spec) {
    document.querySelectorAll(".bucket-items").forEach(item=>item.innerHTML="");
    const pool=document.querySelector(".type-pool-items"); if(!pool)return; pool.innerHTML="";
    TYPES.forEach(type=>{
      const temp=document.createElement("div"); temp.innerHTML=typeChip(type,"small"); const chip=temp.firstElementChild;
      if(spec.selectedType===type)chip.classList.add("is-selected");
      bindMultiplierChip(spec,chip,type);
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
    document.querySelectorAll(".bucket .type-chip").forEach(chip=>{const type=chip.dataset.type;chip.classList.add("is-locked");chip.setAttribute("aria-disabled","true");chip.classList.add(spec.assignments[type]===effectiveness(type,spec.defendingTypes)?"is-correct":"is-wrong");});
    document.querySelectorAll(".multiplier-panel [data-bucket]").forEach(bucket=>{bucket.classList.add("is-locked");bucket.setAttribute("aria-disabled","true");});
    recordQuestion(correct,spec.defendingTypes,clone(spec.assignments));
    const formulas=wrong.slice(0,5).map(type=>multiplierFormula(type,spec.defendingTypes)).join("");
    showFeedback(correct?"success":"error",correct?t("session.allCorrect"):`${t("session.correctCount",{correct:18-wrong.length})} ${t("session.wrongAssigned",{types:wrong.map(type=>typeChip(type,"small")).join(" ")})}${formulas?`<div class="explanation">${formulas}</div>`:""}`);
    haptic(correct?"success":"error"); activateNextButton();
  }

  function multiplierFormula(attacker,defenders) {
    const values=defenders.map(def=>TYPE_CHART[attacker]?.[def]??1);
    const result=values.reduce((a,b)=>a*b,1);
    return `<div class="formula">${typeChip(attacker,"small")} ${values.map(formatMultiplier).join(" × ")} = ${formatMultiplier(result)}</div>`;
  }

  function renderImpactQuestion(spec) {
    spec.selectedMultiplier = null;
    view.innerHTML = `<section class="panel quiz-session-panel">${sessionHeader()}${hintHtml("impact",t("session.impactHint"),t("session.impactHintText"))}
      <div class="quiz-question-stage">
        <div class="quiz-head"><p class="quiz-kicker">${t("session.calculateImpact")}</p><h1>${t("session.impactQuestion")}</h1><p>${t("session.impactSubtitle")}</p>
        <div class="matchup-display"><div><small>${t("learn.attackType")}</small>${typeChip(spec.attackingType,"large")}</div><span class="matchup-arrow">→</span><div><small>${t("learn.defendingType")}</small><div class="defender-types compact">${spec.defendingTypes.map(type=>typeChip(type,"large")).join("")}</div></div></div></div>
        <div class="multiplier-options">${spec.options.map(value=>`<button class="multiplier-option" data-impact-value="${value}" aria-pressed="false"><strong>${formatMultiplier(value)}</strong><small>${impactOptionLabel(value)}</small></button>`).join("")}</div>
      </div>${sessionFooter()}</section>`;
    document.querySelectorAll("[data-impact-value]").forEach(button=>button.addEventListener("click",()=>{
      if(session.answered)return;
      spec.selectedMultiplier=Number(button.dataset.impactValue);
      document.querySelectorAll("[data-impact-value]").forEach(item=>{const selected=item===button;item.classList.toggle("selected",selected);item.setAttribute("aria-pressed",String(selected));});
      haptic("selection");
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
      button.classList.add("is-locked");button.setAttribute("aria-disabled","true");
      if(value===spec.correctMultiplier)button.classList.add("correct");
      else if(value===spec.selectedMultiplier)button.classList.add("incorrect");
    });
    recordQuestion(correct,unique([spec.attackingType,...spec.defendingTypes]),spec.selectedMultiplier);
    const formula=multiplierFormula(spec.attackingType,spec.defendingTypes);
    showFeedback(correct?"success":"error",`${correct?t("session.right"):t("session.notQuite")} ${t("session.impactResult",{result:formatMultiplier(spec.correctMultiplier)})}<div class="explanation">${formula}</div>`);
    haptic(correct?"success":"error");activateNextButton();
  }

  async function renderPokemonQuestion(spec) {
    spec.selected=new Set();
    const showImage=spec.display!=="name";
    const imageOnly=spec.display==="image";
    const showName=!imageOnly || !navigator.onLine;
    view.innerHTML=`<section class="panel quiz-session-panel pokemon-stage">${sessionHeader()}${hintHtml("pokemon",t("session.pokemonHint"),t("session.pokemonHintText"))}
      <div class="quiz-question-stage pokemon-question-stage">
        <div class="quiz-head"><p class="quiz-kicker">${t("session.identifyType")}</p><h1>${t("session.pokemonQuestion")}</h1><p>${t("session.chooseOneTwo")}</p></div>
        ${showImage?`<div class="pokemon-frame"><img class="pokemon-art" src="${escapeHtml(spec.pokemon.image)}" alt="${escapeHtml(spec.pokemon.name)}"><span class="pokemon-placeholder" hidden>?</span></div>`:""}
        ${(showName||imageOnly)?`<h2 class="pokemon-name${imageOnly?" pokemon-name-fallback":""}"${showName?"":" hidden"}>${escapeHtml(spec.pokemon.name)}</h2>`:""}
        <div class="type-picker">${TYPES.map(type=>`<button class="type-option" data-pokemon-type="${type}" aria-pressed="false">${typeChip(type)}</button>`).join("")}</div>
      </div>${sessionFooter()}</section>`;
    const image=document.querySelector(".pokemon-art");
    if(image)image.addEventListener("error",()=>{
      document.querySelector(".pokemon-placeholder")?.setAttribute("hidden","");
      const fallbackName=document.querySelector(".pokemon-name-fallback");
      if(fallbackName)fallbackName.hidden=false;
    });
    document.querySelectorAll("[data-pokemon-type]").forEach(button=>button.addEventListener("click",()=>{
      if(session.answered)return; const type=button.dataset.pokemonType; haptic("selection");
      if(spec.selected.has(type)){spec.selected.delete(type);button.classList.remove("selected");button.setAttribute("aria-pressed","false");return;}
      if(spec.selected.size>=2)return; spec.selected.add(type);button.classList.add("selected");button.setAttribute("aria-pressed","true");
    }));
    document.getElementById("primaryAction").addEventListener("click",()=>checkPokemon(spec)); bindFinishButton(); bindHintClose();
  }

  function checkPokemon(spec) {
    if(session.answered)return;
    if(!spec.selected.size){showFeedback("neutral",t("session.chooseFirst"));return;}
    session.answered=true;
    const expected=spec.pokemon.types; const selected=[...spec.selected];
    const correct=selected.length===expected.length&&selected.every(type=>expected.includes(type));
    document.querySelectorAll("[data-pokemon-type]").forEach(button=>{const type=button.dataset.pokemonType;button.classList.add("is-locked");button.setAttribute("aria-disabled","true");if(expected.includes(type))button.classList.add("correct");else if(spec.selected.has(type))button.classList.add("incorrect");});
    recordQuestion(correct,expected,selected);
    showFeedback(correct?"success":"error",correct?`${t("session.right")} ${escapeHtml(spec.pokemon.name)}`:`${t("session.correctTypes",{types:expected.map(type=>typeChip(type)).join(" ")})}`);
    haptic(correct?"success":"error"); activateNextButton();
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
    state.stats.achievements[id]=new Date().toISOString(); enqueueToast(achievement.icon,t("toast.achievement"),t(achievement.titleKey),"unlock");
  }

  function showFeedback(kind,html){const box=document.getElementById("feedback");if(!box)return;box.className="feedback";void box.offsetWidth;box.className=`feedback visible ${kind}`;box.innerHTML=html;}
  function activateNextButton(){const button=document.getElementById("primaryAction");if(!button)return;const last=Number.isFinite(session.length)&&session.index+1>=session.length;const end=session.sequence&&session.index+1>=session.sequence.length;button.textContent=last||end?t("common.results"):t("common.next");button.classList.add("is-ready");button.setAttribute("aria-live","polite");button.onclick=advanceQuestion;}
  function advanceQuestion(){prepareRouteMotion("session","session","forward");session.index+=1;renderQuestion();}
  function requestFinishSession() {
    if (!session?.answers.length) { session=null; setRoute("home"); return; }
    showConfirmDialog({ title:t("session.leaveTitle"), message:t("session.leaveConfirm"), confirmLabel:t("session.finishNow"), cancelLabel:t("session.keepTraining"), kind:"warning", icon:"?", onConfirm:finishSession });
  }
  function requestExitSession(destination = "home") {
    if (!session?.answers.length) { session=null; setRoute(destination); return; }
    showConfirmDialog({ title:t("session.exitTitle"), message:t("session.exitConfirm"), confirmLabel:t("session.exitAction"), cancelLabel:t("session.keepTraining"), kind:"danger", icon:"!", onConfirm:()=>{ session=null; setRoute(destination); } });
  }
  function bindFinishButton(){document.getElementById("finishSession")?.addEventListener("click",requestFinishSession);}

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
    saveState();prepareRouteMotion(state.route,"summary","forward");state.route="summary";saveState();renderSummary();
  }

  function completeDaily(rate,duration){const today=todayKey();if(!state.daily.completed){const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);const yesterdayKey=`${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;state.daily.streak=state.daily.lastCompletedDate===yesterdayKey?state.daily.streak+1:1;state.daily.lastCompletedDate=today;state.daily.completed=true;state.daily.result={rate,duration};addXp(100);unlockAchievement("daily_first",true);}else state.daily.result={rate,duration};}

  function summaryVerdict(rate) {
    if (rate === 100) return { icon: "★", title: t("summary.verdictPerfect"), text: t("summary.verdictPerfectText") };
    if (rate >= 80) return { icon: "↑", title: t("summary.verdictGreat"), text: t("summary.verdictGreatText") };
    if (rate >= 60) return { icon: "✓", title: t("summary.verdictGood"), text: t("summary.verdictGoodText") };
    return { icon: "↻", title: t("summary.verdictPractice"), text: t("summary.verdictPracticeText") };
  }

  function renderSummary() {
    if(!session){setRoute("home");return;}
    const total=session.answers.length;
    const rate=percent(session.correct,total);
    const xpEarned=state.stats.xp-session.startXp;
    const wrongTypes=Object.entries(session.wrongTypes).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const canReview=session.mode!=="review"&&session.wrongQuestions.length>0;
    const reviewComplete=session.mode==="review"&&session.reviewPending.length===0;
    const verdict=summaryVerdict(rate);
    const visual=modeVisual(session.mode);
    const duration=Math.max(1,Math.round((Date.now()-session.startedAt)/1000));
    const levelInfo=getLevelInfo();
    const gainedLevels=session.levelUps||[];
    const unlockCount=(session.newUnlocks||[]).length;
    const didLevelUp=gainedLevels.length>0;

    view.innerHTML=`<section class="summary-shell">
      <section class="summary-hero-card">
        <div class="summary-mode-pill"><span>${visual.icon}</span><strong>${escapeHtml(modeName(session.mode))}</strong></div>
        <div class="summary-hero-grid">
          <div class="summary-verdict"><span class="summary-verdict-icon">${verdict.icon}</span><p class="quiz-kicker">${t("summary.kicker")}</p><h1>${escapeHtml(verdict.title)}</h1><p>${reviewComplete?t("summary.reviewComplete"):verdict.text}</p></div>
          <div class="summary-score motion-summary-score" style="--score:${rate}%"><span>${rate}%</span></div>
        </div>
        <div class="summary-answer-line">${t("summary.answers",{correct:session.correct,total})}</div>
      </section>

      <section class="summary-metric-grid">
        <article><small>${t("summary.xp")}</small><strong>+${Math.max(0,xpEarned)} XP</strong></article>
        <article><small>${t("summary.duration")}</small><strong>${formatDuration(duration)}</strong></article>
        <article><small>${t("summary.streak")}</small><strong>${state.stats.streak}</strong></article>
        <article><small>${t("summary.errors")}</small><strong>${session.wrongQuestions.length}</strong></article>
      </section>

      <section class="summary-xp-card ${didLevelUp?"level-up":""}">
        <div class="summary-xp-badge">${didLevelUp?"↑":"XP"}</div>
        <div class="summary-xp-content">
          <div class="summary-xp-heading"><span><small>${didLevelUp?t("summary.levelUp"):t("summary.xpProgress")}</small><strong>${didLevelUp?t("summary.levelReached",{level:levelInfo.current.level}):escapeHtml(t(levelInfo.current.key))}</strong></span><b>Lv. ${levelInfo.current.level}</b></div>
          <div class="summary-xp-track" aria-label="${levelInfo.progress}%"><i style="width:${levelInfo.progress}%"></i></div>
          <p>${levelInfo.next?t("profile.nextLevel",{count:Math.max(0,levelInfo.next.xp-state.stats.xp),level:levelInfo.next.level}):t("profile.maxLevelText")}${unlockCount?` · ${t("summary.newUnlocks",{count:unlockCount})}`:""}</p>
        </div>
      </section>

      ${wrongTypes.length?`<section class="summary-focus-card"><div><p class="quiz-kicker">${t("summary.nextFocus")}</p><h2>${t("summary.focus")}</h2><p>${t("summary.thisSession")}</p></div><div class="summary-focus-types">${wrongTypes.map(([type,count])=>`<span>${typeChip(type)}<strong>${count}×</strong></span>`).join("")}</div></section>`:""}

      <section class="summary-actions-card">
        <div><small>${t("summary.nextStep")}</small><strong>${canReview?t("summary.reviewRecommendation"):t("summary.keepTraining")}</strong></div>
        <div class="actions summary-actions">${canReview?`<button id="reviewErrors" class="primary-button">${t("summary.review")}</button>`:""}${session.mode!=="review"&&["effectiveness","multiplier","impact","pokemon"].includes(session.mode)?`<button id="repeatSession" class="secondary-button">${t("summary.repeat")}</button>`:""}<button id="goHome" class="ghost-button">${t("summary.home")}</button></div>
      </section>
    </section>`;
    if(didLevelUp&&!session.rewardCelebrated){session.rewardCelebrated=true;haptic("level");enqueueToast("⬆",t("toast.level",{level:levelInfo.current.level}),unlockCount?t("toast.unlocks",{count:unlockCount}):t(levelInfo.current.key),"level");}
    document.getElementById("reviewErrors")?.addEventListener("click",()=>startReviewSession(session.wrongQuestions));
    document.getElementById("repeatSession")?.addEventListener("click",()=>startSession(session.mode));
    document.getElementById("goHome").addEventListener("click",()=>{session=null;setRoute("train");});
  }

  function renderLearn() {
    learnType=null;
    const explored = TYPES.filter(type => state.stats.types[type].total > 0).length;
    const mastered = TYPES.filter(type => {
      const stats = state.stats.types[type];
      return stats.total >= 8 && percent(stats.correct, stats.total) >= 80;
    }).length;
    const typeAnswers = TYPES.reduce((sum,type)=>sum+state.stats.types[type].total,0);
    const typeCorrect = TYPES.reduce((sum,type)=>sum+state.stats.types[type].correct,0);
    const knowledgeRate = percent(typeCorrect,typeAnswers);

    view.innerHTML=`<section class="learn-page">
      <section class="learn-hero">
        <div class="learn-hero-copy">
          <p class="quiz-kicker">${t("learn.kicker")}</p>
          <h1>${t("learn.title")}</h1>
          <p>${t("learn.subtitle")}</p>
        </div>
        <div class="learn-hero-metrics">
          <article><small>${t("learn.allTypes")}</small><strong>${TYPES.length}</strong></article>
          <article><small>${t("learn.explored")}</small><strong>${explored}</strong></article>
          <article><small>${t("learn.mastered")}</small><strong>${mastered}</strong></article>
          <article><small>${t("learn.knowledgeRate")}</small><strong>${knowledgeRate}%</strong></article>
        </div>
      </section>

      <section class="learn-workspace panel">
        <div class="learn-workspace-head">
          <div><p class="quiz-kicker">${t("learn.workspaceKicker")}</p><h2>${state.learnTab==="lab"?t("learn.labTitle"):t("learn.lexiconTitle")}</h2></div>
          <div class="tabs learn-tabs" role="tablist" style="--tab-count:2">
            <button class="tab-button ${state.learnTab==="lexicon"?"active":""}" role="tab" aria-selected="${state.learnTab==="lexicon"}" data-learn-tab="lexicon">${t("learn.lexicon")}</button>
            <button class="tab-button ${state.learnTab==="lab"?"active":""}" role="tab" aria-selected="${state.learnTab==="lab"}" data-learn-tab="lab">${t("learn.lab")}</button>
          </div>
        </div>
        <div id="learnContent"></div>
      </section>
    </section>`;
    document.querySelectorAll("[data-learn-tab]").forEach(button=>button.addEventListener("click",()=>{state.learnTab=button.dataset.learnTab;saveState();renderLearn();}));
    if(state.learnTab==="lab")renderTypeLab();else renderLexicon();
  }

  function typeKnowledgeLabel(stats){
    if(!stats.total)return t("learn.statusNew");
    const rate=percent(stats.correct,stats.total);
    if(stats.total>=8&&rate>=80)return t("learn.statusMastered");
    if(rate>=65)return t("learn.statusSolid");
    return t("learn.statusPractice");
  }

  function renderLexicon() {
    const content=document.getElementById("learnContent");
    content.innerHTML=`
      <div class="learn-content-intro"><div><h3>${t("learn.lexiconIntroTitle")}</h3><p>${t("learn.lexiconIntro")}</p></div><span>${TYPES.length} ${t("learn.typesLabel")}</span></div>
      <div class="type-library-grid">${TYPES.map(type=>{
        const s=state.stats.types[type];
        const rate=percent(s.correct,s.total);
        const attack=groupByMultiplier(TYPES,target=>effectiveness(type,[target]));
        const defense=groupByMultiplier(TYPES,attacker=>effectiveness(attacker,[type]));
        const meta=TYPE_META[type];
        return `<button class="type-library-card" data-learn-type="${type}" style="--type-color:${meta.color}">
          <span class="type-library-accent" aria-hidden="true"></span>
          <span class="type-library-top">${typeChip(type)}<span class="type-library-arrow" aria-hidden="true">›</span></span>
          <span class="type-library-status"><strong>${escapeHtml(typeKnowledgeLabel(s))}</strong><small>${s.total?t("learn.typeAccuracy",{rate,total:s.total}):t("learn.noData")}</small></span>
          <span class="type-library-facts">
            <span><small>${t("learn.strongAgainst")}</small><strong>${attack[2]?.length||0}</strong></span>
            <span><small>${t("learn.vulnerable")}</small><strong>${defense[2]?.length||0}</strong></span>
          </span>
          <span class="type-library-progress"><i style="width:${s.total?rate:0}%"></i></span>
        </button>`;
      }).join("")}</div>`;
    document.querySelectorAll("[data-learn-type]").forEach(button=>button.addEventListener("click",()=>{learnType=button.dataset.learnType;setRoute("learn-detail");}));
  }

  function groupByMultiplier(types,resolver){const groups={0:[],0.5:[],1:[],2:[]};types.forEach(type=>{const value=resolver(type);if(!groups[value])groups[value]=[];groups[value].push(type);});return groups;}
  function renderLearnDetail() {
    if(!learnType){setRoute("learn");return;}
    const attack=groupByMultiplier(TYPES,target=>effectiveness(learnType,[target]));
    const defense=groupByMultiplier(TYPES,attacker=>effectiveness(attacker,[learnType]));
    const s=state.stats.types[learnType];
    const rate=percent(s.correct,s.total);
    const memory=memoryAid(learnType,attack,defense);
    const meta=TYPE_META[learnType];
    view.innerHTML=`<section class="type-detail-page" style="--type-color:${meta.color}">
      <section class="type-detail-hero">
        <div class="type-detail-identity">
          <div class="type-detail-symbol">${meta.icon}</div>
          <div><p class="quiz-kicker">${t("learn.detailKicker")}</p><h1>${escapeHtml(typeLabel(learnType))}</h1><p>${escapeHtml(typeKnowledgeLabel(s))} · ${s.total?t("learn.typeAccuracy",{rate,total:s.total}):t("learn.noData")}</p></div>
        </div>
        <div class="type-detail-score"><small>${t("learn.personalAccuracy")}</small><strong>${rate}%</strong><span><i style="width:${s.total?rate:0}%"></i></span></div>
      </section>

      <section class="memory-card type-memory-card"><span aria-hidden="true">✦</span><div><small>${t("learn.memory")}</small><strong>${escapeHtml(memory)}</strong></div></section>

      <section class="matchup-overview">
        <article class="matchup-column attack-column">
          <div class="matchup-column-head"><span class="matchup-column-icon">↗</span><div><p class="quiz-kicker">${t("learn.attack")}</p><h2>${t("learn.attackProfile")}</h2><small>${t("learn.attackHint")}</small></div></div>
          ${learnMultiplierGroup("2×",t("learn.strongAgainst"),attack[2],"strong")}
          ${learnMultiplierGroup("½×",t("learn.weakAgainst"),attack[.5],"resist")}
          ${learnMultiplierGroup("0×",t("learn.noEffect"),attack[0],"immune")}
          <div class="neutral-count"><span>${t("learn.neutralAgainst")}</span><strong>${attack[1]?.length||0}</strong></div>
        </article>
        <article class="matchup-column defense-column">
          <div class="matchup-column-head"><span class="matchup-column-icon">◆</span><div><p class="quiz-kicker">${t("learn.defense")}</p><h2>${t("learn.defenseProfile")}</h2><small>${t("learn.defenseHint")}</small></div></div>
          ${learnMultiplierGroup("2×",t("learn.vulnerable"),defense[2],"danger")}
          ${learnMultiplierGroup("½×",t("learn.resists"),defense[.5],"resist")}
          ${learnMultiplierGroup("0×",t("learn.immune"),defense[0],"immune")}
          <div class="neutral-count"><span>${t("learn.neutralDamage")}</span><strong>${defense[1]?.length||0}</strong></div>
        </article>
      </section>
    </section>`;
  }
  function learnMultiplierGroup(multiplier,title,types,tone){return `<div class="matchup-group ${tone}"><div class="matchup-group-label"><span>${multiplier}</span><strong>${escapeHtml(title)}</strong><small>${types?.length||0}</small></div><div class="chip-wrap">${types?.length?types.map(type=>typeChip(type,"small")).join(""):`<span class="empty-matchup">${t("learn.none")}</span>`}</div></div>`;}
  function memoryAid(type,attack,defense){
    const strong=(attack[2]||[]).slice(0,3).map(typeLabel).join(", ");const vulnerable=(defense[2]||[]).slice(0,3).map(typeLabel).join(", ");
    if(state.language==="de")return `${typeLabel(type)} trifft ${strong||"wenige Typen"} stark und muss besonders auf ${vulnerable||"keine typischen Schwächen"} achten.`;
    return `${typeLabel(type)} hits ${strong||"few types"} hard and should watch out for ${vulnerable||"no common weaknesses"}.`;
  }

  function renderTypeLab() {
    const content=document.getElementById("learnContent");
    content.innerHTML=`<section class="type-lab">
      <div class="learn-content-intro"><div><h3>${t("learn.labIntroTitle")}</h3><p>${t("learn.labIntro")}</p></div><span>${t("learn.liveCalculation")}</span></div>
      <div class="lab-builder">
        <div class="lab-selection-card attack-selection"><span class="lab-step">1</span><div class="field"><label>${t("learn.attackType")}</label><select id="labAttack" class="select-control">${typeOptions("fire")}</select></div></div>
        <div class="lab-direction" aria-hidden="true">→</div>
        <div class="lab-defender-stack">
          <div class="lab-selection-card"><span class="lab-step">2</span><div class="field"><label>${t("learn.defendingType")}</label><select id="labDefense1" class="select-control">${typeOptions("grass")}</select></div></div>
          <div class="lab-selection-card optional"><span class="lab-step">+</span><div class="field"><label>${t("learn.secondType")}</label><select id="labDefense2" class="select-control"><option value="">${t("common.none")}</option>${typeOptions("")}</select></div></div>
        </div>
      </div>
      <div class="lab-result modern-lab-result" id="labResult"></div>
    </section>`;
    ["labAttack","labDefense1","labDefense2"].forEach(id=>document.getElementById(id).addEventListener("change",updateLabResult));updateLabResult();
  }
  function typeOptions(selected){return TYPES.map(type=>`<option value="${type}" ${type===selected?"selected":""}>${escapeHtml(typeLabel(type))}</option>`).join("");}
  function updateLabResult(){
    const attack=document.getElementById("labAttack")?.value;const d1=document.getElementById("labDefense1")?.value;const d2=document.getElementById("labDefense2")?.value;if(!attack||!d1)return;
    const defenders=[d1,d2].filter(Boolean);const values=defenders.map(d=>TYPE_CHART[attack]?.[d]??1);const result=values.reduce((a,b)=>a*b,1);
    const tone=result===0?"immune":result<1?"resist":result===1?"neutral":"strong";
    const label=result===0?t("learn.resultImmune"):result<1?t("learn.resultResisted"):result===1?t("learn.resultNeutral"):result>=4?t("learn.resultExtreme"):t("learn.resultEffective");
    document.getElementById("labResult").className=`lab-result modern-lab-result ${tone}`;
    document.getElementById("labResult").innerHTML=`
      <div class="lab-result-main"><small>${t("learn.result")}</small><strong class="result-multiplier">${formatMultiplier(result)}</strong><span>${escapeHtml(label)}</span></div>
      <div class="lab-matchup-visual"><span>${typeChip(attack)}</span><b aria-hidden="true">→</b><span>${defenders.map(type=>typeChip(type)).join(" ")}</span></div>
      <div class="lab-formula-row"><span>${t("learn.breakdown")}</span><strong>${values.map(formatMultiplier).join(" × ")} = ${formatMultiplier(result)}</strong></div>`;
  }
  function renderStats() {
    const tabs=[["overview",t("stats.overview")],["types",t("stats.types")],["errors",t("stats.errors")],["achievements",t("stats.achievements")]];
    const level=getLevelInfo();
    const accuracy=percent(state.stats.correct,state.stats.total);
    const openErrors=state.stats.mistakes.filter(item=>item.status!=="resolved").length;
    view.innerHTML=`<section class="progress-page">
      <section class="progress-hero">
        <div class="progress-hero-copy"><p class="quiz-kicker">${t("stats.hubKicker")}</p><h1>${t("stats.hubTitle")}</h1><p>${t("stats.hubSubtitle")}</p></div>
        <div class="progress-level-card">
          <span class="progress-level-orb">${level.current.level}</span>
          <div><small>${t("stats.level")}</small><strong>${escapeHtml(t(level.current.key))}</strong><span>${state.stats.xp} XP${level.next?` · ${level.next.xp-state.stats.xp} XP ${t("stats.untilNext")}`:""}</span><div class="progress-track"><div class="progress-fill" style="width:${level.progress}%"></div></div></div>
        </div>
        <div class="progress-hero-metrics">
          <span><small>${t("stats.accuracy")}</small><strong>${accuracy}%</strong></span>
          <span><small>${t("stats.bestStreak")}</small><strong>${state.stats.bestStreak}</strong></span>
          <span><small>${t("stats.openErrors")}</small><strong>${openErrors}</strong></span>
        </div>
      </section>
      <div class="progress-tabs tabs" role="tablist" style="--tab-count:4">${tabs.map(([key,label])=>`<button class="tab-button ${state.statsTab===key?"active":""}" role="tab" aria-selected="${state.statsTab===key}" data-stats-tab="${key}">${escapeHtml(label)}</button>`).join("")}</div>
      <div id="statsContent" class="progress-content"></div>
    </section>`;
    document.querySelectorAll("[data-stats-tab]").forEach(button=>button.addEventListener("click",()=>{state.statsTab=button.dataset.statsTab;saveState();renderStats();}));
    if(state.statsTab==="types")renderTypeStats();else if(state.statsTab==="errors")renderMistakes();else if(state.statsTab==="achievements")renderAchievements();else renderStatsOverview();
  }

  function renderStatsOverview() {
    const content=document.getElementById("statsContent");
    const modes=["effectiveness","multiplier","impact","pokemon","weak","daily","review"];
    const recent=state.stats.history.slice(0,8);
    content.innerHTML=`
      <section class="progress-kpi-grid">
        ${progressKpi(iconSvg("answered"),t("stats.answered"),state.stats.total,t("stats.questionsTotal"))}
        ${progressKpi(iconSvg("accuracy"),t("stats.accuracy"),`${percent(state.stats.correct,state.stats.total)}%`,`${state.stats.correct} ${t("common.correct").toLowerCase()}`)}
        ${progressKpi(iconSvg("time"),t("stats.time"),`${Math.round(state.stats.totalSeconds/60)} min`,t("stats.learningTime"))}
        ${progressKpi(iconSvg("sessions"),t("stats.sessions"),state.stats.sessions,t("stats.completedSessions"))}
      </section>
      <section class="progress-overview-grid">
        <div class="progress-overview-main">
          <div class="section-title"><h2>${t("stats.modePerformance")}</h2><p>${t("stats.modePerformanceHint")}</p></div>
          <div class="mode-performance-grid">${modes.map(mode=>modePerformanceCard(mode)).join("")}</div>
        </div>
        <aside class="progress-overview-side">
          <div class="section-title"><h2>${t("stats.nextStep")}</h2><p>${t("stats.personal")}</p></div>
          ${statsRecommendationHtml()}
          <div class="consistency-card">
            <div class="consistency-icon">🔥</div>
            <div><small>${t("stats.currentStreak")}</small><strong>${state.stats.streak} ${t("stats.answersInRow")}</strong><p>${state.stats.bestStreak?`${t("stats.record")}: ${state.stats.bestStreak}`:t("stats.startStreak")}</p></div>
          </div>
        </aside>
      </section>
      <div class="section-title"><h2>${t("stats.lastSessions")}</h2><p>${t("stats.saved",{count:state.stats.history.length})}</p></div>
      <div class="modern-history-list">${recent.length?recent.map((item,index)=>historyCard(item,index)).join(""):`<div class="empty-state-card"><span>◷</span><strong>${t("stats.noSessions")}</strong><p>${t("stats.noSessionsHint")}</p></div>`}</div>`;
    bindRecommendation();
  }

  function progressKpi(icon,label,value,hint){return `<article class="progress-kpi-card"><span class="progress-kpi-icon">${icon}</span><div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><p>${escapeHtml(hint)}</p></div></article>`;}

  function modePerformanceCard(mode){
    const s=state.stats.modes[mode]||blankModeStats();
    const rate=percent(s.correct,s.total);
    const tone=!s.total?"empty":rate>=80?"strong":rate>=55?"solid":"practice";
    return `<article class="mode-performance-card ${tone}"><div class="mode-performance-top"><span>${modeVisual(mode).icon}</span><div><strong>${escapeHtml(modeName(mode))}</strong><small>${s.sessions} ${t("stats.sessionsShort")}</small></div><b>${s.total?`${rate}%`:"–"}</b></div><div class="progress-track"><div class="progress-fill" style="width:${s.total?rate:0}%"></div></div><p>${s.total?`${s.correct}/${s.total} ${t("common.correct").toLowerCase()}`:t("stats.noModeData")}</p></article>`;
  }

  function historyCard(item,index){
    const rate=Number(item.rate)||0;
    const tone=rate>=80?"strong":rate>=55?"solid":"practice";
    return `<article class="modern-history-card ${tone}"><span class="history-rank">${String(index+1).padStart(2,"0")}</span><div class="history-main"><strong>${escapeHtml(modeName(item.mode))}</strong><small>${formatDate(item.date)} · ${formatDuration(item.duration)}</small></div><div class="history-result"><strong>${item.correct}/${item.answers}</strong><span>${rate}%</span></div></article>`;
  }

  function statsRecommendationHtml() {
    const weak = getWeakTypes(1)[0];
    const modeEntries = ["effectiveness","multiplier","impact","pokemon"].map(mode => {
      const values = state.stats.modes[mode];
      return { mode, total: values.total, rate: percent(values.correct, values.total) };
    }).filter(item => item.total >= 3).sort((a,b)=>a.rate-b.rate);
    const weakestMode = modeEntries[0];
    if (!weak && !weakestMode) return `<div class="recommendation-card progress-recommendation"><span class="recommendation-icon">◎</span><div><strong>${t("stats.recommendation")}</strong><p>${t("stats.recommendationEmpty")}</p></div></div>`;
    const mode = weakestMode?.mode || "effectiveness";
    const typeText = weak ? typeLabel(weak.type) : t("common.none");
    return `<button class="recommendation-card interactive progress-recommendation" id="startRecommendation"><span class="recommendation-icon">↗</span><div><small>${t("stats.recommended")}</small><strong>${escapeHtml(modeName(mode))}</strong><p>${t("stats.recommendationText",{mode:modeName(mode),type:typeText})}</p></div><span class="arrow">›</span></button>`;
  }

  function bindRecommendation() {
    const button=document.getElementById("startRecommendation");
    if(!button)return;
    const entries=["effectiveness","multiplier","impact","pokemon"].map(mode=>({mode,total:state.stats.modes[mode].total,rate:percent(state.stats.modes[mode].correct,state.stats.modes[mode].total)})).filter(item=>item.total>=3).sort((a,b)=>a.rate-b.rate);
    button.addEventListener("click",()=>setRoute(`setup-${entries[0]?.mode||"effectiveness"}`));
  }

  function renderTypeStats() {
    const content=document.getElementById("statsContent");
    const items=TYPES.map(type=>{const s=state.stats.types[type];const rate=percent(s.correct,s.total);const recentRate=s.recent.length?percent(s.recent.filter(Boolean).length,s.recent.length):rate;const trend=recentRate>rate+5?"up":recentRate<rate-5?"down":"same";return{type,...s,rate,trend};}).sort((a,b)=>{if(!a.total&&b.total)return 1;if(a.total&&!b.total)return-1;return a.rate-b.rate||b.total-a.total;});
    const explored=items.filter(item=>item.total>0).length;
    const mastered=items.filter(item=>item.total>=5&&item.rate>=80).length;
    const practice=items.filter(item=>item.total>=3&&item.rate<60).length;
    content.innerHTML=`
      <section class="type-progress-summary">
        ${progressKpi("◇",t("stats.exploredTypes"),`${explored}/18`,t("stats.typeOverview"))}
        ${progressKpi("★",t("stats.masteredTypes"),mastered,t("stats.masteredHint"))}
        ${progressKpi("↗",t("stats.practiceTypes"),practice,t("stats.practiceHint"))}
      </section>
      <div class="section-title"><h2>${t("stats.allTypes")}</h2><p>${t("stats.typeHelp")}</p></div>
      <div class="modern-type-stat-grid">${items.map(item=>typeProgressCard(item)).join("")}</div>`;
    document.querySelectorAll("[data-progress-type]").forEach(button=>button.addEventListener("click",()=>{learnType=button.dataset.progressType;setRoute("learn-detail");}));
  }

  function typeProgressCard(item){
    const meta=TYPE_META[item.type];
    const label=!item.total?t("stats.notExplored"):item.rate>=80&&item.total>=5?t("stats.mastered"):item.rate>=60?t("stats.solid"):t("stats.practice");
    const trendIcon=item.trend==="up"?"↑":item.trend==="down"?"↓":"→";
    return `<button class="modern-type-stat-card" data-progress-type="${item.type}" style="--type-color:${meta.color}"><span class="modern-type-stat-top">${typeChip(item.type)}<span class="trend ${item.trend}">${trendIcon}</span></span><span class="modern-type-stat-body"><small>${escapeHtml(label)}</small><strong>${item.total?`${item.rate}%`:"–"}</strong><p>${t("stats.questionsCount",{count:item.total})}</p></span><span class="type-library-progress"><i style="width:${item.total?item.rate:0}%"></i></span></button>`;
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
    const content=document.getElementById("statsContent");
    const open=state.stats.mistakes.filter(item=>item.status!=="resolved").sort((a,b)=>new Date(b.lastSeen)-new Date(a.lastSeen));
    const resolved=state.stats.mistakes.filter(item=>item.status==="resolved").length;
    content.innerHTML=`
      <section class="mistake-book-hero">
        <div><p class="quiz-kicker">${t("stats.errorBook")}</p><h2>${open.length?t("stats.openMistakes",{count:open.length}):t("stats.noOpenMistakes")}</h2><p>${open.length?t("stats.errorHelp"):t("stats.noErrors")}</p></div>
        <div class="mistake-book-summary"><span><small>${t("stats.open")}</small><strong>${open.length}</strong></span><span><small>${t("stats.resolved")}</small><strong>${resolved}</strong></span></div>
        <button id="reviewAllMistakes" class="primary-button" ${open.length?"":"disabled"}>${t("stats.reviewAll")}</button>
      </section>
      <div class="modern-error-list">${open.length?open.map(item=>mistakeCard(item)).join(""):`<div class="empty-state-card success"><span>✓</span><strong>${t("stats.noErrors")}</strong><p>${t("stats.noErrorsHint")}</p></div>`}</div>`;
    document.getElementById("reviewAllMistakes")?.addEventListener("click",()=>{if(open.length)startReviewSession(open.map(item=>clone(item.spec)));});
  }

  function mistakeCard(item){
    const progress=Math.min(2,item.correctReviews||0);
    return `<article class="modern-error-card"><div class="modern-error-head"><span class="error-mode-icon">${modeVisual(item.spec.kind).icon}</span><div><strong>${escapeHtml(mistakeTitle(item))}</strong><small>${escapeHtml(modeName(item.spec.kind))} · ${formatDate(item.lastSeen)}</small></div><span class="error-count">${item.wrongCount}×</span></div><div class="modern-error-answer"><small>${t("stats.correctSolution")}</small><div>${mistakeAnswer(item)}</div></div><div class="review-progress"><span>${t("stats.reviewProgress")}</span><div>${[0,1].map(step=>`<i class="${step<progress?"done":""}"></i>`).join("")}</div><strong>${progress}/2</strong></div></article>`;
  }

  function achievementProgress(id){
    const map={
      first_answer:[Math.min(state.stats.total,1),1],ten_correct:[Math.min(state.stats.correct,10),10],hundred_answers:[Math.min(state.stats.total,100),100],
      streak_5:[Math.min(state.stats.bestStreak,5),5],streak_20:[Math.min(state.stats.bestStreak,20),20],perfect_session:[state.stats.achievements.perfect_session?1:0,1],
      daily_first:[state.daily.completed||state.stats.achievements.daily_first?1:0,1],weakness_session:[state.stats.modes.weak.sessions?1:0,1]
    };
    return map[id]||[0,1];
  }

  function renderAchievements() {
    const content=document.getElementById("statsContent");
    const unlocked=Object.keys(state.stats.achievements).length;
    content.innerHTML=`
      <section class="achievement-summary-card"><div><p class="quiz-kicker">${t("stats.achievementCollection")}</p><h2>${t("stats.achievementsCount",{unlocked,total:ACHIEVEMENTS.length})}</h2><p>${t("stats.achievementHint")}</p></div><div class="achievement-ring" style="--achievement-progress:${Math.round(unlocked/ACHIEVEMENTS.length*100)}"><strong>${unlocked}</strong><small>/ ${ACHIEVEMENTS.length}</small></div></section>
      <div class="modern-achievement-grid">${ACHIEVEMENTS.map(a=>achievementCard(a)).join("")}</div>`;
  }

  function achievementCard(a){
    const date=state.stats.achievements[a.id];
    const [current,target]=achievementProgress(a.id);
    const progress=Math.min(100,Math.round(current/target*100));
    return `<article class="modern-achievement-card ${date?"unlocked":"locked"}"><span class="modern-achievement-icon">${date?a.icon:"◇"}</span><div class="modern-achievement-copy"><span><small>${date?t("stats.unlocked"):t("stats.inProgress")}</small>${date?`<time>${formatDate(date)}</time>`:""}</span><h3>${escapeHtml(t(a.titleKey))}</h3><p>${escapeHtml(t(a.descriptionKey))}</p><div class="achievement-progress"><i style="width:${progress}%"></i></div><strong>${date?t("stats.completed"):`${current}/${target}`}</strong></div></article>`;
  }

  function renderSettings() {
    const dark=actualTheme()==="dark";
    const languageLabel=state.language==="de"?"Deutsch":"English";
    const themeLabel=dark?t("settings.dark"):t("settings.light");
    view.innerHTML=`<section class="settings-page">
      <section class="settings-hero"><div><p class="quiz-kicker">${t("settings.centerKicker")}</p><h1>${t("settings.centerTitle")}</h1><p>${t("settings.centerSubtitle")}</p></div><div class="settings-status-grid"><span><small>${t("settings.language")}</small><strong>${languageLabel}</strong></span><span><small>${t("settings.theme")}</small><strong>${themeLabel}</strong></span><span><small>${t("settings.animations")}</small><strong>${state.animations?t("settings.on"):t("settings.off")}</strong></span></div></section>
      <section class="settings-group"><div class="settings-group-heading"><span>◐</span><div><h2>${t("settings.experience")}</h2><p>${t("settings.experienceHint")}</p></div></div><div class="settings-list modern-settings-list">
        ${settingSelectRow("languageSelect","文",t("settings.language"),t("settings.languageDesc"),`<option value="de" ${state.language==="de"?"selected":""}>Deutsch</option><option value="en" ${state.language==="en"?"selected":""}>English</option>`)}
        ${settingToggleRow("themeToggle","◐",t("settings.theme"),t("settings.themeDesc"),dark)}
        ${settingToggleRow("animationToggle","↝",t("settings.animations"),t("settings.animationsDesc"),state.animations)}
        ${settingToggleRow("hapticToggle","≈",t("settings.haptics"),t("settings.hapticsDesc"),state.haptics)}
      </div></section>
      <section class="settings-group"><div class="settings-group-heading"><span>?</span><div><h2>${t("settings.guidance")}</h2><p>${t("settings.guidanceHint")}</p></div></div><div class="settings-list modern-settings-list">
        ${settingActionRow("restartTutorial","◎",t("settings.tutorial"),t("settings.tutorialDesc"),t("common.start"))}
      </div></section>
      <section class="settings-group"><div class="settings-group-heading"><span>⇄</span><div><h2>${t("settings.dataSupport")}</h2><p>${t("settings.dataSupportHint")}</p></div></div><div class="settings-list modern-settings-list">
        ${settingActionRow("exportProgress","↓",t("settings.export"),t("settings.exportDesc"),"Export")}
        ${settingActionRow("importProgress","↑",t("settings.import"),t("settings.importDesc"),"Import")}
        <input id="importFile" type="file" accept="application/json" hidden>
        ${settingActionRow("exportFeedback","✎",t("settings.feedback"),t("settings.feedbackDesc"),t("settings.createReport"))}
        ${settingActionRow("exportDiagnostics","⌁",t("settings.diagnostics"),t("settings.diagnosticsDesc"),"Export")}
      </div></section>
      <section class="settings-group danger-zone"><div class="settings-group-heading"><span>!</span><div><h2>${t("settings.dangerZone")}</h2><p>${t("settings.dangerZoneHint")}</p></div></div><div class="settings-list modern-settings-list">
        ${settingActionRow("resetProgress","×",t("settings.reset"),t("settings.resetDesc"),t("settings.delete"),true)}
      </div></section>
    </section>`;
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
    document.getElementById("resetProgress").addEventListener("click",()=>showConfirmDialog({ title:t("settings.resetTitle"), message:t("settings.resetConfirm"), confirmLabel:t("settings.resetAction"), cancelLabel:t("common.cancel"), kind:"danger", icon:"×", onConfirm:()=>{ OLD_KEYS.concat(STORAGE_KEY).forEach(key=>localStorage.removeItem(key)); state=clone(defaults); state.language=defaultLanguage; saveState(); renderSettings(); enqueueToast("✓",t("settings.resetDone"),t("settings.resetDoneHint"),"success"); } }));
  }

  function settingSelectRow(id,icon,title,description,options){return `<div class="modern-setting-row"><span class="modern-setting-icon">${icon}</span><div class="modern-setting-copy"><h3>${title}</h3><p>${description}</p></div><select id="${id}" class="select-control">${options}</select></div>`;}
  function settingToggleRow(id,icon,title,description,on){return `<div class="modern-setting-row"><span class="modern-setting-icon">${icon}</span><div class="modern-setting-copy"><h3>${title}</h3><p>${description}</p></div><button id="${id}" class="switch ${on?"on":""}" aria-label="${title}" aria-pressed="${on}"></button></div>`;}
  function settingActionRow(id,icon,title,description,label,danger=false){return `<div class="modern-setting-row"><span class="modern-setting-icon ${danger?"danger":""}">${icon}</span><div class="modern-setting-copy"><h3>${title}</h3><p>${description}</p></div><button id="${id}" class="${danger?"danger-button":"secondary-button"}">${label}</button></div>`;}

  function downloadJson(data, filename) { const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url); }
  function exportProgress(){ const payload={app:"Quizmon",exportVersion:BUILD_VERSION,schema:6,exportedAt:new Date().toISOString(),state}; downloadJson(payload,`Quizmon-Beta-1.0-Fortschritt-${todayKey()}.json`); state.diagnostics.lastBackup=new Date().toISOString(); saveState(); enqueueToast("↓",t("settings.exportDone"),t("settings.exportDoneHint"),"success"); }
  function exportDiagnostics(){ downloadJson({app:"Quizmon",version:"Beta 1.0",build:BUILD_VERSION,createdAt:new Date().toISOString(),route:state.route,language:state.language,userAgent:navigator.userAgent,online:navigator.onLine,diagnostics:state.diagnostics},`Quizmon-Diagnose-${todayKey()}.json`); enqueueToast("↓",t("settings.diagnosticsDone"),t("settings.fileCreated"),"success"); }
  function exportFeedback(){ const report={category:"",description:"",expected:"",steps:"",appVersion:"Beta 1.0",build:BUILD_VERSION,createdAt:new Date().toISOString(),route:state.route,language:state.language,userAgent:navigator.userAgent,recentErrors:state.diagnostics.errors.slice(-5)}; downloadJson(report,`Quizmon-Feedback-${todayKey()}.json`); enqueueToast("↓",t("settings.feedbackDone"),t("settings.fileCreated"),"success"); }
  async function importProgress(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const importButton = document.getElementById("importProgress");
    setButtonBusy(importButton, true, t("import.loading"));
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = parsed.state || parsed;
      const ver = String(incoming.version || parsed.exportVersion || "");
      const currentVersions = [BUILD_VERSION,"1.6-sprint2-v2","1.6-sprint2-v1","1.6-sprint1-v1","1.5-sprint2-v1","1.5-sprint1-v1-fix1","1.5-sprint1-v1","1.4-sprint3-v2","1.4-sprint3-v1","1.4-sprint2-v6","1.4-sprint2-v5","1.4-sprint2-v3","1.4-sprint2-v2","1.4-sprint2-v1","1.4-sprint1-v2","1.4-sprint1-v1","1.3-sprint3-v3","1.3-sprint2-v2","1.3-sprint1-v1","1.2-sprint2-v2","1.2-sprint2-v1","1.2-sprint1-v2","1.2-sprint1-v1","1.0-sprint3-v1","1.0-sprint2-v2","1.0-sprint2","1.0-sprint1","1.0"];
      const alphaVersions = ["0.6.1","0.6"];
      const legacyVersions = ["0.5","0.4","0.3"];
      if (![...currentVersions,...alphaVersions,...legacyVersions].includes(ver)) throw new Error("version");
      const backup = clone(state);
      localStorage.setItem(`${STORAGE_KEY}.backup.${Date.now()}`,JSON.stringify(backup));
      state = [...currentVersions,...alphaVersions].includes(ver) ? repairState(incoming) : repairState(migrateLegacy(incoming));
      state.version = BUILD_VERSION;
      state.route = "settings";
      saveState();
      renderSettings();
      enqueueToast("✓",t("toast.imported"),t("import.successHint"),"success");
    } catch(error) {
      logError(error,"importProgress");
      showMessageDialog({ title:t("import.invalidTitle"), message:t("import.invalid"), buttonLabel:t("common.close"), kind:"error", icon:"!" });
    } finally {
      event.target.value = "";
      setButtonBusy(importButton, false);
    }
  }

  function openOnboarding(page=0){onboardingOpen=true;onboardingPage=page;renderOnboarding(true);}
  function renderOnboarding(forceShell=false){
    const pages=6;
    let backdrop = modalRoot.querySelector(".onboarding-backdrop");
    if(forceShell || !backdrop){
      setModalMarkup(`<div class="modal-backdrop onboarding-backdrop" role="dialog" aria-modal="true"><section class="modal-card onboarding-modal"><div id="onboardingProgress" class="onboarding-progress"></div><div id="onboardingContent"></div><div class="modal-actions"><button id="skipOnboarding" class="ghost-button">${t("common.skip")}</button><button id="nextOnboarding" class="primary-button"></button></div></section></div>`, { closeOnBackdrop: false, closeOnEscape: false, initialFocus: "#nextOnboarding" });
      backdrop = modalRoot.querySelector(".onboarding-backdrop");
    }

    const progress = modalRoot.querySelector("#onboardingProgress");
    const contentRoot = modalRoot.querySelector("#onboardingContent");
    const nextButton = modalRoot.querySelector("#nextOnboarding");
    const skipButton = modalRoot.querySelector("#skipOnboarding");

    let content="";
    if(onboardingPage===0)content=`<div class="onboarding-visual">PT</div><h2>${t("onboarding.welcomeTitle")}</h2><p>${t("onboarding.welcomeText")}</p><div class="language-picks"><button class="language-pick ${state.language==="de"?"active":""}" data-language="de">🇩🇪 Deutsch</button><button class="language-pick ${state.language==="en"?"active":""}" data-language="en">🇬🇧 English</button></div>`;
    else if(onboardingPage===1)content=`<div class="onboarding-visual">×</div><h2>${t("onboarding.basicsTitle")}</h2><p>${t("onboarding.basicsText")}</p><div class="multiplier-guide"><div><strong>0×</strong><small>${t("onboarding.none")}</small></div><div><strong>½×</strong><small>${t("onboarding.half")}</small></div><div><strong>1×</strong><small>${t("onboarding.normal")}</small></div><div><strong>2×</strong><small>${t("onboarding.double")}</small></div><div><strong>4×</strong><small>${t("onboarding.quad")}</small></div></div><div class="formula">${typeChip("fire","small")} 2× × ${typeChip("steel","small")} 2× = 4×</div>`;
    else if(onboardingPage===2)content=`<div class="onboarding-visual">⚔</div><h2>${t("onboarding.effectTitle")}</h2><p>${t("onboarding.effectText")}</p><div class="demo-question"><div class="type-prompt">${typeChip("fire","large")}</div><div class="demo-options">${["water","grass","dragon","fire"].map(type=>`<button class="demo-option" data-demo-effect="${type}">${typeChip(type)}</button>`).join("")}</div><div id="demoMessage" class="demo-message"></div></div>`;
    else if(onboardingPage===3)content=`<div class="onboarding-visual">×4</div><h2>${t("onboarding.sortTitle")}</h2><p>${t("onboarding.sortText")}</p><div class="demo-sort"><button class="demo-option" id="demoWater">${typeChip("water")}</button><div class="demo-buckets">${[.5,1,2].map(value=>`<button class="demo-bucket" data-demo-bucket="${value}">${formatMultiplier(value)}</button>`).join("")}</div><div id="demoMessage" class="demo-message"></div></div>`;
    else if(onboardingPage===4)content=`<div class="onboarding-visual">◉</div><h2>${t("onboarding.pokemonTitle")}</h2><p>${t("onboarding.pokemonText")}</p><div class="demo-question"><div class="pokemon-frame" style="width:150px;height:150px"><img class="pokemon-art" src="${artworkUrl(25)}" alt="Pikachu"></div><div class="demo-options">${["electric","normal","fairy","fire"].map(type=>`<button class="demo-option" data-demo-pokemon="${type}">${typeChip(type)}</button>`).join("")}</div><div id="demoMessage" class="demo-message"></div></div>`;
    else content=`<div class="onboarding-visual">🎯</div><h2>${t("onboarding.personalTitle")}</h2><p>${t("onboarding.personalText")}</p><div class="feature-list"><div class="feature-item"><span class="feature-icon">!</span><span><strong>${t("stats.errors")}</strong><small>${t("stats.errorHelp")}</small></span></div><div class="feature-item"><span class="feature-icon">◇</span><span><strong>${t("learn.title")}</strong><small>${t("learn.subtitle")}</small></span></div><div class="feature-item"><span class="feature-icon">XP</span><span><strong>${t("stats.level")}</strong><small>${t("home.progress")}</small></span></div></div>`;

    progress.innerHTML = Array.from({length:pages},(_,i)=>`<span class="${i===onboardingPage?"active":""}"></span>`).join("");
    contentRoot.innerHTML = content;
    contentRoot.classList.remove("onboarding-step-enter");
    if(motionEnabled()){void contentRoot.offsetWidth;contentRoot.classList.add("onboarding-step-enter");}
    nextButton.textContent = onboardingPage===pages-1 ? t("onboarding.startTraining") : t("common.next");
    skipButton.textContent = t("common.skip");

    document.querySelectorAll("[data-language]").forEach(button=>button.addEventListener("click",()=>{state.language=button.dataset.language;saveState();applyPreferences();renderOnboarding(false);}));
    document.querySelectorAll("[data-demo-effect]").forEach(button=>button.addEventListener("click",()=>{const correct=button.dataset.demoEffect==="grass";document.querySelectorAll("[data-demo-effect]").forEach(item=>{item.classList.toggle("correct",item.dataset.demoEffect==="grass");item.classList.toggle("incorrect",item===button&&!correct);});document.getElementById("demoMessage").textContent=correct?t("onboarding.effectCorrect"):t("onboarding.effectWrong");}));
    const waterButton=document.getElementById("demoWater");let waterSelected=false;
    waterButton?.addEventListener("click",()=>{waterSelected=true;waterButton.classList.add("correct");document.getElementById("demoMessage").textContent=t("onboarding.sortText");});
    document.querySelectorAll("[data-demo-bucket]").forEach(button=>button.addEventListener("click",()=>{if(!waterSelected)return;const correct=Number(button.dataset.demoBucket)===2;document.querySelectorAll("[data-demo-bucket]").forEach(item=>item.classList.toggle("correct",Number(item.dataset.demoBucket)===2));document.getElementById("demoMessage").textContent=correct?t("onboarding.sortDone"):t("onboarding.sortText");}));
    document.querySelectorAll("[data-demo-pokemon]").forEach(button=>button.addEventListener("click",()=>{const correct=button.dataset.demoPokemon==="electric";document.querySelectorAll("[data-demo-pokemon]").forEach(item=>{item.classList.toggle("correct",item.dataset.demoPokemon==="electric");item.classList.toggle("incorrect",item===button&&!correct);});document.getElementById("demoMessage").textContent=correct?t("onboarding.pokemonCorrect"):t("onboarding.pokemonWrong");}));
    skipButton.onclick = ()=>completeOnboarding(false);
    nextButton.onclick = ()=>lockInteraction(nextButton,()=>{if(onboardingPage<pages-1){onboardingPage+=1;renderOnboarding(false);}else completeOnboarding(true);},300);
  }
  function completeOnboarding(startTraining){onboardingOpen=false;state.onboardingComplete=true;saveState();closeModal(()=>{if(startTraining)setRoute("setup-effectiveness");else render();});}

  function showLevelModal(){const level=getLevelInfo();setModalMarkup(`<div class="modal-backdrop" role="dialog" aria-modal="true"><section class="modal-card"><div class="onboarding-visual">${level.current.level}</div><h2>${escapeHtml(t(level.current.key))}</h2><p>${level.next?`${state.stats.xp} / ${level.next.xp} XP`:`${state.stats.xp} XP`}</p><div class="progress-track" style="margin-top:18px"><div class="progress-fill" style="width:${level.progress}%"></div></div><div class="actions stack"><button id="closeLevel" class="primary-button">${t("common.close")}</button></div></section></div>`, { initialFocus: "#closeLevel" });document.getElementById("closeLevel").addEventListener("click",()=>closeModal());}
  function enqueueToast(icon,title,description,kind="info"){toastQueue.push({icon,title,description,kind});if(!toastBusy)showNextToast();}
  function showNextToast(){const item=toastQueue.shift();if(!item){toastBusy=false;return;}toastBusy=true;const toast=document.createElement("div");toast.className=`toast toast-${item.kind||"info"}`;toast.setAttribute("role",item.kind==="error"||item.kind==="warning"?"alert":"status");toast.setAttribute("aria-live",item.kind==="error"?"assertive":"polite");toast.innerHTML=`<span class="toast-icon">${item.icon}</span><span><strong>${escapeHtml(item.title)}</strong>${item.description?`<small>${escapeHtml(item.description)}</small>`:""}</span>`;toastRoot.appendChild(toast);const finish=()=>{toast.remove();toastBusy=false;showNextToast();};const visibleFor=item.kind==="error"?4100:item.kind==="level"?3400:2700;setTimeout(()=>{if(!motionEnabled()){finish();return;}toast.classList.add("is-leaving");setTimeout(finish,230);},visibleFor);}

  async function loadRandomPokemon(generation="all", excludedIds=[]) {
    const range=generation==="all"?[1,1025]:GENERATION_RANGES[generation]||[1,1025];
    if (!navigator.onLine) {
      const excluded = new Set(excludedIds.map(Number));
      const candidates = FALLBACK_POKEMON.filter(p => (generation === "all" || String(p.generation) === String(generation)) && !excluded.has(p.id));
      const pool = candidates.length ? candidates : FALLBACK_POKEMON.filter(p => generation === "all" || String(p.generation) === String(generation));
      return formatFallbackPokemon(randomItem(pool.length ? pool : FALLBACK_POKEMON));
    }
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
    setModalMarkup(`<div class="modal-backdrop" role="dialog" aria-modal="true">
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
    </div>`, { initialFocus: "#closeInstallGuide" });
    document.getElementById("closeInstallGuide").addEventListener("click",()=>closeModal());
  }

  async function installApp(){if(isStandalone()){enqueueToast("✓",t("home.install"),t("install.alreadyInstalled"));return;}if(!deferredInstallPrompt){showInstallGuide();return;}deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;renderHome();}

  backButton.addEventListener("click",()=>{
    if(state.route==="profile"){setRoute("home");return;}
    if(state.route==="learn-detail"){setRoute("learn");return;}
    if(state.route.startsWith("setup-")){setRoute("train");return;}
    if(state.route==="session"){requestExitSession("train");return;}
    if(state.route==="summary"){session=null;setRoute("train");return;}
    setRoute("home");
  });
  homeButton.addEventListener("click",()=>{if(state.route==="session"){requestExitSession("home");return;}session=null;setRoute("home");});
  brandButton.addEventListener("click",()=>{if(state.route==="session"){requestExitSession("home");return;}session=null;setRoute("home");});
  levelButton.addEventListener("click",()=>setRoute("profile"));
  navButtons.forEach(button=>button.addEventListener("click",()=>{if(state.route==="session"){requestExitSession(button.dataset.route);return;}session=null;setRoute(button.dataset.route);}));

  document.querySelector(".bottom-nav").addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const currentIndex = Math.max(0, navButtons.indexOf(document.activeElement));
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % navButtons.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + navButtons.length) % navButtons.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = navButtons.length - 1;
    event.preventDefault();
    navButtons[nextIndex].focus();
  });

  document.addEventListener("keydown", event => {
    const modal = topModalContext();
    if (modal) {
      if (event.key === "Escape" && modal.closeOnEscape) { event.preventDefault(); modal.onRequestClose("escape"); return; }
      if (event.key === "Tab") {
        const focusables = focusableElements(modal.backdrop);
        if (!focusables.length) { event.preventDefault(); return; }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    if (event.key !== "Escape" || !isInnerRoute(state.route)) return;
    event.preventDefault();
    backButton.click();
  });

  matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{if(state.theme==="system")applyPreferences();});
  reducedMotionQuery.addEventListener?.("change",()=>{applyPreferences();scheduleViewMotion();});
  window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;if(state.route==="home")renderHome();});

  document.addEventListener("error", event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied === "true") return;
    image.dataset.fallbackApplied = "true";
    image.classList.add("image-load-failed");
    image.src = "assets/pokemon-placeholder.svg";
  }, true);

  window.addEventListener("error", e => logError(e.error || e.message, "window.error"));
  window.addEventListener("unhandledrejection", e => logError(e.reason, "unhandledrejection"));

  function applyNetworkStatus(announce = false) {
    const online = navigator.onLine;
    document.documentElement.dataset.network = online ? "online" : "offline";
    if (!announce) return;
    enqueueToast(online ? "✓" : "⌁", online ? t("toast.online") : t("toast.offline"), online ? t("toast.onlineDesc") : t("toast.offlineDesc"), online ? "success" : "warning");
  }

  window.addEventListener("online", () => applyNetworkStatus(true));
  window.addEventListener("offline", () => applyNetworkStatus(true));

  if("serviceWorker"in navigator&&location.protocol.startsWith("http")){
    navigator.serviceWorker.addEventListener("message",event=>{
      if(event.data?.type==="QUIZMON_SW_ACTIVATED"&&event.data.legacyEntriesRemoved>0){
        enqueueToast("↻",t("toast.updated"),t("toast.updatedDesc"),"success");
      }
    });

    addEventListener("load",async()=>{
      try{
        const registration=await navigator.serviceWorker.register("./service-worker.js?build=1-6-sprint2-v2-hotfix1",{updateViaCache:"none"});
        if(registration.waiting)registration.waiting.postMessage({type:"SKIP_WAITING"});
        registration.update().catch(()=>{});
        registration.addEventListener("updatefound",()=>{
          const worker=registration.installing;
          worker?.addEventListener("statechange",()=>{
            if(worker.state==="installed"&&navigator.serviceWorker.controller){
              worker.postMessage({type:"SKIP_WAITING"});
              enqueueToast("↻",t("toast.updated"),t("toast.updatedDesc"));
            }
          });
        });
      }catch(error){console.warn("Service worker registration failed",error);}
    });
  }

  initializeMotionSystem();
  applyNetworkStatus(false);
  saveState();
  render();
  if (!navigator.onLine) setTimeout(() => applyNetworkStatus(true), 250);
})();
