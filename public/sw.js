/* Service worker Teologuida — lettura offline (PWA)
   Strategia:
   - PAGINE (navigazioni / HTML): network-first. Online mostra SEMPRE l'ultima
     versione pubblicata; offline ricade sull'ultima copia salvata (o la copertina).
     Fondamentale per un documento vivo e verificato: nessuno deve vedere testo vecchio.
   - ASSET statici (css/js/immagini/font): stale-while-revalidate. */
const VERSION = "teologuida-v3";
const CORE = [
  "/", "/manifest.webmanifest",
  "/favicon.png", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/og.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isPage = req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isPage) {
    // network-first: la pagina più recente quando c'è rete, cache solo offline
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("/")))
    );
    return;
  }

  // asset statici: stale-while-revalidate
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || net;
    })
  );
});
