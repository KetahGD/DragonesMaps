import { lugares, categorias, obtenerLugarPorId } from "../data/places.js";
import { configurarBusqueda } from "./search.js";
import { configurarVisorPanoramico } from "./panorama.js";
import { configurarRutas } from "./routing.js";
import { configureBottomSheets } from "./bottom-sheets.js";
import { mostrarToast } from "./site.js?v=20260820-3";

const CENTRO_CAMPUS = [19.61275, -99.34035];
const ZOOM_INICIAL = 17;

const map = L.map("map", {
  zoomControl: false,
  minZoom: 15,
  maxZoom: 20
}).setView(CENTRO_CAMPUS, ZOOM_INICIAL);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 20,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const marcadores = new Map();
const gruposCategoria = new Map();
const visorPanoramico = configurarVisorPanoramico();
let lugarActivo = null;
let observadorUbicacion = null;
let marcadorUsuario = null;
let circuloPrecision = null;

function iconoCategoria(categoria) {
  const iconos = {
    edificio: '<path d="M7 20V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M4 20h16M9 8h2m2 0h2m-6 4h2m2 0h2m-6 4h2m2 0h2"/>',
    laboratorio: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 14h8"/>',
    servicio: '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4m0 4h.01"/>',
    acceso: '<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M9 21V7h6v14m-4-7h.01"/>',
    deporte: '<circle cx="12" cy="12" r="9"/><path d="M5.6 6.4c4.2 1.8 7.8 5.4 12 12M18.4 5.6c-1.8 4.2-5.4 7.8-12 12M3 12h18"/>',
    patrimonio: '<path d="M3 9h18M5 9V7l7-4 7 4v2M6 20h12M7 9v8m4-8v8m4-8v8m4 0v3H5v-3"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${iconos[categoria]}</svg>`;
}

function crearIconoMarcador(categoria) {
  const datos = categorias[categoria];
  return L.divIcon({
    className: "map-marker-shell",
    html: `<span class="map-marker" style="--marker-color:${datos.color}">${iconoCategoria(categoria)}</span>`,
    iconSize: [38, 46],
    iconAnchor: [19, 44],
    popupAnchor: [0, -42]
  });
}

function cargarImagenConFallback(imagen, principal, respaldo) {
  if (!principal && !respaldo) {
    imagen.removeAttribute("src");
    imagen.hidden = true;
    return;
  }
  imagen.hidden = false;
  imagen.onerror = () => {
    imagen.onerror = null;
    if (respaldo) imagen.src = respaldo;
    else imagen.hidden = true;
  };
  imagen.src = principal || respaldo;
}

function renderizarFicha(lugar) {
  const panel = document.querySelector("[data-place-panel]");
  const imagen = panel.querySelector("[data-place-image]");
  const titulo = panel.querySelector("[data-place-title]");
  const nombreOficial = panel.querySelector("[data-place-official]");
  const categoria = panel.querySelector("[data-place-category]");
  const resumen = panel.querySelector("[data-place-summary]");
  const secciones = panel.querySelector("[data-place-sections]");
  const panoramasContenedor = panel.querySelector("[data-place-panoramas]");
  const handle = panel.querySelector("[data-place-swipe-handle]");

  panel.classList.remove("is-expanded");
  panel.style.removeProperty("--sheet-drag-y");
  panel.scrollTop = 0;
  handle?.setAttribute("aria-expanded", "false");
  handle?.setAttribute("aria-label", "Expandir información del lugar");

  cargarImagenConFallback(imagen, lugar.imagenMiniatura || lugar.imagen, lugar.imagenOriginal);
  imagen.alt = `Vista de ${lugar.nombre}`;
  panel.classList.toggle("place-panel--no-image", !lugar.imagenMiniatura && !lugar.imagen && !lugar.imagenOriginal);
  titulo.textContent = lugar.nombre;
  nombreOficial.textContent = lugar.nombreOficial || "";
  nombreOficial.hidden = !lugar.nombreOficial;
  categoria.textContent = categorias[lugar.categoria].etiqueta;
  categoria.style.setProperty("--category-color", categorias[lugar.categoria].color);
  resumen.textContent = lugar.resumen || "Información en actualización.";
  panel.querySelector("[data-route-to]").dataset.routeTo = lugar.id;
  secciones.replaceChildren();

  (lugar.secciones ?? []).forEach((seccion) => {
    const bloque = document.createElement("section");
    bloque.className = "place-section";
    const encabezado = document.createElement("h3");
    encabezado.textContent = seccion.titulo;
    const lista = document.createElement("ul");
    seccion.items.forEach((item) => {
      const elemento = document.createElement("li");
      elemento.textContent = item;
      lista.append(elemento);
    });
    bloque.append(encabezado, lista);
    secciones.append(bloque);
  });

  panoramasContenedor.replaceChildren();
  panoramasContenedor.hidden = !lugar.panoramas?.length;
  (lugar.panoramas ?? []).forEach((vista, indice) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = indice === 0 ? "primary-button" : "secondary-button";
    boton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12c2.5-4 5.5-6 9-6s6.5 2 9 6c-2.5 4-5.5 6-9 6s-6.5-2-9-6Z"/><circle cx="12" cy="12" r="2.5"/></svg><span></span>';
    boton.querySelector("span").textContent = lugar.panoramas.length > 1 ? vista.titulo : "Ver panorama";
    boton.addEventListener("click", () => visorPanoramico.abrir(vista));
    panoramasContenedor.append(boton);
  });

  panel.hidden = false;
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  document.body.classList.add("place-open");
  if (window.matchMedia("(min-width: 901px)").matches) {
    window.setTimeout(() => panel.querySelector("[data-place-close]")?.focus({ preventScroll: true }), 220);
  }
}

function abrirLugar(lugar, { actualizarUrl = true } = {}) {
  document.body.classList.remove("topbar-search-open");
  document.querySelector("[data-topbar-search-toggle]")?.setAttribute("aria-expanded", "false");
  lugarActivo = lugar;
  map.flyTo(lugar.coordenadas, 18, { duration: 0.65 });
  marcadores.get(lugar.id)?.openPopup();
  renderizarFicha(lugar);
  if (actualizarUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("edificio", lugar.id);
    history.replaceState({}, "", url);
  }
}

function cerrarFicha({ actualizarUrl = true } = {}) {
  const panel = document.querySelector("[data-place-panel]");
  panel.classList.remove("is-open", "is-expanded");
  panel.style.removeProperty("--sheet-drag-y");
  panel.querySelector("[data-place-swipe-handle]")?.setAttribute("aria-expanded", "false");
  panel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("place-open");
  map.closePopup();
  lugarActivo = null;
  if (actualizarUrl) {
    const url = new URL(window.location.href);
    url.searchParams.delete("edificio");
    history.replaceState({}, "", url);
  }
  window.setTimeout(() => {
    if (!panel.classList.contains("is-open")) panel.hidden = true;
  }, 250);
}

lugares.forEach((lugar) => {
  if (!gruposCategoria.has(lugar.categoria)) gruposCategoria.set(lugar.categoria, L.layerGroup().addTo(map));
  const marcador = L.marker(lugar.coordenadas, {
    icon: crearIconoMarcador(lugar.categoria),
    title: lugar.nombre,
    alt: lugar.nombre,
    riseOnHover: true
  });
  marcador.bindPopup(`<strong>${lugar.nombre}</strong><br><span>${categorias[lugar.categoria].etiqueta}</span>`);
  marcador.on("click", () => abrirLugar(lugar));
  marcador.addTo(gruposCategoria.get(lugar.categoria));
  marcadores.set(lugar.id, marcador);
});

function configurarFiltros() {
  const contenedor = document.querySelector("[data-category-filters]");
  Object.entries(categorias).forEach(([id, datos]) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "filter-chip is-active";
    boton.dataset.category = id;
    boton.setAttribute("aria-pressed", "true");
    const color = document.createElement("span");
    color.style.setProperty("--marker-color", datos.color);
    color.setAttribute("aria-hidden", "true");
    boton.append(color, document.createTextNode(datos.etiqueta));
    boton.addEventListener("click", () => {
      const activo = boton.getAttribute("aria-pressed") === "true";
      boton.setAttribute("aria-pressed", String(!activo));
      boton.classList.toggle("is-active", !activo);
      const grupo = gruposCategoria.get(id);
      if (activo) map.removeLayer(grupo);
      else grupo.addTo(map);
      if (lugarActivo?.categoria === id && activo) cerrarFicha();
    });
    contenedor.append(boton);
  });
}

function distanciaMetros([lat1, lon1], [lat2, lon2]) {
  const radio = 6371000;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return radio * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function actualizarEstadoUbicacion(mensaje, estado = "neutral") {
  const elemento = document.querySelector("[data-location-status]");
  elemento.textContent = mensaje;
  elemento.dataset.state = estado;
  elemento.hidden = false;
}

function iniciarUbicacion() {
  if (!navigator.geolocation) {
    actualizarEstadoUbicacion("Este navegador no permite usar la ubicación.", "error");
    return;
  }
  if (observadorUbicacion !== null) {
    if (marcadorUsuario) map.setView(marcadorUsuario.getLatLng(), 18);
    return;
  }

  actualizarEstadoUbicacion("Solicitando permiso de ubicación…", "loading");
  observadorUbicacion = navigator.geolocation.watchPosition((posicion) => {
    const coordenadas = [posicion.coords.latitude, posicion.coords.longitude];
    if (!marcadorUsuario) {
      marcadorUsuario = L.marker(coordenadas, {
        icon: L.divIcon({ className: "user-marker-shell", html: '<span class="user-marker"><span></span></span>', iconSize: [26, 26], iconAnchor: [13, 13] }),
        title: "Tu ubicación"
      }).addTo(map);
      circuloPrecision = L.circle(coordenadas, { radius: posicion.coords.accuracy, color: "#0b6b3a", weight: 1, fillColor: "#0b6b3a", fillOpacity: 0.12 }).addTo(map);
      map.setView(coordenadas, 18);
    } else {
      marcadorUsuario.setLatLng(coordenadas);
      circuloPrecision.setLatLng(coordenadas).setRadius(posicion.coords.accuracy);
    }

    const cercanos = lugares
      .map((lugar) => ({ lugar, distancia: distanciaMetros(coordenadas, lugar.coordenadas) }))
      .sort((a, b) => a.distancia - b.distancia);
    const cercano = cercanos[0];
    if (cercano.distancia > 650) actualizarEstadoUbicacion("Tu ubicación parece estar fuera del campus.", "warning");
    else actualizarEstadoUbicacion(`A ${Math.round(cercano.distancia)} m de ${cercano.lugar.nombre}`, "success");
  }, (error) => {
    observadorUbicacion = null;
    const mensajes = {
      1: "No se concedió permiso para usar la ubicación.",
      2: "No fue posible determinar tu ubicación.",
      3: "La solicitud de ubicación tardó demasiado."
    };
    actualizarEstadoUbicacion(mensajes[error.code] ?? "No fue posible usar tu ubicación.", "error");
  }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 12000 });
}

let rutas;

function restablecerMapa() {
  map.setView(CENTRO_CAMPUS, ZOOM_INICIAL);
  cerrarFicha();
  rutas?.limpiar();
}

configurarBusqueda({
  input: document.querySelector("[data-map-search-input]"),
  contenedor: document.querySelector("[data-map-search-results]"),
  alSeleccionar: (lugar) => abrirLugar(lugar)
});
configurarFiltros();
rutas = configurarRutas({ map, lugares, cerrarFicha, mostrarToast });
configureBottomSheets();

document.querySelector("[data-place-close]").addEventListener("click", cerrarFicha);
document.querySelector("[data-zoom-in]").addEventListener("click", () => map.zoomIn());
document.querySelector("[data-zoom-out]").addEventListener("click", () => map.zoomOut());
document.querySelector("[data-map-reset]").addEventListener("click", restablecerMapa);
document.querySelector("[data-locate]").addEventListener("click", iniciarUbicacion);

window.addEventListener("pagehide", () => {
  if (observadorUbicacion !== null) navigator.geolocation.clearWatch(observadorUbicacion);
});

const idInicial = new URLSearchParams(window.location.search).get("edificio");
if (idInicial) {
  const lugar = obtenerLugarPorId(idInicial);
  if (lugar) window.setTimeout(() => abrirLugar(lugar, { actualizarUrl: false }), 350);
  else mostrarToast("El lugar solicitado no existe o está en actualización.", "warning");
}
