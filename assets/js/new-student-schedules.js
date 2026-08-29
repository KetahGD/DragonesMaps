import { NIVELES_ACADEMICOS, programasAcademicos } from "../data/academic-reference.js?v=20260828-2";
import { horariosNuevoIngreso } from "../data/new-student-schedules.js?v=20260828-2";

function crearTarjeta(programa) {
  const horario = horariosNuevoIngreso[programa.id];
  const tarjeta = document.createElement("article");
  tarjeta.className = "schedule-career-card";

  const encabezado = document.createElement("div");
  encabezado.className = "schedule-career-card__heading";

  const nivel = document.createElement("span");
  nivel.className = "schedule-career-card__level";
  nivel.textContent = programa.nivel === "tsu" ? "TSU" : "Licenciatura / Ingeniería";

  const estado = document.createElement("span");
  estado.className = horario?.pdf ? "schedule-career-card__status is-ready" : "schedule-career-card__status";
  estado.textContent = horario?.pdf ? "Disponible" : "Próximamente";
  encabezado.append(nivel, estado);

  const titulo = document.createElement("h3");
  titulo.textContent = programa.nombre;

  const descripcion = document.createElement("p");
  descripcion.textContent = horario?.pdf
    ? `${horario.periodo}. Grupos incluidos: ${horario.grupos}.`
    : "El horario de nuevo ingreso se publicará en este apartado cuando esté disponible.";

  const accion = document.createElement(horario?.pdf ? "a" : "span");
  accion.className = horario?.pdf ? "schedule-career-card__action" : "schedule-career-card__pending";
  if (horario?.pdf) {
    accion.href = horario.pdf;
    accion.target = "_blank";
    accion.rel = "noopener noreferrer";
    accion.textContent = "Ver horario en PDF";
  } else {
    accion.textContent = "PDF pendiente de publicación";
  }

  tarjeta.append(encabezado, titulo, descripcion, accion);
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
