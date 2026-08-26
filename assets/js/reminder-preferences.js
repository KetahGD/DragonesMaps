import { recordatoriosAcademicos } from "../data/academic-reminders.js";

export const CATEGORIAS_RECORDATORIO = [
  "evaluaciones", "cuatrimestres", "inscripciones", "vacaciones",
  "suspensiones", "becas", "servicioSocial", "estadias"
];

const CLAVE_PREFERENCIAS = "dragonesmaps.reminders.preferences.v2";
const CLAVE_ENTREGADOS = "dragonesmaps.reminders.delivered.v2";
const PREDETERMINADAS = Object.freeze({
  active: false,
  system: false,
  categories: ["evaluaciones", "cuatrimestres", "inscripciones", "vacaciones", "suspensiones"],
  lead_days: [7, 3, 1]
});

function normalizarPreferencias(value = {}) {
  const categories = CATEGORIAS_RECORDATORIO.filter((categoria) => value.categories?.includes(categoria));
  const leadDays = [...new Set((value.lead_days ?? []).map(Number))]
    .filter((dias) => [7, 3, 1, 0].includes(dias))
    .sort((a, b) => b - a);
  return {
    active: Boolean(value.active),
    system: Boolean(value.system),
    categories: categories.length ? categories : [...PREDETERMINADAS.categories],
    lead_days: leadDays.length ? leadDays : [...PREDETERMINADAS.lead_days]
  };
}

export function cargarPreferenciasRecordatorios() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE_PREFERENCIAS) || "null");
    return normalizarPreferencias(guardadas || PREDETERMINADAS);
  } catch {
    return normalizarPreferencias(PREDETERMINADAS);
  }
}

export function guardarPreferenciasRecordatorios(preferencias) {
  const normalizadas = normalizarPreferencias(preferencias);
  localStorage.setItem(CLAVE_PREFERENCIAS, JSON.stringify(normalizadas));
  window.dispatchEvent(new CustomEvent("dragonesmaps:reminders-updated", { detail: normalizadas }));
  return normalizadas;
}

export function fechaRecordatorio(clave) {
  return new Date(`${clave}T12:00:00`);
}

export function claveFechaLocal(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

export function diferenciaDias(inicio, fin) {
  return Math.round((fechaRecordatorio(fin) - fechaRecordatorio(inicio)) / 86400000);
}

export function obtenerEventosProximos({ dias = 30, preferencias = cargarPreferenciasRecordatorios() } = {}) {
  const hoy = claveFechaLocal();
  return recordatoriosAcademicos
    .filter((evento) => preferencias.categories.includes(evento.categoria))
    .map((evento) => ({ ...evento, dias: diferenciaDias(hoy, evento.fechaInicio), terminaEn: diferenciaDias(hoy, evento.fechaFin) }))
    .filter((evento) => evento.terminaEn >= 0 && evento.dias <= dias)
    .sort((a, b) => a.dias - b.dias || a.fechaInicio.localeCompare(b.fechaInicio));
}

export function obtenerAvisosPendientes(preferencias = cargarPreferenciasRecordatorios()) {
  if (!preferencias.active) return [];
  const hoy = claveFechaLocal();
  return recordatoriosAcademicos
    .filter((evento) => preferencias.categories.includes(evento.categoria))
    .map((evento) => ({ ...evento, dias: diferenciaDias(hoy, evento.fechaInicio) }))
    .filter((evento) => preferencias.lead_days.includes(evento.dias));
}

function clavesEntregadas() {
  try { return new Set(JSON.parse(localStorage.getItem(CLAVE_ENTREGADOS) || "[]")); }
  catch { return new Set(); }
}

export function avisoYaEntregado(evento) {
  return clavesEntregadas().has(`${claveFechaLocal()}:${evento.id}:${evento.dias}`);
}

export function marcarAvisoEntregado(evento) {
  const hoy = claveFechaLocal();
  const claves = [...clavesEntregadas(), `${hoy}:${evento.id}:${evento.dias}`]
    .filter((clave) => clave >= `${hoy.slice(0, 7)}-01`)
    .slice(-160);
  try { localStorage.setItem(CLAVE_ENTREGADOS, JSON.stringify([...new Set(claves)])); }
  catch { /* El aviso puede repetirse si el navegador impide guardar datos locales. */ }
}
