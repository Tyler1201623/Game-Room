/**
 * Game Room Service Worker
 * Provides offline functionality and caching
 */
const CACHE_NAME = "game-room-cache-v5";
const OFFLINE_URL = "./offline.html";

// Assets to pre-cache
const preCacheAssets = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./src/css/style.css",
  "./src/css/games/snake.css",
  "./src/css/games/tetris.css",
  "./src/css/games/tictactoe.css",
  "./src/css/games/memory.css",
  "./src/css/games/pacman.css",
  "./src/css/games/space.css",
  "./src/css/components/theme-toggle.css",
  "./src/css/components/pwa-install.css",
  "./src/js/main.js",
  "./src/js/gameLoader.js",
  "./src/js/theme.js",
  "./src/js/pwa-install.js",
  "./src/components/theme-toggle.html",
  "./src/assets/images/snake.svg",
  "./src/assets/images/tetris.svg",
  "./src/assets/images/tictactoe.svg",
  "./src/assets/images/pacman.svg",
  "./src/assets/images/memory.svg",
  "./src/assets/images/spaceinvaders.svg",
  "./src/assets/images/placeholder.svg",
  "./src/games/snake/index.html",
  "./src/games/snake/snake.js",
  "./src/games/tetris/index.html",
  "./src/games/tetris/tetris.js",
  "./src/games/tictactoe/index.html",
  "./src/games/tictactoe/tictactoe.js",
  "./src/games/pac-man/index.html",
  "./src/games/pac-man/pac.js",
  "./src/games/memory match/index.html",
  "./src/games/memory match/memory.js",
  "./src/games/space invaders/index.html",
  "./src/games/space invaders/space.js",
  // Font Awesome (for icons)
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css",
  // Google Fonts
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
];

// Install event - cache core assets
self.addEventListener("install", (event) => {
  console.log(
    "[ServiceWorker] Install - Caching core assets for Game Room PWA"
  );

  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Pre-caching assets");
        return cache
          .addAll(preCacheAssets)
          .then(() =>
            console.log("[ServiceWorker] All assets successfully cached")
          )
          .catch((err) =>
            console.error("[ServiceWorker] Error pre-caching assets:", err)
          );
      })
      .catch((err) =>
        console.error("[ServiceWorker] Error opening cache:", err)
      )
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate - Removing old caches");

  // Claim clients to ensure updates are applied to all clients
  event.waitUntil(self.clients.claim());

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[ServiceWorker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[ServiceWorker] Claiming clients");
        return self.clients.claim();
      })
      .catch((err) =>
        console.error("[ServiceWorker] Error cleaning old caches:", err)
      )
  );
});

// Fetch event - serve from cache, fallback to network, then offline page
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip chrome-extension requests
  if (event.request.url.startsWith("chrome-extension:")) {
    return;
  }

  // Skip URLs that we definitely don't want to cache
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("/analytics/") ||
    event.request.url.includes("sockjs-node")
  ) {
    return fetch(event.request);
  }

  // Handle the fetch event with a network-first strategy for API requests
  // and a cache-first strategy for static assets
  if (event.request.url.includes("/api/")) {
    // Network-first strategy for API requests
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response to store in cache
          const clonedResponse = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });

          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response right away
          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the fetched response
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch((error) => {
            console.error("Network fetch failed:", error);

            // If network fetch fails, return offline fallback for HTML requests
            if (
              event.request.headers.get("Accept") &&
              event.request.headers.get("Accept").includes("text/html")
            ) {
              return caches.match("./offline.html");
            }

            // For images, try to return a placeholder image
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return caches.match("./src/assets/images/placeholder.svg");
            }

            // For other resources, return a default error response
            return new Response("Network error happened", {
              status: 408,
              headers: { "Content-Type": "text/plain" },
            });
          });
      })
    );
  }
});

// Handle messages from clients
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("Service Worker skipping waiting");
    self.skipWaiting();
  } else if (event.data && event.data.type === "CHECK_VERSION") {
    // Respond with the current cache version
    console.log("Service Worker checking version");
    event.ports[0].postMessage({
      type: "VERSION",
      version: CACHE_NAME,
    });
  }
});

// Log any errors that might occur in the service worker
self.addEventListener("error", function (event) {
  console.error(
    "Service Worker error:",
    event.message,
    event.filename,
    event.lineno
  );
});

console.log("Service Worker loaded");
