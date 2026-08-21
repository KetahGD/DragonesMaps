import { CAMPUS_BUILDINGS, CAREERS, careerById } from "../data/careers.js";
import { cerrarSesion, iniciarSesionConGoogle } from "./auth.js";
import { supabase } from "./supabase.js";

const BUCKET = "profile-avatars";
const state = { user: null, profile: null };
const loading = document.querySelector("[data-profile-loading]");
const gate = document.querySelector("[data-profile-gate]");
const app = document.querySelector("[data-profile-app]");
const form = document.querySelector("[data-profile-form]");
const levelSelect = document.querySelector("[data-profile-level]");
const careerSelect = document.querySelector("[data-profile-career]");
const buildingSelect = document.querySelector("[data-profile-building]");
const image = document.querySelector("[data-profile-image]");
const initials = document.querySelector("[data-profile-initials]");
const removePhoto = document.querySelector("[data-avatar-remove]");
const savedBadge = document.querySelector("[data-profile-saved]");

function showStatus(message, type = "error", target = document.querySelector("[data-profile-status]")) {
  target.textContent = message;
  target.dataset.type = type;
  target.hidden = false;
}

function displayName(user) {
  return user?.user_metadata?.nombre || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Estudiante";
}

function getInitials(value) {
  return String(value || "DM").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function safeExternalImage(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
}

function googlePhoto() {
  return safeExternalImage(state.user?.user_metadata?.avatar_url || state.user?.user_metadata?.picture);
}

function fillCareers(level, selected = "") {
  careerSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = level ? "Selecciona tu carrera" : "Selecciona primero el nivel";
  careerSelect.append(placeholder);
  CAREERS.filter((career) => career.level === level).forEach((career) => {
    const option = document.createElement("option");
    option.value = career.id;
    option.textContent = career.name;
    careerSelect.append(option);
  });
  careerSelect.disabled = !level;
  careerSelect.value = selected;
}

function fillBuildings() {
  CAMPUS_BUILDINGS.forEach((building) => {
    const option = document.createElement("option");
    option.value = building.id;
    option.textContent = building.name;
    buildingSelect.append(option);
  });
}

async function profilePhotoUrl() {
  if (!state.profile?.avatar_path) return googlePhoto();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(state.profile.avatar_path, 3600);
  if (error) return googlePhoto();
  return `${data.signedUrl}&v=${Date.now()}`;
}

async function renderAvatar() {
  const name = state.profile?.nombre || displayName(state.user);
  initials.textContent = getInitials(name);
  const url = await profilePhotoUrl();
  if (url) {
    image.src = url;
    image.hidden = false;
    initials.hidden = true;
  } else {
    image.removeAttribute("src");
    image.hidden = true;
    initials.hidden = false;
  }
  removePhoto.hidden = !state.profile?.avatar_path;
}

function renderProfile() {
  const profile = state.profile;
  const career = careerById(profile.career_id);
  const level = profile.nivel || career?.level || "";
  const name = profile.nombre || displayName(state.user);
  document.querySelector("[data-profile-display-name]").textContent = name;
  document.querySelector("[data-profile-email]").textContent = state.user.email || profile.correo;
  document.querySelector("[data-profile-provider]").textContent = state.user.app_metadata?.provider === "google" ? "Cuenta conectada con Google" : "Cuenta de Dragones Maps";
  form.elements.nombre.value = name;
  form.elements.universidad.value = profile.universidad || "Universidad Tecnológica Fidel Velázquez";
  levelSelect.value = level;
  fillCareers(level, profile.career_id || "");
  form.elements.cuatrimestre.value = profile.cuatrimestre || "";
  form.elements.edificio.value = profile.edificio || "";
  renderAvatar();
}

async function loadProfile() {
  const { data, error } = await supabase.from("profiles")
    .select("id,nombre,correo,avatar_path,universidad,nivel,career_id,cuatrimestre,edificio")
    .eq("id", state.user.id)
    .single();
  if (error) throw error;
  state.profile = data;
  renderProfile();
}

async function setSession(user) {
  state.user = user;
  loading.hidden = true;
  if (!user) {
    gate.hidden = false;
    app.hidden = true;
    return;
  }
  gate.hidden = true;
  app.hidden = false;
  try { await loadProfile(); }
  catch (error) { showStatus(error.message || "No fue posible cargar tu perfil."); }
}

levelSelect.addEventListener("change", () => {
  fillCareers(levelSelect.value);
  savedBadge.textContent = "Cambios sin guardar";
  savedBadge.classList.remove("is-saved");
});

form.addEventListener("input", () => {
  savedBadge.textContent = "Cambios sin guardar";
  savedBadge.classList.remove("is-saved");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = document.querySelector("[data-profile-status]");
  status.hidden = true;
  if (!form.checkValidity()) return form.reportValidity();
  const data = new FormData(form);
  const careerId = String(data.get("career_id") || "");
  if (careerId && careerById(careerId)?.level !== data.get("nivel")) {
    return showStatus("Selecciona una carrera correspondiente al nivel académico.");
  }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Guardando…";
  try {
    const payload = {
      nombre: String(data.get("nombre") || "").trim(),
      universidad: String(data.get("universidad") || "").trim(),
      nivel: data.get("nivel") || null,
      career_id: careerId || null,
      cuatrimestre: data.get("cuatrimestre") ? Number(data.get("cuatrimestre")) : null,
      edificio: data.get("edificio") || null
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", state.user.id);
    if (error) throw error;
    Object.assign(state.profile, payload);
    document.querySelector("[data-profile-display-name]").textContent = payload.nombre;
    initials.textContent = getInitials(payload.nombre);
    savedBadge.textContent = "Perfil guardado";
    savedBadge.classList.add("is-saved");
    showStatus("Tus cambios se guardaron correctamente.", "success");
  } catch (error) { showStatus(error.message || "No fue posible guardar el perfil."); }
  finally { button.disabled = false; button.textContent = "Guardar cambios"; }
});

document.querySelector("[data-avatar-trigger]").addEventListener("click", () => document.querySelector("[data-avatar-file]").click());
document.querySelector("[data-avatar-file]").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return showStatus("Selecciona una imagen JPG, PNG o WebP.");
  if (file.size > 3 * 1024 * 1024) return showStatus("La fotografía no debe superar 3 MB.");
  const trigger = document.querySelector("[data-avatar-trigger]");
  trigger.disabled = true;
  trigger.textContent = "Subiendo…";
  const path = `${state.user.id}/avatar`;
  try {
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
    if (uploadError) throw uploadError;
    const { error: profileError } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", state.user.id);
    if (profileError) throw profileError;
    state.profile.avatar_path = path;
    await renderAvatar();
    showStatus("Fotografía actualizada.", "success");
  } catch (error) { showStatus(error.message || "No fue posible subir la fotografía."); }
  finally { trigger.disabled = false; trigger.textContent = "Cambiar fotografía"; }
});

removePhoto.addEventListener("click", async () => {
  removePhoto.disabled = true;
  try {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([state.profile.avatar_path]);
    if (storageError) throw storageError;
    const { error: profileError } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", state.user.id);
    if (profileError) throw profileError;
    state.profile.avatar_path = null;
    await renderAvatar();
    showStatus(googlePhoto() ? "Se restauró la fotografía de Google." : "Fotografía eliminada.", "success");
  } catch (error) { showStatus(error.message || "No fue posible quitar la fotografía."); }
  finally { removePhoto.disabled = false; }
});

image.addEventListener("error", () => {
  image.hidden = true;
  initials.hidden = false;
});

document.querySelector("[data-profile-google]").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const status = document.querySelector("[data-gate-status]");
  button.disabled = true;
  button.querySelector("span").textContent = "Conectando…";
  try { await iniciarSesionConGoogle("perfil.html"); }
  catch (error) {
    showStatus(error.message || "No fue posible iniciar sesión con Google.", "error", status);
    button.disabled = false;
    button.querySelector("span").textContent = "Continuar con Google";
  }
});

document.querySelector("[data-profile-signout]").addEventListener("click", async (event) => {
  event.currentTarget.disabled = true;
  try { await cerrarSesion(); window.location.reload(); }
  catch (error) { showStatus(error.message || "No fue posible cerrar la sesión."); event.currentTarget.disabled = false; }
});

fillBuildings();
const { data: sessionData } = await supabase.auth.getSession();
await setSession(sessionData.session?.user ?? null);
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") setSession(null);
  if (event === "SIGNED_IN" && session?.user?.id !== state.user?.id) setSession(session.user);
});
