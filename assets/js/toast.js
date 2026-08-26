export function mostrarToast(mensaje, tipo = "info") {
  let contenedor = document.querySelector("[data-toast-container]");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.className = "toast-container";
    contenedor.dataset.toastContainer = "";
    contenedor.setAttribute("aria-live", "polite");
    document.body.append(contenedor);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${tipo}`;
  toast.textContent = mensaje;
  contenedor.append(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 220);
  }, 4200);
}
