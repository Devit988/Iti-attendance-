/* Offline shell + notification click handler */
const CACHE = "app-shell-v1";
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || r.mode !== "navigate") return;   // only the page itself; Firebase/videos untouched
  e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(ch => ch.put("./", c)); return res; })
    .catch(() => caches.match("./").then(m => m || Response.error())));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const tab = (e.notification.data && e.notification.data.tab) || "notice";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    if (cs.length) { cs[0].focus(); cs[0].postMessage({ type: "open", tab }); return; }
    return self.clients.openWindow("./");
  }));
});
