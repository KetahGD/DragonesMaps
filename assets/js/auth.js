import { supabase } from "./supabase.js";

function urlLocal(archivo) {
  return new URL(archivo, window.location.href).href;
}

export async function registrarUsuario(nombre, correo, password, confirmar) {
  if (!nombre || !correo || !password || !confirmar) throw new Error("Completa todos los campos.");
  if (password !== confirmar) throw new Error("Las contraseñas no coinciden.");
  if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");

  const { data, error } = await supabase.auth.signUp({
    email: correo,
    password,
    options: {
      data: { nombre },
      emailRedirectTo: urlLocal("Inicio.html")
    }
  });
  if (error) throw error;
  if (!data.user) throw new Error("No fue posible crear la cuenta.");

  return {
    usuario: data.user,
    requiereConfirmacion: !data.session
  };
}

export async function iniciarSesion(correo, password) {
  if (!correo || !password) throw new Error("Escribe tu correo y contraseña.");
  const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password });
  if (error) throw error;
  return data.user;
}

export async function iniciarSesionConGoogle(destino = "Inicio.html") {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: urlLocal(destino),
      queryParams: {
        access_type: "offline",
        prompt: "select_account"
      }
    }
  });
  if (error) throw error;
  return data;
}

export async function recuperarPassword(correo) {
  if (!correo) throw new Error("Escribe el correo de tu cuenta.");
  const { error } = await supabase.auth.resetPasswordForEmail(correo, {
    redirectTo: urlLocal("RestablecerPassword.html")
  });
  if (error) throw error;
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
}

export function detectarUsuarioActivo(callback) {
  const { data } = supabase.auth.onAuthStateChange((evento, sesion) => {
    callback(sesion?.user ?? null, evento);
  });
  return () => data.subscription.unsubscribe();
}

export async function actualizarPassword(password, confirmar) {
  if (!password || !confirmar) throw new Error("Completa los dos campos de contraseña.");
  if (password !== confirmar) throw new Error("Las contraseñas no coinciden.");
  if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data.user;
}

export function traducirErrorAutenticacion(error) {
  if (!error?.code) return error?.message || "Ocurrió un error inesperado.";
  const mensajes = {
    email_exists: "Este correo ya tiene una cuenta.",
    user_already_exists: "Este correo ya tiene una cuenta.",
    email_address_invalid: "El correo no tiene un formato válido.",
    invalid_credentials: "El correo o la contraseña son incorrectos.",
    email_not_confirmed: "Confirma tu correo antes de iniciar sesión.",
    weak_password: "La contraseña debe tener al menos 6 caracteres.",
    over_email_send_rate_limit: "Espera un momento antes de solicitar otro correo.",
    over_request_rate_limit: "Se realizaron demasiados intentos. Espera un momento y vuelve a intentarlo.",
    signup_disabled: "El registro de cuentas no está habilitado.",
    user_banned: "Esta cuenta está deshabilitada.",
    same_password: "La nueva contraseña debe ser diferente a la anterior."
  };
  return mensajes[error.code] ?? error.message ?? "No fue posible completar la operación. Inténtalo nuevamente.";
}
