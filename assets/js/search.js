import { buscarLugares, categorias, obtenerLugarPorId } from "../data/places.js?v=20260901-1";
import { buscarProgramasAcademicos } from "../data/academic-reference.js?v=20260901-1";
import { buscarSitiosOficiales } from "../data/official-sites.js?v=20260901-1";

function obtenerResultados(consulta) {
  const carreras = buscarProgramasAcademicos(consulta, 8).map((programa) => {
    const lugar = programa.edificioId ? obtenerLugarPorId(programa.edificioId) : null;
    return {
      tipo: "carrera",
      nombre: programa.nombre,
      descripcion: lugar ? `Carrera · ${lugar.nombre}` : "Carrera · Edificio en actualización",
      color: "#0b6b3a",
      lugar
    };
  });

  const lugares = buscarLugares(consulta, 8).map((lugar) => ({
    tipo: "lugar",
    nombre: lugar.nombre,
    descripcion: categorias[lugar.categoria].etiqueta,
    color: categorias[lugar.categoria].color,
    lugar
  }));

  const paginas = buscarSitiosOficiales(consulta, 5).map((sitio) => ({
    tipo: "pagina",
    nombre: sitio.nombre,
    descripcion: "Sitio oficial de la división",
    color: "#335c9f",
    href: sitio.href
  }));

  return [...carreras, ...lugares, ...paginas].slice(0, 12);
}

export function configurarBusqueda({ input, contenedor, alSeleccionar }) {
  if (!input || !contenedor) return () => {};

  let resultados = [];
  let indiceActivo = -1;

  const cerrar = () => {
    contenedor.replaceChildren();
    contenedor.hidden = true;
    input.setAttribute("aria-expanded", "false");
    indiceActivo = -1;
  };

  const elegir = (resultado) => {
    if (!resultado) return;
    input.value = resultado.nombre;
    cerrar();
    if (resultado.href) {
      window.location.href = resultado.href;
      return;
    }
    if (!resultado.lugar) return;
    alSeleccionar(resultado.lugar, resultado);
  };

  const actualizarSeleccion = () => {
    const opciones = [...contenedor.querySelectorAll('[role="option"]')];
    opciones.forEach((opcion, indice) => {
      const activo = indice === indiceActivo;
      opcion.setAttribute("aria-selected", String(activo));
      opcion.classList.toggle("is-active", activo);
      if (activo) opcion.scrollIntoView({ block: "nearest" });
    });
    input.setAttribute("aria-activedescendant", indiceActivo >= 0 ? opciones[indiceActivo]?.id ?? "" : "");
  };

  const moverSeleccion = (direccion) => {
    const disponibles = resultados
      .map((resultado, indice) => resultado.lugar || resultado.href ? indice : -1)
      .filter((indice) => indice >= 0);
    if (!disponibles.length) return;
    const posicion = disponibles.indexOf(indiceActivo);
    if (posicion < 0) indiceActivo = direccion > 0 ? disponibles[0] : disponibles.at(-1);
    else indiceActivo = disponibles[(posicion + direccion + disponibles.length) % disponibles.length];
    actualizarSeleccion();
  };

  const renderizar = () => {
    resultados = obtenerResultados(input.value);
    contenedor.replaceChildren();
    indiceActivo = -1;

    if (!input.value.trim()) {
      cerrar();
      return;
    }

    if (!resultados.length) {
      const vacio = document.createElement("div");
      vacio.className = "search-empty";
      vacio.textContent = "No encontramos edificios, servicios, carreras o divisiones con ese nombre.";
      contenedor.append(vacio);
    } else {
      resultados.forEach((resultado, indice) => {
        const opcion = document.createElement("button");
        opcion.type = "button";
        opcion.id = `${input.id}-opcion-${indice}`;
        opcion.className = `search-option search-option--${resultado.tipo}`;
        opcion.setAttribute("role", "option");
        opcion.setAttribute("aria-selected", "false");
        if (!resultado.lugar && !resultado.href) {
          opcion.disabled = true;
          opcion.setAttribute("aria-disabled", "true");
        }

        const marcador = document.createElement("span");
        marcador.className = "search-option__marker";
        marcador.style.setProperty("--marker-color", resultado.color);
        marcador.setAttribute("aria-hidden", "true");

        const texto = document.createElement("span");
        const nombre = document.createElement("strong");
        nombre.textContent = resultado.nombre;
        const categoria = document.createElement("small");
        categoria.textContent = resultado.descripcion;
        texto.append(nombre, categoria);

        opcion.append(marcador, texto);
        opcion.addEventListener("click", () => elegir(resultado));
        contenedor.append(opcion);
      });
    }

    contenedor.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  const manejarTecla = (evento) => {
    if (evento.key === "Escape") {
      cerrar();
      return;
    }
    if (!resultados.length || contenedor.hidden) {
      if (evento.key === "Enter") renderizar();
      return;
    }
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      moverSeleccion(1);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      moverSeleccion(-1);
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      const resultado = resultados[indiceActivo >= 0 ? indiceActivo : resultados.findIndex((item) => item.lugar || item.href)];
      elegir(resultado);
    }
  };

  const manejarClicExterior = (evento) => {
    if (!contenedor.contains(evento.target) && evento.target !== input) cerrar();
  };

  input.addEventListener("input", renderizar);
  input.addEventListener("keydown", manejarTecla);
  document.addEventListener("pointerdown", manejarClicExterior);

  return () => document.removeEventListener("pointerdown", manejarClicExterior);
}
