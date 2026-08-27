import { configurarBusqueda } from "./search.js";
import { configurarNotificacionesLocales } from "./local-notifications.js";
import { configurarTema } from "./theme.js?v=20260827-1";
import { configurarModoOffline } from "./offline.js";
import { mostrarToast } from "./toast.js";

export { mostrarToast } from "./toast.js";

function configurarMenu() {
  const botones = [...document.querySelectorAll("[data-menu-button]")];
  const panel = document.querySelector("[data-menu-panel]");
  const overlay = document.querySelector("[data-menu-overlay]");
  if (!botones.length || !panel || !overlay) return;

  const cambiarEstado = (abierto) => {
    const estabaAbierto = panel.classList.contains("is-open");
    panel.classList.toggle("is-open", abierto);
    overlay.hidden = !abierto;
    document.body.classList.toggle("menu-open", abierto);
    botones.forEach((boton) => boton.setAttribute("aria-expanded", String(abierto)));
    panel.setAttribute("aria-hidden", String(!abierto));
    if (abierto) {
      window.requestAnimationFrame(() => panel.querySelector("a")?.focus());
    } else if (estabaAbierto && (panel.contains(document.activeElement) || document.activeElement === overlay)) {
      botones[0].focus();
    }
  };

  botones.forEach((boton) => boton.addEventListener("click", () => cambiarEstado(!panel.classList.contains("is-open"))));
  overlay.addEventListener("click", () => cambiarEstado(false));
  panel.querySelectorAll("a").forEach((enlace) => enlace.addEventListener("click", () => cambiarEstado(false)));
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") cambiarEstado(false);
  });
  window.addEventListener("pageshow", () => cambiarEstado(false));
}

function configurarBusquedaCompacta() {
  const cabecera = document.querySelector(".top-bar");
  const principal = cabecera?.querySelector(".top-bar__main");
  const buscador = cabecera?.querySelector(".map-search");
  if (!cabecera || !principal || !buscador || principal.querySelector("[data-topbar-search-toggle]")) return;

  if (!buscador.id) buscador.id = "topbar-search-panel";
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "icon-button topbar-search-toggle";
  boton.dataset.topbarSearchToggle = "";
  boton.setAttribute("aria-controls", buscador.id);
  boton.setAttribute("aria-expanded", "false");
  boton.setAttribute("aria-label", document.body.classList.contains("map-page") ? "Buscar y filtrar lugares" : "Abrir búsqueda");
  boton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';
  principal.append(boton);

  const cambiarEstado = (abierto) => {
    document.body.classList.toggle("topbar-search-open", abierto);
    boton.setAttribute("aria-expanded", String(abierto));
    boton.setAttribute("aria-label", abierto ? "Cerrar búsqueda" : (document.body.classList.contains("map-page") ? "Buscar y filtrar lugares" : "Abrir búsqueda"));
    if (abierto) window.setTimeout(() => buscador.querySelector("input")?.focus(), 180);
  };

  boton.addEventListener("click", () => cambiarEstado(!document.body.classList.contains("topbar-search-open")));
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") cambiarEstado(false);
  });
  document.addEventListener("pointerdown", (evento) => {
    if (window.innerWidth <= 900 && document.body.classList.contains("topbar-search-open") && !buscador.contains(evento.target) && !boton.contains(evento.target) && !evento.target.closest("[data-category-filters]")) cambiarEstado(false);
  });
}

function configurarBuscadores() {
  document.querySelectorAll("[data-search-root]").forEach((raiz) => {
    const input = raiz.querySelector("[data-search-input]");
    const resultados = raiz.querySelector("[data-search-results]");
    configurarBusqueda({
      input,
      contenedor: resultados,
      alSeleccionar: (lugar) => {
        window.location.href = `index.html?edificio=${encodeURIComponent(lugar.id)}`;
      }
    });
  });
}

configurarMenu();
configurarBusquedaCompacta();
configurarBuscadores();
configurarTema();
configurarNotificacionesLocales(mostrarToast);
configurarModoOffline(mostrarToast);
