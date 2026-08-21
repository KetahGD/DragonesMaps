import { iniciarSesion, iniciarSesionConGoogle, recuperarPassword, registrarUsuario, traducirErrorAutenticacion } from "./auth.js";

const formulario = document.querySelector("[data-auth-form]");
const estado = document.querySelector("[data-auth-status]");
const botonPrincipal = formulario?.querySelector('button[type="submit"]');

function mostrarEstado(mensaje, tipo = "error") {
  if (!estado) return;
  estado.textContent = mensaje;
  estado.dataset.type = tipo;
  estado.hidden = false;
}

function cambiarCarga(cargando) {
  if (!botonPrincipal) return;
  botonPrincipal.disabled = cargando;
  botonPrincipal.dataset.loading = String(cargando);
  botonPrincipal.querySelector("span").textContent = cargando ? "Procesando…" : botonPrincipal.dataset.label;
}

function obtenerDestinoSeguro() {
  const continuar = new URLSearchParams(window.location.search).get("continuar");
  if (!continuar) return "index.html";
  const destino = continuar.replace(/^\.\//, "");
  return /^(?:index|Inicio|calendario|directorio|organizador)\.html(?:[?#].*)?$/.test(destino)
    ? destino
    : "index.html";
}

if (formulario) {
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    estado.hidden = true;
    if (!formulario.checkValidity()) {
      formulario.reportValidity();
      return;
    }
    cambiarCarga(true);
    const datos = new FormData(formulario);

    try {
      if (formulario.dataset.authForm === "register") {
        const resultado = await registrarUsuario(
          String(datos.get("nombre") ?? "").trim(),
          String(datos.get("correo") ?? "").trim(),
          String(datos.get("password") ?? ""),
          String(datos.get("confirmar") ?? "")
        );
        if (resultado.requiereConfirmacion) {
          formulario.querySelector('[name="password"]').value = "";
          formulario.querySelector('[name="confirmar"]').value = "";
          mostrarEstado("Cuenta creada. Revisa tu correo y confirma el registro antes de iniciar sesión.", "success");
          cambiarCarga(false);
          return;
        }
      } else {
        await iniciarSesion(
          String(datos.get("correo") ?? "").trim(),
          String(datos.get("password") ?? "")
        );
      }
      const destino = obtenerDestinoSeguro();
      mostrarEstado(destino.startsWith("organizador.html")
        ? "Acceso correcto. Abriendo tu organizador…"
        : destino.startsWith("Inicio.html")
          ? "Acceso correcto. Abriendo tus preferencias…"
          : "Acceso correcto. Abriendo el mapa…", "success");
      window.setTimeout(() => { window.location.href = destino; }, 600);
    } catch (error) {
      mostrarEstado(traducirErrorAutenticacion(error));
      cambiarCarga(false);
    }
  });
}

const recuperar = document.querySelector("[data-reset-password]");
recuperar?.addEventListener("click", async () => {
  const correo = formulario?.querySelector('[name="correo"]')?.value.trim();
  recuperar.disabled = true;
  try {
    await recuperarPassword(correo);
    mostrarEstado("Enviamos un enlace para restablecer tu contraseña.", "success");
  } catch (error) {
    mostrarEstado(traducirErrorAutenticacion(error));
  } finally {
    recuperar.disabled = false;
  }
});

const botonGoogle = document.querySelector("[data-google-signin]");
botonGoogle?.addEventListener("click", async () => {
  estado.hidden = true;
  botonGoogle.disabled = true;
  botonGoogle.querySelector("span").textContent = "Conectando con Google…";
  try {
    await iniciarSesionConGoogle(obtenerDestinoSeguro());
  } catch (error) {
    mostrarEstado(traducirErrorAutenticacion(error));
    botonGoogle.disabled = false;
    botonGoogle.querySelector("span").textContent = "Continuar con Google";
  }
});
