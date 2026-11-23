/* ITI CONNECT service worker v2
   - Offline app shell (index.html, og-image.png, Quiz Arena: quiz_arena.js + quiz_bank.json)
   - CDN files (Tailwind, Lucide, Firebase SDK, fonts) cached so the app renders offline
   - Update prompt: new versions wait until the user taps "Refresh"
   - Offline files: the page can ask this worker to save PDFs/notes for offline use
   Bump VERSION whenever you deploy a new index.html or sw.js. */
var VERSION = "v24";
var CACHE = "iti-connect-" + VERSION;      // app shell + same-origin files
var CDN_CACHE = "iti-connect-cdn-v1";      // third-party libraries and fonts
var FILES_CACHE = "iti-connect-files-v1";  // PDFs/notes saved for offline
var MAX_FILES = 40;

var SHELL = ["./", "./index.html", "./og-image.png", "./quiz_bank.json", "./quiz_arena.js"];

var CDN_PRECACHE = [
  "https://cdn.tailwindcss.com/3.4.17",
  "https://unpkg.com/lucide@0.468.0",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
];
/* Only these third-party hosts are cached. Firestore, YouTube etc. are never touched. */
var CDN_HOSTS = ["cdn.tailwindcss.com", "unpkg.com", "www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", function (e) {
  /* No skipWaiting here: the page shows a "Refresh" banner and sends SKIP_WAITING. */
  e.waitUntil(Promise.all([
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).catch(function () {}),
    caches.open(CDN_CACHE).then(function (c) {
      return Promise.all(CDN_PRECACHE.map(function (u) {
        return fetch(u, { mode: "cors" }).then(function (r) { if (r && r.ok) return c.put(u, r); }).catch(function () {});
      }));
    })
  ]));
});

self.addEventListener("activate", function (e) {
  var keep = [CACHE, CDN_CACHE, FILES_CACHE];
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return keep.indexOf(k) < 0; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function trimFiles() {
  return caches.open(FILES_CACHE).then(function (c) {
    return c.keys().then(function (keys) {
      var extra = keys.length - MAX_FILES;
      var jobs = [];
      for (var i = 0; i < extra; i++) jobs.push(c.delete(keys[i]));
      return Promise.all(jobs);
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  var url = new URL(req.url);

  /* Firestore / Firebase Auth live traffic (Quiz Arena rooms): never touched by this worker. */
  if (/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations)\.googleapis\.com$|(^|\.)firebaseio\.com$/.test(url.hostname)) return;

  /* Third-party libraries/fonts: serve from cache, refresh in background. */
  if (url.origin !== self.location.origin) {
    if (CDN_HOSTS.indexOf(url.hostname) < 0) return;
    e.respondWith(
      caches.open(CDN_CACHE).then(function (c) {
        return c.match(req).then(function (hit) {
          var net = fetch(req).then(function (res) {
            if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone());
            return res;
          }).catch(function () { return hit || Response.error(); });
          return hit || net;
        });
      })
    );
    return;
  }

  /* Same-origin: network first, cache when offline (also finds saved offline files). */
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

/* Messages from the page:
   {type:"SKIP_WAITING"}              activate the waiting update
   {type:"CACHE_URLS", urls:[...]}    save files for offline use
   {type:"REMOVE_URLS", urls:[...]}   delete saved files
   {type:"LIST_FILES"}                list saved file URLs
   Replies go back as {type:"cache-result"|"files-list", ...}. */
self.addEventListener("message", function (e) {
  var d = e.data || {};
  var src = e.source;
  function reply(m) { if (src && src.postMessage) src.postMessage(m); }

  if (d.type === "SKIP_WAITING") { self.skipWaiting(); return; }

  if (d.type === "CACHE_URLS" && d.urls && d.urls.length) {
    e.waitUntil(caches.open(FILES_CACHE).then(function (c) {
      return Promise.all(d.urls.map(function (u) {
        return fetch(u, { mode: "cors" }).then(function (res) {
          if (!res || !res.ok) throw new Error("bad response");
          return c.put(u, res).then(function () { reply({ type: "cache-result", url: u, ok: true }); });
        }).catch(function () {
          /* Hosts without CORS (e.g. some Drive links) cannot be saved. */
          reply({ type: "cache-result", url: u, ok: false });
        });
      })).then(trimFiles);
    }));
    return;
  }

  if (d.type === "REMOVE_URLS" && d.urls) {
    e.waitUntil(caches.open(FILES_CACHE).then(function (c) {
      return Promise.all(d.urls.map(function (u) { return c.delete(u); }));
    }));
    return;
  }

  if (d.type === "LIST_FILES") {
    e.waitUntil(caches.open(FILES_CACHE).then(function (c) {
      return c.keys().then(function (keys) { reply({ type: "files-list", urls: keys.map(function (k) { return k.url; }) }); });
    }));
  }
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
