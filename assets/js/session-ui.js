import { supabase } from "./supabase.js";

const BUCKET = "profile-avatars";

function displayName(user, profile) {
  return profile?.nombre || user?.user_metadata?.nombre || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Estudiante";
}

function initials(value) {
  return String(value || "DM").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function safePhoto(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
}

async function sessionAppearance(user) {
  let profile = null;
  try {
    const { data } = await supabase.from("profiles").select("nombre,avatar_path").eq("id", user.id).maybeSingle();
    profile = data;
  } catch { /* El avatar de Google o las iniciales siguen disponibles. */ }

  let photo = safePhoto(user.user_metadata?.avatar_url || user.user_metadata?.picture);
  if (profile?.avatar_path) {
    try {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(profile.avatar_path, 3600);
      if (data?.signedUrl) photo = data.signedUrl;
    } catch { /* Conserva el avatar alternativo. */ }
  }
  const name = displayName(user, profile);
  return { name, photo, initials: initials(name) };
}

function guestIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>';
}

function renderButton(button, user, appearance) {
  button.classList.add("session-profile-button");
  button.classList.toggle("has-session", Boolean(user));
  button.href = "perfil.html";
  if (!user) {
    button.innerHTML = guestIcon();
    button.setAttribute("aria-label", "Iniciar sesión o abrir mi perfil");
    button.title = "Mi perfil";
    return;
  }

  button.replaceChildren();
  const fallback = document.createElement("span");
  fallback.className = "session-profile-button__initials";
  fallback.textContent = appearance.initials;
  button.append(fallback);
  if (appearance.photo) {
    const image = document.createElement("img");
    image.src = appearance.photo;
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => image.remove());
    button.append(image);
  }
  button.setAttribute("aria-label", `Perfil de ${appearance.name}. Sesión iniciada`);
  button.title = appearance.name;
}

async function updateAll(user) {
  const buttons = document.querySelectorAll("[data-session-profile], .profile-button, .academic-profile, .organizer-profile");
  if (!buttons.length) return;
  const appearance = user ? await sessionAppearance(user) : null;
  buttons.forEach((button) => renderButton(button, user, appearance));
  document.documentElement.classList.toggle("has-session", Boolean(user));
}

export async function configurarInterfazSesion() {
  const { data } = await supabase.auth.getSession();
  await updateAll(data.session?.user ?? null);
  supabase.auth.onAuthStateChange((event, session) => {
    if (["INITIAL_SESSION", "SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) {
      updateAll(session?.user ?? null);
    }
  });
}
