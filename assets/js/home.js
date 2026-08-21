import { cerrarSesion, detectarUsuarioActivo, traducirErrorAutenticacion } from "./auth.js";
import { desvincularDispositivoActual } from "./notifications.js";

const invitado = document.querySelector("[data-guest-actions]");
const sesion = document.querySelector("[data-session-card]");
const nombre = document.querySelector("[data-session-name]");
const correo = document.querySelector("[data-session-email]");
const cerrar = document.querySelector("[data-sign-out]");

detectarUsuarioActivo((usuario) => {
  invitado.hidden = Boolean(usuario);
  sesion.hidden = !usuario;
  if (usuario) {
    nombre.textContent = usuario.user_metadata?.nombre || usuario.user_metadata?.full_name || usuario.user_metadata?.name || "Estudiante";
    correo.textContent = usuario.email || "Cuenta activa";
  }
});

cerrar?.addEventListener("click", async () => {
  cerrar.disabled = true;
  try {
    await desvincularDispositivoActual();
    await cerrarSesion();
  } catch (error) {
    const estado = document.querySelector("[data-session-status]");
    estado.textContent = traducirErrorAutenticacion(error);
    estado.hidden = false;
  } finally {
    cerrar.disabled = false;
  }
});
