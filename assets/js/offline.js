const SERVICE_WORKER = new URL("../../push-sw.js", import.meta.url);

export async function configurarModoOffline(mostrarAviso) {
  document.querySelector("[data-offline-retry]")?.addEventListener("click", () => window.location.reload());
  if (!("serviceWorker" in navigator) || (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1")) return;
  try {
    const registro = await navigator.serviceWorker.register(SERVICE_WORKER, { scope: "./", updateViaCache: "none" });
    registro.update().catch(() => {});
  } catch (error) {
    console.warn("No fue posible preparar el modo sin conexión.", error);
  }

  const updateStatus = (online, announce = true) => {
    document.documentElement.classList.toggle("is-offline", !online);
    if (!announce) return;
    mostrarAviso?.(online
      ? "Conexión restablecida. La información volverá a sincronizarse."
      : "Estás sin conexión. Puedes seguir usando las secciones y mapas consultados anteriormente.", online ? "info" : "warning");
  };

  updateStatus(navigator.onLine, false);
  window.addEventListener("online", () => updateStatus(true));
  window.addEventListener("offline", () => updateStatus(false));
}
