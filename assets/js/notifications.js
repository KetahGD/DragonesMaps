import {
  CATEGORIAS_RECORDATORIO,
  cargarPreferenciasRecordatorios,
  guardarPreferenciasRecordatorios
} from "./reminder-preferences.js";
import { comprobarNotificacionesSistema } from "./local-notifications.js";
import { mostrarToast } from "./toast.js";

const panel = document.querySelector("[data-notification-settings]");
const formulario = panel?.querySelector("[data-notification-form]");
const estado = panel?.querySelector("[data-notification-status]");
const distintivo = panel?.querySelector("[data-notification-badge]");
const botonActivar = panel?.querySelector("[data-notification-enable]");
const botonDesactivar = panel?.querySelector("[data-notification-disable]");
let preferenciasActuales = cargarPreferenciasRecordatorios();

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
  formulario?.querySelectorAll("button, input").forEach((control) => { control.disabled = bloqueado; });
}

function leerFormulario() {
  const categories = CATEGORIAS_RECORDATORIO.filter((categoria) => (
    formulario?.querySelector(`input[name="categoria"][value="${categoria}"]`)?.checked
  ));
  const lead_days = [...(formulario?.querySelectorAll('input[name="anticipacion"]:checked') ?? [])]
    .map((control) => Number(control.value))
    .sort((a, b) => b - a);
  if (!categories.length) throw new Error("Selecciona al menos un tipo de fecha.");
  if (!lead_days.length) throw new Error("Selecciona al menos una anticipación.");
  return { categories, lead_days };
}

function aplicarPreferencias(preferencias) {
  if (!formulario) return;
  CATEGORIAS_RECORDATORIO.forEach((categoria) => {
    const control = formulario.querySelector(`input[name="categoria"][value="${categoria}"]`);
    if (control) control.checked = preferencias.categories.includes(categoria);
  });
  formulario.querySelectorAll('input[name="anticipacion"]').forEach((control) => {
    control.checked = preferencias.lead_days.includes(Number(control.value));
  });
}

function renderizarEstado() {
  if (!preferenciasActuales.active) {
    botonActivar.textContent = "Activar recordatorios";
    botonDesactivar.hidden = true;
    cambiarDistintivo("Listos sin cuenta");
    cambiarEstado("Las fechas se mostrarán en la campana. Activa los avisos para recibirlos al abrir la aplicación.");
    return;
  }

  botonActivar.textContent = "Recordatorios activos";
  botonDesactivar.hidden = false;
  cambiarDistintivo(preferenciasActuales.system ? "Avisos activos" : "Avisos en la app", "active");
  cambiarEstado(preferenciasActuales.system
    ? "El navegador mostrará avisos al abrir la aplicación o mientras permanezca activa."
    : "Los recordatorios están activos dentro de Dragones Maps; el navegador no permite avisos del sistema.", "success");
}

function guardar({ active = preferenciasActuales.active, system = preferenciasActuales.system } = {}) {
  preferenciasActuales = guardarPreferenciasRecordatorios({ ...leerFormulario(), active, system });
  renderizarEstado();
  return preferenciasActuales;
}

async function activar() {
  let system = false;
  if (window.isSecureContext && "Notification" in window && "serviceWorker" in navigator) {
    const permiso = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    system = permiso === "granted";
  }
  guardar({ active: true, system });
  await comprobarNotificacionesSistema();
}

botonActivar?.addEventListener("click", async () => {
  bloquearFormulario(true);
  cambiarEstado("Preparando los recordatorios de este dispositivo…");
  try {
    await activar();
    mostrarToast("Recordatorios activados en este dispositivo.");
  } catch (error) {
    cambiarEstado(error.message || "No fue posible activar los recordatorios.", "error");
  } finally {
    bloquearFormulario(false);
  }
});

formulario?.addEventListener("submit", (evento) => {
  evento.preventDefault();
  try {
    guardar();
    mostrarToast("Preferencias guardadas en este dispositivo.");
  } catch (error) {
    cambiarEstado(error.message, "error");
  }
});

botonDesactivar?.addEventListener("click", () => {
  try {
    guardar({ active: false, system: false });
    mostrarToast("Recordatorios automáticos desactivados.");
  } catch (error) {
    cambiarEstado(error.message, "error");
  }
});

if (panel) {
  formulario.hidden = false;
  aplicarPreferencias(preferenciasActuales);
  renderizarEstado();
}
