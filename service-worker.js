const CACHE_PREFIX = "quizmon-beta-1-0";
const BUILD = "beta-1-0-patch-c-v1";
const SHELL_CACHE = `${CACHE_PREFIX}-${BUILD}-shell`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-${BUILD}-runtime`;
const SHELL = [
  "./", "./index.html", "./styles.css", "./styles-base.css", "./styles-components.css", "./styles-profile.css",
  "./data.js", "./cosmetics.js", "./i18n.js", "./core-utils.js", "./storage.js", "./app.js",
  "./manifest.webmanifest", "./assets/favicon-32.png", "./assets/icon-180.png", "./assets/icon-192.png",
  "./assets/icon-512.png", "./assets/icon-maskable-512.png", "./assets/pokemon-placeholder.svg"
];
const RUNTIME_LIMIT = 180;
const NETWORK_TIMEOUT_MS = 6500;

function withTimeout(promise, timeout = NETWORK_TIMEOUT_MS) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("Network timeout")), timeout))]);
}
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
async function precacheIndividually() {
  const cache = await caches.open(SHELL_CACHE);
  const results = await Promise.allSettled(SHELL.map(async asset => {
    const response = await withTimeout(fetch(asset, { cache: "reload" }));
    if (!response.ok) throw new Error(`${asset}: ${response.status}`);
    await cache.put(asset, response);
  }));
  const critical = new Set(["./index.html", "./app.js", "./data.js", "./styles.css"]);
  const missingCritical = SHELL.filter((asset, index) => critical.has(asset) && results[index].status === "rejected");
  if (missingCritical.length) throw new Error(`Critical shell files missing: ${missingCritical.join(", ")}`);
}
async function offlineImageFallback() {
  return (await caches.match("./assets/pokemon-placeholder.svg")) || new Response("", { status: 503 });
}

self.addEventListener("install", event => event.waitUntil(precacheIndividually().then(() => self.skipWaiting())));
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, RUNTIME_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && !keep.has(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("message", event => { if (event.data?.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const request = event.request;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await withTimeout(fetch(request));
        return cacheSuccessful(SHELL_CACHE, "./index.html", response);
      } catch {
        return (await caches.match("./index.html")) || new Response("Quizmon ist offline noch nicht vollständig eingerichtet.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    })());
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) {
        event.waitUntil(withTimeout(fetch(request)).then(response => cacheSuccessful(RUNTIME_CACHE, request, response)).catch(() => null));
        return cached;
      }
      try { return await cacheSuccessful(RUNTIME_CACHE, request, await withTimeout(fetch(request))); }
      catch { return request.destination === "image" ? offlineImageFallback() : new Response("", { status: 503, statusText: "Offline" }); }
    })());
    return;
  }

  if (["pokeapi.co", "raw.githubusercontent.com"].includes(url.hostname)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      const network = withTimeout(fetch(request)).then(response => cacheSuccessful(RUNTIME_CACHE, request, response)).catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }
      return (await network) || (request.destination === "image" ? offlineImageFallback() : new Response("", { status: 503, statusText: "Offline" }));
    })());
  }
});
