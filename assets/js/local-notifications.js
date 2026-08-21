import { recordatoriosAcademicos } from "../data/academic-reminders.js";

const DIAS_A_MOSTRAR = 30;
const MAXIMO_VISIBLE = 6;
const CLAVE_ULTIMO_AVISO = "dragonesmaps.local-reminders.last-shown";

function fechaLocal(clave) {
  return new Date(`${clave}T12:00:00`);
}

function claveHoy() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

function diferenciaDias(inicio, fin) {
  return Math.round((fechaLocal(fin) - fechaLocal(inicio)) / 86400000);
}

function obtenerProximos() {
  const hoy = claveHoy();
  return recordatoriosAcademicos
    .map((evento) => ({
      ...evento,
      dias: diferenciaDias(hoy, evento.fechaInicio),
      terminaEn: diferenciaDias(hoy, evento.fechaFin)
    }))
    .filter((evento) => evento.terminaEn >= 0 && evento.dias <= DIAS_A_MOSTRAR)
    .sort((a, b) => a.dias - b.dias || a.fechaInicio.localeCompare(b.fechaInicio));
}

function etiquetaTiempo(evento) {
  if (evento.dias < 0) return "En curso";
  if (evento.dias === 0) return "Hoy";
  if (evento.dias === 1) return "Mañana";
  return `En ${evento.dias} días`;
}

function etiquetaFecha(evento) {
  const formato = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });
  const inicio = formato.format(fechaLocal(evento.fechaInicio));
  if (evento.fechaInicio === evento.fechaFin) return inicio;
  return `${inicio}–${formato.format(fechaLocal(evento.fechaFin))}`;
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
      <footer><span>Disponible sin iniciar sesión</span><a href="calendario.html">Ver calendario completo</a></footer>
    </section>`;

  const lista = contenedor.querySelector(".local-notification-list");
  if (!eventos.length) {
    lista.innerHTML = '<p class="local-notification-empty">No hay fechas marcadas en los próximos 30 días.</p>';
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
  } catch {
    return true;
  }
}

export function configurarNotificacionesLocales(mostrarAviso) {
  const cabecera = document.querySelector(".top-bar__main");
  const perfil = cabecera?.querySelector(".profile-button");
  if (!cabecera || !perfil || cabecera.querySelector(".local-notification-center")) return;

  const eventos = obtenerProximos();
  const centro = crearCentro(eventos);
  cabecera.insertBefore(centro, perfil);
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

  boton.addEventListener("click", () => cambiarEstado(panel.hidden));
  cerrar.addEventListener("click", () => cambiarEstado(false, true));
  document.addEventListener("pointerdown", (evento) => {
    if (!panel.hidden && !centro.contains(evento.target)) cambiarEstado(false);
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !panel.hidden) cambiarEstado(false, true);
  });

  if (eventos.length && debeMostrarAviso(claveHoy())) {
    const primero = eventos[0];
    window.setTimeout(() => {
      mostrarAviso?.(`${etiquetaTiempo(primero)}: ${primero.titulo}. Consulta la campana para ver más fechas.`);
    }, 700);
  }
}
