/* ITI CONNECT service worker: offline fallback + notification clicks.
   Bump CACHE when you deploy a new index.html. */
var CACHE = "iti-connect-v1";
var SHELL = ["./", "./index.html"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).catch(function () {}));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Network-first for same-origin GETs, cache fallback when offline.
   Firebase, YouTube and other cross-origin requests are never touched. */
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || (req.mode === "navigate" ? caches.match("./index.html") : Response.error());
      });
    })
  );
});

/* Tapping a notification focuses the app and tells it which tab to open
   (the page listens for {type:"open", tab}). */
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var tab = (e.notification.data && e.notification.data.tab) || "";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ("focus" in list[i]) { list[i].postMessage({ type: "open", tab: tab }); return list[i].focus(); }
      }
      return self.clients.openWindow("./");
    })
  );
});
