import {
  avisoYaEntregado,
  cargarPreferenciasRecordatorios,
  claveFechaLocal,
  fechaRecordatorio,
  marcarAvisoEntregado,
  obtenerAvisosPendientes,
  obtenerEventosProximos
} from "./reminder-preferences.js";

const MAXIMO_VISIBLE = 6;
const CLAVE_ULTIMO_AVISO = "dragonesmaps.local-reminders.last-shown";
let centroActual = null;
let centroAbortController = null;

function etiquetaTiempo(evento) {
  if (evento.dias < 0) return "En curso";
  if (evento.dias === 0) return "Hoy";
  if (evento.dias === 1) return "Mañana";
  return `En ${evento.dias} días`;
}

function etiquetaFecha(evento) {
  const formato = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });
  const inicio = formato.format(fechaRecordatorio(evento.fechaInicio));
  if (evento.fechaInicio === evento.fechaFin) return inicio;
  return `${inicio}–${formato.format(fechaRecordatorio(evento.fechaFin))}`;
}

function crearCentro(eventos) {
  const contenedor = document.createElement("div");
  contenedor.className = "local-notification-center";
  contenedor.innerHTML = `
    <button class="icon-button local-notification-trigger" type="button" aria-label="Fechas académicas próximas" aria-controls="local-notification-panel" aria-expanded="false">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></svg>
      <span class="local-notification-count" aria-hidden="true" ${eventos.length ? "" : "hidden"}>${Math.min(eventos.length, 99)}</span>
    </button>
    <section id="local-notification-panel" class="local-notification-panel" aria-label="Fechas próximas" hidden>
      <header>
        <div><span>Calendario escolar</span><h2>Fechas próximas</h2></div>
        <button class="local-notification-close" type="button" aria-label="Cerrar avisos"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      </header>
      <div class="local-notification-list" role="list"></div>
      <footer><span>Sin cuenta · guardado en este dispositivo</span><a href="Inicio.html#notificaciones">Configurar</a></footer>
    </section>`;

  const lista = contenedor.querySelector(".local-notification-list");
  if (!eventos.length) {
    lista.innerHTML = '<p class="local-notification-empty">No hay fechas seleccionadas en los próximos 30 días.</p>';
  } else {
    eventos.slice(0, MAXIMO_VISIBLE).forEach((evento) => {
      const articulo = document.createElement("article");
      articulo.className = "local-notification-item";
      articulo.dataset.category = evento.categoria;
      articulo.setAttribute("role", "listitem");
      articulo.innerHTML = `
        <span class="local-notification-dot" aria-hidden="true"></span>
        <div><strong>${evento.titulo}</strong><span>${etiquetaFecha(evento)}</span></div>
        <b>${etiquetaTiempo(evento)}</b>`;
      lista.append(articulo);
    });
    if (eventos.length > MAXIMO_VISIBLE) {
      const restantes = eventos.length - MAXIMO_VISIBLE;
      lista.insertAdjacentHTML("beforeend", `<p class="local-notification-more">Y ${restantes} ${restantes === 1 ? "fecha" : "fechas"} más en el calendario.</p>`);
    }
  }
  return contenedor;
}

function debeMostrarAviso(hoy) {
  try {
    if (localStorage.getItem(CLAVE_ULTIMO_AVISO) === hoy) return false;
    localStorage.setItem(CLAVE_ULTIMO_AVISO, hoy);
    return true;
  } catch { return true; }
}

export async function comprobarNotificacionesSistema() {
  const preferencias = cargarPreferenciasRecordatorios();
  if (!preferencias.active || !preferencias.system || !("Notification" in window) || Notification.permission !== "granted" || !("serviceWorker" in navigator)) return;
  const registro = await navigator.serviceWorker.ready;
  for (const evento of obtenerAvisosPendientes(preferencias)) {
    if (avisoYaEntregado(evento)) continue;
    await registro.showNotification("Recordatorio académico", {
      body: `${etiquetaTiempo(evento)}: ${evento.titulo}.`,
      icon: "assets/images/branding/dragon-logo-transparent.png",
      badge: "assets/images/branding/favicon.ico",
      tag: `recordatorio-${evento.id}-${evento.dias}`,
      renotify: false,
      data: { url: "calendario.html", eventId: evento.id }
    });
    marcarAvisoEntregado(evento);
  }
}

function montarCentro(mostrarAviso) {
  const cabecera = document.querySelector(".top-bar__main, .organizer-topbar__main, .simple-header__actions");
  if (!cabecera) return;
  centroAbortController?.abort();
  centroAbortController = new AbortController();
  const { signal } = centroAbortController;
  centroActual?.remove();
  const eventos = obtenerEventosProximos();
  const centro = crearCentro(eventos);
  centroActual = centro;
  const siguienteControl = cabecera.querySelector("[data-topbar-search-toggle], [data-theme-toggle]");
  cabecera.insertBefore(centro, siguienteControl || null);

  const boton = centro.querySelector(".local-notification-trigger");
  const panel = centro.querySelector(".local-notification-panel");
  const cerrar = centro.querySelector(".local-notification-close");
  const cambiarEstado = (abierto, devolverFoco = false) => {
    panel.hidden = !abierto;
    boton.setAttribute("aria-expanded", String(abierto));
    centro.classList.toggle("is-open", abierto);
    if (abierto) cerrar.focus();
    else if (devolverFoco) boton.focus();
  };

  boton.addEventListener("click", () => cambiarEstado(panel.hidden), { signal });
  cerrar.addEventListener("click", () => cambiarEstado(false, true), { signal });
  document.addEventListener("pointerdown", (evento) => {
    if (!panel.hidden && !centro.contains(evento.target)) cambiarEstado(false);
  }, { signal });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !panel.hidden) cambiarEstado(false, true);
  }, { signal });

  if (eventos.length && debeMostrarAviso(claveFechaLocal())) {
    const primero = eventos[0];
    window.setTimeout(() => mostrarAviso?.(`${etiquetaTiempo(primero)}: ${primero.titulo}. Consulta la campana para ver más fechas.`), 700);
  }
}

export function configurarNotificacionesLocales(mostrarAviso) {
  montarCentro(mostrarAviso);
  comprobarNotificacionesSistema().catch(() => {});
  window.addEventListener("dragonesmaps:reminders-updated", () => {
    montarCentro(mostrarAviso);
    comprobarNotificacionesSistema().catch(() => {});
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") comprobarNotificacionesSistema().catch(() => {});
  });
  window.setInterval(() => comprobarNotificacionesSistema().catch(() => {}), 60 * 60 * 1000);
}
