const VERSION = "pokemon-type-learner-v0.6.1-alpha";
const SHELL = [
  "./", "./index.html", "./styles.css", "./data.js", "./i18n.js", "./app.js",
  "./manifest.webmanifest", "./locales/de.json", "./locales/en.json", "./assets/icon-180.png", "./assets/icon-192.png", "./assets/icon-512.png", "./assets/icon-maskable-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const request = event.request;
  const url = new URL(request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => {
      const copy=response.clone(); caches.open(VERSION).then(cache=>cache.put("./index.html",copy)); return response;
    }).catch(()=>caches.match("./index.html")));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(VERSION).then(cache => cache.put(request, copy));
      return response;
    }).catch(() => caches.match("./index.html"))));
    return;
  }

  if (url.hostname.includes("pokeapi.co") || url.hostname.includes("raw.githubusercontent.com")) {
    event.respondWith(caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        const copy = response.clone();
        caches.open(VERSION).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => cached);
      return cached || network;
    }));
  }
});
