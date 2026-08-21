import { detectarUsuarioActivo } from "./auth.js";
import { supabase } from "./supabase.js";
import { mostrarToast } from "./site.js";

const VAPID_PUBLIC_KEY = "BIqd8TfpSCV6DdSsf6cNFAhZGX0lJAP8u7b-bvqTCOLUhrWbDb735ZrmedJQCcrQVN9_oebOBOssgfkIMyxtWW8";
const CATEGORIAS = ["evaluaciones", "cuatrimestres", "inscripciones", "vacaciones", "suspensiones", "becas", "servicioSocial", "estadias"];

const panel = document.querySelector("[data-notification-settings]");
const invitado = panel?.querySelector("[data-notification-guest]");
const formulario = panel?.querySelector("[data-notification-form]");
const estado = panel?.querySelector("[data-notification-status]");
const distintivo = panel?.querySelector("[data-notification-badge]");
const botonActivar = panel?.querySelector("[data-notification-enable]");
const botonDesactivar = panel?.querySelector("[data-notification-disable]");

let usuarioActual = null;

function cambiarEstado(mensaje, tipo = "info") {
  if (!estado) return;
  estado.textContent = mensaje;
  estado.dataset.type = tipo;
}

function cambiarDistintivo(texto, tipo = "") {
  if (!distintivo) return;
  distintivo.textContent = texto;
  distintivo.className = `notification-badge${tipo ? ` is-${tipo}` : ""}`;
}

function bloquearFormulario(bloqueado) {
  formulario?.querySelectorAll("button, input").forEach((control) => {
    control.disabled = bloqueado;
  });
}

function preferenciasSeleccionadas(active = false) {
  const categories = CATEGORIAS.filter((categoria) => (
    formulario?.querySelector(`input[name="categoria"][value="${categoria}"]`)?.checked
  ));
  const lead_days = [...(formulario?.querySelectorAll('input[name="anticipacion"]:checked') ?? [])]
    .map((control) => Number(control.value))
    .sort((a, b) => b - a);
  return { active, categories, lead_days };
}

function aplicarPreferencias(preferencias) {
  if (!formulario || !preferencias) return;
  CATEGORIAS.forEach((categoria) => {
    const control = formulario.querySelector(`input[name="categoria"][value="${categoria}"]`);
    if (control) control.checked = preferencias.categories?.includes(categoria) ?? false;
  });
  formulario.querySelectorAll('input[name="anticipacion"]').forEach((control) => {
    control.checked = preferencias.lead_days?.includes(Number(control.value)) ?? false;
  });
}

function validarPreferencias(preferencias) {
  if (!preferencias.categories.length) throw new Error("Selecciona al menos un tipo de fecha.");
  if (!preferencias.lead_days.length) throw new Error("Selecciona al menos una anticipación.");
}

async function guardarPreferencias(active) {
  if (!usuarioActual) throw new Error("Inicia sesión para guardar tus preferencias.");
  const preferencias = preferenciasSeleccionadas(active);
  validarPreferencias(preferencias);
  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: usuarioActual.id,
    ...preferencias
  }, { onConflict: "user_id" });
  if (error) throw error;
  return preferencias;
}

function convertirClaveBase64(clave) {
  const relleno = "=".repeat((4 - (clave.length % 4)) % 4);
  const base64 = (clave + relleno).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (caracter) => caracter.charCodeAt(0));
}

async function obtenerRegistro() {
  const serviceWorkerUrl = new URL("../../push-sw.js", import.meta.url);
  const registro = await navigator.serviceWorker.register(serviceWorkerUrl, { scope: "./" });
  await navigator.serviceWorker.ready;
  return registro;
}

async function obtenerSuscripcion(crear = false) {
  const registro = await obtenerRegistro();
  let suscripcion = await registro.pushManager.getSubscription();
  if (!suscripcion && crear) {
    suscripcion = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertirClaveBase64(VAPID_PUBLIC_KEY)
    });
  }
  return suscripcion;
}

async function registrarDispositivo() {
  if (!usuarioActual) throw new Error("Inicia sesión para vincular este dispositivo.");
  const suscripcion = await obtenerSuscripcion(true);
  const datos = suscripcion.toJSON();
  if (!datos.endpoint || !datos.keys?.p256dh || !datos.keys?.auth) {
    throw new Error("El navegador no devolvió una suscripción válida.");
  }

  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: usuarioActual.id,
    endpoint: datos.endpoint,
    p256dh: datos.keys.p256dh,
    auth_key: datos.keys.auth,
    expiration_time: datos.expirationTime ?? null,
    plataforma: navigator.userAgentData?.platform || navigator.platform || "Navegador web",
    active: true
  }, { onConflict: "user_id,endpoint" });
  if (error) throw error;
  return suscripcion;
}

export async function desvincularDispositivoActual() {
  if (!usuarioActual || !window.isSecureContext || !("serviceWorker" in navigator)) return;
  const suscripcion = await obtenerSuscripcion(false);
  if (!suscripcion) return;

  const { error } = await supabase.from("push_subscriptions")
    .delete()
    .eq("user_id", usuarioActual.id)
    .eq("endpoint", suscripcion.endpoint);
  if (error) throw error;
  await suscripcion.unsubscribe();
}

async function activarNotificaciones() {
  if (!usuarioActual) throw new Error("Inicia sesión para activar los recordatorios.");
  if (!window.isSecureContext || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("Las notificaciones requieren HTTPS y un navegador compatible.");
  }

  const permiso = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permiso !== "granted") {
    cambiarDistintivo("Permiso bloqueado", "blocked");
    throw new Error(permiso === "denied"
      ? "El navegador bloqueó las notificaciones. Puedes habilitarlas desde los permisos del sitio."
      : "No se concedió permiso para mostrar notificaciones.");
  }

  await registrarDispositivo();
  await guardarPreferencias(true);
  botonActivar.textContent = "Recordatorios activos";
  botonDesactivar.hidden = false;
  cambiarDistintivo("Activos", "active");
  cambiarEstado("Este dispositivo recibirá avisos según las preferencias seleccionadas.", "success");
}

async function desactivarNotificaciones() {
  if (!usuarioActual) return;
  await desvincularDispositivoActual();
  await guardarPreferencias(false);
  botonActivar.textContent = "Activar recordatorios";
  botonDesactivar.hidden = true;
  cambiarDistintivo("Desactivados");
  cambiarEstado("Los recordatorios se desactivaron en este dispositivo.");
}

async function cargarEstadoUsuario(usuario) {
  usuarioActual = usuario;
  invitado.hidden = Boolean(usuario);
  formulario.hidden = !usuario;
  if (!usuario) {
    cambiarDistintivo("Requiere cuenta");
    return;
  }

  cambiarEstado("Cargando tus preferencias…");
  try {
    const { data: preferencias, error } = await supabase.from("notification_preferences")
      .select("active,categories,lead_days")
      .eq("user_id", usuario.id)
      .maybeSingle();
    if (error) throw error;
    aplicarPreferencias(preferencias);

    if (!window.isSecureContext || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      cambiarDistintivo("No compatible", "blocked");
      cambiarEstado("Este navegador no admite notificaciones web o la página no usa HTTPS.", "error");
      botonActivar.disabled = true;
      return;
    }

    if (Notification.permission === "denied") {
      botonDesactivar.hidden = !preferencias?.active;
      cambiarDistintivo("Permiso bloqueado", "blocked");
      cambiarEstado("Las notificaciones están bloqueadas en este navegador. Revisa los permisos del sitio.", "error");
      return;
    }

    if (preferencias?.active && Notification.permission === "granted") {
      await registrarDispositivo();
      botonActivar.textContent = "Recordatorios activos";
      botonDesactivar.hidden = false;
      cambiarDistintivo("Activos", "active");
      cambiarEstado("Este dispositivo está listo para recibir recordatorios.", "success");
    } else {
      botonDesactivar.hidden = true;
      cambiarDistintivo(preferencias ? "Preferencias guardadas" : "Sin configurar");
      cambiarEstado(preferencias
        ? "Tus preferencias están guardadas. Activa los recordatorios para vincular este dispositivo."
        : "Activa los recordatorios cuando termines de elegir.");
    }
  } catch (error) {
    console.error("No fue posible cargar las preferencias de notificaciones.", error);
    cambiarEstado("No fue posible cargar las preferencias. Inténtalo nuevamente.", "error");
  }
}

botonActivar?.addEventListener("click", async () => {
  bloquearFormulario(true);
  cambiarEstado("Preparando este dispositivo…");
  try {
    await activarNotificaciones();
  } catch (error) {
    console.error("No fue posible activar las notificaciones.", error);
    cambiarEstado(error.message || "No fue posible activar los recordatorios.", "error");
  } finally {
    bloquearFormulario(false);
  }
});

formulario?.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  bloquearFormulario(true);
  try {
    const active = "Notification" in window && Notification.permission === "granted" && !botonDesactivar.hidden;
    await guardarPreferencias(active);
    cambiarEstado("Tus preferencias se guardaron correctamente.", "success");
    mostrarToast("Preferencias de recordatorios guardadas.");
  } catch (error) {
    cambiarEstado(error.message || "No fue posible guardar las preferencias.", "error");
  } finally {
    bloquearFormulario(false);
  }
});

botonDesactivar?.addEventListener("click", async () => {
  bloquearFormulario(true);
  cambiarEstado("Desactivando este dispositivo…");
  try {
    await desactivarNotificaciones();
  } catch (error) {
    cambiarEstado(error.message || "No fue posible desactivar los recordatorios.", "error");
  } finally {
    bloquearFormulario(false);
  }
});

if (panel) detectarUsuarioActivo(cargarEstadoUsuario);
