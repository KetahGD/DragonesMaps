const ROUTING_ENDPOINT = "https://valhalla1.openstreetmap.de/route";
const CLIENT_ID = "ketangd.github.io/Dragones-Maps";
const LUGARES_SECTOR_RECTORIA = new Set(["rectoria", "edificio-d", "puerta-2"]);
const CONECTOR_RECTORIA = [19.6135547, -99.3390146];
const CONECTOR_CAMPUS = [19.6128306, -99.3385662];

function decodificarPolyline(cadena, precision = 6) {
  const coordenadas = [];
  const factor = 10 ** precision;
  let indice = 0;
  let latitud = 0;
  let longitud = 0;

  while (indice < cadena.length) {
    let resultado = 0;
    let desplazamiento = 0;
    let byte;
    do {
      byte = cadena.charCodeAt(indice++) - 63;
      resultado |= (byte & 0x1f) << desplazamiento;
      desplazamiento += 5;
    } while (byte >= 0x20);
    latitud += resultado & 1 ? ~(resultado >> 1) : resultado >> 1;

    resultado = 0;
    desplazamiento = 0;
    do {
      byte = cadena.charCodeAt(indice++) - 63;
      resultado |= (byte & 0x1f) << desplazamiento;
      desplazamiento += 5;
    } while (byte >= 0x20);
    longitud += resultado & 1 ? ~(resultado >> 1) : resultado >> 1;
    coordenadas.push([latitud / factor, longitud / factor]);
  }

  return coordenadas;
}

function formatearDistancia(metros) {
  if (metros < 1000) return `${Math.round(metros / 10) * 10} m`;
  return `${(metros / 1000).toFixed(1)} km`;
}

function formatearDuracion(segundos) {
  const minutos = Math.max(1, Math.round(segundos / 60));
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

function distanciaLineal(origen, destino) {
  const radio = 6371000;
  const rad = Math.PI / 180;
  const dLat = (destino[0] - origen[0]) * rad;
  const dLon = (destino[1] - origen[1]) * rad;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(origen[0] * rad) * Math.cos(destino[0] * rad) * Math.sin(dLon / 2) ** 2;
  return radio * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function solicitarRuta(origen, destino, senal) {
  const respuesta = await fetch(ROUTING_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": CLIENT_ID
    },
    body: JSON.stringify({
      locations: [
        { lat: origen[0], lon: origen[1], type: "break" },
        { lat: destino[0], lon: destino[1], type: "break" }
      ],
      costing: "pedestrian",
      directions_options: {
        language: "es-ES",
        units: "kilometers",
        format: "osrm"
      }
    }),
    signal: senal
  });

  if (!respuesta.ok) throw new Error("El servicio de rutas no respondió correctamente.");
  const datos = await respuesta.json();
  const ruta = datos.routes?.[0];
  if (!ruta?.geometry || !ruta.legs?.[0]) throw new Error("No se encontró un sendero entre estos lugares.");
  return ruta;
}

function normalizarRuta(ruta) {
  return {
    coordenadas: decodificarPolyline(ruta.geometry),
    distance: ruta.distance,
    duration: ruta.duration,
    steps: ruta.legs[0].steps
  };
}

async function solicitarRutaCampus(lugarOrigen, lugarDestino, senal) {
  const origenEnRectoria = LUGARES_SECTOR_RECTORIA.has(lugarOrigen.id);
  const destinoEnRectoria = LUGARES_SECTOR_RECTORIA.has(lugarDestino.id);
  if (origenEnRectoria === destinoEnRectoria) {
    return normalizarRuta(await solicitarRuta(lugarOrigen.coordenadas, lugarDestino.coordenadas, senal));
  }

  const distanciaConexion = distanciaLineal(CONECTOR_RECTORIA, CONECTOR_CAMPUS);
  if (origenEnRectoria) {
    const tramoCampus = normalizarRuta(await solicitarRuta(CONECTOR_CAMPUS, lugarDestino.coordenadas, senal));
    const acceso = distanciaLineal(lugarOrigen.coordenadas, CONECTOR_RECTORIA);
    return {
      coordenadas: [lugarOrigen.coordenadas, CONECTOR_RECTORIA, CONECTOR_CAMPUS, ...tramoCampus.coordenadas],
      distance: acceso + distanciaConexion + tramoCampus.distance,
      duration: (acceso + distanciaConexion) / 1.2 + tramoCampus.duration,
      steps: [
        { maneuver: { instruction: "Dirígete al sendero principal del campus." }, distance: acceso },
        { maneuver: { instruction: "Continúa por la conexión peatonal hacia el centro del campus." }, distance: distanciaConexion },
        ...tramoCampus.steps
      ]
    };
  }

  const tramoCampus = normalizarRuta(await solicitarRuta(lugarOrigen.coordenadas, CONECTOR_CAMPUS, senal));
  const acceso = distanciaLineal(CONECTOR_RECTORIA, lugarDestino.coordenadas);
  return {
    coordenadas: [...tramoCampus.coordenadas, CONECTOR_CAMPUS, CONECTOR_RECTORIA, lugarDestino.coordenadas],
    distance: tramoCampus.distance + distanciaConexion + acceso,
    duration: tramoCampus.duration + (distanciaConexion + acceso) / 1.2,
    steps: [
      ...tramoCampus.steps,
      { maneuver: { instruction: "Continúa por la conexión peatonal hacia Rectoría." }, distance: distanciaConexion },
      { maneuver: { instruction: `Sigue hacia ${lugarDestino.nombre}.` }, distance: acceso }
    ]
  };
}

export function configurarRutas({ map, lugares, cerrarFicha, mostrarToast }) {
  const panel = document.querySelector("[data-route-panel]");
  const origen = panel.querySelector("[data-route-origin]");
  const destino = panel.querySelector("[data-route-destination]");
  const formulario = panel.querySelector("[data-route-form]");
  const resumen = panel.querySelector("[data-route-summary]");
  const pasos = panel.querySelector("[data-route-steps]");
  const estado = panel.querySelector("[data-route-status]");
  const botonTrazar = panel.querySelector("[data-route-submit]");
  const botonCerrar = panel.querySelector("[data-route-close]");
  const botonIntercambiar = panel.querySelector("[data-route-swap]");
  let capaRuta = null;
  let puntosRuta = null;
  let controlador = null;

  const opciones = lugares
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  [origen, destino].forEach((select) => {
    opciones.forEach((lugar) => {
      const opcion = document.createElement("option");
      opcion.value = lugar.id;
      opcion.textContent = lugar.nombre;
      select.append(opcion);
    });
  });

  function limpiarDibujo() {
    if (capaRuta) map.removeLayer(capaRuta);
    if (puntosRuta) map.removeLayer(puntosRuta);
    capaRuta = null;
    puntosRuta = null;
  }

  function actualizarUrl(idOrigen, idDestino) {
    const url = new URL(window.location.href);
    url.searchParams.delete("edificio");
    if (idOrigen && idDestino) {
      url.searchParams.set("origen", idOrigen);
      url.searchParams.set("destino", idDestino);
    } else {
      url.searchParams.delete("origen");
      url.searchParams.delete("destino");
    }
    history.replaceState({}, "", url);
  }

  function abrir(idDestino = "") {
    cerrarFicha({ actualizarUrl: false });
    panel.hidden = false;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    document.body.classList.add("route-open");
    if (idDestino) destino.value = idDestino;
    window.setTimeout(() => (origen.value ? destino : origen).focus({ preventScroll: true }), 180);
  }

  function cerrar({ conservarRuta = true } = {}) {
    controlador?.abort();
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("route-open");
    if (!conservarRuta) {
      limpiarDibujo();
      actualizarUrl();
    }
    window.setTimeout(() => {
      if (!panel.classList.contains("is-open")) panel.hidden = true;
    }, 240);
  }

  async function trazar(idOrigen, idDestino) {
    const lugarOrigen = lugares.find((lugar) => lugar.id === idOrigen);
    const lugarDestino = lugares.find((lugar) => lugar.id === idDestino);
    if (!lugarOrigen || !lugarDestino) {
      estado.textContent = "Selecciona un punto de partida y un destino.";
      estado.dataset.state = "error";
      return;
    }
    if (lugarOrigen.id === lugarDestino.id) {
      estado.textContent = "El punto de partida y el destino deben ser diferentes.";
      estado.dataset.state = "error";
      return;
    }

    controlador?.abort();
    controlador = new AbortController();
    botonTrazar.disabled = true;
    botonTrazar.querySelector("span").textContent = "Calculando…";
    estado.textContent = "Buscando el mejor recorrido peatonal disponible…";
    estado.dataset.state = "loading";
    resumen.hidden = true;
    pasos.replaceChildren();

    try {
      const ruta = await solicitarRutaCampus(lugarOrigen, lugarDestino, controlador.signal);
      const coordenadas = ruta.coordenadas;
      limpiarDibujo();
      capaRuta = L.layerGroup([
        L.polyline(coordenadas, { color: "#ffffff", weight: 9, opacity: 0.92, lineCap: "round", lineJoin: "round" }),
        L.polyline(coordenadas, { color: "#0b6b3a", weight: 5, opacity: 0.96, lineCap: "round", lineJoin: "round" })
      ]).addTo(map);
      puntosRuta = L.layerGroup([
        L.circleMarker(coordenadas[0], { radius: 8, color: "#fff", weight: 3, fillColor: "#17804a", fillOpacity: 1 }),
        L.circleMarker(coordenadas.at(-1), { radius: 8, color: "#fff", weight: 3, fillColor: "#074a2a", fillOpacity: 1 })
      ]).addTo(map);

      map.fitBounds(L.latLngBounds(coordenadas), {
        paddingTopLeft: [42, 70],
        paddingBottomRight: [window.innerWidth > 900 ? 420 : 42, window.innerWidth > 900 ? 70 : 300],
        maxZoom: 19
      });

      panel.querySelector("[data-route-distance]").textContent = formatearDistancia(ruta.distance);
      panel.querySelector("[data-route-duration]").textContent = formatearDuracion(ruta.duration);
      resumen.hidden = false;
      ruta.steps.forEach((paso) => {
        const item = document.createElement("li");
        const texto = document.createElement("span");
        const distancia = document.createElement("small");
        texto.textContent = paso.maneuver?.instruction || "Continúa por el sendero.";
        distancia.textContent = formatearDistancia(paso.distance || 0);
        item.append(texto, distancia);
        pasos.append(item);
      });
      estado.textContent = "Ruta peatonal lista.";
      estado.dataset.state = "success";
      actualizarUrl(lugarOrigen.id, lugarDestino.id);
    } catch (error) {
      if (error.name === "AbortError") return;
      limpiarDibujo();
      estado.textContent = "No fue posible calcular esta ruta. Revisa tu conexión o prueba otros puntos.";
      estado.dataset.state = "error";
      mostrarToast(error.message, "warning");
    } finally {
      botonTrazar.disabled = false;
      botonTrazar.querySelector("span").textContent = "Trazar ruta";
    }
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    trazar(origen.value, destino.value);
  });
  botonIntercambiar.addEventListener("click", () => {
    const valorOrigen = origen.value;
    origen.value = destino.value;
    destino.value = valorOrigen;
  });
  botonCerrar.addEventListener("click", () => cerrar());
  document.querySelector("[data-route-open]").addEventListener("click", () => abrir());
  document.querySelector("[data-route-to]").addEventListener("click", (evento) => abrir(evento.currentTarget.dataset.routeTo));

  const parametros = new URLSearchParams(window.location.search);
  const idOrigen = parametros.get("origen");
  const idDestino = parametros.get("destino");
  if (lugares.some((lugar) => lugar.id === idOrigen) && lugares.some((lugar) => lugar.id === idDestino)) {
    origen.value = idOrigen;
    destino.value = idDestino;
    window.setTimeout(() => {
      abrir();
      trazar(idOrigen, idDestino);
    }, 350);
  }

  return {
    abrirHacia(id) {
      abrir(id);
    },
    cerrar,
    limpiar() {
      cerrar({ conservarRuta: false });
    }
  };
}
