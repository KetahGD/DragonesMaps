const CACHE_VERSION = "dragones-maps-v11";
const APP_CACHE = `${CACHE_VERSION}-app`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const TILE_CACHE = `${CACHE_VERSION}-tiles`;
const APP_SHELL = [
  "./Inicio.html",
  "./index.html",
  "./calendario.html",
  "./directorio.html",
  "./directorio-academico.html",
  "./organizador.html",
  "./perfil.html",
  "./InicioIniciarSesion.html",
  "./InicioCrearCuenta.html",
  "./RestablecerPassword.html",
  "./sin-conexion.html",
  "./manifest.webmanifest",
  "./assets/css/app.css",
  "./assets/css/home.css",
  "./assets/css/auth.css",
  "./assets/css/calendar.css",
  "./assets/css/directory.css",
  "./assets/css/academic-directory.css",
  "./assets/css/organizer.css",
  "./assets/css/profile.css",
  "./assets/js/site.js",
  "./assets/js/toast.js",
  "./assets/js/theme-init.js",
  "./assets/js/theme.js",
  "./assets/js/session-ui.js",
  "./assets/js/offline.js",
  "./assets/js/local-notifications.js",
  "./assets/js/search.js",
  "./assets/js/auth.js",
  "./assets/js/supabase.js",
  "./assets/js/map.js",
  "./assets/js/bottom-sheets.js",
  "./assets/js/routing.js",
  "./assets/js/panorama.js",
  "./assets/js/calendar.js",
  "./assets/js/directory.js",
  "./assets/js/academic-directory.js",
  "./assets/js/organizer.js",
  "./assets/js/profile.js",
  "./assets/js/notifications.js",
  "./assets/data/places.js",
  "./assets/data/careers.js",
  "./assets/data/academic-reminders.js",
  "./assets/data/administrative-directory.js",
  "./assets/images/branding/dragon-logo-transparent.png",
  "./assets/images/branding/dragones-maps-transparent.png",
  "./assets/images/branding/favicon.ico",
  "./vendor/leaflet/leaflet.css",
  "./vendor/leaflet/leaflet.js",
  "./vendor/pannellum/pannellum.css",
  "./vendor/pannellum/pannellum.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await Promise.allSettled(APP_SHELL.map((path) => cache.add(new Request(path, { cache: "reload" }))));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("dragones-maps-") && ![APP_CACHE, RUNTIME_CACHE, TILE_CACHE].includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function cacheFirst(request, cacheName, { ignoreSearch = false, limit = 0 } = {}) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    await cache.put(request, response.clone());
    if (limit) {
      const keys = await cache.keys();
      await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map((key) => cache.delete(key)));
    }
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true }))
      || (await caches.match(request, { ignoreSearch: true }))
      || (await caches.match("./sin-conexion.html"));
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (/^[abc]\.tile\.openstreetmap\.org$/.test(url.hostname)) {
    event.respondWith(cacheFirst(request, TILE_CACHE, { limit: 180 }));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE, { ignoreSearch: true }));
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }

  const title = data.title || "Recordatorio académico";
  const options = {
    body: data.body || "Hay una fecha importante próxima en el calendario.",
    icon: new URL("assets/images/branding/dragon-logo-transparent.png", self.registration.scope).href,
    badge: new URL("assets/images/branding/favicon.ico", self.registration.scope).href,
    tag: data.eventId || "recordatorio-academico",
    renotify: false,
    data: {
      url: data.url || "calendario.html",
      eventId: data.eventId || ""
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(
    String(event.notification.data?.url || "calendario.html").replace(/^\//, ""),
    self.registration.scope
  ).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const current = windows.find((client) => client.url.startsWith(self.registration.scope));
    if (current) {
      await current.focus();
      if ("navigate" in current) await current.navigate(destination);
      return;
    }
    await self.clients.openWindow(destination);
  })());
});
