/* Erica's Nail Bar offline shell.

   Caching rules, chosen so an update always reaches visitors:
     HTML, CSS, JS  -> network first, falling back to cache when offline.
     Images, fonts  -> cache first (their filenames change when they change).

   An earlier version cached CSS and JS cache-first, which meant a returning
   visitor could load new HTML against an old stylesheet. Bump CACHE on every
   deploy. */

const CACHE = "enb-v7";

const SHELL = [
  "./",
  "index.html",
  "css/style.css",
  "css/fonts.css",
  "js/main.js",
  "assets/fonts/playfair-400-800-normal-latin.woff2",
  "assets/fonts/montserrat-300-700-normal-latin.woff2",
  "assets/fonts/cinzel-400-700-normal-latin.woff2",
  "assets/fonts/greatvibes-400-normal-latin.woff2",
  "assets/icons/icon.svg",
  "assets/img/logo-380.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // allSettled so one missing file can't abort the whole install
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first: always try the server, refresh the cache, fall back offline.
function networkFirst(req) {
  return fetch(req)
    .then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    })
    .catch(() => caches.match(req).then((hit) => hit || caches.match("index.html")));
}

// Cache first: for assets whose filename changes when the content changes.
function cacheFirst(req) {
  return caches.match(req).then(
    (hit) =>
      hit ||
      fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
  );
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const isDoc  = req.mode === "navigate" ||
                 (req.headers.get("accept") || "").includes("text/html");
  const isCode = /\.(css|js|webmanifest)$/i.test(url.pathname);

  e.respondWith(isDoc || isCode ? networkFirst(req) : cacheFirst(req));
});
