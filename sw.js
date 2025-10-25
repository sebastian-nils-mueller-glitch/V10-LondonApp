/* === LondonApp V3.6 – Service Worker Light === */
/* Ziel:
   - Offline-Basisfunktionen (App öffnet sich aus Cache)
   - Keine harten Reload-Probleme (keine Stuck-Versionen)
   - Automatische Aktualisierung bei neuem Deployment
*/

const CACHE_NAME = "london2025-v36";
const OFFLINE_URLS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./london2025_data.json",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
];

/* Install: Cache-Dateien laden */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

/* Aktivierung: Alte Caches löschen */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

/* Fetch: Netzwerk bevorzugen, Fallback auf Cache */
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request).then((res) => res || caches.match("./index.html")))
  );
});

/* Force Update Handler (optional) */
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
