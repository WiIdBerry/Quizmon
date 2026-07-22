const CACHE_PREFIX = "quizmon-beta-1-0";
const BUILD = "1-6-sprint2-v2-hotfix1";
const SHELL_CACHE = `${CACHE_PREFIX}-${BUILD}-shell`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-${BUILD}-runtime`;
const CURRENT_CACHES = new Set([SHELL_CACHE, RUNTIME_CACHE]);
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./data.js",
  "./cosmetics.js",
  "./i18n.js",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/cosmetics/avatars/ampharos.png",
  "./assets/cosmetics/avatars/beleber.png",
  "./assets/cosmetics/avatars/bisasam.png",
  "./assets/cosmetics/avatars/blitzorden.png",
  "./assets/cosmetics/avatars/blue.png",
  "./assets/cosmetics/avatars/brendan.png",
  "./assets/cosmetics/avatars/brutalanda.png",
  "./assets/cosmetics/avatars/dawn.png",
  "./assets/cosmetics/avatars/despotar.png",
  "./assets/cosmetics/avatars/drache.png",
  "./assets/cosmetics/avatars/dragoran.png",
  "./assets/cosmetics/avatars/eis.png",
  "./assets/cosmetics/avatars/eisorden.png",
  "./assets/cosmetics/avatars/elektro.png",
  "./assets/cosmetics/avatars/ethan.png",
  "./assets/cosmetics/avatars/evoli.png",
  "./assets/cosmetics/avatars/feuer.png",
  "./assets/cosmetics/avatars/feuerorden.png",
  "./assets/cosmetics/avatars/gengar.png",
  "./assets/cosmetics/avatars/gestein.png",
  "./assets/cosmetics/avatars/gesteinsorden.png",
  "./assets/cosmetics/avatars/gift.png",
  "./assets/cosmetics/avatars/glurak.png",
  "./assets/cosmetics/avatars/greninja.png",
  "./assets/cosmetics/avatars/guardevoir.png",
  "./assets/cosmetics/avatars/hyperball.png",
  "./assets/cosmetics/avatars/hypertrank.png",
  "./assets/cosmetics/avatars/juliana.png",
  "./assets/cosmetics/avatars/kampf.png",
  "./assets/cosmetics/avatars/lapras.png",
  "./assets/cosmetics/avatars/leaf.png",
  "./assets/cosmetics/avatars/lohgock.png",
  "./assets/cosmetics/avatars/lucario.png",
  "./assets/cosmetics/avatars/lyra.png",
  "./assets/cosmetics/avatars/may.png",
  "./assets/cosmetics/avatars/meisterball.png",
  "./assets/cosmetics/avatars/mew.png",
  "./assets/cosmetics/avatars/normal.png",
  "./assets/cosmetics/avatars/pflanze.png",
  "./assets/cosmetics/avatars/pflanzenorden.png",
  "./assets/cosmetics/avatars/pikachu.png",
  "./assets/cosmetics/avatars/pokeball.png",
  "./assets/cosmetics/avatars/rayquaza.png",
  "./assets/cosmetics/avatars/red.png",
  "./assets/cosmetics/avatars/regenbogenorden.png",
  "./assets/cosmetics/avatars/relaxo.png",
  "./assets/cosmetics/avatars/safariball.png",
  "./assets/cosmetics/avatars/schiggy.png",
  "./assets/cosmetics/avatars/seelenorden.png",
  "./assets/cosmetics/avatars/siegerorden.png",
  "./assets/cosmetics/avatars/steven.png",
  "./assets/cosmetics/avatars/sumpforden.png",
  "./assets/cosmetics/avatars/superball.png",
  "./assets/cosmetics/avatars/top-trank.png",
  "./assets/cosmetics/avatars/trank.png",
  "./assets/cosmetics/avatars/turtok.png",
  "./assets/cosmetics/avatars/vollbeleber.png",
  "./assets/cosmetics/avatars/wasser.png",
  "./assets/cosmetics/avatars/wasserorden.png",
  "./assets/cosmetics/avatars/zoroark.png",
  "./assets/cosmetics/banners/aqua-current.svg",
  "./assets/cosmetics/banners/arena-lights.svg",
  "./assets/cosmetics/banners/aurora-crown.svg",
  "./assets/cosmetics/banners/badge-collection.svg",
  "./assets/cosmetics/banners/battle-impact.svg",
  "./assets/cosmetics/banners/champion-hall.svg",
  "./assets/cosmetics/banners/crystal-flow.svg",
  "./assets/cosmetics/banners/dex-horizon.svg",
  "./assets/cosmetics/banners/dragon-rift.svg",
  "./assets/cosmetics/banners/elite-chamber.svg",
  "./assets/cosmetics/banners/evoli-charm.svg",
  "./assets/cosmetics/banners/evolution-pulse.svg",
  "./assets/cosmetics/banners/frozen-core.svg",
  "./assets/cosmetics/banners/gengar-night.svg",
  "./assets/cosmetics/banners/glitch-legend.svg",
  "./assets/cosmetics/banners/glurak-blaze.svg",
  "./assets/cosmetics/banners/hexa-pulse.svg",
  "./assets/cosmetics/banners/holo-champion.svg",
  "./assets/cosmetics/banners/inferno-crest.svg",
  "./assets/cosmetics/banners/infinity-vault.svg",
  "./assets/cosmetics/banners/iron-forge.svg",
  "./assets/cosmetics/banners/lucario-aura.svg",
  "./assets/cosmetics/banners/lunar-eclipse.svg",
  "./assets/cosmetics/banners/master-sphere.svg",
  "./assets/cosmetics/banners/mew-cosmic.svg",
  "./assets/cosmetics/banners/neon-grid.svg",
  "./assets/cosmetics/banners/obsidian-flame.svg",
  "./assets/cosmetics/banners/phantom-mist.svg",
  "./assets/cosmetics/banners/pikachu-spark.svg",
  "./assets/cosmetics/banners/pixel-storm.svg",
  "./assets/cosmetics/banners/pokeball-clash.svg",
  "./assets/cosmetics/banners/prism-wave.svg",
  "./assets/cosmetics/banners/quiz-signal.svg",
  "./assets/cosmetics/banners/quizmon-legacy.svg",
  "./assets/cosmetics/banners/rare-candy-pop.svg",
  "./assets/cosmetics/banners/rayquaza-skyline.svg",
  "./assets/cosmetics/banners/relaxo-dream.svg",
  "./assets/cosmetics/banners/safari-trail.svg",
  "./assets/cosmetics/banners/shadow-fade.svg",
  "./assets/cosmetics/banners/shiny-spark.svg",
  "./assets/cosmetics/banners/sky-drift.svg",
  "./assets/cosmetics/banners/solar-burst.svg",
  "./assets/cosmetics/banners/star-circuit.svg",
  "./assets/cosmetics/banners/streak-fire.svg",
  "./assets/cosmetics/banners/terra-pulse.svg",
  "./assets/cosmetics/banners/thunder-strike.svg",
  "./assets/cosmetics/banners/topographic.svg",
  "./assets/cosmetics/banners/trainer-journey.svg",
  "./assets/cosmetics/banners/type-matrix.svg",
  "./assets/cosmetics/banners/verdant-bloom.svg",
  "./assets/cosmetics/banners/victory-stamp.svg",
  "./assets/favicon-32.png",
  "./assets/icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png",
  "./assets/pokemon-placeholder.svg"
];
const RUNTIME_LIMIT = 240;
const SCOPE_URL = new URL(self.registration.scope);
const INDEX_URL = new URL("./index.html", SCOPE_URL).href;
const SHELL_URLS = new Set(SHELL.map(path => new URL(path, SCOPE_URL).href));
const CORE_URLS = new Set([
  "./",
  "./index.html",
  "./styles.css",
  "./data.js",
  "./cosmetics.js",
  "./i18n.js",
  "./app.js",
  "./manifest.webmanifest"
].map(path => new URL(path, SCOPE_URL).href));

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
  return name.includes("quizmon") ||
    name.includes("pokemontyplearner") ||
    name.includes("pokemon-type-learner") ||
    name.includes("pokemon-typ-learner") ||
    name.startsWith("ptl-");
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

async function preCacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.all(SHELL.map(async asset => {
    const url = new URL(asset, SCOPE_URL).href;
    const response = await fetch(url, { cache: "reload" });
    if (!response.ok) throw new Error(`App-Datei konnte nicht gecacht werden: ${asset}`);
    await cache.put(url, response);
  }));
}

async function purgeLegacyQuizmonCaches() {
  const cacheNames = await caches.keys();
  let removedEntries = 0;

  for (const cacheName of cacheNames) {
    if (CURRENT_CACHES.has(cacheName)) continue;

    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    for (const request of requests) {
      if (isWithinQuizmonScope(request.url)) {
        if (await cache.delete(request)) removedEntries += 1;
      }
    }

    const remaining = await cache.keys();
    if (remaining.length === 0 && isKnownLegacyCache(cacheName)) {
      await caches.delete(cacheName);
    }
  }

  return removedEntries;
}

async function notifyAndRefreshLegacyClients(legacyEntriesRemoved) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  await Promise.all(clients.map(async client => {
    client.postMessage({ type: "QUIZMON_SW_ACTIVATED", build: BUILD, legacyEntriesRemoved });

    // Nur bei tatsächlich gefundenen Altdateien einmal neu laden. So wird eine
    // bereits gemischte alte/neue Oberfläche unmittelbar durch den Hotfix ersetzt.
    if (legacyEntriesRemoved > 0 && isWithinQuizmonScope(client.url) && "navigate" in client) {
      try { await client.navigate(client.url); } catch { /* Browser übernimmt beim nächsten Laden. */ }
    }
  }));
}

async function networkFirst(request, cacheName, fallbackRequest = request) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    return putSuccessful(cacheName, fallbackRequest, response);
  } catch {
    const cache = await caches.open(cacheName);
    return (await cache.match(fallbackRequest, { ignoreSearch: true })) || null;
  }
}

async function currentCacheFirst(request) {
  const shellCache = await caches.open(SHELL_CACHE);
  const shellResponse = await shellCache.match(request, { ignoreSearch: true });
  if (shellResponse) return shellResponse;

  const runtimeCache = await caches.open(RUNTIME_CACHE);
  const runtimeResponse = await runtimeCache.match(request, { ignoreSearch: true });
  if (runtimeResponse) return runtimeResponse;

  try {
    const response = await fetch(request);
    return putSuccessful(RUNTIME_CACHE, request, response);
  } catch {
    return null;
  }
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    await preCacheShell();
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const legacyEntriesRemoved = await purgeLegacyQuizmonCaches();
    await self.clients.claim();
    await notifyAndRefreshLegacyClients(legacyEntriesRemoved);
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "GET_BUILD") {
    event.source?.postMessage({ type: "QUIZMON_SW_BUILD", build: BUILD });
  }
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const request = event.request;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const response = await networkFirst(request, SHELL_CACHE, INDEX_URL);
      return response || new Response(
        "Quizmon ist offline noch nicht vollständig eingerichtet.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    })());
    return;
  }

  if (url.origin === SCOPE_URL.origin && url.pathname.startsWith(SCOPE_URL.pathname)) {
    event.respondWith((async () => {
      const normalizedUrl = new URL(request.url);
      normalizedUrl.search = "";
      const normalizedHref = normalizedUrl.href;

      // HTML, JavaScript, CSS und Manifest werden online immer zuerst frisch
      // geladen. Offline folgt ausschließlich der Cache dieses Builds.
      if (CORE_URLS.has(normalizedHref)) {
        const response = await networkFirst(request, SHELL_CACHE, normalizedHref);
        return response || new Response("", { status: 503, statusText: "Offline" });
      }

      // Vorinstallierte Grafiken stammen garantiert aus dem aktuellen Build.
      if (SHELL_URLS.has(normalizedHref)) {
        const cache = await caches.open(SHELL_CACHE);
        const cached = await cache.match(normalizedHref);
        if (cached) return cached;
      }

      return (await currentCacheFirst(request)) || new Response("", { status: 503, statusText: "Offline" });
    })());
    return;
  }

  if (url.hostname === "pokeapi.co" || url.hostname === "raw.githubusercontent.com") {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      const network = fetch(request)
        .then(response => putSuccessful(RUNTIME_CACHE, request, response))
        .catch(() => null);

      if (cached) {
        event.waitUntil(network);
        return cached;
      }

      return (await network) || new Response("", { status: 503, statusText: "Offline" });
    })());
  }
});
