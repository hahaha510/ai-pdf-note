/**
 * Service Worker - 离线缓存策略
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

const STATIC_ASSETS = ["/", "/notes", "/offline"];
const EXCLUDED_PATHS = ["/api/", "/_next/webpack-hmr", "/convex/"];

// 安装事件
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => Promise.resolve()))
  );
  self.skipWaiting();
});

// 激活事件
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== STATIC_CACHE && name !== DYNAMIC_CACHE) {
            return caches.delete(name);
          }
        })
      )
    )
  );
  return self.clients.claim();
});

// 拦截请求
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (EXCLUDED_PATHS.some((path) => url.pathname.startsWith(path))) return;
  if (request.method !== "GET") return;

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.destination === "document") {
      return caches.match("/offline") || new Response("Offline");
    }
    throw error;
  }
}
