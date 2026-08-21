export const LEVEL_LABELS = Object.freeze({
  tsu: "Técnico Superior Universitario (TSU)",
  licenciatura: "Licenciatura",
  ingenieria: "Licenciatura en Ingeniería"
});

export const CAREERS = Object.freeze([
  { id: "tsu-capital-humano", level: "tsu", name: "Gestión del Capital Humano" },
  { id: "tsu-emprendimiento-proyectos", level: "tsu", name: "Emprendimiento, Formulación y Evaluación de Proyectos" },
  { id: "tsu-mercadotecnia", level: "tsu", name: "Mercadotecnia" },
  { id: "tsu-contaduria", level: "tsu", name: "Contaduría" },
  { id: "tsu-diseno-animacion-digital", level: "tsu", name: "Diseño y Animación Digital" },
  { id: "tsu-ciencias-datos", level: "tsu", name: "Ciencias de Datos" },
  { id: "tsu-biotecnologia", level: "tsu", name: "Biotecnología" },
  { id: "tsu-transporte-movilidad", level: "tsu", name: "Transporte y Movilidad" },
  { id: "tsu-cadena-suministro", level: "tsu", name: "Cadena de Suministro" },
  { id: "tsu-automotriz", level: "tsu", name: "Automotriz" },
  { id: "tsu-mantenimiento-industrial", level: "tsu", name: "Mantenimiento Industrial" },
  { id: "tsu-manufactura-flexible", level: "tsu", name: "Sistemas de Manufactura Flexible" },
  { id: "tsu-desarrollo-software", level: "tsu", name: "Desarrollo de Software Multiplataforma" },
  { id: "tsu-redes-digitales", level: "tsu", name: "Infraestructura de Redes Digitales" },
  { id: "tsu-nanotecnologia", level: "tsu", name: "Nanotecnología" },
  { id: "tsu-gestion-ambiental", level: "tsu", name: "Gestión Ambiental" },
  { id: "lic-administracion", level: "licenciatura", name: "Administración" },
  { id: "lic-negocios-mercadotecnia", level: "licenciatura", name: "Negocios y Mercadotecnia" },
  { id: "lic-contaduria", level: "licenciatura", name: "Contaduría" },
  { id: "lic-diseno-produccion-audiovisual", level: "licenciatura", name: "Diseño Digital y Producción Audiovisual" },
  { id: "lic-enfermeria", level: "licenciatura", name: "Enfermería" },
  { id: "lic-terapia-fisica", level: "licenciatura", name: "Terapia Física" },
  { id: "ing-datos-inteligencia-artificial", level: "ingenieria", name: "Datos e Inteligencia Artificial" },
  { id: "ing-biotecnologia", level: "ingenieria", name: "Biotecnología" },
  { id: "ing-logistica", level: "ingenieria", name: "Logística" },
  { id: "ing-industrial", level: "ingenieria", name: "Industrial" },
  { id: "ing-mantenimiento-industrial", level: "ingenieria", name: "Mantenimiento Industrial" },
  { id: "ing-mecatronica", level: "ingenieria", name: "Mecatrónica" },
  { id: "ing-ti-innovacion-digital", level: "ingenieria", name: "Tecnologías de la Información e Innovación Digital" },
  { id: "ing-nanotecnologia", level: "ingenieria", name: "Nanotecnología" },
  { id: "ing-ambiental-sustentabilidad", level: "ingenieria", name: "Ambiental y Sustentabilidad" }
]);

export const CAMPUS_BUILDINGS = Object.freeze([
  { id: "C", name: "Edificio C · Gobierno y Rectoría" },
  { id: "D", name: "Edificio D · Tecnologías de la Información y Diseño Digital" },
  { id: "E", name: "Edificio E · Mecatrónica y Mantenimiento Industrial" },
  { id: "F", name: "Edificio F · Ciencias de la Sustentabilidad" },
  { id: "G", name: "Edificio G · Administración y Contabilidad" },
  { id: "H", name: "Edificio H · CCAI y Secretaría de Vinculación" },
  { id: "I", name: "Edificio I · Centro de Idiomas" },
  { id: "J", name: "Edificio J · Biblioteca y Servicios Escolares" },
  { id: "K", name: "Edificio K · Aulas, laboratorios y Servicio Médico" },
  { id: "L", name: "Edificio L · Tecnología Gráfica y Automotriz" },
  { id: "M", name: "Edificio M · Radio, TV y Redes Digitales" },
  { id: "N", name: "Edificio N · Gimnasio y Auditorio Dragones" },
  { id: "O", name: "Edificio O · Mercadotecnia y Logística" },
  { id: "P", name: "Edificio P · Ciencias de la Salud" }
]);

export function careerById(id) {
  return CAREERS.find((career) => career.id === id) ?? null;
}
