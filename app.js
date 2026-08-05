(() => {
  "use strict";

  const STORAGE_KEY = "quizmon.beta1";
  const BUILD_VERSION = "visual-refresh-sprint2-v1";
  const PUBLIC_VERSION = "Beta 1.3";
  const DATA_SCHEMA = 19;
  const LEARNING_EVENT_LIMIT = 800;
  const ERROR_EVENT_LIMIT = 600;
  const HISTORY_LIMIT = 30;
  const MISTAKE_LIMIT = 300;
  const POKEMON_CACHE_LIMIT = 160;
  const IMPORT_BACKUP_LIMIT = 3;
  const MAX_IMPORT_BYTES = 12 * 1024 * 1024;
  const PLAYABLE_MODES = Object.freeze(["effectiveness", "multiplier", "impact", "pokemon"]);
  const LEARNING_EVENT_MODES = Object.freeze([...PLAYABLE_MODES, "weak", "daily", "review", "problem", "path"]);
  const ADAPTIVE_SESSION_MODES = Object.freeze(["weak", "problem"]);
  const SUPPORTED_CURRENT_VERSIONS = Object.freeze([
    "4.1-sprint3-v4", "4.1-sprint3-v3", "4.1-sprint3-v2", "4.1-sprint3-v1", "4.1-sprint2-v1",
    "4.1-sprint1-v1", "phase3-cleanup-v1", "3.5-sprint2-v2", "3.5-sprint2-v1", "3.5-sprint1-v2", "3.5-sprint1-v1", "3.4-sprint2-v1", "3.4-sprint1-v1", "3.3-sprint1-v3", "3.3-sprint1-v2", "3.3-sprint1-v1", "3.2-sprint2-v1", "3.2-sprint1-v2", "3.2-sprint1-v1", "3.1-sprint3-v3", "3.1-sprint3-v2", "3.1-sprint3-v1", "3.1-sprint2-v3", "3.1-sprint2-v2", "3.1-sprint2-v1", "3.1-sprint1-v2", "3.1-sprint1-v1", "phase2-finalization-sprint-v1", "phase2-cleanup-sprint3-v1", "phase2-cleanup-sprint2-v1", "phase2-cleanup-sprint1-v2", "phase2-cleanup-sprint1-v1",
    "2.5-sprint3-v1", "2.5-sprint2-v1", "2.5-sprint1-v1", "2.4-sprint2-v1", "2.4-sprint1-v1",
    "2.3-sprint2-v3", "2.3-sprint2-v2", "2.3-sprint2-v1", "2.3-sprint1-v1",
    "2.2-sprint2-v1", "2.2-sprint1-v1", "2.1-sprint3-v1", "2.1-sprint2-v5",
    "2.1-sprint2-v4", "2.1-sprint2-v3", "2.1-sprint2-v2", "2.1-sprint2-v1", "2.1-sprint1-v1",
    "1.5b-sprint3-v1", "1.5b-sprint2-v1", "1.5b-sprint1-v1", "1.5a-sprint3-v2",
    "1.5a-sprint3-v1", "1.5a-sprint2-v1", "1.5a-sprint1-v1", "1.6-sprint2-v2-hotfix2",
    "1.6-sprint2-v2", "1.6-sprint2-v1", "1.6-sprint1-v1", "1.5-sprint2-v1",
    "1.5-sprint1-v1-fix1", "1.5-sprint1-v1", "1.4-sprint3-v2", "1.4-sprint3-v1",
    "1.4-sprint2-v6", "1.4-sprint2-v5", "1.4-sprint2-v3", "1.4-sprint2-v2",
    "1.4-sprint2-v1", "1.4-sprint1-v2", "1.4-sprint1-v1", "1.3-sprint3-v3",
    "1.3-sprint2-v2", "1.3-sprint1-v1", "1.2-sprint2-v2", "1.2-sprint2-v1",
    "1.2-sprint1-v2", "1.2-sprint1-v1", "1.0-sprint3-v1", "1.0-sprint2-v2",
    "1.0-sprint2", "1.0-sprint1", "1.0"
  ]);
  const SUPPORTED_ALPHA_VERSIONS = Object.freeze(["0.6.1", "0.6"]);
  const SUPPORTED_LEGACY_VERSIONS = Object.freeze(["0.5", "0.4", "0.3"]);
  const ERROR_RULE_CODES = Object.freeze([
    "direction-reversal", "immunity-overlooked", "immunity-assumed",
    "quarter-half-confusion", "double-quad-confusion", "dual-neutralization",
    "dual-multiplication", "pokemon-missing-secondary", "pokemon-extra-type",
    "pokemon-wrong-type"
  ]);
  const LEARNING_PATH_VERSION = 3;
  const LEARNING_PATH_MODULE_IDS = Object.freeze([
    "basics-direction", "basics-factors", "types-elements", "types-energy",
    "types-earth", "types-mind", "types-material", "types-myth",
    "dual-combine", "dual-neutralize", "dual-immunity", "dual-mastery",
    "pokemon-single", "pokemon-dual", "pokemon-apply",
    "exam-basics", "exam-types", "exam-dual", "exam-pokemon", "exam-final"
  ]);
  const OLD_KEYS = ["pokemonTypeLearner.v0.6.1", "pokemonTypeLearner.v0.5", "pokemonTypeLearner.v0.4", "pokemonTypeLearner.v0.3", "pokemonTypeLearner.v0.2", "pokemonTypeLearner.v0.1"];

  const view = document.getElementById("view");
  const routeAnnouncer = document.getElementById("routeAnnouncer");
  const modalRoot = document.getElementById("modalRoot");
  const toastRoot = document.getElementById("toastRoot");
  const backButton = document.getElementById("backButton");
  const homeButton = document.getElementById("homeButton");
  const brandButton = document.getElementById("brandButton");
  const brandVersion = brandButton?.querySelector("small");
  const levelButton = document.getElementById("levelButton");
  const levelNumber = document.getElementById("levelNumber");
  const headerStreak = document.getElementById("headerStreak");
  const navButtons = [...document.querySelectorAll(".nav-item")];
  const WHOS_CONTEXT = QuizmonWhosThatPokemon.createContext({
    pokemon: QuizmonKnowledgeData.POKEMON,
    types: TYPES,
    typeChart: TYPE_CHART,
    evolutionMethods: QuizmonKnowledgeContent.EVOLUTION_METHODS,
    starterIds: QuizmonKnowledgeWorld.REGIONS.flatMap(region => region.starters || [])
  });

  const blankTypeStats = () => Object.fromEntries(
    TYPES.map(type => [type, { total: 0, correct: 0, recent: [], lastSeen: null }])
  );
  const blankModeStats = () => ({ total: 0, correct: 0, sessions: 0 });

  const defaultLanguage = navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
  const defaults = {
    version: BUILD_VERSION,
    dataSchema: DATA_SCHEMA,
    diagnostics: { errors: [], repairs: [], lastBackup: null, maintenance: { lastRun: null, lastSaveBytes: 0, lastCompaction: null, quotaRecoveries: 0 } },
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
    favorites: { pokemon: [], types: [], sortPokemon: "recent", sortTypes: "recent" },
    trainingLists: { lists: [] },
    flashcards: { review: [], history: [] },
    whosThat: {
      difficulty: "medium", round: null,
      statistics: QuizmonWhosThatPokemon.blankStatistics(),
      completedRoundIds: [],
      daily: { installationId: globalThis.crypto?.randomUUID?.() || `quizmon-${Date.now()}-${Math.random().toString(16).slice(2)}`, lastTrustedDate: null, history: {}, pendingUploads: [], distribution: null }
    },
    seenHints: { effectiveness: false, multiplier: false, impact: false, pokemon: false },
    statsTab: "overview",
    learnTab: "path",
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
        weak: blankModeStats(), daily: blankModeStats(), review: blankModeStats(), problem: blankModeStats(), path: blankModeStats()
      },
      types: blankTypeStats(),
      history: [],
      achievements: {},
      mistakes: [],
      learning: { events: [] },
      errorAnalysis: { events: [] }
    },
    learningPath: {
      version: LEARNING_PATH_VERSION,
      placement: { assessedAt: null, source: "new", validatedModules: [] },
      modules: {},
      completion: { completedAt: null, finalRate: 0, attempts: 0, areaRates: {} }
    },
    daily: {
      date: null,
      completed: false,
      result: null,
      streak: 0,
      bestStreak: 0,
      lastCompletedDate: null,
      goalTarget: 10,
      goalProgress: 0,
      goalCompleted: false,
      goalRewardClaimed: false,
      history: {}
    },
    pokemonCache: {}
  };

  let state = loadState();
  const requestedRoute = new URLSearchParams(location.search).get("route");
  if (["home", "play", "train", "learn", "knowledge", "stats", "settings", "support", "profile"].includes(requestedRoute)) state.route = requestedRoute;
  let session = null;
  let learnType = null;
  let knowledgeView = "home";
  let knowledgePokemonId = null;
  let knowledgePokemonPage = 0;
  let knowledgePokemonDetailTab = "overview";
  let knowledgeContentKind = null;
  let knowledgeContentId = null;
  let knowledgeContentPage = 0;
  let knowledgeSearchQuery = "";
  let knowledgeSearchIndex = null;
  let knowledgeSearchFilter = "all";
  let knowledgeSearchVisibleCount = 24;
  let knowledgeSearchOrigin = null;
  let knowledgeSearchOpenedResult = false;
  let knowledgeSearchResultScrollY = 0;
  let knowledgeSearchFocusPending = false;
  let knowledgeEvolutionFamiliesCache = null;
  const KNOWLEDGE_SEARCH_PAGE_SIZE = 24;
  const KNOWLEDGE_GENERATION_FILTER_KEY = "quizmon.knowledge.generationFilter";
  let knowledgeGenerationFilter = (() => {
    try { return QuizmonKnowledgeFilter.normalizeGeneration(localStorage.getItem(KNOWLEDGE_GENERATION_FILTER_KEY)) || "all"; }
    catch { return "all"; }
  })();
  const KNOWLEDGE_VERSION_SESSION_KEY = "quizmon.knowledge.versionGroup";
  let knowledgeVersionGroupId = (() => {
    try { return Number(sessionStorage.getItem(KNOWLEDGE_VERSION_SESSION_KEY)) || QuizmonKnowledgeLearnsets.DEFAULT_VERSION_GROUP_ID; }
    catch { return QuizmonKnowledgeLearnsets.DEFAULT_VERSION_GROUP_ID; }
  })();
  let knowledgeLearnsetLoadStatus = QuizmonKnowledgeLearnsetLoader.isLoaded() ? "ready" : "idle";
  let onboardingOpen = false;
  let onboardingPage = 0;
  let onboardingDemoAnswer = null;
  let profileCustomizerDraft = null;
  let profileFavoritesDraft = null;
  let favoritePokemonQuery = "";
  let trainingListDraft = null;
  let trainingListDraftOriginal = null;
  let trainingListPokemonQuery = "";
  let trainingListLaunchDraft = null;
  let flashcardSetupKind = "pokemon";
  let flashcardSetupSource = "all";
  let flashcardSetupGeneration = knowledgeGenerationFilter;
  let flashcardSetupCount = 10;
  let flashcardSession = null;
  let flashcardSwipeStartX = null;
  let flashcardSwipeHandled = false;
  let whosSuggestionQuery = "";
  let whosSelectedPokemonId = null;
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
  let browserHistoryIndex = 0;
  let applyingBrowserHistory = false;
  let pendingHistorySnapshot = null;
  const HAPTIC_PATTERNS = Object.freeze({
    selection: 5, move: 8, success: [12,28,18], error: [26,32,26],
    combo: [8,18,10,18,24], goal: [12,22,12,22,32], level: [14,34,14,34,34], unlock: [10,24,10]
  });

  function clone(value) { return QuizmonCore.clone(value); }

  function dedupeFirstBy(items, keyFor) { return QuizmonCore.dedupeFirstBy(items, keyFor); }

  function dedupeLatestBy(items, keyFor) { return QuizmonCore.dedupeLatestBy(items, keyFor); }

  function byteLength(value) { return QuizmonCore.byteLength(value); }

  function clampScore(value) { return QuizmonCore.clampScore(value); }

  function validLearningKey(key) {
    const [role, value] = String(key || "").split(":");
    if (["attack", "defense", "pokemon", "type"].includes(role)) return TYPES.includes(value);
    if (role === "skill") return ["effectiveness", "multiplier", "impact", "pokemon", "dual"].includes(value);
    return false;
  }

  function sanitizeLearningEvent(event) {
    if (!event || typeof event !== "object") return null;
    const date = new Date(event.at || "");
    if (Number.isNaN(date.getTime())) return null;
    const observations = Array.isArray(event.observations)
      ? event.observations.map(item => {
          if (!item || typeof item !== "object" || !validLearningKey(item.key)) return null;
          return { key: String(item.key), score: Math.round(clampScore(item.score) * 1000) / 1000 };
        }).filter(Boolean)
      : [];
    if (!observations.length) return null;
    const uniqueObservations = new Map();
    observations.forEach(item => uniqueObservations.set(item.key, item));
    const kind = PLAYABLE_MODES.includes(event.kind) ? event.kind : "effectiveness";
    return {
      id: typeof event.id === "string" ? event.id.slice(0, 80) : `learn-${date.getTime()}`,
      at: date.toISOString(),
      mode: LEARNING_EVENT_MODES.includes(event.mode) ? event.mode : kind,
      kind,
      difficulty: ["easy", "medium", "hard"].includes(event.difficulty) ? event.difficulty : null,
      correct: Boolean(event.correct),
      duration: Math.min(600000, Math.max(0, Number(event.duration) || 0)),
      review: Boolean(event.review),
      dual: Boolean(event.dual),
      focusTypes: unique(Array.isArray(event.focusTypes) ? event.focusTypes.filter(type => TYPES.includes(type)) : []).slice(0, 8),
      wrongTypes: unique(Array.isArray(event.wrongTypes) ? event.wrongTypes.filter(type => TYPES.includes(type)) : []).slice(0, 18),
      observations: [...uniqueObservations.values()]
    };
  }

  function sanitizeLearningEvents(events) {
    const cleaned = (Array.isArray(events) ? events : []).map(sanitizeLearningEvent).filter(Boolean);
    return dedupeLatestBy(cleaned, item => item.id).slice(-LEARNING_EVENT_LIMIT);
  }

  function sanitizeErrorPatternKey(value) {
    const key = typeof value === "string" ? value.slice(0, 180) : "";
    if (key.startsWith("rule:") && ERROR_RULE_CODES.includes(key.slice(5))) return key;
    if (key.startsWith("matchup:")) {
      const [, attackingType, defendersRaw] = key.split(":");
      const defenders = errorSortedTypes(String(defendersRaw || "").split("+").filter(type => TYPES.includes(type)));
      if (TYPES.includes(attackingType) && defenders.length && defenders.length <= 2) return `matchup:${attackingType}:${defenders.join("+")}`;
    }
    if (key.startsWith("pokemon:")) {
      const id = Number(key.slice(8));
      if (Number.isInteger(id) && id > 0 && id <= 10000) return `pokemon:${id}`;
    }
    return null;
  }

  function sanitizeErrorIssue(issue) {
    if (!issue || typeof issue !== "object") return null;
    const patternKey = sanitizeErrorPatternKey(issue.patternKey);
    if (!patternKey) return null;
    const code = patternKey.startsWith("rule:") ? patternKey.slice(5) : patternKey.startsWith("matchup:") ? "matchup" : "pokemon-specific";
    const expected = issue.expectedMultiplier == null ? NaN : Number(issue.expectedMultiplier);
    const actual = issue.actualMultiplier == null ? NaN : Number(issue.actualMultiplier);
    return {
      patternKey,
      code,
      attackingType: TYPES.includes(issue.attackingType) ? issue.attackingType : null,
      defendingTypes: unique(Array.isArray(issue.defendingTypes) ? issue.defendingTypes.filter(type => TYPES.includes(type)) : []).slice(0, 2),
      pokemonId: issue.pokemonId == null ? null : (Number.isFinite(Number(issue.pokemonId)) ? Number(issue.pokemonId) : null),
      pokemonName: typeof issue.pokemonName === "string" ? issue.pokemonName.slice(0, 80) : "",
      expectedMultiplier: Number.isFinite(expected) ? expected : null,
      actualMultiplier: Number.isFinite(actual) ? actual : null
    };
  }

  function sanitizeErrorEvent(event) {
    if (!event || typeof event !== "object") return null;
    const date = new Date(event.at || "");
    if (Number.isNaN(date.getTime())) return null;
    const opportunities = unique((Array.isArray(event.opportunities) ? event.opportunities : []).map(sanitizeErrorPatternKey).filter(Boolean)).slice(0, 50);
    const issueMap = new Map();
    (Array.isArray(event.issues) ? event.issues : []).map(sanitizeErrorIssue).filter(Boolean).forEach(issue => issueMap.set(issue.patternKey, issue));
    if (!opportunities.length) return null;
    return {
      id: typeof event.id === "string" ? event.id.slice(0, 80) : `error-${date.getTime()}`,
      at: date.toISOString(),
      sessionId: typeof event.sessionId === "string" ? event.sessionId.slice(0, 80) : "legacy",
      mode: LEARNING_EVENT_MODES.includes(event.mode) ? event.mode : "effectiveness",
      kind: PLAYABLE_MODES.includes(event.kind) ? event.kind : "effectiveness",
      signature: typeof event.signature === "string" ? event.signature.slice(0, 240) : "",
      correct: Boolean(event.correct),
      opportunities,
      issues: [...issueMap.values()].slice(0, 40)
    };
  }

  function sanitizeErrorEvents(events) {
    const cleaned = (Array.isArray(events) ? events : []).map(sanitizeErrorEvent).filter(Boolean);
    return dedupeLatestBy(cleaned, item => item.id).slice(-ERROR_EVENT_LIMIT);
  }

  function deepMerge(base, saved) {
    const output = { ...clone(base), ...(saved || {}) };
    output.config = { ...clone(base.config), ...((saved || {}).config || {}) };
    ["effectiveness", "multiplier", "impact", "pokemon"].forEach(mode => {
      output.config[mode] = { ...clone(base.config[mode]), ...(output.config[mode] || {}) };
    });
    output.seenHints = { ...base.seenHints, ...((saved || {}).seenHints || {}) };
    output.whosThat = { ...clone(base.whosThat), ...((saved || {}).whosThat || {}) };
    output.whosThat.statistics = QuizmonWhosThatPokemon.sanitizeStatistics(output.whosThat.statistics);
    output.whosThat.completedRoundIds = unique(Array.isArray(output.whosThat.completedRoundIds) ? output.whosThat.completedRoundIds.filter(id => typeof id === "string").slice(-300) : []);
    output.whosThat.daily = { ...clone(base.whosThat.daily), ...(output.whosThat.daily || {}) };
    output.whosThat.daily.history = output.whosThat.daily.history && typeof output.whosThat.daily.history === "object" ? output.whosThat.daily.history : {};
    output.whosThat.daily.pendingUploads = Array.isArray(output.whosThat.daily.pendingUploads) ? output.whosThat.daily.pendingUploads.slice(-30) : [];
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
    output.stats.learning = { events: [], ...((((saved || {}).stats || {}).learning) || {}), ...(output.stats.learning || {}) };
    output.stats.learning.events = sanitizeLearningEvents(output.stats.learning.events);
    output.stats.errorAnalysis = { events: [], ...((((saved || {}).stats || {}).errorAnalysis) || {}), ...(output.stats.errorAnalysis || {}) };
    output.stats.errorAnalysis.events = sanitizeErrorEvents(output.stats.errorAnalysis.events);
    output.learningPath = { ...clone(base.learningPath), ...((saved || {}).learningPath || {}) };
    output.learningPath.placement = { ...clone(base.learningPath.placement), ...(((saved || {}).learningPath || {}).placement || {}) };
    output.learningPath.modules = { ...clone(base.learningPath.modules), ...(((saved || {}).learningPath || {}).modules || {}) };
    output.learningPath.completion = { ...clone(base.learningPath.completion), ...(((saved || {}).learningPath || {}).completion || {}) };
    output.daily = { ...clone(base.daily), ...((saved || {}).daily || {}) };
    output.daily.history = { ...clone(base.daily.history), ...((((saved || {}).daily || {}).history) || {}) };
    output.pokemonCache = sanitizePokemonCache(output.pokemonCache);
    output.diagnostics = { errors: [], repairs: [], lastBackup: null, maintenance: {}, ...(output.diagnostics || {}) };
    output.diagnostics.errors = Array.isArray(output.diagnostics.errors) ? output.diagnostics.errors.slice(-50) : [];
    output.diagnostics.repairs = Array.isArray(output.diagnostics.repairs) ? output.diagnostics.repairs.slice(-50) : [];
    const maintenance = output.diagnostics.maintenance && typeof output.diagnostics.maintenance === "object" ? output.diagnostics.maintenance : {};
    output.diagnostics.maintenance = {
      lastRun: maintenance.lastRun && !Number.isNaN(new Date(maintenance.lastRun).getTime()) ? new Date(maintenance.lastRun).toISOString() : null,
      lastSaveBytes: finiteNonNegative(maintenance.lastSaveBytes),
      lastCompaction: maintenance.lastCompaction && typeof maintenance.lastCompaction === "object" ? maintenance.lastCompaction : null,
      quotaRecoveries: finiteNonNegative(maintenance.quotaRecoveries)
    };
    output.language = ["de", "en"].includes(output.language) ? output.language : defaultLanguage;
    return output;
  }

  function migrateLegacy(old) {
    const migrated = deepMerge(defaults, old || {});
    migrated.version = BUILD_VERSION;
    migrated.dataSchema = DATA_SCHEMA;
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

  function sanitizePathAreaRates(value) {
    const source=value&&typeof value==="object"?value:{};
    return Object.fromEntries(Object.entries(source).filter(([key])=>typeof key==="string"&&key.length<50).map(([key,rate])=>[key,Math.min(100,finiteNonNegative(rate))]));
  }

  function sanitizePathCompletion(value) {
    const source=value&&typeof value==="object"?value:{};
    const completedAt=source.completedAt&&!Number.isNaN(new Date(source.completedAt).getTime())?new Date(source.completedAt).toISOString():null;
    return {completedAt,finalRate:Math.min(100,finiteNonNegative(source.finalRate)),attempts:finiteNonNegative(source.attempts),areaRates:sanitizePathAreaRates(source.areaRates)};
  }

  function sanitizePathModuleProgress(value) {
    const progress = value && typeof value === "object" ? value : {};
    const completedAt = progress.completedAt && !Number.isNaN(new Date(progress.completedAt).getTime()) ? new Date(progress.completedAt).toISOString() : null;
    const lastAt = progress.lastAt && !Number.isNaN(new Date(progress.lastAt).getTime()) ? new Date(progress.lastAt).toISOString() : null;
    return {
      attempts: finiteNonNegative(progress.attempts),
      bestRate: Math.min(100, finiteNonNegative(progress.bestRate)),
      lastRate: Math.min(100, finiteNonNegative(progress.lastRate)),
      completed: Boolean(progress.completed),
      validated: Boolean(progress.validated),
      completedAt,
      lastAt,
      lastAreas: sanitizePathAreaRates(progress.lastAreas),
      bestAreas: sanitizePathAreaRates(progress.bestAreas),
      recommendedModules: unique((Array.isArray(progress.recommendedModules) ? progress.recommendedModules : []).filter(id => LEARNING_PATH_MODULE_IDS.includes(id))).slice(0, 6),
      lastRequirementsPassed: Boolean(progress.lastRequirementsPassed)
    };
  }

  function pathPlacementFromHistory(repaired) {
    const rateFor = modes => {
      const totals = modes.reduce((sum, mode) => sum + finiteNonNegative(repaired.stats.modes?.[mode]?.total), 0);
      const correct = modes.reduce((sum, mode) => sum + finiteNonNegative(repaired.stats.modes?.[mode]?.correct), 0);
      return { totals, rate: percent(correct, totals) };
    };
    const direction = rateFor(["effectiveness", "impact"]);
    const factors = rateFor(["multiplier", "impact"]);
    const validated = [];
    if (direction.totals >= 30 && direction.rate >= 85) validated.push("basics-direction");
    if (factors.totals >= 30 && factors.rate >= 82 && validated.includes("basics-direction")) validated.push("basics-factors");
    return {
      assessedAt: new Date().toISOString(),
      source: validated.length ? "history" : "new",
      validatedModules: validated
    };
  }

  function repairLearningPath(repaired, candidatePath) {
    const source = candidatePath && typeof candidatePath === "object" ? candidatePath : {};
    const modules = {};
    LEARNING_PATH_MODULE_IDS.forEach(id => { modules[id] = sanitizePathModuleProgress(source.modules?.[id]); });
    let placement = source.placement && typeof source.placement === "object" ? source.placement : null;
    if (!placement?.assessedAt || Number.isNaN(new Date(placement.assessedAt).getTime())) placement = pathPlacementFromHistory(repaired);
    const validated = unique((Array.isArray(placement.validatedModules) ? placement.validatedModules : []).filter(id => LEARNING_PATH_MODULE_IDS.includes(id)));
    validated.forEach(id => { modules[id].validated = true; });
    repaired.learningPath = {
      version: LEARNING_PATH_VERSION,
      placement: {
        assessedAt: new Date(placement.assessedAt).toISOString(),
        source: placement.source === "history" ? "history" : "new",
        validatedModules: validated
      },
      modules,
      completion: sanitizePathCompletion(source.completion)
    };
  }

  function repairState(candidate) {
    const repaired = deepMerge(defaults, candidate || {});
    const fixes = [];
    const numeric = ["total","correct","streak","bestStreak","sessions","totalSeconds","xp"];
    numeric.forEach(key => { if (!Number.isFinite(Number(repaired.stats[key])) || Number(repaired.stats[key]) < 0) { repaired.stats[key] = 0; fixes.push(`stats.${key}`); } else repaired.stats[key] = Number(repaired.stats[key]); });
    if (repaired.stats.correct > repaired.stats.total) { repaired.stats.correct = repaired.stats.total; fixes.push("stats.correct"); }
    repaired.stats.history = repaired.stats.history.filter(Boolean).slice(-100);
    repaired.stats.mistakes = repaired.stats.mistakes.filter(item => item && typeof item === "object").slice(-300);
    repaired.stats.learning = repaired.stats.learning && typeof repaired.stats.learning === "object" ? repaired.stats.learning : { events: [] };
    repaired.stats.learning.events = sanitizeLearningEvents(repaired.stats.learning.events);
    repaired.stats.errorAnalysis = repaired.stats.errorAnalysis && typeof repaired.stats.errorAnalysis === "object" ? repaired.stats.errorAnalysis : { events: [] };
    repaired.stats.errorAnalysis.events = sanitizeErrorEvents(repaired.stats.errorAnalysis.events);
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
    const phase3State = QuizmonPhase3State.sanitize(candidate, {
      favoritesApi: QuizmonFavorites,
      trainingListsApi: QuizmonTrainingLists,
      flashcardsApi: QuizmonFlashcards,
      pokemonIds: new Set(QuizmonKnowledgeData.POKEMON.map(item => item.id)),
      types: new Set(TYPES),
      highlightedPokemonId: repaired.profile.favoritePokemonId,
      highlightedType: repaired.profile.favoriteType,
      fallbackName: (kind,index) => kind === "pokemon" ? `Pokémon ${index + 1}` : `Typen ${index + 1}`,
      flashcardKeys: new Set([
        ...TYPES.map(type => `types:${type}`),
        ...QuizmonKnowledgeData.POKEMON.map(item => `pokemon:${item.id}`),
        ...QuizmonKnowledgeContent.MOVES.map(item => `moves:${item.id}`),
        ...QuizmonKnowledgeContent.ABILITIES.map(item => `abilities:${item.id}`),
        ...QuizmonKnowledgeContent.ITEMS.map(item => `items:${item.id}`)
      ])
    });
    repaired.favorites = phase3State.favorites;
    repaired.trainingLists = phase3State.trainingLists;
    repaired.flashcards = phase3State.flashcards;
    repaired.whosThat = repaired.whosThat && typeof repaired.whosThat === "object" ? repaired.whosThat : clone(defaults.whosThat);
    repaired.whosThat.difficulty = QuizmonWhosThatPokemon.DIFFICULTIES.includes(repaired.whosThat.difficulty) ? repaired.whosThat.difficulty : "medium";
    repaired.whosThat.round = QuizmonWhosThatPokemon.sanitizeRound(repaired.whosThat.round, WHOS_CONTEXT);
    repaired.whosThat.statistics = QuizmonWhosThatPokemon.sanitizeStatistics(repaired.whosThat.statistics);

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
    repaired.statsTab = ["overview","learning","types","errors","achievements"].includes(repaired.statsTab) ? repaired.statsTab : "overview";
    const hadLegacyKnowledgeTab = ["knowledge","lexicon"].includes(repaired.learnTab);
    repaired.learnTab = ["path","lab","cards"].includes(repaired.learnTab) ? repaired.learnTab : "path";
    if(hadLegacyKnowledgeTab && repaired.route === "learn") repaired.route = "knowledge";
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
    if (!PLAYABLE_MODES.includes(repaired.lastMode)) { repaired.lastMode = null; repaired.lastConfig = null; }
    else repaired.lastConfig = { ...clone(repaired.config[repaired.lastMode]), ...(repaired.lastConfig && typeof repaired.lastConfig === "object" ? repaired.lastConfig : {}) };
    const historyModes = new Set(LEARNING_EVENT_MODES);
    repaired.stats.history = repaired.stats.history.filter(item => item && typeof item === "object" && historyModes.has(item.mode)).map(item => ({
      ...item,
      id: typeof item.id === "string" && item.id.length <= 100 ? item.id : null,
      correct: finiteNonNegative(item.correct),
      answers: finiteNonNegative(item.answers || item.total),
      total: finiteNonNegative(item.total),
      rate: Math.min(100, finiteNonNegative(item.rate)),
      duration: finiteNonNegative(item.duration),
      smartPlanKind: ["discovery","personal"].includes(item.smartPlanKind) ? item.smartPlanKind : null,
      learningFocus: unique(Array.isArray(item.learningFocus) ? item.learningFocus.filter(validLearningKey) : []).slice(0,6),
      learningImproved: unique(Array.isArray(item.learningImproved) ? item.learningImproved.filter(validLearningKey) : []).slice(0,6),
      learningAttention: unique(Array.isArray(item.learningAttention) ? item.learningAttention.filter(validLearningKey) : []).slice(0,6),
      difficultyCounts: {
        easy: finiteNonNegative(item.difficultyCounts?.easy),
        medium: finiteNonNegative(item.difficultyCounts?.medium),
        hard: finiteNonNegative(item.difficultyCounts?.hard)
      },
      adaptiveDifficulty: Boolean(item.adaptiveDifficulty),
      difficultyAdjustments: {
        up: finiteNonNegative(item.difficultyAdjustments?.up),
        down: finiteNonNegative(item.difficultyAdjustments?.down),
        steady: finiteNonNegative(item.difficultyAdjustments?.steady)
      },
      difficultyTimeline: (Array.isArray(item.difficultyTimeline)?item.difficultyTimeline:[]).filter(level=>["easy","medium","hard"].includes(level)).slice(0,20),
      pathModuleId: LEARNING_PATH_MODULE_IDS.includes(item.pathModuleId) ? item.pathModuleId : null,
      pathPassed: Boolean(item.pathPassed)
    }));
    repaired.stats.history = dedupeFirstBy(repaired.stats.history, item => item.id || [item.date,item.mode,item.answers,item.correct,item.duration,item.pathModuleId || ""].join("|")).slice(0, HISTORY_LIMIT);
    repaired.stats.mistakes = repaired.stats.mistakes.filter(item => item && typeof item === "object" && item.spec && ["effectiveness","multiplier","impact","pokemon"].includes(item.spec.kind)).map(item => ({
      ...item,
      wrongCount: finiteNonNegative(item.wrongCount),
      correctReviews: finiteNonNegative(item.correctReviews),
      status: item.status === "resolved" ? "resolved" : "open",
      lastIssues: (Array.isArray(item.lastIssues) ? item.lastIssues : []).map(sanitizeErrorIssue).filter(Boolean).slice(0, 12),
      patternKeys: unique((Array.isArray(item.patternKeys) ? item.patternKeys : []).map(sanitizeErrorPatternKey).filter(Boolean)).slice(0, 12)
    })).slice(-MISTAKE_LIMIT);
    repairLearningPath(repaired, candidate?.learningPath);
    repaired.daily.streak = finiteNonNegative(repaired.daily.streak);
    repaired.daily.bestStreak = Math.max(repaired.daily.streak, finiteNonNegative(repaired.daily.bestStreak));
    repaired.daily.completed = Boolean(repaired.daily.completed);
    repaired.daily.goalTarget = 10;
    repaired.daily.goalProgress = Math.min(repaired.daily.goalTarget, finiteNonNegative(repaired.daily.goalProgress));
    if (repaired.daily.completed && repaired.daily.date === todayKey() && repaired.daily.goalProgress === 0) repaired.daily.goalProgress = repaired.daily.goalTarget;
    repaired.daily.goalCompleted = Boolean(repaired.daily.goalCompleted || repaired.daily.goalProgress >= repaired.daily.goalTarget);
    repaired.daily.goalRewardClaimed = Boolean(repaired.daily.goalRewardClaimed || repaired.daily.goalCompleted);
    repaired.daily.history = repaired.daily.history && typeof repaired.daily.history === "object" && !Array.isArray(repaired.daily.history) ? repaired.daily.history : {};
    repaired.daily.history = Object.fromEntries(Object.entries(repaired.daily.history).filter(([key,value]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && value && typeof value === "object").slice(-45).map(([key,value]) => [key, { progress: finiteNonNegative(value.progress), completed: Boolean(value.completed) }]));
    repaired.pokemonCache = sanitizePokemonCache(repaired.pokemonCache);
    repaired.diagnostics.repairs.push(...fixes.map(field => ({ time: new Date().toISOString(), field })));
    repaired.diagnostics.repairs = repaired.diagnostics.repairs.slice(-50);
    repaired.version = BUILD_VERSION; repaired.dataSchema = DATA_SCHEMA;
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

  function compactStateCollections(target, { aggressive = false, record = true } = {}) {
    if (!target || typeof target !== "object") return null;
    const learningLimit = aggressive ? 600 : LEARNING_EVENT_LIMIT;
    const errorLimit = aggressive ? 450 : ERROR_EVENT_LIMIT;
    const historyLimit = aggressive ? 24 : HISTORY_LIMIT;
    const cacheLimit = aggressive ? 100 : POKEMON_CACHE_LIMIT;
    const before = {
      learning: target.stats?.learning?.events?.length || 0,
      errors: target.stats?.errorAnalysis?.events?.length || 0,
      history: target.stats?.history?.length || 0,
      pokemon: Object.keys(target.pokemonCache || {}).length
    };
    if (target.stats?.learning) target.stats.learning.events = dedupeLatestBy(target.stats.learning.events, item => item?.id).slice(-learningLimit);
    if (target.stats?.errorAnalysis) target.stats.errorAnalysis.events = dedupeLatestBy(target.stats.errorAnalysis.events, item => item?.id).slice(-errorLimit);
    if (target.stats) target.stats.history = dedupeFirstBy(target.stats.history, item => item?.id || [item?.date,item?.mode,item?.answers,item?.correct,item?.duration,item?.pathModuleId || ""].join("|")).slice(0, historyLimit);
    const cacheEntries = Object.entries(sanitizePokemonCache(target.pokemonCache)).slice(-cacheLimit);
    target.pokemonCache = Object.fromEntries(cacheEntries);
    if (target.diagnostics) {
      target.diagnostics.errors = (Array.isArray(target.diagnostics.errors) ? target.diagnostics.errors : []).slice(aggressive ? -20 : -50);
      target.diagnostics.repairs = (Array.isArray(target.diagnostics.repairs) ? target.diagnostics.repairs : []).slice(aggressive ? -20 : -50);
    }
    const after = {
      learning: target.stats?.learning?.events?.length || 0,
      errors: target.stats?.errorAnalysis?.events?.length || 0,
      history: target.stats?.history?.length || 0,
      pokemon: Object.keys(target.pokemonCache || {}).length
    };
    const report = {
      aggressive,
      learningRemoved: Math.max(0, before.learning - after.learning),
      errorEventsRemoved: Math.max(0, before.errors - after.errors),
      historyRemoved: Math.max(0, before.history - after.history),
      pokemonRemoved: Math.max(0, before.pokemon - after.pokemon)
    };
    if (record && target.diagnostics?.maintenance && Object.values(report).some(value => typeof value === "number" && value > 0)) {
      target.diagnostics.maintenance.lastRun = new Date().toISOString();
      target.diagnostics.maintenance.lastCompaction = report;
    }
    return report;
  }

  function isQuotaError(error) {
    return error?.name === "QuotaExceededError" || error?.name === "NS_ERROR_DOM_QUOTA_REACHED" || Number(error?.code) === 22 || Number(error?.code) === 1014;
  }

  function serializeState(target) {
    const first = JSON.stringify(target);
    if (target.diagnostics?.maintenance) target.diagnostics.maintenance.lastSaveBytes = byteLength(first);
    return JSON.stringify(target);
  }

  function saveState() {
    state.version = BUILD_VERSION;
    state.dataSchema = DATA_SCHEMA;
    compactStateCollections(state);
    try {
      localStorage.setItem(STORAGE_KEY, serializeState(state));
    } catch (error) {
      if (isQuotaError(error)) {
        try {
          const compacted = clone(state);
          compactStateCollections(compacted, { aggressive: true });
          compacted.diagnostics.maintenance.quotaRecoveries = finiteNonNegative(compacted.diagnostics.maintenance.quotaRecoveries) + 1;
          compacted.diagnostics.maintenance.lastRun = new Date().toISOString();
          localStorage.setItem(STORAGE_KEY, serializeState(compacted));
          state = compacted;
        } catch (retryError) {
          console.warn("Could not save progress after compaction", retryError);
          logError(retryError, "saveState.compacted");
        }
      } else {
        console.warn("Could not save progress", error);
        logError(error, "saveState");
      }
    }
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

  function tp(singularKey, pluralKey, count, vars = {}) {
    return t(QuizmonI18n.pluralKey(state.language, count, singularKey, pluralKey), { ...vars, count });
  }
  function dailyGoalRewardToast(streak, bonusXp) {
    const key = QuizmonI18n.pluralKey(state.language, streak, "daily.goalRewardToastOne", "daily.goalRewardToast");
    return t(key, { count:bonusXp, streak });
  }

  function escapeHtml(value) { return QuizmonCore.escapeHtml(value); }

  function typeLabel(type) { return t(`type.${type}`); }

  function typeChip(type, extraClass = "") {
    const meta = TYPE_META[type];
    return `<span class="type-chip ${extraClass}" data-type="${type}" style="--type-color:${meta.color}"><span class="type-symbol" aria-hidden="true">${meta.icon}</span><span>${escapeHtml(typeLabel(type))}</span></span>`;
  }

  function shuffle(items, random = Math.random) { return QuizmonCore.shuffle(items, random); }
  function randomItem(items, random = Math.random) { return QuizmonCore.randomItem(items, random); }
  function unique(items) { return QuizmonCore.unique(items); }
  function finiteNonNegative(value, fallback = 0) { return QuizmonCore.finiteNonNegative(value, fallback); }
  function validRoute(route) { return QuizmonRouter.validRoute(route); }
  function sanitizePokemonCache(cache) { return QuizmonCore.sanitizePokemonCache(cache, TYPES, POKEMON_CACHE_LIMIT); }
  function effectiveness(attackingType, defendingTypes) { return QuizmonCore.effectiveness(TYPE_CHART, attackingType, defendingTypes); }
  function percent(correct, total) { return QuizmonCore.percent(correct, total); }
  function formatMultiplier(value) { return QuizmonCore.formatMultiplier(value); }
  function multiplierMeaning(value) {
    if (value === 0) return t("multiplier.zero");
    if (value === .25) return t("multiplier.quarter");
    if (value === .5) return t("multiplier.half");
    if (value === 1) return t("multiplier.normal");
    if (value === 2) return t("multiplier.double");
    if (value === 4) return t("multiplier.quad");
    return t("multiplier.other", { value: formatMultiplier(value) });
  }
  function explanationFactorText(attacker, defender, value) {
    const vars = { attacker:typeLabel(attacker), defender:typeLabel(defender), value:formatMultiplier(value) };
    if (value === 0) return t("explanation.factor.zero", vars);
    if (value === .5) return t("explanation.factor.half", vars);
    if (value === 1) return t("explanation.factor.neutral", vars);
    if (value === 2) return t("explanation.factor.double", vars);
    return t("explanation.factor.other", vars);
  }

  const TYPE_MNEMONIC_KEYS = {
    "normal:ghost": "mnemonic.normalGhost",
    "fire:grass": "mnemonic.fireGrass",
    "fire:ice": "mnemonic.fireIce",
    "fire:bug": "mnemonic.fireBug",
    "fire:steel": "mnemonic.fireSteel",
    "water:fire": "mnemonic.waterFire",
    "water:ground": "mnemonic.waterGround",
    "water:rock": "mnemonic.waterRock",
    "grass:water": "mnemonic.grassWater",
    "grass:ground": "mnemonic.grassGround",
    "grass:rock": "mnemonic.grassRock",
    "electric:water": "mnemonic.electricWater",
    "electric:flying": "mnemonic.electricFlying",
    "electric:ground": "mnemonic.electricGround",
    "ice:grass": "mnemonic.iceGrass",
    "ice:ground": "mnemonic.iceGround",
    "ice:flying": "mnemonic.iceFlying",
    "ice:dragon": "mnemonic.iceDragon",
    "fighting:normal": "mnemonic.fightingNormal",
    "fighting:ice": "mnemonic.fightingIce",
    "fighting:rock": "mnemonic.fightingRock",
    "fighting:ghost": "mnemonic.fightingGhost",
    "fighting:dark": "mnemonic.fightingDark",
    "fighting:steel": "mnemonic.fightingSteel",
    "poison:grass": "mnemonic.poisonGrass",
    "poison:steel": "mnemonic.poisonSteel",
    "poison:fairy": "mnemonic.poisonFairy",
    "ground:fire": "mnemonic.groundFire",
    "ground:electric": "mnemonic.groundElectric",
    "ground:poison": "mnemonic.groundPoison",
    "ground:flying": "mnemonic.groundFlying",
    "ground:rock": "mnemonic.groundRock",
    "ground:steel": "mnemonic.groundSteel",
    "flying:grass": "mnemonic.flyingGrass",
    "flying:fighting": "mnemonic.flyingFighting",
    "flying:bug": "mnemonic.flyingBug",
    "psychic:fighting": "mnemonic.psychicFighting",
    "psychic:dark": "mnemonic.psychicDark",
    "bug:grass": "mnemonic.bugGrass",
    "bug:psychic": "mnemonic.bugPsychic",
    "rock:fire": "mnemonic.rockFire",
    "rock:ice": "mnemonic.rockIce",
    "rock:flying": "mnemonic.rockFlying",
    "rock:bug": "mnemonic.rockBug",
    "ghost:normal": "mnemonic.ghostNormal",
    "ghost:psychic": "mnemonic.ghostPsychic",
    "ghost:ghost": "mnemonic.ghostGhost",
    "dragon:dragon": "mnemonic.dragonDragon",
    "dragon:fairy": "mnemonic.dragonFairy",
    "dark:psychic": "mnemonic.darkPsychic",
    "steel:ice": "mnemonic.steelIce",
    "steel:rock": "mnemonic.steelRock",
    "steel:fairy": "mnemonic.steelFairy",
    "fairy:fighting": "mnemonic.fairyFighting",
    "fairy:dragon": "mnemonic.fairyDragon",
    "fairy:dark": "mnemonic.fairyDark"
  };

  function typeMnemonicTexts(attacker, defenders) {
    return unique(defenders.map(defender => {
      const key = TYPE_MNEMONIC_KEYS[`${attacker}:${defender}`];
      if (!key) return null;
      const value = TYPE_CHART[attacker]?.[defender] ?? 1;
      return value === 2 || value === 0 ? t(key) : null;
    }).filter(Boolean));
  }

  function typeMnemonicHtml(attacker, defenders) {
    const texts = typeMnemonicTexts(attacker, defenders);
    if (!texts.length) return "";
    return `<aside class="feedback-mnemonic">
      <div class="feedback-mnemonic-title"><span aria-hidden="true">✦</span><strong>${t("explanation.mnemonicTitle")}</strong></div>
      <div class="feedback-mnemonic-lines">${texts.map(text => `<p>${escapeHtml(text)}</p>`).join("")}</div>
      <small>${t("explanation.mnemonicNote")}</small>
    </aside>`;
  }

  function typeInteractionExplanation(attacker, defenders) {
    const safeDefenders = defenders.filter(type => TYPES.includes(type)).slice(0,2);
    const values = safeDefenders.map(defender => TYPE_CHART[attacker]?.[defender] ?? 1);
    const result = values.reduce((total, value) => total * value, 1);
    const factors = safeDefenders.map((defender,index) => explanationFactorText(attacker,defender,values[index]));
    const formula = `${values.map(formatMultiplier).join(" × ")} = ${formatMultiplier(result)}`;
    let summary;
    if (safeDefenders.length === 1) summary = t("explanation.single.result", { result:formatMultiplier(result) });
    else if (values.includes(0)) summary = t("explanation.dual.immunity");
    else if (result === 4) summary = t("explanation.dual.quad", { formula });
    else if (result === .25) summary = t("explanation.dual.quarter", { formula });
    else if (result === 1 && values.includes(2) && values.includes(.5)) summary = t("explanation.dual.cancel", { formula });
    else if (result === 1 && values.every(value => value === 1)) summary = t("explanation.dual.neutral", { formula });
    else summary = t("explanation.dual.result", { formula, result:formatMultiplier(result) });
    return { attacker, defenders:safeDefenders, values, result, factors, formula, summary, immunity:values.includes(0) };
  }

  function typeInteractionExplanationHtml(attacker, defenders) {
    const explanation = typeInteractionExplanation(attacker,defenders);
    return `<div class="feedback-why${explanation.immunity ? " immunity" : ""}">
      <div class="feedback-why-title"><span aria-hidden="true">?</span><strong>${t("explanation.whyTitle")}</strong></div>
      <div class="feedback-why-factors">${explanation.factors.map(text => `<p>${escapeHtml(text)}</p>`).join("")}</div>
      <p class="feedback-why-summary">${escapeHtml(explanation.summary)}</p>
      ${typeMnemonicHtml(attacker, explanation.defenders)}
    </div>`;
  }

  function matchupBreakdown(attacker, defenders, options = {}) {
    const values = defenders.map(defender => TYPE_CHART[attacker]?.[defender] ?? 1);
    const result = values.reduce((total, value) => total * value, 1);
    const factors = defenders.map((defender, index) => `<div class="feedback-factor">
      <span class="feedback-direction">${typeChip(attacker,"small")}<b aria-hidden="true">→</b>${typeChip(defender,"small")}</span>
      <span class="feedback-factor-result"><strong>${formatMultiplier(values[index])}</strong><small>${escapeHtml(multiplierMeaning(values[index]))}</small></span>
    </div>`).join("");
    const formula = defenders.length > 1 ? `<div class="feedback-formula"><span>${t("session.multiplyFactors")}</span><strong>${values.map(formatMultiplier).join(" × ")} = ${formatMultiplier(result)}</strong></div>` : "";
    const className = options.compact ? "feedback-matchup-card compact" : "feedback-matchup-card";
    const explanation = options.explain ? typeInteractionExplanationHtml(attacker,defenders) : "";
    return `<div class="${className}">${factors}${formula}<div class="feedback-final-result"><span>${t("session.finalResult")}</span><strong>${formatMultiplier(result)}</strong><small>${escapeHtml(multiplierMeaning(result))}</small></div>${explanation}</div>`;
  }
  function feedbackProgressiveDetails(html, open = false) {
    if (!html) return "";
    return `<details class="feedback-progressive-details" ${open ? "open" : ""}><summary><span><strong>${t("cleanup2.feedbackDetails")}</strong><small>${t("cleanup2.feedbackDetailsHint")}</small></span><i aria-hidden="true">⌄</i></summary><div>${html}</div></details>`;
  }

  function feedbackHeading(correct, subtitle = "") {
    return `<div class="feedback-heading"><strong>${correct ? t("session.right") : t("session.notQuite")}</strong>${subtitle ? `<span>${escapeHtml(subtitle)}</span>` : ""}</div>`;
  }

  function feedbackReferenceActions({ types = [], attacker = null, defenders = [] } = {}) {
    const safeTypes = unique(types.filter(type => TYPES.includes(type))).slice(0, 2);
    const safeDefenders = unique(defenders.filter(type => TYPES.includes(type))).slice(0, 2);
    const typeButtons = safeTypes.map(type => `<button type="button" class="feedback-learning-button" data-feedback-type="${type}">${t("explanation.openType", { type:typeLabel(type) })}</button>`).join("");
    const labButton = TYPES.includes(attacker) && safeDefenders.length
      ? `<button type="button" class="feedback-learning-button" data-feedback-lab="true" data-feedback-attack="${attacker}" data-feedback-defenders="${safeDefenders.join(",")}">${t("explanation.openCalculator")}</button>`
      : "";
    if (!typeButtons && !labButton) return "";
    return `<section class="feedback-learning-actions"><small>${t("explanation.learnMore")}</small><div>${typeButtons}${labButton}</div></section>`;
  }

  function explanationLearningHintHtml(spec) {
    if (!spec) return "";
    const keys = [];
    const isDual = spec.kind === "pokemon" ? (spec.pokemon?.types?.length || 0) > 1 : (spec.defendingTypes?.length || 0) > 1;
    if (isDual) keys.push("skill:dual");
    const skillKey = { effectiveness:"skill:effectiveness", multiplier:"skill:multiplier", impact:"skill:impact", pokemon:"skill:pokemon" }[spec.kind];
    if (skillKey) keys.push(skillKey);
    if (spec.attackingType) keys.push(`attack:${spec.attackingType}`);
    (spec.defendingTypes || []).forEach(type => keys.push(`defense:${type}`));
    (spec.pokemon?.types || []).forEach(type => keys.push(`pokemon:${type}`));
    const profile = getLearningProfile();
    const area = unique(keys).map(key => learningAreaForKey(profile, key)).find(item => item && item.total >= 3 && (item.status === "need" || item.status === "developing" || item.trend === "down"));
    if (!area) return "";
    const message = area.key === "skill:dual"
      ? t("explanation.personalDual")
      : t("explanation.personalArea", { area:area.label });
    return `<div class="feedback-learning-hint"><span aria-hidden="true">◎</span><p>${escapeHtml(message)}</p></div>`;
  }

  function pokemonTypeExplanationHtml(spec, selected) {
    const expected = spec.pokemon.types;
    const missing = expected.filter(type => !selected.includes(type));
    const extra = selected.filter(type => !expected.includes(type));
    const typeNames = expected.map(typeLabel).join(state.language === "de" ? " und " : " and ");
    const summary = expected.length === 1
      ? t("explanation.pokemonSingle", { pokemon:spec.pokemon.name, types:typeNames })
      : t("explanation.pokemonDual", { pokemon:spec.pokemon.name, types:typeNames });
    const details = [
      missing.length ? `<p>${escapeHtml(t("explanation.pokemonMissing", { types:missing.map(typeLabel).join(", ") }))}</p>` : "",
      extra.length ? `<p>${escapeHtml(t("explanation.pokemonExtra", { types:extra.map(typeLabel).join(", ") }))}</p>` : ""
    ].join("");
    return `<div class="feedback-why pokemon-explanation">
      <div class="feedback-why-title"><span aria-hidden="true">?</span><strong>${t("explanation.whyTitle")}</strong></div>
      <div class="feedback-why-factors"><p>${escapeHtml(summary)}</p>${details}</div>
      <p class="feedback-why-summary">${escapeHtml(t("explanation.pokemonRule"))}</p>
    </div>`;
  }

  function showFeedbackTypeReference(type) {
    if (!TYPES.includes(type)) return;
    const attack = groupByMultiplier(TYPES, target => effectiveness(type, [target]));
    const defense = groupByMultiplier(TYPES, attacker => effectiveness(attacker, [type]));
    const meta = TYPE_META[type];
    setModalMarkup(`<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="feedbackReferenceTitle">
      <section class="modal-card feedback-reference-modal" style="--type-color:${meta.color}">
        <div class="feedback-reference-head"><span class="feedback-reference-symbol">${meta.icon}</span><div><p class="quiz-kicker">${t("explanation.lexiconKicker")}</p><h2 id="feedbackReferenceTitle">${escapeHtml(typeLabel(type))}</h2><p>${t("explanation.lexiconIntro")}</p></div></div>
        <div class="feedback-reference-grid">
          <article><h3>${t("learn.attackProfile")}</h3>${learnMultiplierGroup("2×",t("learn.strongAgainst"),attack[2],"strong")}${learnMultiplierGroup("½×",t("learn.weakAgainst"),attack[.5],"resist")}${learnMultiplierGroup("0×",t("learn.noEffect"),attack[0],"immune")}</article>
          <article><h3>${t("learn.defenseProfile")}</h3>${learnMultiplierGroup("2×",t("learn.vulnerable"),defense[2],"danger")}${learnMultiplierGroup("½×",t("learn.resists"),defense[.5],"resist")}${learnMultiplierGroup("0×",t("learn.immune"),defense[0],"immune")}</article>
        </div>
        <div class="modal-actions"><button id="closeFeedbackReference" class="primary-button">${t("common.close")}</button></div>
      </section>
    </div>`, { initialFocus:"#closeFeedbackReference" });
    document.getElementById("closeFeedbackReference")?.addEventListener("click", () => closeModal());
  }

  function showFeedbackLabReference(attacker, defenders) {
    const safeDefenders = defenders.filter(type => TYPES.includes(type)).slice(0,2);
    if (!TYPES.includes(attacker) || !safeDefenders.length) return;
    setModalMarkup(`<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="feedbackLabTitle">
      <section class="modal-card feedback-reference-modal compact-reference-modal">
        <div class="feedback-reference-head"><span class="feedback-reference-symbol neutral">×</span><div><p class="quiz-kicker">${t("explanation.calculatorKicker")}</p><h2 id="feedbackLabTitle">${t("explanation.calculatorTitle")}</h2><p>${t("explanation.calculatorIntro")}</p></div></div>
        ${matchupBreakdown(attacker, safeDefenders, { explain:true })}
        <div class="modal-actions"><button id="closeFeedbackReference" class="primary-button">${t("common.close")}</button></div>
      </section>
    </div>`, { initialFocus:"#closeFeedbackReference" });
    document.getElementById("closeFeedbackReference")?.addEventListener("click", () => closeModal());
  }

  function bindFeedbackLearningActions(container) {
    container?.querySelectorAll("[data-feedback-type]").forEach(button => button.addEventListener("click", () => showFeedbackTypeReference(button.dataset.feedbackType)));
    container?.querySelectorAll("[data-feedback-lab]").forEach(button => button.addEventListener("click", () => {
      showFeedbackLabReference(button.dataset.feedbackAttack, String(button.dataset.feedbackDefenders || "").split(",").filter(Boolean));
    }));
  }
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
  function cosmeticName(item) { return item?.nameKey ? t(item.nameKey) : (item?.names?.[state.language] || item?.names?.en || item?.name || ""); }
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
  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function todayKey() { return dateKey(new Date()); }
  function offsetDateKey(offsetDays = 0) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offsetDays);
    return dateKey(date);
  }
  function dailyGoalInfo() {
    const target = 10;
    const progress = Math.min(target, finiteNonNegative(state.daily.goalProgress));
    return {
      target,
      progress,
      remaining: Math.max(0, target - progress),
      percent: Math.min(100, Math.round((progress / target) * 100)),
      completed: Boolean(state.daily.goalCompleted || progress >= target),
      streak: finiteNonNegative(state.daily.streak),
      bestStreak: Math.max(finiteNonNegative(state.daily.bestStreak), finiteNonNegative(state.daily.streak))
    };
  }
  function weeklyGoalEntries() {
    return Array.from({ length: 7 }, (_, index) => {
      const offset = index - 6;
      const key = offsetDateKey(offset);
      const date = new Date(`${key}T12:00:00`);
      const saved = state.daily.history?.[key] || {};
      const isToday = offset === 0;
      const completed = isToday ? dailyGoalInfo().completed : Boolean(saved.completed);
      const progress = isToday ? dailyGoalInfo().progress : finiteNonNegative(saved.progress);
      const label = new Intl.DateTimeFormat(state.language === "de" ? "de-DE" : "en-GB", { weekday: "short" }).format(date).replace(".", "").slice(0, 2);
      return { key, label, completed, progress, isToday };
    });
  }
  function normalizeDailyState(persist = true) {
    const today = todayKey();
    let changed = false;
    if (state.daily.date !== today) {
      const previousDate = state.daily.date;
      if (previousDate && state.daily.history && !state.daily.history[previousDate]) {
        state.daily.history[previousDate] = { progress: finiteNonNegative(state.daily.goalProgress), completed: Boolean(state.daily.goalCompleted) };
      }
      const yesterday = offsetDateKey(-1);
      if (state.daily.lastCompletedDate && ![today, yesterday].includes(state.daily.lastCompletedDate)) state.daily.streak = 0;
      state.daily.date = today;
      state.daily.completed = false;
      state.daily.result = null;
      state.daily.goalProgress = 0;
      state.daily.goalCompleted = false;
      state.daily.goalRewardClaimed = false;
      changed = true;
    }
    state.daily.goalTarget = 10;
    state.daily.history = state.daily.history && typeof state.daily.history === "object" ? state.daily.history : {};
    state.daily.history[today] = { progress: finiteNonNegative(state.daily.goalProgress), completed: Boolean(state.daily.goalCompleted) };
    const keep = new Set(Array.from({ length: 45 }, (_, index) => offsetDateKey(-index)));
    Object.keys(state.daily.history).forEach(key => { if (!keep.has(key)) delete state.daily.history[key]; });
    if (changed && persist) saveState();
    return changed;
  }
  function recordDailyGoalProgress() {
    normalizeDailyState(false);
    const beforeCompleted = Boolean(state.daily.goalCompleted);
    if (!beforeCompleted) state.daily.goalProgress = Math.min(10, finiteNonNegative(state.daily.goalProgress) + 1);
    let completedNow = false;
    let bonusXp = 0;
    if (!beforeCompleted && state.daily.goalProgress >= 10) {
      completedNow = true;
      state.daily.goalCompleted = true;
      const today = todayKey();
      const yesterday = offsetDateKey(-1);
      state.daily.streak = state.daily.lastCompletedDate === yesterday ? finiteNonNegative(state.daily.streak) + 1 : 1;
      state.daily.bestStreak = Math.max(finiteNonNegative(state.daily.bestStreak), state.daily.streak);
      state.daily.lastCompletedDate = today;
      if (!state.daily.goalRewardClaimed) {
        state.daily.goalRewardClaimed = true;
        bonusXp = 25;
      }
    }
    state.daily.history[todayKey()] = { progress: finiteNonNegative(state.daily.goalProgress), completed: Boolean(state.daily.goalCompleted) };
    return { ...dailyGoalInfo(), completedNow, bonusXp, show: !beforeCompleted || completedNow };
  }
  function completeDailyGoalFromPokeidle(round) {
    if (round?.mode !== "daily" || round.status !== "won") return { completedNow:false, bonusXp:0, streak:dailyGoalInfo().streak };
    normalizeDailyState(false);
    const completion = QuizmonMotivation.completeDailyGoal(state.daily, {
      today:todayKey(),
      yesterday:offsetDateKey(-1),
      result:{ source:"pokeidle", solvedAtHint:Math.min(5, Math.max(1, Number(round.revealed) || 1)), lives:Math.max(0, Number(round.lives) || 0) }
    });
    state.daily = completion.state;
    if (completion.bonusXp) addXp(completion.bonusXp);
    unlockAchievement("daily_first", true);
    updateHeader();
    if (completion.completedNow) {
      enqueueToast("🔥", t("daily.completedTitle"), dailyGoalRewardToast(completion.streak, completion.bonusXp), "level");
    }
    return completion;
  }
  function dailyGoalWeekMarkup() {
    return `<div class="daily-goal-week" aria-label="${escapeHtml(t("daily.weekLabel"))}">${weeklyGoalEntries().map(day => `<span class="${day.completed ? "is-complete" : ""} ${day.isToday ? "is-today" : ""}" title="${escapeHtml(day.key)}"><small>${escapeHtml(day.label)}</small><i>${day.completed ? "✓" : ""}</i></span>`).join("")}</div>`;
  }
  function dailyGoalCardMarkup(id = "dailyGoalAction", compact = false) {
    const goal = dailyGoalInfo();
    return `<section class="daily-goal-card ${goal.completed ? "is-complete" : ""} ${compact ? "compact" : ""}" style="--daily-progress:${goal.percent}%">
      <div class="daily-goal-main">
        <span class="daily-goal-flame" aria-hidden="true">${goal.completed ? "✓" : "🔥"}</span>
        <span class="daily-goal-copy"><small>${t("daily.kicker")}</small><strong>${goal.completed ? t("daily.completedTitle") : t("daily.title")}</strong><em>${goal.completed ? tp("daily.completedTextOne", "daily.completedText", goal.streak, { streak: goal.streak }) : t("daily.progressText", { progress: goal.progress, target: goal.target })}</em></span>
        <span class="daily-goal-streak"><small>${t("daily.streak")}</small><strong>🔥 ${goal.streak}</strong></span>
      </div>
      <div class="daily-goal-track" aria-label="${goal.percent}%"><i></i></div>
      ${compact ? "" : dailyGoalWeekMarkup()}
      <button id="${id}" class="daily-goal-action" type="button"><span>${goal.completed ? t("daily.keepTraining") : t("daily.continue")}</span><strong>${goal.completed ? `+${t("daily.doneToday")}` : tp("daily.remainingOne", "daily.remaining", goal.remaining)}</strong><b aria-hidden="true">›</b></button>
    </section>`;
  }
  function startDailyGoalTraining() {
    if (state.lastMode && state.lastConfig && state.daily.completed) {
      state.config[state.lastMode] = { ...state.config[state.lastMode], ...clone(state.lastConfig) };
      startSession(state.lastMode);
      return;
    }
    startDailySession();
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
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.setAttribute("content", actualTheme() === "dark" ? "#05091a" : "#f3f6ff");
      meta.removeAttribute("media");
    });
    document.querySelectorAll("[data-nav-label]").forEach(item => item.textContent = t(`nav.${item.dataset.navLabel}`));
    backButton.setAttribute("aria-label", t("common.back"));
    backButton.setAttribute("title", t("common.back"));
    homeButton.setAttribute("aria-label", t("nav.home"));
    homeButton.setAttribute("title", t("nav.home"));
    levelButton.setAttribute("aria-label", t("profile.openLabel"));
    levelButton.setAttribute("title", t("profile.openLabel"));
    const skipLink = document.querySelector(".skip-link");
    if (skipLink) skipLink.textContent = t("a11y.skipToContent");
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

  function allLevelRewards() {
    return [...PROFILE_AVATARS, ...PROFILE_BANNERS, ...PROFILE_TITLES, ...PROFILE_SETS]
      .filter(item => item?.unlock?.kind === "level");
  }

  function rewardKey(item) { return `${item?.kind || "reward"}:${item?.id || "unknown"}`; }

  function uniqueRewardItems(items = []) {
    const seen = new Set();
    return items.filter(item => {
      const key = rewardKey(item);
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function nextLevelRewardInfo(level = getLevelInfo().current.level) {
    const future = allLevelRewards().filter(item => Number(item.unlock.value) > Number(level));
    if (!future.length) return null;
    const targetLevel = Math.min(...future.map(item => Number(item.unlock.value)));
    const levelEntry = LEVELS.find(entry => Number(entry.level) === targetLevel);
    return {
      level: targetLevel,
      xp: levelEntry?.xp ?? state.stats.xp,
      xpRemaining: Math.max(0, (levelEntry?.xp ?? state.stats.xp) - state.stats.xp),
      items: uniqueRewardItems(future.filter(item => Number(item.unlock.value) === targetLevel))
    };
  }

  function rewardKindLabel(item) { return t(`rewards.kind.${item?.kind || "title"}`); }

  function rewardVisualMarkup(item, extraClass = "") {
    if (!item) return `<span class="reward-visual reward-generic ${extraClass}" aria-hidden="true">?</span>`;
    if (item.kind === "avatar") return profileAvatarMarkup(item.id, `reward-visual reward-avatar ${extraClass}`);
    if (item.kind === "banner") return `<span class="reward-visual reward-banner profile-banner profile-banner-${item.id} ${extraClass}" aria-hidden="true"><i></i></span>`;
    if (item.kind === "set") return `<span class="reward-visual reward-set ${extraClass}" aria-hidden="true">SET</span>`;
    if (item.kind === "title") return "";
    return `<span class="reward-visual reward-generic ${extraClass}" aria-hidden="true">?</span>`;
  }

  function rewardHeadline(info) {
    if (!info?.items?.length) return "";
    const first = cosmeticName(info.items[0]);
    const remaining = info.items.length - 1;
    return remaining > 0 ? `${first} · ${t("rewards.more", { count: remaining })}` : first;
  }

  function rewardListMarkup(items = []) {
    return uniqueRewardItems(items).map(item => {
      const visual = rewardVisualMarkup(item);
      return `<article class="reward-list-item ${visual ? "" : "no-visual"}">
        ${visual}
        <span><small>${escapeHtml(rewardKindLabel(item))}</small><strong>${escapeHtml(cosmeticName(item))}</strong></span>
      </article>`;
    }).join("");
  }


  function collectionProgressInfo() {
    const avatars = unlockedProfileCount(PROFILE_AVATARS);
    const banners = unlockedProfileCount(PROFILE_BANNERS);
    const titles = unlockedProfileCount(PROFILE_TITLES);
    const sets = PROFILE_SETS.filter(set => profileSetStatus(set).complete).length;
    const totalAvatars = PROFILE_AVATARS.length;
    const totalBanners = PROFILE_BANNERS.length;
    const totalTitles = PROFILE_TITLES.length;
    const totalSets = PROFILE_SETS.length;
    const unlocked = avatars + banners + titles + sets;
    const total = totalAvatars + totalBanners + totalTitles + totalSets;
    return {
      avatars, banners, titles, sets,
      totalAvatars, totalBanners, totalTitles, totalSets,
      unlocked, total,
      percent: total ? Math.round((unlocked / total) * 100) : 0
    };
  }

  function collectionProgressMarkup(buttonId, variant = "full") {
    const info = collectionProgressInfo();
    const compact = variant === "compact";
    return `<section class="collection-progress-card ${compact ? "compact" : ""}" style="--collection-progress:${info.percent}%">
      <div class="collection-progress-heading">
        <span class="collection-progress-icon" aria-hidden="true">◇</span>
        <span><small>${t("collection.kicker")}</small><strong>${t("collection.title")}</strong><em>${t("collection.total", { unlocked: info.unlocked, total: info.total })}</em></span>
        <b>${info.percent}%</b>
      </div>
      <div class="collection-progress-track" aria-label="${info.percent}%"><i></i></div>
      ${compact ? "" : `<div class="collection-category-grid">
        <span><small>${t("profile.avatarsTab")}</small><strong>${info.avatars}/${info.totalAvatars}</strong></span>
        <span><small>${t("profile.bannersTab")}</small><strong>${info.banners}/${info.totalBanners}</strong></span>
        <span><small>${t("profile.titlesTab")}</small><strong>${info.titles}/${info.totalTitles}</strong></span>
        <span><small>${t("profile.setsTab")}</small><strong>${info.sets}/${info.totalSets}</strong></span>
      </div>`}
      ${buttonId ? `<button id="${buttonId}" type="button" class="collection-progress-action">${t("collection.open")}<span aria-hidden="true">›</span></button>` : ""}
    </section>`;
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
  function sessionModeName() {
    if(session?.trainingList?.name)return session.trainingList.name;
    if(session?.mode==="path"&&session.pathModuleId){const module=pathModuleById(session.pathModuleId);if(module)return t(module.titleKey);}
    return modeName(session?.mode||"path");
  }

  function scrollRouteToTop() {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    root.scrollTop = 0;
    document.body.scrollTop = 0;
    requestAnimationFrame(() => {
      root.scrollTop = 0;
      document.body.scrollTop = 0;
      root.style.scrollBehavior = previous;
    });
  }

  function captureRouteSnapshot() {
    return {
      route: state.route,
      learnTab: state.learnTab,
      statsTab: state.statsTab,
      knowledge: {
        view: knowledgeView,
        learnType,
        pokemonId: knowledgePokemonId,
        pokemonPage: knowledgePokemonPage,
        pokemonTab: knowledgePokemonDetailTab,
        contentKind: knowledgeContentKind,
        contentId: knowledgeContentId,
        contentPage: knowledgeContentPage,
        searchQuery: knowledgeSearchQuery,
        searchFilter: knowledgeSearchFilter,
        searchVisibleCount: knowledgeSearchVisibleCount,
        searchOrigin: knowledgeSearchOrigin,
        searchOpenedResult: knowledgeSearchOpenedResult,
        searchResultScrollY: knowledgeSearchResultScrollY
      },
      scrollY: Math.max(0, window.scrollY || document.documentElement.scrollTop || 0)
    };
  }

  function browserHistoryState(snapshot = captureRouteSnapshot(), index = browserHistoryIndex) {
    return { quizmon: { index, snapshot } };
  }

  function routeHistoryUrl(route = state.route) {
    const url = new URL(location.href);
    url.searchParams.set("route", QuizmonRouter.validRoute(route) ? route : "home");
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function replaceBrowserHistorySnapshot() {
    if (applyingBrowserHistory || !history?.replaceState) return;
    history.replaceState(browserHistoryState(), "", routeHistoryUrl());
  }

  function pushBrowserHistorySnapshot() {
    if (applyingBrowserHistory || !history?.pushState) return;
    browserHistoryIndex += 1;
    history.pushState(browserHistoryState(), "", routeHistoryUrl());
  }

  function restoreRouteSnapshot(snapshot, options = {}) {
    if (!snapshot || !QuizmonRouter.validRoute(snapshot.route)) return false;
    applyingBrowserHistory = true;
    state.route = snapshot.route;
    state.learnTab = ["path","lab","cards"].includes(snapshot.learnTab) ? snapshot.learnTab : state.learnTab;
    state.statsTab = typeof snapshot.statsTab === "string" ? snapshot.statsTab : state.statsTab;
    const knowledge = snapshot.knowledge || {};
    knowledgeView = typeof knowledge.view === "string" ? knowledge.view : "home";
    learnType = TYPES.includes(knowledge.learnType) ? knowledge.learnType : null;
    knowledgePokemonId = Number.isFinite(Number(knowledge.pokemonId)) ? Number(knowledge.pokemonId) : null;
    knowledgePokemonPage = Math.max(0, Number(knowledge.pokemonPage) || 0);
    knowledgePokemonDetailTab = ["overview","moves","evolution"].includes(knowledge.pokemonTab) ? knowledge.pokemonTab : "overview";
    knowledgeContentKind = typeof knowledge.contentKind === "string" ? knowledge.contentKind : null;
    knowledgeContentId = knowledge.contentId ?? null;
    knowledgeContentPage = Math.max(0, Number(knowledge.contentPage) || 0);
    knowledgeSearchQuery = typeof knowledge.searchQuery === "string" ? knowledge.searchQuery : "";
    knowledgeSearchFilter = QuizmonKnowledgeSearch.KIND_ORDER.includes(knowledge.searchFilter) ? knowledge.searchFilter : "all";
    knowledgeSearchVisibleCount = Math.max(KNOWLEDGE_SEARCH_PAGE_SIZE, Number(knowledge.searchVisibleCount) || KNOWLEDGE_SEARCH_PAGE_SIZE);
    knowledgeSearchOrigin = knowledge.searchOrigin && typeof knowledge.searchOrigin === "object" ? knowledge.searchOrigin : null;
    knowledgeSearchOpenedResult = Boolean(knowledge.searchOpenedResult);
    knowledgeSearchResultScrollY = Math.max(0, Number(knowledge.searchResultScrollY) || 0);
    saveState();
    render();
    applyingBrowserHistory = false;
    restoreKnowledgeScroll(snapshot.scrollY);
    requestAnimationFrame(() => view.focus({ preventScroll: true }));
    if (options.replace) replaceBrowserHistorySnapshot();
    return true;
  }

  function initializeBrowserHistory() {
    const existing = history.state?.quizmon;
    browserHistoryIndex = Number.isFinite(Number(existing?.index)) ? Number(existing.index) : 0;
    history.replaceState(browserHistoryState(captureRouteSnapshot(), browserHistoryIndex), "", routeHistoryUrl());
  }

  function canUseBrowserBack() {
    return browserHistoryIndex > 0 && Boolean(history.state?.quizmon);
  }

  function setRoute(route, options = {}) {
    const fromRoute = state.route;
    const changed = fromRoute !== route;
    if (!options.fromHistory && (changed || options.forceHistory)) replaceBrowserHistorySnapshot();
    prepareRouteMotion(fromRoute, route, options.direction);
    state.route = route;
    saveState();
    render();

    if (!changed) {
      if (options.forceHistory && !options.fromHistory) pushBrowserHistorySnapshot();
      if (!options.preserveScroll) {
        if (motionEnabled()) window.scrollTo({ top: 0, behavior: "smooth" });
        else scrollRouteToTop();
      }
      return;
    }

    if (!options.preserveScroll) scrollRouteToTop();
    if (!options.fromHistory) pushBrowserHistorySnapshot();
    requestAnimationFrame(() => view.focus({ preventScroll: true }));
  }

  function isInnerRoute(route) { return QuizmonRouter.isInnerRoute(route); }

  function updateHeader() {
    const level = getLevelInfo();
    const goal = dailyGoalInfo();
    levelNumber.textContent = `Lv. ${level.current.level}`;
    headerStreak.textContent = `🔥 ${goal.streak}`;
    levelButton?.style.setProperty("--header-level-progress", `${level.progress}%`);
    if(brandVersion)brandVersion.textContent=["knowledge","learn-detail"].includes(state.route)?`${PUBLIC_VERSION} · ${t("nav.knowledge")}`:PUBLIC_VERSION;
    headerStreak.setAttribute("title", tp("daily.streakLabelOne", "daily.streakLabel", goal.streak));
    headerStreak.setAttribute("aria-label", tp("daily.streakLabelOne", "daily.streakLabel", goal.streak));
  }

  function updateNavigation() {
    const inner = isInnerRoute(state.route);
    let active = state.route;
    if (state.route.startsWith("setup-") || ["session", "summary"].includes(state.route)) active = "train";
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
    if (state.route === "play") label = t("nav.play");
    else if (state.route === "train" || state.route.startsWith("setup-") || ["session", "summary"].includes(state.route)) label = t("nav.train");
    else if (state.route === "learn") label = t("nav.learn");
    else if (["knowledge", "learn-detail"].includes(state.route)) label = t("nav.knowledge");
    else if (state.route === "stats") label = t("nav.stats");
    else if (state.route === "settings") label = t("nav.settings");
    else if (state.route === "support") label = t("nav.support");
    else if (state.route === "profile") label = t("profile.title");
    document.title = state.route === "home" ? "Quizmon" : `Quizmon – ${label}`;
  }

  function currentRouteLabel() {
    if (state.route === "session") {
      const total = Number.isFinite(session?.length) ? session.length : (session?.sequence?.length || 0);
      return session ? `${t("nav.train")} · ${tp("a11y.questionOne", "a11y.questionMany", (session.index || 0) + 1, { total })}` : t("nav.train");
    }
    if (state.route === "summary") return t("a11y.summaryOpened");
    if (state.route === "profile") return t("profile.title");
    if (state.route === "learn-detail") return t("nav.knowledge");
    if (state.route.startsWith("setup-")) return t("nav.train");
    return t(`nav.${state.route}`);
  }

  function announceRoute() {
    QuizmonRouter.announce(routeAnnouncer, currentRouteLabel());
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
      else if (state.route === "play") renderPlay();
      else if (state.route === "train") renderTrain();
      else if (state.route === "learn") renderLearn();
      else if (state.route === "knowledge") renderKnowledgePage();
      else if (state.route === "learn-detail") renderLearnDetail();
      else if (state.route === "stats") renderStats();
      else if (state.route === "settings") renderSettings();
      else if (state.route === "support") renderFutureArea("support");
      else if (state.route === "profile") renderProfile();
      else if (state.route.startsWith("setup-")) renderSetup(state.route.replace("setup-", ""));
      else if (state.route === "session") renderQuestion();
      else if (state.route === "summary") renderSummary();
      else { state.route = "home"; renderHome(); }

      announceRoute();
      if (!state.onboardingComplete && !onboardingOpen) openOnboarding(0);
    } catch (error) {
      renderRecoveryState(error);
    }
  }


  function buildRecommendationContext() {
    const profile = getLearningProfile();
    const analysis = summarizeErrorAnalysis();
    const activePattern = analysis.patterns.find(item => item.confidence.id !== "first" && ["worsening","active"].includes(item.development.status)) || null;
    const availablePattern = analysis.patterns.find(item => item.confidence.id !== "first" && item.development.status !== "resolved") || null;
    const smart = smartRecommendation(profile);
    const nextPath = pathNextModule();
    const openMistakeSpecs = state.stats.mistakes.filter(item => item?.status !== "resolved" && item?.spec).map(item => clone(item.spec));
    let primary;
    if (activePattern) {
      primary = {
        kind:"problem", icon:errorPatternIcon(activePattern), title:errorPatternTitle(activePattern), text:errorPatternText(activePattern),
        action:"problem", patternKey:activePattern.key, questionCount:8,
        meta:t("cleanup.meta.problem"), label:t("cleanup.action.problem"),
        accentType:activePattern.sample?.attackingType || activePattern.sample?.defendingTypes?.[0] || null
      };
    } else if (["need","declining","discovery"].includes(smart.kind)) {
      primary = { ...smart, action:"smart", questionCount:10, meta:t("cleanup.meta.smart"), label:t("cleanup.action.smart"), accentType:smart.area?.type || null };
    } else if (nextPath) {
      primary = {
        kind:"path", icon:nextPath.icon, title:t(nextPath.titleKey), text:t(nextPath.subtitleKey),
        action:"path", moduleId:nextPath.id, questionCount:nextPath.questions?.length || 5,
        meta:t("cleanup.meta.path"), label:t("cleanup.action.path"), accentType:nextPath.types?.[0] || null
      };
    } else {
      primary = { ...smart, action:"smart", questionCount:10, meta:t("cleanup.meta.smart"), label:t("cleanup.action.smart"), accentType:smart.area?.type || null };
    }
    return { profile, analysis, activePattern, availablePattern, smart, nextPath, openMistakeSpecs, primary };
  }

  function primaryLearningRecommendation(context = null) {
    return (context || buildRecommendationContext()).primary;
  }
  function primaryRecommendationFocusMarkup(recommendation) {
    if (recommendation.action === "problem") {
      const pattern = errorPatternByKey(recommendation.patternKey);
      if (pattern?.sample?.attackingType) return `<div class="adaptive-focus-types">${typeChip(pattern.sample.attackingType,"small")}<span>→</span>${(pattern.sample.defendingTypes||[]).slice(0,2).map(type=>typeChip(type,"small")).join("")}</div>`;
    }
    if (recommendation.action === "path") {
      const module = pathModuleById(recommendation.moduleId);
      if (module?.types?.length) return `<div class="adaptive-focus-types">${module.types.slice(0,3).map(type=>typeChip(type,"small")).join("")}</div>`;
    }
    if (recommendation.area?.type) return `<div class="adaptive-focus-types">${typeChip(recommendation.area.type,"small")}</div>`;
    return "";
  }

  function activatePrimaryRecommendation(recommendation) {
    if (!recommendation) return;
    if (recommendation.action === "problem") { showErrorPatternDetail(recommendation.patternKey); return; }
    if (recommendation.action === "path") { state.learnTab="path"; setRoute("learn"); requestAnimationFrame(()=>openLearningPathModule(recommendation.moduleId)); return; }
    showSmartTrainingPreview();
  }

  function showPrimaryRecommendationReason(recommendation) {
    if (!recommendation) return;
    setModalMarkup(`<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="primaryReasonTitle"><section class="modal-card adaptive-reason-modal" tabindex="-1">
      <header><span aria-hidden="true">${recommendation.icon}</span><div><p class="quiz-kicker">${t("cleanup.whyKicker")}</p><h2 id="primaryReasonTitle">${escapeHtml(recommendation.title)}</h2><p>${escapeHtml(recommendation.text)}</p></div></header>
      <section><strong>${t("cleanup.whyTitle")}</strong><p>${t("cleanup.whyText")}</p></section>
      <div class="modal-actions"><button id="closePrimaryReason" class="secondary-button">${t("common.close")}</button><button id="continuePrimaryReason" class="primary-button">${escapeHtml(recommendation.label)}</button></div>
    </section></div>`, { initialFocus:"#continuePrimaryReason" });
    document.getElementById("closePrimaryReason")?.addEventListener("click",()=>closeModal());
    document.getElementById("continuePrimaryReason")?.addEventListener("click",()=>closeModal(()=>activatePrimaryRecommendation(recommendation)));
  }

  function compactDailyProgressMarkup(id = "dailyMixAction") {
    const goal=dailyGoalInfo();
    return `<section class="adaptive-daily-progress ${goal.completed?"complete":""}" style="--daily-progress:${goal.percent}%">
      <div><span aria-hidden="true">${goal.completed?"✓":"🔥"}</span><div><small>${t("cleanup.dailyKicker")}</small><strong>${goal.completed?t("cleanup.dailyComplete"):t("cleanup.dailyTitle")}</strong><p>${goal.completed?tp("cleanup.dailyCompleteTextOne","cleanup.dailyCompleteText",goal.streak,{streak:goal.streak}):t("cleanup.dailyProgress",{progress:goal.progress,target:goal.target})}</p></div></div>
      <i><b></b></i>
      <button id="${id}" type="button">${t("cleanup.dailyMix")}<span aria-hidden="true">›</span></button>
    </section>`;
  }

  function adaptiveHeroMarkup(recommendation, context = "home") {
    const accent=recommendation.accentType&&TYPE_META[recommendation.accentType]?TYPE_META[recommendation.accentType].color:"var(--primary)";
    return `<section class="adaptive-recommendation-hero ${context} ${recommendation.kind}" style="--adaptive-accent:${accent}">
      <div class="adaptive-recommendation-glow" aria-hidden="true"></div>
      <div class="adaptive-recommendation-top"><span class="adaptive-recommendation-icon" aria-hidden="true">${recommendation.icon}</span><span>${t("cleanup.adaptiveKicker")}</span><em>${t("cleanup.adaptiveBadge")}</em></div>
      <div class="adaptive-recommendation-copy"><small>${t("cleanup.todayRecommendation")}</small><h2>${escapeHtml(recommendation.title)}</h2><p>${escapeHtml(recommendation.text)}</p>${primaryRecommendationFocusMarkup(recommendation)}</div>
      <div class="adaptive-recommendation-footer"><span><b>${recommendation.questionCount}</b> ${t("cleanup.questions")}</span><span>${escapeHtml(recommendation.meta)}</span></div>
      <div class="adaptive-recommendation-actions"><button class="primary-button" data-primary-recommendation>${escapeHtml(recommendation.label)} <span aria-hidden="true">›</span></button><button class="adaptive-why-button" data-primary-reason>${t("cleanup.whyButton")}</button></div>
    </section>`;
  }


  function homeAdaptiveCardMarkup(recommendation) {
    const accent=recommendation.accentType&&TYPE_META[recommendation.accentType]?TYPE_META[recommendation.accentType].color:"var(--primary)";
    return `<section class="home-adaptive-card ${recommendation.kind}" style="--adaptive-accent:${accent}">
      <div class="home-adaptive-card-head"><span aria-hidden="true">${recommendation.icon}</span><div><small>${t("cleanup.adaptiveKicker")}</small><strong>${t("cleanup.todayRecommendation")}</strong></div><em>${t("cleanup.adaptiveBadge")}</em></div>
      <div class="home-adaptive-card-copy"><h2>${escapeHtml(recommendation.title)}</h2><p>${escapeHtml(recommendation.text)}</p>${primaryRecommendationFocusMarkup(recommendation)}</div>
      <div class="home-adaptive-card-meta"><span><b>${recommendation.questionCount}</b> ${t("cleanup.questions")}</span><span>${escapeHtml(recommendation.meta)}</span></div>
      <div class="home-adaptive-card-actions"><button class="primary-button" data-primary-recommendation>${escapeHtml(recommendation.label)} <span aria-hidden="true">›</span></button><button class="adaptive-why-button" data-primary-reason>${t("cleanup.whyButton")}</button></div>
    </section>`;
  }

  function whosPokemonName(item) { return item?.[state.language] || item?.en || item?.de || ""; }
  function whosDifficultyName(difficulty) { return t(`whos.difficulty.${difficulty}`); }
  function whosNumber(value) {
    return new Intl.NumberFormat(state.language === "de" ? "de-DE" : "en-US", { maximumFractionDigits: 1 }).format(Number(value) || 0);
  }
  function whosStatNames(edge) {
    return (edge?.keys || []).map(key => t(`knowledge.stat.${key}`)).join(" / ");
  }
  function whosAbilityName(id) {
    const ability = QuizmonKnowledgeContent.ABILITY_BY_ID.get(Number(id));
    return ability ? (ability[state.language] || ability.en || ability.de) : `#${id}`;
  }
  function whosEvolutionMethodLabel(value) {
    if (!value?.method) return t("whos.method.special");
    return t(`whos.method.${value.method}`, value);
  }
  function formatWhosHint(descriptor, target) {
    const value = descriptor?.value;
    if (!descriptor || !value && value !== 0) return "";
    if (descriptor.kind === "statSignature") return t("whos.hint.statSignature", {
      highStat: whosStatNames(value.high), highValue: value.high.value,
      lowStat: whosStatNames(value.low), lowValue: value.low.value
    });
    if (descriptor.kind === "abilityProfile") return t("whos.hint.abilityProfile", { abilities: value.map(row => whosAbilityName(row.id)).join(" · ") });
    if (descriptor.kind === "measurements") return t("whos.hint.measurements", { height: whosNumber(value.height / 10), weight: whosNumber(value.weight / 10) });
    if (descriptor.kind === "originProfile") return t("whos.hint.originProfile", value);
    if (descriptor.kind === "defenseProfile") return t("whos.hint.defenseProfile", {
      ...value,
      weaknessLabel: t(value.weaknesses === 1 ? "whos.count.weaknessOne" : "whos.count.weaknessMany"),
      resistanceLabel: t(value.resistances === 1 ? "whos.count.resistanceOne" : "whos.count.resistanceMany"),
      immunityLabel: t(value.immunities === 1 ? "whos.count.immunityOne" : "whos.count.immunityMany")
    });
    if (descriptor.kind === "baseTotal") return t("whos.hint.baseTotal", { value });
    if (descriptor.kind === "generation") return t("whos.hint.generation", { generation: value, region: knowledgeRegionLabel(value) });
    if (descriptor.kind === "dexRange") return t("whos.hint.dexRange", value);
    if (descriptor.kind === "strongestStat") return t("whos.hint.strongestStat", { stat: whosStatNames(value), value: value.value });
    if (descriptor.kind === "weakestStat") return t("whos.hint.weakestStat", { stat: whosStatNames(value), value: value.value });
    if (descriptor.kind === "battleStyle") return t("whos.hint.battleStyle", { style: t(`whos.style.${value}`) });
    if (descriptor.kind === "typeCount") return t(value === 1 ? "whos.hint.typeCountOne" : "whos.hint.typeCount", { count: value });
    if (descriptor.kind === "typeOne") return t("whos.hint.typeOne", { type: typeLabel(value) });
    if (descriptor.kind === "typeCombo") return t("whos.hint.typeCombo", { types: String(value).split("|").map(typeLabel).join(" / ") });
    if (descriptor.kind === "matchup") {
      const key = value.relation === "weak" ? "whos.hint.matchupWeak" : value.relation === "immune" ? "whos.hint.matchupImmune" : "whos.hint.matchupResist";
      return t(key, { type: typeLabel(value.type), multiplier: formatMultiplier(value.multiplier) });
    }
    if (descriptor.kind === "singleAbility") return t(value.hidden ? "whos.hint.hiddenAbility" : "whos.hint.singleAbility", { ability: whosAbilityName(value.id) });
    if (descriptor.kind === "evolutionStage") return t("whos.hint.evolutionStage", { stage: value });
    if (descriptor.kind === "familySize") return t("whos.hint.familySize", { count: value });
    if (descriptor.kind === "evolutionNeighbor") {
      const neighbor = WHOS_CONTEXT.byId.get(Number(value.id));
      return t(value.direction === "from" ? "whos.hint.evolutionFrom" : "whos.hint.evolutionTo", { name: whosPokemonName(neighbor) });
    }
    if (descriptor.kind === "evolutionMethod") return t("whos.hint.evolutionMethod", { method: whosEvolutionMethodLabel(value) });
    if (descriptor.kind === "specialGroup") return t("whos.hint.specialGroup", { group: t(`whos.group.${value}`) });
    if (descriptor.kind === "heightBand") return t("whos.hint.heightBand", { band: t(`whos.height.${value}`) });
    if (descriptor.kind === "weightBand") return t("whos.hint.weightBand", { band: t(`whos.weight.${value}`) });
    if (descriptor.kind === "namePattern") {
      const pattern = value[state.language === "de" ? "de" : "en"];
      return t("whos.hint.namePattern", pattern);
    }
    if (descriptor.kind === "evolutionGap") {
      const line = value.map(id => Number(id) === Number(target?.id) ? "????" : whosPokemonName(WHOS_CONTEXT.byId.get(Number(id)))).join(" · ");
      return t("whos.hint.evolutionGap", { line });
    }
    if (["shadow", "pixel", "crop", "cry"].includes(descriptor.kind)) return t(`whos.media.${descriptor.kind}`);
    return "";
  }

  function whosCryUrl(target) {
    return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${Number(target.id)}.ogg`;
  }
  function whosMediaFallbackMarkup(descriptor, target) {
    const fallback = descriptor?.value?.fallback;
    return `<p class="whos-media-fallback" hidden>${escapeHtml(fallback ? formatWhosHint(fallback, target) : t("whos.media.unavailable"))}</p>`;
  }
  function whosHintContentMarkup(descriptor, target) {
    if (!["shadow", "pixel", "crop", "cry"].includes(descriptor?.kind)) return `<p>${escapeHtml(formatWhosHint(descriptor, target))}</p>`;
    const strength = escapeHtml(descriptor.value?.strength || "medium");
    const artwork = escapeHtml(`${knowledgeArtwork(target)}?quizmon-media=1`);
    const fallback = whosMediaFallbackMarkup(descriptor, target);
    if (descriptor.kind === "cry") return `<div class="whos-media-hint whos-cry-hint" data-whos-media>
      <audio preload="metadata" src="${escapeHtml(whosCryUrl(target))}"></audio>
      <button type="button" class="whos-cry-play" data-whos-cry-play><span aria-hidden="true">▶</span>${t("whos.media.playCry")}</button>
      <label><span>${t("whos.media.volume")}</span><input type="range" min="0" max="100" value="70" data-whos-volume aria-label="${escapeHtml(t("whos.media.volume"))}"></label>
      <button type="button" class="whos-cry-mute" data-whos-mute aria-pressed="false">${t("whos.media.mute")}</button>${fallback}</div>`;
    return `<div class="whos-media-hint whos-${descriptor.kind}-hint strength-${strength}" data-whos-media>
      <div class="whos-media-stage" style="--media-anchor:${Number(descriptor.value?.anchor) || 50}%"><img src="${artwork}" alt="${escapeHtml(t(`whos.media.${descriptor.kind}Alt`))}" crossorigin="anonymous"></div>${fallback}</div>`;
  }

  function bindWhosMediaHints(root = view) {
    root.querySelectorAll("[data-whos-media] img").forEach(image => image.addEventListener("error", () => {
      image.closest(".whos-media-stage")?.setAttribute("hidden", "");
      const fallback = image.closest("[data-whos-media]")?.querySelector(".whos-media-fallback");
      if (fallback) fallback.hidden = false;
    }, { once: true }));
    root.querySelectorAll(".whos-cry-hint").forEach(container => {
      const audio = container.querySelector("audio");
      const play = container.querySelector("[data-whos-cry-play]");
      const volume = container.querySelector("[data-whos-volume]");
      const mute = container.querySelector("[data-whos-mute]");
      if (!audio || !play || !volume || !mute) return;
      const difficulty = container.closest("[data-whos-difficulty]")?.dataset.whosDifficulty;
      const limit = difficulty === "easy" ? Number.POSITIVE_INFINITY : difficulty === "hard" ? 0.55 : 1.6;
      const fail = () => { container.querySelector(".whos-media-fallback").hidden = false; play.disabled = true; };
      audio.addEventListener("error", fail, { once: true });
      audio.addEventListener("timeupdate", () => { if (audio.currentTime >= limit) { audio.pause(); audio.currentTime = 0; play.querySelector("span").textContent = "▶"; } });
      audio.addEventListener("ended", () => { play.querySelector("span").textContent = "▶"; });
      play.addEventListener("click", () => { audio.currentTime = 0; audio.play().then(() => { play.querySelector("span").textContent = "■"; }).catch(fail); });
      volume.addEventListener("input", () => { audio.volume = Number(volume.value) / 100; audio.muted = false; mute.setAttribute("aria-pressed", "false"); mute.textContent = t("whos.media.mute"); });
      mute.addEventListener("click", () => { audio.muted = !audio.muted; mute.setAttribute("aria-pressed", String(audio.muted)); mute.textContent = t(audio.muted ? "whos.media.unmute" : "whos.media.mute"); const fallback = container.querySelector(".whos-media-fallback"); if (fallback) fallback.hidden = !audio.muted; });
      audio.volume = .7;
    });
  }

  function whosDifficultyCard(difficulty, numeral) {
    const selected = state.whosThat.difficulty === difficulty;
    return `<button type="button" class="whos-difficulty-card ${selected ? "selected" : ""}" data-whos-difficulty="${difficulty}" aria-pressed="${selected}">
      <span aria-hidden="true">${numeral}</span><div><strong>${t(`whos.difficulty.${difficulty}`)}</strong><p>${t(`whos.difficulty.${difficulty}Desc`)}</p></div><i aria-hidden="true">${selected ? "✓" : ""}</i>
    </button>`;
  }

  function whosTodayKey() {
    const localKey = QuizmonWhosThatPokemon.utcDateKey(new Date());
    const previous = state.whosThat.daily.lastTrustedDate;
    const trusted = previous && previous > localKey ? previous : localKey;
    state.whosThat.daily.lastTrustedDate = trusted;
    return trusted;
  }

  function whosDailyEntry(dateKey = whosTodayKey()) {
    return state.whosThat.daily.history?.[dateKey] || null;
  }

  function startWhosDailyRound() {
    const dateKey = whosTodayKey();
    const finished = whosDailyEntry(dateKey);
    if (finished) {
      const saved = QuizmonWhosThatPokemon.sanitizeRound(finished.round, WHOS_CONTEXT);
      if (saved) { state.whosThat.round = saved; saveState(); renderPlay(); }
      return;
    }
    state.whosThat.round = QuizmonWhosThatPokemon.createDailyRound({ context: WHOS_CONTEXT, date: `${dateKey}T12:00:00.000Z` });
    whosSuggestionQuery = "";
    whosSelectedPokemonId = null;
    saveState();
    renderPlay();
  }

  function completeWhosRound(round) {
    if (!round || round.status === "active" || state.whosThat.completedRoundIds.includes(round.id)) return;
    const score = QuizmonWhosThatPokemon.scoreRound(round);
    state.whosThat.completedRoundIds = [...state.whosThat.completedRoundIds, round.id].slice(-300);
    state.whosThat.statistics = QuizmonWhosThatPokemon.recordStatistics(state.whosThat.statistics, round, score);
    addXp(score.xp);
    const dailyGoalCompletion = completeDailyGoalFromPokeidle(round);
    if (round.mode === "daily" && round.dailyDate) {
      const result = { date: round.dailyDate, solvedAtHint: score.solvedAtHint, status: round.status, lives: round.lives, points: score.points, xp:score.xp + dailyGoalCompletion.bonusXp, dailyGoalCompleted:round.status === "won" };
      state.whosThat.daily.history[round.dailyDate] = { result, round: clone(round) };
      state.whosThat.daily.pendingUploads = [...state.whosThat.daily.pendingUploads.filter(item => item.date !== round.dailyDate), result].slice(-30);
      queueMicrotask(syncWhosDailyResults);
    }
  }

  async function syncWhosDailyResults() {
    const baseUrl = QuizmonDailyService.endpoint();
    if (!baseUrl || !navigator.onLine || !state.whosThat.daily.pendingUploads.length) return;
    const pending = [...state.whosThat.daily.pendingUploads];
    for (const result of pending) {
      try {
        await QuizmonDailyService.submit(baseUrl, state.whosThat.daily.installationId, result, QuizmonNetwork.fetchJson);
        state.whosThat.daily.pendingUploads = state.whosThat.daily.pendingUploads.filter(item => item.date !== result.date);
        const distribution = await QuizmonDailyService.distribution(baseUrl, result.date, QuizmonNetwork.fetchJson);
        if (distribution) state.whosThat.daily.distribution = { date: result.date, ...distribution };
        saveState();
      } catch (error) { logError(error, "whos.dailySync"); break; }
    }
  }

  function whosStatisticsMarkup() {
    const stats = state.whosThat.statistics;
    const rate = stats.played ? Math.round(stats.won / stats.played * 100) : 0;
    const average = stats.played ? (stats.totalHints / stats.played).toFixed(1) : "–";
    return `<section class="whos-stats-card" aria-labelledby="whosStatsTitle"><header><div><small>${t("whos.stats.kicker")}</small><h2 id="whosStatsTitle">${t("whos.stats.title")}</h2></div><b>${stats.played}</b></header><div class="whos-stat-grid"><span><small>${t("whos.stats.winRate")}</small><strong>${rate}%</strong></span><span><small>${t("whos.stats.averageHints")}</small><strong>${average}</strong></span><span><small>${t("whos.stats.firstHint")}</small><strong>${stats.firstHintWins}</strong></span><span><small>${t("whos.stats.best")}</small><strong>${stats.bestPoints}</strong></span></div></section>`;
  }

  function whosDailyCardMarkup() {
    const dateKey = whosTodayKey();
    const entry = whosDailyEntry(dateKey);
    return `<section class="whos-daily-card ${entry ? "completed" : ""}" aria-labelledby="whosDailyTitle"><span class="whos-daily-calendar" aria-hidden="true">${dateKey.slice(-2)}</span><div><small>${t("whos.daily.kicker")}</small><h2 id="whosDailyTitle">${t("whos.daily.title")}</h2><p>${entry ? t("whos.daily.completed", { hint: entry.result.solvedAtHint || "–" }) : t("whos.daily.text")}</p></div><button type="button" id="startWhosDaily" class="secondary-button">${t(entry ? "whos.daily.view" : "whos.daily.start")}</button></section>`;
  }

  function startWhosRound(difficulty = state.whosThat.difficulty) {
    try {
      const safeDifficulty = QuizmonWhosThatPokemon.DIFFICULTIES.includes(difficulty) ? difficulty : "medium";
      state.whosThat.difficulty = safeDifficulty;
      state.whosThat.round = QuizmonWhosThatPokemon.createRound({ context: WHOS_CONTEXT, difficulty: safeDifficulty });
      whosSuggestionQuery = "";
      whosSelectedPokemonId = null;
      saveState();
      renderPlay();
      requestAnimationFrame(() => {
        if (window.matchMedia("(min-width: 720px)").matches) document.getElementById("whosGuessInput")?.focus({ preventScroll: true });
      });
    } catch (error) {
      logError(error, "whos.createRound");
      enqueueToast("!", t("error.recoveryTitle"), t("error.recoveryText"), "error");
    }
  }

  function renderWhosSetup() {
    view.innerHTML = `<section class="whos-page whos-setup-page" aria-labelledby="whosTitle">
      <section class="whos-hero">
        <div class="whos-hero-orb" aria-hidden="true"><span>?</span><i></i></div>
        <div class="whos-hero-copy"><div class="whos-mode-meta"><span>${t("whos.modeNumber")}</span><b>${t("whos.available")}</b></div><p class="quiz-kicker">${t("whos.kicker")}</p><h1 id="whosTitle">${t("whos.title")}</h1><p>${t("whos.subtitle")}</p></div>
      </section>
      ${whosDailyCardMarkup()}
      <div class="whos-setup-grid">
        <section class="whos-difficulty-panel" aria-labelledby="whosDifficultyTitle"><header><div><small>${t("whos.modeNumber")}</small><h2 id="whosDifficultyTitle">${t("whos.difficultyTitle")}</h2></div><p>${t("whos.difficultyText")}</p></header>
          <div class="whos-difficulty-grid">${whosDifficultyCard("easy", "I")}${whosDifficultyCard("medium", "II")}${whosDifficultyCard("hard", "III")}</div>
          <button type="button" id="startWhosRound" class="primary-button whos-start-button">${t("whos.start")}<span aria-hidden="true">›</span></button>
        </section>
        <aside class="whos-rules-card"><span aria-hidden="true">5</span><div><h2>${t("whos.rulesTitle")}</h2><ul><li>${t("whos.ruleLives")}</li><li>${t("whos.ruleHints")}</li><li>${t("whos.ruleBalance")}</li><li>${t("whos.ruleInput")}</li></ul></div></aside>
      </div>
      ${whosStatisticsMarkup()}
    </section>`;
    view.querySelectorAll("[data-whos-difficulty]").forEach(button => button.addEventListener("click", () => {
      state.whosThat.difficulty = button.dataset.whosDifficulty;
      saveState();
      renderWhosSetup();
    }));
    document.getElementById("startWhosRound")?.addEventListener("click", () => startWhosRound());
    document.getElementById("startWhosDaily")?.addEventListener("click", startWhosDailyRound);
  }

  function whosLivesMarkup(round) {
    const label = tp("whos.livesOne", "whos.livesMany", round.lives);
    const heart = `<svg viewBox="0 0 24 24" focusable="false"><path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.01 6.01 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54Z"/></svg>`;
    return `<div class="whos-lives" role="img" aria-label="${escapeHtml(label)}">${Array.from({ length: round.maxLives }, (_, index) => `<span class="${index < round.lives ? "available" : "lost"}" aria-hidden="true">${heart}</span>`).join("")}<small>${escapeHtml(label)}</small></div>`;
  }

  function whosHintsMarkup(round, target) {
    const revealedHints = round.hints.slice(0, Math.min(round.revealed, round.hints.length));
    return `<section class="whos-review-hints" aria-labelledby="whosReviewHintsTitle"><header><div><small>${t("whos.reviewKicker")}</small><h2 id="whosReviewHintsTitle">${t("whos.hintsLabel")}</h2></div><b>${revealedHints.length}/5</b></header><ol>${revealedHints.map((descriptor, index) => `<li class="whos-review-hint" data-whos-difficulty="${escapeHtml(round.difficulty)}"><span>${String(index + 1).padStart(2, "0")}</span><div><small>${t("whos.hintLabel", { number:index + 1 })}</small>${whosHintContentMarkup(descriptor, target)}</div></li>`).join("")}</ol></section>`;
  }

  function whosProgressMarkup(round) {
    return `<ol class="whos-progress" aria-label="${escapeHtml(t("whos.hintsLabel"))}">${round.hints.map((_, index) => {
      const number = index + 1;
      const unlocked = number <= round.revealed;
      const current = round.status === "active" && number === round.revealed;
      const complete = number < round.revealed || round.status !== "active" && unlocked;
      const stateLabel = current ? t("whos.progress.current") : unlocked ? t("whos.progress.revealed") : t("whos.progress.locked");
      return `<li class="whos-progress-step ${unlocked ? "unlocked" : "locked"} ${current ? "current" : ""} ${complete ? "complete" : ""}" ${current ? 'aria-current="step"' : ""}><span>${complete ? "✓" : number}</span><small>${escapeHtml(stateLabel)}</small></li>`;
    }).join("")}</ol>`;
  }

  function whosPotentialScore(round) {
    return QuizmonWhosThatPokemon.scoreRound({ ...round, status:"won" }).points;
  }

  function whosCurrentStageMarkup(round, target) {
    const descriptor = round.hints[Math.max(0, round.revealed - 1)];
    const media = ["shadow", "pixel", "crop", "cry"].includes(descriptor?.kind);
    return `<section class="whos-current-stage ${media ? "has-media" : "is-text"}" data-whos-difficulty="${escapeHtml(round.difficulty)}" aria-labelledby="whosCurrentHintTitle">
      <div class="whos-stage-top"><span>${t("whos.currentHint")} · ${String(round.revealed).padStart(2, "0")}</span><div class="whos-stage-potential"><small>${t("whos.potential")}</small><strong>${whosPotentialScore(round)}</strong><b>PTS</b></div></div>
      <div class="whos-stage-body">
        <div class="whos-mystery-orb" aria-hidden="true"><i></i><span>?</span></div>
        <div class="whos-current-copy"><p class="whos-stage-eyebrow">${t("whos.stageQuestion")}</p><h2 id="whosCurrentHintTitle">${escapeHtml(formatWhosHint(descriptor, target))}</h2>${media ? whosHintContentMarkup(descriptor, target) : ""}</div>
      </div>
      <p class="whos-stage-risk"><span aria-hidden="true">◆</span>${t("whos.riskHint")}</p>
    </section>`;
  }

  function whosDiscoveredHintsMarkup(round, target) {
    const previous = round.hints.slice(0, Math.max(0, round.revealed - 1));
    return `<section class="whos-discovered" aria-labelledby="whosDiscoveredTitle"><header><div><small>${t("whos.discoveredKicker")}</small><h2 id="whosDiscoveredTitle">${t("whos.discoveredTitle")}</h2></div><b>${previous.length}</b></header>${previous.length ? `<ol>${previous.map((descriptor, index) => `<li data-whos-difficulty="${escapeHtml(round.difficulty)}"><span>${String(index + 1).padStart(2, "0")}</span><div>${whosHintContentMarkup(descriptor, target)}</div><i aria-hidden="true">✓</i></li>`).join("")}</ol>` : `<p class="whos-discovered-empty">${t("whos.discoveredEmpty")}</p>`}</section>`;
  }

  function whosCompareRelation(guessValue, targetValue, higherKey = "whos.compare.higher", lowerKey = "whos.compare.lower") {
    if (Number(guessValue) === Number(targetValue)) return { tone:"exact", arrow:"✓", label:t("whos.compare.exact") };
    if (Number(targetValue) > Number(guessValue)) return { tone:"direction", arrow:"↑", label:t(higherKey) };
    return { tone:"direction", arrow:"↓", label:t(lowerKey) };
  }

  function whosComparisonMarkup(round, target) {
    const lastId = [...round.guesses].reverse().find(id => Number(id) !== Number(round.targetId));
    const guessed = WHOS_CONTEXT.byId.get(Number(lastId));
    if (!guessed || round.status !== "active") return "";
    const generation = whosCompareRelation(guessed.generation, target.generation, "whos.compare.newer", "whos.compare.older");
    const height = whosCompareRelation(guessed.height, target.height, "whos.compare.taller", "whos.compare.shorter");
    const weight = whosCompareRelation(guessed.weight, target.weight, "whos.compare.heavier", "whos.compare.lighter");
    const matchingTypes = guessed.types.filter(type => target.types.includes(type));
    const exactTypes = matchingTypes.length === target.types.length && guessed.types.length === target.types.length;
    const typeTone = exactTypes ? "exact" : matchingTypes.length ? "partial" : "miss";
    const typeLabelText = exactTypes ? t("whos.compare.typesExact") : matchingTypes.length ? tp("whos.compare.typeOne", "whos.compare.typesMany", matchingTypes.length) : t("whos.compare.typesNone");
    const item = (label, value, relation) => `<article class="whos-compare-item ${relation.tone}"><small>${label}</small><div><strong>${value}</strong><span aria-hidden="true">${relation.arrow}</span></div><p>${escapeHtml(relation.label)}</p></article>`;
    return `<section class="whos-comparison" aria-labelledby="whosComparisonTitle"><header><div><small>${t("whos.compare.kicker")}</small><h2 id="whosComparisonTitle">${escapeHtml(whosPokemonName(guessed))}</h2></div><span>${t("whos.compare.clue")}</span></header><div class="whos-compare-grid">
      ${item(t("whos.compare.generation"), `Gen ${guessed.generation}`, generation)}
      <article class="whos-compare-item ${typeTone}"><small>${t("whos.compare.types")}</small><div class="whos-compare-types">${guessed.types.map(type => `<span>${escapeHtml(typeLabel(type))}</span>`).join("")}</div><p>${escapeHtml(typeLabelText)}</p></article>
      ${item(t("whos.compare.height"), `${whosNumber(guessed.height / 10)} m`, height)}
      ${item(t("whos.compare.weight"), `${whosNumber(guessed.weight / 10)} kg`, weight)}
    </div></section>`;
  }

  function whosGuessesMarkup(round) {
    const items = round.guesses.map(id => {
      const item = WHOS_CONTEXT.byId.get(Number(id));
      const correct = Number(id) === Number(round.targetId);
      return `<li class="${correct ? "correct" : "wrong"}"><span>${escapeHtml(whosPokemonName(item))}</span><b aria-hidden="true">${correct ? "✓" : "×"}</b></li>`;
    }).join("");
    return `<section class="whos-guesses"><h2>${t("whos.guessesTitle")}</h2>${items ? `<ul>${items}</ul>` : `<p>${t("whos.noGuesses")}</p>`}</section>`;
  }

  function whosResultMarkup(round, target) {
    const won = round.status === "won";
    const name = whosPokemonName(target);
    const score = QuizmonWhosThatPokemon.scoreRound(round);
    const daily = round.mode === "daily";
    const dailyEntry = daily ? whosDailyEntry(round.dailyDate) : null;
    const awardedXp = Math.max(0, Number(dailyEntry?.result?.xp) || score.xp);
    const distribution = daily && state.whosThat.daily.distribution?.date === round.dailyDate ? state.whosThat.daily.distribution : null;
    return `<section class="whos-result ${won ? "won" : "lost"}" aria-labelledby="whosResultTitle">
      <div class="whos-result-art"><img src="${escapeHtml(knowledgeArtwork(target))}" data-image-kind="pokemon" alt="${escapeHtml(name)}"><span>#${String(target.id).padStart(4, "0")}</span></div>
      <div class="whos-result-copy"><p class="quiz-kicker">${t(won ? "whos.wonKicker" : "whos.lostKicker")}</p><h2 id="whosResultTitle">${t(won ? "whos.wonTitle" : "whos.lostTitle")}</h2><p>${t(won ? "whos.wonText" : "whos.lostText", { name, hint: round.revealed, lives: round.lives })}</p><div class="whos-result-identity"><strong>${escapeHtml(name)}</strong><span>${target.types.map(typeLabel).join(" / ")}</span></div>
        <div class="whos-result-score"><span><small>${t("whos.result.points")}</small><strong>${score.points}</strong></span><span><small>XP</small><strong>+${awardedXp}</strong></span><span><small>${t("whos.result.hints")}</small><strong>${round.revealed}/5</strong></span></div>
        ${daily ? `<div class="whos-global-status"><strong>${t("whos.daily.distributionTitle")}</strong>${distribution ? `<div class="whos-distribution">${[1,2,3,4,5].map(hint => `<span><small>${hint}</small><i style="height:${distribution.percentages[`hint${hint}`]}%"></i><b>${distribution.percentages[`hint${hint}`]}%</b></span>`).join("")}<span><small>×</small><i style="height:${distribution.percentages.lost}%"></i><b>${distribution.percentages.lost}%</b></span></div><p>${distribution.total} ${t("whos.daily.participants")}</p>` : `<p>${t("whos.daily.distributionPending")}</p>`}</div>` : ""}
        <div class="whos-result-actions">${daily ? "" : `<button type="button" id="nextWhosRound" class="primary-button">${t("whos.nextRound")}<span aria-hidden="true">›</span></button>`}<button type="button" id="changeWhosDifficulty" class="secondary-button">${t(daily ? "whos.backToModes" : "whos.changeDifficulty")}</button></div>
      </div>
    </section>`;
  }

  function updateWhosSuggestions(input, root) {
    if (!input || !root) return;
    whosSuggestionQuery = input.value;
    whosSelectedPokemonId = null;
    const query = QuizmonWhosThatPokemon.normalizedName(input.value);
    const submit = document.getElementById("whosGuessSubmit");
    const selection = document.getElementById("whosGuessSelection");
    const exact = QuizmonWhosThatPokemon.findPokemonByName(input.value, state.language, WHOS_CONTEXT);
    if (exact) whosSelectedPokemonId = exact.id;
    if (submit) submit.disabled = !exact;
    if (selection) {
      selection.hidden = !exact;
      selection.innerHTML = exact ? `<span aria-hidden="true">✓</span><strong>${escapeHtml(whosPokemonName(exact))}</strong><small>#${String(exact.id).padStart(4, "0")}</small>` : "";
    }
    if (!query || exact) { root.innerHTML = ""; root.hidden = true; input.setAttribute("aria-expanded", "false"); return; }
    const rows = WHOS_CONTEXT.pokemon.map(item => ({ item, name: whosPokemonName(item), normalized: QuizmonWhosThatPokemon.normalizedName(whosPokemonName(item)) }))
      .filter(row => row.normalized.includes(query))
      .sort((left, right) => Number(!left.normalized.startsWith(query)) - Number(!right.normalized.startsWith(query)) || left.name.localeCompare(right.name, state.language))
      .slice(0, 6);
    root.innerHTML = rows.map(row => `<button type="button" role="option" data-whos-suggestion="${row.item.id}"><span>${escapeHtml(row.name)}</span><small>#${String(row.item.id).padStart(4, "0")}</small></button>`).join("");
    root.hidden = !rows.length;
    input.setAttribute("aria-expanded", String(Boolean(rows.length)));
    root.querySelectorAll("[data-whos-suggestion]").forEach(button => button.addEventListener("click", () => {
      const item = WHOS_CONTEXT.byId.get(Number(button.dataset.whosSuggestion));
      input.value = whosPokemonName(item);
      whosSuggestionQuery = input.value;
      whosSelectedPokemonId = item.id;
      root.hidden = true;
      input.setAttribute("aria-expanded", "false");
      if (submit) submit.disabled = false;
      if (selection) {
        selection.hidden = false;
        selection.innerHTML = `<span aria-hidden="true">✓</span><strong>${escapeHtml(whosPokemonName(item))}</strong><small>#${String(item.id).padStart(4, "0")}</small>`;
      }
      input.focus();
    }));
  }

  function bindWhosGuessForm(round) {
    const form = document.getElementById("whosGuessForm");
    const input = document.getElementById("whosGuessInput");
    const status = document.getElementById("whosInputStatus");
    const suggestions = document.getElementById("whosSuggestions");
    if (!form || !input || !status || !suggestions) return;
    input.value = whosSuggestionQuery;
    updateWhosSuggestions(input, suggestions);
    input.addEventListener("input", () => { status.textContent = ""; updateWhosSuggestions(input, suggestions); });
    input.addEventListener("focus", () => updateWhosSuggestions(input, suggestions));
    input.addEventListener("keydown", event => { if (event.key === "Escape") { suggestions.hidden = true; input.setAttribute("aria-expanded", "false"); status.textContent = ""; } });
    form.addEventListener("submit", event => {
      event.preventDefault();
      const pokemon = WHOS_CONTEXT.byId.get(Number(whosSelectedPokemonId)) || QuizmonWhosThatPokemon.findPokemonByName(input.value, state.language, WHOS_CONTEXT);
      if (!pokemon) { status.textContent = t("whos.invalidGuess"); status.className = "whos-input-status error"; haptic("error"); return; }
      const result = QuizmonWhosThatPokemon.submitGuess(round, pokemon.id, WHOS_CONTEXT);
      if (!result.accepted) {
        status.textContent = t(result.reason === "duplicate" ? "whos.duplicateGuess" : "whos.invalidGuess");
        status.className = "whos-input-status error";
        haptic("error");
        return;
      }
      state.whosThat.round = result.round;
      completeWhosRound(result.round);
      whosSuggestionQuery = "";
      whosSelectedPokemonId = null;
      saveState();
      haptic(result.correct ? "success" : "error");
      if (result.correct) enqueueToast("✓", t("whos.correctGuess"), "", "success");
      renderPlay();
      if (result.round.status === "active") requestAnimationFrame(() => {
        const nextStatus = document.getElementById("whosInputStatus");
        if (nextStatus) { nextStatus.textContent = t("whos.wrongGuess"); nextStatus.className = "whos-input-status warning"; }
        document.getElementById("whosGuessInput")?.focus({ preventScroll: true });
      });
    });
  }

  function renderWhosRound(round) {
    const target = WHOS_CONTEXT.byId.get(Number(round.targetId));
    const active = round.status === "active";
    view.innerHTML = `<section class="whos-page whos-round-page" aria-labelledby="whosRoundTitle">
      <header class="whos-round-header"><div><p class="quiz-kicker">${t(round.mode === "daily" ? "whos.daily.kicker" : "whos.roundKicker")}</p><h1 id="whosRoundTitle">${round.mode === "daily" ? t("whos.daily.title") : whosDifficultyName(round.difficulty)}</h1><span>${t("whos.roundProgress", { current: round.revealed, total: round.hints.length })}</span></div><div class="whos-round-status">${whosLivesMarkup(round)}${active && round.mode !== "daily" ? `<button type="button" id="leaveWhosRound" class="secondary-button whos-leave-round">${t("whos.leaveRound")}</button>` : ""}</div></header>
      ${whosProgressMarkup(round)}
      ${active ? `<div class="whos-game-layout"><main class="whos-game-main">${whosCurrentStageMarkup(round, target)}${whosDiscoveredHintsMarkup(round, target)}</main><aside class="whos-answer-panel">
        <form id="whosGuessForm" class="whos-guess-form" novalidate><div class="whos-answer-heading"><span aria-hidden="true">?</span><div><small>${t("whos.answerKicker")}</small><label for="whosGuessInput">${t("whos.guessLabel")}</label></div></div><div class="whos-search-wrap"><input id="whosGuessInput" type="search" placeholder="${escapeHtml(t("whos.guessPlaceholder"))}" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="go" role="combobox" aria-autocomplete="list" aria-controls="whosSuggestions" aria-expanded="false"><div id="whosSuggestions" class="whos-suggestions" role="listbox" hidden></div></div><div id="whosGuessSelection" class="whos-guess-selection" hidden></div><button id="whosGuessSubmit" type="submit" class="primary-button whos-guess-submit" disabled><span>${t("whos.guessAction")}</span><kbd>↵</kbd></button><p id="whosInputStatus" class="whos-input-status" role="status" aria-live="polite"></p></form>
        ${whosComparisonMarkup(round, target)}${whosGuessesMarkup(round)}
      </aside></div>` : `${whosResultMarkup(round, target)}${whosHintsMarkup(round, target)}`}
    </section>`;
    if (active) bindWhosGuessForm(round);
    bindWhosMediaHints(view);
    document.getElementById("leaveWhosRound")?.addEventListener("click", () => { state.whosThat.round = null; whosSuggestionQuery = ""; whosSelectedPokemonId = null; saveState(); renderWhosSetup(); });
    document.getElementById("nextWhosRound")?.addEventListener("click", () => startWhosRound(round.difficulty));
    document.getElementById("changeWhosDifficulty")?.addEventListener("click", () => { state.whosThat.round = null; whosSuggestionQuery = ""; whosSelectedPokemonId = null; saveState(); renderWhosSetup(); });
  }

  function renderPlay() {
    const round = QuizmonWhosThatPokemon.sanitizeRound(state.whosThat.round, WHOS_CONTEXT);
    if (state.whosThat.round && !round) { state.whosThat.round = null; saveState(); }
    else if (round) state.whosThat.round = round;
    if (round) renderWhosRound(round);
    else renderWhosSetup();
  }


  function renderFutureArea(kind) {
    const isPlay=kind==="play";
    const icon=isPlay?iconSvg("play"):iconSvg("support");
    const title=t(isPlay?"placeholder.playTitle":"placeholder.supportTitle");
    const textValue=t(isPlay?"placeholder.playText":"placeholder.supportText");
    const detail=t(isPlay?"placeholder.playDetail":"placeholder.supportDetail");
    view.innerHTML=`<section class="future-area-page ${kind}" aria-labelledby="futureAreaTitle">
      <section class="future-area-card">
        <span class="future-area-icon" aria-hidden="true">${icon}</span>
        <div class="future-area-copy"><p class="quiz-kicker">${t("placeholder.kicker")}</p><h1 id="futureAreaTitle">${escapeHtml(title)}</h1><p>${escapeHtml(textValue)}</p></div>
        <section class="future-area-note"><strong>${t("placeholder.noteTitle")}</strong><p>${escapeHtml(detail)}</p></section>
        <div class="future-area-actions"><button class="primary-button" data-future-destination="${isPlay?"train":"home"}">${t(isPlay?"placeholder.openTraining":"placeholder.backHome")}</button>${isPlay?`<button class="secondary-button" data-future-destination="home">${t("placeholder.backHome")}</button>`:""}</div>
      </section>
    </section>`;
    document.querySelectorAll("[data-future-destination]").forEach(button=>button.addEventListener("click",()=>setRoute(button.dataset.futureDestination)));
  }


  function refreshedHomeHeroVisualMarkup() {
    return `<div class="refresh-hero-visual" aria-hidden="true"><span class="refresh-hero-orb"><i></i></span><span class="refresh-hero-pedestal"><i></i><i></i><i></i></span><span class="refresh-hero-spark spark-one"></span><span class="refresh-hero-spark spark-two"></span><span class="refresh-hero-spark spark-three"></span></div>`;
  }

  function refreshedHomePlayMarkup() {
    return `<section class="refresh-play-panel" aria-labelledby="refreshPlayTitle">
      <div class="refresh-section-heading"><span class="refresh-section-icon">${iconSvg("play")}</span><div><small>${t("home.refreshEyebrow")}</small><h2 id="refreshPlayTitle">${t("home.refreshPlayTitle")}</h2></div></div>
      <div class="refresh-play-grid">
        <button class="refresh-play-card pokeidle" type="button" data-home-play="pokeidle" aria-label="${escapeHtml(t("home.refreshPokeidleAction"))}: ${escapeHtml(t("home.refreshPokeidleTitle"))}">
          <span class="refresh-play-card-head"><span class="refresh-play-card-icon">${iconSvg("idle")}</span><strong>${t("home.refreshPokeidleTitle")}</strong></span>
          <span class="refresh-play-art idle-art" aria-hidden="true"><i class="idle-orb"></i><i class="idle-crystal one"></i><i class="idle-crystal two"></i><i class="idle-ground"></i></span>
          <span class="refresh-play-copy">${t("home.refreshPokeidleDesc")}</span>
          <span class="refresh-play-action">${t("home.refreshPokeidleAction")}<i aria-hidden="true">›</i></span>
        </button>
        <article class="refresh-play-card campaign is-coming" aria-labelledby="campaignCardTitle">
          <span class="refresh-play-card-head"><span class="refresh-play-card-icon">${iconSvg("campaign")}</span><strong id="campaignCardTitle">${t("home.refreshCampaignTitle")}</strong></span>
          <span class="refresh-play-art campaign-art" aria-hidden="true"><i class="campaign-path"></i><i class="campaign-node node-one"></i><i class="campaign-node node-two"></i><i class="campaign-node node-three"></i><i class="campaign-gate"></i></span>
          <span class="refresh-play-copy">${t("home.refreshCampaignDesc")}</span>
          <span class="refresh-coming-badge">${t("home.refreshCampaignComing")}</span>
        </article>
      </div>
    </section>`;
  }

  function refreshedHomeMotivationMarkup() {
    const goal = dailyGoalInfo();
    const activeFlames = Math.min(6, Math.max(0, goal.streak));
    const flames = Array.from({ length: 6 }, (_, index) => `<i class="${index < activeFlames ? "is-active" : ""}">${iconSvg("flame")}</i>`).join("");
    return `<section class="refresh-motivation-grid" aria-label="${escapeHtml(t("home.refreshDailyHint"))}">
      <button id="homeDailyGoal" class="refresh-motivation-card daily ${goal.completed ? "is-complete" : ""}" type="button" style="--refresh-goal-progress:${goal.percent}%">
        <span class="refresh-motivation-icon">${goal.completed ? iconSvg("accuracy") : iconSvg("target")}</span>
        <span class="refresh-motivation-copy"><small>${t("daily.kicker")}</small><strong>${goal.completed ? t("daily.completedTitle") : t("daily.title")}</strong><em>${t("daily.progressText", { progress: goal.progress, target: goal.target })}</em></span>
        <span class="refresh-goal-track" aria-label="${goal.percent}%"><i></i></span>
        ${dailyGoalWeekMarkup()}
        <span class="refresh-motivation-link">${goal.completed ? t("daily.keepTraining") : t("daily.continue")}<b aria-hidden="true">›</b></span>
      </button>
      <article class="refresh-motivation-card streak">
        <span class="refresh-motivation-icon">${iconSvg("flame")}</span>
        <span class="refresh-motivation-copy"><small>${t("home.refreshStreakTitle")}</small><strong>${tp("home.refreshStreakDaysOne", "home.refreshStreakDays", goal.streak)}</strong><em>${t("home.refreshStreakHint")}</em></span>
        <span class="refresh-streak-flames" aria-hidden="true">${flames}</span>
      </article>
    </section>`;
  }

  function renderHome() {
    session = null;
    const level = getLevelInfo();
    const homeBanner = selectedBanner();
    const nextXp = level.next ? level.next.xp : state.stats.xp;

    view.innerHTML = `
      <section class="refresh-home" aria-labelledby="refreshHomeTitle">
        <section class="refresh-home-stage">
          <div class="home-banner-layer profile-banner profile-banner-${homeBanner.id}" aria-hidden="true"><i></i><i></i><i></i></div>
          <section class="refresh-home-hero">
            <div class="refresh-home-intro">
              <p class="refresh-home-eyebrow">${t("home.refreshEyebrow")}</p>
              <h1 id="refreshHomeTitle"><span>${t("home.refreshTitleLead")}</span><strong>${t("home.refreshTitleAccent")}</strong></h1>
              <p>${t("home.refreshSubtitle")}</p>
            </div>
            ${refreshedHomeHeroVisualMarkup()}
          </section>

          <button class="refresh-trainer-card" id="openTrainerProfile" type="button" aria-label="${escapeHtml(t("profile.openLabel"))}">
            <span class="refresh-profile-avatar-wrap">${profileAvatarMarkup(selectedAvatar().id, "refresh-profile-avatar")}<b>Lv. ${level.current.level}</b></span>
            <span class="refresh-trainer-copy"><small>${t("profile.homeLabel")}</small><strong>${escapeHtml(trainerName())}</strong><em>${escapeHtml(cosmeticName(selectedTitle()))}</em><span class="refresh-level-track" aria-label="${level.progress}%"><i style="width:${level.progress}%"></i></span><span class="refresh-level-xp">${state.stats.xp} / ${nextXp} XP</span></span>
            <span class="refresh-trainer-arrow" aria-hidden="true">›</span>
          </button>

          ${refreshedHomePlayMarkup()}
          ${refreshedHomeMotivationMarkup()}
        </section>
        ${deferredInstallPrompt ? `<button class="game-install-card" id="installApp"><span>＋</span><strong>${t("home.install")}</strong><small>${t("home.installDesc")}</small><i>›</i></button>` : ""}
      </section>`;

    document.querySelector("[data-home-play='pokeidle']")?.addEventListener("click", () => setRoute("play"));
    document.getElementById("homeDailyGoal")?.addEventListener("click", startDailyGoalTraining);
    document.getElementById("openTrainerProfile")?.addEventListener("click", () => setRoute("profile"));
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
    const nextReward = nextLevelRewardInfo(level.current.level);

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

        <section class="profile-dashboard-grid profile-priority-grid">
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
            ${nextReward ? `<div class="profile-next-reward">${rewardVisualMarkup(nextReward.items[0], "large")}<span><small>${t("rewards.nextTitle")} · ${t("rewards.levelLabel", { level: nextReward.level })}</small><strong>${escapeHtml(rewardHeadline(nextReward))}</strong><em>${t("rewards.xpToReward", { count: nextReward.xpRemaining })}</em></span></div>` : `<div class="profile-next-reward max"><span class="reward-visual reward-max large" aria-hidden="true">✓</span><span><small>${t("rewards.maxTitle")}</small><strong>${t("rewards.maxText")}</strong></span></div>`}
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

        ${collectionProgressMarkup("openProfileCollection","full")}

        <section class="profile-collection-strip" aria-label="${escapeHtml(t("profile.collection"))}">
          <div><span>${profileAvatarMarkup(avatar.id, "collection-mini-avatar")}</span><p><small>${t("profile.avatar")}</small><strong>${escapeHtml(cosmeticName(avatar))}</strong></p></div>
          <div><span class="profile-banner-swatch profile-banner profile-banner-${banner.id}"><i></i></span><p><small>${t("profile.banner")}</small><strong>${escapeHtml(cosmeticName(banner))}</strong></p></div>
          <div class="profile-collection-title"><p><small>${t("profile.trainerTitle")}</small><strong>${escapeHtml(cosmeticName(title))}</strong></p></div>
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
    document.getElementById("openProfileCollection")?.addEventListener("click", openProfileCustomizer);
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
      syncProfileFavoritesIntoCollection();
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
        : "";
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
      <span class="profile-set-body">${avatarPreview ? profileAvatarMarkup(avatarPreview.id,"profile-set-avatar") : `<span class="profile-set-avatar-missing">?</span>`}<span><strong>${escapeHtml(cosmeticName(set))}</strong><small>${escapeHtml(titlePreview ? cosmeticName(titlePreview) : t("profile.setMissing"))}</small><em>${status.complete ? t("profile.setReady") : escapeHtml(status.unlockStatus.label)}</em></span></span>
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
      const name = [cosmeticName(item), ...Object.values(item.names || {})].join(" ").toLocaleLowerCase(state.language === "de" ? "de-DE" : "en-GB");
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
      play: `<svg ${attrs}><path d="m9 7 8 5-8 5z"></path><circle cx="12" cy="12" r="9"></circle></svg>`,
      knowledge: `<svg ${attrs}><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
      search: `<svg ${attrs}><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 4 4"></path></svg>`,
      favorite: `<svg ${attrs}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"></path></svg>`,
      list: `<svg ${attrs}><path d="M8 6h12"></path><path d="M8 12h12"></path><path d="M8 18h12"></path><circle cx="4" cy="6" r="1"></circle><circle cx="4" cy="12" r="1"></circle><circle cx="4" cy="18" r="1"></circle></svg>`,
      region: `<svg ${attrs}><path d="M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20z"></path><path d="M9 4v13.5"></path><path d="M15 6.5V20"></path></svg>`,
      trainer: `<svg ${attrs}><circle cx="12" cy="8" r="4"></circle><path d="M5 20a7 7 0 0 1 14 0"></path></svg>`,
      battle: `<svg ${attrs}><path d="m5 4 14 14"></path><path d="m19 4-5 5"></path><path d="m5 18 5-5"></path><path d="M4 4h4"></path><path d="M16 18h4"></path></svg>`,
      item: `<svg ${attrs}><path d="m12 3 9 9-9 9-9-9z"></path><circle cx="12" cy="12" r="2"></circle></svg>`,
      evolution: `<svg ${attrs}><path d="M5 17 17 5"></path><path d="M10 5h7v7"></path><path d="M5 8v9h9"></path></svg>`,
      cards: `<svg ${attrs}><rect x="5" y="3" width="14" height="18" rx="2"></rect><path d="M8 7h8"></path><path d="M8 11h5"></path></svg>`,
      support: `<svg ${attrs}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"></path></svg>`,
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
      sessions: `<svg ${attrs}><rect x="5" y="4" width="14" height="16" rx="2"></rect><path d="M8 8h8"></path><path d="M8 12h8"></path><path d="M8 16h5"></path></svg>`,
      idle: `<svg ${attrs}><path d="M12 3.5 14 8l4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z"></path><path d="M5 17.5h14"></path><path d="M7 20h10"></path></svg>`,
      campaign: `<svg ${attrs}><path d="M4 19c3.5-5.5 4.5-2 7-6s4-1 9-8"></path><circle cx="4" cy="19" r="2"></circle><circle cx="11" cy="13" r="2"></circle><circle cx="20" cy="5" r="2"></circle></svg>`,
      target: `<svg ${attrs}><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="4"></circle><path d="m14.5 9.5 5-5"></path><path d="M16.5 4.5h3v3"></path></svg>`,
      flame: `<svg ${attrs}><path d="M13.5 3.5c.7 3.1-1.5 4.4-2.8 6.1-1.2-1-1.6-2.1-1.4-3.5C6.7 8 5 10.4 5 13.2A7 7 0 0 0 19 13c0-4-2.5-6.8-5.5-9.5z"></path><path d="M10 17.5c0-1.7 1.1-2.8 2.3-4.2.6 1.3 1.7 2.2 1.7 3.8a2 2 0 0 1-4 .4z"></path></svg>`
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
      review: { icon: iconSvg("review"), number: "" },
      problem: { icon: iconSvg("weak"), number: "" },
      path: { icon: iconSvg("learn"), number: "" }
    };
    return visuals[mode] || { icon: "Q", number: "" };
  }

  function difficultyLabel(value) {
    return t(`setup.${value || "medium"}`);
  }

  function configSummary(mode, config = state.config[mode] || {}) {
    const length = config.length === "infinite" ? t("setup.endless") : tp("train.questionCountOne", "train.questionCount", config.length || 10);
    const parts = [length, difficultyLabel(config.difficulty)];
    if (mode === "effectiveness") parts.push(t(`setup.${config.kind || "mixed"}`));
    if (["multiplier", "impact"].includes(mode)) parts.push(t(`setup.${config.defense || "mixed"}`));
    if (mode === "pokemon") parts.push(config.generation === "all" ? t("common.all") : `Gen ${config.generation}`);
    return parts.join(" · ");
  }

  function renderTrain() {
    session = null;
    const recommendationContext=buildRecommendationContext();
    const recommendation=primaryLearningRecommendation(recommendationContext);
    const openMistakes=recommendationContext.openMistakeSpecs;
    const next=recommendationContext.nextPath;
    const pattern=recommendationContext.availablePattern;
    const customLists=trainingLists();
    const targeted=[];
    if(recommendation.action!=="problem"&&pattern) targeted.push(`<button class="training-focus-card warning" data-training-pattern="${escapeHtml(pattern.key)}"><span class="training-focus-icon">${errorPatternIcon(pattern)}</span><span class="training-focus-copy"><small>${t("cleanup.target.problem")}</small><strong>${escapeHtml(errorPatternTitle(pattern))}</strong><p>${escapeHtml(errorPatternText(pattern))}</p></span><span class="training-focus-arrow">›</span></button>`);
    if(recommendation.action!=="path"&&next) targeted.push(`<button class="training-focus-card" data-training-path="${next.id}"><span class="training-focus-icon">${next.icon}</span><span class="training-focus-copy"><small>${t("cleanup.target.path")}</small><strong>${escapeHtml(t(next.titleKey))}</strong><p>${escapeHtml(t(next.subtitleKey))}</p></span><span class="training-focus-arrow">›</span></button>`);
    if(openMistakes.length) targeted.push(`<button class="training-focus-card" id="reviewOpenMistakes"><span class="training-focus-icon">${iconSvg("review")}</span><span class="training-focus-copy"><small>${t("cleanup.target.mistakes")}</small><strong>${t("train.review")}</strong><p>${t("train.reviewDesc")}</p></span><span class="training-focus-count">${openMistakes.length}</span></button>`);
    if(state.lastMode&&state.lastConfig&&targeted.length<3) targeted.push(`<button class="training-focus-card" id="repeatLastTraining"><span class="training-focus-icon">${iconSvg("repeat")}</span><span class="training-focus-copy"><small>${t("train.continueLabel")}</small><strong>${t("home.continue")}</strong><p>${t("home.continueDesc",{mode:modeName(state.lastMode)})}</p></span><span class="training-focus-arrow">›</span></button>`);

    view.innerHTML=`<section class="training-hub adaptive-training-hub visual-refresh-training">
      <section class="training-command-hero simplified"><div class="training-command-copy"><p class="quiz-kicker">${t("cleanup.trainEyebrow")}</p><h1>${t("cleanup.trainTitle")}</h1><p>${t("cleanup.trainSubtitle")}</p></div><div class="training-hero-visual" aria-hidden="true"><span>${iconSvg("train")}</span><i></i><i></i><i></i></div><span class="training-adaptive-seal">${iconSvg("weak")} ${t("cleanup.adaptiveBadge")}</span></section>
      ${adaptiveHeroMarkup(recommendation,"training")}
      ${compactDailyProgressMarkup("trainingDailyMix")}
      ${targeted.length?`<section class="training-section" aria-labelledby="targetedTrainingTitle"><div class="training-section-heading"><div><small>${t("cleanup.targetedKicker")}</small><h2 id="targetedTrainingTitle">${t("cleanup.targetedTitle")}</h2></div><p>${t("cleanup.targetedHint")}</p></div><div class="training-focus-grid targeted">${targeted.slice(0,3).join("")}</div></section>`:""}
      ${customLists.length?`<section class="training-section" aria-labelledby="customTrainingListsTitle"><div class="training-section-heading"><div><small>${t("trainingLists.kicker")}</small><h2 id="customTrainingListsTitle">${t("trainingLists.title")}</h2></div><button type="button" class="ghost-button training-list-manage-link" data-manage-training-lists>${t("trainingLists.manage")}</button></div><div class="training-list-quick-grid">${customLists.slice(0,3).map(list=>`<button type="button" class="training-list-quick-card" data-start-training-list="${escapeHtml(list.id)}"><span aria-hidden="true">${list.kind==="pokemon"?iconSvg("pokemon"):iconSvg("list")}</span><span><strong>${escapeHtml(list.name)}</strong><small>${t(`trainingLists.kind.${list.kind}`)} · ${t("trainingLists.entryCount",{count:list.entries.length})}</small></span><i aria-hidden="true">›</i></button>`).join("")}</div></section>`:""}
      <section class="training-section" aria-labelledby="trainingModesTitle"><div class="training-section-heading"><div><small>${t("cleanup.freeKicker")}</small><h2 id="trainingModesTitle">${t("train.free")}</h2></div><p>${t("cleanup.freeHint")}</p></div><div class="training-mode-grid simplified">${trainingModeCard("effectiveness",t("mode.effectivenessDesc"))}${trainingModeCard("multiplier",t("mode.multiplierDesc"))}${trainingModeCard("impact",t("mode.impactDesc"))}${trainingModeCard("pokemon",t("mode.pokemonDesc"))}</div></section>
    </section>`;

    document.querySelector("[data-primary-recommendation]")?.addEventListener("click",()=>activatePrimaryRecommendation(recommendation));
    document.querySelector("[data-primary-reason]")?.addEventListener("click",()=>showPrimaryRecommendationReason(recommendation));
    document.getElementById("trainingDailyMix")?.addEventListener("click",startDailySession);
    document.querySelectorAll("[data-training-pattern]").forEach(button=>button.addEventListener("click",()=>showErrorPatternDetail(button.dataset.trainingPattern)));
    document.querySelectorAll("[data-training-path]").forEach(button=>button.addEventListener("click",()=>{state.learnTab="path";setRoute("learn");requestAnimationFrame(()=>openLearningPathModule(button.dataset.trainingPath));}));
    document.getElementById("reviewOpenMistakes")?.addEventListener("click",()=>startReviewSession(openMistakes));
    document.getElementById("repeatLastTraining")?.addEventListener("click",()=>{if(!state.lastMode||!state.lastConfig)return;if(state.lastConfig.trainingListId){startTrainingListSession(state.lastConfig.trainingListId,state.lastMode,state.lastConfig);return;}state.config[state.lastMode]={...state.config[state.lastMode],...clone(state.lastConfig)};startSession(state.lastMode);});
    document.querySelectorAll("[data-start-training-list]").forEach(button=>button.addEventListener("click",()=>openTrainingListLaunch(button.dataset.startTrainingList)));
    document.querySelector("[data-manage-training-lists]")?.addEventListener("click",()=>{knowledgeView="training-lists";setRoute("knowledge");});
    document.querySelectorAll("[data-mode]").forEach(button=>button.addEventListener("click",()=>setRoute(`setup-${button.dataset.mode}`)));
  }

  function trainingModeCard(mode, description) {
    const visual=modeVisual(mode);
    const modeStats=state.stats.modes[mode]||blankModeStats();
    return `<button class="training-mode-card simplified mode-${mode}" data-mode="${mode}"><span class="training-mode-icon">${visual.icon}</span><span class="training-mode-copy"><strong>${escapeHtml(modeName(mode))}</strong><p>${escapeHtml(description)}</p><small>${modeStats.total?t("cleanup.freePlayed"):t("cleanup.freeConfigure")}</small></span><span class="training-mode-arrow">›</span></button>`;
  }

  function renderSetup(mode) {
    const config = state.config[mode];
    const modeDescription = t(`mode.${mode}Desc`);
    const visual = modeVisual(mode);
    view.innerHTML = `
      <section class="setup-shell visual-refresh-setup mode-${mode}">
        <aside class="setup-mode-preview">
          <div class="setup-preview-top"><span class="setup-preview-number">${visual.number}</span><span class="setup-preview-icon">${visual.icon}</span><span class="setup-preview-orbit" aria-hidden="true"><i></i><i></i><i></i></span></div>
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
      id: typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : `session-${Date.now()}-${Math.random().toString(36).slice(2,10)}`,
      mode, config: clone(config), length: sequence ? sequence.length : lengthValue, sequence: sequence ? clone(sequence) : null,
      trainingList: config.trainingListId ? { id:String(config.trainingListId), name:String(config.trainingListName||""), kind:String(config.trainingListKind||"") } : null,
      index: 0, correct: 0, answers: [], wrongQuestions: [], wrongTypes: {}, startedAt: Date.now(), startXp: state.stats.xp,
      answered: false, ended: false, currentSpec: null, usedSignatures: [], usedPokemonIds: [],
      xpEarned: 0, levelUps: [], newUnlocks: [], rewardCelebrated: false,
      combo: 0, bestCombo: 0, lastReward: null, previousComparable: null, questionStartedAt: null,
      smartPlan: null, learningBefore: null, learningProgress: null, problemPlan: null, problemBefore: null, problemProgress: null,
      pathModuleId: null, pathModuleBefore: null, pathProgress: null, pathReview: null, pathExamId: null,
      adaptiveFlow: mode === "weak" ? { offset:0, lastChecked:0, adjustments:[], initialDifficultyCounts:{ easy:0, medium:0, hard:0 } } : null,
      lastAdaptiveUpdate: null,
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
    showSmartTrainingPreview();
  }

  function startReviewSession(specs) {
    if (!specs?.length) return;
    session = newSession("review", { length: specs.length }, specs);
    prepareRouteMotion(state.route, "session", "forward"); state.route = "session"; saveState(); updateNavigation(); renderQuestion();
  }

  function buildTrainingListSequence(list,mode,config={}) {
    const length=Math.max(1,Number(config.length)||10);
    if(list.kind==="pokemon"){
      const valid=list.entries.map(id=>knowledgePokemonById(id)).filter(Boolean);
      const sequence=[];
      while(sequence.length<length&&valid.length){
        const cycle=shuffle(valid,Math.random);
        cycle.forEach(item=>{
          if(sequence.length>=length)return;
          sequence.push({kind:"pokemon",pokemon:{id:item.id,name:knowledgePokemonName(item),types:[...item.types],image:knowledgeArtwork(item)},display:config.display||state.config.pokemon.display||"both",focusTypes:[...item.types],_trainingListId:list.id});
        });
      }
      return sequence;
    }
    const options={...config,allowedTypes:[...list.entries]};
    return Array.from({length},()=>{
      if(mode==="effectiveness")return {...generateEffectivenessSpec(options),_trainingListId:list.id};
      if(mode==="multiplier")return {...generateMultiplierSpec(options),_trainingListId:list.id};
      return {...generateImpactSpec(options),_trainingListId:list.id};
    });
  }

  function startTrainingListSession(listId,mode,config={}) {
    const list=trainingListById(listId);
    if(!list||!QuizmonTrainingLists.canStart(list)){
      showMessageDialog({title:t("trainingLists.tooSmallTitle"),message:t("trainingLists.tooSmallText"),buttonLabel:t("common.understood"),kind:"warning",icon:"!"});
      return;
    }
    const compatible=QuizmonTrainingLists.compatibleModes(list.kind);
    const selectedMode=compatible.includes(mode)?mode:compatible[0];
    const sessionConfig={...clone(state.config[selectedMode]||{}),...config,length:Number(config.length)||10,trainingListId:list.id,trainingListName:list.name,trainingListKind:list.kind};
    const sequence=buildTrainingListSequence(list,selectedMode,sessionConfig);
    if(!sequence.length)return;
    state.lastMode=selectedMode;
    state.lastConfig=clone(sessionConfig);
    session=newSession(selectedMode,sessionConfig,sequence);
    session.trainingList={id:list.id,name:list.name,kind:list.kind};
    prepareRouteMotion(state.route,"session","forward");state.route="session";saveState();updateNavigation();renderQuestion();
  }

  function renderTrainingListLaunchOptions() {
    const root=document.querySelector("[data-training-list-launch-options]");
    const list=trainingListLaunchDraft?trainingListById(trainingListLaunchDraft.listId):null;
    if(!root||!list)return;
    const modes=QuizmonTrainingLists.compatibleModes(list.kind);
    root.innerHTML=`<section><small>${t("trainingLists.modeLabel")}</small><div class="training-list-launch-modes">${modes.map(mode=>`<button type="button" data-list-launch-mode="${mode}" class="${trainingListLaunchDraft.mode===mode?"active":""}" aria-pressed="${trainingListLaunchDraft.mode===mode}"><span>${modeVisual(mode).icon}</span><strong>${escapeHtml(modeName(mode))}</strong></button>`).join("")}</div></section><section><small>${t("trainingLists.lengthLabel")}</small><div class="tabs segmented-control" role="group" aria-label="${escapeHtml(t("trainingLists.lengthLabel"))}" style="--tab-count:2"><button class="tab-button ${trainingListLaunchDraft.length===10?"active":""}" aria-pressed="${trainingListLaunchDraft.length===10}" data-list-launch-length="10">10</button><button class="tab-button ${trainingListLaunchDraft.length===20?"active":""}" aria-pressed="${trainingListLaunchDraft.length===20}" data-list-launch-length="20">20</button></div></section><section><small>${t("trainingLists.difficultyLabel")}</small><div class="tabs segmented-control" role="group" aria-label="${escapeHtml(t("trainingLists.difficultyLabel"))}" style="--tab-count:3">${["easy","medium","hard"].map(level=>`<button class="tab-button ${trainingListLaunchDraft.difficulty===level?"active":""}" aria-pressed="${trainingListLaunchDraft.difficulty===level}" data-list-launch-difficulty="${level}">${escapeHtml(difficultyLabel(level))}</button>`).join("")}</div></section>`;
    root.querySelectorAll("[data-list-launch-mode]").forEach(button=>button.addEventListener("click",()=>{trainingListLaunchDraft.mode=button.dataset.listLaunchMode;renderTrainingListLaunchOptions();}));
    root.querySelectorAll("[data-list-launch-length]").forEach(button=>button.addEventListener("click",()=>{trainingListLaunchDraft.length=Number(button.dataset.listLaunchLength);renderTrainingListLaunchOptions();}));
    root.querySelectorAll("[data-list-launch-difficulty]").forEach(button=>button.addEventListener("click",()=>{trainingListLaunchDraft.difficulty=button.dataset.listLaunchDifficulty;renderTrainingListLaunchOptions();}));
  }

  function openTrainingListLaunch(listId) {
    const list=trainingListById(listId);if(!list)return;
    if(!QuizmonTrainingLists.canStart(list)){
      showMessageDialog({title:t("trainingLists.tooSmallTitle"),message:t("trainingLists.tooSmallText"),buttonLabel:t("common.understood"),kind:"warning",icon:"!"});return;
    }
    const mode=QuizmonTrainingLists.compatibleModes(list.kind)[0];
    trainingListLaunchDraft={listId:list.id,mode,length:10,difficulty:state.config[mode]?.difficulty||"medium"};
    setModalMarkup(`<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="trainingListLaunchTitle"><section class="modal-card training-list-launch-modal" tabindex="-1"><header><span aria-hidden="true">▶</span><div><p class="quiz-kicker">${t("trainingLists.startKicker")}</p><h2 id="trainingListLaunchTitle">${escapeHtml(list.name)}</h2><p>${t("trainingLists.startText",{count:list.entries.length})}</p></div></header><div data-training-list-launch-options></div><div class="modal-actions"><button type="button" class="secondary-button" data-list-launch-cancel>${t("common.cancel")}</button><button type="button" class="primary-button" data-list-launch-start>${t("trainingLists.start")}</button></div></section></div>`,{initialFocus:"[data-list-launch-start]"});
    document.querySelector("[data-list-launch-cancel]")?.addEventListener("click",()=>{trainingListLaunchDraft=null;closeModal();});
    document.querySelector("[data-list-launch-start]")?.addEventListener("click",()=>{const draft={...trainingListLaunchDraft};trainingListLaunchDraft=null;closeModal(()=>startTrainingListSession(draft.listId,draft.mode,{length:draft.length,difficulty:draft.difficulty}));});
    renderTrainingListLaunchOptions();
  }

  function generateEffectivenessSpec(options = {}) {
    const random = options.random || Math.random;
    const difficulty = options.difficulty || "medium";
    let questionKind = options.kind || "mixed";
    if (questionKind === "mixed") questionKind = random() < .55 ? "effective" : "resisted";

    const allowedTypes=unique((options.allowedTypes||[]).filter(type=>TYPES.includes(type)));
    const attackingPool=allowedTypes.length?allowedTypes:TYPES;
    let attackingType = options.focusType && random() < .68 ? options.focusType : randomItem(attackingPool, random);
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
    const minimumAnswers = difficulty === "hard" && correctPool.length > 1 ? 2 : 1;
    const answerCount = minimumAnswers + Math.floor(random() * Math.max(1, maxAnswers - minimumAnswers + 1));
    const correctTargets = correctPool.slice(0, answerCount);
    const distractors = shuffle(TYPES.filter(t => !correctPool.includes(t)), random).slice(0, optionCount - answerCount);
    return { kind:"effectiveness", questionKind, attackingType, options:shuffle([...correctTargets,...distractors],random), correctTargets, focusTypes:[attackingType] };
  }

  function generateMultiplierSpec(options = {}) {
    const random = options.random || Math.random;
    const allowedTypes=unique((options.allowedTypes||[]).filter(type=>TYPES.includes(type)));
    const defendingPool=allowedTypes.length?allowedTypes:TYPES;
    let defense = options.defense || "mixed";
    if(defendingPool.length<2)defense="single";
    else if (defense === "mixed") defense = random() < .52 ? "single" : "dual";
    let defendingTypes;
    if (options.focusType && defendingPool.includes(options.focusType) && random() < .72) {
      defendingTypes = defense === "single" ? [options.focusType] : [options.focusType, randomItem(defendingPool.filter(t => t !== options.focusType),random)];
    } else defendingTypes = defense === "single" ? [randomItem(defendingPool,random)] : shuffle(defendingPool,random).slice(0,2);
    return { kind:"multiplier", defendingTypes, focusTypes:[...defendingTypes] };
  }

  function generateImpactSpec(options = {}) {
    const random = options.random || Math.random;
    const allowedTypes=unique((options.allowedTypes||[]).filter(type=>TYPES.includes(type)));
    const typePool=allowedTypes.length?allowedTypes:TYPES;
    let defense = options.defense || "mixed";
    if(typePool.length<2)defense="single";
    else if (defense === "mixed") defense = random() < .48 ? "single" : "dual";
    const attackingType = options.focusType && typePool.includes(options.focusType) && random() < .55 ? options.focusType : randomItem(typePool, random);
    let defendingTypes;
    if (options.focusType && typePool.includes(options.focusType) && attackingType !== options.focusType && random() < .7) {
      defendingTypes = defense === "single" ? [options.focusType] : [options.focusType, randomItem(typePool.filter(type => type !== options.focusType), random)];
    } else {
      defendingTypes = defense === "single" ? [randomItem(typePool, random)] : shuffle(typePool, random).slice(0, 2);
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
    view.innerHTML = `<section class="panel quiz-session-panel visual-refresh-session session-loading-panel" aria-busy="true">${sessionHeader()}<div class="loading-state-card"><span class="loading-orbit" aria-hidden="true"><i></i></span><h1>${t("session.loadingPokemon")}</h1><p>${t("session.loadingHint")}</p></div></section>`;
  }

  async function renderQuestion() {
    if (!session) { setRoute("home"); return; }
    if (session.index >= session.length || (session.sequence && session.index >= session.sequence.length)) { finishSession(); return; }
    session.answered = false;
    session.lastReward = null;
    session.lastAdaptiveUpdate = null;
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
    session.questionStartedAt = Date.now();
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
    const combo = Math.max(0, Number(session.combo || 0));
    const adaptiveShortKey = session.currentSpec?._smartSessionAdjustment ? "difficulty.adjustedDuringShort" : "difficulty.adjustedShort";
    const adaptiveDifficulty = session.mode === "weak" && session.currentSpec?._smartDifficulty ? `<em class="session-adaptive-difficulty ${session.currentSpec._smartDifficulty}">${escapeHtml(difficultyLabel(session.currentSpec._smartDifficulty))} · ${t(adaptiveShortKey)}</em>` : "";
    return `<header class="session-command-bar">
      <div class="session-mode-identity"><span>${visual.icon}</span><div><small>${t("session.activeMode")}</small><strong>${escapeHtml(sessionModeName())}</strong>${adaptiveDifficulty}</div></div>
      <div class="session-progress-block"><div><strong>${label}</strong><span>${progress}%</span></div><div class="session-progress"><span style="width:${progress}%"></span></div></div>
      <div class="session-live-metrics">
        <div class="session-live-score"><small>${t("session.correctLive")}</small><strong id="sessionCorrectLive">✓ ${session.correct}</strong></div>
        <div id="sessionComboLive" class="session-combo-pill ${combo >= 3 ? "is-hot" : ""}" aria-label="${escapeHtml(t("session.comboCount",{count:combo}))}"><small>${t("session.combo")}</small><strong>×${combo}</strong></div>
      </div>
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
    view.innerHTML = `<section class="panel quiz-session-panel visual-refresh-session">${sessionHeader()}${hintHtml("effectiveness",t("session.multiHint"),t("session.multiHintText"))}
      <div class="quiz-question-stage">
        <div class="quiz-head"><p class="quiz-kicker">${t("session.chooseAnswer")}</p><h1>${t("session.effectQuestion",{relation:effective?t("session.veryEffective"):t("session.notEffective")})}</h1><p>${spec.correctTargets.length===1?t("session.answerCountOne"):t("session.answerCountMany",{count:spec.correctTargets.length})}</p><div class="question-role-label">${t("learn.attackType")}</div><div class="type-prompt question-type-prompt">${typeChip(spec.attackingType,"large")}</div></div>
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
    const correct=QuizmonQuiz.isExactSelection(selected,spec.correctTargets);
    const errorTypes=QuizmonQuiz.selectionDifference(selected,spec.correctTargets);
    document.querySelectorAll("[data-answer]").forEach(button=>{const type=button.dataset.answer;button.classList.add("is-locked");button.disabled=true;button.setAttribute("aria-disabled","true");if(spec.correctTargets.includes(type))button.classList.add("correct");else if(spec.selected.has(type))button.classList.add("incorrect");});
    recordQuestion(correct,unique([spec.attackingType,...errorTypes]),selected);
    const subtitle = correct ? t("session.answerConfirmed") : t("explanation.effectivenessReview");
    const reviewTarget = errorTypes[0] || spec.correctTargets[0];
    const learningExtras = correct ? "" : `${explanationLearningHintHtml(spec)}${feedbackReferenceActions({ types:[spec.attackingType,reviewTarget], attacker:spec.attackingType, defenders:[reviewTarget] })}`;
    const correctSummary=`<div class="feedback-correct-summary"><small>${t("cleanup2.correctSolution")}</small><div>${spec.correctTargets.map(type=>typeChip(type,"small")).join("")}</div></div>`;
    const explanation=effectivenessExplanation(spec,!correct);
    showFeedback(correct?"success":"error",correct
      ? `${feedbackHeading(true,subtitle)}${correctSummary}${feedbackProgressiveDetails(explanation)}`
      : `${feedbackHeading(false,subtitle)}<div class="feedback-matchup-list">${explanation}</div>${learningExtras}`);
    haptic(correct?"success":"error"); activateNextButton();
  }

  function effectivenessExplanation(spec, explainMistakes = false) {
    const wrongSelections = explainMistakes ? [...(spec.selected || [])].filter(type => !spec.correctTargets.includes(type)) : [];
    const shownTargets = unique([...spec.correctTargets,...wrongSelections]);
    return shownTargets.map(target=>matchupBreakdown(spec.attackingType,[target],{compact:true,explain:explainMistakes})).join("");
  }

  function renderMultiplierQuestion(spec) {
    spec.assignments=Object.fromEntries(TYPES.map(type=>[type,null])); spec.selectedType=null;
    const buckets=[0,.25,.5,1,2,4];
    view.innerHTML=`<section class="panel quiz-session-panel visual-refresh-session multiplier-panel">${sessionHeader()}${hintHtml("multiplier",t("session.sortHint"),t("session.sortHintText"))}
      <div class="quiz-question-stage multiplier-question-stage">
        <div class="quiz-head"><p class="quiz-kicker">${t("session.sortTypes")}</p><h1>${t("session.multiplierQuestion")}</h1><p>${t("session.multiplierSubtitle")}</p><div class="question-role-label">${t("learn.defendingType")}</div><div class="defender-types question-type-prompt">${spec.defendingTypes.map(type=>typeChip(type,"large")).join("")}</div></div>
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
    document.querySelectorAll(".bucket .type-chip").forEach(chip=>{const type=chip.dataset.type;chip.classList.add("is-locked");chip.disabled=true;chip.setAttribute("aria-disabled","true");chip.classList.add(spec.assignments[type]===effectiveness(type,spec.defendingTypes)?"is-correct":"is-wrong");});
    document.querySelectorAll(".multiplier-panel [data-bucket]").forEach(bucket=>{bucket.classList.add("is-locked");bucket.disabled=true;bucket.setAttribute("aria-disabled","true");});
    recordQuestion(correct,spec.defendingTypes,clone(spec.assignments));
    const shown=wrong.slice(0,5);
    const correctionCards=shown.map((type,index)=>multiplierCorrection(type,spec.defendingTypes,spec.assignments[type],index)).join("");
    if(correct){
      showFeedback("success",`${feedbackHeading(true,t("session.allCorrect"))}<div class="feedback-defense-summary"><span>${t("learn.defendingType")}</span>${spec.defendingTypes.map(type=>typeChip(type,"small")).join("")}</div>`);
    }else{
      const remaining=Math.max(0,wrong.length-shown.length);
      const learningExtras = `${explanationLearningHintHtml(spec)}${feedbackReferenceActions({ types:spec.defendingTypes, attacker:shown[0], defenders:spec.defendingTypes })}`;
      showFeedback("error",`${feedbackHeading(false,t("session.correctCount",{correct:18-wrong.length}))}<p class="feedback-copy">${t("session.correctionsIntro",{count:shown.length})}</p><div class="feedback-correction-list">${correctionCards}</div>${remaining?`<p class="feedback-more">${t("session.moreCorrections",{count:remaining})}</p>`:""}${learningExtras}`);
    }
    haptic(correct?"success":"error"); activateNextButton();
  }

  function multiplierFormula(attacker,defenders) {
    return matchupBreakdown(attacker,defenders,{compact:true});
  }

  function multiplierCorrection(attacker,defenders,assignedValue,index=0) {
    const correctValue=effectiveness(attacker,defenders);
    return `<details class="feedback-correction-card" ${index===0?"open":""}><summary><div class="feedback-correction-head">${typeChip(attacker,"small")}<span><small>${t("session.yourAssignment")}</small><strong>${formatMultiplier(assignedValue)}</strong></span><span class="correct-value"><small>${t("session.correctAssignment")}</small><strong>${formatMultiplier(correctValue)}</strong></span><em>${t("explanation.details")}</em></div></summary><div class="feedback-correction-body">${matchupBreakdown(attacker,defenders,{compact:true,explain:true})}</div></details>`;
  }

  function renderImpactQuestion(spec) {
    spec.selectedMultiplier = null;
    view.innerHTML = `<section class="panel quiz-session-panel visual-refresh-session">${sessionHeader()}${hintHtml("impact",t("session.impactHint"),t("session.impactHintText"))}
      <div class="quiz-question-stage">
        <div class="quiz-head"><p class="quiz-kicker">${spec.pokemon?t("path.pokemonImpactKicker"):t("session.calculateImpact")}</p><h1>${spec.pokemon?t("path.pokemonImpactQuestion"):t("session.impactQuestion")}</h1><p>${spec.pokemon?t("path.pokemonImpactSubtitle"):t("session.impactSubtitle")}</p>
        <div class="matchup-display ${spec.pokemon?"pokemon-application":""}"><div><small>${t("learn.attackType")}</small>${typeChip(spec.attackingType,"large")}</div><span class="matchup-arrow">→</span><div><small>${t("learn.defendingType")}</small>${spec.pokemon?`<div class="path-session-pokemon"><img src="${escapeHtml(spec.pokemon.image)}" alt="${escapeHtml(spec.pokemon.name)}"><div><strong>${escapeHtml(spec.pokemon.name)}</strong><span>${spec.defendingTypes.map(type=>typeChip(type,"small")).join("")}</span></div></div>`:`<div class="defender-types compact">${spec.defendingTypes.map(type=>typeChip(type,"large")).join("")}</div>`}</div></div></div>
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
    return multiplierMeaning(value);
  }

  function checkImpact(spec) {
    if(session.answered)return;
    if(spec.selectedMultiplier===null){showFeedback("neutral",t("session.chooseMultiplier"));return;}
    session.answered=true;
    const correct=spec.selectedMultiplier===spec.correctMultiplier;
    document.querySelectorAll("[data-impact-value]").forEach(button=>{
      const value=Number(button.dataset.impactValue);
      button.classList.add("is-locked");button.disabled=true;button.setAttribute("aria-disabled","true");
      if(value===spec.correctMultiplier)button.classList.add("correct");
      else if(value===spec.selectedMultiplier)button.classList.add("incorrect");
    });
    recordQuestion(correct,unique([spec.attackingType,...spec.defendingTypes]),spec.selectedMultiplier);
    const subtitle=correct?t("session.answerConfirmed"):t("session.correctResultShown");
    const learningExtras = correct ? "" : `${explanationLearningHintHtml(spec)}${feedbackReferenceActions({ types:[spec.attackingType,...spec.defendingTypes], attacker:spec.attackingType, defenders:spec.defendingTypes })}`;
    const breakdown=matchupBreakdown(spec.attackingType,spec.defendingTypes,{explain:!correct});
    const correctSummary=`<div class="feedback-result-highlight"><small>${t("session.finalResult")}</small><strong>${formatMultiplier(spec.correctMultiplier)}</strong><span>${escapeHtml(multiplierMeaning(spec.correctMultiplier))}</span></div>`;
    showFeedback(correct?"success":"error",correct
      ? `${feedbackHeading(true,subtitle)}${correctSummary}${feedbackProgressiveDetails(breakdown)}`
      : `${feedbackHeading(false,subtitle)}${breakdown}${learningExtras}`);
    haptic(correct?"success":"error");activateNextButton();
  }

  async function renderPokemonQuestion(spec) {
    spec.selected=new Set();
    const showImage=spec.display!=="name";
    const imageOnly=spec.display==="image";
    const showName=!imageOnly || !navigator.onLine;
    view.innerHTML=`<section class="panel quiz-session-panel visual-refresh-session pokemon-stage">${sessionHeader()}${hintHtml("pokemon",t("session.pokemonHint"),t("session.pokemonHintText"))}
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
    const correct=QuizmonQuiz.isExactSelection(selected,expected);
    document.querySelectorAll("[data-pokemon-type]").forEach(button=>{const type=button.dataset.pokemonType;button.classList.add("is-locked");button.disabled=true;button.setAttribute("aria-disabled","true");if(expected.includes(type))button.classList.add("correct");else if(spec.selected.has(type))button.classList.add("incorrect");});
    recordQuestion(correct,expected,selected);
    const subtitle=correct?t("session.pokemonConfirmed",{pokemon:spec.pokemon.name}):t("session.pokemonCorrection",{pokemon:spec.pokemon.name});
    const explanation = correct ? "" : `${pokemonTypeExplanationHtml(spec,selected)}${explanationLearningHintHtml(spec)}${feedbackReferenceActions({ types:expected })}`;
    showFeedback(correct?"success":"error",`${feedbackHeading(correct,subtitle)}<div class="feedback-pokemon-types"><span>${t("session.correctTypesLabel")}</span><div>${expected.map(type=>typeChip(type,"small")).join(" ")}</div></div>${explanation}`);
    haptic(correct?"success":"error"); activateNextButton();
  }

  function questionSignature(spec) { return QuizmonQuiz.questionSignature(spec); }

  function comboBonusFor(combo, isReview = false) { return QuizmonMotivation.comboBonusFor(combo, isReview); }

  function nextComboTarget(combo, isReview = false) { return QuizmonMotivation.nextComboTarget(combo, isReview); }

  function comboMilestoneKey(combo) {
    if (combo >= 10) return "session.comboMilestoneTen";
    if (combo >= 5) return "session.comboMilestoneFive";
    return "session.comboMilestoneThree";
  }

  function rewardParticlesMarkup() {
    return `<span class="reward-particles" aria-hidden="true">${Array.from({length:8},(_,index)=>`<i style="--particle:${index}"></i>`).join("")}</span>`;
  }

  function dailyGoalFeedbackMarkup(goal) {
    if (!goal?.show) return "";
    if (goal.completedNow) return `<div class="answer-daily-goal is-complete" style="--daily-answer-progress:100%">${rewardParticlesMarkup()}<span aria-hidden="true">🔥</span><div><small>${t("daily.completedTitle")}</small><strong>${t("daily.goalReward", { count: goal.bonusXp })}</strong><em>${tp("daily.streakLabelOne", "daily.streakLabel", goal.streak)}</em></div><i><b></b></i></div>`;
    return `<div class="answer-daily-goal" style="--daily-answer-progress:${goal.percent}%"><span aria-hidden="true">◎</span><div><small>${t("daily.title")}</small><strong>${t("daily.progressText", { progress: goal.progress, target: goal.target })}</strong><em>${tp("daily.remainingOne", "daily.remaining", goal.remaining)}</em></div><i><b></b></i></div>`;
  }

  function answerRewardMarkup(reward) {
    if (!reward) return "";
    if (!reward.correct) {
      const resetText = reward.previousCombo >= 2
        ? t("session.comboResetWithCount", { count: reward.previousCombo })
        : t("session.comboRetry");
      return `<section class="answer-reward-card is-retry" aria-label="${escapeHtml(t("session.rewardFeedback"))}">
        <span class="answer-reward-icon" aria-hidden="true">↻</span>
        <span class="answer-reward-copy"><small>${t("session.nextChance")}</small><strong>${escapeHtml(resetText)}</strong><em>${t("session.comboRetryHint")}</em></span>
        ${dailyGoalFeedbackMarkup(reward.dailyGoal)}
      </section>`;
    }
    const next = nextComboTarget(reward.combo, reward.isReview);
    const previousTarget = reward.combo < 3 ? 0 : reward.combo < 5 ? 3 : reward.combo < 10 ? 5 : Math.floor(reward.combo / 5) * 5;
    const progress = Math.max(0, Math.min(100, Math.round(((reward.combo - previousTarget) / Math.max(1, next.target - previousTarget)) * 100)));
    const milestone = reward.bonusXp > 0;
    return `<section class="answer-reward-card ${milestone ? "is-milestone" : ""}" aria-label="${escapeHtml(t("session.rewardFeedback"))}" style="--combo-progress:${progress}%">
      ${milestone ? rewardParticlesMarkup() : ""}
      <span class="answer-reward-icon" aria-hidden="true">${milestone ? "✦" : "XP"}</span>
      <span class="answer-reward-copy">
        <small>${milestone ? t(comboMilestoneKey(reward.combo)) : t("session.instantReward")}</small>
        <strong>${t("session.xpGained", { count: reward.baseXp })}${reward.bonusXp ? ` <b>+${reward.bonusXp} ${t("session.bonusXpShort")}</b>` : ""}</strong>
        <em>${t("session.comboCount", { count: reward.combo })}</em>
      </span>
      <span class="answer-reward-next"><span><small>${t("session.nextComboTarget")}</small><strong>${t("session.comboTargetText", { count: next.remaining, bonus: next.bonus })}</strong></span><i><b></b></i></span>
      ${dailyGoalFeedbackMarkup(reward.dailyGoal)}
    </section>`;
  }

  function updateSessionLiveReward() {
    if (!session) return;
    const correctNode = document.getElementById("sessionCorrectLive");
    if (correctNode) correctNode.textContent = `✓ ${session.correct}`;
    const comboNode = document.getElementById("sessionComboLive");
    if (!comboNode) return;
    const combo = Math.max(0, Number(session.combo || 0));
    comboNode.classList.toggle("is-hot", combo >= 3);
    comboNode.classList.remove("just-updated", "is-milestone");
    void comboNode.offsetWidth;
    comboNode.classList.add("just-updated");
    if (session.lastReward?.bonusXp) comboNode.classList.add("is-milestone");
    comboNode.setAttribute("aria-label", t("session.comboCount", { count: combo }));
    const strong = comboNode.querySelector("strong");
    if (strong) strong.textContent = `×${combo}`;
  }

  function pushLearningObservation(map, key, score) {
    if (!validLearningKey(key)) return;
    const value = clampScore(score);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  }

  function finalizeLearningObservations(map) {
    return [...map.entries()].map(([key, values]) => ({
      key,
      score: Math.round((values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)) * 1000) / 1000
    }));
  }

  function errorRuleKey(code) { return QuizmonErrors.ruleKey(code); }

  function errorSortedTypes(types) { return QuizmonErrors.sortedTypes(types, TYPES); }

  function errorMatchupKey(attackingType, defendingTypes) { return QuizmonErrors.matchupKey(attackingType, defendingTypes, TYPES); }

  function errorPokemonKey(pokemonId) { return QuizmonErrors.pokemonKey(pokemonId); }

  function addErrorOpportunity(opportunities, key) {
    const valid = sanitizeErrorPatternKey(key);
    if (valid) opportunities.add(valid);
  }

  function addErrorIssue(issues, issue) {
    const clean = sanitizeErrorIssue(issue);
    if (!clean || issues.some(existing => existing.patternKey === clean.patternKey)) return;
    issues.push(clean);
  }

  function addRuleErrorIssue(issues, code, context = {}) {
    addErrorIssue(issues, { ...context, patternKey:errorRuleKey(code) });
  }

  function multiplierRuleEvidence(attackingType, defendingTypes, expected, actual, opportunities, issues) {
    const defenders = errorSortedTypes(defendingTypes);
    const numericActual = Number(actual);
    const actualKnown = Number.isFinite(numericActual);
    const factors = defenders.map(type => effectiveness(attackingType, [type]));
    const context = { attackingType, defendingTypes:defenders, expectedMultiplier:expected, actualMultiplier:actualKnown ? numericActual : null };

    if (expected === 0) {
      addErrorOpportunity(opportunities, errorRuleKey("immunity-overlooked"));
      if (actualKnown && numericActual !== 0) addRuleErrorIssue(issues, "immunity-overlooked", context);
    } else {
      addErrorOpportunity(opportunities, errorRuleKey("immunity-assumed"));
      if (actualKnown && numericActual === 0) addRuleErrorIssue(issues, "immunity-assumed", context);
    }
    if (defenders.length === 2 && (expected === .25 || expected === .5)) {
      addErrorOpportunity(opportunities, errorRuleKey("quarter-half-confusion"));
      if (actualKnown && ((expected === .25 && numericActual === .5) || (expected === .5 && numericActual === .25))) addRuleErrorIssue(issues, "quarter-half-confusion", context);
    }
    if (defenders.length === 2 && (expected === 2 || expected === 4)) {
      addErrorOpportunity(opportunities, errorRuleKey("double-quad-confusion"));
      if (actualKnown && ((expected === 4 && numericActual === 2) || (expected === 2 && numericActual === 4))) addRuleErrorIssue(issues, "double-quad-confusion", context);
    }
    if (defenders.length === 2) {
      addErrorOpportunity(opportunities, errorRuleKey("dual-multiplication"));
      if (actualKnown && numericActual !== expected && factors.includes(numericActual)) addRuleErrorIssue(issues, "dual-multiplication", context);
      const neutralized = expected === 1 && factors.includes(2) && factors.includes(.5);
      if (neutralized) {
        addErrorOpportunity(opportunities, errorRuleKey("dual-neutralization"));
        if (actualKnown && numericActual !== 1) addRuleErrorIssue(issues, "dual-neutralization", context);
      }
    }
    if (defenders.length === 1) {
      addErrorOpportunity(opportunities, errorRuleKey("direction-reversal"));
      const reverse = effectiveness(defenders[0], [attackingType]);
      if (actualKnown && numericActual !== expected && numericActual === reverse) addRuleErrorIssue(issues, "direction-reversal", context);
    }
  }

  function buildErrorAnalysisEvent(correct, userAnswer, spec) {
    if (!spec || !session) return null;
    const opportunities = new Set();
    const issues = [];
    const addMatchup = (attackingType, defendingTypes, expected, actual, wrong) => {
      const patternKey = errorMatchupKey(attackingType, defendingTypes);
      addErrorOpportunity(opportunities, patternKey);
      if (wrong) addErrorIssue(issues, { patternKey, attackingType, defendingTypes, expectedMultiplier:expected, actualMultiplier:actual });
    };

    if (spec.kind === "effectiveness") {
      const selected = new Set(Array.isArray(userAnswer) ? userAnswer : []);
      const expectedTargets = new Set(spec.correctTargets || []);
      const wantsEffective = spec.questionKind === "effective";
      addErrorOpportunity(opportunities, errorRuleKey("direction-reversal"));
      (spec.options || []).forEach(type => {
        const expectedSelected = expectedTargets.has(type);
        const actualSelected = selected.has(type);
        const factor = effectiveness(spec.attackingType, [type]);
        addMatchup(spec.attackingType, [type], factor, actualSelected ? 1 : 0, expectedSelected !== actualSelected);
        if (actualSelected && !expectedSelected) {
          const reverse = effectiveness(type, [spec.attackingType]);
          const reverseMatches = wantsEffective ? reverse > 1 : reverse < 1;
          if (reverseMatches) addRuleErrorIssue(issues, "direction-reversal", { attackingType:spec.attackingType, defendingTypes:[type], expectedMultiplier:factor, actualMultiplier:reverse });
        }
      });
    } else if (spec.kind === "multiplier") {
      const assignments = userAnswer && typeof userAnswer === "object" ? userAnswer : {};
      TYPES.forEach(attackingType => {
        const expected = effectiveness(attackingType, spec.defendingTypes);
        const actual = Number(assignments[attackingType]);
        const wrong = !Number.isFinite(actual) || actual !== expected;
        addMatchup(attackingType, spec.defendingTypes, expected, Number.isFinite(actual) ? actual : null, wrong);
        multiplierRuleEvidence(attackingType, spec.defendingTypes, expected, actual, opportunities, issues);
      });
    } else if (spec.kind === "impact") {
      const expected = Number(spec.correctMultiplier);
      const actual = Number(userAnswer);
      addMatchup(spec.attackingType, spec.defendingTypes, expected, Number.isFinite(actual) ? actual : null, !correct);
      multiplierRuleEvidence(spec.attackingType, spec.defendingTypes, expected, actual, opportunities, issues);
    } else if (spec.kind === "pokemon") {
      const selected = new Set(Array.isArray(userAnswer) ? userAnswer : []);
      const expected = new Set(spec.pokemon?.types || []);
      const pokemonKey = errorPokemonKey(spec.pokemon?.id);
      addErrorOpportunity(opportunities, pokemonKey);
      addErrorOpportunity(opportunities, errorRuleKey("pokemon-wrong-type"));
      if (expected.size === 2) addErrorOpportunity(opportunities, errorRuleKey("pokemon-missing-secondary"));
      if (expected.size === 1) addErrorOpportunity(opportunities, errorRuleKey("pokemon-extra-type"));
      if (!correct) {
        const context = { pokemonId:spec.pokemon?.id, pokemonName:spec.pokemon?.name || "" };
        addErrorIssue(issues, { ...context, patternKey:pokemonKey });
        addRuleErrorIssue(issues, "pokemon-wrong-type", context);
        const selectedTypes = [...selected];
        const expectedTypes = [...expected];
        if (expected.size === 2 && selected.size === 1 && selectedTypes.every(type => expected.has(type))) addRuleErrorIssue(issues, "pokemon-missing-secondary", context);
        if (expected.size === 1 && selected.size > 1 && expectedTypes.every(type => selected.has(type))) addRuleErrorIssue(issues, "pokemon-extra-type", context);
      }
    }

    return sanitizeErrorEvent({
      id:`error-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      at:new Date().toISOString(),
      sessionId:`session-${session.startedAt}`,
      mode:session.mode,
      kind:spec.kind,
      signature:questionSignature(spec),
      correct,
      opportunities:[...opportunities],
      issues
    });
  }

  function recordErrorAnalysisEvent(correct, userAnswer, spec) {
    const event = buildErrorAnalysisEvent(correct, userAnswer, spec);
    if (!event) return null;
    state.stats.errorAnalysis.events.push(event);
    state.stats.errorAnalysis.events = state.stats.errorAnalysis.events.slice(-ERROR_EVENT_LIMIT);
    return event;
  }

  function recordLearningEvent(correct, userAnswer, spec) {
    if (!spec || !state.stats.learning) return;
    const observations = new Map();
    const wrongTypes = [];
    let dual = false;

    if (spec.kind === "effectiveness") {
      const selected = new Set(Array.isArray(userAnswer) ? userAnswer : []);
      const expected = new Set(spec.correctTargets || []);
      const options = Array.isArray(spec.options) ? spec.options : [];
      const optionScores = options.map(type => {
        const score = selected.has(type) === expected.has(type) ? 1 : 0;
        pushLearningObservation(observations, `defense:${type}`, score);
        if (!score) wrongTypes.push(type);
        return score;
      });
      const questionScore = optionScores.length ? optionScores.reduce((sum, value) => sum + value, 0) / optionScores.length : Number(Boolean(correct));
      pushLearningObservation(observations, `attack:${spec.attackingType}`, questionScore);
      pushLearningObservation(observations, "skill:effectiveness", questionScore);
    } else if (spec.kind === "multiplier") {
      const assignments = userAnswer && typeof userAnswer === "object" ? userAnswer : {};
      const typeScores = TYPES.map(type => {
        const score = Number(assignments[type]) === effectiveness(type, spec.defendingTypes) ? 1 : 0;
        pushLearningObservation(observations, `attack:${type}`, score);
        if (!score) wrongTypes.push(type);
        return score;
      });
      const questionScore = typeScores.reduce((sum, value) => sum + value, 0) / TYPES.length;
      (spec.defendingTypes || []).forEach(type => pushLearningObservation(observations, `defense:${type}`, questionScore));
      pushLearningObservation(observations, "skill:multiplier", questionScore);
      dual = (spec.defendingTypes || []).length === 2;
      if (dual) pushLearningObservation(observations, "skill:dual", questionScore);
    } else if (spec.kind === "impact") {
      const questionScore = Number(Boolean(correct));
      pushLearningObservation(observations, `attack:${spec.attackingType}`, questionScore);
      (spec.defendingTypes || []).forEach(type => pushLearningObservation(observations, `defense:${type}`, questionScore));
      pushLearningObservation(observations, "skill:impact", questionScore);
      pushLearningObservation(observations, "skill:multiplier", questionScore);
      dual = (spec.defendingTypes || []).length === 2;
      if (dual) pushLearningObservation(observations, "skill:dual", questionScore);
      if (!correct) wrongTypes.push(spec.attackingType, ...(spec.defendingTypes || []));
    } else if (spec.kind === "pokemon") {
      const selected = new Set(Array.isArray(userAnswer) ? userAnswer : []);
      const expected = new Set(spec.pokemon?.types || []);
      pushLearningObservation(observations, "skill:pokemon", Number(Boolean(correct)));
      unique([...expected, ...selected]).forEach(type => {
        const score = selected.has(type) === expected.has(type) ? 1 : 0;
        pushLearningObservation(observations, `pokemon:${type}`, score);
        if (!score) wrongTypes.push(type);
      });
      dual = expected.size === 2;
      if (dual) pushLearningObservation(observations, "skill:dual", Number(Boolean(correct)));
    }

    const event = sanitizeLearningEvent({
      id: `learn-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      at: new Date().toISOString(),
      mode: session.mode,
      kind: spec.kind,
      difficulty: spec?._smartDifficulty || session.config?.difficulty || null,
      correct,
      duration: session.questionStartedAt ? Date.now() - session.questionStartedAt : 0,
      review: session.mode === "review",
      dual,
      focusTypes: spec.focusTypes || [],
      wrongTypes,
      observations: finalizeLearningObservations(observations)
    });
    if (!event) return null;
    state.stats.learning.events.push(event);
    state.stats.learning.events = state.stats.learning.events.slice(-LEARNING_EVENT_LIMIT);
    return event;
  }

  function recordQuestion(correct,relatedTypes,userAnswer) {
    const specForReview=serializeCurrentQuestion(); const isReview=session.mode==="review";
    const modeStats=state.stats.modes[session.mode]||blankModeStats(); state.stats.modes[session.mode]=modeStats; modeStats.total+=1;if(correct)modeStats.correct+=1;
    const previousCombo=Math.max(0,Number(session.combo||0));
    if(!isReview){
      state.stats.total+=1;
      if(correct){state.stats.correct+=1;state.stats.streak+=1;state.stats.bestStreak=Math.max(state.stats.bestStreak,state.stats.streak);}else state.stats.streak=0;
      unique(relatedTypes).forEach(type=>{const stats=state.stats.types[type];if(!stats)return;stats.total+=1;if(correct)stats.correct+=1;stats.lastSeen=new Date().toISOString();stats.recent.push(Boolean(correct));stats.recent=stats.recent.slice(-10);if(!correct)session.wrongTypes[type]=(session.wrongTypes[type]||0)+1;});
    }
    const errorEvent=recordErrorAnalysisEvent(correct,userAnswer,specForReview);
    updateMistakeBook(correct,specForReview,userAnswer,errorEvent);
    const learningEvent=recordLearningEvent(correct,userAnswer,specForReview);
    const focusKey=session.currentSpec?._smartFocusKey||null;
    const focusObservation=focusKey?learningEvent?.observations?.find(item=>item.key===focusKey):null;
    session.answers.push({
      correct,
      kind:session.currentSpec.kind,
      relatedTypes:unique(relatedTypes),
      focusKey,
      focusScore:focusObservation?focusObservation.score:Number(Boolean(correct)),
      smartSource:session.currentSpec?._smartSource||null,
      difficulty:session.currentSpec?._smartDifficulty||session.config?.difficulty||null,
      baseDifficulty:session.currentSpec?._smartBaseDifficulty||session.currentSpec?._smartDifficulty||null,
      duration:Number(learningEvent?.duration||0),
      sessionAdjustment:session.currentSpec?._smartSessionAdjustment||null,
      pathExamArea:session.currentSpec?._pathExamArea||null,
      pathSourceModule:session.currentSpec?._pathSourceModule||null
    });
    session.lastAdaptiveUpdate=maybeAdjustSmartTrainingDuringSession();
    if(correct){
      session.correct+=1;
      session.combo=previousCombo+1;
      session.bestCombo=Math.max(Number(session.bestCombo||0),session.combo);
      if(isReview) session.reviewPending = session.reviewPending.filter(signature => signature !== questionSignature(specForReview));
    }else{
      session.combo=0;
      session.wrongQuestions.push(specForReview);
      if(isReview&&session.sequence){session.sequence.push(clone(specForReview));session.length+=1;}
    }
    const baseXp=correct?(isReview?5:10):0;
    const bonusXp=correct?comboBonusFor(session.combo,isReview):0;
    const dailyGoal=recordDailyGoalProgress();
    session.lastReward={correct,baseXp,bonusXp,combo:session.combo,previousCombo,isReview,dailyGoal};
    addXp(baseXp+bonusXp+dailyGoal.bonusXp);
    if(dailyGoal.completedNow){
      setTimeout(()=>haptic("goal"),160);
      enqueueToast("🔥",t("daily.completedTitle"),dailyGoalRewardToast(dailyGoal.streak,dailyGoal.bonusXp),"level");
    }
    checkAchievements();
    updateHeader();
    updateSessionLiveReward();
    saveState();
  }

  function updateMistakeBook(correct,spec,userAnswer,errorEvent=null) {
    const signature=questionSignature(spec); let item=state.stats.mistakes.find(entry=>entry.signature===signature);
    if(correct){
      if(item&&item.status!=="resolved"){item.correctReviews=(item.correctReviews||0)+1;item.lastSeen=new Date().toISOString();if(item.correctReviews>=2)item.status="resolved";}
      return;
    }
    if(!item){item={id:`mistake-${Date.now()}-${Math.random().toString(16).slice(2)}`,signature,spec:clone(spec),wrongCount:0,correctReviews:0,status:"open",createdAt:new Date().toISOString(),lastSeen:new Date().toISOString(),lastAnswer:null,lastIssues:[],patternKeys:[],errorModelVersion:1};state.stats.mistakes.unshift(item);}
    item.wrongCount+=1;item.correctReviews=0;item.status="open";item.lastSeen=new Date().toISOString();item.lastAnswer=clone(userAnswer);
    item.lastIssues=(errorEvent?.issues||[]).map(sanitizeErrorIssue).filter(Boolean).slice(0,12);
    item.patternKeys=unique(item.lastIssues.map(issue=>issue.patternKey)).slice(0,12);
    item.errorModelVersion=1;
    state.stats.mistakes=state.stats.mistakes.slice(0,100);
  }

  function smartSpecMetadata(spec) {
    return {
      _smartFocusKey: spec?._smartFocusKey || null,
      _smartSource: spec?._smartSource || null,
      _smartLabel: spec?._smartLabel || null,
      _smartBaseDifficulty: spec?._smartBaseDifficulty || spec?._smartDifficulty || null,
      _smartDifficulty: spec?._smartDifficulty || null,
      _smartDifficultyReason: spec?._smartDifficultyReason || null,
      _smartDifficultyCalibrating: Boolean(spec?._smartDifficultyCalibrating),
      _smartSessionAdjustment: spec?._smartSessionAdjustment || null
    };
  }

  function serializeCurrentQuestion() {
    const spec=session.currentSpec;
    const smart=smartSpecMetadata(spec);
    if(spec.kind==="effectiveness")return {...smart,kind:"effectiveness",questionKind:spec.questionKind,attackingType:spec.attackingType,options:[...spec.options],correctTargets:[...spec.correctTargets],focusTypes:[...spec.focusTypes]};
    if(spec.kind==="multiplier")return {...smart,kind:"multiplier",defendingTypes:[...spec.defendingTypes],focusTypes:[...spec.focusTypes]};
    if(spec.kind==="impact")return {...smart,kind:"impact",attackingType:spec.attackingType,defendingTypes:[...spec.defendingTypes],options:[...spec.options],correctMultiplier:spec.correctMultiplier,focusTypes:[...spec.focusTypes]};
    return {...smart,kind:"pokemon",pokemon:clone(spec.pokemon),display:spec.display,focusTypes:[...spec.focusTypes]};
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

  function showFeedback(kind,html){
    const box=document.getElementById("feedback");if(!box)return;
    const rewardMarkup=session?.answered?answerRewardMarkup(session.lastReward):"";
    box.className="feedback";void box.offsetWidth;box.className=`feedback visible ${kind}`;
    box.innerHTML=`${html}${rewardMarkup}${adaptiveUpdateMarkup(session?.lastAdaptiveUpdate)}`;
    bindFeedbackLearningActions(box);
    document.querySelector(".session-actions")?.classList.add("after-feedback");
    if(session?.lastReward?.bonusXp)setTimeout(()=>haptic("combo"),130);
  }
  function activateNextButton(){const button=document.getElementById("primaryAction");if(!button)return;const last=Number.isFinite(session.length)&&session.index+1>=session.length;const end=session.sequence&&session.index+1>=session.sequence.length;button.textContent=last||end?t("common.results"):t("common.next");button.classList.add("is-ready");button.removeAttribute("aria-live");button.onclick=advanceQuestion;}
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
    if(session.ended){setRoute("summary");return;}
    session.ended=true;
    const duration=Math.max(1,Math.round((Date.now()-session.startedAt)/1000));
    session.duration=duration;
    const total=session.answers.length;
    const rate=percent(session.correct,total);
    const isReview=session.mode==="review";
    if(!isReview&&total){
      const previous=state.stats.history.find(item=>item&&item.mode===session.mode&&Number(item.answers)>0&&(session.mode!=="path"||item.pathModuleId===session.pathModuleId)&&String(item.trainingListId||"")===String(session.trainingList?.id||""));
      session.previousComparable=previous?clone(previous):null;
      if(session.mode==="weak")session.learningProgress=smartSessionProgress();
      if(session.mode==="problem")session.problemProgress=problemSessionProgress();
      if(session.mode==="path")session.pathProgress=completeLearningPathModule(rate);
      state.stats.sessions+=1;
      state.stats.totalSeconds+=duration;
      state.stats.modes[session.mode].sessions+=1;
      const weakTypes=Object.entries(session.wrongTypes).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([type])=>type);
      state.stats.history.unshift({
        id:session.id, date:new Date().toISOString(),mode:session.mode,answers:total,correct:session.correct,rate,duration,weakTypes,
        bestCombo:Math.max(0,Number(session.bestCombo||0)),difficulty:session.mode==="weak"?"adaptive":session.config?.difficulty||null,
        smartPlanKind:session.smartPlan?.kind||null,
        adaptiveDifficulty:ADAPTIVE_SESSION_MODES.includes(session.mode),
        difficultyCounts:ADAPTIVE_SESSION_MODES.includes(session.mode)?smartActualDifficultyCounts(session.answers):(session.smartPlan?.difficultyCounts?{...session.smartPlan.difficultyCounts}:null),
        difficultyAdjustments:ADAPTIVE_SESSION_MODES.includes(session.mode)?smartAdjustmentCounts(session.adaptiveFlow?.adjustments):null,
        difficultyTimeline:ADAPTIVE_SESSION_MODES.includes(session.mode)?session.answers.map(answer=>answer.difficulty).filter(level=>ADAPTIVE_DIFFICULTIES.includes(level)).slice(0,20):[],
        problemPatternKey:session.problemPlan?.patternKey||null,
        problemPatternTitle:session.problemPlan?.title||null,
        problemResolved:Boolean(session.problemProgress?.resolved),
        problemImproved:Boolean(session.problemProgress?.improved),
        pathModuleId:session.pathProgress?.moduleId||null,
        pathPassed:Boolean(session.pathProgress?.passed),
        pathReviewKey:session.pathReview?.key||null,
        pathExamId:session.pathProgress?.exam?session.pathProgress.moduleId:null,
        pathExamAreas:session.pathProgress?.exam?Object.fromEntries((session.pathProgress.areaResults||[]).map(item=>[item.key,item.rate])):null,
        pathFinalCompleted:Boolean(session.pathProgress?.finalCompleted),
        learningFocus:(session.learningProgress?.trained||[]).slice(0,6).map(item=>item.key),
        learningImproved:(session.learningProgress?.improved||[]).slice(0,6).map(item=>item.key),
        learningAttention:(session.learningProgress?.attention||[]).slice(0,6).map(item=>item.key),
        trainingListId:session.trainingList?.id||null,
        trainingListName:session.trainingList?.name||null,
        trainingListKind:session.trainingList?.kind||null
      });
      state.stats.history=state.stats.history.slice(0,HISTORY_LIMIT);
      if(rate===100){addXp(50);unlockAchievement("perfect_session",total>=5);}
      if(session.mode==="daily")completeDaily(rate,duration);
      if(session.mode==="weak")unlockAchievement("weakness_session",true);
    }else if(isReview)state.stats.modes.review.sessions+=1;
    saveState();setRoute("summary",{direction:"forward"});
  }

  function completeDaily(rate,duration){if(!state.daily.completed){state.daily.completed=true;state.daily.result={rate,duration};addXp(100);unlockAchievement("daily_first",true);}else state.daily.result={rate,duration};}

  function summaryVerdict(rate) {
    if (rate === 100) return { icon: "★", title: t("summary.verdictPerfect"), text: t("summary.verdictPerfectText") };
    if (rate >= 80) return { icon: "↑", title: t("summary.verdictGreat"), text: t("summary.verdictGreatText") };
    if (rate >= 60) return { icon: "✓", title: t("summary.verdictGood"), text: t("summary.verdictGoodText") };
    return { icon: "↻", title: t("summary.verdictPractice"), text: t("summary.verdictPracticeText") };
  }

  function sessionComparisonInfo(rate, duration, total) {
    return QuizmonProgress.comparisonInfo({
      rate, duration, total, correct: session?.correct || 0, previous: session?.previousComparable || null
    });
  }

  function improvementCardMarkup(rate, duration, total) {
    const info = sessionComparisonInfo(rate, duration, total);
    if (info.kind === "baseline") return "";
    const fewerErrors=Number(info.errorDelta)>0;
    const clearlyFaster=Number(info.timeDelta)>=10;
    const meaningfulBetter=info.kind==="better"&&(Number(info.delta)>=5||fewerErrors||clearlyFaster);
    const meaningfulTarget=info.kind==="target"&&Math.abs(Number(info.delta))>=15;
    if(!meaningfulBetter&&!meaningfulTarget)return "";
    const positiveDetails=[];
    if(fewerErrors)positiveDetails.push(t("improvement.fewerErrors",{count:info.errorDelta}));
    if(clearlyFaster)positiveDetails.push(t("improvement.faster",{time:formatDuration(info.timeDelta)}));
    const title=meaningfulBetter?t("improvement.betterTitle",{count:info.delta}):t("improvement.targetTitle",{rate:info.previousRate});
    const text=meaningfulBetter?t("improvement.betterText",{mode:sessionModeName()}):t("improvement.targetText",{count:Math.abs(info.delta)});
    return `<section class="summary-improvement-card ${meaningfulBetter?"better":"target"}">
      <span class="summary-improvement-icon" aria-hidden="true">${meaningfulBetter?"↑":"↗"}</span>
      <div class="summary-improvement-copy"><small>${t("improvement.kicker")}</small><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p>${positiveDetails.length?`<div class="summary-improvement-tags">${positiveDetails.map(item=>`<span>${escapeHtml(item)}</span>`).join("")}</div>`:""}</div>
    </section>`;
  }

  function momentumInfo(canReview, rate) {
    if(session?.mode==="path"){
      const passed=Boolean(session.pathProgress?.passed);
      const exam=Boolean(session.pathProgress?.exam);return {kind:"path",icon:passed?"→":"↻",title:passed?t("path.momentumPassed"):exam?t("path.exam.momentumPrep"):t("path.momentumRetry"),text:passed?t("path.momentumPassedText"):exam?t("path.exam.momentumPrepText"):t("path.momentumRetryText"),button:passed?t("path.backToPath"):exam?t("path.exam.prepButton"):t("path.retryCheck")};
    }
    const goal=dailyGoalInfo();
    const nextReward=nextLevelRewardInfo(getLevelInfo().current.level);
    if(canReview){
      const count=session.wrongQuestions.length;
      return {kind:"review",icon:"↻",title:count===1?t("momentum.reviewTitleOne"):t("momentum.reviewTitle",{count}),text:t("momentum.reviewText"),button:t("momentum.reviewButton")};
    }
    if(!goal.completed)return {kind:"daily",icon:"🔥",title:tp("momentum.dailyTitleOne","momentum.dailyTitle",goal.remaining),text:t("momentum.dailyText"),button:t("momentum.continueButton")};
    if(nextReward&&nextReward.xpRemaining<=250)return {kind:"reward",icon:"✦",title:t("momentum.rewardTitle",{count:nextReward.xpRemaining,name:rewardHeadline(nextReward)}),text:t("momentum.rewardText"),button:t("momentum.continueButton")};
    if(rate===100)return {kind:"perfect",icon:"★",title:t("momentum.perfectTitle"),text:t("momentum.perfectText"),button:t("momentum.continueButton")};
    return {kind:"repeat",icon:"▶",title:t("momentum.repeatTitle"),text:t("momentum.repeatText"),button:t("momentum.continueButton")};
  }

  function startMomentumSession(canReview) {
    if(session?.mode==="path"){
      const moduleId=session.pathModuleId;const passed=Boolean(session.pathProgress?.passed);const exam=Boolean(session.pathProgress?.exam);const prep=session.pathProgress?.recommendedModules?.[0]||null;session=null;
      if(!passed&&exam&&prep){state.learnTab="path";setRoute("learn");setTimeout(()=>openLearningPathModule(prep),0);return;}
      if(!passed&&moduleId){const module=pathModuleById(moduleId);if(module?.exam)startLearningPathExam(moduleId);else startLearningPathModule(moduleId);return;}
      state.learnTab="path";setRoute("learn");return;
    }
    if(canReview){const questions=clone(session.wrongQuestions);startReviewSession(questions);return;}
    const mode=session.mode;
    if(session.trainingList?.id){startTrainingListSession(session.trainingList.id,mode,session.config);return;}
    if(["effectiveness","multiplier","impact","pokemon"].includes(mode)){startSession(mode);return;}
    if(mode==="weak"){launchSmartTraining(buildSmartTrainingPlan());return;}
    if(mode==="problem"&&session.problemPlan?.patternKey){const pattern=errorPatternByKey(session.problemPlan.patternKey);if(pattern){launchProblemTraining(buildProblemTrainingPlan(pattern));return;}}
    if(mode==="daily"||mode==="review"||mode==="problem"){
      state.config.effectiveness={...state.config.effectiveness,length:10};
      startSession("effectiveness");
      return;
    }
    setRoute("train");
  }

  function summaryScoreMarkup(rate,total) {
    const exam=Boolean(session?.mode==="path"&&session.pathProgress?.exam);
    return exam
      ? `<div class="summary-score exam motion-summary-score"><strong>${rate}%</strong><small>${t("summary.answers",{correct:session.correct,total})}</small></div>`
      : `<div class="summary-score answers motion-summary-score"><strong><span>${session.correct}</span><span aria-hidden="true">/</span><span>${total}</span></strong><small>${t("cleanup2.correctAnswers")}</small></div>`;
  }

  function summaryXpMarkup(xpEarned,levelInfo,didLevelUp,nextReward) {
    const nearReward=nextReward&&nextReward.xpRemaining<=250;
    const nearRewardVisual=nearReward?(rewardVisualMarkup(nextReward.items[0],"compact")||`<span class="reward-visual reward-title compact" aria-hidden="true">✦</span>`):"";
    const levelText=didLevelUp?t("summary.levelReached",{level:levelInfo.current.level}):t("cleanup2.levelLabel",{level:levelInfo.current.level});
    return `<section class="summary-xp-card ${didLevelUp?"level-up":"compact"}">
      <div class="summary-xp-badge">${didLevelUp?"↑":"XP"}</div>
      <div class="summary-xp-content">
        <div class="summary-xp-heading"><span><small>${t("summary.xpEarned")}</small><strong>+${Math.max(0,xpEarned)} XP</strong></span><b>${escapeHtml(levelText)}</b></div>
        <div class="summary-xp-track" aria-label="${levelInfo.progress}%"><i style="width:${levelInfo.progress}%"></i></div>
        ${nearReward?`<div class="summary-near-reward">${nearRewardVisual}<span><small>${t("cleanup2.nextReachableGoal")}</small><strong>${t("rewards.xpToReward",{count:nextReward.xpRemaining})}</strong><em>${escapeHtml(rewardHeadline(nextReward))}</em></span></div>`:""}
      </div>
    </section>`;
  }

  function buildSummaryContext() {
    const total=session.answers.length;
    const rate=percent(session.correct,total);
    const xpEarned=state.stats.xp-session.startXp;
    const wrongTypes=Object.entries(session.wrongTypes).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const canReview=session.mode!=="review"&&session.wrongQuestions.length>0;
    const reviewComplete=session.mode==="review"&&session.reviewPending.length===0;
    const verdict=summaryVerdict(rate);
    const visual=modeVisual(session.mode);
    const duration=Math.max(1,Number(session.duration||Math.round((Date.now()-session.startedAt)/1000)));
    const levelInfo=getLevelInfo();
    const gainedLevels=session.levelUps||[];
    const unlockedItems=uniqueRewardItems(gainedLevels.flatMap(levelUnlocksAt));
    const unlockCount=unlockedItems.length;
    const didLevelUp=gainedLevels.length>0;
    const nextReward=nextLevelRewardInfo(levelInfo.current.level);
    const momentum=momentumInfo(canReview,rate);
    const comparison=improvementCardMarkup(rate,duration,total);
    const dailyGoal=dailyGoalInfo();
    const wrongFocus=wrongTypes.length?`<section class="summary-focus-card compact"><div><p class="quiz-kicker">${t("summary.nextFocus")}</p><h2>${t("summary.focus")}</h2><p>${t("summary.thisSession")}</p></div><div class="summary-focus-types">${wrongTypes.map(([type,count])=>`<span>${typeChip(type)}<strong>${count}×</strong></span>`).join("")}</div></section>`:"";
    return { total,rate,xpEarned,canReview,reviewComplete,verdict,visual,duration,levelInfo,unlockedItems,unlockCount,didLevelUp,nextReward,momentum,comparison,dailyGoal,wrongFocus };
  }

  function renderSummary() {
    if(!session){setRoute("home");return;}
    const { total,rate,xpEarned,canReview,reviewComplete,verdict,visual,duration,levelInfo,unlockedItems,unlockCount,didLevelUp,nextReward,momentum,comparison,dailyGoal,wrongFocus }=buildSummaryContext();

    view.innerHTML=`<section class="summary-shell cleanup-summary visual-refresh-summary">
      <section class="summary-hero-card">
        <div class="summary-mode-pill"><span>${visual.icon}</span><strong>${escapeHtml(sessionModeName())}</strong></div>
        <div class="summary-hero-grid">
          <div class="summary-verdict"><span class="summary-verdict-icon">${verdict.icon}</span><p class="quiz-kicker">${t("summary.kicker")}</p><h1>${escapeHtml(verdict.title)}</h1><p>${reviewComplete?t("summary.reviewComplete"):verdict.text}</p></div>
          ${summaryScoreMarkup(rate,total)}
        </div>
      </section>

      ${smartLearningSummaryMarkup()}
      ${problemTrainingSummaryMarkup()}
      ${learningPathSummaryMarkup()}
      ${adaptiveSessionSummaryMarkup()}
      ${comparison}
      ${summaryXpMarkup(xpEarned,levelInfo,didLevelUp,nextReward)}

      <section class="summary-daily-goal-card ${dailyGoal.completed ? "is-complete" : ""}" style="--summary-daily-progress:${dailyGoal.percent}%">
        <span aria-hidden="true">${dailyGoal.completed ? "🔥" : "◎"}</span>
        <div><small>${t("daily.title")}</small><strong>${dailyGoal.completed ? tp("daily.completedTextOne", "daily.completedText", dailyGoal.streak, { streak: dailyGoal.streak }) : t("daily.progressText", { progress: dailyGoal.progress, target: dailyGoal.target })}</strong><em>${dailyGoal.completed ? t("daily.doneToday") : tp("daily.remainingOne", "daily.remaining", dailyGoal.remaining)}</em><i><b></b></i></div>
      </section>

      ${unlockCount?`<section class="summary-unlock-card"><div class="summary-unlock-heading"><span aria-hidden="true">✦</span><div><p class="quiz-kicker">${t("summary.levelUp")}</p><h2>${t("rewards.newTitle")}</h2><p>${t("rewards.newText",{count:unlockCount})}</p></div><button id="openUnlockedRewards" class="secondary-button">${t("rewards.open")}</button></div><div class="reward-list-grid">${rewardListMarkup(unlockedItems)}</div></section>`:""}

      <details class="summary-secondary-details">
        <summary><span><strong>${t("summary.details")}</strong><small>${t("summary.detailsHint")}</small></span><i aria-hidden="true">⌄</i></summary>
        <section class="summary-metric-grid">
          <article><small>${t("summary.duration")}</small><strong>${formatDuration(duration)}</strong></article>
          <article><small>${t("summary.bestCombo")}</small><strong>×${Math.max(0,Number(session.bestCombo||0))}</strong></article>
          <article><small>${t("summary.errors")}</small><strong>${session.wrongQuestions.length}</strong></article>
          <article><small>${t("profile.accuracy")}</small><strong>${rate}%</strong></article>
        </section>
        ${wrongFocus}
      </details>

      <section class="summary-momentum-card ${momentum.kind}">
        <span class="summary-momentum-icon" aria-hidden="true">${momentum.icon}</span>
        <div class="summary-momentum-copy"><small>${t("momentum.kicker")}</small><strong>${escapeHtml(momentum.title)}</strong><p>${escapeHtml(momentum.text)}</p></div>
        <div class="summary-momentum-actions"><button id="continueMomentum" class="primary-button">${escapeHtml(momentum.button)}</button><button id="goHome" class="ghost-button">${t("momentum.finishToday")}</button></div>
      </section>
    </section>`;
    if(didLevelUp&&!session.rewardCelebrated){
      session.rewardCelebrated=true;
      haptic("level");
      const firstUnlock=unlockedItems[0];
      const unlockText=firstUnlock?(unlockCount>1?t("toast.unlockSpecific",{name:cosmeticName(firstUnlock),count:unlockCount-1}):t("toast.unlockOne",{name:cosmeticName(firstUnlock)})):t(levelInfo.current.key);
      enqueueToast("⬆",t("toast.level",{level:levelInfo.current.level}),unlockText,"level");
    }
    document.getElementById("openUnlockedRewards")?.addEventListener("click",openProfileCustomizer);
    document.getElementById("continueMomentum")?.addEventListener("click",()=>startMomentumSession(canReview));
    document.getElementById("goHome").addEventListener("click",()=>{session=null;setRoute("home");});
  }

  function renderKnowledgePage() {
    view.innerHTML=`<section class="learn-page knowledge-route-page">
      <section class="learn-workspace panel knowledge-route-workspace"><div id="learnContent"></div></section>
    </section>`;
    renderKnowledge();
  }

  function flashcardItems(kind) {
    const safeKind=QuizmonFlashcards.normalizeKind(kind);
    if(safeKind==="types")return TYPES;
    if(safeKind==="pokemon")return QuizmonKnowledgeData.POKEMON;
    if(safeKind==="moves")return QuizmonKnowledgeContent.MOVES;
    if(safeKind==="abilities")return QuizmonKnowledgeContent.ABILITIES;
    return QuizmonKnowledgeContent.ITEMS;
  }

  function flashcardKindIcon(kind) {
    if(kind==="types")return TYPE_META.psychic.icon;
    if(kind==="pokemon")return iconSvg("pokemon");
    if(kind==="moves")return iconSvg("evolution");
    if(kind==="abilities")return iconSvg("battle");
    return iconSvg("item");
  }

  function flashcardKindName(kind) { return t(`flashcards.kind.${kind}`); }

  function flashcardLearningStateOptions() {
    return {validKeys:new Set([
      ...TYPES.map(type=>`types:${type}`),
      ...QuizmonKnowledgeData.POKEMON.map(item=>`pokemon:${item.id}`),
      ...QuizmonKnowledgeContent.MOVES.map(item=>`moves:${item.id}`),
      ...QuizmonKnowledgeContent.ABILITIES.map(item=>`abilities:${item.id}`),
      ...QuizmonKnowledgeContent.ITEMS.map(item=>`items:${item.id}`)
    ])};
  }

  function flashcardResolveReviewEntry(entry) {
    if(!entry)return null;
    if(entry.kind==="types")return TYPES.includes(String(entry.id))?String(entry.id):null;
    if(entry.kind==="pokemon")return QuizmonKnowledgeData.BY_ID.get(Number(entry.id))||null;
    if(entry.kind==="moves")return QuizmonKnowledgeContent.MOVE_BY_ID.get(Number(entry.id))||null;
    if(entry.kind==="abilities")return QuizmonKnowledgeContent.ABILITY_BY_ID.get(Number(entry.id))||null;
    if(entry.kind==="items")return QuizmonKnowledgeContent.ITEM_BY_ID.get(Number(entry.id))||null;
    return null;
  }

  function flashcardReviewItems(kind) {
    state.flashcards=QuizmonFlashcards.sanitizeLearningState(state.flashcards,flashcardLearningStateOptions());
    return state.flashcards.review.filter(entry=>entry.kind===kind).map(flashcardResolveReviewEntry).filter(Boolean);
  }

  function flashcardWeakTypes() {
    const profile=getLearningProfile();
    const needs=(profile.needs||[]).map(area=>area.type).filter(type=>TYPES.includes(type));
    const legacy=TYPES.filter(type=>state.stats.types[type].total>=3)
      .sort((a,b)=>percent(state.stats.types[a].correct,state.stats.types[a].total)-percent(state.stats.types[b].correct,state.stats.types[b].total))
      .filter(type=>percent(state.stats.types[type].correct,state.stats.types[type].total)<75);
    return unique([...needs,...legacy]).slice(0,8);
  }

  function flashcardWeakPokemon() {
    const weakTypes=flashcardWeakTypes();
    if(!weakTypes.length)return [];
    return QuizmonKnowledgeData.POKEMON.filter(item=>item.types.some(type=>weakTypes.includes(type)));
  }

  function flashcardFavoriteItems(kind) {
    if(kind==="types")return favoriteTypeEntries().map(entry=>entry.type).filter(type=>TYPES.includes(type));
    if(kind==="pokemon")return favoritePokemonEntries().map(entry=>QuizmonKnowledgeData.BY_ID.get(Number(entry.id))).filter(Boolean);
    return [];
  }

  function flashcardListItems(kind,listId) {
    const list=trainingLists().find(item=>item.id===listId&&item.kind===kind);
    if(!list)return [];
    if(kind==="types")return list.entries.filter(type=>TYPES.includes(type));
    return list.entries.map(id=>QuizmonKnowledgeData.BY_ID.get(Number(id))).filter(Boolean);
  }

  function flashcardSourceOptions(kind) {
    const safeKind=QuizmonFlashcards.normalizeKind(kind);
    const options=[{id:"all",label:t("flashcards.sourceAll"),text:t("flashcards.sourceTextAll"),icon:flashcardKindIcon(safeKind)}];
    const favorites=flashcardFavoriteItems(safeKind);
    if(favorites.length)options.push({id:"favorites",label:t("flashcards.sourceFavorites"),text:t("flashcards.sourceTextFavorites",{count:favorites.length}),icon:"♥"});
    if(safeKind==="types"){
      const weak=flashcardWeakTypes();
      if(weak.length)options.push({id:"weak",label:t("flashcards.sourceWeakTypes"),text:t("flashcards.sourceTextWeakTypes",{count:weak.length}),icon:"◎"});
    }else if(safeKind==="pokemon"){
      const weak=flashcardWeakPokemon();
      if(weak.length)options.push({id:"weak",label:t("flashcards.sourceWeakPokemon"),text:t("flashcards.sourceTextWeakPokemon",{count:weak.length}),icon:"◎"});
    }
    const review=flashcardReviewItems(safeKind);
    if(review.length)options.push({id:"review",label:t("flashcards.sourceReview"),text:t("flashcards.sourceTextReview",{count:review.length}),icon:"↻"});
    trainingLists().filter(list=>list.kind===safeKind&&list.entries.length).forEach(list=>options.push({id:`list:${list.id}`,label:list.name,text:t("flashcards.sourceTextList",{count:list.entries.length}),icon:"☷"}));
    return options;
  }

  function flashcardSourceItems(kind,sourceId=flashcardSetupSource,generation=flashcardSetupGeneration) {
    const safeKind=QuizmonFlashcards.normalizeKind(kind);
    let items;
    if(sourceId==="favorites")items=flashcardFavoriteItems(safeKind);
    else if(sourceId==="weak")items=safeKind==="types"?flashcardWeakTypes():safeKind==="pokemon"?flashcardWeakPokemon():[];
    else if(sourceId==="review")items=flashcardReviewItems(safeKind);
    else if(String(sourceId).startsWith("list:"))items=flashcardListItems(safeKind,String(sourceId).slice(5));
    else items=flashcardItems(safeKind);
    const selectedGeneration=QuizmonKnowledgeFilter.normalizeGeneration(generation);
    if(selectedGeneration&&safeKind!=="types")items=items.filter(item=>Number(item?.generation)===selectedGeneration);
    return items;
  }

  function flashcardSelectedSource(kind) {
    const options=flashcardSourceOptions(kind);
    let selected=options.find(option=>option.id===flashcardSetupSource);
    if(!selected){flashcardSetupSource="all";selected=options[0];}
    return {options,selected};
  }

  function flashcardPersonalSourceCount() {
    return QuizmonFlashcards.KINDS.reduce((sum,kind)=>sum+Math.max(0,flashcardSourceOptions(kind).length-1),0);
  }

  function flashcardSetupMarkup() {
    const selectedKind=QuizmonFlashcards.normalizeKind(flashcardSetupKind);
    const selectedCount=QuizmonFlashcards.normalizeCount(flashcardSetupCount);
    const {options:sourceOptions,selected:selectedSource}=flashcardSelectedSource(selectedKind);
    const available=flashcardSourceItems(selectedKind,selectedSource.id,flashcardSetupGeneration).length;
    const planned=selectedCount==="all"?available:Math.min(Number(selectedCount),available);
    const generationDisabled=selectedKind==="types";
    const generationValue=generationDisabled?"all":String(QuizmonKnowledgeFilter.normalizeGeneration(flashcardSetupGeneration)||"all");
    const generationMarkup=generationDisabled?"":`<section class="flashcards-setup-section flashcards-generation-section" aria-labelledby="flashcardGenerationTitle">
        <div class="flashcards-section-heading"><div><small>${t("flashcards.stepThree")}</small><h3 id="flashcardGenerationTitle">${t("flashcards.chooseGeneration")}</h3></div><span>${generationValue==="all"?"∞":generationValue}</span></div>
        <label class="flashcard-source-select"><span>${t("flashcards.generationLabel")}</span><select data-flashcard-generation><option value="all" ${generationValue==="all"?"selected":""}>${escapeHtml(t("knowledge.generationFilter.all"))}</option>${QuizmonKnowledgeFilter.GENERATIONS.map(generation=>`<option value="${generation}" ${String(generation)===generationValue?"selected":""}>${escapeHtml(t("knowledge.generationFilter.option",{generation}))}</option>`).join("")}</select></label>
        <p class="flashcard-generation-note">${t("flashcards.generationNote")}</p>
      </section>`;
    return `<section class="flashcards-setup visual-refresh-flashcards-setup" aria-labelledby="flashcardsSetupTitle">
      <section class="flashcards-intro-card">
        <span aria-hidden="true">▤</span>
        <div><p class="quiz-kicker">${t("flashcards.kicker")}</p><h3 id="flashcardsSetupTitle">${t("flashcards.setupTitle")}</h3><p>${t("flashcards.setupTextPersonal")}</p></div>
      </section>
      <section class="flashcards-setup-section" aria-labelledby="flashcardKindTitle">
        <div class="flashcards-section-heading"><div><small>${t("flashcards.stepOne")}</small><h3 id="flashcardKindTitle">${t("flashcards.chooseKind")}</h3></div><span>${QuizmonFlashcards.KINDS.length}</span></div>
        <div class="flashcard-kind-grid">${QuizmonFlashcards.KINDS.map(kind=>{
          const selected=kind===selectedKind;
          return `<button type="button" class="flashcard-kind-card ${selected?"selected":""}" data-flashcard-kind="${kind}" aria-pressed="${selected}">
            <span class="flashcard-kind-icon" aria-hidden="true">${flashcardKindIcon(kind)}</span>
            <span><small>${t("flashcards.cardCount",{count:flashcardItems(kind).length})}</small><strong>${escapeHtml(flashcardKindName(kind))}</strong><p>${escapeHtml(t(`flashcards.kindText.${kind}`))}</p></span>
            <i aria-hidden="true">${selected?"✓":"›"}</i>
          </button>`;
        }).join("")}</div>
      </section>
      <section class="flashcards-setup-section flashcards-source-section" aria-labelledby="flashcardSourceTitle">
        <div class="flashcards-section-heading"><div><small>${t("flashcards.stepTwo")}</small><h3 id="flashcardSourceTitle">${t("flashcards.chooseSource")}</h3></div><span>${sourceOptions.length}</span></div>
        <label class="flashcard-source-select"><span>${t("flashcards.sourceLabel")}</span><select data-flashcard-source>${sourceOptions.map(option=>`<option value="${escapeHtml(option.id)}" ${option.id===selectedSource.id?"selected":""}>${escapeHtml(option.label)}</option>`).join("")}</select></label>
        <section class="flashcard-source-preview"><span aria-hidden="true">${selectedSource.icon}</span><div><small>${t("flashcards.personalSource")}</small><strong>${escapeHtml(selectedSource.label)}</strong><p>${escapeHtml(selectedSource.text)}</p></div><b>${available}</b></section>
      </section>
      ${generationMarkup}
      <section class="flashcards-setup-section flashcards-count-section" aria-labelledby="flashcardCountTitle">
        <div class="flashcards-section-heading"><div><small>${t(generationDisabled?"flashcards.stepThree":"flashcards.stepFour")}</small><h3 id="flashcardCountTitle">${t("flashcards.chooseCount")}</h3></div><span>${planned}</span></div>
        <div class="flashcard-count-options" role="group" aria-label="${escapeHtml(t("flashcards.chooseCount"))}">${QuizmonFlashcards.COUNT_OPTIONS.map(value=>{
          const selected=String(value)===String(selectedCount);
          const label=value==="all"?t("flashcards.allCards"):t("flashcards.countOption",{count:value});
          return `<button type="button" class="${selected?"selected":""}" data-flashcard-count="${value}" aria-pressed="${selected}"><strong>${value==="all"?"∞":value}</strong><span>${escapeHtml(label)}</span></button>`;
        }).join("")}</div>
        <section class="flashcard-start-summary">
          <span aria-hidden="true">${flashcardKindIcon(selectedKind)}</span>
          <div><small>${t("flashcards.readyKicker")}</small><strong>${escapeHtml(selectedSource.label)}</strong><p>${available?t("flashcards.readyTextPersonal",{count:planned,kind:flashcardKindName(selectedKind)}):t("flashcards.noCardsForSelection")}</p></div>
          <button type="button" class="primary-button" data-flashcard-start ${available?"":"disabled"}>${t("flashcards.start")}</button>
        </section>
      </section>
      <p class="flashcards-offline-note"><span aria-hidden="true">○</span>${t("flashcards.selfAssessmentNote")}</p>
    </section>`;
  }

  function renderFlashcardSetup() {
    const root=document.getElementById("learnContent");
    if(!root)return;
    root.innerHTML=flashcardSetupMarkup();
    root.querySelectorAll("[data-flashcard-kind]").forEach(button=>button.addEventListener("click",()=>{flashcardSetupKind=QuizmonFlashcards.normalizeKind(button.dataset.flashcardKind);flashcardSetupSource="all";renderFlashcardSetup();}));
    root.querySelector("[data-flashcard-source]")?.addEventListener("change",event=>{flashcardSetupSource=String(event.target.value||"all");renderFlashcardSetup();});
    root.querySelector("[data-flashcard-generation]")?.addEventListener("change",event=>{flashcardSetupGeneration=QuizmonKnowledgeFilter.normalizeGeneration(event.target.value)||"all";renderFlashcardSetup();});
    root.querySelectorAll("[data-flashcard-count]").forEach(button=>button.addEventListener("click",()=>{flashcardSetupCount=QuizmonFlashcards.normalizeCount(button.dataset.flashcardCount);renderFlashcardSetup();}));
    root.querySelector("[data-flashcard-start]")?.addEventListener("click",startFlashcardSession);
  }

  function startFlashcardSession(options={}) {
    const kind=QuizmonFlashcards.normalizeKind(options.kind||flashcardSetupKind);
    const sourceId=String(options.sourceId||flashcardSetupSource||"all");
    const generation=options.generation??flashcardSetupGeneration;
    const count=options.count??flashcardSetupCount;
    const sourceOptions=flashcardSourceOptions(kind);
    const source=sourceOptions.find(item=>item.id===sourceId)||sourceOptions[0];
    const items=flashcardSourceItems(kind,source.id,generation);
    if(!items.length){enqueueToast("!",t("flashcards.noCardsTitle"),t("flashcards.noCardsForSelection"),"info");return;}
    flashcardSetupKind=kind;flashcardSetupSource=source.id;flashcardSetupGeneration=generation;flashcardSetupCount=count;
    flashcardSession=QuizmonFlashcards.createSession(items,{kind,count,sourceId:source.id,sourceLabel:source.label,generation});
    haptic("selection");
    renderFlashcards();
  }

  function flashcardTypeGroups(type) {
    return {
      strong:TYPES.filter(defender=>(TYPE_CHART[type]?.[defender]??1)===2),
      weak:TYPES.filter(attacker=>(TYPE_CHART[attacker]?.[type]??1)===2),
      resists:TYPES.filter(attacker=>(TYPE_CHART[attacker]?.[type]??1)===.5),
      immune:TYPES.filter(attacker=>(TYPE_CHART[attacker]?.[type]??1)===0)
    };
  }

  function flashcardTypeList(multiplier,label,types) {
    return `<section class="flashcard-fact-group"><small><b>${escapeHtml(multiplier)}</b><span>${escapeHtml(label)}</span></small><div>${types.length?types.map(type=>typeChip(type,"small")).join(""):`<span class="flashcard-none">${t("flashcards.none")}</span>`}</div></section>`;
  }

  function flashcardFrontMarkup(kind,item) {
    if(kind==="types")return `<div class="flashcard-front-visual type" style="--flashcard-accent:${TYPE_META[item]?.color||"var(--primary)"}"><span>${TYPE_META[item]?.icon||"◆"}</span></div><small>${t("flashcards.frontLabel")}</small><h3>${escapeHtml(typeLabel(item))}</h3><p>${t("flashcards.typePrompt")}</p>`;
    if(kind==="pokemon")return `<div class="flashcard-front-visual pokemon"><img src="${escapeHtml(knowledgeArtwork(item))}" alt=""></div><small>${t("flashcards.frontLabel")}</small><h3>${escapeHtml(knowledgePokemonName(item))}</h3><p>#${String(item.id).padStart(4,"0")}</p>`;
    if(kind==="moves")return `<div class="flashcard-front-visual move" style="--flashcard-accent:${TYPE_META[item.type]?.color||"var(--primary)"}"><span>${TYPE_META[item.type]?.icon||"↗"}</span></div><small>${t("flashcards.frontLabel")}</small><h3>${escapeHtml(knowledgeEntryName(item))}</h3><p>${escapeHtml(typeLabel(item.type))}</p>`;
    if(kind==="abilities")return `<div class="flashcard-front-visual ability"><span>✦</span></div><small>${t("flashcards.frontLabel")}</small><h3>${escapeHtml(knowledgeEntryName(item))}</h3><p>${t("knowledge.generation",{generation:item.generation})}</p>`;
    return `<div class="flashcard-front-visual item"><img src="${escapeHtml(knowledgeItemArtwork(item))}" alt=""></div><small>${t("flashcards.frontLabel")}</small><h3>${escapeHtml(knowledgeEntryName(item))}</h3><p>${escapeHtml(knowledgePocketLabel(item.pocket))}</p>`;
  }

  function flashcardBackMarkup(kind,item) {
    if(kind==="types"){
      const groups=flashcardTypeGroups(item);
      return `<small>${t("flashcards.backLabel")}</small><h3>${escapeHtml(typeLabel(item))}</h3><div class="flashcard-type-facts">${flashcardTypeList("2×",t("learn.strongAgainst"),groups.strong)}${flashcardTypeList("2×",t("learn.vulnerable"),groups.weak)}${flashcardTypeList("½×",t("learn.resists"),groups.resists)}${flashcardTypeList("0×",t("learn.immune"),groups.immune)}</div>`;
    }
    if(kind==="pokemon")return `<small>${t("flashcards.backLabel")}</small><h3>${escapeHtml(knowledgePokemonName(item))}</h3><div class="flashcard-back-tags">${item.types.map(type=>typeChip(type,"small")).join("")}</div><dl class="flashcard-data-list"><div><dt>${t("knowledge.generationLabel")}</dt><dd>${item.generation}</dd></div><div><dt>${t("knowledge.abilities")}</dt><dd>${escapeHtml(item.abilities.map(ability=>state.language==="en"?ability.en:ability.de).join(" · "))}</dd></div></dl>`;
    if(kind==="moves")return `<small>${t("flashcards.backLabel")}</small><h3>${escapeHtml(knowledgeEntryName(item))}</h3><div class="flashcard-back-tags">${typeChip(item.type,"small")}<span>${escapeHtml(knowledgeDamageClassLabel(item.damageClass))}</span></div><dl class="flashcard-stat-grid"><div><dt>${t("knowledge.power")}</dt><dd>${item.power??"—"}</dd></div><div><dt>${t("knowledge.accuracy")}</dt><dd>${item.accuracy==null?"—":`${item.accuracy}%`}</dd></div><div><dt>${t("knowledge.pp")}</dt><dd>${item.pp??"—"}</dd></div></dl><p class="flashcard-effect">${escapeHtml(knowledgeExcerpt(knowledgeEntryEffect(item),260))}</p>`;
    if(kind==="abilities")return `<small>${t("flashcards.backLabel")}</small><h3>${escapeHtml(knowledgeEntryName(item))}</h3><div class="flashcard-back-tags"><span>${t("knowledge.generation",{generation:item.generation})}</span><span>${t("knowledge.pokemonLinked",{count:item.pokemonIds.length})}</span></div><p class="flashcard-effect">${escapeHtml(knowledgeExcerpt(knowledgeEntryEffect(item),300))}</p>`;
    return `<small>${t("flashcards.backLabel")}</small><h3>${escapeHtml(knowledgeEntryName(item))}</h3><div class="flashcard-back-tags"><span>${escapeHtml(knowledgePocketLabel(item.pocket))}</span><span>${t("knowledge.generation",{generation:item.generation})}</span></div><p class="flashcard-effect">${escapeHtml(knowledgeExcerpt(knowledgeEntryEffect(item),300))}</p>`;
  }

  function flashcardToggleReveal() {
    if(!flashcardSession||flashcardSession.phase==="summary")return;
    QuizmonFlashcards.reveal(flashcardSession,!flashcardSession.revealed);
    haptic("selection");
    renderFlashcards();
  }

  function flashcardMove(delta) {
    if(!flashcardSession||flashcardSession.phase==="summary")return;
    QuizmonFlashcards.move(flashcardSession,delta);
    haptic("selection");
    renderFlashcards();
  }

  function flashcardShuffle() {
    if(!flashcardSession||flashcardSession.phase==="summary")return;
    QuizmonFlashcards.reshuffle(flashcardSession);
    haptic("move");
    enqueueToast("↻",t("flashcards.shuffled"),t("flashcards.shuffledText"),"info");
    renderFlashcards();
  }

  function persistFlashcardSession() {
    if(!flashcardSession||flashcardSession.phase!=="summary"||flashcardSession.persisted)return;
    state.flashcards=QuizmonFlashcards.applySessionToLearningState(state.flashcards,flashcardSession,flashcardLearningStateOptions());
    flashcardSession.persisted=true;
    saveState();
  }

  function flashcardRate(rating) {
    if(!flashcardSession?.revealed)return;
    const result=QuizmonFlashcards.rateCurrent(flashcardSession,rating);
    if(!result.accepted)return;
    haptic(rating==="known"?"success":"selection");
    if(result.transition==="review")enqueueToast("↻",t("flashcards.reviewStarts"),t("flashcards.reviewStartsText",{count:result.reviewCount}),"info");
    if(result.transition==="summary")persistFlashcardSession();
    renderFlashcards();
  }

  function flashcardRepeatUnresolved() {
    if(!flashcardSession)return;
    if(!QuizmonFlashcards.repeatUnresolved(flashcardSession))return;
    flashcardSession.persisted=false;
    haptic("move");
    renderFlashcards();
  }

  function flashcardRestart() {
    if(!flashcardSession)return;
    const previous=flashcardSession;
    flashcardSession=QuizmonFlashcards.createSession(previous.initialDeck,{kind:previous.kind,count:"all",sourceId:previous.sourceId,sourceLabel:previous.sourceLabel,generation:previous.generation});
    haptic("selection");
    renderFlashcards();
  }

  function finishFlashcardSession() {
    flashcardSession=null;
    renderLearn();
  }

  function flashcardSummaryMarkup() {
    const result=QuizmonFlashcards.summary(flashcardSession);
    const initiallyOpen=result.unsure+result.unknown;
    const resolved=Math.max(0,initiallyOpen-result.unresolved);
    const resultTitle=result.unresolved?t("flashcards.unresolvedTitle",{count:result.unresolved}):initiallyOpen?t("flashcards.allResolvedTitle"):t("flashcards.perfectTitle");
    const resultText=result.unresolved?t("flashcards.unresolvedText",{count:result.unresolved,resolved}):initiallyOpen?t("flashcards.allResolvedText",{resolved}):t("flashcards.perfectText",{count:result.total});
    return `<section class="flashcard-summary visual-refresh-flashcard-summary" aria-labelledby="flashcardSummaryTitle">
      <section class="flashcard-summary-hero"><span aria-hidden="true">✓</span><div><p class="quiz-kicker">${t("flashcards.summaryKicker")}</p><h3 id="flashcardSummaryTitle">${t("flashcards.summaryTitle")}</h3><p>${t("flashcards.summaryText",{count:result.total,source:flashcardSession.sourceLabel||flashcardKindName(flashcardSession.kind)})}</p></div></section>
      <div class="flashcard-summary-metrics"><article><small>${t("flashcards.ratingKnown")}</small><strong>${result.known}</strong></article><article><small>${t("flashcards.ratingUnsure")}</small><strong>${result.unsure}</strong></article><article><small>${t("flashcards.ratingUnknown")}</small><strong>${result.unknown}</strong></article></div>
      <section class="flashcard-review-result ${result.unresolved?"attention":"complete"}"><span aria-hidden="true">${result.unresolved?"↻":"★"}</span><div><strong>${resultTitle}</strong><p>${resultText}</p></div></section>
      <div class="flashcard-summary-actions">${result.unresolved?`<button type="button" class="primary-button" data-flashcard-repeat>${t("flashcards.repeatUnresolved")}</button>`:""}<button type="button" class="${result.unresolved?"secondary-button":"primary-button"}" data-flashcard-restart>${t("flashcards.newRound")}</button><button type="button" class="ghost-button" data-flashcard-summary-exit>${t("flashcards.backToLearn")}</button></div>
      <p class="flashcards-offline-note"><span aria-hidden="true">i</span>${t("flashcards.summaryStatsNote")}</p>
    </section>`;
  }

  function renderFlashcards() {
    const root=document.getElementById("learnContent");
    if(!root||!flashcardSession?.initialDeck?.length){flashcardSession=null;renderFlashcardSetup();return;}
    if(flashcardSession.phase==="summary"){
      persistFlashcardSession();
      root.innerHTML=flashcardSummaryMarkup();
      root.querySelector("[data-flashcard-repeat]")?.addEventListener("click",flashcardRepeatUnresolved);
      root.querySelector("[data-flashcard-restart]")?.addEventListener("click",flashcardRestart);
      root.querySelector("[data-flashcard-summary-exit]")?.addEventListener("click",finishFlashcardSession);
      return;
    }
    const item=QuizmonFlashcards.current(flashcardSession);
    const progress=QuizmonFlashcards.progress(flashcardSession);
    const kind=flashcardSession.kind;
    const revealed=Boolean(flashcardSession.revealed);
    const rating=QuizmonFlashcards.ratingFor(flashcardSession,item);
    const review=flashcardSession.phase==="review";
    root.innerHTML=`<section class="flashcard-session visual-refresh-flashcard-session ${review?"is-review":""}" aria-labelledby="flashcardSessionTitle">
      <header class="flashcard-session-head">
        <div><p class="quiz-kicker">${review?t("flashcards.reviewKicker",{round:flashcardSession.reviewRound}):t("flashcards.sessionKicker")}</p><h3 id="flashcardSessionTitle">${escapeHtml(flashcardSession.sourceLabel||flashcardKindName(kind))}</h3><p>${t("flashcards.progressText",{current:progress.current,total:progress.total})} · ${escapeHtml(flashcardKindName(kind))}</p></div>
        <div><button type="button" class="secondary-button" data-flashcard-shuffle>↻ ${t("flashcards.shuffle")}</button><button type="button" class="ghost-button" data-flashcard-exit>${t("flashcards.changeSet")}</button></div>
      </header>
      ${review?`<section class="flashcard-review-banner"><span aria-hidden="true">↻</span><div><strong>${t("flashcards.reviewBannerTitle")}</strong><p>${t("flashcards.reviewBannerText")}</p></div></section>`:""}
      <div class="flashcard-progress" aria-label="${escapeHtml(t("flashcards.progressText",{current:progress.current,total:progress.total}))}"><i style="width:${progress.percent}%"></i></div>
      <button type="button" class="flashcard-card ${revealed?"is-revealed":""}" data-flashcard-reveal aria-pressed="${revealed}" aria-label="${escapeHtml(revealed?t("flashcards.showFront"):t("flashcards.reveal"))}">
        <span class="flashcard-card-inner">
          <span class="flashcard-face flashcard-front" aria-hidden="${revealed}">${flashcardFrontMarkup(kind,item)}<em>${t("flashcards.tapToReveal")}</em></span>
          <span class="flashcard-face flashcard-back" aria-hidden="${!revealed}">${flashcardBackMarkup(kind,item)}<em>${t("flashcards.ratePrompt")}</em></span>
        </span>
      </button>
      <p class="flashcard-side-status" aria-live="polite">${revealed?t("flashcards.backVisible"):t("flashcards.frontVisible")}</p>
      ${revealed?`<section class="flashcard-rating" aria-labelledby="flashcardRatingTitle"><div><small>${t("flashcards.selfAssessment")}</small><strong id="flashcardRatingTitle">${t("flashcards.howWellKnown")}</strong></div><div>${QuizmonFlashcards.RATINGS.map(value=>`<button type="button" class="${value} ${rating===value?"selected":""}" data-flashcard-rating="${value}" aria-pressed="${rating===value}"><span aria-hidden="true">${value==="known"?"✓":value==="unsure"?"~":"?"}</span><strong>${t(`flashcards.rating.${value}`)}</strong><small>${t(`flashcards.ratingText.${value}`)}</small></button>`).join("")}</div></section>`:`<p class="flashcard-rating-wait">${t("flashcards.revealBeforeRating")}</p>`}
      <nav class="flashcard-controls" aria-label="${escapeHtml(t("flashcards.controlsLabel"))}">
        <button type="button" class="secondary-button" data-flashcard-previous ${progress.first?"disabled":""}>← ${t("flashcards.previous")}</button>
        <button type="button" class="primary-button" data-flashcard-flip>${revealed?t("flashcards.showFront"):t("flashcards.reveal")}</button>
        <button type="button" class="secondary-button" data-flashcard-next ${!rating||progress.last?"disabled":""}>${t("flashcards.next")} →</button>
      </nav>
      <p class="flashcard-keyboard-hint">${t("flashcards.keyboardHintAssessment")}</p>
    </section>`;
    const card=root.querySelector("[data-flashcard-reveal]");
    card?.addEventListener("click",()=>{if(flashcardSwipeHandled){flashcardSwipeHandled=false;return;}flashcardToggleReveal();});
    card?.addEventListener("pointerdown",event=>{flashcardSwipeStartX=event.clientX;});
    card?.addEventListener("pointerup",event=>{
      const action=QuizmonFlashcards.swipeAction(flashcardSwipeStartX,event.clientX);
      flashcardSwipeStartX=null;
      if(!action)return;
      if(action==="next"&&rating&&!progress.last){flashcardSwipeHandled=true;flashcardMove(1);}
      if(action==="previous"&&!progress.first){flashcardSwipeHandled=true;flashcardMove(-1);}
      setTimeout(()=>{flashcardSwipeHandled=false;},120);
    });
    card?.addEventListener("pointercancel",()=>{flashcardSwipeStartX=null;});
    root.querySelector("[data-flashcard-previous]")?.addEventListener("click",()=>flashcardMove(-1));
    root.querySelector("[data-flashcard-next]")?.addEventListener("click",()=>flashcardMove(1));
    root.querySelector("[data-flashcard-flip]")?.addEventListener("click",flashcardToggleReveal);
    root.querySelectorAll("[data-flashcard-rating]").forEach(button=>button.addEventListener("click",()=>flashcardRate(button.dataset.flashcardRating)));
    root.querySelector("[data-flashcard-shuffle]")?.addEventListener("click",flashcardShuffle);
    root.querySelector("[data-flashcard-exit]")?.addEventListener("click",finishFlashcardSession);
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
    const workspaceTitle = state.learnTab === "lab" ? t("learn.labTitle") : state.learnTab === "cards" ? t("flashcards.title") : t("path.title");
    const flashcardReviewCount=state.learnTab==="cards"?flashcardReviewItems("types").length+flashcardReviewItems("pokemon").length+flashcardReviewItems("moves").length+flashcardReviewItems("abilities").length+flashcardReviewItems("items").length:0;
    const metrics=state.learnTab==="lab"?`<div class="learn-hero-metrics"><article><small>${t("learn.allTypes")}</small><strong>${TYPES.length}</strong></article><article><small>${t("learn.explored")}</small><strong>${explored}</strong></article><article><small>${t("learn.mastered")}</small><strong>${mastered}</strong></article><article><small>${t("learn.knowledgeRate")}</small><strong>${knowledgeRate}%</strong></article></div>`:state.learnTab==="cards"?`<div class="learn-hero-metrics"><article><small>${t("flashcards.sets")}</small><strong>${QuizmonFlashcards.KINDS.length}</strong></article><article><small>${t("flashcards.availableCards")}</small><strong>${flashcardItems("types").length+flashcardItems("pokemon").length+flashcardItems("moves").length+flashcardItems("abilities").length+flashcardItems("items").length}</strong></article><article><small>${t("flashcards.personalSets")}</small><strong>${flashcardPersonalSourceCount()}</strong></article><article><small>${t("flashcards.reviewCards")}</small><strong>${flashcardReviewCount}</strong></article></div>`:"";

    view.innerHTML=`<section class="learn-page visual-refresh-learn ${state.learnTab==="path"?"path-focused":""} ${state.learnTab==="cards"?"flashcards-focused":""}">
      <section class="learn-hero">
        <div class="learn-hero-copy"><p class="quiz-kicker">${t("learn.kicker")}</p><h1>${t("learn.title")}</h1><p>${t("learn.subtitleFocused")}</p></div>
        ${metrics}
      </section>
      <button id="openKnowledgeWorldFromLearn" class="refresh-knowledge-launcher" type="button"><span aria-hidden="true">${iconSvg("knowledge")}</span><span><small>${t("knowledge.kicker")}</small><strong>${t("nav.knowledge")}</strong><em>${t("home.gameKnowledgeDesc")}</em></span><b aria-hidden="true">›</b></button>
      <section class="learn-workspace panel"><div class="learn-workspace-head"><div><p class="quiz-kicker">${t("learn.workspaceKicker")}</p><h2>${workspaceTitle}</h2></div><div class="tabs learn-tabs" role="tablist" style="--tab-count:3"><button class="tab-button ${state.learnTab==="path"?"active":""}" role="tab" aria-selected="${state.learnTab==="path"}" data-learn-tab="path">${t("path.tab")}</button><button class="tab-button ${state.learnTab==="lab"?"active":""}" role="tab" aria-selected="${state.learnTab==="lab"}" data-learn-tab="lab">${t("path.labTab")}</button><button class="tab-button ${state.learnTab==="cards"?"active":""}" role="tab" aria-selected="${state.learnTab==="cards"}" data-learn-tab="cards">${t("flashcards.tab")}</button></div></div><div id="learnContent"></div></section>
    </section>`;
    document.querySelectorAll("[data-learn-tab]").forEach(button=>button.addEventListener("click",()=>{state.learnTab=button.dataset.learnTab;saveState();renderLearn();}));
    document.getElementById("openKnowledgeWorldFromLearn")?.addEventListener("click",()=>{knowledgeView="home";knowledgePokemonId=null;knowledgeContentKind=null;knowledgeContentId=null;learnType=null;knowledgeSearchOpenedResult=false;knowledgeSearchOrigin=null;setRoute("knowledge");});
    if(state.learnTab==="lab")renderTypeLab();
    else if(state.learnTab==="cards"){if(flashcardSession)renderFlashcards();else renderFlashcardSetup();}
    else renderLearningPath();
  }

  function pathImpactSpec(attackingType, defendingTypes, options = [0,.5,1,2]) {
    const correctMultiplier = effectiveness(attackingType, defendingTypes);
    const values = [...new Set([correctMultiplier, ...options])].filter(value => [0,.25,.5,1,2,4].includes(value)).slice(0,6);
    return { kind:"impact", attackingType, defendingTypes:[...defendingTypes], options:shuffle(values), correctMultiplier, focusTypes:unique([attackingType,...defendingTypes]) };
  }

  function pathPokemonSpec(id, display = "both") {
    const source=FALLBACK_POKEMON.find(item=>item.id===Number(id))||FALLBACK_POKEMON[0];
    return {kind:"pokemon",pokemon:formatFallbackPokemon(source),display,focusTypes:[...source.types]};
  }

  function pathPokemonImpactSpec(id, attackingType, options = [0,.25,.5,1,2,4]) {
    const source=FALLBACK_POKEMON.find(item=>item.id===Number(id))||FALLBACK_POKEMON[0];
    return {...pathImpactSpec(attackingType,source.types,options),pokemon:formatFallbackPokemon(source),_pathPokemon:true};
  }

  function pathExamSpec(spec, area, sourceModule) {
    return {...clone(spec),_pathExamArea:area,_pathSourceModule:sourceModule};
  }

  function learningPathModules() {
    return QuizmonLearningPath.createModules({ TYPES, pathImpactSpec, pathPokemonSpec, pathPokemonImpactSpec, pathExamSpec });
  }

  function pathModuleById(id) { return learningPathModules().find(module => module.id === id) || null; }
  function pathModuleProgress(id) { return state.learningPath.modules[id] || sanitizePathModuleProgress({}); }
  function pathModuleDone(id) { const progress=pathModuleProgress(id); return Boolean(progress.completed || progress.validated); }
  function pathModuleUnlocked(module) { return module.prerequisites.every(pathModuleDone); }
  function pathCompletedCount() { return learningPathModules().filter(module => pathModuleDone(module.id)).length; }
  function pathNextModule() { return learningPathModules().find(module => pathModuleUnlocked(module) && !pathModuleDone(module.id)) || null; }
  function pathModuleStatus(module) {
    const progress=pathModuleProgress(module.id);
    if(progress.completed)return "completed";
    if(progress.validated)return "validated";
    if(!pathModuleUnlocked(module))return "locked";
    if(progress.attempts>0)return "retry";
    return "available";
  }
  function pathStatusLabel(status) { return t(`path.status.${status}`); }

  function pathModuleCard(module) {
    const status=pathModuleStatus(module);
    const locked=status==="locked";
    const action=status==="completed"||status==="validated"?t("path.repeat"):status==="retry"?t("path.retry"):t("path.openModule");
    const typePreview=module.exam
      ? `<b class="path-exam-question-count">${t("path.exam.questions",{count:module.questions.length})}</b>`
      : module.types?.length?`${module.types.slice(0,3).map(type=>typeChip(type,"small")).join("")}${module.types.length>3?`<b class="path-more-types">+${module.types.length-3}</b>`:""}`:"";
    return `<button class="path-module-card ${status} ${module.exam?"exam-card":""}" data-path-module="${module.id}" ${locked?"disabled":""}>
      <span class="path-module-icon" aria-hidden="true">${locked?"⌁":status==="completed"||status==="validated"?"✓":module.icon}</span>
      <span class="path-module-copy"><small>${escapeHtml(pathStatusLabel(status))}</small><strong>${escapeHtml(t(module.titleKey))}</strong><em>${escapeHtml(t(module.subtitleKey))}</em><span>${typePreview}</span></span>
      <span class="path-module-result"><i>${locked?t("path.lockedShort"):action}</i><b aria-hidden="true">›</b></span>
    </button>`;
  }

  const PATH_STAGE_ORDER=["basics","types","dual","pokemon","exam"];
  const PATH_STAGE_NUMBERS={basics:"01",types:"02",dual:"03",pokemon:"04",exam:"05"};
  const PATH_STAGE_ICONS={basics:"◎",types:"18",dual:"×",pokemon:"◉",exam:"★"};
  function pathStageModules(stage) { return learningPathModules().filter(module=>module.stage===stage); }
  function pathStageCompleted(stage) { const modules=pathStageModules(stage);return modules.length&&modules.every(module=>pathModuleDone(module.id)); }
  function pathCurrentStage() { return PATH_STAGE_ORDER.find(stage=>!pathStageCompleted(stage))||"complete"; }

  function pathStageMarkup(stage, modules) {
    const completed=modules.filter(module=>pathModuleDone(module.id)).length;
    const current=pathCurrentStage();
    const done=completed===modules.length;
    const active=stage===current||(current==="complete"&&stage==="exam");
    const open=active;
    const status=done?t("cleanup2.stageCompleted"):active?t("cleanup2.stageCurrent"):t("cleanup2.stageLater");
    const progress=active&&!done?t("cleanup2.stageProgress",{completed,total:modules.length}):status;
    return `<details class="path-stage ${stage} ${done?"is-complete":active?"is-current":"is-later"}" ${open?"open":""}>
      <summary class="path-stage-heading"><span>${PATH_STAGE_ICONS[stage]}</span><div><small>${t(`path.stage.${stage}.kicker`)}</small><h3>${t(`path.stage.${stage}.title`)}</h3><p>${t(`path.stage.${stage}.text`)}</p></div><strong>${escapeHtml(progress)}</strong><i aria-hidden="true">⌄</i></summary>
      <div class="path-module-list">${modules.map(pathModuleCard).join("")}</div>
    </details>`;
  }


  function pathStageMapMarkup() {
    const current=pathCurrentStage();
    const stages=[...PATH_STAGE_ORDER];
    return stages.map((stage,index)=>{
      const done=stage!=="exam"&&pathStageCompleted(stage);
      const active=stage===current;
      const item=`<span class="${done?"done":active?"active":""}">${t(`path.stage.${stage}.short`)}</span>`;
      return index<stages.length-1?`${item}<i></i>`:item;
    }).join("");
  }

  function pathExamAreaLabel(key) {
    const module=pathModuleById(key);if(module&&!module.exam)return t(module.titleKey);
    return t(`path.exam.area.${key}`);
  }

  function pathExamAssessment(module) {
    const areaResults=(module.examAreas||[]).map(key=>{const answers=session.answers.filter(answer=>answer.pathExamArea===key);const correct=answers.filter(answer=>answer.correct).length;const rate=percent(correct,answers.length);return {key,correct,total:answers.length,rate,passed:answers.length>0&&rate>=module.examArea};});
    const rate=percent(session.correct,session.answers.length);
    const passed=rate>=module.examOverall&&areaResults.every(area=>area.passed);
    const recommendedModules=unique(areaResults.filter(area=>!area.passed).flatMap(area=>session.answers.filter(answer=>answer.pathExamArea===area.key&&!answer.correct).map(answer=>answer.pathSourceModule).filter(Boolean))).slice(0,4);
    return {rate,passed,areaResults,recommendedModules,requirementsPassed:areaResults.every(area=>area.passed)};
  }

  function pathCompletionStatus() {
    const completion=state.learningPath.completion;if(!completion?.completedAt)return null;
    const days=Math.max(0,Math.floor((Date.now()-new Date(completion.completedAt).getTime())/86400000));
    const profile=getLearningProfile();const concerns=[...profile.needs,...profile.declining].filter(area=>area.total>=3);
    if(concerns.length>=3)return {kind:"attention",icon:"↻",title:t("path.refresh.attentionTitle"),text:t("path.refresh.attentionText"),target:pathModuleForLearningArea(concerns[0])||"exam-final"};
    if(days>=30||concerns.length)return {kind:"refresh",icon:"◎",title:t("path.refresh.refreshTitle"),text:t("path.refresh.refreshText",{days}),target:pathModuleForLearningArea(concerns[0])||"exam-final"};
    return {kind:"secure",icon:"✓",title:t("path.refresh.secureTitle"),text:t("path.refresh.secureText"),target:"exam-final"};
  }

  function pathModuleForLearningArea(area) {
    if(!area)return null;if(area.role==="pokemon"||area.value==="pokemon")return "pokemon-apply";
    if(area.value==="dual"||area.value==="multiplier")return "dual-mastery";
    const type=area.type;if(!type)return null;
    const groups={"types-elements":["fire","water","grass"],"types-energy":["normal","electric","ice"],"types-earth":["fighting","poison","ground"],"types-mind":["flying","psychic","ghost"],"types-material":["bug","rock","steel"],"types-myth":["dragon","dark","fairy"]};
    return Object.entries(groups).find(([,types])=>types.includes(type))?.[0]||null;
  }

  function pathCompletionMarkup() {
    const completion=state.learningPath.completion;if(!completion?.completedAt)return "";
    const status=pathCompletionStatus();const areas=Object.entries(completion.areaRates||{});
    return `<section class="path-completion-card ${status.kind}"><span>${status.icon}</span><div><p class="quiz-kicker">${t("path.completion.kicker")}</p><h3>${t("path.completion.title")}</h3><p>${t("path.completion.text",{rate:completion.finalRate})}</p><div class="path-completion-areas">${areas.map(([key,rate])=>`<b>${escapeHtml(pathExamAreaLabel(key))}<i>${rate}%</i></b>`).join("")}</div><section class="path-refresh-status"><strong>${escapeHtml(status.title)}</strong><p>${escapeHtml(status.text)}</p><button id="startPathRefresh" class="secondary-button">${t("path.refresh.button")}</button></section></div></section>`;
  }

  function renderLearningPath() {
    const root=document.getElementById("learnContent");if(!root)return;
    const modules=learningPathModules();
    const completed=pathCompletedCount();
    const percentDone=Math.round((completed/modules.length)*100);
    const next=pathNextModule();
    const placement=state.learningPath.placement;
    root.innerHTML=`<section class="learning-path-shell cleanup-path visual-refresh-learning-path">
      <section class="path-overview-card" style="--path-progress:${percentDone}%">
        <div class="path-overview-copy"><p class="quiz-kicker">${t("path.kicker")}</p><h2>${t("path.title")}</h2><p>${t("path.subtitle")}</p><span class="path-placement ${placement.source}">${placement.source==="history"?"✓":"◎"} ${t(placement.source==="history"?"path.placementHistory":"path.placementNew")}</span></div>
        <div class="path-progress-summary"><div><strong>${completed}</strong><span>${t("path.ofModules",{total:modules.length})}</span></div><i><b></b></i></div>
      </section>
      <section class="learn-guide-strip path-multiplier-guide"><div class="learn-guide-icon" aria-hidden="true">×</div><div><p class="quiz-kicker">${t("learn.multiplierGuideKicker")}</p><h2>${t("learn.multiplierGuideTitle")}</h2><p>${t("learn.multiplierGuideText")}</p><div class="ruleset-line"><strong>${t("rules.badge")}</strong><span>${t("rules.mainSeries")}</span></div></div><button id="openMultiplierGuide" class="secondary-button">${t("learn.multiplierGuideButton")}</button></section>
      <section class="path-next-card ${next?"":"complete"}"><span aria-hidden="true">${next?next.icon:"✓"}</span><div><small>${t("path.nextKicker")}</small><strong>${next?escapeHtml(t(next.titleKey)):t("path.currentComplete")}</strong><p>${next?escapeHtml(t(next.subtitleKey)):t("path.currentCompleteText")}</p></div>${next?`<button id="continuePath" class="primary-button">${t("path.continue")}</button>`:""}</section>
      <div class="path-stage-map" aria-label="${escapeHtml(t("path.mapLabel"))}">${pathStageMapMarkup()}</div>
      ${PATH_STAGE_ORDER.map(stage=>pathStageMarkup(stage,pathStageModules(stage))).join("")}
      ${pathCompletionMarkup()}
      <div class="path-free-note"><span>↗</span><div><strong>${t("path.freeTitle")}</strong><p>${t("path.freeText")}</p></div></div>
    </section>`;
    root.querySelectorAll("[data-path-module]").forEach(button=>button.addEventListener("click",()=>openLearningPathModule(button.dataset.pathModule)));
    document.getElementById("openMultiplierGuide")?.addEventListener("click",showMultiplierGuide);
    document.getElementById("continuePath")?.addEventListener("click",()=>next&&openLearningPathModule(next.id));
    document.getElementById("startPathRefresh")?.addEventListener("click",()=>{const target=pathCompletionStatus()?.target||"exam-final";openLearningPathModule(target);});
  }

  function pathPokemonVisual(spec, revealTypes = true) {
    return `<div class="path-pokemon-example"><div class="path-pokemon-art"><img src="${escapeHtml(spec.pokemon.image)}" alt="${escapeHtml(spec.pokemon.name)}"><span>?</span></div><div><small>${t("path.pokemonExample")}</small><strong>${escapeHtml(spec.pokemon.name)}</strong>${revealTypes?`<div>${spec.pokemon.types.map(type=>typeChip(type,"small")).join("")}</div>`:`<em>${t("path.typesHidden")}</em>`}</div></div>`;
  }

  function pathExampleMarkup(spec, practice = false) {
    if(spec.kind==="pokemon")return pathPokemonVisual(spec,!practice);
    const defender=spec.pokemon
      ? `<div class="path-pokemon-matchup-defender">${pathPokemonVisual(spec,true)}</div>`
      : `<div><small>${t("onboarding.defender")}</small>${spec.defendingTypes.map(type=>typeChip(type,"large")).join("")}</div>`;
    const result=practice?"?":formatMultiplier(spec.correctMultiplier);
    return `<div class="path-example-matchup"><div><small>${t("onboarding.attacker")}</small>${typeChip(spec.attackingType,"large")}</div><span aria-hidden="true">→</span>${defender}<strong>${result}</strong></div>`;
  }

  function samePathTypeSelection(a,b) {
    const left=unique(a).sort();const right=unique(b).sort();
    return left.length===right.length&&left.every((type,index)=>type===right[index]);
  }

  function pathPokemonPracticeOptions(spec) {
    const correct=[...spec.pokemon.types];
    const first=correct[0];const second=correct[1]||null;
    const other=TYPES.find(type=>!correct.includes(type))||"normal";
    const alternatives=second
      ? [[first],[second],[first,other]]
      : [[other],[first,other],[TYPES.find(type=>type!==first&&type!==other)||"water"]];
    const map=new Map();[correct,...alternatives].forEach(types=>map.set(unique(types).sort().join("+"),unique(types)));
    return shuffle([...map.values()]);
  }

  function pathGuidedPracticeMarkup(module) {
    if(module.demo.kind==="pokemon"){
      return `<section class="path-lesson-section path-guided-practice pokemon"><small>03 · ${t("path.guidedPractice")}</small><strong>${t("path.practicePokemonQuestion")}</strong>${pathExampleMarkup(module.demo,true)}<div class="path-pokemon-practice-options">${pathPokemonPracticeOptions(module.demo).map(types=>`<button data-path-pokemon-answer="${types.join("+")}">${types.map(type=>typeChip(type,"small")).join("")}</button>`).join("")}</div><p id="pathPracticeFeedback">${t("path.practicePokemonPrompt")}</p></section>`;
    }
    return `<section class="path-lesson-section path-guided-practice"><small>03 · ${t("path.guidedPractice")}</small><strong>${t("path.practiceQuestion")}</strong>${pathExampleMarkup(module.demo,true)}<div class="path-practice-options">${module.demo.options.map(value=>`<button data-path-answer="${value}">${formatMultiplier(value)}</button>`).join("")}</div><p id="pathPracticeFeedback">${t("path.practicePrompt")}</p></section>`;
  }

  function pathRelevantReviewArea(module) {
    if(!["dual","pokemon"].includes(module.stage))return null;
    const profile=getLearningProfile();
    const pool=[...profile.needs,...profile.declining,...profile.developing];
    return pool.find(area=>{
      if(module.stage==="dual")return area.value==="dual"||area.value==="multiplier"||Boolean(area.type&&module.types.includes(area.type));
      return area.role==="pokemon"||area.value==="pokemon"||Boolean(area.type&&module.types.includes(area.type));
    })||null;
  }

  function pathPersonalReview(module) {
    const area=pathRelevantReviewArea(module);if(!area)return null;
    const random=seededRandom(`path-review-${module.id}-${area.key}-${state.stats.total}`);
    const coreSignatures=new Set(module.questions.map(questionSignature));
    for(let attempt=0;attempt<16;attempt+=1){
      let spec;
      if(module.stage==="pokemon"){
        const usedIds=new Set(module.questions.filter(item=>item.kind==="pokemon").map(item=>item.pokemon?.id));
        const matching=FALLBACK_POKEMON.filter(item=>(!area.type||item.types.includes(area.type))&&!usedIds.has(item.id));
        const candidates=matching.length?matching:FALLBACK_POKEMON.filter(item=>!usedIds.has(item.id));
        const source=randomItem(candidates.length?candidates:FALLBACK_POKEMON,random);
        spec=pathPokemonSpec(source.id);
      }else{
        const type=area.type||randomItem(module.types,random);
        spec=generateImpactSpec({focusType:type,defense:"dual",difficulty:"medium",random});
      }
      if(!coreSignatures.has(questionSignature(spec)))return {key:area.key,label:area.label,spec};
    }
    return null;
  }

  function buildPathModuleSequence(module) {
    const questions=module.questions.map(clone);
    const review=pathPersonalReview(module);
    if(review){
      const signature=questionSignature(review.spec);
      if(!questions.some(item=>questionSignature(item)===signature))questions[questions.length-1]=review.spec;
      else return {questions,review:null};
    }
    return {questions,review};
  }

  function openLearningPathModule(id) {
    const module=pathModuleById(id);if(!module||!pathModuleUnlocked(module))return;
    if(module.exam){openLearningPathExam(module);return;}
    const progress=pathModuleProgress(id);
    const review=buildPathModuleSequence(module).review;
    setModalMarkup(`<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pathModuleTitle"><section class="modal-card path-module-modal" tabindex="-1">
      <header class="path-module-modal-head"><span>${module.icon}</span><div><p class="quiz-kicker">${t("path.guidedUnit")}</p><h2 id="pathModuleTitle">${escapeHtml(t(module.titleKey))}</h2><p>${escapeHtml(t(module.introKey))}</p></div>${progress.attempts?`<b>${t("path.bestResult",{rate:progress.bestRate})}</b>`:""}</header>
      <section class="path-lesson-section"><small>01 · ${t("path.introduction")}</small><strong>${escapeHtml(t(module.subtitleKey))}</strong><p>${escapeHtml(t(module.introKey))}</p><div class="path-module-types">${module.types.map(type=>typeChip(type)).join("")}</div></section>
      <section class="path-lesson-section"><small>02 · ${t("path.example")}</small>${pathExampleMarkup(module.demo)}<p>${escapeHtml(t(module.exampleKey))}</p><div class="path-memory"><span>💡</span><p>${escapeHtml(t(module.memoryKey))}</p></div></section>
      ${pathGuidedPracticeMarkup(module)}
      ${review?`<section class="path-personal-review"><span>◎</span><div><small>${t("path.personalReviewKicker")}</small><strong>${t("path.personalReviewTitle")}</strong><p>${t("path.personalReviewText",{area:review.label})}</p></div></section>`:""}
      <section class="path-check-preview"><span>04</span><div><small>${t("path.miniCheck")}</small><strong>${t("path.fiveQuestions")}</strong><p>${t("path.passRule")}</p></div></section>
      <div class="modal-actions"><button id="closePathModule" class="secondary-button">${t("common.close")}</button><button id="startPathModule" class="primary-button" disabled>${progress.completed||progress.validated?t("path.repeatCheck"):t("path.startCheck")}</button></div>
    </section></div>`,{initialFocus:module.demo.kind==="pokemon"?"[data-path-pokemon-answer]":"[data-path-answer]"});
    const feedback=document.getElementById("pathPracticeFeedback");
    const start=document.getElementById("startPathModule");
    document.querySelectorAll("[data-path-answer]").forEach(button=>button.addEventListener("click",()=>{
      const value=Number(button.dataset.pathAnswer);const correct=value===module.demo.correctMultiplier;
      document.querySelectorAll("[data-path-answer]").forEach(item=>{const itemValue=Number(item.dataset.pathAnswer);item.classList.toggle("correct",itemValue===module.demo.correctMultiplier);item.classList.toggle("incorrect",item===button&&!correct);item.disabled=true;});
      feedback.textContent=correct?t("path.practiceCorrect"):t("path.practiceWrong",{value:formatMultiplier(module.demo.correctMultiplier)});
      feedback.className=correct?"success":"error";start.disabled=false;haptic(correct?"success":"error");
    }));
    document.querySelectorAll("[data-path-pokemon-answer]").forEach(button=>button.addEventListener("click",()=>{
      const selected=button.dataset.pathPokemonAnswer.split("+").filter(Boolean);const correct=samePathTypeSelection(selected,module.demo.pokemon.types);
      document.querySelectorAll("[data-path-pokemon-answer]").forEach(item=>{const itemTypes=item.dataset.pathPokemonAnswer.split("+").filter(Boolean);item.classList.toggle("correct",samePathTypeSelection(itemTypes,module.demo.pokemon.types));item.classList.toggle("incorrect",item===button&&!correct);item.disabled=true;});
      feedback.textContent=correct?t("path.practiceCorrect"):t("path.practicePokemonWrong",{types:module.demo.pokemon.types.map(typeLabel).join(" + ")});
      feedback.className=correct?"success":"error";start.disabled=false;haptic(correct?"success":"error");
    }));
    document.getElementById("closePathModule")?.addEventListener("click",()=>closeModal());
    start?.addEventListener("click",()=>closeModal(()=>startLearningPathModule(id)));
  }

  function openLearningPathExam(module) {
    const progress=pathModuleProgress(module.id);const areaRows=(module.examAreas||[]).map(key=>`<li><span>${escapeHtml(pathExamAreaLabel(key))}</span><b>${module.examArea}%</b></li>`).join("");
    const previous=progress.attempts?`<section class="path-exam-previous"><span>${progress.completed?"✓":"↻"}</span><div><small>${t("path.exam.previous")}</small><strong>${t("path.exam.previousResult",{rate:progress.lastRate})}</strong><p>${progress.completed?t("path.exam.previousPassed"):t("path.exam.previousRetry")}</p></div></section>`:"";
    setModalMarkup(`<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pathExamTitle"><section class="modal-card path-module-modal path-exam-modal" tabindex="-1"><header class="path-module-modal-head"><span>${module.icon}</span><div><p class="quiz-kicker">${t("path.exam.kicker")}</p><h2 id="pathExamTitle">${escapeHtml(t(module.titleKey))}</h2><p>${escapeHtml(t(module.introKey))}</p></div>${progress.bestRate?`<b>${t("path.bestResult",{rate:progress.bestRate})}</b>`:""}</header>${previous}<section class="path-exam-rules"><div><small>${t("path.exam.scope")}</small><strong>${t("path.exam.questionCount",{count:module.questions.length})}</strong><p>${t("path.exam.noHelp")}</p></div><div><small>${t("path.exam.passTitle")}</small><strong>${t("path.exam.passOverall",{rate:module.examOverall})}</strong><p>${t("path.exam.passAreas",{rate:module.examArea})}</p></div></section><section class="path-exam-areas"><small>${t("path.exam.requiredAreas")}</small><ul>${areaRows}</ul></section><div class="modal-actions"><button id="closePathExam" class="secondary-button">${t("common.close")}</button><button id="startPathExam" class="primary-button">${progress.completed?t("path.exam.repeat"):t("path.exam.start")}</button></div></section></div>`,{initialFocus:"#startPathExam"});
    document.getElementById("closePathExam")?.addEventListener("click",()=>closeModal());
    document.getElementById("startPathExam")?.addEventListener("click",()=>closeModal(()=>startLearningPathExam(module.id)));
  }

  function startLearningPathExam(id) {
    const module=pathModuleById(id);if(!module?.exam||!pathModuleUnlocked(module))return;
    session=newSession("path",{length:module.questions.length,difficulty:module.examKind==="final"?"hard":"medium"},shuffle(module.questions.map(clone)));
    session.pathModuleId=id;session.pathExamId=id;session.pathModuleBefore=clone(pathModuleProgress(id));
    prepareRouteMotion(state.route,"session","forward");state.route="session";saveState();updateNavigation();renderQuestion();
  }

  function startLearningPathModule(id) {
    const module=pathModuleById(id);if(!module||!pathModuleUnlocked(module))return;
    const planned=buildPathModuleSequence(module);
    session=newSession("path",{length:planned.questions.length,difficulty:module.stage==="dual"?"medium":"easy"},shuffle(planned.questions));
    session.pathModuleId=id;
    session.pathModuleBefore=clone(pathModuleProgress(id));
    session.pathReview=planned.review?{key:planned.review.key,label:planned.review.label}:null;
    prepareRouteMotion(state.route,"session","forward");state.route="session";saveState();updateNavigation();renderQuestion();
  }

  function completeLearningPathModule(rate) {
    const moduleId=session?.pathModuleId;if(!LEARNING_PATH_MODULE_IDS.includes(moduleId))return null;
    const module=pathModuleById(moduleId);const progress=pathModuleProgress(moduleId);
    progress.attempts+=1;progress.lastRate=rate;progress.bestRate=Math.max(progress.bestRate,rate);progress.lastAt=new Date().toISOString();
    if(module?.exam){
      const assessment=pathExamAssessment(module);const completedNow=assessment.passed&&!progress.completed;
      progress.lastAreas=Object.fromEntries(assessment.areaResults.map(area=>[area.key,area.rate]));
      progress.bestAreas={...progress.bestAreas,...Object.fromEntries(assessment.areaResults.map(area=>[area.key,Math.max(progress.bestAreas?.[area.key]||0,area.rate)]))};
      progress.recommendedModules=assessment.recommendedModules;progress.lastRequirementsPassed=assessment.requirementsPassed;
      if(assessment.passed){progress.completed=true;progress.completedAt=progress.completedAt||new Date().toISOString();}
      let finalCompleted=false;
      if(module.examKind==="final"){
        state.learningPath.completion.attempts=finiteNonNegative(state.learningPath.completion.attempts)+1;
        if(assessment.passed){state.learningPath.completion={completedAt:state.learningPath.completion.completedAt||new Date().toISOString(),finalRate:assessment.rate,attempts:state.learningPath.completion.attempts,areaRates:Object.fromEntries(assessment.areaResults.map(area=>[area.key,area.rate]))};finalCompleted=true;}
      }
      state.learningPath.modules[moduleId]=progress;
      return {moduleId,exam:true,passed:assessment.passed,completedNow,rate:assessment.rate,areaResults:assessment.areaResults,recommendedModules:assessment.recommendedModules,requirementsPassed:assessment.requirementsPassed,finalCompleted,nextModuleId:pathNextModule()?.id||null};
    }
    const passed=rate>=80;const completedNow=passed&&!progress.completed;
    if(passed){progress.completed=true;progress.completedAt=progress.completedAt||new Date().toISOString();}
    state.learningPath.modules[moduleId]=progress;
    return {moduleId,passed,completedNow,rate,nextModuleId:pathNextModule()?.id||null,reviewKey:session.pathReview?.key||null};
  }

  function learningPathSummaryMarkup() {
    if(session?.mode!=="path"||!session.pathProgress)return "";
    const module=pathModuleById(session.pathProgress.moduleId);if(!module)return "";
    const next=session.pathProgress.nextModuleId?pathModuleById(session.pathProgress.nextModuleId):null;
    if(session.pathProgress.exam){
      const recommended=(session.pathProgress.recommendedModules||[]).map(pathModuleById).filter(Boolean);
      return `<section class="summary-path-card path-exam-summary ${session.pathProgress.passed?"passed":"retry"}"><span>${session.pathProgress.passed?"✓":"↻"}</span><div><p class="quiz-kicker">${t("path.exam.summaryKicker")}</p><h2>${session.pathProgress.passed?t("path.exam.summaryPassed"):t("path.exam.summaryRetry")}</h2><p>${session.pathProgress.passed?t("path.exam.summaryPassedText",{exam:t(module.titleKey)}):t("path.exam.summaryRetryText",{exam:t(module.titleKey)})}</p><div class="path-exam-summary-areas">${session.pathProgress.areaResults.map(area=>`<b class="${area.passed?"passed":"attention"}">${escapeHtml(pathExamAreaLabel(area.key))}<i>${area.rate}%</i></b>`).join("")}</div>${recommended.length?`<section class="path-exam-prep"><strong>${t("path.exam.prepTitle")}</strong><p>${t("path.exam.prepText")}</p><div>${recommended.map(item=>`<b>${escapeHtml(t(item.titleKey))}</b>`).join("")}</div></section>`:""}${session.pathProgress.finalCompleted?`<section class="path-final-celebration"><span>★</span><div><strong>${t("path.exam.finalCompleteTitle")}</strong><p>${t("path.exam.finalCompleteText")}</p></div></section>`:""}</div></section>`;
    }
    return `<section class="summary-path-card ${session.pathProgress.passed?"passed":"retry"}"><span>${session.pathProgress.passed?"✓":"↻"}</span><div><p class="quiz-kicker">${t("path.summaryKicker")}</p><h2>${session.pathProgress.passed?t("path.summaryPassed"):t("path.summaryRetry")}</h2><p>${session.pathProgress.passed?t("path.summaryPassedText",{module:t(module.titleKey)}):t("path.summaryRetryText",{module:t(module.titleKey)})}</p><div>${session.pathProgress.reviewKey?`<b>${t("path.personalReviewCompleted")}</b>`:""}${next?`<b>${t("path.nextModule",{module:t(next.titleKey)})}</b>`:""}</div></div></section>`;
  }

  function multiplierGuideExample(attacker,defenders) {
    const values=defenders.map(defender=>TYPE_CHART[attacker]?.[defender]??1);
    const result=values.reduce((total,value)=>total*value,1);
    return `<article class="multiplier-guide-example"><div class="multiplier-guide-matchup">${typeChip(attacker,"small")}<span aria-hidden="true">→</span><div>${defenders.map(type=>typeChip(type,"small")).join("")}</div></div><div class="multiplier-guide-equation"><span>${values.map(formatMultiplier).join(" × ")}</span><b>=</b><strong>${formatMultiplier(result)}</strong></div><small>${escapeHtml(multiplierMeaning(result))}</small></article>`;
  }

  function showMultiplierGuide() {
    setModalMarkup(`<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="multiplierGuideTitle"><section class="modal-card multiplier-guide-modal" tabindex="-1">
      <div class="multiplier-guide-modal-head"><div class="onboarding-visual">×</div><div><p class="quiz-kicker">${t("learn.multiplierGuideKicker")}</p><h2 id="multiplierGuideTitle">${t("learn.multiplierGuideTitle")}</h2><p>${t("guide.intro")}</p></div></div>
      <section class="guide-direction-card"><div><small>${t("onboarding.attacker")}</small>${typeChip("water","large")}</div><span aria-hidden="true">→</span><div><small>${t("onboarding.defender")}</small>${typeChip("fire","large")}</div><strong>2×</strong></section>
      <section class="guide-section"><h3>${t("guide.singleTitle")}</h3><p>${t("guide.singleText")}</p>${multiplierGuideExample("water",["fire"])}</section>
      <section class="guide-section"><h3>${t("guide.dualTitle")}</h3><p>${t("guide.dualText")}</p><div class="multiplier-guide-examples">${multiplierGuideExample("water",["rock","ground"])}${multiplierGuideExample("fire",["water","dragon"])}${multiplierGuideExample("fire",["grass","dragon"])}${multiplierGuideExample("ground",["flying","steel"])}</div></section>
      <div class="guide-memory-rule"><strong>${t("guide.memoryTitle")}</strong><span>${t("guide.memoryText")}</span></div>
      <div class="ruleset-card"><strong>${t("rules.badge")}</strong><span>${t("rules.mainSeries")}</span></div>
      <div class="actions stack"><button id="closeMultiplierGuide" class="primary-button">${t("common.understood")}</button></div>
    </section></div>`,{initialFocus:"#closeMultiplierGuide"});
    document.getElementById("closeMultiplierGuide")?.addEventListener("click",()=>closeModal());
  }

  function typeKnowledgeLabel(stats){
    if(!stats.total)return t("learn.statusNew");
    const rate=percent(stats.correct,stats.total);
    if(stats.total>=8&&rate>=80)return t("learn.statusMastered");
    if(rate>=65)return t("learn.statusSolid");
    return t("learn.statusPractice");
  }

  function knowledgePokemonById(id) {
    return QuizmonKnowledgeData.BY_ID.get(Number(id)) || null;
  }

  function knowledgePokemonName(item) { return QuizmonKnowledge.name(item, state.language); }
  function knowledgeEntryName(item) { return QuizmonKnowledge.name(item, state.language); }
  function knowledgeEntryEffect(item) { return QuizmonKnowledge.effect(item, state.language); }

  function knowledgeRegionLabel(generation) {
    return t(`knowledge.region.${QuizmonKnowledge.regionKey(generation)}`);
  }

  function knowledgeArtwork(item) { return artworkUrl(item.id); }
  function knowledgeItemArtwork(item) { return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${encodeURIComponent(item.slug)}.png`; }

  function favoritePokemonEntries() { return Array.isArray(state.favorites?.pokemon) ? state.favorites.pokemon : []; }
  function favoriteTypeEntries() { return Array.isArray(state.favorites?.types) ? state.favorites.types : []; }
  function isKnowledgePokemonFavorite(id) { return QuizmonFavorites.isFavorite(favoritePokemonEntries(), "id", Number(id)); }
  function isKnowledgeTypeFavorite(type) { return QuizmonFavorites.isFavorite(favoriteTypeEntries(), "type", String(type)); }

  function syncProfileFavoritesIntoCollection() {
    state.favorites = QuizmonFavorites.sanitize(state.favorites, {
      pokemonIds: new Set(QuizmonKnowledgeData.POKEMON.map(item => item.id)),
      types: new Set(TYPES),
      highlightedPokemonId: state.profile.favoritePokemonId,
      highlightedType: state.profile.favoriteType
    });
  }

  function knowledgeFavoriteButton(kind, id, extraClass = "") {
    const active = kind === "pokemon" ? isKnowledgePokemonFavorite(id) : isKnowledgeTypeFavorite(id);
    const itemName = kind === "pokemon" ? knowledgePokemonName(knowledgePokemonById(id)) : typeLabel(String(id));
    const label = t(active ? "favorites.removeNamed" : "favorites.addNamed", { name:itemName });
    return `<button type="button" class="knowledge-favorite-button ${active ? "active" : ""} ${extraClass}" data-favorite-kind="${kind}" data-favorite-id="${escapeHtml(String(id))}" aria-pressed="${active}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"><span aria-hidden="true">${active ? "♥" : "♡"}</span></button>`;
  }

  function toggleKnowledgeFavorite(kind, id) {
    const now = new Date().toISOString();
    let active = false;
    let clearedProfile = false;
    if (kind === "pokemon") {
      const numericId = Number(id);
      const wasFavorite = isKnowledgePokemonFavorite(numericId);
      state.favorites.pokemon = QuizmonFavorites.toggle(favoritePokemonEntries(), "id", numericId, now);
      active = !wasFavorite;
      if (!active && Number(state.profile.favoritePokemonId) === numericId) {
        state.profile.favoritePokemonId = null;
        clearedProfile = true;
      }
    } else if (kind === "type" && TYPES.includes(String(id))) {
      const type = String(id);
      const wasFavorite = isKnowledgeTypeFavorite(type);
      state.favorites.types = QuizmonFavorites.toggle(favoriteTypeEntries(), "type", type, now);
      active = !wasFavorite;
      if (!active && state.profile.favoriteType === type) {
        state.profile.favoriteType = null;
        clearedProfile = true;
      }
    } else return;
    saveState();
    const title = active ? t("favorites.added") : t("favorites.removed");
    const hint = clearedProfile ? t("favorites.profileCleared") : (active ? t("favorites.addedHint") : t("favorites.removedHint"));
    enqueueToast(active ? "♥" : "♡", title, hint, active ? "success" : "info");
    const top=Math.max(0,window.scrollY||document.documentElement.scrollTop||0);
    if (state.route === "knowledge") { renderKnowledge(); restoreKnowledgeScroll(top); }
    else if (state.route === "learn-detail") { renderLearnDetail(); restoreKnowledgeScroll(top); }
    else if (state.route === "profile") renderProfile();
  }

  function bindKnowledgeFavoriteButtons(root = document) {
    root.querySelectorAll("[data-favorite-kind]").forEach(button => button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      toggleKnowledgeFavorite(button.dataset.favoriteKind, button.dataset.favoriteId);
    }));
  }

  function trainingListSanitizeOptions() {
    return {
      pokemonIds:new Set(QuizmonKnowledgeData.POKEMON.map(item=>item.id)),
      types:new Set(TYPES),
      fallbackName:(kind,index)=>kind==="pokemon"?t("trainingLists.defaultPokemonName",{count:index+1}):t("trainingLists.defaultTypeName",{count:index+1})
    };
  }

  function syncTrainingLists() {
    state.trainingLists=QuizmonTrainingLists.sanitize(state.trainingLists,trainingListSanitizeOptions());
    return state.trainingLists;
  }

  function trainingLists() { return syncTrainingLists().lists; }
  function trainingListById(id) { return QuizmonTrainingLists.get(syncTrainingLists(),String(id)); }
  function trainingListKindForEntry(kind) { return kind==="pokemon"?"pokemon":kind==="type"?"types":null; }
  function trainingListEntryName(kind,id) {
    if(kind==="pokemon")return knowledgePokemonName(knowledgePokemonById(id));
    return typeLabel(String(id));
  }

  function knowledgeTrainingListButton(kind,id,extraClass="") {
    const listKind=trainingListKindForEntry(kind);
    if(!listKind)return"";
    const name=trainingListEntryName(kind,id);
    const label=t("trainingLists.addNamed",{name});
    return `<button type="button" class="knowledge-training-list-button ${extraClass}" data-training-list-kind="${kind}" data-training-list-entry="${escapeHtml(String(id))}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"><span aria-hidden="true">＋</span></button>`;
  }

  function bindKnowledgeTrainingListButtons(root=document) {
    root.querySelectorAll("[data-training-list-kind][data-training-list-entry]").forEach(button=>button.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();
      openTrainingListChooser(button.dataset.trainingListKind,button.dataset.trainingListEntry);
    }));
  }

  function trainingListDraftDirty() {
    return JSON.stringify(trainingListDraft||null)!==JSON.stringify(trainingListDraftOriginal||null);
  }

  function closeTrainingListEditor(backdrop) {
    confirmDiscardChanges(trainingListDraftDirty(),backdrop,()=>{
      trainingListDraft=null;trainingListDraftOriginal=null;trainingListPokemonQuery="";
    });
  }

  function trainingListEntryMarkup(entry,index) {
    if(trainingListDraft.kind==="pokemon"){
      const item=knowledgePokemonById(entry);if(!item)return"";
      return `<li><span class="training-list-entry-visual pokemon"><img loading="lazy" src="${escapeHtml(knowledgeArtwork(item))}" alt=""></span><span><strong>${escapeHtml(knowledgePokemonName(item))}</strong><small>#${String(item.id).padStart(4,"0")} · ${item.types.map(typeLabel).join(" / ")}</small></span><div>${index?`<button type="button" data-list-entry-up="${index}" aria-label="${escapeHtml(t("trainingLists.moveUp"))}">↑</button>`:""}${index<trainingListDraft.entries.length-1?`<button type="button" data-list-entry-down="${index}" aria-label="${escapeHtml(t("trainingLists.moveDown"))}">↓</button>`:""}<button type="button" data-list-entry-remove="${index}" aria-label="${escapeHtml(t("trainingLists.removeEntry"))}">×</button></div></li>`;
    }
    const type=String(entry);
    return `<li><span class="training-list-entry-visual type" style="--entry-type-color:${TYPE_META[type]?.color||"var(--primary)"}">${TYPE_META[type]?.icon||"◆"}</span><span><strong>${escapeHtml(typeLabel(type))}</strong><small>${t("trainingLists.typeEntry")}</small></span><div>${index?`<button type="button" data-list-entry-up="${index}" aria-label="${escapeHtml(t("trainingLists.moveUp"))}">↑</button>`:""}${index<trainingListDraft.entries.length-1?`<button type="button" data-list-entry-down="${index}" aria-label="${escapeHtml(t("trainingLists.moveDown"))}">↓</button>`:""}<button type="button" data-list-entry-remove="${index}" aria-label="${escapeHtml(t("trainingLists.removeEntry"))}">×</button></div></li>`;
  }

  function trainingListAvailableEntriesMarkup() {
    if(trainingListDraft.kind==="types"){
      return `<div class="training-list-type-picker">${TYPES.map(type=>{const active=trainingListDraft.entries.includes(type);return `<button type="button" class="${active?"selected":""}" data-list-entry-toggle="${type}" aria-pressed="${active}">${typeChip(type,"small")}<span>${active?t("trainingLists.included"):t("trainingLists.add")}</span></button>`;}).join("")}</div>`;
    }
    const normalized=QuizmonKnowledgeSearch.normalize(trainingListPokemonQuery);
    const items=QuizmonKnowledgeData.POKEMON.filter(item=>{
      if(!normalized)return true;
      return QuizmonKnowledgeSearch.normalize(`${item.id} ${item.names.de} ${item.names.en}`).includes(normalized);
    }).slice(0,36);
    return `<label class="training-list-pokemon-search"><span>${t("trainingLists.searchPokemon")}</span><input type="search" data-training-list-pokemon-search value="${escapeHtml(trainingListPokemonQuery)}" placeholder="${escapeHtml(t("trainingLists.searchPlaceholder"))}" autocomplete="off"></label><div class="training-list-pokemon-picker">${items.map(item=>{const active=trainingListDraft.entries.includes(item.id);return `<button type="button" class="${active?"selected":""}" data-list-entry-toggle="${item.id}" aria-pressed="${active}"><img loading="lazy" src="${escapeHtml(knowledgeArtwork(item))}" alt=""><span><strong>${escapeHtml(knowledgePokemonName(item))}</strong><small>#${String(item.id).padStart(4,"0")}</small></span><b>${active?"✓":"＋"}</b></button>`;}).join("")}</div>`;
  }

  function renderTrainingListEditorContent() {
    const root=document.querySelector("[data-training-list-editor-content]");
    if(!root||!trainingListDraft)return;
    root.innerHTML=`<section class="training-list-editor-summary"><label><span>${t("trainingLists.nameLabel")}</span><input type="text" maxlength="40" data-training-list-name value="${escapeHtml(trainingListDraft.name)}"></label><div><small>${t("trainingLists.kindLabel")}</small><strong>${t(`trainingLists.kind.${trainingListDraft.kind}`)}</strong><span>${t("trainingLists.entryCount",{count:trainingListDraft.entries.length})}</span></div></section><section class="training-list-editor-columns"><div><div class="training-list-editor-heading"><h3>${t("trainingLists.currentEntries")}</h3><span>${trainingListDraft.entries.length}</span></div>${trainingListDraft.entries.length?`<ol class="training-list-entry-list">${trainingListDraft.entries.map(trainingListEntryMarkup).join("")}</ol>`:`<div class="training-list-editor-empty">${t("trainingLists.editorEmpty")}</div>`}</div><div><div class="training-list-editor-heading"><h3>${t("trainingLists.addEntries")}</h3><span>${trainingListDraft.kind==="types"?TYPES.length:QuizmonKnowledgeData.POKEMON.length}</span></div>${trainingListAvailableEntriesMarkup()}</div></section>`;
    const nameInput=root.querySelector("[data-training-list-name]");
    nameInput?.addEventListener("input",()=>{trainingListDraft.name=nameInput.value;updateTrainingListEditorSaveState();});
    root.querySelector("[data-training-list-pokemon-search]")?.addEventListener("input",event=>{trainingListPokemonQuery=event.target.value;renderTrainingListEditorContent();requestAnimationFrame(()=>{const input=document.querySelector("[data-training-list-pokemon-search]");input?.focus();input?.setSelectionRange(input.value.length,input.value.length);});});
    root.querySelectorAll("[data-list-entry-toggle]").forEach(button=>button.addEventListener("click",()=>{
      const raw=button.dataset.listEntryToggle;
      const value=trainingListDraft.kind==="pokemon"?Number(raw):String(raw);
      if(trainingListDraft.entries.includes(value))trainingListDraft.entries=trainingListDraft.entries.filter(entry=>entry!==value);
      else trainingListDraft.entries.push(value);
      renderTrainingListEditorContent();updateTrainingListEditorSaveState();
    }));
    root.querySelectorAll("[data-list-entry-remove]").forEach(button=>button.addEventListener("click",()=>{trainingListDraft.entries.splice(Number(button.dataset.listEntryRemove),1);renderTrainingListEditorContent();updateTrainingListEditorSaveState();}));
    root.querySelectorAll("[data-list-entry-up]").forEach(button=>button.addEventListener("click",()=>{const index=Number(button.dataset.listEntryUp);[trainingListDraft.entries[index-1],trainingListDraft.entries[index]]=[trainingListDraft.entries[index],trainingListDraft.entries[index-1]];renderTrainingListEditorContent();updateTrainingListEditorSaveState();}));
    root.querySelectorAll("[data-list-entry-down]").forEach(button=>button.addEventListener("click",()=>{const index=Number(button.dataset.listEntryDown);[trainingListDraft.entries[index+1],trainingListDraft.entries[index]]=[trainingListDraft.entries[index],trainingListDraft.entries[index+1]];renderTrainingListEditorContent();updateTrainingListEditorSaveState();}));
    updateTrainingListEditorSaveState();
  }

  function updateTrainingListEditorSaveState() {
    const button=document.querySelector("[data-training-list-save]");
    if(button)button.disabled=!trainingListDraft?.name?.trim()||!trainingListDraftDirty();
  }

  function saveTrainingListDraft() {
    if(!trainingListDraft?.name?.trim())return;
    const existing=trainingLists().filter(list=>list.id!==trainingListDraft.id);
    state.trainingLists=QuizmonTrainingLists.sanitize({lists:[...existing,{...trainingListDraft,name:trainingListDraft.name.trim(),updatedAt:new Date().toISOString()}]},trainingListSanitizeOptions());
    saveState();
    const name=trainingListDraft.name.trim();
    trainingListDraft=null;trainingListDraftOriginal=null;trainingListPokemonQuery="";
    closeModal(()=>{
      if(state.route==="knowledge"&&knowledgeView==="training-lists")renderKnowledgeTrainingLists();
      enqueueToast("✓",t("trainingLists.saved"),t("trainingLists.savedHint",{name}),"success");
    });
  }

  function openTrainingListEditor(listId=null,kind=null,initialEntry=null) {
    const existing=listId?trainingListById(listId):null;
    const date=new Date().toISOString();
    const safeKind=existing?.kind||(kind==="pokemon"?"pokemon":"types");
    const entry=initialEntry==null?null:(safeKind==="pokemon"?Number(initialEntry):String(initialEntry));
    trainingListDraft=existing?clone(existing):{id:`list-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,kind:safeKind,name:safeKind==="pokemon"?t("trainingLists.newPokemonName"):t("trainingLists.newTypeName"),entries:[],createdAt:date,updatedAt:date};
    if(entry!=null&&!trainingListDraft.entries.includes(entry))trainingListDraft.entries.push(entry);
    trainingListDraftOriginal=existing?clone(trainingListDraft):null;trainingListPokemonQuery="";
    setModalMarkup(`<div class="modal-backdrop training-list-editor-backdrop" role="dialog" aria-modal="true" aria-labelledby="trainingListEditorTitle"><section class="modal-card training-list-editor-modal" tabindex="-1"><header><span aria-hidden="true">☷</span><div><p class="quiz-kicker">${t("trainingLists.kicker")}</p><h2 id="trainingListEditorTitle">${existing?t("trainingLists.editTitle"):t("trainingLists.createTitle")}</h2><p>${t("trainingLists.editorText")}</p></div></header><div data-training-list-editor-content></div><div class="modal-actions"><button type="button" class="secondary-button" data-training-list-cancel>${t("common.cancel")}</button><button type="button" class="primary-button" data-training-list-save>${t("common.save")}</button></div></section></div>`,{closeOnBackdrop:false,initialFocus:"[data-training-list-name]"});
    const backdrop=document.querySelector(".training-list-editor-backdrop");
    const context=modalStack.find(entry=>entry.backdrop===backdrop);
    if(context)context.onRequestClose=()=>closeTrainingListEditor(backdrop);
    backdrop.querySelector("[data-training-list-cancel]")?.addEventListener("click",()=>closeTrainingListEditor(backdrop));
    backdrop.querySelector("[data-training-list-save]")?.addEventListener("click",saveTrainingListDraft);
    renderTrainingListEditorContent();
  }

  function addEntryToTrainingList(listId,kind,id) {
    const list=trainingListById(listId);if(!list)return;
    const value=list.kind==="pokemon"?Number(id):String(id);
    const already=QuizmonTrainingLists.contains(list,value);
    state.trainingLists=already?QuizmonTrainingLists.removeEntry(state.trainingLists,list.id,value,trainingListSanitizeOptions()):QuizmonTrainingLists.addEntry(state.trainingLists,list.id,value,trainingListSanitizeOptions());
    saveState();
    enqueueToast(already?"−":"＋",already?t("trainingLists.removedFromList"):t("trainingLists.addedToList"),t("trainingLists.listChangedHint",{name:list.name}),already?"info":"success");
  }

  function openTrainingListChooser(kind,id) {
    const listKind=trainingListKindForEntry(kind);if(!listKind)return;
    const candidates=trainingLists().filter(list=>list.kind===listKind);
    const entryName=trainingListEntryName(kind,id);
    if(!candidates.length){openTrainingListEditor(null,listKind,id);return;}
    setModalMarkup(`<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="trainingListChooserTitle"><section class="modal-card training-list-chooser-modal" tabindex="-1"><header><span aria-hidden="true">☷</span><div><p class="quiz-kicker">${t("trainingLists.kicker")}</p><h2 id="trainingListChooserTitle">${t("trainingLists.chooseList")}</h2><p>${t("trainingLists.chooseListText",{name:entryName})}</p></div></header><div class="training-list-chooser-grid">${candidates.map(list=>{const included=QuizmonTrainingLists.contains(list,listKind==="pokemon"?Number(id):String(id));return `<button type="button" data-list-choice="${escapeHtml(list.id)}" class="${included?"included":""}"><span aria-hidden="true">${list.kind==="pokemon"?iconSvg("pokemon"):iconSvg("list")}</span><span><strong>${escapeHtml(list.name)}</strong><small>${t("trainingLists.entryCount",{count:list.entries.length})}</small></span><b>${included?t("trainingLists.remove"):t("trainingLists.add")}</b></button>`;}).join("")}</div><div class="modal-actions"><button type="button" class="secondary-button" data-list-choice-close>${t("common.close")}</button><button type="button" class="primary-button" data-list-choice-new>${t("trainingLists.createNew")}</button></div></section></div>`,{initialFocus:"[data-list-choice]"});
    document.querySelector("[data-list-choice-close]")?.addEventListener("click",()=>closeModal());
    document.querySelector("[data-list-choice-new]")?.addEventListener("click",()=>closeModal(()=>openTrainingListEditor(null,listKind,id)));
    document.querySelectorAll("[data-list-choice]").forEach(button=>button.addEventListener("click",()=>{addEntryToTrainingList(button.dataset.listChoice,kind,id);closeModal();}));
  }

  function knowledgePokemonCard(item) {
    const name = knowledgePokemonName(item);
    return `<article class="knowledge-pokemon-card-shell">
      <button class="knowledge-pokemon-card" data-knowledge-pokemon="${item.id}" aria-label="${escapeHtml(name)}">
        <span class="knowledge-pokemon-art"><img loading="lazy" src="${escapeHtml(knowledgeArtwork(item))}" alt=""><i>#${String(item.id).padStart(4,"0")}</i></span>
        <span class="knowledge-pokemon-copy"><strong>${escapeHtml(name)}</strong><small>${t("knowledge.generationShort",{generation:item.generation})} · ${escapeHtml(knowledgeRegionLabel(item.generation))}</small><span>${item.types.map(type=>typeChip(type,"small")).join("")}</span></span>
        <span class="knowledge-card-arrow" aria-hidden="true">›</span>
      </button>
      <span class="knowledge-card-actions">${knowledgeFavoriteButton("pokemon",item.id,"card-favorite")}${knowledgeTrainingListButton("pokemon",item.id,"card-training-list")}</span>
    </article>`;
  }

  function knowledgeSectionButton(section, icon, title, text, meta) {
    return `<button class="knowledge-category-card ${section}" data-knowledge-section="${section}">
      <span class="knowledge-category-icon" aria-hidden="true">${icon}</span>
      <span><small>${escapeHtml(meta)}</small><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></span>
      <i aria-hidden="true">›</i>
    </button>`;
  }

  function knowledgeSearchFamilies() {
    if(!knowledgeEvolutionFamiliesCache)knowledgeEvolutionFamiliesCache=QuizmonKnowledge.evolutionFamilies(QuizmonKnowledgeData.POKEMON);
    return knowledgeEvolutionFamiliesCache;
  }

  function knowledgeSearchTypes() {
    return TYPES.map(type=>({
      id:type,
      de:I18N.de[`type.${type}`]||type,
      en:I18N.en[`type.${type}`]||type,
      aliasesDe:[I18N.de[`knowledge.search.typeAlias.${type}`]||""].filter(Boolean),
      aliasesEn:[I18N.en[`knowledge.search.typeAlias.${type}`]||""].filter(Boolean)
    }));
  }

  function knowledgeSelectedGeneration() {
    return QuizmonKnowledgeFilter.normalizeGeneration(knowledgeGenerationFilter);
  }

  function knowledgeGenerationFilterContext() {
    return { regionById: QuizmonKnowledgeWorld.REGION_BY_ID };
  }

  function knowledgeFilteredItems(kind, items) {
    return QuizmonKnowledgeFilter.filter(kind, items, knowledgeGenerationFilter, knowledgeGenerationFilterContext());
  }


  function knowledgeGenerationOptionsMarkup() {
    return [`<option value="all" ${knowledgeSelectedGeneration()?"":"selected"}>${escapeHtml(t("knowledge.generationFilter.all"))}</option>`, ...QuizmonKnowledgeFilter.GENERATIONS.map(generation=>`<option value="${generation}" ${knowledgeSelectedGeneration()===generation?"selected":""}>${escapeHtml(t("knowledge.generationFilter.option",{generation}))}</option>`)].join("");
  }

  function knowledgeGenerationFilterMarkup(compact=false) {
    const selected=knowledgeSelectedGeneration();
    if(compact){
      return `<label class="knowledge-generation-select compact"><span aria-hidden="true">${t("knowledge.generationFilter.short")}</span><span class="sr-only">${t("knowledge.generationFilter.label")}</span><select data-knowledge-generation-filter aria-label="${escapeHtml(t("knowledge.generationFilter.label"))}">${knowledgeGenerationOptionsMarkup()}</select></label>`;
    }
    return `<section class="knowledge-generation-filter" aria-label="${escapeHtml(t("knowledge.generationFilter.label"))}">
      <div><p class="quiz-kicker">${t("knowledge.generationFilter.kicker")}</p><h3>${t("knowledge.generationFilter.title")}</h3><p>${selected?t("knowledge.generationFilter.activeText",{generation:selected}):t("knowledge.generationFilter.allText")}</p><small>${t("knowledge.generationFilter.typeRules")}</small></div>
      <label class="knowledge-generation-select"><span>${t("knowledge.generationFilter.label")}</span><select data-knowledge-generation-filter>${knowledgeGenerationOptionsMarkup()}</select></label>
      ${selected?`<button type="button" class="secondary-button knowledge-generation-reset" data-knowledge-generation-reset>${t("knowledge.generationFilter.reset")}</button>`:""}
    </section>`;
  }

  function setKnowledgeGenerationFilter(value) {
    const selected=QuizmonKnowledgeFilter.normalizeGeneration(value);
    const next=selected||"all";
    if(String(next)===String(knowledgeGenerationFilter))return;
    knowledgeGenerationFilter=next;
    try { localStorage.setItem(KNOWLEDGE_GENERATION_FILTER_KEY,String(next)); } catch {}
    knowledgePokemonPage=0;
    knowledgeContentPage=0;
    knowledgeSearchVisibleCount=KNOWLEDGE_SEARCH_PAGE_SIZE;
    if(state.route==="learn-detail")renderLearnDetail();
    else if(state.route==="knowledge")renderKnowledgePage();
    replaceBrowserHistorySnapshot();
  }

  function bindKnowledgeGenerationFilter(root) {
    root.querySelectorAll("[data-knowledge-generation-filter]").forEach(select=>select.addEventListener("change",()=>setKnowledgeGenerationFilter(select.value)));
    root.querySelectorAll("[data-knowledge-generation-reset]").forEach(button=>button.addEventListener("click",()=>setKnowledgeGenerationFilter("all")));
  }

  function knowledgeFilteredCount(kind, items) {
    return knowledgeFilteredItems(kind, items).length;
  }

  function knowledgeHomeCounts() {
    return {
      types:TYPES.length,
      pokemon:knowledgeFilteredCount("pokemon",QuizmonKnowledgeData.POKEMON),
      moves:knowledgeFilteredCount("move",QuizmonKnowledgeContent.MOVES),
      items:knowledgeFilteredCount("item",QuizmonKnowledgeContent.ITEMS),
      regions:knowledgeFilteredCount("region",QuizmonKnowledgeWorld.REGIONS),
      trainers:knowledgeFilteredCount("trainer",QuizmonKnowledgeWorld.TRAINERS.filter(knowledgeTrainerIsCore)),
      competitive:QuizmonKnowledgeWorld.COMPETITIVE_TOPICS.length
    };
  }

  function knowledgeGenerationEmptyMarkup() {
    const selected=knowledgeSelectedGeneration();
    return `<section class="knowledge-generation-empty"><span aria-hidden="true">⌁</span><div><strong>${t("knowledge.generationFilter.emptyTitle")}</strong><p>${selected?t("knowledge.generationFilter.emptyText",{generation:selected}):t("knowledge.search.emptyText")}</p></div><button type="button" class="secondary-button" data-knowledge-generation-reset>${t("knowledge.generationFilter.reset")}</button></section>`;
  }

  function knowledgeSearchGenerationSuffix() {
    const selected=knowledgeSelectedGeneration();
    return selected?` · ${t("knowledge.generationFilter.option",{generation:selected})}`:"";
  }

  function knowledgeSearchEmptyMarkup() {
    const selected=knowledgeSelectedGeneration();
    return `<section class="knowledge-search-empty"><span aria-hidden="true">⌕</span><div><strong>${t("knowledge.search.emptyTitle")}</strong><p>${selected?t("knowledge.generationFilter.searchEmptyText",{generation:selected}):t("knowledge.search.emptyText")}</p></div></section>`;
  }

  function getKnowledgeSearchIndex() {
    if(knowledgeSearchIndex)return knowledgeSearchIndex;
    knowledgeSearchIndex=QuizmonKnowledgeSearch.buildIndex({
      types:knowledgeSearchTypes(),
      pokemon:QuizmonKnowledgeData.POKEMON,
      moves:QuizmonKnowledgeContent.MOVES,
      abilities:QuizmonKnowledgeContent.ABILITIES,
      items:QuizmonKnowledgeContent.ITEMS,
      evolutions:knowledgeSearchFamilies(),
      regions:QuizmonKnowledgeWorld.REGIONS,
      trainers:QuizmonKnowledgeWorld.TRAINERS.filter(knowledgeTrainerIsCore),
      competitive:QuizmonKnowledgeWorld.COMPETITIVE_TOPICS
    });
    return knowledgeSearchIndex;
  }

  function knowledgeSearchKindLabel(kind) { return t(`knowledge.search.kind.${kind}`); }
  function knowledgeSearchIcon(result) {
    if(result.kind==="type")return TYPE_META[result.id]?.icon||"◉";
    if(result.kind==="pokemon")return "◉";
    if(result.kind==="move")return TYPE_META[QuizmonKnowledgeContent.MOVE_BY_ID.get(Number(result.id))?.type]?.icon||"↗";
    if(result.kind==="ability")return "✦";
    if(result.kind==="item")return "◇";
    if(result.kind==="evolution")return "↗";
    if(result.kind==="region")return "⌘";
    if(result.kind==="trainer")return knowledgeTrainerRoleIcon(knowledgeTrainerById(result.id));
    return knowledgeCompetitiveIcon(knowledgeTopicById(result.id)?.group);
  }

  function knowledgeSearchVisual(result) {
    if(result.kind==="pokemon"){
      const item=knowledgePokemonById(result.id);
      if(item)return {className:"pokemon-art",html:`<img loading="lazy" src="${escapeHtml(knowledgeArtwork(item))}" alt="">`};
    }
    if(result.kind==="item"){
      const item=QuizmonKnowledgeContent.ITEM_BY_ID.get(Number(result.id));
      if(item)return {className:"item-art",html:`<img loading="lazy" data-image-kind="item" src="${escapeHtml(knowledgeItemArtwork(item))}" alt="">`};
    }
    if(result.kind==="evolution"){
      const family=knowledgeSearchFamilies().find(item=>Number(item.id)===Number(result.id));
      if(family){
        return {className:"evolution-art",html:`<span class="knowledge-search-family-art">${family.members.slice(0,3).map(item=>`<img loading="lazy" src="${escapeHtml(knowledgeArtwork(item))}" alt="">`).join("")}</span>`};
      }
    }
    return {className:"",html:knowledgeSearchIcon(result)};
  }

  function knowledgeSearchResultSubtitle(result) {
    if(result.kind==="type")return t("knowledge.search.typeResult");
    if(result.kind==="pokemon"){
      const item=knowledgePokemonById(result.id);if(!item)return "";
      return `${item.types.map(typeLabel).join(" / ")} · ${t("knowledge.generation",{generation:item.generation})}`;
    }
    if(result.kind==="move"){
      const item=QuizmonKnowledgeContent.MOVE_BY_ID.get(Number(result.id));if(!item)return "";
      return `${typeLabel(item.type)} · ${knowledgeDamageClassLabel(item.damageClass)}`;
    }
    if(result.kind==="ability"){
      const item=QuizmonKnowledgeContent.ABILITY_BY_ID.get(Number(result.id));
      return item?t("knowledge.generation",{generation:item.generation}):"";
    }
    if(result.kind==="item"){
      const item=QuizmonKnowledgeContent.ITEM_BY_ID.get(Number(result.id));
      return item?`${t("knowledge.generation",{generation:item.generation})} · ${knowledgePocketLabel(item.pocket)}`:"";
    }
    if(result.kind==="evolution"){
      const family=knowledgeSearchFamilies().find(item=>Number(item.id)===Number(result.id));
      if(!family)return "";
      const names=family.members.map(knowledgePokemonName);
      return names.length>3?`${names.slice(0,3).join(" · ")} · +${names.length-3}`:names.join(" · ");
    }
    if(result.kind==="region"){
      const item=knowledgeRegionById(result.id);if(!item)return "";
      return `${t("knowledge.generation",{generation:item.generation})} · ${knowledgeWorldText(item.league)}`;
    }
    if(result.kind==="trainer"){
      const item=knowledgeTrainerById(result.id);if(!item)return "";
      return `${knowledgeRoleLabel(knowledgeTrainerPrimaryRole(item))} · ${knowledgeWorldText(knowledgeRegionById(item.region))}`;
    }
    const topic=knowledgeTopicById(result.id);
    return topic?t(`knowledge.competitiveGroup.${topic.group}`):"";
  }

  function knowledgeSearchResultCard(result) {
    const name=state.language==="en"?result.en:result.de;
    const visual=knowledgeSearchVisual(result);
    const personal = result.kind === "pokemon" || result.kind === "type" ? `<span class="knowledge-search-personal-actions">${knowledgeFavoriteButton(result.kind,result.id,"search-favorite")}${knowledgeTrainingListButton(result.kind,result.id,"search-training-list")}</span>` : "";
    return `<article class="knowledge-search-result-shell ${personal ? "has-personal-actions" : ""}">
      <button class="knowledge-search-result" data-search-kind="${result.kind}" data-search-id="${escapeHtml(String(result.id))}">
        <span class="knowledge-search-result-icon ${visual.className}" aria-hidden="true">${visual.html}</span>
        <span class="knowledge-search-result-copy"><small>${escapeHtml(knowledgeSearchKindLabel(result.kind))}</small><strong>${escapeHtml(name)}</strong><em>${escapeHtml(knowledgeSearchResultSubtitle(result))}</em></span>
        <i aria-hidden="true">›</i>
      </button>${personal}
    </article>`;
  }

  function captureKnowledgeSearchOrigin() {
    if(knowledgeView==="search"||knowledgeSearchOpenedResult)return;
    knowledgeSearchOrigin={
      route:state.route,
      view:knowledgeView,
      learnType,
      pokemonId:knowledgePokemonId,
      pokemonPage:knowledgePokemonPage,
      pokemonTab:knowledgePokemonDetailTab,
      contentKind:knowledgeContentKind,
      contentId:knowledgeContentId,
      contentPage:knowledgeContentPage,
      scrollY:Math.max(0,window.scrollY||document.documentElement.scrollTop||0)
    };
  }

  function restoreKnowledgeScroll(top) {
    const value=Math.max(0,Number(top)||0);
    requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:value,left:0,behavior:"auto"})));
  }

  function openKnowledgeSearchPage(options={}) {
    if(knowledgeView!=="search")captureKnowledgeSearchOrigin();
    knowledgeView="search";
    knowledgeSearchOpenedResult=false;
    knowledgeSearchVisibleCount=KNOWLEDGE_SEARCH_PAGE_SIZE;
    knowledgeSearchFocusPending=options.focus!==false;
    if(state.route==="knowledge"){
      replaceBrowserHistorySnapshot();
      renderKnowledgePage();
      pushBrowserHistorySnapshot();
    } else setRoute("knowledge");
  }

  function returnFromKnowledgeSearch() {
    if(canUseBrowserBack()){ history.back(); return; }
    const origin=knowledgeSearchOrigin;
    knowledgeSearchOrigin=null;
    knowledgeSearchOpenedResult=false;
    if(!origin){knowledgeView="home";renderKnowledgePage();return;}
    knowledgeView=origin.view||"home";
    learnType=origin.learnType||null;
    knowledgePokemonId=origin.pokemonId||null;
    knowledgePokemonPage=Math.max(0,Number(origin.pokemonPage)||0);
    knowledgePokemonDetailTab=origin.pokemonTab||"overview";
    knowledgeContentKind=origin.contentKind||null;
    knowledgeContentId=origin.contentId??null;
    knowledgeContentPage=Math.max(0,Number(origin.contentPage)||0);
    if(origin.route==="learn-detail")setRoute("learn-detail",{preserveScroll:true});
    else if(state.route==="knowledge")renderKnowledgePage();
    else setRoute("knowledge",{preserveScroll:true});
    restoreKnowledgeScroll(origin.scrollY);
  }

  function returnToKnowledgeSearchResults() {
    knowledgeSearchOpenedResult=false;
    knowledgeView="search";
    setRoute("knowledge",{preserveScroll:true});
    restoreKnowledgeScroll(knowledgeSearchResultScrollY);
  }

  function openKnowledgeSearchResult(kind,id) {
    if(knowledgeView!=="search")captureKnowledgeSearchOrigin();
    knowledgeView="search";
    knowledgeSearchOpenedResult=true;
    knowledgeSearchResultScrollY=Math.max(0,window.scrollY||document.documentElement.scrollTop||0);
    if(kind==="type"){
      knowledgePokemonId=null;knowledgeContentKind=null;knowledgeContentId=null;learnType=String(id);setRoute("learn-detail");return;
    }
    if(kind==="pokemon"){openKnowledgePokemon(id);return;}
    openKnowledgeEntry(kind,id);
  }

  function bindKnowledgeSearchResultButtons(root) {
    root.querySelectorAll("[data-search-kind]").forEach(button=>button.addEventListener("click",()=>openKnowledgeSearchResult(button.dataset.searchKind,button.dataset.searchId)));
    bindKnowledgeFavoriteButtons(root);
    bindKnowledgeTrainingListButtons(root);
  }

  function renderKnowledgeSearchResults(root) {
    const resultsRoot=root.querySelector("[data-knowledge-search-results]");
    const status=root.querySelector("[data-knowledge-search-status]");
    const clear=root.querySelector("[data-knowledge-search-clear]");
    if(!resultsRoot||!status)return;
    const query=knowledgeSearchQuery.trim();
    clear?.toggleAttribute("hidden",!query);
    if(!query){status.textContent=t("knowledge.search.hint");resultsRoot.innerHTML="";return;}
    if(QuizmonKnowledgeSearch.normalize(query).length<2){status.textContent=t("knowledge.search.minimum");resultsRoot.innerHTML="";return;}
    const result=QuizmonKnowledgeSearch.search(getKnowledgeSearchIndex(),query,{language:state.language,perKind:6,limit:54,generation:knowledgeSelectedGeneration()});
    status.textContent=(result.total===1?t("knowledge.search.resultOne",{count:1}):t("knowledge.search.results",{count:result.total}))+knowledgeSearchGenerationSuffix();
    if(!result.total){resultsRoot.innerHTML=knowledgeSearchEmptyMarkup();return;}
    const groups=QuizmonKnowledgeSearch.KIND_ORDER.map(kind=>{
      const items=result.items.filter(item=>item.kind===kind);
      if(!items.length)return "";
      const count=result.counts[kind]||items.length;
      return `<section class="knowledge-search-group"><div class="knowledge-search-group-head"><h4>${escapeHtml(knowledgeSearchKindLabel(kind))}</h4><span>${count}</span></div><div class="knowledge-search-result-grid">${items.map(knowledgeSearchResultCard).join("")}</div>${count>items.length?`<button type="button" class="knowledge-search-more-button" data-search-filter-open="${kind}">${t("knowledge.search.more",{count:count-items.length})}</button>`:""}</section>`;
    }).join("");
    resultsRoot.innerHTML=`${groups}<button type="button" class="primary-button knowledge-search-all-button" data-open-search-page>${t("knowledge.search.openAll",{count:result.total})}</button>`;
    bindKnowledgeSearchResultButtons(resultsRoot);
    resultsRoot.querySelector("[data-open-search-page]")?.addEventListener("click",()=>openKnowledgeSearchPage({focus:false}));
    resultsRoot.querySelectorAll("[data-search-filter-open]").forEach(button=>button.addEventListener("click",()=>{knowledgeSearchFilter=button.dataset.searchFilterOpen;openKnowledgeSearchPage({focus:false});}));
  }

  function knowledgeSearchMarkup() {
    return `<section class="knowledge-search-panel" aria-labelledby="knowledgeSearchTitle">
      <div class="knowledge-search-heading"><div><p class="quiz-kicker">${t("knowledge.search.kicker")}</p><h3 id="knowledgeSearchTitle">${t("knowledge.search.title")}</h3><p>${t("knowledge.search.text")}</p></div><span aria-hidden="true">${iconSvg("search")}</span></div>
      <label class="sr-only" for="knowledgeSearchInput">${t("knowledge.search.title")}</label><div class="knowledge-search-field"><span aria-hidden="true">${iconSvg("search")}</span><input id="knowledgeSearchInput" type="search" value="${escapeHtml(knowledgeSearchQuery)}" placeholder="${escapeHtml(t("knowledge.search.placeholder"))}" autocomplete="off" spellcheck="false"><button type="button" data-knowledge-search-clear aria-label="${escapeHtml(t("knowledge.search.clear"))}" ${knowledgeSearchQuery?"":"hidden"}>×</button></div>
      <p class="knowledge-search-status" data-knowledge-search-status aria-live="polite" aria-atomic="true"></p>
      <div class="knowledge-search-results" data-knowledge-search-results></div>
    </section>`;
  }

  function bindKnowledgeSearch(root) {
    const input=root.querySelector("#knowledgeSearchInput");
    if(!input)return;
    input.addEventListener("input",()=>{knowledgeSearchQuery=input.value;knowledgeSearchVisibleCount=KNOWLEDGE_SEARCH_PAGE_SIZE;renderKnowledgeSearchResults(root);});
    input.addEventListener("keydown",event=>{if(event.key==="Enter"&&QuizmonKnowledgeSearch.normalize(input.value).length>=2){event.preventDefault();openKnowledgeSearchPage({focus:false});}});
    root.querySelector("[data-knowledge-search-clear]")?.addEventListener("click",()=>{knowledgeSearchQuery="";input.value="";renderKnowledgeSearchResults(root);input.focus();});
    renderKnowledgeSearchResults(root);
  }

  function knowledgeSearchLauncherMarkup(compact=false) {
    return `<button type="button" class="knowledge-search-launcher ${compact?"compact":""}" data-open-knowledge-search aria-label="${escapeHtml(t("knowledge.search.open"))}"><span aria-hidden="true">⌕</span><b>${t("knowledge.search.open")}</b><kbd>/</kbd></button>`;
  }

  function bindKnowledgeSearchLaunchers(root) {
    root.querySelectorAll("[data-open-knowledge-search]").forEach(button=>button.addEventListener("click",()=>openKnowledgeSearchPage()));
  }


  function attachKnowledgeDetailSearchLauncher() {
    const page=view.firstElementChild;
    if(!page||page.querySelector("[data-knowledge-detail-search]"))return;
    const favorite=knowledgePokemonId?knowledgeFavoriteButton("pokemon",knowledgePokemonId,"detail-favorite"):learnType?knowledgeFavoriteButton("type",learnType,"detail-favorite"):"";
    const trainingList=knowledgePokemonId?knowledgeTrainingListButton("pokemon",knowledgePokemonId,"detail-training-list"):learnType?knowledgeTrainingListButton("type",learnType,"detail-training-list"):"";
    page.insertAdjacentHTML("afterbegin",`<div class="knowledge-detail-search-row" data-knowledge-detail-search>${favorite}${trainingList}${knowledgeGenerationFilterMarkup(true)}${knowledgeSearchLauncherMarkup()}</div>`);
    bindKnowledgeSearchLaunchers(page);
    bindKnowledgeGenerationFilter(page);
    bindKnowledgeFavoriteButtons(page);
    bindKnowledgeTrainingListButtons(page);
  }

  function knowledgeSearchFilterMarkup(result) {
    const options=["all",...QuizmonKnowledgeSearch.KIND_ORDER];
    return options.map(kind=>{
      const count=kind==="all"?result.allTotal:(result.counts[kind]||0);
      const label=kind==="all"?t("knowledge.search.filterAll"):knowledgeSearchKindLabel(kind);
      const active=knowledgeSearchFilter===kind;
      return `<button type="button" class="knowledge-search-filter ${active?"active":""}" data-search-filter="${kind}" aria-pressed="${active}" ${count?"":"disabled"}><span>${escapeHtml(label)}</span><b>${count}</b></button>`;
    }).join("");
  }

  function renderKnowledgeSearchPageResults(root) {
    const status=root.querySelector("[data-search-page-status]");
    const filters=root.querySelector("[data-search-page-filters]");
    const results=root.querySelector("[data-search-page-results]");
    const clear=root.querySelector("[data-search-page-clear]");
    if(!status||!filters||!results)return;
    const query=knowledgeSearchQuery.trim();
    clear?.toggleAttribute("hidden",!query);
    if(!query){status.textContent=t("knowledge.search.hint");filters.innerHTML="";results.innerHTML=`<section class="knowledge-search-empty"><span aria-hidden="true">⌕</span><div><strong>${t("knowledge.search.startTitle")}</strong><p>${t("knowledge.search.startText")}</p></div></section>`;return;}
    if(QuizmonKnowledgeSearch.normalize(query).length<2){status.textContent=t("knowledge.search.minimum");filters.innerHTML="";results.innerHTML="";return;}
    const selectedKind=knowledgeSearchFilter==="all"?null:knowledgeSearchFilter;
    const result=QuizmonKnowledgeSearch.search(getKnowledgeSearchIndex(),query,{language:state.language,kind:selectedKind,flat:true,limit:knowledgeSearchVisibleCount,generation:knowledgeSelectedGeneration()});
    if(selectedKind&&!result.counts[selectedKind])knowledgeSearchFilter="all";
    const finalKind=knowledgeSearchFilter==="all"?null:knowledgeSearchFilter;
    const finalResult=finalKind===selectedKind?result:QuizmonKnowledgeSearch.search(getKnowledgeSearchIndex(),query,{language:state.language,flat:true,limit:knowledgeSearchVisibleCount,generation:knowledgeSelectedGeneration()});
    filters.innerHTML=knowledgeSearchFilterMarkup(finalResult);
    filters.querySelectorAll("[data-search-filter]").forEach(button=>button.addEventListener("click",()=>{knowledgeSearchFilter=button.dataset.searchFilter;knowledgeSearchVisibleCount=KNOWLEDGE_SEARCH_PAGE_SIZE;renderKnowledgeSearchPageResults(root);}));
    const statusText=(finalResult.total===1?t("knowledge.search.resultOne",{count:1}):t("knowledge.search.results",{count:finalResult.total}))+knowledgeSearchGenerationSuffix();
    status.textContent=finalResult.items.length&&finalResult.items.every(item=>item.fuzzy)?`${statusText} · ${t("knowledge.search.similar")}`:statusText;
    if(!finalResult.total){results.innerHTML=knowledgeSearchEmptyMarkup();return;}
    const remaining=Math.max(0,finalResult.total-finalResult.items.length);
    results.innerHTML=`<div class="knowledge-search-page-grid">${finalResult.items.map(knowledgeSearchResultCard).join("")}</div>${remaining?`<button type="button" class="secondary-button knowledge-search-load-more" data-search-load-more>${t("knowledge.search.loadMore",{count:Math.min(KNOWLEDGE_SEARCH_PAGE_SIZE,remaining)})}</button>`:""}`;
    bindKnowledgeSearchResultButtons(results);
    results.querySelector("[data-search-load-more]")?.addEventListener("click",()=>{knowledgeSearchVisibleCount+=KNOWLEDGE_SEARCH_PAGE_SIZE;renderKnowledgeSearchPageResults(root);});
  }

  function renderKnowledgeSearchPage() {
    const root=document.getElementById("learnContent");
    root.innerHTML=`<section class="knowledge-search-page">
      <header class="knowledge-search-page-head"><button type="button" class="knowledge-back-button" data-search-return aria-label="${escapeHtml(t("knowledge.search.back"))}">‹</button><div><p class="quiz-kicker">${t("knowledge.search.kicker")}</p><h3>${t("knowledge.search.pageTitle")}</h3><p>${t("knowledge.search.pageText")}</p></div><div class="knowledge-search-page-actions"><span>${t("knowledge.search.shortcut")}</span>${knowledgeGenerationFilterMarkup(true)}</div></header>
      <section class="knowledge-search-page-panel">
        <label class="sr-only" for="knowledgeSearchPageInput">${t("knowledge.search.title")}</label><div class="knowledge-search-field large"><span aria-hidden="true">${iconSvg("search")}</span><input id="knowledgeSearchPageInput" type="search" value="${escapeHtml(knowledgeSearchQuery)}" placeholder="${escapeHtml(t("knowledge.search.placeholder"))}" autocomplete="off" spellcheck="false"><button type="button" data-search-page-clear aria-label="${escapeHtml(t("knowledge.search.clear"))}" ${knowledgeSearchQuery?"":"hidden"}>×</button></div>
        <p class="knowledge-search-status" data-search-page-status aria-live="polite" aria-atomic="true"></p>
        <div class="knowledge-search-filters" data-search-page-filters aria-label="${escapeHtml(t("knowledge.search.filters"))}"></div>
        <div class="knowledge-search-page-results" data-search-page-results></div>
      </section>
    </section>`;
    const input=root.querySelector("#knowledgeSearchPageInput");
    input?.addEventListener("input",()=>{knowledgeSearchQuery=input.value;knowledgeSearchVisibleCount=KNOWLEDGE_SEARCH_PAGE_SIZE;renderKnowledgeSearchPageResults(root);});
    input?.addEventListener("keydown",event=>{if(event.key==="Escape"&&knowledgeSearchQuery){event.preventDefault();knowledgeSearchQuery="";input.value="";renderKnowledgeSearchPageResults(root);}});
    root.querySelector("[data-search-page-clear]")?.addEventListener("click",()=>{knowledgeSearchQuery="";input.value="";knowledgeSearchVisibleCount=KNOWLEDGE_SEARCH_PAGE_SIZE;renderKnowledgeSearchPageResults(root);input.focus();});
    root.querySelector("[data-search-return]")?.addEventListener("click",returnFromKnowledgeSearch);
    bindKnowledgeGenerationFilter(root);
    renderKnowledgeSearchPageResults(root);
    if(knowledgeSearchFocusPending){knowledgeSearchFocusPending=false;requestAnimationFrame(()=>input?.focus({preventScroll:true}));}
  }
  function renderKnowledgeHome() {
    const root=document.getElementById("learnContent");
    const counts=knowledgeHomeCounts();
    const compact=matchMedia("(max-width:620px)").matches;
    root.innerHTML=`<section class="knowledge-home">
      <section class="knowledge-welcome">
        <div><p class="quiz-kicker">${t("knowledge.kicker")}</p><h3>${t("knowledge.homeTitle")}</h3><p>${t("knowledge.homeText")}</p></div>
        <div class="knowledge-welcome-mark" aria-hidden="true">${iconSvg("pokemon")}</div>
      </section>
      ${knowledgeGenerationFilterMarkup()}
      ${knowledgeSearchMarkup()}
      <details class="knowledge-home-group knowledge-personal-hub" ${compact?"":"open"}>
        <summary><span aria-hidden="true">${iconSvg("favorite")}</span><span><strong>${t("knowledge.personalHubTitle")}</strong><small>${t("knowledge.personalHubText")}</small></span><i aria-hidden="true">⌄</i></summary>
        <section class="knowledge-personal-entry">
          ${knowledgeSectionButton("favorites",iconSvg("favorite"),t("favorites.title"),t("favorites.homeText"),t("favorites.meta",{count:favoritePokemonEntries().length+favoriteTypeEntries().length}))}
          ${knowledgeSectionButton("training-lists",iconSvg("list"),t("trainingLists.title"),t("trainingLists.homeText"),t("trainingLists.meta",{count:trainingLists().length}))}
        </section>
      </details>
      <section class="knowledge-category-grid" aria-labelledby="knowledgeAvailableTitle">
        <div class="knowledge-section-heading"><div><small>${t("knowledge.availableKicker")}</small><h3 id="knowledgeAvailableTitle">${t("knowledge.availableTitle")}</h3></div></div>
        ${knowledgeSectionButton("types",TYPE_META.psychic.icon,t("knowledge.typesTitle"),t("knowledge.typesText"),t("knowledge.typesMeta",{count:counts.types}))}
        ${knowledgeSectionButton("pokemon",iconSvg("pokemon"),t("knowledge.pokemonTitle"),t("knowledge.pokemonText"),t("knowledge.pokemonMeta",{count:counts.pokemon}))}
        ${knowledgeSectionButton("moves",iconSvg("evolution"),t("knowledge.moves"),t("knowledge.movesText"),t("knowledge.movesMeta",{count:counts.moves}))}
        ${knowledgeSectionButton("items",iconSvg("item"),t("knowledge.items"),t("knowledge.itemsText"),t("knowledge.itemsMeta",{count:counts.items}))}
      </section>
      <details class="knowledge-home-group knowledge-world-hub" ${compact?"":"open"}>
        <summary><span aria-hidden="true">${iconSvg("region")}</span><span><strong>${t("knowledge.worldTitle")}</strong><small>${t("knowledge.worldHubText")}</small></span><i aria-hidden="true">⌄</i></summary>
        <section class="knowledge-category-grid knowledge-world-grid" aria-labelledby="knowledgeWorldTitle">
          <div class="knowledge-section-heading sr-only"><div><small>${t("knowledge.worldKicker")}</small><h3 id="knowledgeWorldTitle">${t("knowledge.worldTitle")}</h3></div></div>
          ${knowledgeSectionButton("regions",iconSvg("region"),t("knowledge.regionsTitle"),t("knowledge.regionsText"),t("knowledge.regionsMeta",{count:counts.regions}))}
          ${knowledgeSectionButton("trainers",iconSvg("trainer"),t("knowledge.trainersTitle"),t("knowledge.trainersText"),t("knowledge.trainersMeta",{count:counts.trainers}))}
          ${knowledgeSectionButton("competitive",iconSvg("battle"),t("knowledge.competitiveTitle"),t("knowledge.competitiveText"),t("knowledge.competitiveMeta",{count:counts.competitive}))}
        </section>
      </details>
    </section>`;
    bindKnowledgeSearch(root);
    bindKnowledgeGenerationFilter(root);
    root.querySelectorAll("[data-knowledge-section]").forEach(button=>button.addEventListener("click",()=>{
      replaceBrowserHistorySnapshot();
      knowledgeView=button.dataset.knowledgeSection;knowledgePokemonPage=0;knowledgeContentPage=0;renderKnowledge();
      pushBrowserHistorySnapshot();
    }));
  }

  function knowledgeSubpageHeader(title, text, meta) {
    return `<header class="knowledge-subpage-head"><button class="knowledge-back-button" data-knowledge-home aria-label="${escapeHtml(t("knowledge.backHome"))}">‹</button><div><p class="quiz-kicker">${t("knowledge.kicker")}</p><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div><div class="knowledge-subpage-actions"><span>${escapeHtml(meta)}</span>${knowledgeGenerationFilterMarkup(true)}${knowledgeSearchLauncherMarkup(true)}</div></header>`;
  }

  function bindKnowledgeHome(root) {
    root.querySelector("[data-knowledge-home]")?.addEventListener("click",()=>{if(canUseBrowserBack()){history.back();return;}knowledgeView="home";knowledgeContentPage=0;renderKnowledge();});
    bindKnowledgeSearchLaunchers(root);
    bindKnowledgeGenerationFilter(root);
  }

  function knowledgeTypeCard(type) {
    const s=state.stats.types[type];
    const attack=groupByMultiplier(TYPES,target=>effectiveness(type,[target]));
    const defense=groupByMultiplier(TYPES,attacker=>effectiveness(attacker,[type]));
    const memory=memoryAid(type,attack,defense);
    return `<article class="knowledge-type-card-shell" style="--type-color:${TYPE_META[type].color}"><button class="knowledge-type-card" data-learn-type="${type}"><span class="knowledge-type-symbol">${TYPE_META[type].icon}</span><span><strong>${escapeHtml(typeLabel(type))}</strong><p>${escapeHtml(memory)}</p>${s.total?`<small>${escapeHtml(typeKnowledgeLabel(s))}</small>`:""}</span><i aria-hidden="true">›</i></button><span class="knowledge-card-actions">${knowledgeFavoriteButton("type",type,"card-favorite")}${knowledgeTrainingListButton("type",type,"card-training-list")}</span></article>`;
  }

  function renderKnowledgeTypes() {
    const root=document.getElementById("learnContent");
    const notice=knowledgeSelectedGeneration()?`<p class="knowledge-generation-type-notice">${t("knowledge.generationFilter.typeRules")}</p>`:"";
    root.innerHTML=`<section class="knowledge-subpage knowledge-types-page">
      ${knowledgeSubpageHeader(t("knowledge.typesTitle"),t("knowledge.typesText"),t("knowledge.typesMeta",{count:TYPES.length}))}
      ${notice}
      <div class="knowledge-type-grid">${TYPES.map(knowledgeTypeCard).join("")}</div>
    </section>`;
    bindKnowledgeHome(root);
    root.querySelectorAll("[data-learn-type]").forEach(button=>button.addEventListener("click",()=>{knowledgePokemonId=null;knowledgeContentKind=null;learnType=button.dataset.learnType;setRoute("learn-detail");}));
    bindKnowledgeFavoriteButtons(root);
    bindKnowledgeTrainingListButtons(root);
  }

  function renderKnowledgePokemon() {
    const root=document.getElementById("learnContent");
    const pageSize=48;
    const items=knowledgeFilteredItems("pokemon",QuizmonKnowledgeData.POKEMON);
    const total=items.length;
    const pageCount=Math.max(1,Math.ceil(total/pageSize));
    knowledgePokemonPage=Math.min(Math.max(0,knowledgePokemonPage),pageCount-1);
    const result=QuizmonKnowledge.listPokemon(items,{offset:knowledgePokemonPage*pageSize,limit:pageSize});
    root.innerHTML=`<section class="knowledge-subpage knowledge-pokemon-page">
      ${knowledgeSubpageHeader(t("knowledge.pokemonTitle"),t("knowledge.pokemonCatalogText"),t("knowledge.pokemonMeta",{count:total}))}
      ${total?`<div class="knowledge-pokemon-grid">${result.items.map(knowledgePokemonCard).join("")}</div>${knowledgePaginationMarkup(knowledgePokemonPage,pageCount,"pokemon")}`:knowledgeGenerationEmptyMarkup()}
    </section>`;
    bindKnowledgeHome(root);
    root.querySelectorAll("[data-knowledge-pokemon]").forEach(button=>button.addEventListener("click",()=>openKnowledgePokemon(button.dataset.knowledgePokemon)));
    bindKnowledgeFavoriteButtons(root);
    bindKnowledgeTrainingListButtons(root);
    bindKnowledgePagination(root,"pokemon",pageCount);
  }

  function knowledgeExcerpt(value,max=118) {
    const text=String(value||"").trim();
    return text.length>max?`${text.slice(0,max-1).trim()}…`:text;
  }

  function knowledgeDamageClassLabel(value) { return t(`knowledge.damageClass.${value||"status"}`); }
  function knowledgePocketLabel(value) { return t(`knowledge.pocket.${value||1}`); }

  function knowledgeMoveCard(item) {
    return `<button class="knowledge-content-card move-card" data-knowledge-entry="move" data-entry-id="${item.id}" style="--entry-color:${TYPE_META[item.type]?.color||"#66a9b8"}">
      <span class="knowledge-content-icon">${TYPE_META[item.type]?.icon||"↗"}</span><span class="knowledge-content-copy"><strong>${escapeHtml(knowledgeEntryName(item))}</strong><small>${escapeHtml(typeLabel(item.type))} · ${escapeHtml(knowledgeDamageClassLabel(item.damageClass))}</small><p>${escapeHtml(knowledgeExcerpt(knowledgeEntryEffect(item)))}</p><span><b>${item.power==null?t("knowledge.noPower"):t("knowledge.powerShort",{value:item.power})}</b><b>${item.accuracy==null?t("knowledge.noAccuracy"):t("knowledge.accuracyShort",{value:item.accuracy})}</b><b>${t("knowledge.ppShort",{value:item.pp??"—"})}</b></span></span><i aria-hidden="true">›</i>
    </button>`;
  }

  function knowledgeAbilityCard(item) {
    return `<button class="knowledge-content-card ability-card" data-knowledge-entry="ability" data-entry-id="${item.id}">
      <span class="knowledge-content-icon">✦</span><span class="knowledge-content-copy"><strong>${escapeHtml(knowledgeEntryName(item))}</strong><small>${t("knowledge.generation",{generation:item.generation})} · ${t("knowledge.pokemonLinked",{count:item.pokemonIds.length})}</small><p>${escapeHtml(knowledgeExcerpt(knowledgeEntryEffect(item)))}</p></span><i aria-hidden="true">›</i>
    </button>`;
  }

  function knowledgeItemCard(item) {
    return `<button class="knowledge-content-card item-card" data-knowledge-entry="item" data-entry-id="${item.id}">
      <span class="knowledge-content-icon item-sprite"><img loading="lazy" data-image-kind="item" src="${escapeHtml(knowledgeItemArtwork(item))}" alt=""></span><span class="knowledge-content-copy"><strong>${escapeHtml(knowledgeEntryName(item))}</strong><small>${escapeHtml(knowledgePocketLabel(item.pocket))} · ${t("knowledge.generationShort",{generation:item.generation})}</small><p>${escapeHtml(knowledgeExcerpt(knowledgeEntryEffect(item)))}</p></span><i aria-hidden="true">›</i>
    </button>`;
  }

  function knowledgeEvolutionFamilyCard(family) {
    const names=family.members.slice(0,4).map(knowledgePokemonName);
    const displayedGeneration=knowledgeSelectedGeneration()||family.generation;
    return `<button class="knowledge-content-card evolution-family-card" data-knowledge-entry="evolution" data-entry-id="${family.id}">
      <span class="knowledge-family-art">${family.members.slice(0,3).map(item=>`<img loading="lazy" src="${escapeHtml(knowledgeArtwork(item))}" alt="">`).join("")}</span><span class="knowledge-content-copy"><strong>${escapeHtml(knowledgePokemonName(family.root))}</strong><small>${t("knowledge.familyMembers",{count:family.size})} · ${t("knowledge.generationShort",{generation:displayedGeneration})}</small><p>${escapeHtml(names.join(" · "))}${family.size>4?` · +${family.size-4}`:""}</p></span><i aria-hidden="true">›</i>
    </button>`;
  }

  function knowledgePaginationMarkup(page,pageCount,kind) {
    if(pageCount<=1)return "";
    return `<nav class="knowledge-pagination" aria-label="${escapeHtml(t("knowledge.paginationLabelGeneric"))}" data-pagination-kind="${kind}"><button data-page-action="prev" class="secondary-button" ${page===0?"disabled":""}>${t("knowledge.previousPage")}</button><span>${t("knowledge.pageStatus",{current:page+1,total:pageCount})}</span><button data-page-action="next" class="secondary-button" ${page>=pageCount-1?"disabled":""}>${t("knowledge.nextPage")}</button></nav>`;
  }

  function bindKnowledgePagination(root,kind,pageCount) {
    root.querySelectorAll("[data-page-action]").forEach(button=>button.addEventListener("click",()=>{
      const delta=button.dataset.pageAction==="next"?1:-1;
      if(kind==="pokemon")knowledgePokemonPage=Math.min(pageCount-1,Math.max(0,knowledgePokemonPage+delta));
      else knowledgeContentPage=Math.min(pageCount-1,Math.max(0,knowledgeContentPage+delta));
      renderKnowledge();root.scrollIntoView({behavior:motionEnabled()?"smooth":"auto"});
    }));
  }

  function knowledgeCatalogSpec(kind) {
    if(kind==="moves"){
      const items=knowledgeFilteredItems("move",QuizmonKnowledgeContent.MOVES);
      return {items,pageSize:48,title:t("knowledge.moves"),text:t("knowledge.movesCatalogText"),meta:t("knowledge.movesMeta",{count:items.length}),card:knowledgeMoveCard};
    }
    if(kind==="abilities"){
      const items=knowledgeFilteredItems("ability",QuizmonKnowledgeContent.ABILITIES);
      return {items,pageSize:48,title:t("knowledge.abilities"),text:t("knowledge.abilitiesCatalogText"),meta:t("knowledge.abilitiesMeta",{count:items.length}),card:knowledgeAbilityCard};
    }
    if(kind==="items"){
      const items=knowledgeFilteredItems("item",QuizmonKnowledgeContent.ITEMS);
      return {items,pageSize:48,title:t("knowledge.items"),text:t("knowledge.itemsCatalogText"),meta:t("knowledge.itemsMeta",{count:items.length}),card:knowledgeItemCard};
    }
    const items=knowledgeFilteredItems("evolution",knowledgeSearchFamilies());
    return {items,pageSize:36,title:t("knowledge.evolutions"),text:t("knowledge.evolutionsCatalogText"),meta:t("knowledge.evolutionsMeta",{count:items.length}),card:knowledgeEvolutionFamilyCard};
  }

  function renderKnowledgeContentCatalog(kind) {
    const root=document.getElementById("learnContent");
    const spec=knowledgeCatalogSpec(kind);
    const pageCount=Math.max(1,Math.ceil(spec.items.length/spec.pageSize));
    knowledgeContentPage=Math.min(Math.max(0,knowledgeContentPage),pageCount-1);
    const result=QuizmonKnowledge.listEntries(spec.items,{offset:knowledgeContentPage*spec.pageSize,limit:spec.pageSize});
    root.innerHTML=`<section class="knowledge-subpage knowledge-content-page ${kind}">${knowledgeSubpageHeader(spec.title,spec.text,spec.meta)}${spec.items.length?`<div class="knowledge-content-grid">${result.items.map(spec.card).join("")}</div>${knowledgePaginationMarkup(knowledgeContentPage,pageCount,kind)}`:knowledgeGenerationEmptyMarkup()}</section>`;
    bindKnowledgeHome(root);bindKnowledgePagination(root,kind,pageCount);
    root.querySelectorAll("[data-knowledge-entry]").forEach(button=>button.addEventListener("click",()=>openKnowledgeEntry(button.dataset.knowledgeEntry,button.dataset.entryId)));
  }


  function knowledgeWorldText(value) { return QuizmonKnowledgeWorld.text(value,state.language); }
  function knowledgeRegionById(id) { return QuizmonKnowledgeWorld.REGION_BY_ID.get(String(id)) || null; }
  function knowledgeTrainerById(id) { return QuizmonKnowledgeWorld.TRAINER_BY_ID.get(String(id)) || null; }
  function knowledgeTopicById(id) { return QuizmonKnowledgeWorld.TOPIC_BY_ID.get(String(id)) || null; }

  function knowledgeRoleLabel(role) { return t(`knowledge.trainerRole.${role}`); }
  function knowledgeRoleMarkup(roles) { return (roles||[]).map(role=>`<span>${escapeHtml(knowledgeRoleLabel(role))}</span>`).join(""); }
  const KNOWLEDGE_CORE_TRAINER_ROLES = new Set(["gym","elite","champion"]);
  const KNOWLEDGE_TRAINER_ROLE_ICONS = Object.freeze({ gym:"◈", elite:"✦", champion:"♛" });
  const KNOWLEDGE_TRAINER_LEVEL_CURVES = Object.freeze({
    kanto: Object.freeze({ gym:[14,21,24,29,43,43,47,50], elite:[54,56,56,58], champion:[65] }),
    johto: Object.freeze({ gym:[9,16,20,25,31,35,31,40], elite:[40,42,42,47], champion:[50] }),
    hoenn: Object.freeze({ gym:[15,19,24,29,31,33,42,46], elite:[46,48,49,50], champion:[58] }),
    sinnoh: Object.freeze({ gym:[14,22,30,37,41,44,49,52], elite:[53,55,57,59], champion:[66] }),
    unova: Object.freeze({ gym:[14,20,24,27,31,35,39,43], elite:[48,48,50,50], champion:[54] }),
    kalos: Object.freeze({ gym:[12,25,32,37,42,48,59,68], elite:[63,64,65,65], champion:[68] }),
    alola: Object.freeze({ gym:[], elite:[54,55,56,57], champion:[58] }),
    galar: Object.freeze({ gym:[20,24,36,38,42,46,48,55], elite:[54,55,55,56], champion:[65] }),
    paldea: Object.freeze({ gym:[15,17,24,30,35,42,45,48], elite:[57,58,59,60], champion:[62] })
  });
  function knowledgeTrainerPrimaryRole(trainer) {
    if (!trainer?.roles?.length) return null;
    return trainer.roles.find(role=>KNOWLEDGE_CORE_TRAINER_ROLES.has(role)) || null;
  }
  function knowledgeTrainerIsCore(trainer) {
    return !!knowledgeTrainerPrimaryRole(trainer);
  }
  function knowledgeTrainerRoleIcon(trainer) {
    return KNOWLEDGE_TRAINER_ROLE_ICONS[knowledgeTrainerPrimaryRole(trainer)] || "◉";
  }
  function knowledgeTrainerRegionCoreList(regionId, role) {
    return QuizmonKnowledgeWorld.TRAINERS.filter(item=>item.region===regionId && knowledgeTrainerPrimaryRole(item)===role);
  }
  function knowledgeTrainerAceLevel(trainer) {
    const role=knowledgeTrainerPrimaryRole(trainer);
    if (!role) return null;
    const curve=KNOWLEDGE_TRAINER_LEVEL_CURVES[trainer.region]?.[role] || [];
    const list=knowledgeTrainerRegionCoreList(trainer.region, role);
    const index=Math.max(0, list.findIndex(item=>item.id===trainer.id));
    if (curve[index] != null) return curve[index];
    if (curve.length) return curve[Math.min(curve.length - 1, index)];
    return role === "champion" ? 60 : role === "elite" ? 50 : 30;
  }
  function knowledgeTrainerTeam(trainer) {
    const ids=Array.isArray(trainer?.pokemonIds) ? trainer.pokemonIds : [];
    const explicit=Array.isArray(trainer?.pokemonTeam) ? trainer.pokemonTeam : [];
    if (explicit.length) {
      return explicit.map((entry,index)=>{
        const pokemon=knowledgePokemonById(entry.id ?? entry.pokemonId ?? ids[index]);
        if (!pokemon) return null;
        return { pokemon, level: entry.level ?? null, form: entry.form || null };
      }).filter(Boolean);
    }
    const aceLevel=knowledgeTrainerAceLevel(trainer);
    const total=ids.length;
    return ids.map((id,index)=>{
      const pokemon=knowledgePokemonById(id);
      if (!pokemon) return null;
      const offset=total > 1 ? (total - 1 - index) * 2 : 0;
      return { pokemon, level: aceLevel != null ? Math.max(1, aceLevel - offset) : null };
    }).filter(Boolean);
  }
  function knowledgeTrainerPrimaryColor(trainer) {
    const type=trainer?.types?.[0];
    if(type && TYPE_META[type])return TYPE_META[type].color;
    if(trainer?.roles?.includes("champion"))return "#d4a847";
    if(trainer?.roles?.includes("elite"))return "#8a78be";
    return "#66a9b8";
  }
  function knowledgeTrainerDescription(trainer) {
    const name=knowledgeWorldText(trainer),region=knowledgeWorldText(knowledgeRegionById(trainer.region));
    const types=(trainer.types||[]).map(typeLabel).join(state.language==="de"?" und ":" and ");
    const location=knowledgeWorldText(trainer.location);
    const vars={name,region,types,location};
    if(trainer.roles.includes("gym"))return t(types?"knowledge.trainerDescription.gymType":"knowledge.trainerDescription.gym",vars);
    if(trainer.roles.includes("elite"))return t(types?"knowledge.trainerDescription.eliteType":"knowledge.trainerDescription.elite",vars);
    if(trainer.roles.includes("champion"))return t(types?"knowledge.trainerDescription.championType":"knowledge.trainerDescription.champion",vars);
    if(trainer.roles.includes("captain"))return t("knowledge.trainerDescription.captain",vars);
    if(trainer.roles.includes("kahuna"))return t("knowledge.trainerDescription.kahuna",vars);
    if(trainer.roles.includes("professor"))return t("knowledge.trainerDescription.professor",vars);
    if(trainer.roles.includes("rival"))return t("knowledge.trainerDescription.rival",vars);
    return t("knowledge.trainerDescription.other",vars);
  }

  function knowledgeRegionCard(region) {
    return `<button class="knowledge-region-card" data-knowledge-entry="region" data-entry-id="${region.id}" style="--region-color:${escapeHtml(region.accent)}"><span class="knowledge-region-number">${region.generation}</span><span class="knowledge-region-copy"><small>${t("knowledge.generation",{generation:region.generation})}</small><strong>${escapeHtml(knowledgeWorldText(region))}</strong><p>${escapeHtml(knowledgeExcerpt(knowledgeWorldText(region.summary),132))}</p><span class="knowledge-region-starters">${region.starters.map(id=>{const pokemon=knowledgePokemonById(id);return pokemon?`<img loading="lazy" src="${escapeHtml(knowledgeArtwork(pokemon))}" alt="${escapeHtml(knowledgePokemonName(pokemon))}">`:"";}).join("")}</span></span><i aria-hidden="true">›</i></button>`;
  }

  function knowledgeTrainerCard(trainer) {
    const region=knowledgeRegionById(trainer.region);
    const primaryRole=knowledgeTrainerPrimaryRole(trainer);
    return `<button class="knowledge-trainer-card" data-knowledge-entry="trainer" data-entry-id="${trainer.id}" style="--trainer-color:${knowledgeTrainerPrimaryColor(trainer)}"><span class="knowledge-trainer-avatar" aria-hidden="true">${knowledgeTrainerRoleIcon(trainer)}</span><span class="knowledge-trainer-copy"><strong>${escapeHtml(knowledgeWorldText(trainer))}</strong><small>${escapeHtml(knowledgeWorldText(region))} · ${primaryRole ? knowledgeRoleLabel(primaryRole) : (trainer.roles||[]).map(knowledgeRoleLabel).join(" · ")}</small>${trainer.types?.length?`<span class="knowledge-trainer-types">${trainer.types.map(type=>typeChip(type,"small")).join("")}</span>`:""}</span><i aria-hidden="true">›</i></button>`;
  }

  function knowledgeCompetitiveIcon(group) { return ({battle:"↗",team:"◇",stats:"▥",field:"◎"})[group]||"⚔"; }
  function knowledgeCompetitiveCard(topic) {
    return `<button class="knowledge-topic-card" data-knowledge-entry="competitive" data-entry-id="${topic.id}"><span class="knowledge-topic-icon">${knowledgeCompetitiveIcon(topic.group)}</span><span><small>${t(`knowledge.competitiveGroup.${topic.group}`)}</small><strong>${escapeHtml(knowledgeWorldText(topic))}</strong><p>${escapeHtml(knowledgeWorldText(topic.summary))}</p></span><i aria-hidden="true">›</i></button>`;
  }

  function bindKnowledgeWorldCatalog(root) {
    root.querySelectorAll("[data-knowledge-entry]").forEach(button=>button.addEventListener("click",()=>openKnowledgeEntry(button.dataset.knowledgeEntry,button.dataset.entryId)));
  }

  function favoritePokemonRows() {
    const rows=QuizmonFavorites.sortPokemon(favoritePokemonEntries(),QuizmonKnowledgeData.BY_ID,state.language,state.favorites.sortPokemon);
    const generation=knowledgeSelectedGeneration();
    return generation?rows.filter(row=>Number(row.item.generation)===generation):rows;
  }

  function favoriteTypeRows() {
    const labels=Object.fromEntries(TYPES.map(type=>[type,typeLabel(type)]));
    return QuizmonFavorites.sortTypes(favoriteTypeEntries(),labels,state.language,state.favorites.sortTypes);
  }

  function knowledgeFavoritesEmptyMarkup() {
    return `<section class="knowledge-favorites-empty"><span aria-hidden="true">♡</span><div><strong>${t("favorites.emptyTitle")}</strong><p>${t("favorites.emptyText")}</p></div><div><button type="button" class="primary-button" data-favorite-browse="pokemon">${t("favorites.browsePokemon")}</button><button type="button" class="secondary-button" data-favorite-browse="types">${t("favorites.browseTypes")}</button></div></section>`;
  }

  function renderKnowledgeFavorites() {
    const root=document.getElementById("learnContent");
    const pokemonRows=favoritePokemonRows();
    const typeRows=favoriteTypeRows();
    const total=favoritePokemonEntries().length+favoriteTypeEntries().length;
    const highlightedPokemon=knowledgePokemonById(state.profile.favoritePokemonId);
    const highlightedType=TYPES.includes(state.profile.favoriteType)?state.profile.favoriteType:null;
    root.innerHTML=`<section class="knowledge-subpage knowledge-favorites-page">
      ${knowledgeSubpageHeader(t("favorites.title"),t("favorites.subtitle"),t("favorites.meta",{count:total}))}
      <section class="knowledge-favorites-summary">
        <article><span aria-hidden="true">♥</span><div><small>${t("favorites.pokemonCount")}</small><strong>${favoritePokemonEntries().length}</strong></div></article>
        <article><span aria-hidden="true">◆</span><div><small>${t("favorites.typeCount")}</small><strong>${favoriteTypeEntries().length}</strong></div></article>
        <article class="profile-highlight"><span aria-hidden="true">◎</span><div><small>${t("favorites.profileHighlight")}</small><strong>${escapeHtml([highlightedPokemon?knowledgePokemonName(highlightedPokemon):"",highlightedType?typeLabel(highlightedType):""].filter(Boolean).join(" · ")||t("favorites.noProfileHighlight"))}</strong></div></article>
      </section>
      ${total?`<section class="knowledge-favorites-section" aria-labelledby="favoritePokemonTitle"><div class="knowledge-favorites-heading"><div><p class="quiz-kicker">${t("favorites.pokemonKicker")}</p><h3 id="favoritePokemonTitle">${t("favorites.pokemonTitle")}</h3><p>${t("favorites.pokemonText")}</p></div><label>${t("favorites.sortLabel")}<select data-favorite-sort="pokemon"><option value="recent" ${state.favorites.sortPokemon==="recent"?"selected":""}>${t("favorites.sortRecent")}</option><option value="name" ${state.favorites.sortPokemon==="name"?"selected":""}>${t("favorites.sortName")}</option><option value="number" ${state.favorites.sortPokemon==="number"?"selected":""}>${t("favorites.sortNumber")}</option></select></label></div>${pokemonRows.length?`<div class="knowledge-pokemon-grid favorites-grid">${pokemonRows.map(row=>knowledgePokemonCard(row.item)).join("")}</div>`:knowledgeGenerationEmptyMarkup()}</section>
      <section class="knowledge-favorites-section" aria-labelledby="favoriteTypesTitle"><div class="knowledge-favorites-heading"><div><p class="quiz-kicker">${t("favorites.typeKicker")}</p><h3 id="favoriteTypesTitle">${t("favorites.typeTitle")}</h3><p>${t("favorites.typeText")}</p></div><label>${t("favorites.sortLabel")}<select data-favorite-sort="types"><option value="recent" ${state.favorites.sortTypes==="recent"?"selected":""}>${t("favorites.sortRecent")}</option><option value="name" ${state.favorites.sortTypes==="name"?"selected":""}>${t("favorites.sortName")}</option></select></label></div><div class="knowledge-type-grid favorites-grid">${typeRows.map(row=>knowledgeTypeCard(row.type)).join("")}</div></section>`:knowledgeFavoritesEmptyMarkup()}
    </section>`;
    bindKnowledgeHome(root);
    root.querySelectorAll("[data-knowledge-pokemon]").forEach(button=>button.addEventListener("click",()=>openKnowledgePokemon(button.dataset.knowledgePokemon)));
    root.querySelectorAll("[data-learn-type]").forEach(button=>button.addEventListener("click",()=>{knowledgePokemonId=null;knowledgeContentKind=null;learnType=button.dataset.learnType;setRoute("learn-detail");}));
    root.querySelectorAll("[data-favorite-sort]").forEach(select=>select.addEventListener("change",()=>{if(select.dataset.favoriteSort==="pokemon")state.favorites.sortPokemon=select.value;else state.favorites.sortTypes=select.value;saveState();renderKnowledgeFavorites();}));
    root.querySelectorAll("[data-favorite-browse]").forEach(button=>button.addEventListener("click",()=>{knowledgeView=button.dataset.favoriteBrowse;renderKnowledge();}));
    bindKnowledgeFavoriteButtons(root);
    bindKnowledgeTrainingListButtons(root);
  }

  function trainingListPreviewMarkup(list) {
    const entries=list.entries.slice(0,4);
    if(list.kind==="pokemon")return `<span class="training-list-preview pokemon">${entries.map(id=>{const item=knowledgePokemonById(id);return item?`<img loading="lazy" src="${escapeHtml(knowledgeArtwork(item))}" alt="">`:"";}).join("")}</span>`;
    return `<span class="training-list-preview types">${entries.map(type=>`<i style="--preview-color:${TYPE_META[type]?.color||"var(--primary)"}">${TYPE_META[type]?.icon||"◆"}</i>`).join("")}</span>`;
  }

  function trainingListCard(list) {
    const canStart=QuizmonTrainingLists.canStart(list);
    return `<article class="training-list-card">${trainingListPreviewMarkup(list)}<div class="training-list-card-copy"><small>${t(`trainingLists.kind.${list.kind}`)}</small><strong>${escapeHtml(list.name)}</strong><p>${t("trainingLists.entryCount",{count:list.entries.length})}</p></div><div class="training-list-card-actions"><button type="button" class="primary-button" data-training-list-start="${escapeHtml(list.id)}" ${canStart?"":"disabled"}>${t("trainingLists.start")}</button><button type="button" class="secondary-button" data-training-list-edit="${escapeHtml(list.id)}">${t("common.edit")}</button><button type="button" class="ghost-button" data-training-list-duplicate="${escapeHtml(list.id)}">${t("trainingLists.duplicate")}</button><button type="button" class="ghost-button danger" data-training-list-delete="${escapeHtml(list.id)}">${t("trainingLists.delete")}</button></div>${canStart?"":`<p class="training-list-card-warning">${t("trainingLists.tooSmallShort")}</p>`}</article>`;
  }

  function createTrainingListFromFavorites(kind) {
    const entries=kind==="pokemon"?favoritePokemonEntries().map(entry=>entry.id):favoriteTypeEntries().map(entry=>entry.type);
    if(!entries.length){showMessageDialog({title:t("trainingLists.noFavoritesTitle"),message:t("trainingLists.noFavoritesText"),buttonLabel:t("common.understood"),kind:"info",icon:"♡"});return;}
    openTrainingListEditor(null,kind,entries[0]);
    trainingListDraft.entries=[...new Set(entries)];
    renderTrainingListEditorContent();
  }

  function duplicateTrainingList(listId) {
    const list=trainingListById(listId);if(!list)return;
    state.trainingLists=QuizmonTrainingLists.duplicate(state.trainingLists,list.id,{name:t("trainingLists.copyName",{name:list.name})},trainingListSanitizeOptions());
    saveState();renderKnowledgeTrainingLists();enqueueToast("⧉",t("trainingLists.duplicated"),t("trainingLists.duplicatedHint",{name:list.name}),"success");
  }

  function deleteTrainingList(listId) {
    const list=trainingListById(listId);if(!list)return;
    showConfirmDialog({title:t("trainingLists.deleteTitle"),message:t("trainingLists.deleteText",{name:list.name}),confirmLabel:t("trainingLists.delete"),cancelLabel:t("common.cancel"),kind:"danger",icon:"×",onConfirm:()=>{state.trainingLists=QuizmonTrainingLists.removeList(state.trainingLists,list.id,trainingListSanitizeOptions());if(state.lastConfig?.trainingListId===list.id){state.lastMode=null;state.lastConfig=null;}saveState();renderKnowledgeTrainingLists();enqueueToast("×",t("trainingLists.deleted"),t("trainingLists.deletedHint"),"info");}});
  }

  function renderKnowledgeTrainingLists() {
    const root=document.getElementById("learnContent");
    const lists=trainingLists();
    root.innerHTML=`<section class="knowledge-subpage knowledge-training-lists-page">${knowledgeSubpageHeader(t("trainingLists.title"),t("trainingLists.subtitle"),t("trainingLists.meta",{count:lists.length}))}<section class="training-lists-intro"><div><p class="quiz-kicker">${t("trainingLists.kicker")}</p><h3>${t("trainingLists.introTitle")}</h3><p>${t("trainingLists.introText")}</p></div><div class="training-lists-create-actions"><button type="button" class="primary-button" data-create-training-list="types">${t("trainingLists.createTypes")}</button><button type="button" class="secondary-button" data-create-training-list="pokemon">${t("trainingLists.createPokemon")}</button></div></section><section class="training-lists-favorite-actions"><div><strong>${t("trainingLists.fromFavoritesTitle")}</strong><p>${t("trainingLists.fromFavoritesText")}</p></div><div><button type="button" class="ghost-button" data-create-from-favorites="types" ${favoriteTypeEntries().length?"":"disabled"}>${t("trainingLists.fromTypeFavorites",{count:favoriteTypeEntries().length})}</button><button type="button" class="ghost-button" data-create-from-favorites="pokemon" ${favoritePokemonEntries().length?"":"disabled"}>${t("trainingLists.fromPokemonFavorites",{count:favoritePokemonEntries().length})}</button></div></section>${lists.length?`<div class="training-lists-grid">${lists.map(trainingListCard).join("")}</div>`:`<section class="knowledge-favorites-empty training-lists-empty"><span aria-hidden="true">☷</span><div><strong>${t("trainingLists.emptyTitle")}</strong><p>${t("trainingLists.emptyText")}</p></div></section>`}</section>`;
    bindKnowledgeHome(root);
    root.querySelectorAll("[data-create-training-list]").forEach(button=>button.addEventListener("click",()=>openTrainingListEditor(null,button.dataset.createTrainingList)));
    root.querySelectorAll("[data-create-from-favorites]").forEach(button=>button.addEventListener("click",()=>createTrainingListFromFavorites(button.dataset.createFromFavorites)));
    root.querySelectorAll("[data-training-list-start]").forEach(button=>button.addEventListener("click",()=>openTrainingListLaunch(button.dataset.trainingListStart)));
    root.querySelectorAll("[data-training-list-edit]").forEach(button=>button.addEventListener("click",()=>openTrainingListEditor(button.dataset.trainingListEdit)));
    root.querySelectorAll("[data-training-list-duplicate]").forEach(button=>button.addEventListener("click",()=>duplicateTrainingList(button.dataset.trainingListDuplicate)));
    root.querySelectorAll("[data-training-list-delete]").forEach(button=>button.addEventListener("click",()=>deleteTrainingList(button.dataset.trainingListDelete)));
  }

  function renderKnowledgeRegions() {
    const root=document.getElementById("learnContent");
    const regions=knowledgeFilteredItems("region",QuizmonKnowledgeWorld.REGIONS);
    root.innerHTML=`<section class="knowledge-subpage knowledge-regions-page">${knowledgeSubpageHeader(t("knowledge.regionsTitle"),t("knowledge.regionsCatalogText"),t("knowledge.regionsMeta",{count:regions.length}))}${regions.length?`<div class="knowledge-region-grid">${regions.map(knowledgeRegionCard).join("")}</div>`:knowledgeGenerationEmptyMarkup()}</section>`;
    bindKnowledgeHome(root);bindKnowledgeWorldCatalog(root);
  }

  function renderKnowledgeTrainers() {
    const root=document.getElementById("learnContent");
    const coreTrainers=knowledgeFilteredItems("trainer",QuizmonKnowledgeWorld.TRAINERS.filter(knowledgeTrainerIsCore));
    const allowedIds=new Set(coreTrainers.map(item=>item.id));
    const regions=knowledgeFilteredItems("region",QuizmonKnowledgeWorld.REGIONS);
    const sections=regions.map((region,index)=>{const trainers=[...(QuizmonKnowledgeWorld.TRAINERS_BY_REGION.get(region.id)||[])].filter(item=>allowedIds.has(item.id)).sort(knowledgeTrainerSort);return trainers.length?`<details class="knowledge-trainer-region" ${index===0?"open":""}><summary><span><small>${t("knowledge.generation",{generation:region.generation})}</small><strong>${escapeHtml(knowledgeWorldText(region))}</strong></span><b>${trainers.length}</b></summary><div class="knowledge-trainer-grid">${trainers.map(knowledgeTrainerCard).join("")}</div></details>`:"";}).join("");
    root.innerHTML=`<section class="knowledge-subpage knowledge-trainers-page">${knowledgeSubpageHeader(t("knowledge.trainersTitle"),t("knowledge.trainersCatalogText"),t("knowledge.trainersMeta",{count:coreTrainers.length}))}${coreTrainers.length?`<section class="knowledge-trainer-regions">${sections}</section>`:knowledgeGenerationEmptyMarkup()}</section>`;
    bindKnowledgeHome(root);bindKnowledgeWorldCatalog(root);
  }

  function renderKnowledgeCompetitive() {
    const root=document.getElementById("learnContent");
    const groups=["battle","team","stats","field"].map(group=>{const topics=QuizmonKnowledgeWorld.TOPICS_BY_GROUP.get(group)||[];return `<section class="knowledge-topic-group"><div class="knowledge-section-heading"><div><small>${t("knowledge.competitiveBasics")}</small><h3>${t(`knowledge.competitiveGroup.${group}`)}</h3><p>${t(`knowledge.competitiveGroupText.${group}`)}</p></div></div><div class="knowledge-topic-grid">${topics.map(knowledgeCompetitiveCard).join("")}</div></section>`;}).join("");
    root.innerHTML=`<section class="knowledge-subpage knowledge-competitive-page">${knowledgeSubpageHeader(t("knowledge.competitiveTitle"),t("knowledge.competitiveCatalogText"),t("knowledge.competitiveMeta",{count:QuizmonKnowledgeWorld.COMPETITIVE_TOPICS.length}))}${knowledgeSelectedGeneration()?`<p class="knowledge-generation-type-notice">${t("knowledge.generationFilter.timelessRules")}</p>`:""}${groups}</section>`;
    bindKnowledgeHome(root);bindKnowledgeWorldCatalog(root);
  }

  function renderKnowledge() {
    if(knowledgeView==="search")renderKnowledgeSearchPage();
    else if(knowledgeView==="favorites")renderKnowledgeFavorites();
    else if(knowledgeView==="training-lists")renderKnowledgeTrainingLists();
    else if(knowledgeView==="types")renderKnowledgeTypes();
    else if(knowledgeView==="pokemon")renderKnowledgePokemon();
    else if(knowledgeView==="regions")renderKnowledgeRegions();
    else if(knowledgeView==="trainers")renderKnowledgeTrainers();
    else if(knowledgeView==="competitive")renderKnowledgeCompetitive();
    else if(["moves","abilities","items","evolutions"].includes(knowledgeView))renderKnowledgeContentCatalog(knowledgeView);
    else renderKnowledgeHome();
  }

  function openKnowledgePokemon(id) {
    const item=knowledgePokemonById(id);if(!item)return;
    knowledgePokemonId=item.id;knowledgePokemonDetailTab="overview";knowledgeContentKind=null;knowledgeContentId=null;learnType=null;setRoute("learn-detail");
  }

  function openKnowledgeEntry(kind,id) {
    knowledgeContentKind=kind;
    knowledgeContentId=["region","trainer","competitive"].includes(kind)?String(id):Number(id);
    knowledgePokemonId=null;learnType=null;setRoute("learn-detail");
  }

  function knowledgeStatLabel(key) { return t(`knowledge.stat.${key}`); }

  function knowledgeMetric(value, unit, decimals=1) {
    const numeric=Number(value)||0;
    return `${numeric.toLocaleString(state.language==="de"?"de-DE":"en-US",{minimumFractionDigits:decimals,maximumFractionDigits:decimals})} ${unit}`;
  }

  function knowledgePokemonDescription(item) {
    const types=item.types.map(typeLabel).join(state.language==="de"?" und ":" and ");
    return t(item.types.length>1?"knowledge.descriptionDual":"knowledge.descriptionSingle",{name:knowledgePokemonName(item),types,region:knowledgeRegionLabel(item.generation)});
  }

  function knowledgeItemName(id) { const item=QuizmonKnowledgeContent.ITEM_BY_ID.get(Number(id));return item?knowledgeEntryName(item):""; }
  function knowledgeMoveName(id) { const item=QuizmonKnowledgeContent.MOVE_BY_ID.get(Number(id));return item?knowledgeEntryName(item):""; }

  function knowledgeTypeByApiId(id) {
    return ({1:"normal",2:"fighting",3:"flying",4:"poison",5:"ground",6:"rock",7:"bug",8:"ghost",9:"steel",10:"fire",11:"water",12:"grass",13:"electric",14:"psychic",15:"ice",16:"dragon",17:"dark",18:"fairy"})[Number(id)]||null;
  }

  function knowledgeEvolutionMethodText(method) {
    const parts=[];const trigger=method.trigger||"other";
    if(trigger==="use-item"&&method.trigger_item_id)parts.push(t("knowledge.evo.useItem",{item:knowledgeItemName(method.trigger_item_id)||t("knowledge.evo.item")}));
    else parts.push(t(`knowledge.evo.trigger.${trigger}`));
    if(method.minimum_level!=null)parts.push(t("knowledge.evo.level",{level:method.minimum_level}));
    if(method.gender_id===1)parts.push(t("knowledge.evo.female"));
    if(method.gender_id===2)parts.push(t("knowledge.evo.male"));
    if(method.location)parts.push(t("knowledge.evo.location",{location:method.location[state.language]||method.location.en||method.location.de}));
    if(method.held_item_id)parts.push(t("knowledge.evo.heldItem",{item:knowledgeItemName(method.held_item_id)||t("knowledge.evo.item")}));
    if(method.time)parts.push(t(`knowledge.evo.time.${method.time}`));
    if(method.known_move_id)parts.push(t("knowledge.evo.knownMove",{move:knowledgeMoveName(method.known_move_id)||t("knowledge.evo.move")}));
    {const type=knowledgeTypeByApiId(method.known_move_type_id);if(type)parts.push(t("knowledge.evo.knownType",{type:typeLabel(type)}));}
    if(method.minimum_happiness!=null)parts.push(t("knowledge.evo.friendship"));
    if(method.minimum_beauty!=null)parts.push(t("knowledge.evo.beauty"));
    if(method.minimum_affection!=null)parts.push(t("knowledge.evo.affection"));
    if(method.relative_physical_stats===1)parts.push(t("knowledge.evo.attackHigher"));
    if(method.relative_physical_stats===0)parts.push(t("knowledge.evo.statsEqual"));
    if(method.relative_physical_stats===-1)parts.push(t("knowledge.evo.defenseHigher"));
    if(method.party_species_id){const p=knowledgePokemonById(method.party_species_id);if(p)parts.push(t("knowledge.evo.partyPokemon",{pokemon:knowledgePokemonName(p)}));}
    {const type=knowledgeTypeByApiId(method.party_type_id);if(type)parts.push(t("knowledge.evo.partyType",{type:typeLabel(type)}));}
    if(method.trade_species_id){const p=knowledgePokemonById(method.trade_species_id);if(p)parts.push(t("knowledge.evo.tradePokemon",{pokemon:knowledgePokemonName(p)}));}
    if(method.needs_overworld_rain)parts.push(t("knowledge.evo.rain"));
    if(method.turn_upside_down)parts.push(t("knowledge.evo.upsideDown"));
    if(method.needs_multiplayer)parts.push(t("knowledge.evo.multiplayer"));
    if(method.near_special_rock)parts.push(t("knowledge.evo.specialRock"));
    if(method.used_move_id)parts.push(t("knowledge.evo.useMove",{move:knowledgeMoveName(method.used_move_id)||t("knowledge.evo.move")}));
    if(method.minimum_move_count!=null)parts.push(t("knowledge.evo.moveCount",{count:method.minimum_move_count}));
    if(method.minimum_steps!=null)parts.push(t("knowledge.evo.steps",{count:method.minimum_steps}));
    if(method.minimum_damage_taken!=null)parts.push(t("knowledge.evo.damage",{count:method.minimum_damage_taken}));
    return parts.filter(Boolean).join(" · ");
  }

  function knowledgeEvolutionButton(node) {
    const evolution=node.item;const evolutionName=knowledgePokemonName(evolution);
    return `<button data-evolution-id="${evolution.id}" class="knowledge-evolution-entry ${evolution.id===knowledgePokemonId?"current":""}" aria-label="${escapeHtml(evolutionName)}"><img loading="lazy" src="${escapeHtml(knowledgeArtwork(evolution))}" alt=""><strong>${escapeHtml(evolutionName)}</strong><small>#${String(evolution.id).padStart(4,"0")}</small></button>`;
  }

  function knowledgeEvolutionEdgeMarkup(node) {
    const methods=(node.methods||[]).map(knowledgeEvolutionMethodText).filter(Boolean);
    return `<div class="knowledge-evolution-edge"><span aria-hidden="true">›</span>${methods.length?`<div>${methods.map(text=>`<small>${escapeHtml(text)}</small>`).join("")}</div>`:""}</div>`;
  }

  function knowledgeEvolutionNodeMarkup(node) {
    const children=node.children||[];
    return `<div class="knowledge-evolution-node ${children.length?"has-children":"is-leaf"}">${knowledgeEvolutionButton(node)}${children.length?`<div class="knowledge-evolution-branches ${children.length===1?"single-child":""}">${children.map(child=>`<div class="knowledge-evolution-branch">${knowledgeEvolutionEdgeMarkup(child)}${knowledgeEvolutionNodeMarkup(child)}</div>`).join("")}</div>`:""}</div>`;
  }

  function knowledgeEvolutionMarkup(item, options={}) {
    const tree=QuizmonKnowledge.evolutionTree(item,QuizmonKnowledgeData.BY_ID,QuizmonKnowledgeContent.EVOLUTION_METHODS);
    if(tree.size<=1)return "";
    return `<section class="knowledge-evolution-card ${options.standalone?"standalone":""}"><div class="knowledge-card-head"><span aria-hidden="true">↗</span><div><small>${t("knowledge.evolutionKicker")}</small><h2>${t("knowledge.evolutionTitle")}</h2></div></div><div class="knowledge-evolution-tree">${tree.roots.map(knowledgeEvolutionNodeMarkup).join("")}</div></section>`;
  }

  function knowledgeLearnsetsReady() { return QuizmonKnowledgeLearnsetLoader.isLoaded(); }

  function knowledgeLearnsetDeferredMarkup() {
    const failed=knowledgeLearnsetLoadStatus==="error";
    return `<section class="knowledge-learnset-deferred ${failed?"error":"loading"}" role="status"><span aria-hidden="true">${failed?"!":"↻"}</span><div><small>${t("knowledge.learnsetKicker")}</small><strong>${failed?t("knowledge.learnsetLoadErrorTitle"):t("knowledge.learnsetLoadingTitle")}</strong><p>${failed?t("knowledge.learnsetLoadErrorText"):t("knowledge.learnsetLoadingText")}</p></div>${failed?`<button type="button" class="secondary-button" data-learnset-retry>${t("common.retry")}</button>`:""}</section>`;
  }

  function rerenderLearnsetContext() {
    if(state.route!=="learn-detail")return;
    if(knowledgePokemonId)renderKnowledgePokemonDetail();
    else if(knowledgeContentKind==="move")renderKnowledgeContentDetail();
  }

  function ensureKnowledgeLearnsets() {
    if(knowledgeLearnsetsReady()){knowledgeLearnsetLoadStatus="ready";return Promise.resolve(QuizmonKnowledgeLearnsets);}
    knowledgeLearnsetLoadStatus="loading";
    return QuizmonKnowledgeLearnsetLoader.load().then(api=>{knowledgeLearnsetLoadStatus="ready";rerenderLearnsetContext();return api;}).catch(error=>{knowledgeLearnsetLoadStatus="error";logError(error,"learnsets.load");rerenderLearnsetContext();throw error;});
  }

  function rememberKnowledgeVersionGroup(groupId) {
    const id=Number(groupId);
    if(!QuizmonKnowledgeLearnsets.VERSION_GROUP_BY_ID.has(id))return;
    knowledgeVersionGroupId=id;
    try { sessionStorage.setItem(KNOWLEDGE_VERSION_SESSION_KEY,String(id)); } catch {}
  }

  function knowledgeVersionSelectorMarkup(groups,selectedId) {
    if(!groups?.length)return "";
    if(groups.length===1)return `<div class="knowledge-version-picker single"><span>${t("knowledge.gameLabel")}</span><strong>${escapeHtml(groups[0][state.language]||groups[0].en)}</strong></div>`;
    return `<label class="knowledge-version-picker"><span>${t("knowledge.gameLabel")}</span><select data-knowledge-version aria-label="${escapeHtml(t("knowledge.gameSelectAria"))}">${groups.map(group=>`<option value="${group.id}" ${group.id===selectedId?"selected":""}>${escapeHtml(group[state.language]||group.en)}</option>`).join("")}</select></label>`;
  }

  function knowledgeLearnsetMethodLabel(entry) {
    if(entry.method===QuizmonKnowledgeLearnsets.METHOD.LEVEL)return t("knowledge.learnsetLevelShort",{level:entry.level});
    if(entry.method===QuizmonKnowledgeLearnsets.METHOD.MACHINE)return QuizmonKnowledgeLearnsets.machineLabel(entry.machine,state.language)||t("knowledge.learnsetMachineGeneric");
    if(entry.method===QuizmonKnowledgeLearnsets.METHOD.EGG)return t("knowledge.learnsetEggShort");
    if(entry.method===QuizmonKnowledgeLearnsets.METHOD.TUTOR)return t("knowledge.learnsetTutorShort");
    return t("knowledge.learnsetOtherShort");
  }

  function knowledgeLearnsetMoveButton(entry) {
    const move=QuizmonKnowledgeContent.MOVE_BY_ID.get(entry.moveId);if(!move)return "";
    return `<button class="knowledge-learnset-move" data-open-move="${move.id}" style="--move-color:${TYPE_META[move.type]?.color||"#66a9b8"}"><span class="knowledge-learnset-method">${escapeHtml(knowledgeLearnsetMethodLabel(entry))}</span><span class="knowledge-learnset-name"><strong>${escapeHtml(knowledgeEntryName(move))}</strong><small>${escapeHtml(typeLabel(move.type))} · ${escapeHtml(knowledgeDamageClassLabel(move.damageClass))}</small></span><i aria-hidden="true">›</i></button>`;
  }

  function knowledgeLearnsetGroup(key,items,icon,initialLimit=18) {
    if(!items.length)return "";
    const first=items.slice(0,initialLimit),rest=items.slice(initialLimit);
    const list=entries=>`<div class="knowledge-learnset-list">${entries.map(knowledgeLearnsetMoveButton).join("")}</div>`;
    return `<section class="knowledge-learnset-group"><div class="knowledge-card-head"><span aria-hidden="true">${icon}</span><div><small>${t(`knowledge.learnset.${key}.kicker`)}</small><h2>${t(`knowledge.learnset.${key}.title`)}</h2></div><strong>${items.length}</strong></div>${list(first)}${rest.length?`<details class="knowledge-learnset-more"><summary>${t("knowledge.showMoreMoves",{count:rest.length})}</summary>${list(rest)}</details>`:""}</section>`;
  }

  function knowledgePokemonMovesMarkup(item) {
    if(!knowledgeLearnsetsReady()){if(knowledgeLearnsetLoadStatus!=="loading")ensureKnowledgeLearnsets().catch(()=>{});return knowledgeLearnsetDeferredMarkup();}
    const versionGroups=QuizmonKnowledgeLearnsets.availableGroupsForPokemon(item.id);
    const groupId=QuizmonKnowledgeLearnsets.resolveGroupForPokemon(item.id,knowledgeVersionGroupId);
    if(groupId==null)return "";
    if(groupId!==knowledgeVersionGroupId)rememberKnowledgeVersionGroup(groupId);
    const groups=QuizmonKnowledgeLearnsets.groupPokemonEntries(item.id,groupId);
    return `<section class="knowledge-pokemon-moves"><section class="knowledge-learnset-intro"><div><p class="quiz-kicker">${t("knowledge.learnsetKicker")}</p><h2>${t("knowledge.learnsetTitle")}</h2><p>${t("knowledge.learnsetText")}</p></div>${knowledgeVersionSelectorMarkup(versionGroups,groupId)}</section>${knowledgeLearnsetGroup("level",groups.level,"↗",30)}${knowledgeLearnsetGroup("machine",groups.machine,"TM",12)}${knowledgeLearnsetGroup("egg",groups.egg,"◌",24)}${knowledgeLearnsetGroup("tutor",groups.tutor,"✦",24)}${knowledgeLearnsetGroup("other",groups.other,"＋",24)}</section>`;
  }

  function knowledgeMovePokemonMethods(entries) {
    const labels=[];
    const seen=new Set();
    for(const entry of entries){const label=knowledgeLearnsetMethodLabel({method:entry[1],level:entry[2],machine:entry[3]});if(!seen.has(label)){seen.add(label);labels.push(label);}}
    return labels;
  }

  function knowledgeMovePokemonMarkup(moveId) {
    if(!knowledgeLearnsetsReady()){if(knowledgeLearnsetLoadStatus!=="loading")ensureKnowledgeLearnsets().catch(()=>{});return knowledgeLearnsetDeferredMarkup();}
    const versionGroups=QuizmonKnowledgeLearnsets.availableGroupsForMove(moveId);
    const groupId=QuizmonKnowledgeLearnsets.resolveGroupForMove(moveId,knowledgeVersionGroupId);
    if(groupId==null)return "";
    if(groupId!==knowledgeVersionGroupId)rememberKnowledgeVersionGroup(groupId);
    const grouped=new Map();
    for(const entry of QuizmonKnowledgeLearnsets.entriesForMove(moveId,groupId)){
      const pokemonId=entry[0];if(!grouped.has(pokemonId))grouped.set(pokemonId,[]);grouped.get(pokemonId).push(entry);
    }
    const rows=[...grouped.entries()].map(([pokemonId,entries])=>({pokemon:knowledgePokemonById(pokemonId),methods:knowledgeMovePokemonMethods(entries)})).filter(row=>row.pokemon).sort((a,b)=>a.pokemon.id-b.pokemon.id);
    if(!rows.length)return "";
    const markup=list=>`<div class="knowledge-move-pokemon-list">${list.map(row=>`<button data-open-pokemon="${row.pokemon.id}"><img loading="lazy" src="${escapeHtml(knowledgeArtwork(row.pokemon))}" alt=""><span><strong>${escapeHtml(knowledgePokemonName(row.pokemon))}</strong><small>${row.methods.map(method=>escapeHtml(method)).join(" · ")}</small></span><i aria-hidden="true">›</i></button>`).join("")}</div>`;
    const first=rows.slice(0,18),rest=rows.slice(18);
    return `<section class="knowledge-related-card knowledge-move-pokemon-card"><div class="knowledge-card-head"><span>◉</span><div><small>${t("knowledge.relatedKicker")}</small><h2>${t("knowledge.movePokemonTitle")}</h2><p>${t("knowledge.movePokemonText",{game:QuizmonKnowledgeLearnsets.groupLabel(groupId,state.language)})}</p></div><strong>${rows.length}</strong></div><div class="knowledge-move-version-row">${knowledgeVersionSelectorMarkup(versionGroups,groupId)}</div>${markup(first)}${rest.length?`<details class="knowledge-related-more"><summary>${t("knowledge.morePokemon",{count:rest.length})}</summary>${markup(rest)}</details>`:""}</section>`;
  }

  function knowledgePokemonTabMarkup(item,hasMoves,hasEvolution) {
    const tabs=[{key:"overview",label:t("knowledge.detailTabOverview")}];
    if(hasMoves)tabs.push({key:"moves",label:t("knowledge.detailTabMoves")});
    if(hasEvolution)tabs.push({key:"evolution",label:t("knowledge.detailTabEvolution")});
    if(tabs.length<=1)return "";
    if(!tabs.some(tab=>tab.key===knowledgePokemonDetailTab))knowledgePokemonDetailTab="overview";
    return `<nav class="knowledge-pokemon-tabs" aria-label="${escapeHtml(t("knowledge.detailTabsLabel"))}" style="--tab-count:${tabs.length}">${tabs.map(tab=>`<button class="${knowledgePokemonDetailTab===tab.key?"active":""}" data-pokemon-detail-tab="${tab.key}" aria-current="${knowledgePokemonDetailTab===tab.key?"page":"false"}">${escapeHtml(tab.label)}</button>`).join("")}</nav>`;
  }

  function bindKnowledgeDetailLinks() {
    document.querySelectorAll("[data-detail-type]").forEach(button=>button.addEventListener("click",()=>{learnType=button.dataset.detailType;knowledgePokemonId=null;knowledgeContentKind=null;knowledgeView="types";setRoute("learn-detail");}));
    document.querySelectorAll("[data-evolution-id]").forEach(button=>button.addEventListener("click",()=>{replaceBrowserHistorySnapshot();knowledgePokemonId=Number(button.dataset.evolutionId);knowledgeContentKind=null;knowledgePokemonDetailTab="evolution";renderKnowledgePokemonDetail();pushBrowserHistorySnapshot();view.focus({preventScroll:true});scrollTo({top:0,behavior:motionEnabled()?"smooth":"auto"});}));
    document.querySelectorAll("[data-open-ability]").forEach(button=>button.addEventListener("click",()=>openKnowledgeEntry("ability",button.dataset.openAbility)));
    document.querySelectorAll("[data-open-move]").forEach(button=>button.addEventListener("click",()=>openKnowledgeEntry("move",button.dataset.openMove)));
    document.querySelectorAll("[data-open-pokemon]").forEach(button=>button.addEventListener("click",()=>openKnowledgePokemon(button.dataset.openPokemon)));
    document.querySelectorAll("[data-open-region]").forEach(button=>button.addEventListener("click",()=>openKnowledgeEntry("region",button.dataset.openRegion)));
    document.querySelectorAll("[data-open-trainer]").forEach(button=>button.addEventListener("click",()=>openKnowledgeEntry("trainer",button.dataset.openTrainer)));
    document.querySelectorAll("[data-open-topic]").forEach(button=>button.addEventListener("click",()=>openKnowledgeEntry("competitive",button.dataset.openTopic)));
    document.querySelectorAll("[data-pokemon-detail-tab]").forEach(button=>button.addEventListener("click",()=>{replaceBrowserHistorySnapshot();knowledgePokemonDetailTab=button.dataset.pokemonDetailTab;renderKnowledgePokemonDetail();pushBrowserHistorySnapshot();view.focus({preventScroll:true});}));
    document.querySelectorAll("[data-learnset-retry]").forEach(button=>button.addEventListener("click",()=>{knowledgeLearnsetLoadStatus="idle";button.disabled=true;ensureKnowledgeLearnsets().catch(()=>{});}));
    document.querySelectorAll("[data-knowledge-version]").forEach(select=>select.addEventListener("change",()=>{
      rememberKnowledgeVersionGroup(select.value);
      const y=scrollY;
      if(knowledgePokemonId)renderKnowledgePokemonDetail();
      else if(knowledgeContentKind==="move")renderKnowledgeContentDetail();
      requestAnimationFrame(()=>{scrollTo({top:y,behavior:"auto"});document.querySelector("[data-knowledge-version]")?.focus({preventScroll:true});});
    }));
  }

  function renderKnowledgePokemonDetail() {
    const item=knowledgePokemonById(knowledgePokemonId);if(!item){knowledgePokemonId=null;setRoute("knowledge");return;}
    const name=knowledgePokemonName(item);const evolutionTree=QuizmonKnowledge.evolutionTree(item,QuizmonKnowledgeData.BY_ID,QuizmonKnowledgeContent.EVOLUTION_METHODS);const hasEvolution=evolutionTree.size>1;const hasMoves=QuizmonKnowledgeLearnsets.hasPokemon(item.id);const total=QuizmonKnowledge.baseStatTotal(item);const maxStat=Math.max(180,...QuizmonKnowledge.STAT_KEYS.map(key=>item.stats[key]||0));
    const tabs=knowledgePokemonTabMarkup(item,hasMoves,hasEvolution);
    let content="";
    if(knowledgePokemonDetailTab==="moves"&&hasMoves)content=knowledgePokemonMovesMarkup(item);
    else if(knowledgePokemonDetailTab==="evolution"&&hasEvolution)content=knowledgeEvolutionMarkup(item);
    else {knowledgePokemonDetailTab="overview";content=`<section class="knowledge-detail-grid"><article class="knowledge-fact-card"><div class="knowledge-card-head"><span aria-hidden="true">◇</span><div><small>${t("knowledge.profileKicker")}</small><h2>${t("knowledge.profileTitle")}</h2></div></div><dl><div><dt>${t("knowledge.height")}</dt><dd>${knowledgeMetric(item.height/10,t("knowledge.meter"))}</dd></div><div><dt>${t("knowledge.weight")}</dt><dd>${knowledgeMetric(item.weight/10,t("knowledge.kilogram"))}</dd></div><div><dt>${t("knowledge.region")}</dt><dd>${escapeHtml(knowledgeRegionLabel(item.generation))}</dd></div><div><dt>${t("knowledge.baseTotal")}</dt><dd>${total}</dd></div></dl></article><article class="knowledge-ability-card"><div class="knowledge-card-head"><span aria-hidden="true">✦</span><div><small>${t("knowledge.abilitiesKicker")}</small><h2>${t("knowledge.abilitiesTitle")}</h2></div></div><div class="knowledge-ability-list">${item.abilities.map(ability=>`<button data-open-ability="${ability.id}"><strong>${escapeHtml(ability[state.language]||ability.en||ability.de)}</strong>${ability.hidden?`<small>${t("knowledge.hiddenAbility")}</small>`:""}<i aria-hidden="true">›</i></button>`).join("")||`<p>${t("knowledge.noAbilities")}</p>`}</div></article></section><section class="knowledge-stats-card"><div class="knowledge-card-head"><span aria-hidden="true">▥</span><div><small>${t("knowledge.statsKicker")}</small><h2>${t("knowledge.statsTitle")}</h2></div><strong>${total}</strong></div><div class="knowledge-stat-list">${QuizmonKnowledge.STAT_KEYS.map(key=>`<div><span>${escapeHtml(knowledgeStatLabel(key))}</span><i><b style="width:${Math.min(100,Math.round((item.stats[key]/maxStat)*100))}%"></b></i><strong>${item.stats[key]}</strong></div>`).join("")}</div></section>`;}
    view.innerHTML=`<section class="knowledge-detail-page"><section class="knowledge-pokemon-hero" style="--pokemon-color:${TYPE_META[item.types[0]]?.color||"#66a9b8"}"><div class="knowledge-detail-art"><img src="${escapeHtml(knowledgeArtwork(item))}" alt="${escapeHtml(name)}"><span>#${String(item.id).padStart(4,"0")}</span></div><div class="knowledge-detail-copy"><p class="quiz-kicker">${t("knowledge.pokemonEntry")}</p><h1>${escapeHtml(name)}</h1><div class="knowledge-detail-types">${item.types.map(type=>`<button data-detail-type="${type}">${typeChip(type)}</button>`).join("")}</div><p>${escapeHtml(knowledgePokemonDescription(item))}</p><div class="knowledge-detail-badges"><span>${t("knowledge.generation",{generation:item.generation})}</span><span>${escapeHtml(knowledgeRegionLabel(item.generation))}</span>${item.legendary?`<span>${t("knowledge.legendary")}</span>`:""}${item.mythical?`<span>${t("knowledge.mythical")}</span>`:""}</div></div></section>${tabs}${content}</section>`;
    bindKnowledgeDetailLinks();
  }

  function knowledgeDetailHero(kind,item,icon,accent,extra="") {
    return `<section class="knowledge-entry-hero ${kind}" style="--entry-color:${accent||"#66a9b8"}"><span class="knowledge-entry-hero-icon">${icon}</span><div><p class="quiz-kicker">${t(`knowledge.${kind}Entry`)}</p><h1>${escapeHtml(knowledgeEntryName(item))}</h1>${extra}<p>${escapeHtml(knowledgeEntryEffect(item))}</p><div class="knowledge-detail-badges"><span>${t("knowledge.generation",{generation:item.generation})}</span></div></div></section>`;
  }

  function renderKnowledgeMoveDetail(item) {
    view.innerHTML=`<section class="knowledge-detail-page knowledge-entry-detail">${knowledgeDetailHero("move",item,TYPE_META[item.type]?.icon||"↗",TYPE_META[item.type]?.color,`<button data-detail-type="${item.type}">${typeChip(item.type)}</button>`)}<section class="knowledge-entry-facts"><article><small>${t("knowledge.damageClass")}</small><strong>${escapeHtml(knowledgeDamageClassLabel(item.damageClass))}</strong></article><article><small>${t("knowledge.power")}</small><strong>${item.power??"—"}</strong></article><article><small>${t("knowledge.accuracy")}</small><strong>${item.accuracy==null?"—":`${item.accuracy}%`}</strong></article><article><small>${t("knowledge.pp")}</small><strong>${item.pp??"—"}</strong></article><article><small>${t("knowledge.priority")}</small><strong>${item.priority>0?`+${item.priority}`:item.priority}</strong></article></section><section class="knowledge-effect-card"><div class="knowledge-card-head"><span>◎</span><div><small>${t("knowledge.effectKicker")}</small><h2>${t("knowledge.effectTitle")}</h2></div></div><p>${escapeHtml(knowledgeEntryEffect(item))}</p></section>${knowledgeMovePokemonMarkup(item.id)}</section>`;
    bindKnowledgeDetailLinks();
  }

  function knowledgePokemonLinks(ids,limit=12) {
    const items=(ids||[]).map(knowledgePokemonById).filter(Boolean);const first=items.slice(0,limit),rest=items.slice(limit);
    const markup=list=>`<div class="knowledge-related-pokemon">${list.map(p=>`<button data-open-pokemon="${p.id}"><img loading="lazy" src="${escapeHtml(knowledgeArtwork(p))}" alt=""><strong>${escapeHtml(knowledgePokemonName(p))}</strong></button>`).join("")}</div>`;
    return `${markup(first)}${rest.length?`<details class="knowledge-related-more"><summary>${t("knowledge.morePokemon",{count:rest.length})}</summary>${markup(rest)}</details>`:""}`;
  }

  function renderKnowledgeAbilityDetail(item) {
    view.innerHTML=`<section class="knowledge-detail-page knowledge-entry-detail">${knowledgeDetailHero("ability",item,"✦","#67a9b8")}<section class="knowledge-effect-card"><div class="knowledge-card-head"><span>✦</span><div><small>${t("knowledge.effectKicker")}</small><h2>${t("knowledge.effectTitle")}</h2></div></div><p>${escapeHtml(knowledgeEntryEffect(item))}</p></section><section class="knowledge-related-card"><div class="knowledge-card-head"><span>◉</span><div><small>${t("knowledge.relatedKicker")}</small><h2>${t("knowledge.abilityPokemonTitle")}</h2></div></div>${item.pokemonIds.length?knowledgePokemonLinks(item.pokemonIds):`<p>${t("knowledge.noLinkedPokemon")}</p>`}</section></section>`;
    bindKnowledgeDetailLinks();
  }

  function renderKnowledgeItemDetail(item) {
    const heroIcon=`<img data-image-kind="item" src="${escapeHtml(knowledgeItemArtwork(item))}" alt="">`;
    view.innerHTML=`<section class="knowledge-detail-page knowledge-entry-detail">${knowledgeDetailHero("item",item,heroIcon,"#a78a55")}<section class="knowledge-entry-facts"><article><small>${t("knowledge.category")}</small><strong>${escapeHtml(knowledgePocketLabel(item.pocket))}</strong></article><article><small>${t("knowledge.generationLabel")}</small><strong>${t("knowledge.generation",{generation:item.generation})}</strong></article>${item.flingPower!=null?`<article><small>${t("knowledge.flingPower")}</small><strong>${item.flingPower}</strong></article>`:""}</section><section class="knowledge-effect-card"><div class="knowledge-card-head"><span>◇</span><div><small>${t("knowledge.effectKicker")}</small><h2>${t("knowledge.itemEffectTitle")}</h2></div></div><p>${escapeHtml(knowledgeEntryEffect(item))}</p></section></section>`;
  }

  function renderKnowledgeEvolutionDetail(rootId) {
    const item=knowledgePokemonById(rootId);if(!item){knowledgeContentKind=null;setRoute("knowledge");return;}
    const tree=knowledgeEvolutionMarkup(item,{standalone:true});
    view.innerHTML=`<section class="knowledge-detail-page knowledge-entry-detail"><section class="knowledge-entry-hero evolution" style="--entry-color:#70a28b"><span class="knowledge-entry-hero-icon">⑂</span><div><p class="quiz-kicker">${t("knowledge.evolutionEntry")}</p><h1>${escapeHtml(t("knowledge.familyTitle",{pokemon:knowledgePokemonName(item)}))}</h1><p>${t("knowledge.familyText")}</p><div class="knowledge-detail-badges"><span>${t("knowledge.familyMembers",{count:item.evolutionIds.length})}</span></div></div></section>${tree}</section>`;
    bindKnowledgeDetailLinks();
  }


  function knowledgeRoleOrder(role) { return ({gym:1,captain:1,kahuna:1,elite:2,champion:3,league:4,professor:5,rival:6,legend:7,villain:8})[role]||9; }
  function knowledgeTrainerSort(a,b) {
    const roleDifference=knowledgeRoleOrder(knowledgeTrainerPrimaryRole(a))-knowledgeRoleOrder(knowledgeTrainerPrimaryRole(b));
    if(roleDifference)return roleDifference;
    const orderDifference=(Number.isInteger(a.order)?a.order:999)-(Number.isInteger(b.order)?b.order:999);
    if(orderDifference)return orderDifference;
    const variantDifference=(Number.isInteger(a.orderVariant)?a.orderVariant:0)-(Number.isInteger(b.orderVariant)?b.orderVariant:0);
    return variantDifference || knowledgeWorldText(a).localeCompare(knowledgeWorldText(b),state.language);
  }
  function knowledgeTrainerMiniList(trainers,limit=12) {
    const sorted=[...(trainers||[])].filter(knowledgeTrainerIsCore).sort(knowledgeTrainerSort);const first=sorted.slice(0,limit),rest=sorted.slice(limit);
    const markup=list=>`<div class="knowledge-trainer-grid compact">${list.map(trainer=>{const primaryRole=knowledgeTrainerPrimaryRole(trainer);return `<button class="knowledge-trainer-card" data-open-trainer="${trainer.id}" style="--trainer-color:${knowledgeTrainerPrimaryColor(trainer)}"><span class="knowledge-trainer-avatar" aria-hidden="true">${knowledgeTrainerRoleIcon(trainer)}</span><span class="knowledge-trainer-copy"><strong>${escapeHtml(knowledgeWorldText(trainer))}</strong><small>${primaryRole ? knowledgeRoleLabel(primaryRole) : trainer.roles.map(knowledgeRoleLabel).join(" · ")}</small>${trainer.types?.length?`<span class="knowledge-trainer-types">${trainer.types.map(type=>typeChip(type,"small")).join("")}</span>`:""}</span><i aria-hidden="true">›</i></button>`;}).join("")}</div>`;
    return `${markup(first)}${rest.length?`<details class="knowledge-related-more"><summary>${t("knowledge.moreTrainers",{count:rest.length})}</summary>${markup(rest)}</details>`:""}`;
  }

  function renderKnowledgeRegionDetail(region) {
    const trainers=(QuizmonKnowledgeWorld.TRAINERS_BY_REGION.get(region.id)||[]).filter(knowledgeTrainerIsCore);
    const starters=region.starters.map(knowledgePokemonById).filter(Boolean);
    view.innerHTML=`<section class="knowledge-detail-page knowledge-world-detail"><section class="knowledge-region-hero" style="--region-color:${escapeHtml(region.accent)}"><span class="knowledge-region-emblem">${region.generation}</span><div><p class="quiz-kicker">${t("knowledge.regionEntry")}</p><h1>${escapeHtml(knowledgeWorldText(region))}</h1><p>${escapeHtml(knowledgeWorldText(region.summary))}</p><div class="knowledge-detail-badges"><span>${t("knowledge.generation",{generation:region.generation})}</span><span>${t("knowledge.leagueLabel")}: ${escapeHtml(knowledgeWorldText(region.league))}</span></div></div></section><section class="knowledge-world-two-column"><article class="knowledge-world-card"><div class="knowledge-card-head"><span>◉</span><div><small>${t("knowledge.regionStarterKicker")}</small><h2>${t("knowledge.regionStarterTitle")}</h2></div></div>${knowledgePokemonLinks(starters.map(item=>item.id),3)}</article><article class="knowledge-world-card"><div class="knowledge-card-head"><span>⌖</span><div><small>${t("knowledge.regionPlacesKicker")}</small><h2>${t("knowledge.regionPlacesTitle")}</h2></div></div><ul class="knowledge-place-list">${region.locations.map(place=>`<li>${escapeHtml(knowledgeWorldText(place))}</li>`).join("")}</ul></article></section><section class="knowledge-world-card"><div class="knowledge-card-head"><span>✦</span><div><small>${t("knowledge.regionTraitsKicker")}</small><h2>${t("knowledge.regionTraitsTitle")}</h2></div></div><ul class="knowledge-trait-list">${(region.traits?.[state.language]||region.traits?.de||[]).map(value=>`<li>${escapeHtml(value)}</li>`).join("")}</ul></section><section class="knowledge-world-card"><div class="knowledge-card-head"><span>♛</span><div><small>${t("knowledge.regionTrainersKicker")}</small><h2>${t("knowledge.regionTrainersTitle")}</h2></div><strong>${trainers.length}</strong></div>${knowledgeTrainerMiniList(trainers,12)}</section></section>`;
    bindKnowledgeDetailLinks();
  }

  function renderKnowledgeTrainerDetail(trainer) {
    const region=knowledgeRegionById(trainer.region);const team=knowledgeTrainerTeam(trainer);
    const specialty=trainer.types?.length?trainer.types.map(typeLabel).join(state.language==="de"?" · ":" · "):t("knowledge.noFixedType");
    const primaryRole=knowledgeTrainerPrimaryRole(trainer);
    const teamMarkup=team.length?`<div class="knowledge-related-pokemon trainer-team">${team.map(entry=>`<button data-open-pokemon="${entry.pokemon.id}"><img loading="lazy" src="${escapeHtml(knowledgeArtwork(entry.pokemon))}" alt=""><strong>${escapeHtml(knowledgePokemonName(entry.pokemon))}</strong>${entry.form ? `<span>${escapeHtml(knowledgeWorldText(entry.form))}</span>` : ""}${entry.level != null ? `<small>${escapeHtml(t("knowledge.learnsetLevelShort",{level:entry.level}))}</small>` : ""}</button>`).join("")}</div>`:"";
    const teamSource=knowledgeWorldText(trainer.teamSource);
    view.innerHTML=`<section class="knowledge-detail-page knowledge-world-detail"><section class="knowledge-trainer-hero" style="--trainer-color:${knowledgeTrainerPrimaryColor(trainer)}"><span class="knowledge-trainer-hero-avatar" aria-hidden="true">${knowledgeTrainerRoleIcon(trainer)}</span><div><p class="quiz-kicker">${t("knowledge.trainerEntry")}</p><h1>${escapeHtml(knowledgeWorldText(trainer))}</h1><div class="knowledge-trainer-role-row">${knowledgeRoleMarkup(primaryRole ? [primaryRole] : trainer.roles)}</div><p>${escapeHtml(knowledgeTrainerDescription(trainer))}</p>${trainer.types?.length?`<div class="knowledge-detail-types">${trainer.types.map(type=>`<button data-detail-type="${type}">${typeChip(type)}</button>`).join("")}</div>`:""}</div></section><section class="knowledge-entry-facts"><article><small>${t("knowledge.region")}</small><strong>${escapeHtml(knowledgeWorldText(region))}</strong></article><article><small>${t("knowledge.trainerRole")}</small><strong>${escapeHtml(primaryRole ? knowledgeRoleLabel(primaryRole) : trainer.roles.map(knowledgeRoleLabel).join(" · "))}</strong></article><article><small>${t("knowledge.location")}</small><strong>${escapeHtml(knowledgeWorldText(trainer.location)||knowledgeWorldText(region))}</strong></article><article><small>${t("knowledge.specialty")}</small><strong>${escapeHtml(specialty)}</strong></article></section>${team.length?`<section class="knowledge-world-card"><div class="knowledge-card-head"><span>◉</span><div><small>${t("knowledge.signaturePokemonKicker")}</small><h2>${t("knowledge.signaturePokemonTitle")}</h2></div><strong>${team.length}</strong></div>${teamSource?`<p class="knowledge-team-source">${escapeHtml(t("knowledge.teamSourceLabel",{source:teamSource}))}</p>`:""}${teamMarkup}</section>`:""}<section class="knowledge-world-link-card"><button data-open-region="${region.id}"><span>⌘</span><div><small>${t("knowledge.relatedRegion")}</small><strong>${escapeHtml(knowledgeWorldText(region))}</strong></div><i>›</i></button></section></section>`;
    bindKnowledgeDetailLinks();
  }

  function renderKnowledgeCompetitiveDetail(topic) {
    const related=(topic.related||[]).map(knowledgeTopicById).filter(Boolean);
    view.innerHTML=`<section class="knowledge-detail-page knowledge-world-detail"><section class="knowledge-topic-hero"><span>${knowledgeCompetitiveIcon(topic.group)}</span><div><p class="quiz-kicker">${t(`knowledge.competitiveGroup.${topic.group}`)}</p><h1>${escapeHtml(knowledgeWorldText(topic))}</h1><p>${escapeHtml(knowledgeWorldText(topic.summary))}</p></div></section><section class="knowledge-world-card knowledge-topic-why"><div class="knowledge-card-head"><span>?</span><div><small>${t("knowledge.competitiveWhyKicker")}</small><h2>${t("knowledge.competitiveWhyTitle")}</h2></div></div><p>${escapeHtml(knowledgeWorldText(topic.why))}</p></section><section class="knowledge-world-card"><div class="knowledge-card-head"><span>✓</span><div><small>${t("knowledge.competitiveStepsKicker")}</small><h2>${t("knowledge.competitiveStepsTitle")}</h2></div></div><ol class="knowledge-topic-steps">${(topic.steps?.[state.language]||topic.steps?.de||[]).map(step=>`<li>${escapeHtml(step)}</li>`).join("")}</ol></section><section class="knowledge-topic-example"><small>${t("knowledge.competitiveExampleKicker")}</small><strong>${t("knowledge.competitiveExampleTitle")}</strong><p>${escapeHtml(knowledgeWorldText(topic.example))}</p></section>${related.length?`<section class="knowledge-world-card"><div class="knowledge-card-head"><span>↗</span><div><small>${t("knowledge.relatedKicker")}</small><h2>${t("knowledge.relatedTopics")}</h2></div></div><div class="knowledge-related-topics">${related.map(item=>`<button data-open-topic="${item.id}"><span>${knowledgeCompetitiveIcon(item.group)}</span><strong>${escapeHtml(knowledgeWorldText(item))}</strong><i>›</i></button>`).join("")}</div></section>`:""}</section>`;
    bindKnowledgeDetailLinks();
  }

  function renderKnowledgeContentDetail() {
    if(knowledgeContentKind==="move"){const item=QuizmonKnowledgeContent.MOVE_BY_ID.get(knowledgeContentId);if(item)return renderKnowledgeMoveDetail(item);}
    if(knowledgeContentKind==="ability"){const item=QuizmonKnowledgeContent.ABILITY_BY_ID.get(knowledgeContentId);if(item)return renderKnowledgeAbilityDetail(item);}
    if(knowledgeContentKind==="item"){const item=QuizmonKnowledgeContent.ITEM_BY_ID.get(knowledgeContentId);if(item)return renderKnowledgeItemDetail(item);}
    if(knowledgeContentKind==="evolution")return renderKnowledgeEvolutionDetail(knowledgeContentId);
    if(knowledgeContentKind==="region"){const item=knowledgeRegionById(knowledgeContentId);if(item)return renderKnowledgeRegionDetail(item);}
    if(knowledgeContentKind==="trainer"){const item=knowledgeTrainerById(knowledgeContentId);if(item)return renderKnowledgeTrainerDetail(item);}
    if(knowledgeContentKind==="competitive"){const item=knowledgeTopicById(knowledgeContentId);if(item)return renderKnowledgeCompetitiveDetail(item);}
    knowledgeContentKind=null;setRoute("knowledge");
  }


  function groupByMultiplier(types,resolver){const groups={0:[],0.5:[],1:[],2:[]};types.forEach(type=>{const value=resolver(type);if(!groups[value])groups[value]=[];groups[value].push(type);});return groups;}
  function renderLearnDetail() {
    if(knowledgeContentKind){renderKnowledgeContentDetail();attachKnowledgeDetailSearchLauncher();return;}
    if(knowledgePokemonId){renderKnowledgePokemonDetail();attachKnowledgeDetailSearchLauncher();return;}
    if(!learnType){setRoute("knowledge");return;}
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
    attachKnowledgeDetailSearchLauncher();
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
  function learningAreaMeta(key) {
    const [role, value] = String(key).split(":");
    if (role === "skill") {
      const skillKeys = {
        effectiveness: "learning.skill.effectiveness",
        multiplier: "learning.skill.multiplier",
        impact: "learning.skill.impact",
        pokemon: "learning.skill.pokemon",
        dual: "learning.skill.dual"
      };
      return { key, role, value, label: t(skillKeys[value] || "learning.skill.effectiveness"), type: null };
    }
    const roleKeys = {
      attack: "learning.role.attack",
      defense: "learning.role.defense",
      pokemon: "learning.role.pokemon",
      type: "learning.role.overall"
    };
    return { key, role, value, label: `${typeLabel(value)} · ${t(roleKeys[role])}`, type: value };
  }

  function learningMistakeMatchesKey(item, key) {
    const [role, value] = String(key).split(":");
    const spec = item?.spec || {};
    if (role === "skill") {
      if (value === "dual") return (spec.defendingTypes || spec.pokemon?.types || []).length === 2;
      return spec.kind === value;
    }
    if (role === "attack") return spec.attackingType === value || (spec.kind === "multiplier" && (item?.lastAnswer?.[value] != null));
    if (role === "defense") return (spec.defendingTypes || []).includes(value) || (spec.kind === "effectiveness" && (spec.options || []).includes(value));
    if (role === "pokemon") return (spec.pokemon?.types || []).includes(value);
    return (spec.focusTypes || []).includes(value) || spec.attackingType === value || (spec.defendingTypes || []).includes(value) || (spec.pokemon?.types || []).includes(value);
  }

  function learningOpenMistakesFor(key) {
    return state.stats.mistakes.filter(item => item.status !== "resolved" && learningMistakeMatchesKey(item, key)).length;
  }

  function learningResolvedMistakesFor(key) {
    return state.stats.mistakes.filter(item => item.status === "resolved" && learningMistakeMatchesKey(item, key)).length;
  }

  function learningDaysSince(value) {
    const timestamp = new Date(value || "").getTime();
    if (!Number.isFinite(timestamp)) return Infinity;
    return Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
  }

  function learningConfidence(total, legacy = false) {
    const id = QuizmonLearning.confidenceId(total, legacy);
    return { id, rank: QuizmonLearning.confidenceRank(id), label: t(`learning.confidence.${id}`) };
  }

  function learningStatus(score, total, trend, openMistakes) {
    return QuizmonLearning.status(score, total, trend, openMistakes);
  }

  function summarizeDetailedLearningArea(key, entries) {
    const sorted = [...entries].sort((a, b) => new Date(a.at) - new Date(b.at));
    const now = Date.now();
    let weightedTotal = 0;
    let weightedScore = 0;
    sorted.forEach(entry => {
      const ageDays = Math.max(0, (now - new Date(entry.at).getTime()) / 86400000);
      const ageWeight = ageDays <= 14 ? 1 : ageDays <= 45 ? .86 : .72;
      const reviewWeight = entry.review ? .82 : 1;
      const weight = ageWeight * reviewWeight;
      weightedTotal += weight;
      weightedScore += entry.score * weight;
    });
    const score = weightedTotal ? weightedScore / weightedTotal : 0;
    const windowSize = Math.min(6, Math.floor(sorted.length / 2));
    let trend = "same";
    let recentScore = score;
    let previousScore = score;
    if (windowSize >= 3) {
      const recent = sorted.slice(-windowSize);
      const previous = sorted.slice(-(windowSize * 2), -windowSize);
      recentScore = recent.reduce((sum, item) => sum + item.score, 0) / recent.length;
      previousScore = previous.reduce((sum, item) => sum + item.score, 0) / previous.length;
      if (recentScore >= previousScore + .10) trend = "up";
      else if (recentScore <= previousScore - .10) trend = "down";
    }
    const openMistakes = learningOpenMistakesFor(key);
    const resolvedMistakes = learningResolvedMistakesFor(key);
    const confidence = learningConfidence(sorted.length, false);
    const lastSeen = sorted.at(-1)?.at || null;
    return {
      ...learningAreaMeta(key),
      total: sorted.length,
      score,
      rate: Math.round(score * 100),
      recentScore,
      previousScore,
      trendDelta: Math.round((recentScore - previousScore) * 100),
      trend,
      openMistakes,
      resolvedMistakes,
      confidence,
      status: learningStatus(score, sorted.length, trend, openMistakes),
      lastSeen,
      daysSince: learningDaysSince(lastSeen),
      recentExposure: sorted.filter(item => now - new Date(item.at).getTime() <= 14 * 86400000).length,
      legacy: false
    };
  }

  function summarizeLegacyLearningArea(key, stats, recent = []) {
    const total = finiteNonNegative(stats?.total);
    const rate = percent(finiteNonNegative(stats?.correct), total);
    const recentValues = Array.isArray(recent) ? recent.map(Boolean) : [];
    const recentRate = recentValues.length ? percent(recentValues.filter(Boolean).length, recentValues.length) : rate;
    const trend = recentValues.length >= 5 && recentRate >= rate + 10 ? "up" : recentValues.length >= 5 && recentRate <= rate - 10 ? "down" : "same";
    const score = rate / 100;
    const openMistakes = learningOpenMistakesFor(key);
    const resolvedMistakes = learningResolvedMistakesFor(key);
    const lastSeen = stats?.lastSeen || null;
    return {
      ...learningAreaMeta(key),
      total,
      score,
      rate,
      recentScore: recentRate / 100,
      previousScore: score,
      trendDelta: recentRate - rate,
      trend,
      openMistakes,
      resolvedMistakes,
      confidence: learningConfidence(total, true),
      status: learningStatus(score, total, trend, openMistakes),
      lastSeen,
      daysSince: learningDaysSince(lastSeen),
      recentExposure: recentValues.length,
      legacy: true
    };
  }

  function getLearningProfile() {
    const buckets = new Map();
    const events = sanitizeLearningEvents(state.stats.learning?.events);
    events.forEach(event => event.observations.forEach(observation => {
      if (!buckets.has(observation.key)) buckets.set(observation.key, []);
      buckets.get(observation.key).push({ score: observation.score, at: event.at, review: event.review });
    }));
    const detailedAreas = [...buckets.entries()].map(([key, entries]) => summarizeDetailedLearningArea(key, entries));
    const detailedByKey = new Map(detailedAreas.map(area => [area.key, area]));
    const areas = [...detailedAreas];

    TYPES.forEach(type => {
      const hasDetailedRole = ["attack", "defense", "pokemon"].some(role => (detailedByKey.get(`${role}:${type}`)?.total || 0) >= 3);
      const stats = state.stats.types[type];
      if (!hasDetailedRole && stats.total >= 3) areas.push(summarizeLegacyLearningArea(`type:${type}`, stats, stats.recent));
    });

    const legacySkills = {
      effectiveness: state.stats.modes.effectiveness,
      multiplier: state.stats.modes.multiplier,
      impact: state.stats.modes.impact,
      pokemon: state.stats.modes.pokemon
    };
    Object.entries(legacySkills).forEach(([skill, stats]) => {
      if ((detailedByKey.get(`skill:${skill}`)?.total || 0) < 3 && stats.total >= 3) {
        areas.push(summarizeLegacyLearningArea(`skill:${skill}`, stats));
      }
    });

    const evaluated = areas.filter(area => area.total >= 3);
    const strengths = evaluated.filter(area => ["strong", "stable"].includes(area.status))
      .sort((a, b) => b.score - a.score || b.confidence.rank - a.confidence.rank || b.total - a.total);
    const needs = evaluated.filter(area => area.status === "need")
      .map(area => ({ ...area, priority: QuizmonLearning.recommendationPriority(area) }))
      .sort((a, b) => b.priority - a.priority || a.score - b.score || b.total - a.total);
    const improving = evaluated.filter(area => area.trend === "up")
      .sort((a, b) => b.trendDelta - a.trendDelta || b.total - a.total)
      .map(area => ({ ...area, displayStatus: "improving" }));
    const declining = evaluated.filter(area => area.trend === "down")
      .sort((a, b) => a.trendDelta - b.trendDelta || a.score - b.score);
    const developing = evaluated.filter(area => area.trend === "up" || ["improving", "developing"].includes(area.status))
      .sort((a, b) => (a.trend === "up" ? -1 : 1) - (b.trend === "up" ? -1 : 1) || b.total - a.total)
      .map(area => area.trend === "up" ? { ...area, displayStatus: "improving" } : area);
    const staleStrengths = strengths.filter(area => area.daysSince >= 14)
      .sort((a, b) => b.daysSince - a.daysSince || b.score - a.score);
    const assessedTypes = TYPES.filter(type => areas.some(area => area.type === type && area.total >= 3)).length;
    const unassessedTypeList = TYPES.filter(type => !areas.some(area => area.type === type && area.total >= 3));
    const detailedCount = events.length;
    const stage = detailedCount < 5 ? "initial" : detailedCount < 15 ? "growing" : detailedCount < 40 ? "solid" : "reliable";
    return {
      events,
      areas,
      evaluated,
      strengths,
      needs,
      improving,
      declining,
      developing,
      staleStrengths,
      assessedTypes,
      unassessedTypes: Math.max(0, TYPES.length - assessedTypes),
      unassessedTypeList,
      detailedCount,
      stage,
      legacyUsed: areas.some(area => area.legacy)
    };
  }

  function learningAreaForKey(profile, key) {
    return profile?.areas?.find(area => area.key === key) || null;
  }

  function learningAreaFallback(key) {
    const meta = learningAreaMeta(key);
    return { ...meta, total:0, score:0, rate:0, trend:"same", trendDelta:0, openMistakes:learningOpenMistakesFor(key), resolvedMistakes:learningResolvedMistakesFor(key), daysSince:Infinity, recentExposure:0, confidence:learningConfidence(0), status:"unassessed", legacy:false };
  }

  const ADAPTIVE_DIFFICULTIES = ["easy","medium","hard"];
  const DIFFICULTY_TIME_BENCHMARKS = Object.freeze({ effectiveness:12000, multiplier:50000, impact:12000, pokemon:12000 });

  function difficultyKindForArea(area) {
    if (area?.role === "pokemon" || area?.value === "pokemon") return "pokemon";
    if (area?.role === "defense" || area?.value === "multiplier" || area?.value === "dual") return "multiplier";
    if (area?.value === "impact") return "impact";
    return "effectiveness";
  }

  function difficultyEventsFor(key, kind) {
    return sanitizeLearningEvents(state.stats.learning?.events).filter(event => {
      if (kind && event.kind !== kind) return false;
      return event.observations.some(observation => observation.key === key);
    }).slice(-10);
  }

  function difficultySpeedSignal(key, kind) {
    const durations = difficultyEventsFor(key,kind).map(event => Number(event.duration || 0));
    return QuizmonDifficulty.speedSignal(durations, DIFFICULTY_TIME_BENCHMARKS[kind] || 15000);
  }

  function personalDifficultyForArea(area, kind = difficultyKindForArea(area)) {
    const safeArea = area || learningAreaFallback("skill:effectiveness");
    const total = Math.max(0,Number(safeArea.total || 0));
    const confidenceRank = Math.max(0,Number(safeArea.confidence?.rank || 0));
    const longScore = clampScore(safeArea.score);
    const recentScore = Number.isFinite(safeArea.recentScore) ? clampScore(safeArea.recentScore) : longScore;
    const speed = difficultySpeedSignal(safeArea.key,kind);
    let modelScore = longScore * .62 + recentScore * .28 + speed.value * .10;
    if (safeArea.trend === "up") modelScore += .04;
    if (safeArea.trend === "down") modelScore -= .08;
    modelScore -= Math.min(.16,Math.max(0,Number(safeArea.openMistakes || 0)) * .055);
    modelScore = clampScore(modelScore);

    let level = "medium";
    let reason = "developing";
    let calibrating = confidenceRank < 2 || total < 6;
    const complexKind = ["multiplier","impact"].includes(kind);
    const hardThreshold = complexKind ? .87 : .84;

    if (total < 3) {
      level = "easy";
      reason = "insufficient";
      calibrating = true;
    } else if (safeArea.trend === "down" && modelScore < .74) {
      level = "easy";
      reason = "declining";
    } else if (Number(safeArea.openMistakes || 0) >= 2 || modelScore < .60) {
      level = "easy";
      reason = Number(safeArea.openMistakes || 0) >= 2 ? "mistakes" : "practice";
    } else if (total >= 8 && confidenceRank >= 2 && modelScore >= hardThreshold && Number(safeArea.openMistakes || 0) === 0 && safeArea.trend !== "down") {
      level = "hard";
      reason = speed.known && speed.value >= .78 ? "secureFast" : "secure";
      calibrating = false;
    } else {
      level = "medium";
      reason = safeArea.trend === "up" ? "improving" : safeArea.status === "stable" ? "stable" : "developing";
    }

    if (safeArea.legacy && level === "hard") {
      level = "medium";
      reason = "legacy";
      calibrating = true;
    }
    if (total < 6 && level === "hard") level = "medium";
    return { level, reason, calibrating, modelScore, speedKnown:speed.known, speedAverage:speed.average, total, confidenceRank, kind };
  }

  function adaptiveDifficultyProfile(profile = getLearningProfile()) {
    const entries = profile.evaluated.map(area => ({ area, ...personalDifficultyForArea(area) }));
    const counts = { easy:0, medium:0, hard:0 };
    entries.forEach(item => { counts[item.level] += 1; });
    return { entries, counts, calibrating:entries.filter(item => item.calibrating).length, unassessed:profile.unassessedTypes };
  }

  function smartDifficultyForSpec(area, kind) {
    return personalDifficultyForArea(area || learningAreaFallback(`skill:${kind === "pokemon" ? "pokemon" : kind}`),kind);
  }

  function smartDefenseForDifficulty(area, level, random = Math.random) {
    if (area?.value === "dual") return "dual";
    if (level === "easy") return "single";
    if (level === "hard") return "dual";
    return random() < .55 ? "single" : "dual";
  }

  function shiftedDifficulty(level, offset = 0) { return QuizmonDifficulty.shiftedDifficulty(level, offset, ADAPTIVE_DIFFICULTIES); }

  function smartActualDifficultyCounts(answers = []) {
    const counts = { easy:0, medium:0, hard:0 };
    (Array.isArray(answers)?answers:[]).forEach(answer=>{
      if (Object.hasOwn(counts,answer?.difficulty)) counts[answer.difficulty]+=1;
    });
    return counts;
  }

  function smartAdjustmentCounts(adjustments = []) {
    const counts = { up:0, down:0, steady:0 };
    (Array.isArray(adjustments)?adjustments:[]).forEach(item=>{
      if (Object.hasOwn(counts,item?.direction)) counts[item.direction]+=1;
    });
    return counts;
  }

  function smartAnswerQuality(answer) {
    let quality=clampScore(Number.isFinite(answer?.focusScore)?answer.focusScore:Number(Boolean(answer?.correct)));
    if (!answer?.correct) return quality;
    const benchmark=DIFFICULTY_TIME_BENCHMARKS[answer.kind]||15000;
    const duration=Number(answer.duration||0);
    if (duration>benchmark*1.65) quality=Math.min(quality,.68);
    else if (duration>benchmark*1.20) quality=Math.min(quality,.82);
    return quality;
  }

  function smartSpecAtDifficulty(original, level, attempt = 0, random = Math.random) {
    const profile=getLearningProfile();
    const focusKey=original?._smartFocusKey||smartFocusKeyForSpec(original);
    const area=learningAreaForKey(profile,focusKey)||learningAreaFallback(focusKey);
    const type=area?.type||(TYPES.includes(area?.value)?area.value:null);
    const kind=original?.kind||difficultyKindForArea(area);
    const defense=smartDefenseForDifficulty(area,level,random);
    let spec;
    if(kind==="effectiveness")spec=generateEffectivenessSpec({focusType:type,difficulty:level,kind:original?.questionKind||"mixed",random});
    else if(kind==="multiplier")spec=generateMultiplierSpec({focusType:type,difficulty:level,defense,random});
    else if(kind==="impact")spec=generateImpactSpec({focusType:type,difficulty:level,defense,random});
    else spec=smartPokemonSpec(type,random,level);
    const decorated=decorateSmartSpec(spec,area,original?._smartSource||"balance");
    return {
      ...decorated,
      _smartFocusKey:focusKey,
      _smartLabel:original?._smartLabel||decorated._smartLabel,
      _smartSource:original?._smartSource||decorated._smartSource,
      _smartBaseDifficulty:original?._smartBaseDifficulty||original?._smartDifficulty||level,
      _smartDifficulty:level,
      _smartDifficultyReason:original?._smartDifficultyReason||decorated._smartDifficultyReason,
      _smartDifficultyCalibrating:Boolean(original?._smartDifficultyCalibrating),
      _smartSessionAdjustment:null,
      _smartRegeneratedAttempt:attempt
    };
  }

  function regenerateSmartUpcomingBlock(offset, direction) {
    if(!["weak","problem"].includes(session?.mode)||!Array.isArray(session.sequence))return 0;
    const start=session.index+1;
    const end=Math.min(session.sequence.length,start+3);
    if(start>=end)return 0;
    const reserved=new Set(session.sequence.map((spec,index)=>index<start||index>=end?questionSignature(spec):null).filter(Boolean));
    session.usedSignatures.forEach(signature=>reserved.add(signature));
    let changed=0;
    for(let index=start;index<end;index+=1){
      const original=session.sequence[index];
      if(!original||original._smartSource==="mistake")continue;
      const base=original._smartBaseDifficulty||original._smartDifficulty||"medium";
      const target=shiftedDifficulty(base,offset);
      if(target===original._smartDifficulty&&original._smartSessionAdjustment===(offset>0?"up":offset<0?"down":null))continue;
      let replacement=null;
      for(let attempt=0;attempt<36;attempt+=1){
        const pattern=session.mode==="problem"?errorPatternByKey(session.problemPlan?.patternKey):null;
        const candidate=pattern?problemSpecForPattern(pattern,target,index,Math.random):smartSpecAtDifficulty(original,target,attempt,Math.random);
        candidate._smartBaseDifficulty=original?._smartBaseDifficulty||original?._smartDifficulty||target;
        candidate._smartSessionAdjustment=offset>0?"up":offset<0?"down":null;
        const signature=questionSignature(candidate);
        if(!reserved.has(signature)){replacement=candidate;reserved.add(signature);break;}
      }
      if(replacement){session.sequence[index]=replacement;changed+=1;}
    }
    const counts={easy:0,medium:0,hard:0};
    session.sequence.forEach(spec=>{if(Object.hasOwn(counts,spec?._smartDifficulty))counts[spec._smartDifficulty]+=1;});
    if(session.smartPlan){session.smartPlan.difficultyCounts=counts;session.smartPlan.primaryDifficulty=ADAPTIVE_DIFFICULTIES.reduce((best,level)=>counts[level]>counts[best]?level:best,"medium");}
    if(session.problemPlan)session.problemPlan.difficultyCounts=counts;
    return changed;
  }

  function maybeAdjustSmartTrainingDuringSession() {
    if(!ADAPTIVE_SESSION_MODES.includes(session?.mode)||!session.adaptiveFlow||!Array.isArray(session.sequence))return null;
    const flow=session.adaptiveFlow;
    if(session.answers.length-flow.lastChecked<3)return null;
    const window=session.answers.slice(flow.lastChecked,flow.lastChecked+3);
    flow.lastChecked+=window.length;
    if(window.length<3)return null;
    const qualities=window.map(smartAnswerQuality);
    const average=qualities.reduce((sum,value)=>sum+value,0)/qualities.length;
    const weakAnswers=qualities.filter(value=>value<.5).length;
    let direction="steady";
    if(average>=.88&&weakAnswers===0)direction="up";
    else if(average<=.50||weakAnswers>=2)direction="down";
    const previousOffset=Number(flow.offset||0);
    const nextOffset=direction==="up"?Math.min(1,previousOffset+1):direction==="down"?Math.max(-1,previousOffset-1):previousOffset;
    const changed=nextOffset!==previousOffset;
    flow.offset=nextOffset;
    const changedQuestions=(nextOffset!==0||changed)?regenerateSmartUpcomingBlock(nextOffset,direction):0;
    const adjustment={
      atQuestion:session.answers.length,
      direction:changed?direction:"steady",
      signal:direction,
      average:Math.round(average*100),
      fromOffset:previousOffset,
      toOffset:nextOffset,
      changedQuestions
    };
    flow.adjustments.push(adjustment);
    flow.adjustments=flow.adjustments.slice(-8);
    return changed&&changedQuestions?adjustment:null;
  }

  function adaptiveUpdateMarkup(update) {
    if(!update||!["up","down"].includes(update.direction))return"";
    const up=update.direction==="up";
    return `<div class="adaptive-live-update ${update.direction}"><span aria-hidden="true">${up?"↗":"↘"}</span><div><strong>${t(up?"difficulty.liveRaisedTitle":"difficulty.liveLoweredTitle")}</strong><p>${t(up?"difficulty.liveRaisedText":"difficulty.liveLoweredText")}</p></div></div>`;
  }

  function adaptiveSessionSummaryMarkup() {
    if(!ADAPTIVE_SESSION_MODES.includes(session?.mode))return"";
    const adjustments=session.adaptiveFlow?.adjustments||[];
    const counts=smartAdjustmentCounts(adjustments);
    const changed=counts.up+counts.down;
    if(!changed)return"";
    const kind=counts.up&&counts.down?"mixed":counts.up?"up":"down";
    const title=t(kind==="up"?"difficulty.summaryRaisedTitle":kind==="down"?"difficulty.summaryLoweredTitle":"difficulty.summaryMixedTitle");
    const text=t(kind==="up"?"difficulty.summaryRaisedText":kind==="down"?"difficulty.summaryLoweredText":"difficulty.summaryMixedText");
    return `<section class="summary-adaptive-card compact ${kind}"><div class="summary-adaptive-head"><span aria-hidden="true">${kind==="up"?"↗":kind==="down"?"↘":"↕"}</span><div><p class="quiz-kicker">${t("difficulty.summaryKicker")}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p></div></div></section>`;
  }

  function smartRecommendation(profile = getLearningProfile()) {
    const openMistakes = state.stats.mistakes.filter(item => item?.status !== "resolved" && item?.spec).length;
    if (profile.detailedCount < 8 || profile.evaluated.length < 2) {
      return { kind:"discovery", icon:"◎", area:null, title:t("smart.discoveryTitle"), text:t("smart.discoveryText"), shortText:t("smart.discoveryShort") };
    }
    if (profile.needs[0]) {
      const area = profile.needs[0];
      return { kind:"need", icon:"↗", area, title:t("smart.needTitle",{area:area.label}), text:t("smart.needText",{area:area.label}), shortText:t("smart.needShort",{area:area.label}) };
    }
    if (openMistakes) {
      return { kind:"mistakes", icon:"↻", area:null, title:t("smart.mistakeTitle",{count:openMistakes}), text:t("smart.mistakeText"), shortText:t("smart.mistakeShort",{count:openMistakes}) };
    }
    if (profile.declining[0]) {
      const area = profile.declining[0];
      return { kind:"declining", icon:"◇", area, title:t("smart.decliningTitle",{area:area.label}), text:t("smart.decliningText",{area:area.label}), shortText:t("smart.decliningShort",{area:area.label}) };
    }
    if (profile.improving[0]) {
      const area = profile.improving[0];
      return { kind:"confirm", icon:"↑", area, title:t("smart.confirmTitle",{area:area.label}), text:t("smart.confirmText",{area:area.label}), shortText:t("smart.confirmShort",{area:area.label}) };
    }
    if (profile.staleStrengths[0]) {
      const area = profile.staleStrengths[0];
      return { kind:"refresh", icon:"◷", area, title:t("smart.refreshTitle",{area:area.label}), text:t("smart.refreshText",{area:area.label}), shortText:t("smart.refreshShort",{area:area.label}) };
    }
    if (profile.unassessedTypeList[0]) {
      const type = profile.unassessedTypeList[0];
      return { kind:"explore", icon:"◇", area:learningAreaFallback(`type:${type}`), title:t("smart.exploreTitle",{type:typeLabel(type)}), text:t("smart.exploreText",{type:typeLabel(type)}), shortText:t("smart.exploreShort",{type:typeLabel(type)}) };
    }
    return { kind:"balanced", icon:"✓", area:profile.strengths[0] || null, title:t("smart.balancedTitle"), text:t("smart.balancedText"), shortText:t("smart.balancedShort") };
  }

  function smartFocusKeyForSpec(spec) {
    if (!spec) return "skill:effectiveness";
    if (spec._smartFocusKey && validLearningKey(spec._smartFocusKey)) return spec._smartFocusKey;
    if (spec.kind === "effectiveness") return `attack:${spec.attackingType}`;
    if (spec.kind === "multiplier") return `defense:${spec.defendingTypes?.[0] || "normal"}`;
    if (spec.kind === "impact") return `attack:${spec.attackingType}`;
    if (spec.kind === "pokemon") return `pokemon:${spec.pokemon?.types?.[0] || "normal"}`;
    return "skill:effectiveness";
  }

  function smartPokemonSpec(focusType, random = Math.random, difficulty = "medium") {
    const typed = focusType ? FALLBACK_POKEMON.filter(pokemon => pokemon.types.includes(focusType)) : FALLBACK_POKEMON;
    const complexityFiltered = difficulty === "easy"
      ? typed.filter(pokemon => pokemon.types.length === 1)
      : difficulty === "hard"
        ? typed.filter(pokemon => pokemon.types.length === 2)
        : typed;
    const candidates = complexityFiltered.length ? complexityFiltered : (typed.length ? typed : FALLBACK_POKEMON);
    const source = clone(randomItem(candidates, random));
    return { kind:"pokemon", pokemon:formatFallbackPokemon(source), display:difficulty === "hard" ? "image" : "both", focusTypes:[...source.types], _smartDifficulty:difficulty };
  }

  function smartSpecForArea(area, index = 0, random = Math.random) {
    const role = area?.role || "skill";
    const type = area?.type || (TYPES.includes(area?.value) ? area.value : null);
    let kind = "effectiveness";
    if (role === "pokemon" || area?.value === "pokemon") kind = "pokemon";
    else if (role === "defense" || area?.value === "multiplier" || area?.value === "dual") kind = index % 2 ? "impact" : "multiplier";
    else if (area?.value === "impact") kind = "impact";
    else if (role === "attack") kind = index % 2 ? "impact" : "effectiveness";
    else if (role === "type") kind = index % 3 === 0 ? "effectiveness" : index % 3 === 1 ? "multiplier" : "pokemon";

    const difficultyInfo = smartDifficultyForSpec(area,kind);
    const difficulty = difficultyInfo.level;
    const defense = smartDefenseForDifficulty(area,difficulty,random);
    let spec;
    if (kind === "effectiveness") spec = generateEffectivenessSpec({ focusType:type, difficulty, kind:"mixed", random });
    else if (kind === "multiplier") spec = generateMultiplierSpec({ focusType:type, difficulty, defense, random });
    else if (kind === "impact") spec = generateImpactSpec({ focusType:type, difficulty, defense, random });
    else spec = smartPokemonSpec(type,random,difficulty);
    return { ...spec, _smartDifficulty:difficulty, _smartDifficultyReason:difficultyInfo.reason, _smartDifficultyCalibrating:difficultyInfo.calibrating };
  }

  function decorateSmartSpec(spec, area, source) {
    const focusKey = area?.role === "type" ? smartFocusKeyForSpec(spec) : area?.key || smartFocusKeyForSpec(spec);
    const difficultyInfo = spec?._smartDifficulty ? { level:spec._smartDifficulty, reason:spec._smartDifficultyReason || "developing", calibrating:Boolean(spec._smartDifficultyCalibrating) } : smartDifficultyForSpec(area,spec?.kind || "effectiveness");
    return { ...spec, _smartFocusKey:focusKey, _smartSource:source, _smartLabel:learningAreaMeta(focusKey).label, _smartBaseDifficulty:spec?._smartBaseDifficulty||difficultyInfo.level, _smartDifficulty:difficultyInfo.level, _smartDifficultyReason:difficultyInfo.reason, _smartDifficultyCalibrating:Boolean(difficultyInfo.calibrating), _smartSessionAdjustment:spec?._smartSessionAdjustment||null };
  }

  function smartPlanReason(source, area, count = 1) {
    const label = area?.label || "";
    const keys = {
      need:"smart.reason.need", declining:"smart.reason.declining", improving:"smart.reason.improving",
      refresh:"smart.reason.refresh", explore:"smart.reason.explore", mistake:"smart.reason.mistake",
      resolved:"smart.reason.resolved", balance:"smart.reason.balance", discovery:"smart.reason.discovery"
    };
    return t(keys[source] || keys.balance, { area:label, count });
  }

  function buildSmartTrainingPlan() {
    const profile = getLearningProfile();
    const recommendation = smartRecommendation(profile);
    const random = Math.random;
    const sequence = [];
    const signatures = new Set();
    const reasons = [];
    const addReason = (source, area, count = 1) => {
      const text = smartPlanReason(source, area, count);
      if (!reasons.some(item => item.text === text)) reasons.push({ source, areaKey:area?.key || null, text });
    };
    const addSpec = (spec, area, source) => {
      if (!spec || sequence.length >= 10) return false;
      const decorated = decorateSmartSpec(spec, area, source);
      const signature = questionSignature(decorated);
      if (signatures.has(signature)) return false;
      signatures.add(signature);
      sequence.push(decorated);
      addReason(source, area);
      return true;
    };
    const addArea = (area, count, source) => {
      if (!area) return;
      let added = 0;
      for (let attempt = 0; attempt < count * 10 && added < count && sequence.length < 10; attempt += 1) {
        if (addSpec(smartSpecForArea(area, attempt, random), area, source)) added += 1;
      }
    };

    const discovery = recommendation.kind === "discovery";
    if (discovery) {
      const types = shuffle(profile.unassessedTypeList.length ? profile.unassessedTypeList : TYPES, random);
      const kinds = ["effectiveness","effectiveness","effectiveness","multiplier","multiplier","impact","impact","pokemon","pokemon","pokemon"];
      kinds.forEach((kind, index) => {
        const type = types[index % types.length];
        const area = learningAreaFallback(`type:${type}`);
        const difficultyInfo = smartDifficultyForSpec(area,kind);
        const difficulty = difficultyInfo.level;
        const defense = smartDefenseForDifficulty(area,difficulty,random);
        let spec;
        if (kind === "effectiveness") spec = generateEffectivenessSpec({ focusType:type, difficulty, kind:"mixed", random });
        else if (kind === "multiplier") spec = generateMultiplierSpec({ focusType:type, difficulty, defense, random });
        else if (kind === "impact") spec = generateImpactSpec({ focusType:type, difficulty, defense, random });
        else spec = smartPokemonSpec(type,random,difficulty);
        addSpec({ ...spec, _smartDifficulty:difficulty, _smartDifficultyReason:difficultyInfo.reason, _smartDifficultyCalibrating:difficultyInfo.calibrating }, area, "discovery");
      });
    } else {
      const openMistakes = state.stats.mistakes.filter(item => item?.status !== "resolved" && item?.spec)
        .sort((a,b) => Number(b.wrongCount || 0) - Number(a.wrongCount || 0) || new Date(b.lastSeen) - new Date(a.lastSeen)).slice(0,2);
      openMistakes.forEach(item => {
        const key = smartFocusKeyForSpec(item.spec);
        addSpec(clone(item.spec), learningAreaForKey(profile,key) || learningAreaFallback(key), "mistake");
      });

      profile.needs.slice(0,2).forEach((area,index) => addArea(area, area.recentExposure >= 8 && index > 0 ? 1 : 2, "need"));
      const decline = profile.declining.find(area => !profile.needs.some(item => item.key === area.key));
      if (decline && decline.recentExposure < 10) addArea(decline,1,"declining");
      const improving = profile.improving.find(area => !profile.needs.some(item => item.key === area.key));
      if (improving && improving.recentExposure < 9) addArea(improving,1,"improving");
      const stale = profile.staleStrengths[0];
      if (stale) addArea(stale,1,"refresh");

      const dueResolved = state.stats.mistakes.filter(item => item?.status === "resolved" && item?.spec && learningDaysSince(item.lastSeen) >= 7)
        .sort((a,b) => learningDaysSince(b.lastSeen) - learningDaysSince(a.lastSeen))[0];
      if (dueResolved && sequence.length < 9) {
        const key = smartFocusKeyForSpec(dueResolved.spec);
        addSpec(clone(dueResolved.spec), learningAreaForKey(profile,key) || learningAreaFallback(key), "resolved");
      }

      if (profile.unassessedTypeList.length && sequence.length < 9) {
        const type = randomItem(profile.unassessedTypeList, random);
        addArea(learningAreaFallback(`type:${type}`),1,"explore");
      }
    }

    const fallbackAreas = [recommendation.area, ...profile.needs, ...profile.improving, ...profile.strengths, ...TYPES.map(type => learningAreaFallback(`type:${type}`))].filter(Boolean);
    for (let attempt = 0; sequence.length < 10 && attempt < 180; attempt += 1) {
      const area = fallbackAreas[attempt % fallbackAreas.length] || learningAreaFallback(`type:${TYPES[attempt % TYPES.length]}`);
      const source = discovery ? "discovery" : "balance";
      addSpec(smartSpecForArea(area, attempt, random), area, source);
    }

    const modeCounts = { effectiveness:0, multiplier:0, impact:0, pokemon:0 };
    const difficultyCounts = { easy:0, medium:0, hard:0 };
    sequence.forEach(spec => {
      if (Object.hasOwn(modeCounts,spec.kind)) modeCounts[spec.kind] += 1;
      if (Object.hasOwn(difficultyCounts,spec._smartDifficulty)) difficultyCounts[spec._smartDifficulty] += 1;
    });
    const focusKeys = unique(sequence.map(spec => spec._smartFocusKey).filter(validLearningKey));
    const focusAreas = focusKeys.map(key => learningAreaForKey(profile,key) || learningAreaFallback(key));
    const primaryDifficulty = ADAPTIVE_DIFFICULTIES.reduce((best,level) => difficultyCounts[level] > difficultyCounts[best] ? level : best,"medium");
    return {
      kind:discovery ? "discovery" : "personal",
      recommendation,
      sequence,
      modeCounts,
      difficultyCounts,
      primaryDifficulty,
      calibratingCount:sequence.filter(spec => spec._smartDifficultyCalibrating).length,
      focusKeys,
      focusAreas,
      reasons:reasons.slice(0,5),
      openMistakes:sequence.filter(spec => spec._smartSource === "mistake").length
    };
  }

  function smartLearningSnapshot(keys, profile = getLearningProfile()) {
    return Object.fromEntries(unique(keys || []).map(key => {
      const area = learningAreaForKey(profile,key) || learningAreaFallback(key);
      return [key,{ key, label:area.label, rate:area.rate, score:area.score, total:area.total, status:area.status, trend:area.trend }];
    }));
  }

  function smartStatusRank(status) {
    return ({ unassessed:0, need:1, developing:2, improving:3, stable:4, strong:5 })[status] || 0;
  }

  function smartSessionProgress() {
    if (!session?.smartPlan) return null;
    const afterProfile = getLearningProfile();
    const groups = new Map();
    session.answers.forEach(answer => {
      if (!answer.focusKey) return;
      if (!groups.has(answer.focusKey)) groups.set(answer.focusKey,[]);
      groups.get(answer.focusKey).push(Number.isFinite(answer.focusScore) ? answer.focusScore : Number(Boolean(answer.correct)));
    });
    const trained = [];
    const improved = [];
    const attention = [];
    groups.forEach((scores,key) => {
      const before = session.learningBefore?.[key] || learningAreaFallback(key);
      const after = learningAreaForKey(afterProfile,key) || learningAreaFallback(key);
      const sessionScore = scores.reduce((sum,value)=>sum+value,0) / scores.length;
      const item = { key, label:after.label || before.label, count:scores.length, sessionRate:Math.round(sessionScore*100), beforeRate:Number(before.rate||0), afterRate:Number(after.rate||0), beforeStatus:before.status || "unassessed", afterStatus:after.status || "unassessed", trend:after.trend };
      trained.push(item);
      const statusGain = smartStatusRank(item.afterStatus) > smartStatusRank(item.beforeStatus);
      if (scores.length >= 2 && ((before.total >= 3 && sessionScore >= Number(before.score || 0) + .12) || statusGain || after.trend === "up")) improved.push(item);
      if (scores.length >= 2 && (sessionScore < .6 || after.status === "need" || after.trend === "down")) attention.push(item);
    });
    return { trained, improved, attention, next:smartRecommendation(afterProfile) };
  }

  function smartModePreviewRows(plan) {
    return ["effectiveness","multiplier","impact","pokemon"].filter(kind => plan.modeCounts[kind]).map(kind => `<span><b>${plan.modeCounts[kind]}×</b>${escapeHtml(modeName(kind))}</span>`).join("");
  }

  function smartDifficultyPreviewRows(plan) {
    return ADAPTIVE_DIFFICULTIES.filter(level => plan.difficultyCounts[level]).map(level => `<span class="difficulty-level ${level}"><b>${plan.difficultyCounts[level]}×</b>${escapeHtml(difficultyLabel(level))}</span>`).join("");
  }

  function adaptiveDifficultyOverviewMarkup(profile = getLearningProfile()) {
    const model = adaptiveDifficultyProfile(profile);
    const total = model.entries.length;
    return `<section class="adaptive-difficulty-overview">
      <div class="adaptive-difficulty-overview-head"><span>◫</span><div><p class="quiz-kicker">${t("difficulty.kicker")}</p><h2>${t("difficulty.profileTitle")}</h2><p>${t("difficulty.profileText")}</p></div></div>
      <div class="adaptive-difficulty-cards">
        ${ADAPTIVE_DIFFICULTIES.map(level => `<article class="${level}"><small>${escapeHtml(difficultyLabel(level))}</small><strong>${model.counts[level]}</strong><span>${t("difficulty.areaCount",{count:model.counts[level]})}</span></article>`).join("")}
      </div>
      <p class="adaptive-difficulty-note">${total ? (model.calibrating ? t("difficulty.profileNote",{count:model.calibrating}) : t("difficulty.profileReady")) : t("difficulty.profileEmpty")}</p>
    </section>`;
  }

  function showSmartTrainingPreview() {
    const plan = buildSmartTrainingPlan();
    const title = plan.kind === "discovery" ? t("smart.previewDiscoveryTitle") : t("smart.previewTitle");
    const intro = plan.kind === "discovery" ? t("smart.previewDiscoveryText") : t("smart.previewText");
    setModalMarkup(`<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="smartTrainingTitle"><section class="modal-card smart-training-modal" tabindex="-1">
      <header class="smart-training-head"><span>${plan.recommendation.icon}</span><div><p class="quiz-kicker">${t("smart.kicker")}</p><h2 id="smartTrainingTitle">${escapeHtml(title)}</h2><p>${escapeHtml(intro)}</p></div></header>
      <section class="smart-training-recommendation"><small>${t("smart.todayFocus")}</small><strong>${escapeHtml(plan.recommendation.title)}</strong><p>${escapeHtml(plan.recommendation.text)}</p></section>
      <section class="smart-training-focus"><div class="smart-training-section-title"><strong>${t("smart.focusAreas")}</strong><span>${tp("smart.questionCountOne","smart.questionCount",plan.sequence.length)}</span></div><div>${plan.focusAreas.slice(0,5).map(area => `<span class="smart-focus-chip" ${area.type ? `style="--smart-color:${TYPE_META[area.type].color}"` : ""}>${area.type ? `<i>${TYPE_META[area.type].icon}</i>` : ""}${escapeHtml(area.label)}</span>`).join("")}</div></section>
      <section class="smart-training-reasons"><strong>${t("smart.whySelected")}</strong><ul>${plan.reasons.map(reason => `<li><span>✓</span>${escapeHtml(reason.text)}</li>`).join("")}</ul></section>
      <section class="smart-training-modes"><strong>${t("smart.includedModes")}</strong><div>${smartModePreviewRows(plan)}</div></section>
      <section class="smart-training-difficulty"><div class="smart-training-section-title"><strong>${t("difficulty.adjustedTitle")}</strong><span>${escapeHtml(difficultyLabel(plan.primaryDifficulty))}</span></div><p>${t("difficulty.adjustedText")}</p><div>${smartDifficultyPreviewRows(plan)}</div>${plan.calibratingCount ? `<small>${t("difficulty.calibrationNote",{count:plan.calibratingCount})}</small>` : ""}</section>
      <p class="smart-training-boundary">${t("difficulty.fixedForSession")}</p>
      <div class="modal-actions"><button id="cancelSmartTraining" class="secondary-button">${t("common.cancel")}</button><button id="startSmartTraining" class="primary-button">${t("smart.start")}</button></div>
    </section></div>`, { initialFocus:"#startSmartTraining" });
    document.getElementById("cancelSmartTraining")?.addEventListener("click",()=>closeModal());
    document.getElementById("startSmartTraining")?.addEventListener("click",()=>closeModal(()=>launchSmartTraining(plan)));
  }

  function launchSmartTraining(plan) {
    session = newSession("weak", { length:10, difficulty:"adaptive" }, plan.sequence);
    session.smartPlan = { kind:plan.kind, focusKeys:[...plan.focusKeys], reasons:plan.reasons.map(item=>item.text), modeCounts:{...plan.modeCounts}, difficultyCounts:{...plan.difficultyCounts}, primaryDifficulty:plan.primaryDifficulty, calibratingCount:plan.calibratingCount, recommendationKind:plan.recommendation.kind };
    session.adaptiveFlow = { offset:0, lastChecked:0, adjustments:[], initialDifficultyCounts:{...plan.difficultyCounts} };
    session.learningBefore = smartLearningSnapshot(plan.focusKeys);
    prepareRouteMotion(state.route,"session","forward");
    state.route="session";
    saveState();
    updateNavigation();
    renderQuestion();
  }

  function smartRecommendationCardMarkup(id = "startRecommendation") {
    const recommendation = smartRecommendation();
    return `<button class="recommendation-card interactive progress-recommendation smart-central-recommendation" id="${id}"><span class="recommendation-icon">${recommendation.icon}</span><div><small>${t("stats.recommended")}</small><strong>${escapeHtml(recommendation.title)}</strong><p>${escapeHtml(recommendation.text)}</p></div><span class="arrow">›</span></button>`;
  }

  function smartLearningSummaryMarkup() {
    if (session?.mode !== "weak") return "";
    const progress = session.learningProgress || smartSessionProgress();
    if (!progress) return "";
    const improved = progress.improved.slice(0,3);
    const attention = progress.attention.slice(0,3);
    const trained = progress.trained.slice(0,3);
    const focus=improved.length?improved:attention.length?attention:trained;
    const stateKey=improved.length?"improved":attention.length?"attention":"trained";
    const title=stateKey==="improved"?t("cleanup2.learningImproved"):stateKey==="attention"?t("cleanup2.learningAttention"):t("cleanup2.learningRecorded");
    return `<section class="summary-learning-card compact ${stateKey}">
      <div class="summary-learning-head"><span>${stateKey==="improved"?"↗":stateKey==="attention"?"◎":"✓"}</span><div><p class="quiz-kicker">${t("smart.summaryKicker")}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(progress.next.text)}</p></div></div>
      ${focus.length?`<div class="summary-learning-tags">${focus.map(item=>`<span>${escapeHtml(item.label)}</span>`).join("")}</div>`:""}
    </section>`;
  }

  function learningStatusLabel(area) {
    return t(`learning.status.${area.displayStatus || area.status}`);
  }

  function learningAreaScore(area) {
    if (area.total < 6) return t("learning.firstTrend");
    return `${area.rate}%`;
  }

  function learningAreaDescription(area) {
    if (area.openMistakes > 0) return t("learning.card.openMistakes", { count: area.openMistakes });
    if (area.trend === "up") return t("learning.card.improving");
    if (area.trend === "down") return t("learning.card.declining");
    if (area.legacy) return t("learning.card.legacy");
    if (area.status === "strong") return t("learning.card.strong");
    if (area.status === "stable") return t("learning.card.stable");
    if (area.status === "need") return t("learning.card.need");
    return t("learning.card.developing");
  }

  function learningAreaCard(area) {
    return `<article class="learning-area-card ${area.displayStatus || area.status}" ${area.type ? `style="--learning-type-color:${TYPE_META[area.type].color}"` : ""}>
      <div class="learning-area-card-head"><span class="learning-area-icon">${area.type ? TYPE_META[area.type].icon : area.role === "skill" ? "◎" : "◇"}</span><div><strong>${escapeHtml(area.label)}</strong><small>${escapeHtml(learningStatusLabel(area))}</small></div><b>${escapeHtml(learningAreaScore(area))}</b></div>
      <p>${escapeHtml(learningAreaDescription(area))}</p>
      <div class="learning-area-meta"><span>${t("learning.evidence", { count: area.total })}</span><span class="trend ${area.trend}">${escapeHtml(area.confidence.label)}</span></div>
    </article>`;
  }

  function learningEmptyGroup(icon, title, text) {
    return `<div class="learning-empty-group"><span>${icon}</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div>`;
  }

  function renderLearningGroup(title, hint, items, emptyIcon, emptyTitle, emptyText) {
    return `<section class="learning-profile-group"><div class="section-title"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(hint)}</p></div><div class="learning-area-grid">${items.length ? items.slice(0, 6).map(learningAreaCard).join("") : learningEmptyGroup(emptyIcon, emptyTitle, emptyText)}</div></section>`;
  }

  function learningProfileEntryMarkup(profile = getLearningProfile()) {
    const focus = profile.needs[0] || profile.developing[0] || profile.strengths[0];
    return `<button id="openLearningProfile" class="learning-profile-entry" type="button"><span class="learning-profile-entry-icon">◎</span><span><small>${t("learning.kicker")}</small><strong>${t("learning.title")}</strong><em>${focus ? t("learning.entryFocus", { area: focus.label }) : t("learning.entryEmpty")}</em></span><b>${profile.assessedTypes}/18</b><i aria-hidden="true">›</i></button>`;
  }

  function renderLearningProfile() {
    const content = document.getElementById("statsContent");
    const profile = getLearningProfile();
    const stageLabel = t(`learning.stage.${profile.stage}`);
    content.innerHTML = `
      <section class="learning-profile-hero">
        <div class="learning-profile-hero-copy"><p class="quiz-kicker">${t("learning.kicker")}</p><h2>${t("learning.title")}</h2><p>${t("learning.subtitle")}</p><span class="learning-model-stage ${profile.stage}"><i></i>${escapeHtml(stageLabel)}</span></div>
        <div class="learning-profile-score"><strong>${profile.assessedTypes}</strong><small>${t("learning.typesAssessed")}</small><span>${t("learning.ofTypes")}</span></div>
      </section>
      <section class="learning-profile-metrics">
        ${progressKpi("◎", t("learning.detailedAnswers"), profile.detailedCount, t("learning.detailedAnswersHint"))}
        ${progressKpi("★", t("learning.strongAreas"), profile.strengths.length, t("learning.strongAreasHint"))}
        ${progressKpi("↗", t("learning.practiceAreas"), profile.needs.length, t("learning.practiceAreasHint"))}
        ${progressKpi("◇", t("learning.unassessedTypes"), profile.unassessedTypes, t("learning.unassessedTypesHint"))}
      </section>
      ${adaptiveDifficultyOverviewMarkup(profile)}
      ${smartRecommendationCardMarkup("learningSmartTraining")}
      ${renderLearningGroup(t("learning.strengths"), t("learning.strengthsHint"), profile.strengths, "★", t("learning.noStrengths"), t("learning.noStrengthsHint"))}
      ${renderLearningGroup(t("learning.needs"), t("learning.needsHint"), profile.needs, "✓", t("learning.noNeeds"), t("learning.noNeedsHint"))}
      ${renderLearningGroup(t("learning.developing"), t("learning.developingHint"), profile.developing, "◎", t("learning.noDeveloping"), t("learning.noDevelopingHint"))}
      <section class="learning-profile-explainer">
        <span>i</span><div><strong>${t("learning.howTitle")}</strong><p>${t("learning.howText")}</p>${profile.legacyUsed ? `<small>${t("learning.legacyNote")}</small>` : ""}</div>
      </section>`;
    document.getElementById("learningSmartTraining")?.addEventListener("click",startWeakSession);
  }

  function renderStats() {
    const tabs=[["overview",t("stats.overview")],["learning",t("learning.tab")],["types",t("stats.types")],["errors",t("stats.errors")],["achievements",t("stats.achievements")]];
    const level=getLevelInfo();
    const accuracy=percent(state.stats.correct,state.stats.total);
    const openErrors=state.stats.mistakes.filter(item=>item.status!=="resolved").length;
    const heroMetrics=state.statsTab==="overview"?`<div class="progress-hero-metrics"><span><small>${t("stats.accuracy")}</small><strong>${accuracy}%</strong></span><span><small>${t("stats.bestStreak")}</small><strong>${state.stats.bestStreak}</strong></span><span><small>${t("stats.openErrors")}</small><strong>${openErrors}</strong></span></div>`:"";
    view.innerHTML=`<section class="progress-page ${state.statsTab==="overview"?"overview-focused":"detail-focused"}">
      <section class="progress-hero">
        <div class="progress-hero-copy"><p class="quiz-kicker">${t("stats.hubKicker")}</p><h1>${t("stats.hubTitle")}</h1><p>${t("stats.hubSubtitle")}</p></div>
        <div class="progress-level-card">
          <span class="progress-level-orb">${level.current.level}</span>
          <div><small>${t("stats.level")}</small><strong>${escapeHtml(t(level.current.key))}</strong><span>${state.stats.xp} XP${level.next?` · ${level.next.xp-state.stats.xp} XP ${t("stats.untilNext")}`:""}</span><div class="progress-track"><div class="progress-fill" style="width:${level.progress}%"></div></div></div>
        </div>
        ${heroMetrics}
      </section>
      <div class="progress-tabs tabs" role="tablist" style="--tab-count:5">${tabs.map(([key,label])=>`<button class="tab-button ${state.statsTab===key?"active":""}" role="tab" aria-selected="${state.statsTab===key}" data-stats-tab="${key}">${escapeHtml(label)}</button>`).join("")}</div>
      <div id="statsContent" class="progress-content"></div>
    </section>`;
    document.querySelectorAll("[data-stats-tab]").forEach(button=>button.addEventListener("click",()=>{state.statsTab=button.dataset.statsTab;saveState();renderStats();}));
    if(state.statsTab==="learning")renderLearningProfile();else if(state.statsTab==="types")renderTypeStats();else if(state.statsTab==="errors")renderMistakes();else if(state.statsTab==="achievements")renderAchievements();else renderStatsOverview();
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
      ${learningProfileEntryMarkup()}
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
    document.getElementById("openLearningProfile")?.addEventListener("click",()=>{state.statsTab="learning";saveState();renderStats();});
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
    return smartRecommendationCardMarkup("startRecommendation");
  }

  function bindRecommendation() {
    document.getElementById("startRecommendation")?.addEventListener("click",startWeakSession);
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
    document.querySelectorAll("[data-progress-type]").forEach(button=>button.addEventListener("click",()=>{knowledgeView="types";learnType=button.dataset.progressType;setRoute("learn-detail");}));
  }

  function typeProgressCard(item){
    const meta=TYPE_META[item.type];
    const label=!item.total?t("stats.notExplored"):item.rate>=80&&item.total>=5?t("stats.mastered"):item.rate>=60?t("stats.solid"):t("stats.practice");
    const trendIcon=item.trend==="up"?"↑":item.trend==="down"?"↓":"→";
    return `<button class="modern-type-stat-card" data-progress-type="${item.type}" style="--type-color:${meta.color}"><span class="modern-type-stat-top">${typeChip(item.type)}<span class="trend ${item.trend}">${trendIcon}</span></span><span class="modern-type-stat-body"><small>${escapeHtml(label)}</small><strong>${item.total?`${item.rate}%`:"–"}</strong><p>${tp("stats.questionsCountOne","stats.questionsCount",item.total)}</p></span><span class="type-library-progress"><i style="width:${item.total?item.rate:0}%"></i></span></button>`;
  }

  function errorPatternIcon(pattern) {
    if (pattern.key.startsWith("matchup:")) return "⇄";
    if (pattern.key.startsWith("pokemon:")) return "◇";
    const icons = {
      "direction-reversal":"↔", "immunity-overlooked":"0", "immunity-assumed":"?",
      "quarter-half-confusion":"¼", "double-quad-confusion":"4", "dual-neutralization":"1",
      "dual-multiplication":"×", "pokemon-missing-secondary":"+", "pokemon-extra-type":"−", "pokemon-wrong-type":"◇"
    };
    return icons[pattern.code] || "!";
  }

  function errorRuleTitle(code) {
    return t(`errorAnalysis.rule.${code}.title`);
  }

  function errorRuleText(code) {
    return t(`errorAnalysis.rule.${code}.text`);
  }

  function errorPatternTitle(pattern) {
    const sample = pattern.sample || {};
    if (pattern.key.startsWith("matchup:") && sample.attackingType && sample.defendingTypes?.length) {
      return `${typeLabel(sample.attackingType)} → ${sample.defendingTypes.map(typeLabel).join(" + ")}`;
    }
    if (pattern.key.startsWith("pokemon:")) return sample.pokemonName || t("errorAnalysis.pokemonFallback");
    return errorRuleTitle(pattern.code);
  }

  function errorPatternText(pattern) {
    if (pattern.key.startsWith("matchup:")) return t("errorAnalysis.matchupText");
    if (pattern.key.startsWith("pokemon:")) return t("errorAnalysis.pokemonText");
    return errorRuleText(pattern.code);
  }

  function errorPatternConfidence(pattern) {
    if (pattern.sessions >= 3 && pattern.opportunities >= 8 && pattern.errors >= 3) return { id:"reliable", label:t("errorAnalysis.confidence.reliable") };
    if (pattern.sessions >= 2 && pattern.opportunities >= 4 && pattern.errors >= 2) return { id:"recurring", label:t("errorAnalysis.confidence.recurring") };
    return { id:"first", label:t("errorAnalysis.confidence.first") };
  }

  function errorPatternTimeline(key, events = sanitizeErrorEvents(state.stats.errorAnalysis?.events || [])) {
    return events.filter(event => event.opportunities.includes(key)).map(event => ({
      at:event.at,
      sessionId:event.sessionId,
      error:event.issues.some(issue => issue.patternKey === key),
      sample:event.issues.find(issue => issue.patternKey === key) || null
    })).sort((a,b)=>new Date(a.at)-new Date(b.at));
  }

  function errorPatternDevelopment(pattern, events) {
    const timeline=errorPatternTimeline(pattern.key,events);
    const recent=timeline.slice(-5);
    const previous=timeline.slice(Math.max(0,timeline.length-10),Math.max(0,timeline.length-5));
    const rate=list=>list.length?list.filter(item=>item.error).length/list.length:0;
    const recentRate=rate(recent);
    const previousRate=rate(previous);
    let correctStreak=0;
    for(let index=timeline.length-1;index>=0&&!timeline[index].error;index-=1)correctStreak+=1;
    const streakSessions=new Set(timeline.slice(-correctStreak).map(item=>item.sessionId)).size;
    let status="active";
    if(pattern.errors>=2&&pattern.opportunities>=6&&correctStreak>=4&&streakSessions>=2)status="resolved";
    else if(previous.length>=3&&recent.length>=3&&recentRate<=previousRate-.20)status="improving";
    else if(previous.length>=3&&recent.length>=3&&recentRate>=previousRate+.20)status="worsening";
    else if(pattern.confidence?.id==="first")status="building";
    return { timeline,recent,previous,recentRate,previousRate,correctStreak,streakSessions,status };
  }

  function errorPatternStatusLabel(status) { return t(`errorAnalysis.status.${status}`); }

  function summarizeErrorAnalysis() {
    const events = sanitizeErrorEvents(state.stats.errorAnalysis?.events || []);
    const patterns = new Map();
    const ensure = key => {
      if (!patterns.has(key)) patterns.set(key, { key, code:key.startsWith("rule:")?key.slice(5):key.startsWith("matchup:")?"matchup":"pokemon-specific", opportunities:0, errors:0, sessions:new Set(), lastSeen:null, sample:null });
      return patterns.get(key);
    };
    events.forEach(event => {
      unique(event.opportunities).forEach(key => {
        const pattern=ensure(key);pattern.opportunities+=1;pattern.sessions.add(event.sessionId);pattern.lastSeen=event.at;
      });
      const seen=new Set();
      event.issues.forEach(issue => {
        if(seen.has(issue.patternKey))return;seen.add(issue.patternKey);
        const pattern=ensure(issue.patternKey);pattern.errors+=1;pattern.sessions.add(event.sessionId);pattern.lastSeen=event.at;pattern.sample=issue;
      });
    });
    const all=[...patterns.values()].map(pattern=>({
      ...pattern,
      sessions:pattern.sessions.size,
      rate:pattern.opportunities?pattern.errors/pattern.opportunities:0
    })).filter(pattern=>pattern.errors>=2&&pattern.opportunities>=2).map(pattern=>{
      const confidence=errorPatternConfidence(pattern);
      const withConfidence={...pattern,confidence};
      return {...withConfidence,development:errorPatternDevelopment(withConfidence,events)};
    }).sort((a,b)=>{
      const statusRank={worsening:5,active:4,building:3,improving:2,resolved:1};
      return (statusRank[b.development.status]||0)-(statusRank[a.development.status]||0)||b.errors-a.errors||b.rate-a.rate||new Date(b.lastSeen)-new Date(a.lastSeen);
    });
    const recurring=all.filter(pattern=>pattern.confidence.id!=="first"&&pattern.development.status!=="resolved").length;
    const concrete=all.filter(pattern=>pattern.key.startsWith("matchup:")||pattern.key.startsWith("pokemon:")).length;
    return {
      events,
      analyzed:events.length,
      errorAnswers:events.filter(event=>event.issues.length).length,
      recurring,
      concrete,
      patterns:all,
      candidates:all.slice(0,6)
    };
  }

  function errorPatternCard(pattern) {
    const title=errorPatternTitle(pattern);
    const text=errorPatternText(pattern);
    const context=pattern.key.startsWith("matchup:")&&pattern.sample?.attackingType
      ? `<div class="error-pattern-types">${typeChip(pattern.sample.attackingType,"small")}<span>→</span>${pattern.sample.defendingTypes.map(type=>typeChip(type,"small")).join("")}</div>`
      : "";
    return `<button type="button" class="error-pattern-card ${pattern.confidence.id} ${pattern.development.status}" data-error-pattern="${escapeHtml(pattern.key)}">
      <div class="error-pattern-head"><span>${errorPatternIcon(pattern)}</span><div><small>${escapeHtml(pattern.confidence.label)}</small><strong>${escapeHtml(title)}</strong></div><em class="error-pattern-status ${pattern.development.status}">${escapeHtml(errorPatternStatusLabel(pattern.development.status))}</em></div>
      ${context}<p>${escapeHtml(text)}</p>
      <div class="error-pattern-evidence"><b>${t("errorAnalysis.openDetails")}</b><i aria-hidden="true">›</i></div>
    </button>`;
  }

  function errorAnalysisMarkup() {
    const analysis=summarizeErrorAnalysis();
    const stage=analysis.analyzed<5?"start":analysis.analyzed<15?"building":"active";
    const lead=analysis.candidates[0]||null;
    const remaining=analysis.candidates.slice(lead?1:0);
    return `<section class="error-analysis-panel cleanup-error-analysis">
      <div class="error-analysis-heading"><div><p class="quiz-kicker">${t("cleanup2.patternSectionKicker")}</p><h2>${t("cleanup2.patternSectionTitle")}</h2><p>${t("cleanup2.patternSectionText")}</p></div><span class="error-analysis-stage ${stage}">${t(`errorAnalysis.stage.${stage}`)}</span></div>
      ${lead?`<div class="error-analysis-lead"><small>${t("cleanup2.mostImportantPattern")}</small>${errorPatternCard(lead)}</div>`:`<div class="error-analysis-empty"><span>◎</span><strong>${t("errorAnalysis.emptyTitle")}</strong><p>${analysis.analyzed?t("errorAnalysis.emptyBuilding"):t("errorAnalysis.emptyText")}</p></div>`}
      ${remaining.length?`<div class="section-title error-analysis-section-title"><h3>${t("cleanup2.otherPatterns")}</h3><p>${t("errorAnalysis.patternsHintDetailed")}</p></div><div class="error-pattern-grid">${remaining.map(errorPatternCard).join("")}</div>`:""}
      <details class="error-analysis-details"><summary><span><strong>${t("cleanup2.analysisDetails")}</strong><small>${t("cleanup2.analysisDetailsHint")}</small></span><i aria-hidden="true">⌄</i></summary><div class="error-analysis-metrics"><article><small>${t("errorAnalysis.analyzed")}</small><strong>${analysis.analyzed}</strong></article><article><small>${t("errorAnalysis.errorAnswers")}</small><strong>${analysis.errorAnswers}</strong></article><article><small>${t("errorAnalysis.recurring")}</small><strong>${analysis.recurring}</strong></article><article><small>${t("errorAnalysis.concrete")}</small><strong>${analysis.concrete}</strong></article></div><div class="error-analysis-note"><span>i</span><p>${t("errorAnalysis.note")}</p></div></details>
    </section>`;
  }

  function errorPatternByKey(key) {
    return summarizeErrorAnalysis().patterns.find(pattern=>pattern.key===sanitizeErrorPatternKey(key))||null;
  }

  function errorPatternDevelopmentMarkup(pattern) {
    const development=pattern.development;
    if(development.previous.length<3||development.recent.length<3)return `<div class="error-detail-development empty"><strong>${t("errorAnalysis.developmentTitle")}</strong><p>${t("errorAnalysis.developmentBuilding")}</p></div>`;
    return `<div class="error-detail-development"><strong>${t("errorAnalysis.developmentTitle")}</strong><div><span><small>${t("errorAnalysis.previousWindow")}</small><b>${Math.round(development.previousRate*100)}%</b><i><em style="width:${Math.round(development.previousRate*100)}%"></em></i></span><span><small>${t("errorAnalysis.recentWindow")}</small><b>${Math.round(development.recentRate*100)}%</b><i><em style="width:${Math.round(development.recentRate*100)}%"></em></i></span></div></div>`;
  }

  function errorPatternCriterionText(pattern) {
    const development=pattern.development;
    if(development.status==="resolved")return t("errorAnalysis.criterionResolved",{count:development.correctStreak});
    if(development.status==="improving")return t("errorAnalysis.criterionImproving");
    return t("errorAnalysis.criterionOpen",{count:Math.max(0,4-development.correctStreak)});
  }

  function showErrorPatternDetail(key) {
    const pattern=errorPatternByKey(key);
    if(!pattern)return;
    const title=errorPatternTitle(pattern);
    const context=pattern.key.startsWith("matchup:")&&pattern.sample?.attackingType
      ? `<div class="error-detail-matchup">${typeChip(pattern.sample.attackingType,"large")}<span>→</span>${pattern.sample.defendingTypes.map(type=>typeChip(type,"large")).join("")}</div>`:"";
    const canTrain=pattern.confidence.id!=="first";
    setModalMarkup(`<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="errorPatternTitle"><section class="modal-card error-pattern-modal" tabindex="-1">
      <header class="error-detail-head"><span>${errorPatternIcon(pattern)}</span><div><p class="quiz-kicker">${t("errorAnalysis.detailKicker")}</p><h2 id="errorPatternTitle">${escapeHtml(title)}</h2><p>${escapeHtml(errorPatternText(pattern))}</p></div><em class="error-pattern-status ${pattern.development.status}">${escapeHtml(errorPatternStatusLabel(pattern.development.status))}</em></header>
      ${context}
      <section class="error-detail-cause"><span>?</span><div><strong>${t("errorAnalysis.causeTitle")}</strong><p>${escapeHtml(errorPatternText(pattern))}</p></div></section>
      ${errorPatternDevelopmentMarkup(pattern)}
      <section class="error-detail-criterion"><strong>${t("errorAnalysis.statusTitle")}</strong><p>${escapeHtml(errorPatternCriterionText(pattern))}</p></section>
      <details class="error-detail-data"><summary><span><strong>${t("cleanup2.analysisDetails")}</strong><small>${t("cleanup2.analysisDetailsHint")}</small></span><i aria-hidden="true">⌄</i></summary><section class="error-detail-metrics"><article><small>${t("errorAnalysis.wrongOfRelevant")}</small><strong>${pattern.errors}/${pattern.opportunities}</strong><span>${Math.round(pattern.rate*100)}%</span></article><article><small>${t("errorAnalysis.sessionsSeen")}</small><strong>${pattern.sessions}</strong><span>${t("errorAnalysis.trainingUnits")}</span></article><article><small>${t("errorAnalysis.correctStreak")}</small><strong>${pattern.development.correctStreak}</strong><span>${t("errorAnalysis.confirmations")}</span></article></section></details>
      <section class="error-detail-training ${canTrain?"":"locked"}"><div><small>${t("errorAnalysis.problemTrainingKicker")}</small><strong>${t("errorAnalysis.problemTrainingTitle")}</strong><p>${canTrain?t("errorAnalysis.problemTrainingText"):t("errorAnalysis.problemTrainingLocked")}</p></div><span>${tp("train.questionCountOne","train.questionCount",8)}</span></section>
      <div class="modal-actions"><button id="closeErrorPattern" class="secondary-button">${t("common.close")}</button><button id="startProblemTraining" class="primary-button" ${canTrain?"":"disabled"}>${t("errorAnalysis.startProblemTraining")}</button></div>
    </section></div>`,{initialFocus:canTrain?"#startProblemTraining":"#closeErrorPattern"});
    document.getElementById("closeErrorPattern")?.addEventListener("click",()=>closeModal());
    document.getElementById("startProblemTraining")?.addEventListener("click",()=>closeModal(()=>launchProblemTraining(buildProblemTrainingPlan(pattern))));
  }

  function fixedImpactSpec(attackingType,defendingTypes,difficulty="medium") {
    const correctMultiplier=effectiveness(attackingType,defendingTypes);
    const all=[0,.25,.5,1,2,4];
    const optionCount=difficulty==="easy"?4:6;
    const alternatives=shuffle(all.filter(value=>value!==correctMultiplier)).slice(0,optionCount-1);
    return {kind:"impact",attackingType,defendingTypes:[...defendingTypes],options:shuffle([correctMultiplier,...alternatives]),correctMultiplier,focusTypes:unique([attackingType,...defendingTypes])};
  }

  function problemImpactMatching(predicate,difficulty="medium",random=Math.random) {
    for(let attempt=0;attempt<240;attempt+=1){
      const attackingType=randomItem(TYPES,random);
      const dual=random()<.72;
      const defendingTypes=dual?shuffle(TYPES,random).slice(0,2):[randomItem(TYPES,random)];
      const expected=effectiveness(attackingType,defendingTypes);
      const factors=defendingTypes.map(type=>effectiveness(attackingType,[type]));
      if(predicate({attackingType,defendingTypes,expected,factors}))return fixedImpactSpec(attackingType,defendingTypes,difficulty);
    }
    return generateImpactSpec({difficulty,defense:"mixed",random});
  }

  function problemPokemonSpec(pattern,difficulty="medium",index=0,random=Math.random) {
    const sample=pattern.sample||{};
    let pool=FALLBACK_POKEMON;
    if(pattern.key.startsWith("pokemon:")&&sample.pokemonId){
      const exact=FALLBACK_POKEMON.find(item=>item.id===Number(sample.pokemonId));
      if(index===0&&exact)return {kind:"pokemon",pokemon:formatFallbackPokemon(exact),display:difficulty==="hard"?"image":"both",focusTypes:[...exact.types]};
      if(exact)pool=FALLBACK_POKEMON.filter(item=>item.types.some(type=>exact.types.includes(type)));
    }else if(pattern.code==="pokemon-missing-secondary")pool=FALLBACK_POKEMON.filter(item=>item.types.length===2);
    else if(pattern.code==="pokemon-extra-type")pool=FALLBACK_POKEMON.filter(item=>item.types.length===1);
    const pokemon=randomItem(pool.length?pool:FALLBACK_POKEMON,random);
    return {kind:"pokemon",pokemon:formatFallbackPokemon(pokemon),display:difficulty==="hard"?"image":"both",focusTypes:[...pokemon.types]};
  }

  function problemSpecForPattern(pattern,difficulty="medium",index=0,random=Math.random) {
    let spec;
    if(pattern.key.startsWith("matchup:")&&pattern.sample?.attackingType&&pattern.sample?.defendingTypes?.length){
      const attacker=pattern.sample.attackingType;
      const original=[...pattern.sample.defendingTypes];
      if(index===0)spec=fixedImpactSpec(attacker,original,difficulty);
      else if(original.length===2){
        const keep=original[index%2];
        const replacement=randomItem(TYPES.filter(type=>!original.includes(type)),random);
        spec=fixedImpactSpec(attacker,[keep,replacement],difficulty);
      }else{
        const replacement=randomItem(TYPES.filter(type=>type!==original[0]),random);
        spec=fixedImpactSpec(attacker,[replacement],difficulty);
      }
    }
    else if(pattern.key.startsWith("pokemon:")||String(pattern.code).startsWith("pokemon"))spec=problemPokemonSpec(pattern,difficulty,index,random);
    else {
      const predicates={
        "direction-reversal":item=>item.defendingTypes.length===1&&item.expected!==effectiveness(item.defendingTypes[0],[item.attackingType]),
        "immunity-overlooked":item=>item.expected===0,
        "immunity-assumed":item=>item.expected!==0,
        "quarter-half-confusion":item=>item.defendingTypes.length===2&&(item.expected===.25||item.expected===.5),
        "double-quad-confusion":item=>item.defendingTypes.length===2&&(item.expected===2||item.expected===4),
        "dual-neutralization":item=>item.defendingTypes.length===2&&item.expected===1&&item.factors.includes(2)&&item.factors.includes(.5),
        "dual-multiplication":item=>item.defendingTypes.length===2&&item.factors.some(value=>value!==1)
      };
      spec=problemImpactMatching(predicates[pattern.code]||(()=>true),difficulty,random);
    }
    const focusKey=smartFocusKeyForSpec(spec);
    return {...spec,_smartFocusKey:focusKey,_smartLabel:errorPatternTitle(pattern),_smartSource:"problem",_smartBaseDifficulty:difficulty,_smartDifficulty:difficulty,_smartDifficultyReason:"problem",_smartDifficultyCalibrating:false,_problemPatternKey:pattern.key,_problemSource:index===0?"exact":"similar"};
  }

  function buildProblemTrainingPlan(pattern) {
    const base=pattern.rate>=.65?"easy":pattern.rate<=.30?"hard":"medium";
    const levels=base==="easy"?["easy","easy","medium","medium","medium","medium","medium","medium"]:base==="hard"?["medium","medium","hard","hard","hard","hard","hard","hard"]:["easy","medium","medium","medium","medium","medium","hard","hard"];
    const sequence=[];const signatures=new Set();
    for(let index=0;index<8;index+=1){
      let spec=null;
      for(let attempt=0;attempt<100;attempt+=1){
        const candidate=problemSpecForPattern(pattern,levels[index],index,Math.random);
        const signature=questionSignature(candidate);
        if(!signatures.has(signature)){spec=candidate;signatures.add(signature);break;}
      }
      if(spec)sequence.push(spec);
    }
    while(sequence.length<8){const fallback=problemSpecForPattern(pattern,"medium",sequence.length,Math.random);if(!signatures.has(questionSignature(fallback))){signatures.add(questionSignature(fallback));sequence.push(fallback);}}
    return {patternKey:pattern.key,title:errorPatternTitle(pattern),sequence,initial:errorPatternSnapshot(pattern),difficultyCounts:ADAPTIVE_DIFFICULTIES.reduce((map,level)=>({...map,[level]:sequence.filter(spec=>spec._smartDifficulty===level).length}),{})};
  }

  function errorPatternSnapshot(pattern) {
    return {key:pattern.key,errors:pattern.errors,opportunities:pattern.opportunities,rate:pattern.rate,status:pattern.development.status,recentRate:pattern.development.recentRate,correctStreak:pattern.development.correctStreak};
  }

  function launchProblemTraining(plan) {
    if(!plan?.sequence?.length)return;
    session=newSession("problem",{length:plan.sequence.length,difficulty:"adaptive"},plan.sequence);
    session.problemPlan={patternKey:plan.patternKey,title:plan.title,difficultyCounts:{...plan.difficultyCounts}};
    session.problemBefore={...plan.initial};
    session.adaptiveFlow={offset:0,lastChecked:0,adjustments:[],initialDifficultyCounts:{...plan.difficultyCounts}};
    prepareRouteMotion(state.route,"session","forward");state.route="session";saveState();updateNavigation();renderQuestion();
  }

  function problemSessionProgress() {
    if(session?.mode!=="problem"||!session.problemPlan)return null;
    const after=errorPatternByKey(session.problemPlan.patternKey);
    const answerRate=percent(session.correct,session.answers.length);
    const before=session.problemBefore||{};
    const resolved=after?.development.status==="resolved";
    const improved=resolved||answerRate>=75||Number(after?.development.recentRate||1)<Number(before.recentRate||1);
    return {answerRate,resolved,improved,before,after:after?errorPatternSnapshot(after):null};
  }

  function problemTrainingSummaryMarkup() {
    if(session?.mode!=="problem")return"";
    const progress=session.problemProgress||problemSessionProgress();
    if(!progress)return"";
    const stateKey=progress.resolved?"resolved":progress.improved?"improved":"practice";
    return `<section class="summary-problem-card ${stateKey}"><span>${progress.resolved?"✓":progress.improved?"↗":"◎"}</span><div><p class="quiz-kicker">${t("errorAnalysis.problemSummaryKicker")}</p><h2>${t(`errorAnalysis.problemSummary.${stateKey}.title`)}</h2><p>${t(`errorAnalysis.problemSummary.${stateKey}.text`)}</p>${progress.after?`<b>${escapeHtml(errorPatternStatusLabel(progress.after.status))}</b>`:""}</div></section>`;
  }

  function mistakeIssueLabel(issue) {
    if (!issue) return "";
    if (issue.patternKey?.startsWith("matchup:")) return t("errorAnalysis.issue.matchup");
    if (issue.patternKey?.startsWith("pokemon:")) return t("errorAnalysis.issue.pokemon");
    return errorRuleTitle(issue.code);
  }

  function mistakeIssueChips(item) {
    const labels=unique((item.lastIssues||[]).map(mistakeIssueLabel).filter(Boolean)).slice(0,2);
    return labels.length?`<div class="mistake-issue-chips">${labels.map(label=>`<span>${escapeHtml(label)}</span>`).join("")}</div>`:"";
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
    content.innerHTML=`
      ${errorAnalysisMarkup()}
      <section class="mistake-book-hero cleanup-mistake-book">
        <div><p class="quiz-kicker">${t("cleanup2.questionSectionKicker")}</p><h2>${t("cleanup2.questionSectionTitle")}</h2><p>${t("cleanup2.questionSectionText")}</p>${open.length?`<strong class="mistake-open-count">${t("stats.openMistakes",{count:open.length})}</strong>`:""}</div>
        <button id="reviewAllMistakes" class="primary-button" ${open.length?"":"disabled"}>${t("stats.reviewAll")}</button>
      </section>
      <div class="modern-error-list">${open.length?open.map(item=>mistakeCard(item)).join(""):`<div class="empty-state-card success"><span>✓</span><strong>${t("stats.noErrors")}</strong><p>${t("stats.noErrorsHint")}</p></div>`}</div>`;
    document.getElementById("reviewAllMistakes")?.addEventListener("click",()=>{if(open.length)startReviewSession(open.map(item=>clone(item.spec)));});
    document.querySelectorAll("[data-error-pattern]").forEach(button=>button.addEventListener("click",()=>showErrorPatternDetail(button.dataset.errorPattern)));
  }

  function mistakeCard(item){
    const progress=Math.min(2,item.correctReviews||0);
    return `<article class="modern-error-card"><div class="modern-error-head"><span class="error-mode-icon">${modeVisual(item.spec.kind).icon}</span><div><strong>${escapeHtml(mistakeTitle(item))}</strong><small>${escapeHtml(modeName(item.spec.kind))} · ${formatDate(item.lastSeen)}</small></div><span class="error-count">${item.wrongCount}×</span></div>${mistakeIssueChips(item)}<div class="modern-error-answer"><small>${t("stats.correctSolution")}</small><div>${mistakeAnswer(item)}</div></div><div class="review-progress"><span>${t("stats.reviewProgress")}</span><div>${[0,1].map(step=>`<i class="${step<progress?"done":""}"></i>`).join("")}</div><strong>${progress}/2</strong></div></article>`;
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
      <section class="settings-hero"><div><p class="quiz-kicker">${t("settings.centerKicker")}</p><h1>${t("settings.centerTitle")}</h1><p>${t("settings.centerSubtitle")}</p></div><div class="settings-current-overview"><div class="settings-current-heading"><small>${t("settings.currentTitle")}</small><p>${t("settings.currentHint")}</p></div><div class="settings-status-grid"><span><small>${t("settings.language")}</small><strong>${languageLabel}</strong></span><span><small>${t("settings.theme")}</small><strong>${themeLabel}</strong></span><span><small>${t("settings.animations")}</small><strong>${state.animations?t("settings.on"):t("settings.off")}</strong></span></div></div></section>
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
        ${settingActionRow("exportProgress","↓",t("settings.export"),t("settings.exportDesc"),t("settings.exportAction"))}
        ${settingActionRow("importProgress","↑",t("settings.import"),t("settings.importDesc"),t("settings.importAction"))}
        <input id="importFile" type="file" accept="application/json" hidden>
        ${settingActionRow("exportFeedback","✎",t("settings.feedback"),t("settings.feedbackDesc"),t("settings.createReport"))}
        ${settingActionRow("exportDiagnostics","⌁",t("settings.diagnostics"),t("settings.diagnosticsDesc"),t("settings.exportAction"))}
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
    document.getElementById("resetProgress").addEventListener("click",()=>showConfirmDialog({ title:t("settings.resetTitle"), message:t("settings.resetConfirm"), confirmLabel:t("settings.resetAction"), cancelLabel:t("common.cancel"), kind:"danger", icon:"×", onConfirm:()=>{ QuizmonStorage.clearQuizmonData(localStorage, STORAGE_KEY, OLD_KEYS); state=clone(defaults); state.language=defaultLanguage; saveState(); renderSettings(); enqueueToast("✓",t("settings.resetDone"),t("settings.resetDoneHint"),"success"); } }));
  }

  function settingSelectRow(id,icon,title,description,options){const labelId=`${id}Label`;const descriptionId=`${id}Description`;return `<div class="modern-setting-row"><span class="modern-setting-icon" aria-hidden="true">${icon}</span><div class="modern-setting-copy"><h3 id="${labelId}">${title}</h3><p id="${descriptionId}">${description}</p></div><select id="${id}" class="select-control" aria-labelledby="${labelId}" aria-describedby="${descriptionId}">${options}</select></div>`;}
  function settingToggleRow(id,icon,title,description,on){return `<div class="modern-setting-row"><span class="modern-setting-icon" aria-hidden="true">${icon}</span><div class="modern-setting-copy"><h3>${title}</h3><p>${description}</p></div><button id="${id}" class="switch ${on?"on":""}" aria-label="${title}" aria-pressed="${on}"></button></div>`;}
  function settingActionRow(id,icon,title,description,label,danger=false){return `<div class="modern-setting-row"><span class="modern-setting-icon ${danger?"danger":""}" aria-hidden="true">${icon}</span><div class="modern-setting-copy"><h3>${title}</h3><p>${description}</p></div><button id="${id}" class="${danger?"danger-button":"secondary-button"}">${label}</button></div>`;}

  function downloadJson(data, filename) { const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url); }
  function exportProgress(){ const payload={app:"Quizmon",exportVersion:BUILD_VERSION,schema:DATA_SCHEMA,exportedAt:new Date().toISOString(),state}; downloadJson(payload,`Quizmon-Beta-1.3-Fortschritt-${todayKey()}.json`); state.diagnostics.lastBackup=new Date().toISOString(); saveState(); enqueueToast("↓",t("settings.exportDone"),t("settings.exportDoneHint"),"success"); }
  function exportDiagnostics(){ downloadJson({app:"Quizmon",version:PUBLIC_VERSION,build:BUILD_VERSION,schema:DATA_SCHEMA,createdAt:new Date().toISOString(),route:state.route,language:state.language,userAgent:navigator.userAgent,online:navigator.onLine,storage:{bytes:byteLength(state),learningEvents:state.stats.learning.events.length,errorEvents:state.stats.errorAnalysis.events.length,history:state.stats.history.length,pokemonCache:Object.keys(state.pokemonCache).length,importBackups:importBackupKeys().length},diagnostics:state.diagnostics},`Quizmon-Diagnose-${todayKey()}.json`); enqueueToast("↓",t("settings.diagnosticsDone"),t("settings.fileCreated"),"success"); }
  function exportFeedback(){ const report={category:"",description:"",expected:"",steps:"",appVersion:PUBLIC_VERSION,build:BUILD_VERSION,createdAt:new Date().toISOString(),route:state.route,language:state.language,userAgent:navigator.userAgent,recentErrors:state.diagnostics.errors.slice(-5)}; downloadJson(report,`Quizmon-Feedback-${todayKey()}.json`); enqueueToast("↓",t("settings.feedbackDone"),t("settings.fileCreated"),"success"); }
  function importBackupKeys() { return QuizmonStorage.listBackupKeys(localStorage, STORAGE_KEY); }

  function pruneImportBackups(limit = IMPORT_BACKUP_LIMIT) { return QuizmonStorage.pruneBackups(localStorage, STORAGE_KEY, limit); }

  function createImportBackup() {
    pruneImportBackups(Math.max(0, IMPORT_BACKUP_LIMIT - 1));
    const backup = clone(state);
    compactStateCollections(backup, { aggressive: true, record: false });
    QuizmonStorage.createBackup(localStorage, STORAGE_KEY, backup);
    pruneImportBackups();
  }

  async function importProgress(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const importButton = document.getElementById("importProgress");
    setButtonBusy(importButton, true, t("import.loading"));
    try {
      if (Number(file.size || 0) > MAX_IMPORT_BYTES) throw new Error("size");
      const currentVersions = [BUILD_VERSION, ...SUPPORTED_CURRENT_VERSIONS];
      const allowedVersions = new Set([...currentVersions,...SUPPORTED_ALPHA_VERSIONS,...SUPPORTED_LEGACY_VERSIONS]);
      const inspected = QuizmonImportGuard.parse(await file.text(), allowedVersions);
      const incoming = inspected.incoming;
      const ver = inspected.version;
      createImportBackup();
      state = [...currentVersions,...SUPPORTED_ALPHA_VERSIONS].includes(ver) ? repairState(incoming) : repairState(migrateLegacy(incoming));
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

  function openOnboarding(page=0){
    onboardingOpen=true;
    onboardingPage=Math.max(0,Math.min(5,Number(page)||0));
    onboardingDemoAnswer=null;
    renderOnboarding(true);
  }
  function renderOnboarding(forceShell=false){
    const pages=6;
    let backdrop = modalRoot.querySelector(".onboarding-backdrop");
    if(forceShell || !backdrop){
      setModalMarkup(`<div class="modal-backdrop onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboardingTitle"><section class="modal-card onboarding-modal"><div class="onboarding-progress-row"><div id="onboardingProgress" class="onboarding-progress" aria-hidden="true"></div><span id="onboardingStepCount" class="onboarding-step-count"></span></div><div id="onboardingContent"></div><div class="modal-actions onboarding-actions"><button id="backOnboarding" class="secondary-button">${t("common.back")}</button><button id="skipOnboarding" class="ghost-button">${t("common.skip")}</button><button id="nextOnboarding" class="primary-button"></button></div></section></div>`, { closeOnBackdrop: false, closeOnEscape: false, initialFocus: "#nextOnboarding" });
      backdrop = modalRoot.querySelector(".onboarding-backdrop");
    }

    const progress = backdrop.querySelector("#onboardingProgress");
    const stepCount = backdrop.querySelector("#onboardingStepCount");
    const contentRoot = backdrop.querySelector("#onboardingContent");
    const backOnboardingButton = backdrop.querySelector("#backOnboarding");
    const nextButton = backdrop.querySelector("#nextOnboarding");
    const skipButton = backdrop.querySelector("#skipOnboarding");

    let content="";
    if(onboardingPage===0)content=`<p class="onboarding-kicker">${t("onboarding.welcomeKicker")}</p><div class="onboarding-visual">Q</div><h2 id="onboardingTitle">${t("onboarding.welcomeTitle")}</h2><p>${t("onboarding.welcomeText")}</p><div class="language-picks" role="group" aria-label="${t("onboarding.language")}"><button class="language-pick ${state.language==="de"?"active":""}" data-language="de" aria-pressed="${state.language==="de"}">🇩🇪 Deutsch</button><button class="language-pick ${state.language==="en"?"active":""}" data-language="en" aria-pressed="${state.language==="en"}">🇬🇧 English</button></div><p class="onboarding-note">${t("onboarding.languageText")}</p>`;
    else if(onboardingPage===1)content=`<div class="onboarding-visual">◎</div><h2 id="onboardingTitle">${t("onboarding.goalTitle")}</h2><p>${t("onboarding.goalText")}</p><div class="onboarding-concept-card"><div class="onboarding-matchup compact">${typeChip("water")}<span class="matchup-arrow" aria-hidden="true">→</span>${typeChip("fire")}<strong class="matchup-value">2×</strong></div><p>${t("onboarding.goalHint")}</p></div>`;
    else if(onboardingPage===2)content=`<div class="onboarding-visual">→</div><h2 id="onboardingTitle">${t("onboarding.directionTitle")}</h2><p>${t("onboarding.directionText")}</p><div class="matchup-flow"><div class="matchup-side"><small>${t("onboarding.attacker")}</small>${typeChip("water","large")}</div><span class="matchup-arrow large" aria-hidden="true">→</span><div class="matchup-side"><small>${t("onboarding.defender")}</small>${typeChip("fire","large")}</div></div><div class="matchup-result"><strong>2×</strong><span>${t("onboarding.directionResult")}</span></div><p class="onboarding-note">${t("onboarding.directionHint")}</p>`;
    else if(onboardingPage===3)content=`<div class="onboarding-visual">×</div><h2 id="onboardingTitle">${t("onboarding.basicsTitle")}</h2><p>${t("onboarding.basicsText")}</p><div class="multiplier-guide beginner-guide"><div data-multiplier="2"><strong>2×</strong><span><b>${t("onboarding.double")}</b><small>${t("onboarding.doubleHint")}</small></span></div><div data-multiplier="1"><strong>1×</strong><span><b>${t("onboarding.normal")}</b><small>${t("onboarding.normalHint")}</small></span></div><div data-multiplier="0.5"><strong>½×</strong><span><b>${t("onboarding.half")}</b><small>${t("onboarding.halfHint")}</small></span></div><div data-multiplier="0"><strong>0×</strong><span><b>${t("onboarding.none")}</b><small>${t("onboarding.noneHint")}</small></span></div></div><p class="onboarding-note">${t("onboarding.advancedLater")}</p>`;
    else if(onboardingPage===4)content=`<div class="onboarding-visual">?</div><h2 id="onboardingTitle">${t("onboarding.effectTitle")}</h2><p>${t("onboarding.effectText")}</p><div class="demo-question beginner-demo"><div class="onboarding-matchup">${typeChip("water")}<span class="matchup-arrow" aria-hidden="true">→</span>${typeChip("fire")}</div><div class="demo-options onboarding-demo-options" role="group" aria-label="${t("onboarding.chooseMultiplier")}">${[.5,1,2].map(value=>`<button class="demo-option demo-multiplier" data-demo-multiplier="${value}" aria-label="${formatMultiplier(value)}">${formatMultiplier(value)}</button>`).join("")}</div><div id="demoMessage" class="demo-message" aria-live="polite">${t("onboarding.answerToContinue")}</div></div>`;
    else content=`<div class="onboarding-visual">✓</div><h2 id="onboardingTitle">${t("onboarding.readyTitle")}</h2><p>${t("onboarding.readyText")}</p><div class="feature-list"><div class="feature-item"><span class="feature-icon">10</span><span><strong>${t("onboarding.readyShortTitle")}</strong><small>${t("onboarding.readyShortText")}</small></span></div><div class="feature-item"><span class="feature-icon">1</span><span><strong>${t("onboarding.readySimpleTitle")}</strong><small>${t("onboarding.readySimpleText")}</small></span></div><div class="feature-item"><span class="feature-icon">↻</span><span><strong>${t("onboarding.readyLearnTitle")}</strong><small>${t("onboarding.readyLearnText")}</small></span></div></div><p class="onboarding-note">${t("onboarding.readyLater")}</p><div class="onboarding-ruleset"><strong>${t("rules.badge")}</strong><span>${t("rules.mainSeries")}</span></div>`;

    progress.innerHTML = Array.from({length:pages},(_,i)=>`<span class="${i===onboardingPage?"active":""}"></span>`).join("");
    stepCount.textContent = t("onboarding.stepCount",{current:onboardingPage+1,total:pages});
    contentRoot.innerHTML = content;
    const onboardingTitle = contentRoot.querySelector("#onboardingTitle");
    onboardingTitle?.setAttribute("tabindex","-1");
    contentRoot.classList.remove("onboarding-step-enter");
    if(motionEnabled()){void contentRoot.offsetWidth;contentRoot.classList.add("onboarding-step-enter");}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const modalCard=backdrop.querySelector(".onboarding-modal");
      if(modalCard)modalCard.scrollTop=0;
      onboardingTitle?.focus?.({preventScroll:true});
      if(modalCard)modalCard.scrollTop=0;
    }));
    backOnboardingButton.hidden = onboardingPage===0;
    backOnboardingButton.textContent = t("common.back");
    nextButton.textContent = onboardingPage===pages-1 ? t("onboarding.startTraining") : t("common.next");
    nextButton.disabled = onboardingPage===4 && onboardingDemoAnswer===null;
    skipButton.textContent = onboardingPage===pages-1 ? t("onboarding.showHome") : t("common.skip");

    backdrop.querySelectorAll("[data-language]").forEach(button=>button.addEventListener("click",()=>{state.language=button.dataset.language;saveState();applyPreferences();renderOnboarding(false);}));
    backdrop.querySelectorAll("[data-demo-multiplier]").forEach(button=>button.addEventListener("click",()=>{
      if(onboardingDemoAnswer!==null)return;
      onboardingDemoAnswer=Number(button.dataset.demoMultiplier);
      const correct=onboardingDemoAnswer===2;
      backdrop.querySelectorAll("[data-demo-multiplier]").forEach(item=>{
        const value=Number(item.dataset.demoMultiplier);
        item.classList.toggle("correct",value===2);
        item.classList.toggle("incorrect",item===button&&!correct);
        item.disabled=true;
      });
      const message=backdrop.querySelector("#demoMessage");
      message.textContent=correct?t("onboarding.effectCorrect"):t("onboarding.effectWrong");
      message.classList.toggle("success",correct);
      message.classList.toggle("error",!correct);
      nextButton.disabled=false;
      haptic(correct?"success":"error");
    }));
    backOnboardingButton.onclick = ()=>lockInteraction(backOnboardingButton,()=>{if(onboardingPage>0){onboardingPage-=1;onboardingDemoAnswer=null;renderOnboarding(false);}},220);
    skipButton.onclick = ()=>completeOnboarding(false);
    nextButton.onclick = ()=>lockInteraction(nextButton,()=>{if(onboardingPage<pages-1){onboardingPage+=1;onboardingDemoAnswer=null;renderOnboarding(false);}else completeOnboarding(true);},300);
  }
  function startBeginnerTraining(){
    state.config.effectiveness={...state.config.effectiveness,length:10,kind:"effective",difficulty:"easy"};
    startSession("effectiveness");
  }
  function completeOnboarding(startTraining){onboardingOpen=false;onboardingDemoAnswer=null;state.onboardingComplete=true;saveState();closeModal(()=>{if(startTraining)startBeginnerTraining();else render();});}

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
        const [pokemonData,speciesData]=await Promise.all([
          QuizmonNetwork.fetchJson(`https://pokeapi.co/api/v2/pokemon/${randomId}`),
          QuizmonNetwork.fetchJson(`https://pokeapi.co/api/v2/pokemon-species/${randomId}`)
        ]);const lang=state.language==="de"?"de":"en";const name=speciesData.names.find(entry=>entry.language.name===lang)?.name||speciesData.names.find(entry=>entry.language.name==="en")?.name||pokemonData.name;
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
  function artworkUrl(id) { return QuizmonNetwork.artworkUrl(id); }


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
    if(state.route==="learn"&&state.learnTab==="cards"&&flashcardSession){finishFlashcardSession();return;}
    if(state.route==="session"){requestExitSession("train");return;}
    if(canUseBrowserBack()){history.back();return;}
    if(state.route==="profile"){setRoute("home");return;}
    if(state.route==="learn-detail"){if(knowledgeSearchOpenedResult){returnToKnowledgeSearchResults();return;}setRoute("knowledge");return;}
    if(state.route.startsWith("setup-")){setRoute("train");return;}
    if(state.route==="summary"){session=null;setRoute("train");return;}
    setRoute("home");
  });
  homeButton.addEventListener("click",()=>{knowledgeSearchOpenedResult=false;knowledgeSearchOrigin=null;if(state.route==="session"){requestExitSession("home");return;}session=null;setRoute("home");});
  brandButton.addEventListener("click",()=>{knowledgeSearchOpenedResult=false;knowledgeSearchOrigin=null;if(state.route==="session"){requestExitSession("home");return;}session=null;setRoute("home");});
  levelButton.addEventListener("click",()=>{knowledgeSearchOpenedResult=false;knowledgeSearchOrigin=null;setRoute("profile");});
  navButtons.forEach(button=>button.addEventListener("click",()=>{knowledgeSearchOpenedResult=false;knowledgeSearchOrigin=null;if(state.route==="session"){requestExitSession(button.dataset.route);return;}session=null;setRoute(button.dataset.route);}));

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
    const activeTag=document.activeElement?.tagName?.toLowerCase();
    const editing=["input","textarea","select"].includes(activeTag)||document.activeElement?.isContentEditable;
    const interactive=["button","a","input","textarea","select"].includes(activeTag)||document.activeElement?.isContentEditable;
    if(!editing&&state.route==="learn"&&state.learnTab==="cards"&&flashcardSession){
      if(event.key==="Escape"){event.preventDefault();finishFlashcardSession();return;}
      if(flashcardSession.phase!=="summary"){
        if(!interactive&&(event.key===" "||event.code==="Space")){event.preventDefault();flashcardToggleReveal();return;}
        if(flashcardSession.revealed&&["1","2","3"].includes(event.key)){event.preventDefault();flashcardRate({"1":"known","2":"unsure","3":"unknown"}[event.key]);return;}
        if(event.key==="ArrowRight"){event.preventDefault();const progress=QuizmonFlashcards.progress(flashcardSession);const rating=QuizmonFlashcards.ratingFor(flashcardSession);if(rating&&!progress.last)flashcardMove(1);return;}
        if(event.key==="ArrowLeft"){event.preventDefault();const progress=QuizmonFlashcards.progress(flashcardSession);if(!progress.first)flashcardMove(-1);return;}
        if(event.key.toLowerCase()==="s"&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();flashcardShuffle();return;}
      }
    }
    const searchShortcut=(event.key==="/"&&!event.ctrlKey&&!event.metaKey&&!event.altKey)||(event.key.toLowerCase()==="k"&&(event.ctrlKey||event.metaKey));
    if(searchShortcut&&!editing&&["knowledge","learn-detail"].includes(state.route)){
      event.preventDefault();
      if(state.route==="knowledge"&&knowledgeView==="search")document.getElementById("knowledgeSearchPageInput")?.focus();
      else openKnowledgeSearchPage();
      return;
    }
    if (event.key !== "Escape" || !isInnerRoute(state.route)) return;
    event.preventDefault();
    backButton.click();
  });


  window.addEventListener("popstate", event => {
    const target = event.state?.quizmon;
    if (!target?.snapshot) return;
    browserHistoryIndex = Math.max(0, Number(target.index) || 0);
    if (modalStack.length) {
      closeModal();
      pushBrowserHistorySnapshot();
      return;
    }
    if (state.route === "session" && session?.answers?.length && target.snapshot.route !== "session") {
      pendingHistorySnapshot = target.snapshot;
      pushBrowserHistorySnapshot();
      showConfirmDialog({
        title:t("session.exitTitle"), message:t("session.exitConfirm"), confirmLabel:t("session.exitAction"), cancelLabel:t("session.keepTraining"), kind:"danger", icon:"!",
        onConfirm:()=>{ const snapshot=pendingHistorySnapshot; pendingHistorySnapshot=null; session=null; restoreRouteSnapshot(snapshot,{replace:true}); }
      });
      return;
    }
    restoreRouteSnapshot(target.snapshot);
  });

  matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{if(state.theme==="system")applyPreferences();});
  reducedMotionQuery.addEventListener?.("change",()=>{applyPreferences();scheduleViewMotion();});
  window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;if(state.route==="home")renderHome();});

  document.addEventListener("error", event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    QuizmonImageFallback.apply(image);
  }, true);

  window.addEventListener("error", e => logError(e.error || e.message, "window.error"));
  window.addEventListener("unhandledrejection", e => logError(e.reason, "unhandledrejection"));

  function applyNetworkStatus(announce = false) {
    const online = navigator.onLine;
    document.documentElement.dataset.network = online ? "online" : "offline";
    if (!announce) return;
    enqueueToast(online ? "✓" : "⌁", online ? t("toast.online") : t("toast.offline"), online ? t("toast.onlineDesc") : t("toast.offlineDesc"), online ? "success" : "warning");
  }

  window.addEventListener("online", () => { applyNetworkStatus(true); syncWhosDailyResults(); });
  window.addEventListener("offline", () => applyNetworkStatus(true));

  if("serviceWorker"in navigator&&location.protocol.startsWith("http")){
    navigator.serviceWorker.addEventListener("message",event=>{
      if(event.data?.type==="QUIZMON_SW_ACTIVATED"&&event.data.legacyEntriesRemoved>0){
        enqueueToast("↻",t("toast.updated"),t("toast.updatedDesc"),"success");
      }
    });

    addEventListener("load",async()=>{
      try{
        const registration=await navigator.serviceWorker.register("./service-worker.js?build=visual-refresh-sprint2-v1",{updateViaCache:"none"});
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
  initializeBrowserHistory();
  saveState();
  render();
  syncWhosDailyResults();
  if (!navigator.onLine) setTimeout(() => applyNetworkStatus(true), 250);
})();
