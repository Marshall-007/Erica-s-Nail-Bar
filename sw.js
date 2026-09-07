/* Erica's Nail Bar offline shell.
   Bump CACHE when you change files, so returning visitors get the new site. */
const CACHE = "enb-v1";
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
  "assets/img/logo-380.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  // HTML: network first, so content updates are picked up straight away.
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
    );
    return;
  }

  // Assets: cache first, fill the cache in the background.
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit)
    )
  );
});
