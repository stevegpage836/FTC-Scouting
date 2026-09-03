// ============================================================================
// service-worker.js  —  makes the app load with NO internet connection.
// ============================================================================
// HOW IT WORKS:
//   1. On install, we cache all the core app files (the "app shell").
//   2. On every fetch, we serve from cache first, falling back to network.
//   3. When you change app files, BUMP the CACHE_VERSION below so phones
//      download the new version instead of using the old cached one.
//
// IMPORTANT: We deliberately do NOT cache requests to the Google Apps Script
// URL — syncing must always go to the live network.
// ============================================================================

const CACHE_VERSION = "ftc-scout-v1";   // <-- bump this (v2, v3...) on every release
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./db.js",
  "./sync.js",
  "./app.js",
  "./config.js",
  "./manifest.json",
  // idb library (small IndexedDB helper) served from a CDN, cached for offline use
  "https://cdn.jsdelivr.net/npm/idb@8/build/umd.js"
];

// --- Install: pre-cache the app shell -------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting(); // activate the new worker immediately
});

// --- Activate: delete old caches from previous versions -------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// --- Fetch: cache-first for app files, network-only for sync --------------
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Never cache the data-sync POSTs to Apps Script — always hit the network.
  if (url.includes("script.google.com")) {
    return; // let the browser handle it normally
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          // Optionally cache newly fetched same-origin GETs
          return response;
        }).catch(() => cached) // offline & not cached -> undefined, that's ok
      );
    })
  );
});
