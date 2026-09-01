const normalizar = (valor = "") => valor
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

export const sitiosOficiales = [
  { nombre: "División Académica de Informática", alias: ["Informática", "Software", "Tecnologías de la Información", "TI"], href: "https://sites.google.com/utfv.edu.mx/divisionacademicainformatica" },
  { nombre: "Micrositios de la UTFV", alias: ["Divisiones académicas", "Micrositios", "Sitios oficiales"], href: "https://sites.google.com/utfv.edu.mx/micrositios" },
  { nombre: "División Académica de Ciencias de la Salud", alias: ["Salud", "Enfermería", "Terapia Física"], href: "https://sites.google.com/utfv.edu.mx/utfv-salud?pli=1&authuser=1" },
  { nombre: "Administración y Logística", alias: ["Administración", "Logística", "Mercadotecnia", "Transporte", "Cadena de Suministro"], href: "https://sites.google.com/utfv.edu.mx/admilog?pli=1&authuser=1" },
  { nombre: "División Académica de Procesos de Producción", alias: ["Procesos de Producción", "Automotriz", "Tecnología Gráfica", "Sistemas Productivos"], href: "https://sites.google.com/utfv.edu.mx/d-a-procesos-de-produccin/inicio" },
  { nombre: "División Académica de Contabilidad Corporativa", alias: ["Contabilidad", "Contaduría"], href: "https://sites.google.com/utfv.edu.mx/utfv-contabilidadcorporativa?pli=1&authuser=1" },
  { nombre: "División Académica de Ciencias de la Sustentabilidad", alias: ["Sustentabilidad", "Ambiental", "Biotecnología", "Nanotecnología"], href: "https://sites.google.com/utfv.edu.mx/dacs/?pli=1&authuser=1" },
  { nombre: "Contabilidad Corporativa · Nuevo ingreso", alias: ["Nuevo ingreso Contabilidad", "Nuevo ingreso Contaduría"], href: "https://sites.google.com/utfv.edu.mx/utfv-contabilidadcorporativa/nuevo-ingreso?authuser=1" }
];

export function buscarSitiosOficiales(consulta, limite = 5) {
  const texto = normalizar(consulta);
  if (!texto) return [];
  return sitiosOficiales
    .map((sitio) => {
      const nombre = normalizar(sitio.nombre);
      const contenido = normalizar([sitio.nombre, ...sitio.alias].join(" "));
      const puntuacion = nombre === texto ? 0 : nombre.startsWith(texto) ? 1 : contenido.includes(texto) ? 2 : 99;
      return { sitio, puntuacion };
    })
    .filter(({ puntuacion }) => puntuacion < 99)
    .sort((a, b) => a.puntuacion - b.puntuacion || a.sitio.nombre.localeCompare(b.sitio.nombre, "es"))
    .slice(0, limite)
    .map(({ sitio }) => sitio);
}
