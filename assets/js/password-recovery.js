import { actualizarPassword, traducirErrorAutenticacion } from "./auth.js";
import { supabase } from "./supabase.js";

const formulario = document.querySelector("[data-password-recovery-form]");
const estado = document.querySelector("[data-password-recovery-status]");
const boton = formulario?.querySelector('button[type="submit"]');

let enlaceValido = false;

function mostrarEstado(mensaje, tipo = "error") {
  estado.textContent = mensaje;
  estado.dataset.type = tipo;
  estado.hidden = false;
}

function habilitarFormulario() {
  enlaceValido = true;
  formulario.hidden = false;
  mostrarEstado("Enlace verificado. Escribe tu nueva contraseña.", "success");
  formulario.querySelector('[name="password"]').focus();
}

const { data: listener } = supabase.auth.onAuthStateChange((evento, sesion) => {
  if (evento === "PASSWORD_RECOVERY" || (sesion && window.location.hash.includes("type=recovery"))) {
    habilitarFormulario();
  }
});

const { data: sesionInicial } = await supabase.auth.getSession();
if (!enlaceValido && sesionInicial.session && window.location.hash.includes("type=recovery")) {
  habilitarFormulario();
}

window.setTimeout(() => {
  if (!enlaceValido) {
    mostrarEstado("El enlace no es válido o ya expiró. Solicita uno nuevo desde la pantalla de inicio de sesión.");
  }
}, 2500);

formulario?.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!enlaceValido || !formulario.checkValidity()) {
    formulario.reportValidity();
    return;
  }

  boton.disabled = true;
  boton.querySelector("span").textContent = "Guardando…";
  const datos = new FormData(formulario);
  try {
    await actualizarPassword(
      String(datos.get("password") ?? ""),
      String(datos.get("confirmar") ?? "")
    );
    await supabase.auth.signOut({ scope: "local" });
    formulario.hidden = true;
    mostrarEstado("Contraseña actualizada. Ya puedes iniciar sesión.", "success");
    document.querySelector("[data-login-link]").hidden = false;
  } catch (error) {
    mostrarEstado(traducirErrorAutenticacion(error));
    boton.disabled = false;
    boton.querySelector("span").textContent = "Guardar contraseña";
  }
});

window.addEventListener("pagehide", () => listener.subscription.unsubscribe(), { once: true });
