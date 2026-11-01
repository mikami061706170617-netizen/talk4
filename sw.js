// Talk4 offline safety net: always try the network first (so updates show at once);
// if the network fails, serve the last copy of the page from this phone.
const CACHE = "talk4-pages-v1";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE), key = url.origin + url.pathname;
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(key, res.clone());
      return res;
    } catch {
      const hit = await cache.match(key);
      if (hit) return hit;
      throw new Error("offline");
    }
  })());
});
