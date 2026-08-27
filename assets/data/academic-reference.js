export const NIVELES_ACADEMICOS = {
  tsu: { etiqueta: "Técnico Superior Universitario (TSU)", cuatrimestres: [1, 2, 3, 4, 5, 6] },
  licenciatura: { etiqueta: "Licenciatura e Ingeniería", cuatrimestres: [7, 8, 9, 10, 11, 12] }
};

export const edificiosPrincipales = {
  "edificio-d": "Edificio D",
  "edificio-e": "Edificio E",
  "edificio-f": "Edificio F",
  "edificio-g": "Edificio G",
  "edificio-k": "Edificio K",
  "edificio-m": "Edificio M",
  "edificio-o": "Edificio O",
  "edificio-p": "Edificio P"
};

export const programasAcademicos = [
  ["tsu-capital-humano", "tsu", "TSU en Gestión del Capital Humano", "edificio-g"],
  ["tsu-emprendimiento", "tsu", "TSU en Emprendimiento, Formulación y Evaluación de Proyectos", "edificio-g"],
  ["tsu-mercadotecnia", "tsu", "TSU en Mercadotecnia", "edificio-o"],
  ["tsu-contaduria", "tsu", "TSU en Contaduría", "edificio-g"],
  ["tsu-diseno", "tsu", "TSU en Diseño y Animación Digital", "edificio-d"],
  ["tsu-datos", "tsu", "TSU en Ciencias de Datos", "edificio-d"],
  ["tsu-biotecnologia", "tsu", "TSU en Biotecnología", "edificio-f"],
  ["tsu-transporte", "tsu", "TSU en Transporte y Movilidad", "edificio-o"],
  ["tsu-suministro", "tsu", "TSU en Cadena de Suministro", "edificio-o"],
  ["tsu-automotriz", "tsu", "TSU en Automotriz", "edificio-k"],
  ["tsu-mantenimiento", "tsu", "TSU en Mantenimiento Industrial", "edificio-e"],
  ["tsu-manufactura", "tsu", "TSU en Sistemas de Manufactura Flexible", "edificio-k"],
  ["tsu-software", "tsu", "TSU en Desarrollo de Software Multiplataforma", "edificio-d"],
  ["tsu-redes", "tsu", "TSU en Infraestructura de Redes Digitales", "edificio-m"],
  ["tsu-nanotecnologia", "tsu", "TSU en Nanotecnología", "edificio-f"],
  ["tsu-ambiental", "tsu", "TSU en Gestión Ambiental", "edificio-k"],
  ["lic-administracion", "licenciatura", "Licenciatura en Administración", "edificio-g"],
  ["lic-negocios", "licenciatura", "Licenciatura en Negocios y Mercadotecnia", "edificio-o"],
  ["lic-contaduria", "licenciatura", "Licenciatura en Contaduría", "edificio-g"],
  ["lic-diseno", "licenciatura", "Licenciatura en Diseño Digital y Producción Audiovisual", "edificio-d"],
  ["lic-enfermeria", "licenciatura", "Licenciatura en Enfermería", "edificio-p"],
  ["lic-terapia", "licenciatura", "Licenciatura en Terapia Física", "edificio-p"],
  ["ing-datos", "licenciatura", "Licenciatura en Ingeniería en Datos e Inteligencia Artificial", "edificio-d"],
  ["ing-biotecnologia", "licenciatura", "Licenciatura en Ingeniería en Biotecnología", "edificio-f"],
  ["ing-logistica", "licenciatura", "Licenciatura en Ingeniería Logística", "edificio-o"],
  ["ing-industrial", "licenciatura", "Licenciatura en Ingeniería Industrial", "edificio-e"],
  ["ing-mantenimiento", "licenciatura", "Licenciatura en Ingeniería en Mantenimiento Industrial", "edificio-e"],
  ["ing-mecatronica", "licenciatura", "Licenciatura en Ingeniería en Mecatrónica", "edificio-e"],
  ["ing-ti", "licenciatura", "Licenciatura en Ingeniería en Tecnologías de la Información e Innovación Digital", "edificio-d"],
  ["ing-nanotecnologia", "licenciatura", "Licenciatura en Ingeniería en Nanotecnología", "edificio-f"],
  ["ing-ambiental", "licenciatura", "Licenciatura en Ingeniería en Ambiental y Sustentabilidad", "edificio-k"]
].map(([id, nivel, nombre, edificioId]) => ({ id, nivel, nombre, edificioId }));

export function obtenerProgramasPorNivel(nivel) {
  return programasAcademicos.filter((programa) => programa.nivel === nivel);
}

export function obtenerProgramasPorEdificio(edificioId) {
  return programasAcademicos.filter((programa) => programa.edificioId === edificioId);
}

export function obtenerProgramaPorId(id) {
  return programasAcademicos.find((programa) => programa.id === id) ?? null;
}
