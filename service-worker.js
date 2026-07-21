const CACHE_PREFIX = "quizmon-beta-1-0";
const BUILD = "1-6-sprint2-v1-github-clean";
const SHELL_CACHE = `${CACHE_PREFIX}-${BUILD}-shell`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-${BUILD}-runtime`;
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
  "./assets/icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png",
  "./assets/pokemon-placeholder.svg"
];
const RUNTIME_LIMIT = 240;

async function trimCache(cacheName, limit = RUNTIME_LIMIT) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map(key => cache.delete(key)));
}

async function cacheSuccessful(cacheName, request, response) {
  if (!response || (!response.ok && response.type !== "opaque")) return response;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  trimCache(cacheName).catch(() => {});
  return response;
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, RUNTIME_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && !keep.has(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const request = event.request;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cached = await caches.match("./index.html", { cacheName: SHELL_CACHE });
      if (cached) return cached;
      try {
        const response = await fetch(request);
        return cacheSuccessful(SHELL_CACHE, "./index.html", response);
      } catch {
        return new Response("Quizmon ist offline noch nicht vollständig eingerichtet.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    })());
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(request, { cacheName: SHELL_CACHE, ignoreSearch: true });
      if (cached) return cached;
      try {
        const response = await fetch(request);
        return cacheSuccessful(RUNTIME_CACHE, request, response);
      } catch {
        return new Response("", { status: 503, statusText: "Offline" });
      }
    })());
    return;
  }

  if (url.hostname === "pokeapi.co" || url.hostname === "raw.githubusercontent.com") {
    event.respondWith((async () => {
      const cached = await caches.match(request, { cacheName: RUNTIME_CACHE });
      const network = fetch(request).then(response => cacheSuccessful(RUNTIME_CACHE, request, response)).catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }
      return (await network) || new Response("", { status: 503, statusText: "Offline" });
    })());
  }
});
