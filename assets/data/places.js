export const categorias = {
  edificio: { etiqueta: "Edificios", color: "#0b6b3a", icono: "building" },
  laboratorio: { etiqueta: "Laboratorios", color: "#2f7d65", icono: "flask" },
  servicio: { etiqueta: "Servicios", color: "#b86b16", icono: "service" },
  acceso: { etiqueta: "Accesos y conexiones", color: "#335c9f", icono: "gate" },
  deporte: { etiqueta: "Deporte", color: "#8a4d9f", icono: "sport" },
  patrimonio: { etiqueta: "Áreas especiales", color: "#7b6040", icono: "landmark" }
};

const imagenLugar = (slug, original) => ({
  imagen: `assets/images/places/optimized/${slug}-large.webp`,
  imagenMiniatura: `assets/images/places/optimized/${slug}-thumb.webp`,
  imagenOriginal: `assets/images/places/originals/${original}`
});

const imagenPanoramica = (slug) => ({
  imagen: `assets/images/panoramas/${slug}.jpeg`,
  imagenMiniatura: `assets/images/panoramas/${slug}.jpeg`,
  imagenOriginal: `assets/images/panoramas/${slug}.jpeg`
});

const panorama = (slug, titulo) => ({
  src: `assets/images/panoramas/${slug}.jpeg`,
  titulo
});

import { obtenerProgramasPorEdificio } from "./academic-reference.js";

export const lugares = [
  {
    id: "rectoria",
    nombre: "Rectoría · Edificio C",
    nombreOficial: "Edificio de Gobierno (Rectoría)",
    alias: ["Edificio C", "Gobierno", "Rectoría"],
    categoria: "edificio",
    coordenadas: [19.613499144498547, -99.33870179977362],
    ...imagenPanoramica("rectoria"),
    resumen: "Edificio de Gobierno y Rectoría de la universidad.",
    secciones: [{ titulo: "Referencia oficial", items: ["Edificio C"] }],
    panoramas: [panorama("rectoria", "Panorama de Rectoría")]
  },
  {
    id: "la-era",
    nombre: "La Era",
    categoria: "patrimonio",
    coordenadas: [19.613065042754652, -99.33843453247002],
    ...imagenLugar("la-era", "LaEra.jpg"),
    resumen: "Área donde se encuentran servicios de psicología y una zona de apoyo para las mujeres.",
    secciones: [{ titulo: "Servicios", items: ["Área de psicología", "Zona de apoyo para las mujeres"] }],
    panoramas: [panorama("la-era", "Panorama de La Era")]
  },
  {
    id: "edificio-d",
    nombre: "Edificio D",
    nombreOficial: "Aulas Tecnologías de la Información · Diseño Digital",
    alias: ["Tecnologías de la Información", "TI", "Diseño Digital"],
    categoria: "edificio",
    coordenadas: [19.613199385731225, -99.33929682332334],
    ...imagenLugar("edificio-d", "EdificioD.png"),
    resumen: "Aulas de Tecnologías de la Información y Diseño Digital.",
    secciones: [{ titulo: "Áreas oficiales", items: ["Tecnologías de la Información", "Diseño Digital"] }],
    panoramas: [panorama("edificio-d", "Panorama del Edificio D")]
  },
  {
    id: "conexion-d-e",
    nombre: "Conexión entre edificios D y E",
    alias: ["D y E", "Camino D E", "Conexión D E"],
    categoria: "acceso",
    coordenadas: [19.61287043819123, -99.33927574157833],
    ...imagenPanoramica("conexion-d-e"),
    resumen: "Punto de conexión y referencia entre los edificios D y E.",
    secciones: [{ titulo: "Referencia", items: ["Edificio D", "Edificio E"] }],
    panoramas: [panorama("conexion-d-e", "Vista de la conexión entre D y E")]
  },
  {
    id: "edificio-e",
    nombre: "Edificio E · Laboratorio Ing. Alejo Peralta",
    nombreOficial: "Laboratorio “Ing. Alejo Peralta” · Mecatrónica · Mantenimiento Industrial",
    alias: ["Alejo Peralta", "Mecatrónica", "Mantenimiento Industrial"],
    categoria: "laboratorio",
    coordenadas: [19.612658550345884, -99.33923302928696],
    ...imagenLugar("edificio-e", "EdificioE.png"),
    resumen: "Laboratorio Ing. Alejo Peralta para Mecatrónica y Mantenimiento Industrial.",
    secciones: [{ titulo: "Áreas oficiales", items: ["Mecatrónica", "Mantenimiento Industrial"] }],
    panoramas: [panorama("edificio-e", "Panorama del Edificio E")]
  },
  {
    id: "edificio-f",
    nombre: "Edificio F · Laboratorio Pesado",
    nombreOficial: "Laboratorio Pesado de Ciencias de la Sustentabilidad",
    alias: ["Ciencias de la Sustentabilidad", "Laboratorio Pesado"],
    categoria: "laboratorio",
    coordenadas: [19.6115459976567, -99.33884497301763],
    ...imagenLugar("edificio-f", "LaboratorioPesado.jpg"),
    resumen: "Laboratorio Pesado de Ciencias de la Sustentabilidad.",
    secciones: [{ titulo: "Referencia oficial", items: ["Ciencias de la Sustentabilidad"] }],
    panoramas: [panorama("edificio-f", "Panorama del Edificio F")]
  },
  {
    id: "salones-idiomas",
    nombre: "Salones de Idiomas",
    alias: ["Aulas de idiomas", "Salones inglés", "Aulas móviles"],
    categoria: "servicio",
    coordenadas: [19.61252528881136, -99.33759672604035],
    ...imagenPanoramica("salones-idiomas"),
    resumen: "Aulas móviles en las que se imparten clases de inglés.",
    secciones: [{ titulo: "Uso del espacio", items: ["Clases de inglés", "Aulas móviles"] }],
    panoramas: [panorama("salones-idiomas", "Panorama de los Salones de Idiomas")]
  },
  {
    id: "edificio-g",
    nombre: "Edificio G",
    nombreOficial: "Aulas Administración y Contabilidad",
    alias: ["Administración", "Contabilidad"],
    categoria: "edificio",
    coordenadas: [19.612740662393154, -99.34097796305412],
    ...imagenLugar("edificio-g", "EdificioG.jpg"),
    resumen: "Aulas de Administración y Contabilidad.",
    secciones: [{ titulo: "Áreas oficiales", items: ["Administración", "Contabilidad"] }],
    panoramas: [panorama("edificio-g", "Panorama del Edificio G")]
  },
  {
    id: "ccai",
    nombre: "CCAI · Edificio H",
    nombreOficial: "Centro de Cooperación, Academia, Industria (CCAI) · Secretaría de Vinculación",
    alias: ["Edificio H", "Vinculación", "Secretaría de Vinculación", "Centro de Cooperación Academia Industria", "Centro de Investigación"],
    categoria: "servicio",
    coordenadas: [19.612684309465656, -99.3414528112419],
    ...imagenLugar("centro-investigacion", "CentroInvestigacion.jpg"),
    resumen: "Centro de Cooperación, Academia, Industria, también identificado como Centro de Investigación, y sede de la Secretaría de Vinculación.",
    secciones: [{ titulo: "Áreas y servicios", items: ["Secretaría de Vinculación", "Vinculación con empresas", "Laboratorio de Metrología", "Laboratorio de Manufactura"] }],
    panoramas: [panorama("ccai", "Panorama del CCAI")]
  },
  {
    id: "centro-idiomas",
    nombre: "Centro de Idiomas · Edificio I",
    nombreOficial: "Centro de Idiomas",
    alias: ["Edificio I", "Idiomas", "Inglés"],
    categoria: "servicio",
    coordenadas: [19.61291571529895, -99.34203939229064],
    ...imagenLugar("centro-idiomas", "CentroIdiomas.jpg"),
    resumen: "Centro de Idiomas de la universidad.",
    secciones: [{ titulo: "Información", items: ["Horarios y servicios en actualización"] }],
    panoramas: [panorama("centro-idiomas", "Panorama del Centro de Idiomas")]
  },
  {
    id: "biblioteca",
    nombre: "Biblioteca Benito Juárez · Edificio J",
    nombreOficial: "Biblioteca “Benito Juárez” · Servicios Escolares",
    alias: ["Edificio J", "Biblioteca", "Benito Juárez", "Servicios Escolares"],
    categoria: "servicio",
    coordenadas: [19.61214345268012, -99.34310128654207],
    ...imagenPanoramica("biblioteca"),
    resumen: "Biblioteca Benito Juárez y área de Servicios Escolares.",
    secciones: [{ titulo: "Servicios oficiales", items: ["Biblioteca Benito Juárez", "Servicios Escolares"] }],
    panoramas: [panorama("biblioteca", "Panorama de la Biblioteca Benito Juárez")]
  },
  {
    id: "servicios-escolares",
    nombre: "Servicios Escolares",
    nombreOficial: "Departamento de Registro y Control Escolar",
    alias: ["Control Escolar", "Registro Escolar", "Inscripción", "Reinscripción", "Titulación", "Certificados", "Historial académico"],
    categoria: "servicio",
    coordenadas: [19.61230892415873, -99.34305799443136],
    resumen: "Área de atención para los principales trámites y documentos de la trayectoria escolar.",
    secciones: [
      { titulo: "Ubicación", items: ["Detrás de la Biblioteca Benito Juárez · Edificio J"] },
      { titulo: "Trámites principales", items: ["Inscripción y reinscripción", "Historial académico y certificados escolares", "Titulación y orientación sobre asuntos escolares de la carrera"] }
    ]
  },
  {
    id: "cafeteria",
    nombre: "Cafetería",
    categoria: "servicio",
    coordenadas: [19.61259982026864, -99.34032226031468],
    ...imagenLugar("cafeteria", "Cafeteria.jpg"),
    resumen: "Cafetería universitaria. Su disponibilidad y horario están pendientes de confirmación.",
    secciones: [{ titulo: "Estado", items: ["Información operativa en actualización"] }],
    panoramas: [panorama("cafeteria", "Panorama de la Cafetería")]
  },
  {
    id: "edificio-k",
    nombre: "Edificio K",
    nombreOficial: "Aulas Telehática, Ambiental · Sistemas de Manufactura Flexible · Mantenimiento Industrial · Automotriz y Servicio Médico",
    alias: ["Telehática", "Ambiental", "Manufactura Flexible", "Mantenimiento Industrial", "Automotriz", "Servicio Médico"],
    categoria: "edificio",
    coordenadas: [19.612345485457844, -99.34055844750884],
    ...imagenLugar("edificio-k", "EdificioK.jpg"),
    resumen: "Aulas y servicios de las áreas indicadas oficialmente para el Edificio K.",
    secciones: [{ titulo: "Áreas oficiales", items: ["Telehática", "Ambiental", "Sistemas de Manufactura Flexible", "Mantenimiento Industrial", "Automotriz", "Servicio Médico"] }],
    panoramas: [panorama("edificio-k", "Panorama del Edificio K")]
  },
  {
    id: "edificio-l",
    nombre: "Edificio L",
    nombreOficial: "Laboratorio de Tecnología Gráfica · Automotriz",
    alias: ["Tecnología Gráfica", "Automotriz"],
    categoria: "laboratorio",
    coordenadas: [19.611967304478743, -99.33941718477618],
    ...imagenLugar("edificio-l", "EdificioL.jpg"),
    resumen: "Laboratorio de Tecnología Gráfica y Automotriz.",
    secciones: [{ titulo: "Áreas oficiales", items: ["Tecnología Gráfica", "Automotriz"] }],
    panoramas: [panorama("edificio-l", "Panorama del Edificio L")]
  },
  {
    id: "edificio-m",
    nombre: "Edificio M",
    nombreOficial: "Estudio de Radio y TV · Redes Digitales",
    alias: ["Radio", "TV", "Redes Digitales"],
    categoria: "edificio",
    coordenadas: [19.61147603613746, -99.33906416943061],
    ...imagenLugar("edificio-m", "EdificioM.jpg"),
    resumen: "Estudio de Radio y TV y área de Redes Digitales.",
    secciones: [{ titulo: "Áreas oficiales", items: ["Estudio de Radio y TV", "Redes Digitales"] }],
    panoramas: [panorama("edificio-m", "Panorama del Edificio M")]
  },
  {
    id: "gimnasio",
    nombre: "Gimnasio · Edificio N",
    nombreOficial: "Gimnasio · Auditorio “Dragones”",
    alias: ["Edificio N", "Auditorio Dragones", "Gimnasio"],
    categoria: "deporte",
    coordenadas: [19.61192531212748, -99.34346601220417],
    ...imagenLugar("gimnasio", "Gimnasio.jpg"),
    resumen: "Gimnasio y Auditorio Dragones.",
    secciones: [{ titulo: "Espacios oficiales", items: ["Gimnasio", "Auditorio Dragones"] }],
    panoramas: [panorama("gimnasio", "Panorama del área del Gimnasio")]
  },
  {
    id: "canchas",
    nombre: "Canchas deportivas",
    alias: ["Canchas", "Basquetbol", "Deportes"],
    categoria: "deporte",
    coordenadas: [19.61242769379216, -99.34260442163527],
    ...imagenPanoramica("canchas"),
    resumen: "Zona de canchas deportivas del campus.",
    secciones: [{ titulo: "Información", items: ["Uso y horarios en actualización"] }],
    panoramas: [
      panorama("canchas", "Panorama de las Canchas"),
      panorama("crossfit", "Vista cercana a Canchas y Crossfit")
    ]
  },
  {
    id: "edificio-o",
    nombre: "Edificio O",
    nombreOficial: "Aulas Mercadotecnia y Logística",
    alias: ["Mercadotecnia", "Logística"],
    categoria: "edificio",
    coordenadas: [19.611573572691313, -99.34284378630267],
    ...imagenLugar("edificio-o", "EdificioO.jpg"),
    resumen: "Aulas de Mercadotecnia y Logística.",
    secciones: [{ titulo: "Áreas oficiales", items: ["Mercadotecnia", "Logística"] }],
    panoramas: [panorama("edificio-o", "Panorama del Edificio O")]
  },
  {
    id: "edificio-p",
    nombre: "Edificio P",
    nombreOficial: "Aulas Ciencias de la Salud",
    alias: ["Ciencias de la Salud", "Salud"],
    categoria: "edificio",
    coordenadas: [19.609741423421426, -99.34507255218833],
    ...imagenLugar("edificio-p", "EdificioP.jpg"),
    resumen: "Aulas de Ciencias de la Salud.",
    secciones: [{ titulo: "Área oficial", items: ["Ciencias de la Salud"] }],
    panoramas: [panorama("edificio-p", "Panorama del Edificio P")]
  },
  {
    id: "puerta-1",
    nombre: "Puerta 1",
    categoria: "acceso",
    coordenadas: [19.613497987240066, -99.33705293640301],
    ...imagenLugar("puerta-1", "Puerta1.jpg"),
    resumen: "Acceso principal indicado para personal directivo y docente, con estacionamiento cercano.",
    secciones: [{ titulo: "Uso indicado", items: ["Personal directivo", "Personal docente"] }]
  },
  {
    id: "puerta-2",
    nombre: "Puerta 2",
    categoria: "acceso",
    coordenadas: [19.61388716696635, -99.339454727527],
    ...imagenLugar("puerta-2", "Puerta2.jpg"),
    resumen: "Acceso y salida indicados para alumnas y alumnos.",
    secciones: [{ titulo: "Uso indicado", items: ["Alumnado"] }, { titulo: "Referencia cercana", items: ["Rectoría · Edificio C"] }]
  },
  {
    id: "puerta-3",
    nombre: "Puerta 3",
    categoria: "acceso",
    coordenadas: [19.613171955219137, -99.34140875996792],
    ...imagenLugar("puerta-3", "Puerta3.jpg"),
    resumen: "Acceso indicado para alumnas y alumnos.",
    secciones: [{ titulo: "Uso indicado", items: ["Alumnado"] }]
  },
  {
    id: "puerta-4",
    nombre: "Puerta 4",
    categoria: "acceso",
    coordenadas: [19.613333951711006, -99.34217566011411],
    ...imagenLugar("puerta-4", "Puerta4.jpg"),
    resumen: "Acceso principal indicado para estudiantes.",
    secciones: [{ titulo: "Uso indicado", items: ["Alumnado"] }]
  },
  {
    id: "puerta-5",
    nombre: "Puerta 5",
    categoria: "acceso",
    coordenadas: [19.613505302108074, -99.34378693919246],
    ...imagenLugar("puerta-5", "Puerta5.jpg"),
    resumen: "Acceso cercano al área de Ciencias de la Salud.",
    secciones: [{ titulo: "Referencia", items: ["Edificio P"] }]
  },
  {
    id: "exhacienda",
    nombre: "Ex-Hacienda",
    categoria: "patrimonio",
    coordenadas: [19.61297453785049, -99.3370500652114],
    ...imagenLugar("exhacienda", "ExHacienda.jpg"),
    resumen: "Zona donde se conservan restos de la hacienda vinculada con el origen del campus universitario.",
    secciones: [{ titulo: "Referencia", items: ["Casco de la Ex-Hacienda", "Zona de La Era"] }],
    panoramas: [
      panorama("exhacienda", "Panorama de la Ex-Hacienda"),
      panorama("hacienda", "Otra vista de la Hacienda")
    ]
  },
  {
    id: "velaria",
    nombre: "La Velaria",
    alias: ["Velaria", "Carpa", "Eventos"],
    categoria: "servicio",
    coordenadas: [19.61302117896143, -99.33787918059147],
    imagen: null,
    imagenMiniatura: null,
    imagenOriginal: null,
    resumen: "Carpa en la que se organizan pláticas y eventos de la comunidad universitaria.",
    secciones: [{ titulo: "Uso del espacio", items: ["Pláticas", "Eventos universitarios"] }]
  }
];

const avisoSinCredencial = {
  tipo: "warning",
  texto: "Si no cuentas con credencial escolar, descarga tu voucher (comprobante) de pago y preséntalo junto con tu credencial de elector u otra identificación oficial con fotografía.",
  enlace: { texto: "Ir al portal de pagos", href: "https://pagosytramites.edomex.gob.mx/recaudacion/" }
};

lugares.forEach((lugar) => {
  const carreras = obtenerProgramasPorEdificio(lugar.id);
  if (carreras.length) {
    lugar.secciones = [...(lugar.secciones ?? []), {
      titulo: "Carreras con edificio principal",
      items: carreras.map((carrera) => carrera.nombre)
    }];
  }
  if (lugar.id.startsWith("puerta-")) lugar.avisos = [avisoSinCredencial];
});

export const panoramasPendientes = [];

export function normalizarTexto(valor = "") {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function obtenerLugarPorId(id) {
  return lugares.find((lugar) => lugar.id === id) ?? null;
}

export function buscarLugares(consulta, limite = 8) {
  const texto = normalizarTexto(consulta);
  if (!texto) return [];

  return lugares
    .map((lugar) => {
      const nombre = normalizarTexto(lugar.nombre);
      const contenido = normalizarTexto([
        lugar.nombre,
        lugar.nombreOficial,
        ...(lugar.alias ?? []),
        lugar.resumen,
        categorias[lugar.categoria]?.etiqueta,
        ...(lugar.secciones ?? []).flatMap((seccion) => [seccion.titulo, ...seccion.items])
      ].filter(Boolean).join(" "));
      const puntuacion = nombre === texto ? 0 : nombre.startsWith(texto) ? 1 : nombre.includes(texto) ? 2 : contenido.includes(texto) ? 3 : 99;
      return { lugar, puntuacion };
    })
    .filter(({ puntuacion }) => puntuacion < 99)
    .sort((a, b) => a.puntuacion - b.puntuacion || a.lugar.nombre.localeCompare(b.lugar.nombre, "es"))
    .slice(0, limite)
    .map(({ lugar }) => lugar);
}
