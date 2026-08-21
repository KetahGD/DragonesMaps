let visor = null;
let promesaBiblioteca = null;
let focoAnterior = null;
let solicitudActual = 0;

function cargarBiblioteca() {
  if (window.pannellum) return Promise.resolve(window.pannellum);
  if (promesaBiblioteca) return promesaBiblioteca;

  promesaBiblioteca = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-pannellum]')) {
      const estilos = document.createElement("link");
      estilos.rel = "stylesheet";
      estilos.href = "vendor/pannellum/pannellum.css";
      estilos.dataset.pannellum = "";
      document.head.append(estilos);
    }

    const script = document.createElement("script");
    script.src = "vendor/pannellum/pannellum.js";
    script.dataset.pannellum = "";
    script.onload = () => resolve(window.pannellum);
    script.onerror = () => reject(new Error("No fue posible cargar el visor panorámico."));
    document.head.append(script);
  });

  return promesaBiblioteca;
}

function dimensionesImagen(src) {
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => resolve({ ancho: imagen.naturalWidth, alto: imagen.naturalHeight });
    imagen.onerror = () => reject(new Error("No fue posible cargar la imagen panorámica."));
    imagen.src = src;
  });
}

export function configurarVisorPanoramico() {
  const modal = document.querySelector("[data-panorama-modal]");
  const titulo = modal?.querySelector("[data-panorama-title]");
  const contenedor = modal?.querySelector("[data-panorama-viewer]");
  const estado = modal?.querySelector("[data-panorama-status]");
  const cerrarBotones = modal ? [...modal.querySelectorAll("[data-panorama-close]")] : [];
  if (!modal || !titulo || !contenedor || !estado) return { abrir: () => {} };

  const cerrar = () => {
    solicitudActual += 1;
    if (visor?.destroy) visor.destroy();
    visor = null;
    contenedor.replaceChildren();
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    focoAnterior?.focus();
    focoAnterior = null;
  };

  const abrir = async (panorama) => {
    const solicitud = ++solicitudActual;
    focoAnterior = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    titulo.textContent = panorama.titulo;
    estado.hidden = false;
    estado.textContent = "Cargando panorama…";
    contenedor.replaceChildren();
    window.requestAnimationFrame(() => modal.querySelector(".panorama-modal__content [data-panorama-close]")?.focus());

    try {
      const [, dimensiones] = await Promise.all([cargarBiblioteca(), dimensionesImagen(panorama.src)]);
      if (solicitud !== solicitudActual) return;
      const vaov = Math.max(30, Math.min(180, (360 * dimensiones.alto) / dimensiones.ancho));
      estado.hidden = true;
      const proporcionVisor = Math.max(0.3, contenedor.clientWidth / contenedor.clientHeight);
      const vfovSeguro = vaov * 0.72;
      const hfovSeguro = Math.max(28, Math.min(110,
        2 * Math.atan(Math.tan((vfovSeguro * Math.PI) / 360) * proporcionVisor) * (180 / Math.PI)
      ));
      const zoomMinimoSeguro = Math.min(hfovSeguro, Math.max(46, hfovSeguro * 0.58));
      visor = window.pannellum.viewer(contenedor, {
        type: "equirectangular",
        panorama: panorama.src,
        title: panorama.titulo,
        autoLoad: true,
        haov: 360,
        vaov,
        vOffset: 0,
        hfov: hfovSeguro,
        minHfov: zoomMinimoSeguro,
        maxHfov: hfovSeguro,
        minPitch: 0,
        maxPitch: 0,
        showFullscreenCtrl: true,
        showZoomCtrl: true,
        keyboardZoom: true,
        mouseZoom: true,
        compass: false
      });
    } catch (error) {
      estado.hidden = false;
      estado.textContent = error.message;
    }
  };

  cerrarBotones.forEach((boton) => boton.addEventListener("click", cerrar));
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !modal.hidden) cerrar();
  });

  return { abrir, cerrar };
}
