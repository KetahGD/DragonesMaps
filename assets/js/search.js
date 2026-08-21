import { buscarLugares, categorias } from "../data/places.js";

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

  const elegir = (lugar) => {
    input.value = lugar.nombre;
    cerrar();
    alSeleccionar(lugar);
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

  const renderizar = () => {
    resultados = buscarLugares(input.value);
    contenedor.replaceChildren();
    indiceActivo = -1;

    if (!input.value.trim()) {
      cerrar();
      return;
    }

    if (!resultados.length) {
      const vacio = document.createElement("div");
      vacio.className = "search-empty";
      vacio.textContent = "No encontramos lugares con ese nombre.";
      contenedor.append(vacio);
    } else {
      resultados.forEach((lugar, indice) => {
        const opcion = document.createElement("button");
        opcion.type = "button";
        opcion.id = `${input.id}-opcion-${indice}`;
        opcion.className = "search-option";
        opcion.setAttribute("role", "option");
        opcion.setAttribute("aria-selected", "false");

        const marcador = document.createElement("span");
        marcador.className = "search-option__marker";
        marcador.style.setProperty("--marker-color", categorias[lugar.categoria].color);
        marcador.setAttribute("aria-hidden", "true");

        const texto = document.createElement("span");
        const nombre = document.createElement("strong");
        nombre.textContent = lugar.nombre;
        const categoria = document.createElement("small");
        categoria.textContent = categorias[lugar.categoria].etiqueta;
        texto.append(nombre, categoria);

        opcion.append(marcador, texto);
        opcion.addEventListener("click", () => elegir(lugar));
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
      indiceActivo = (indiceActivo + 1) % resultados.length;
      actualizarSeleccion();
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      indiceActivo = (indiceActivo - 1 + resultados.length) % resultados.length;
      actualizarSeleccion();
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      elegir(resultados[indiceActivo >= 0 ? indiceActivo : 0]);
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
