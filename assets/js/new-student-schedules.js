import { NIVELES_ACADEMICOS, programasAcademicos } from "../data/academic-reference.js?v=20260828-2";
import { horariosNuevoIngreso } from "../data/new-student-schedules.js?v=20260831-3";

function obtenerDocumentos(horario) {
  if (horario?.documentos?.length) return horario.documentos;
  if (horario?.pdf) return [{ titulo: "Ver horario en PDF", pdf: horario.pdf }];
  return [];
}

function crearTarjeta(programa) {
  const horario = horariosNuevoIngreso[programa.id];
  const documentos = obtenerDocumentos(horario);
  const tarjeta = document.createElement("article");
  tarjeta.className = "schedule-career-card";

  const encabezado = document.createElement("div");
  encabezado.className = "schedule-career-card__heading";

  const nivel = document.createElement("span");
  nivel.className = "schedule-career-card__level";
  nivel.textContent = programa.nivel === "tsu" ? "TSU" : "Licenciatura / Ingeniería";

  const estado = document.createElement("span");
  estado.className = documentos.length ? "schedule-career-card__status is-ready" : "schedule-career-card__status";
  estado.textContent = documentos.length ? "Disponible" : "Próximamente";
  encabezado.append(nivel, estado);

  const titulo = document.createElement("h3");
  titulo.textContent = programa.nombre;

  const descripcion = document.createElement("p");
  descripcion.textContent = documentos.length
    ? `${horario.periodo}. Grupos incluidos: ${horario.grupos}.`
    : "El horario de nuevo ingreso se publicará en este apartado cuando esté disponible.";

  const acciones = document.createElement("div");
  acciones.className = "schedule-career-card__actions";
  if (documentos.length) documentos.forEach((documento) => {
    const accion = document.createElement("a");
    accion.className = "schedule-career-card__action";
    accion.href = documento.pdf;
    accion.target = "_blank";
    accion.rel = "noopener noreferrer";
    if (documento.descarga) accion.download = documento.descarga;
    accion.textContent = documento.titulo;
    acciones.append(accion);
  });
  else {
    const pendiente = document.createElement("span");
    pendiente.className = "schedule-career-card__pending";
    pendiente.textContent = "PDF pendiente de publicación";
    acciones.append(pendiente);
  }

  tarjeta.append(encabezado, titulo, descripcion, acciones);
  return tarjeta;
}

document.querySelectorAll("[data-schedule-level]").forEach((contenedor) => {
  const nivel = contenedor.dataset.scheduleLevel;
  const programas = programasAcademicos.filter((programa) => programa.nivel === nivel);
  const lista = contenedor.querySelector("[data-schedule-list]");
  const contador = contenedor.querySelector("[data-schedule-count]");
  lista.replaceChildren(...programas.map(crearTarjeta));
  contador.textContent = `${programas.length} ${programas.length === 1 ? "carrera" : "carreras"}`;
  contenedor.querySelector("[data-schedule-level-name]").textContent = NIVELES_ACADEMICOS[nivel].etiqueta;
});
