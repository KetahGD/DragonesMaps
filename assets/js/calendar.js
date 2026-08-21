const MESES = Array.from({ length: 16 }, (_, indice) => ({
  anio: 2026 + Math.floor(indice / 12),
  mes: indice % 12
}));

const CUATRIMESTRES = [
  { codigo: "2026-1", periodo: "I", dias: 88 },
  { codigo: "2026-2", periodo: "II", dias: 95 },
  { codigo: "2026-3", periodo: "III", dias: 90 },
  { codigo: "2027-1", periodo: "I", dias: 74 }
];

const EVENTOS = {
  inicio: { etiqueta: "Inicio de cuatrimestre", color: "#b7ce4b" },
  fin: { etiqueta: "Fin de cuatrimestre", color: "#f47f68" },
  parcial: { etiqueta: "Evaluaciones parciales", color: "#f6d154", fondo: true },
  vacaciones: { etiqueta: "Periodo vacacional", color: "#ed7479", fondo: true, contraste: "#fff" },
  suspension: { etiqueta: "Suspensión de labores", color: "#cf6670" },
  aniversario: { etiqueta: "Aniversario de la UTFV", color: "#8fc59a" },
  inscripcion: { etiqueta: "Inscripción y reinscripción", color: "#49b8dd", fondo: true },
  concentrados: { etiqueta: "Entrega de concentrados de calificaciones", color: "#777", fondo: true, contraste: "#fff" },
  comision: { etiqueta: "Comisión General Académica", color: "#b9dfa2", fondo: true },
  acta: { etiqueta: "Entrega de acta de evaluación especial", color: "#92979e", fondo: true, contraste: "#fff" },
  becas: { etiqueta: "Entrega de expedientes para becas internas", color: "#f1a2c1", fondo: true },
  especial: { etiqueta: "Aplicación de evaluación especial", color: "#14799b", fondo: true, contraste: "#fff" },
  ego: { etiqueta: "Aplicación de Examen General Ordinario (EGO)", color: "#52775c", fondo: true, contraste: "#fff" },
  estadias: { etiqueta: "Último día para asignación de estadías", color: "#688548" },
  servicio: { etiqueta: "Fecha límite para iniciar servicio social", color: "#38acd3" },
  recuperacion: { etiqueta: "Evaluación de recuperación", color: "#4aa4bb" },
  extraordinaria: { etiqueta: "Evaluación extraordinaria especial", color: "#267e9b" },
  proceso: { etiqueta: "Proceso de estadías", color: "#222" },
  induccion: { etiqueta: "Curso de inducción (CIANI)", color: "#35afd5" },
  secretarial: { etiqueta: "Suspensión de labores del personal secretarial", color: "#35bfe0" }
};

const PRIORIDAD_FONDO = ["vacaciones", "especial", "ego", "inscripcion", "acta", "becas", "comision", "parcial", "concentrados"];
const TIPOS_CON_FIGURA = new Set(["inicio", "fin", "suspension", "aniversario", "estadias", "servicio", "recuperacion", "extraordinaria", "proceso", "induccion", "secretarial"]);
const datosCalendario = {};

function figuraEvento(tipo, clase = "") {
  const formas = {
    inicio: '<path d="M8 17H35L49 30 35 43H8Z"/>',
    fin: '<path d="M54 17H19L5 30l14 13h35Z"/>',
    suspension: '<circle cx="30" cy="30" r="18"/>',
    aniversario: '<path d="M30 10 49 47H11Z"/>',
    estadias: '<path d="M13 39C17 18 31 11 43 17c-1 14 5 23 8 28-16 4-31 4-38-6Z"/>',
    servicio: '<path d="M17 11h26l12 19-12 19H17L5 30Z"/>',
    recuperacion: '<path d="M53 13H19C10 13 7 18 7 27v6c0 9 3 14 12 14h34M53 13c-7 7-7 27 0 34"/>',
    extraordinaria: '<path d="M12 14h36q5 0 5 5v20q0 5-5 5H35l-5 5-5-5H12q-5 0-5-5V19q0-5 5-5Z"/>',
    proceso: '<path d="M8 10h44M8 10v40M8 50h44M52 10v40" class="calendar-symbol__process"/>',
    induccion: '<path d="M30 8 50 23 43 49H17L10 23Z"/>',
    secretarial: '<circle cx="30" cy="30" r="18"/>'
  };
  return `<svg class="calendar-symbol ${clase}" style="--event-color:${EVENTOS[tipo].color}" viewBox="0 0 60 60" aria-hidden="true">${formas[tipo] || ""}</svg>`;
}

function agregarFechas(tipo, fechas) {
  fechas.forEach((fecha) => {
    datosCalendario[fecha] ??= [];
    if (!datosCalendario[fecha].includes(tipo)) datosCalendario[fecha].push(tipo);
  });
}

agregarFechas("inicio", ["2026-01-07", "2026-05-04", "2026-09-01", "2027-01-06"]);
agregarFechas("fin", ["2026-04-30", "2026-08-31", "2026-12-18", "2027-04-30"]);
agregarFechas("suspension", [
  "2026-01-01", "2026-02-05", "2026-03-02", "2026-03-16", "2026-04-02", "2026-04-03",
  "2026-05-01", "2026-05-05", "2026-05-15", "2026-08-20", "2026-09-15", "2026-09-16",
  "2026-11-02", "2026-11-16", "2026-12-12", "2026-12-25", "2027-01-01", "2027-02-01",
  "2027-03-02", "2027-03-15", "2027-03-25", "2027-03-26"
]);
agregarFechas("vacaciones", [
  "2026-01-02", "2026-01-05", "2026-01-06", "2026-03-30", "2026-03-31", "2026-04-01",
  "2026-04-06", "2026-04-07", "2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23",
  "2026-07-24", "2026-12-21", "2026-12-22", "2026-12-23", "2026-12-24", "2026-12-28",
  "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-04", "2027-01-05", "2027-03-22",
  "2027-03-23", "2027-03-24", "2027-03-29", "2027-03-30"
]);
agregarFechas("parcial", [
  "2026-01-26", "2026-01-27", "2026-01-28", "2026-01-29", "2026-01-30", "2026-01-31",
  "2026-02-23", "2026-02-24", "2026-02-25", "2026-02-26", "2026-02-27", "2026-02-28",
  "2026-03-20", "2026-03-21", "2026-03-23", "2026-03-24", "2026-03-25", "2026-03-26",
  "2026-05-25", "2026-05-26", "2026-05-27", "2026-05-28", "2026-05-29", "2026-06-01",
  "2026-06-23", "2026-06-24", "2026-06-25", "2026-06-26", "2026-06-27", "2026-06-29",
  "2026-07-30", "2026-07-31", "2026-08-01", "2026-08-03", "2026-08-04", "2026-08-05",
  "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-28", "2026-09-29", "2026-09-30",
  "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31",
  "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-23", "2026-11-24", "2026-11-25",
  "2027-01-25", "2027-01-26", "2027-01-27", "2027-01-28", "2027-01-29", "2027-02-02",
  "2027-02-22", "2027-02-23", "2027-02-24", "2027-02-25", "2027-02-26", "2027-03-01",
  "2027-03-31", "2027-04-01", "2027-04-02", "2027-04-05", "2027-04-06", "2027-04-07"
]);
agregarFechas("extraordinaria", [
  "2026-01-08", "2026-01-09", "2026-01-10", "2026-05-06", "2026-05-07", "2026-09-03",
  "2026-09-04", "2026-09-05", "2027-01-08", "2027-01-11", "2027-01-12"
]);
agregarFechas("aniversario", ["2026-01-09", "2027-01-09"]);
agregarFechas("estadias", ["2026-01-12", "2026-05-11", "2026-09-07", "2027-01-11"]);
agregarFechas("induccion", ["2026-01-15", "2026-05-14", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11", "2027-01-14"]);
agregarFechas("recuperacion", [
  "2026-02-02", "2026-02-03", "2026-02-04", "2026-02-06", "2026-02-07", "2026-03-03",
  "2026-03-04", "2026-03-05", "2026-03-06", "2026-03-07", "2026-03-27", "2026-03-28",
  "2026-04-08", "2026-04-09", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05",
  "2026-06-06", "2026-06-08", "2026-06-20", "2026-06-30", "2026-07-01", "2026-07-02",
  "2026-07-03", "2026-07-04", "2026-08-06", "2026-08-07", "2026-08-08", "2026-08-10",
  "2026-08-22", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-05", "2026-10-06",
  "2026-10-07", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07",
  "2026-11-09", "2026-11-21", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-30",
  "2027-02-03", "2027-02-04", "2027-02-05", "2027-02-08", "2027-02-09", "2027-03-03",
  "2027-03-04", "2027-03-05", "2027-03-08", "2027-03-09", "2027-03-10", "2027-04-08",
  "2027-04-09", "2027-04-12", "2027-04-13"
]);
agregarFechas("servicio", ["2026-02-27", "2026-06-26", "2026-10-30", "2027-02-26"]);
agregarFechas("especial", [
  "2026-03-12", "2026-03-13", "2026-03-14", "2026-07-16", "2026-07-17", "2026-07-18",
  "2026-11-12", "2026-11-13", "2026-11-14", "2027-03-12", "2027-03-16", "2027-03-17"
]);
agregarFechas("acta", ["2026-03-17", "2026-07-29", "2026-11-17", "2027-03-18"]);
agregarFechas("becas", ["2026-03-18", "2026-07-15", "2026-11-18", "2027-03-19"]);
agregarFechas("ego", ["2026-04-10", "2026-04-13", "2026-08-11", "2026-08-12", "2026-12-01", "2026-12-02", "2027-04-14", "2027-04-15"]);
agregarFechas("concentrados", ["2026-04-17", "2026-08-19", "2026-12-07", "2027-04-20"]);
agregarFechas("comision", ["2026-04-22", "2026-08-21", "2026-12-09", "2027-04-21"]);
const fechasInscripcion = [
  "2026-04-23", "2026-04-24", "2026-04-25", "2026-04-27", "2026-04-28", "2026-08-24",
  "2026-08-25", "2026-08-26", "2026-08-27", "2026-08-28", "2026-12-10", "2026-12-11",
  "2026-12-14", "2026-12-15", "2026-12-16", "2026-12-17", "2027-04-22", "2027-04-23",
  "2027-04-26", "2027-04-27", "2027-04-28"
];
agregarFechas("inscripcion", fechasInscripcion);
agregarFechas("proceso", fechasInscripcion);
agregarFechas("secretarial", ["2026-07-16"]);

const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const diasSemana = ["D", "L", "M", "M", "J", "V", "S"];
const hoy = new Date();
const hoyClave = formatearFecha(hoy);

function formatearFecha(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function numeroSemana(fecha) {
  const inicio = new Date(fecha.getFullYear(), 0, 1);
  const diaAnual = Math.floor((fecha - inicio) / 86400000) + 1;
  return Math.floor((diaAnual + inicio.getDay() - 1) / 7) + 1;
}

function matrizMes(anio, mes) {
  const primero = new Date(anio, mes, 1);
  const ultimo = new Date(anio, mes + 1, 0);
  const semanas = [];
  const cursor = new Date(anio, mes, 1 - primero.getDay());
  while (cursor <= ultimo || cursor.getDay() !== 0) {
    const semana = [];
    for (let indice = 0; indice < 7; indice += 1) {
      semana.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    semanas.push(semana);
    if (cursor > ultimo && cursor.getDay() === 0) break;
  }
  return semanas;
}

function mostrarDetalle(clave, tipos) {
  const detalle = document.querySelector("[data-calendar-detail]");
  const fecha = new Date(`${clave}T12:00:00`);
  const titulo = fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  detalle.querySelector("strong").textContent = titulo.charAt(0).toUpperCase() + titulo.slice(1);
  detalle.querySelector("span").textContent = tipos.map((tipo) => EVENTOS[tipo].etiqueta).join(" · ");
  detalle.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
}

function crearMes({ anio, mes }) {
  const articulo = document.createElement("article");
  const id = `mes-${anio}-${String(mes + 1).padStart(2, "0")}`;
  const esActual = hoy.getFullYear() === anio && hoy.getMonth() === mes;
  articulo.id = id;
  articulo.className = `calendar-month${esActual ? " is-current" : ""}`;
  articulo.innerHTML = `<h2 class="calendar-month__title"><span>${nombresMeses[mes]} ${anio}</span>${esActual ? "<small>Mes actual</small>" : ""}</h2>`;

  const tabla = document.createElement("table");
  tabla.setAttribute("aria-label", `${nombresMeses[mes]} ${anio}`);
  tabla.innerHTML = `<thead><tr><th class="week-number" scope="col">SEM</th>${diasSemana.map((dia) => `<th scope="col">${dia}</th>`).join("")}</tr></thead>`;
  const cuerpo = document.createElement("tbody");

  matrizMes(anio, mes).forEach((semana) => {
    const fila = document.createElement("tr");
    const fechaPropia = semana.find((fecha) => fecha.getFullYear() === anio && fecha.getMonth() === mes) || semana[0];
    fila.innerHTML = `<th class="week-number" scope="row">${numeroSemana(fechaPropia)}</th>`;
    semana.forEach((fecha) => {
      const celda = document.createElement("td");
      celda.className = "calendar-day";
      if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes) {
        celda.classList.add("is-empty");
        fila.append(celda);
        return;
      }

      const clave = formatearFecha(fecha);
      const tipos = datosCalendario[clave] || [];
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "calendar-day__button";
      boton.innerHTML = `<span class="calendar-day__number">${fecha.getDate()}</span>`;
      boton.disabled = tipos.length === 0;

      if (clave === hoyClave) celda.classList.add("is-today");
      if (tipos.length) {
        celda.classList.add("has-events");
        const etiquetas = tipos.map((tipo) => EVENTOS[tipo].etiqueta);
        boton.setAttribute("aria-label", `${clave}: ${etiquetas.join(", ")}`);
        boton.title = etiquetas.join("\n");
        boton.addEventListener("click", () => mostrarDetalle(clave, tipos));
        const fondo = PRIORIDAD_FONDO.find((tipo) => tipos.includes(tipo));
        if (fondo) {
          celda.classList.add("has-background");
          celda.style.setProperty("--event-color", EVENTOS[fondo].color);
          celda.style.setProperty("--event-contrast", EVENTOS[fondo].contraste || "#183026");
        }
        tipos.filter((tipo) => TIPOS_CON_FIGURA.has(tipo)).forEach((tipo) => {
          boton.insertAdjacentHTML("beforeend", figuraEvento(tipo, "calendar-symbol--day"));
        });
      }
      celda.append(boton);
      fila.append(celda);
    });
    cuerpo.append(fila);
  });
  tabla.append(cuerpo);
  articulo.append(tabla);
  return articulo;
}

const rejilla = document.querySelector("[data-calendar-grid]");
const selector = document.querySelector("[data-calendar-month]");
MESES.forEach((mes) => {
  rejilla.append(crearMes(mes));
  const opcion = document.createElement("option");
  opcion.value = `mes-${mes.anio}-${String(mes.mes + 1).padStart(2, "0")}`;
  opcion.textContent = `${nombresMeses[mes.mes]} ${mes.anio}`;
  selector.append(opcion);
});

document.querySelector("[data-term-summary]").replaceChildren(...CUATRIMESTRES.map((periodo) => {
  const tarjeta = document.createElement("article");
  tarjeta.className = "term-card";
  tarjeta.innerHTML = `<div><span>Cuatrimestre</span><strong>${periodo.codigo} · ${periodo.periodo}</strong></div><b>${periodo.dias} días</b>`;
  return tarjeta;
}));

const elementosLeyenda = Object.entries(EVENTOS).map(([tipo, evento]) => {
  const elemento = document.createElement("div");
  elemento.className = "legend-item";
  elemento.style.setProperty("--event-color", evento.color);
  const muestra = TIPOS_CON_FIGURA.has(tipo)
    ? figuraEvento(tipo, "calendar-symbol--legend")
    : '<i class="legend-swatch" aria-hidden="true"></i>';
  elemento.innerHTML = `<span>${evento.etiqueta}</span>${muestra}`;
  return elemento;
});
const diasEfectivos = document.createElement("div");
diasEfectivos.className = "legend-item legend-item--effective";
diasEfectivos.innerHTML = "<span>Días efectivos de trabajo por año escolar</span><strong>347</strong>";
elementosLeyenda.splice(8, 0, diasEfectivos);
document.querySelector("[data-calendar-legend]").replaceChildren(...elementosLeyenda);

function irAlMes(id) {
  const mes = document.getElementById(id);
  if (!mes) return;
  mes.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

selector.addEventListener("change", () => irAlMes(selector.value));
document.querySelector("[data-calendar-today]").addEventListener("click", () => {
  const idActual = `mes-${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  if (document.getElementById(idActual)) {
    selector.value = idActual;
    irAlMes(idActual);
  } else {
    selector.value = "mes-2026-01";
    irAlMes("mes-2026-01");
  }
});
document.querySelector("[data-calendar-print]").addEventListener("click", () => window.print());

const idMesActual = `mes-${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
if (document.getElementById(idMesActual)) selector.value = idMesActual;
