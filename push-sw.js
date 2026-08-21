self.addEventListener("push", (evento) => {
  let datos = {};
  try {
    datos = evento.data?.json() ?? {};
  } catch {
    datos = { body: evento.data?.text() };
  }

  const titulo = datos.title || "Recordatorio académico";
  const opciones = {
    body: datos.body || "Hay una fecha importante próxima en el calendario.",
    icon: new URL("assets/images/branding/dragon-logo-transparent.png", self.registration.scope).href,
    badge: new URL("assets/images/branding/dragon-logo-transparent.png", self.registration.scope).href,
    tag: datos.eventId || "recordatorio-academico",
    renotify: false,
    data: {
      url: datos.url || "calendario.html",
      eventId: datos.eventId || ""
    }
  };
  evento.waitUntil(self.registration.showNotification(titulo, opciones));
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = new URL(
    String(evento.notification.data?.url || "calendario.html").replace(/^\//, ""),
    self.registration.scope
  ).href;

  evento.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const ventana = ventanas.find((cliente) => cliente.url.startsWith(self.registration.scope));
    if (ventana) {
      await ventana.focus();
      if ("navigate" in ventana) await ventana.navigate(destino);
      return;
    }
    await self.clients.openWindow(destino);
  })());
});
