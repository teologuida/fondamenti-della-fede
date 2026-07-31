/* Service worker Teologuida — lettura offline (PWA)
   Strategia: stale-while-revalidate per le pagine e gli asset dello stesso dominio.
   Serve subito la copia in cache (se c'è), aggiorna in background, e in assenza
   di rete mostra l'ultima versione salvata (o la copertina). */
const VERSION = "teologuida-v2";
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
        .catch(() => cached || (req.mode === "navigate" ? caches.match("/") : undefined));
      return cached || net;
    })
  );
});
