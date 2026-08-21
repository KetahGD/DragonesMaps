import { CAREERS, LEVEL_LABELS, careerById } from "../data/careers.js";
import { iniciarSesionConGoogle } from "./auth.js";
import { supabase } from "./supabase.js";

const ADMIN_EMAIL = "rolandosilvavique@gmail.com";
const state = { user: null, entries: [], tab: "approved", isAdmin: false };
const loading = document.querySelector("[data-directory-loading]");
const gate = document.querySelector("[data-directory-gate]");
const app = document.querySelector("[data-directory-app]");
const dialog = document.querySelector("[data-submission-dialog]");
const form = document.querySelector("[data-submission-form]");
const toast = document.querySelector("[data-directory-toast]");
let toastTimer;

function normalize(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function showToast(message, type = "success") {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.dataset.type = type;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4300);
}

function showStatus(message, type = "error", target = document.querySelector("[data-submission-status]")) {
  target.textContent = message;
  target.dataset.type = type;
  target.hidden = false;
}

function initials(value) {
  return String(value).trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function text(tag, value, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function careerLabel(id) {
  const career = careerById(id);
  return career ? `${LEVEL_LABELS[career.level]} · ${career.name}` : "Carrera en actualización";
}

function fillCareerSelect(select, { includeAll = false } = {}) {
  if (includeAll) {
    const current = select.querySelector("option");
    select.replaceChildren(current);
  }
  Object.entries(LEVEL_LABELS).forEach(([level, label]) => {
    const group = document.createElement("optgroup");
    group.label = label;
    CAREERS.filter((career) => career.level === level).forEach((career) => {
      const option = document.createElement("option");
      option.value = career.id;
      option.textContent = career.name;
      group.append(option);
    });
    select.append(group);
  });
}

function mailLink(email) {
  const link = document.createElement("a");
  link.className = "academic-card__email";
  link.href = `mailto:${email}`;
  link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>';
  link.append(text("span", email));
  return link;
}

function contactCard(entry, mode = "approved") {
  const card = document.createElement("article");
  card.className = "academic-card";
  const heading = document.createElement("div");
  heading.className = "academic-card__heading";
  const avatar = text("span", initials(entry.nombre), "academic-card__avatar");
  const details = document.createElement("div");
  details.append(text("h3", entry.nombre), text("span", careerLabel(entry.career_id), "academic-card__career"));
  heading.append(avatar, details);
  card.append(heading, mailLink(entry.correo_institucional));

  if (mode !== "approved") {
    const statusLabels = { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado" };
    const status = text("span", statusLabels[entry.estado], "academic-card__status");
    status.dataset.state = entry.estado;
    card.append(status, text("small", `Enviado ${new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(entry.creado_en))}`, "academic-card__meta"));
  }

  if (mode === "admin") {
    const actions = document.createElement("div");
    actions.className = "academic-review-actions";
    const approve = text("button", "Aprobar", "academic-approve");
    approve.type = "button";
    approve.dataset.review = "approved";
    approve.dataset.id = entry.id;
    const reject = text("button", "Rechazar", "academic-reject");
    reject.type = "button";
    reject.dataset.review = "rejected";
    reject.dataset.id = entry.id;
    actions.append(approve, reject);
    card.append(actions);
  }
  return card;
}

function emptyState(title, detail) {
  const empty = document.createElement("div");
  empty.className = "academic-empty";
  empty.append(text("strong", title), text("span", detail));
  return empty;
}

function renderApproved() {
  const list = document.querySelector("[data-approved-list]");
  const term = normalize(document.querySelector("[data-directory-search]").value);
  const career = document.querySelector("[data-directory-filter]").value;
  const entries = state.entries.filter((entry) => entry.estado === "approved")
    .filter((entry) => !career || entry.career_id === career)
    .filter((entry) => !term || normalize(`${entry.nombre} ${entry.correo_institucional} ${careerLabel(entry.career_id)}`).includes(term));
  list.replaceChildren();
  if (!entries.length) return list.append(emptyState("No hay contactos para mostrar", term || career ? "Prueba con otra búsqueda o carrera." : "El directorio crecerá conforme se aprueben propuestas."));
  entries.forEach((entry) => list.append(contactCard(entry)));
}

function renderMine() {
  const list = document.querySelector("[data-mine-list]");
  const entries = state.entries.filter((entry) => entry.enviado_por === state.user.id).sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
  document.querySelector("[data-mine-count]").textContent = String(entries.length);
  list.replaceChildren();
  if (!entries.length) return list.append(emptyState("Aún no has enviado propuestas", "Puedes proponer un contacto usando el botón superior."));
  entries.forEach((entry) => list.append(contactCard(entry, "mine")));
}

function renderAdmin() {
  if (!state.isAdmin) return;
  const list = document.querySelector("[data-admin-list]");
  const entries = state.entries.filter((entry) => entry.estado === "pending").sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en));
  document.querySelector("[data-pending-count]").textContent = String(entries.length);
  list.replaceChildren();
  if (!entries.length) return list.append(emptyState("No hay propuestas pendientes", "Todos los contactos recibidos ya fueron revisados."));
  entries.forEach((entry) => list.append(contactCard(entry, "admin")));
}

function renderAll() {
  renderApproved();
  renderMine();
  renderAdmin();
}

function switchTab(tab) {
  if (tab === "admin" && !state.isAdmin) return;
  state.tab = tab;
  document.querySelectorAll("[data-directory-tab]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.directoryTab === tab)));
  document.querySelectorAll("[data-directory-panel]").forEach((panel) => { panel.hidden = panel.dataset.directoryPanel !== tab; });
}

async function loadEntries() {
  const { data, error } = await supabase.from("academic_directory_entries")
    .select("id,nombre,career_id,correo_institucional,enviado_por,estado,revisado_por,revisado_en,creado_en")
    .order("nombre");
  if (error) throw error;
  state.entries = data ?? [];
  renderAll();
}

function openSubmission() {
  form.reset();
  form.querySelector("[data-submission-status]").hidden = true;
  dialog.showModal();
  window.setTimeout(() => form.elements.nombre.focus(), 30);
}

document.querySelectorAll("[data-directory-tab]").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.directoryTab)));
document.querySelector("[data-directory-search]").addEventListener("input", renderApproved);
document.querySelector("[data-directory-filter]").addEventListener("change", renderApproved);
document.querySelector("[data-open-submission]").addEventListener("click", openSubmission);
document.querySelectorAll("[data-submission-close]").forEach((button) => button.addEventListener("click", () => dialog.close()));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = form.querySelector("[data-submission-status]");
  status.hidden = true;
  if (!form.checkValidity()) return form.reportValidity();
  const data = new FormData(form);
  const email = String(data.get("correo") || "").trim().toLowerCase();
  if (!email.endsWith("@utfv.edu.mx")) return showStatus("Utiliza un correo institucional terminado en @utfv.edu.mx.");
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Enviando…";
  try {
    const { error } = await supabase.from("academic_directory_entries").insert({
      nombre: String(data.get("nombre") || "").trim(),
      career_id: data.get("career_id"),
      correo_institucional: email,
      enviado_por: state.user.id
    });
    if (error) throw error;
    await loadEntries();
    dialog.close();
    switchTab("mine");
    showToast("Propuesta enviada. Permanecerá pendiente hasta que el administrador la revise.");
  } catch (error) { showStatus(error.message || "No fue posible enviar la propuesta."); }
  finally { button.disabled = false; button.textContent = "Enviar a revisión"; }
});

document.querySelector("[data-admin-list]").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-review]");
  if (!button || !state.isAdmin) return;
  const action = button.dataset.review;
  const entry = state.entries.find((item) => item.id === button.dataset.id);
  if (!entry) return;
  document.querySelectorAll(`[data-id="${button.dataset.id}"]`).forEach((item) => { item.disabled = true; });
  try {
    const { error } = await supabase.from("academic_directory_entries").update({ estado: action, revisado_por: state.user.id, revisado_en: new Date().toISOString() }).eq("id", entry.id);
    if (error) throw error;
    await loadEntries();
    showToast(action === "approved" ? "Contacto aprobado y publicado." : "Propuesta rechazada.");
  } catch (error) {
    showToast(error.code === "23505" ? "Ya existe un contacto aprobado con ese correo." : (error.message || "No fue posible completar la revisión."), "error");
    document.querySelectorAll(`[data-id="${button.dataset.id}"]`).forEach((item) => { item.disabled = false; });
  }
});

document.querySelector("[data-directory-google]").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const status = document.querySelector("[data-directory-gate-status]");
  button.disabled = true;
  button.querySelector("span").textContent = "Conectando…";
  try { await iniciarSesionConGoogle("directorio-academico.html"); }
  catch (error) {
    showStatus(error.message || "No fue posible iniciar sesión con Google.", "error", status);
    button.disabled = false;
    button.querySelector("span").textContent = "Continuar con Google";
  }
});

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
  state.isAdmin = normalize(user.email) === ADMIN_EMAIL;
  document.querySelector("[data-admin-tab]").hidden = !state.isAdmin;
  if (state.isAdmin) document.querySelector("[data-admin-identity]").textContent = user.email;
  try { await loadEntries(); }
  catch (error) { showToast(error.message || "No fue posible cargar el directorio.", "error"); }
}

fillCareerSelect(document.querySelector("[data-submission-career]"));
fillCareerSelect(document.querySelector("[data-directory-filter]"), { includeAll: true });
const { data: sessionData } = await supabase.auth.getSession();
await setSession(sessionData.session?.user ?? null);
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") setSession(null);
  if (event === "SIGNED_IN" && session?.user?.id !== state.user?.id) setSession(session.user);
});
