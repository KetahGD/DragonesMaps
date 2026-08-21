import { configurarBusqueda } from "./search.js";
import { configurarNotificacionesLocales } from "./local-notifications.js";

function configurarMenu() {
  const boton = document.querySelector("[data-menu-button]");
  const panel = document.querySelector("[data-menu-panel]");
  const overlay = document.querySelector("[data-menu-overlay]");
  if (!boton || !panel || !overlay) return;

  const cambiarEstado = (abierto) => {
    const estabaAbierto = panel.classList.contains("is-open");
    panel.classList.toggle("is-open", abierto);
    overlay.hidden = !abierto;
    document.body.classList.toggle("menu-open", abierto);
    boton.setAttribute("aria-expanded", String(abierto));
    panel.setAttribute("aria-hidden", String(!abierto));
    if (abierto) {
      window.requestAnimationFrame(() => panel.querySelector("a")?.focus());
    } else if (estabaAbierto && (panel.contains(document.activeElement) || document.activeElement === overlay)) {
      boton.focus();
    }
  };

  boton.addEventListener("click", () => cambiarEstado(!panel.classList.contains("is-open")));
  overlay.addEventListener("click", () => cambiarEstado(false));
  panel.querySelectorAll("a").forEach((enlace) => enlace.addEventListener("click", () => cambiarEstado(false)));
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") cambiarEstado(false);
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

export function mostrarToast(mensaje, tipo = "info") {
  let contenedor = document.querySelector("[data-toast-container]");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.className = "toast-container";
    contenedor.dataset.toastContainer = "";
    contenedor.setAttribute("aria-live", "polite");
    document.body.append(contenedor);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${tipo}`;
  toast.textContent = mensaje;
  contenedor.append(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 220);
  }, 4200);
}

configurarMenu();
configurarBuscadores();
configurarNotificacionesLocales(mostrarToast);
