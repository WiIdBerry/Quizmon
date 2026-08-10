const CACHE_PREFIX = "quizmon-beta-1-3";
const BUILD = "4.1-sprint3-v8";
const SHELL_CACHE = `${CACHE_PREFIX}-${BUILD}-shell`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-${BUILD}-runtime`;
const CURRENT_CACHES = new Set([SHELL_CACHE, RUNTIME_CACHE]);
const NETWORK_TIMEOUT_MS = 6500;
const CORE_ASSET_TIMEOUT_MS = 20000;
const RUNTIME_LIMIT = 180;

const SHELL = Object.freeze([
  "./",
  "./index.html",
  "./styles.css",
  "./styles-base.css",
  "./styles-home.css",
  "./styles-play.css",
  "./styles-training.css",
  "./styles-learning.css",
  "./styles-knowledge.css",
  "./styles-progress.css",
  "./styles-profile.css",
  "./styles-motion.css",
  "./styles-feedback.css",
  "./styles-motivation.css",
  "./styles-intelligence.css",
  "./data.js",
  "./cosmetics.js",
  "./i18n.js",
  "./core-utils.js",
  "./quiz-engine.js",
  "./progress.js",
  "./storage.js",
  "./import-guard.js",
  "./phase3-state.js",
  "./i18n-utils.js",
  "./router.js",
  "./network.js",
  "./motivation.js",
  "./difficulty-engine.js",
  "./learning-engine.js",
  "./error-analysis.js",
  "./learning-path.js",
  "./knowledge-data.js",
  "./knowledge-content-data.js",
  "./knowledge-learnset-meta.js",
  "./knowledge-learnset-loader.js",
  "./knowledge-learnset-data.js",
  "./knowledge-world-data.js",
  "./knowledge-engine.js",
  "./knowledge-filter.js",
  "./knowledge-search.js",
  "./favorites.js",
  "./training-lists.js",
  "./flashcards.js",
  "./whos-that-pokemon.js",
  "./daily-service.js",
  "./image-fallback.js",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/favicon-32.png",
  "./assets/icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png",
  "./assets/pokemon-placeholder.svg",
  "./assets/item-placeholder.svg",
  "./assets/generic-placeholder.svg",
  "./assets/pokeidle-symbol.png"
]);

const SCOPE_URL = new URL(self.registration.scope);
const INDEX_URL = new URL("./index.html", SCOPE_URL).href;
const CORE_URLS = new Set(SHELL.map(path => new URL(path, SCOPE_URL).href));

function isSuccessful(response) {
  return Boolean(response && (response.ok || response.type === "opaque"));
}

function isWithinQuizmonScope(urlValue) {
  try {
    const url = new URL(urlValue);
    return url.origin === SCOPE_URL.origin && url.pathname.startsWith(SCOPE_URL.pathname);
  } catch {
    return false;
  }
}

function isKnownLegacyCache(cacheName) {
  const name = String(cacheName || "").toLowerCase();
  return name.includes("quizmon") || name.includes("pokemontyplearner") ||
    name.includes("pokemon-type-learner") || name.includes("pokemon-typ-learner") || name.startsWith("ptl-");
}

function withTimeout(promise, timeoutMs = NETWORK_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Network timeout")), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function trimCache(cacheName, limit = RUNTIME_LIMIT) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const excess = Math.max(0, keys.length - limit);
  await Promise.all(keys.slice(0, excess).map(key => cache.delete(key)));
}

async function putSuccessful(cacheName, request, response) {
  if (!isSuccessful(response)) return response;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  if (cacheName === RUNTIME_CACHE) trimCache(cacheName).catch(() => {});
  return response;
}

async function cacheCoreAsset(cache, asset) {
  const url = new URL(asset, SCOPE_URL).href;
  const response = await withTimeout(fetch(url, { cache: "reload" }), CORE_ASSET_TIMEOUT_MS);
  if (!response.ok) throw new Error(`${asset}: HTTP ${response.status}`);
  await cache.put(url, response);
}

async function preCacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  const results = await Promise.allSettled(SHELL.map(asset => cacheCoreAsset(cache, asset)));
  const missing = SHELL.filter((_, index) => results[index].status === "rejected");
  if (missing.length) throw new Error(`App-Kerndateien konnten nicht gecacht werden: ${missing.join(", ")}`);
}

async function purgeLegacyQuizmonCaches() {
  const cacheNames = await caches.keys();
  let removedEntries = 0;
  for (const cacheName of cacheNames) {
    if (CURRENT_CACHES.has(cacheName)) continue;
    if (isKnownLegacyCache(cacheName)) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      removedEntries += requests.filter(request => isWithinQuizmonScope(request.url)).length;
      await caches.delete(cacheName);
      continue;
    }
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    for (const request of requests) {
      if (isWithinQuizmonScope(request.url) && await cache.delete(request)) removedEntries += 1;
    }
  }
  return removedEntries;
}

async function notifyClients(legacyEntriesRemoved) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  await Promise.all(clients.map(client => client.postMessage({
    type: "QUIZMON_SW_ACTIVATED",
    build: BUILD,
    legacyEntriesRemoved
  })));
}

async function offlineImageFallback() {
  return (await caches.match(new URL("./assets/pokemon-placeholder.svg", SCOPE_URL).href)) ||
    new Response("", { status: 503, statusText: "Offline" });
}

async function networkFirst(request, cacheName, fallbackRequest = request) {
  try {
    const response = await withTimeout(fetch(request, { cache: "no-store" }));
    return putSuccessful(cacheName, fallbackRequest, response);
  } catch {
    const cache = await caches.open(cacheName);
    return (await cache.match(fallbackRequest, { ignoreSearch: true })) || null;
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  const network = withTimeout(fetch(request))
    .then(response => putSuccessful(RUNTIME_CACHE, request, response))
    .catch(() => null);
  if (cached) return { response: cached, update: network };
  return { response: await network, update: null };
}

self.addEventListener("install", event => {
  event.waitUntil(preCacheShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const legacyEntriesRemoved = await purgeLegacyQuizmonCaches();
    await trimCache(RUNTIME_CACHE);
    await self.clients.claim();
    await notifyClients(legacyEntriesRemoved);
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "GET_BUILD") event.source?.postMessage({ type: "QUIZMON_SW_BUILD", build: BUILD });
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const request = event.request;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const response = await networkFirst(request, SHELL_CACHE, INDEX_URL);
      return response || new Response("Quizmon ist offline noch nicht vollständig eingerichtet.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    })());
    return;
  }

  if (url.origin === SCOPE_URL.origin && url.pathname.startsWith(SCOPE_URL.pathname)) {
    const normalized = new URL(request.url);
    normalized.search = "";
    if (CORE_URLS.has(normalized.href)) {
      event.respondWith((async () => {
        const shellCache = await caches.open(SHELL_CACHE);
        const cached = await shellCache.match(normalized.href);
        if (cached) return cached;
        return (await networkFirst(request, SHELL_CACHE, normalized.href)) || new Response("", { status: 503, statusText: "Offline" });
      })());
      return;
    }
    event.respondWith((async () => {
      const result = await staleWhileRevalidate(request);
      if (result.update) event.waitUntil(result.update);
      return result.response || (request.destination === "image" ? offlineImageFallback() : new Response("", { status: 503, statusText: "Offline" }));
    })());
    return;
  }

  if (["pokeapi.co", "raw.githubusercontent.com", "play.pokemonshowdown.com"].includes(url.hostname)) {
    event.respondWith((async () => {
      const result = await staleWhileRevalidate(request);
      if (result.update) event.waitUntil(result.update);
      if (result.response) return result.response;
      if (request.destination === "image" && !url.searchParams.has("quizmon-media")) return offlineImageFallback();
      return new Response("", { status: 503, statusText: "Offline" });
    })());
  }
});
