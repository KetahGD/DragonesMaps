import { cerrarSesion, iniciarSesionConGoogle } from "./auth.js";
import { supabase } from "./supabase.js";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const PRIORITIES = { low: "Baja", medium: "Media", high: "Alta" };
const state = { user: null, schedule: [], tasks: [], events: [], tab: "schedule" };

const loading = document.querySelector("[data-loading]");
const gate = document.querySelector("[data-auth-gate]");
const app = document.querySelector("[data-organizer-app]");
const topAccount = document.querySelector("[data-top-account]");
const topName = document.querySelector("[data-top-name]");
const toast = document.querySelector("[data-toast]");
const scheduleDialog = document.querySelector("[data-schedule-dialog]");
const taskDialog = document.querySelector("[data-task-dialog]");
const eventDialog = document.querySelector("[data-event-dialog]");
const scheduleForm = document.querySelector("[data-schedule-form]");
const taskForm = document.querySelector("[data-task-form]");
const eventForm = document.querySelector("[data-event-form]");
let toastTimer;

function showToast(message, type = "success") {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.dataset.type = type;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4200);
}

function clean(value) {
  const result = String(value ?? "").trim();
  return result || null;
}

function text(tag, value, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function actionButton(label, action, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  return button;
}

function itemActions(kind, id) {
  const actions = document.createElement("div");
  actions.className = "item-actions";
  actions.append(actionButton("Editar", `edit-${kind}`, id), actionButton("Eliminar", `delete-${kind}`, id));
  return actions;
}

function displayName(user) {
  return user?.user_metadata?.nombre || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Estudiante";
}

function formatDate(value, options = {}) {
  if (!value) return "Sin fecha límite";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", ...options }).format(new Date(value));
}

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoOrNull(value) {
  return value ? new Date(value).toISOString() : null;
}

function setFormLoading(form, active) {
  const submit = form.querySelector('button[type="submit"]');
  if (!submit.dataset.originalLabel) submit.dataset.originalLabel = submit.textContent;
  submit.disabled = active;
  submit.textContent = active ? "Guardando…" : submit.dataset.originalLabel;
}

function formError(form, message) {
  const status = form.querySelector("[data-form-status]");
  status.textContent = message;
  status.hidden = false;
}

function openDialog(dialog, form, titleElement, title, values = {}) {
  form.reset();
  form.querySelector("[data-form-status]").hidden = true;
  titleElement.textContent = title;
  Object.entries(values).forEach(([name, value]) => {
    const field = form.elements.namedItem(name);
    if (field) field.value = value ?? "";
  });
  dialog.showModal();
  window.setTimeout(() => form.querySelector("input:not([type='hidden']), select")?.focus(), 30);
}

function closeDialog(dialog) {
  if (dialog.open) dialog.close();
}

async function loadOrganizer() {
  const [scheduleResult, tasksResult, eventsResult] = await Promise.all([
    supabase.from("student_schedule_items").select("id,subject,teacher,room,day_of_week,start_time,end_time,color,notes").order("day_of_week").order("start_time"),
    supabase.from("student_tasks").select("id,title,course,due_at,priority,status,notes,completed_at").order("due_at", { ascending: true, nullsFirst: false }),
    supabase.from("student_events").select("id,title,starts_at,ends_at,location,notes,color").order("starts_at")
  ]);

  const error = scheduleResult.error || tasksResult.error || eventsResult.error;
  if (error) throw error;
  state.schedule = scheduleResult.data ?? [];
  state.tasks = tasksResult.data ?? [];
  state.events = eventsResult.data ?? [];
  renderAll();
}

function nextClassOccurrence(item, now = new Date()) {
  const currentDay = now.getDay() || 7;
  let daysAhead = item.day_of_week - currentDay;
  const [hours, minutes] = item.start_time.slice(0, 5).split(":").map(Number);
  if (daysAhead < 0) daysAhead += 7;
  const occurrence = new Date(now);
  occurrence.setHours(hours, minutes, 0, 0);
  occurrence.setDate(now.getDate() + daysAhead);
  if (occurrence <= now) occurrence.setDate(occurrence.getDate() + 7);
  return occurrence;
}

function renderSummary() {
  const now = new Date();
  const nextClass = state.schedule
    .map((item) => ({ item, date: nextClassOccurrence(item, now) }))
    .sort((a, b) => a.date - b.date)[0];
  const className = document.querySelector("[data-next-class]");
  const classDetail = document.querySelector("[data-next-class-detail]");
  if (nextClass) {
    className.textContent = nextClass.item.subject;
    classDetail.textContent = `${DAYS[nextClass.item.day_of_week - 1]}, ${nextClass.item.start_time.slice(0, 5)}${nextClass.item.room ? ` · ${nextClass.item.room}` : ""}`;
  } else {
    className.textContent = "Sin clases próximas";
    classDetail.textContent = "Agrega tu horario para comenzar";
  }

  const pending = state.tasks.filter((task) => task.status === "pending");
  const overdue = pending.filter((task) => task.due_at && new Date(task.due_at) < now).length;
  document.querySelector("[data-pending-count]").textContent = String(pending.length);
  document.querySelector("[data-tab-task-count]").textContent = String(pending.length);
  document.querySelector("[data-pending-detail]").textContent = overdue ? `${overdue} vencida${overdue === 1 ? "" : "s"}` : (pending.length ? "Sin tareas vencidas" : "Todo al día");

  const nextEvent = state.events.find((event) => new Date(event.starts_at) >= now);
  document.querySelector("[data-next-event]").textContent = nextEvent?.title || "Sin eventos próximos";
  document.querySelector("[data-next-event-detail]").textContent = nextEvent ? formatDate(nextEvent.starts_at) : "Agrega un compromiso";
}

function renderSchedule() {
  const grid = document.querySelector("[data-schedule-grid]");
  grid.replaceChildren();
  DAYS.forEach((day, index) => {
    const column = document.createElement("section");
    column.className = "schedule-day";
    column.append(text("h3", day));
    const list = document.createElement("div");
    list.className = "schedule-day__list";
    const items = state.schedule.filter((item) => item.day_of_week === index + 1);
    if (!items.length) {
      list.append(text("p", "Sin clases registradas", "schedule-empty"));
    } else {
      items.forEach((item) => {
        const card = document.createElement("article");
        card.className = "schedule-card";
        card.style.setProperty("--item-color", item.color);
        card.append(text("span", `${item.start_time.slice(0, 5)}–${item.end_time.slice(0, 5)}`), text("strong", item.subject));
        if (item.room) card.append(text("small", item.room));
        if (item.teacher) card.append(text("small", item.teacher));
        card.append(itemActions("schedule", item.id));
        list.append(card);
      });
    }
    column.append(list);
    grid.append(column);
  });
}

function renderTasks() {
  const list = document.querySelector("[data-task-list]");
  const filter = document.querySelector("[data-task-filter]").value;
  const tasks = state.tasks.filter((task) => filter === "all" || task.status === filter);
  list.replaceChildren();
  if (!tasks.length) {
    const empty = document.createElement("div");
    empty.className = "organizer-empty";
    empty.append(text("strong", filter === "completed" ? "Aún no hay tareas completadas" : "No tienes tareas pendientes"), text("span", "Agrega una entrega y usa la prioridad para organizarte."));
    list.append(empty);
    return;
  }
  tasks.forEach((task) => {
    const item = document.createElement("article");
    item.className = "organizer-item";
    item.dataset.completed = String(task.status === "completed");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "organizer-item__check";
    checkbox.checked = task.status === "completed";
    checkbox.dataset.action = "toggle-task";
    checkbox.dataset.id = task.id;
    checkbox.setAttribute("aria-label", `Marcar ${task.title} como ${checkbox.checked ? "pendiente" : "completada"}`);
    const body = document.createElement("div");
    body.className = "organizer-item__body";
    body.append(text("strong", task.title));
    const meta = [task.course, task.due_at ? formatDate(task.due_at) : "Sin fecha límite"].filter(Boolean).join(" · ");
    body.append(text("span", meta));
    if (task.notes) body.append(text("small", task.notes));
    const priority = text("span", PRIORITIES[task.priority], "priority-badge");
    priority.dataset.priority = task.priority;
    body.append(priority);
    item.append(checkbox, body, itemActions("task", task.id));
    list.append(item);
  });
}

function renderEvents() {
  const list = document.querySelector("[data-event-list]");
  list.replaceChildren();
  if (!state.events.length) {
    const empty = document.createElement("div");
    empty.className = "organizer-empty";
    empty.append(text("strong", "No hay eventos personales"), text("span", "Registra una asesoría, reunión o actividad para no olvidarla."));
    list.append(empty);
    return;
  }
  state.events.forEach((event) => {
    const date = new Date(event.starts_at);
    const item = document.createElement("article");
    item.className = "organizer-item";
    item.style.setProperty("--item-color", event.color);
    const dateBox = document.createElement("div");
    dateBox.className = "organizer-item__date";
    dateBox.append(text("strong", String(date.getDate())), text("span", new Intl.DateTimeFormat("es-MX", { month: "short" }).format(date)));
    const body = document.createElement("div");
    body.className = "organizer-item__body";
    body.append(text("strong", event.title), text("span", formatDate(event.starts_at)));
    if (event.location) body.append(text("small", event.location));
    if (event.notes) body.append(text("small", event.notes));
    item.append(dateBox, body, itemActions("event", event.id));
    list.append(item);
  });
}

function renderAll() {
  renderSummary();
  renderSchedule();
  renderTasks();
  renderEvents();
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll("[data-tab]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.tab === tab)));
  document.querySelectorAll("[data-panel]").forEach((panel) => { panel.hidden = panel.dataset.panel !== tab; });
}

function openSchedule(item) {
  openDialog(scheduleDialog, scheduleForm, document.querySelector("[data-schedule-dialog-title]"), item ? "Editar clase" : "Agregar clase", item ? {
    id: item.id, subject: item.subject, day: item.day_of_week, start: item.start_time.slice(0, 5), end: item.end_time.slice(0, 5), room: item.room, teacher: item.teacher, color: item.color, notes: item.notes
  } : { color: "#0b6b3a", day: "1" });
}

function openTask(item) {
  openDialog(taskDialog, taskForm, document.querySelector("[data-task-dialog-title]"), item ? "Editar tarea" : "Agregar tarea", item ? {
    id: item.id, title: item.title, course: item.course, due: toLocalInput(item.due_at), priority: item.priority, status: item.status, notes: item.notes
  } : { priority: "medium", status: "pending" });
}

function openEvent(item) {
  openDialog(eventDialog, eventForm, document.querySelector("[data-event-dialog-title]"), item ? "Editar evento" : "Agregar evento", item ? {
    id: item.id, title: item.title, start: toLocalInput(item.starts_at), end: toLocalInput(item.ends_at), location: item.location, color: item.color, notes: item.notes
  } : { color: "#287fa0" });
}

async function saveRecord(table, id, payload) {
  const query = id
    ? supabase.from(table).update(payload).eq("id", id)
    : supabase.from(table).insert({ ...payload, user_id: state.user.id });
  const { error } = await query;
  if (error) throw error;
  await loadOrganizer();
}

scheduleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(scheduleForm);
  if (String(data.get("end")) <= String(data.get("start"))) {
    formError(scheduleForm, "La hora de fin debe ser posterior a la hora de inicio.");
    return;
  }
  setFormLoading(scheduleForm, true);
  try {
    await saveRecord("student_schedule_items", clean(data.get("id")), {
      subject: clean(data.get("subject")), day_of_week: Number(data.get("day")), start_time: data.get("start"), end_time: data.get("end"), room: clean(data.get("room")), teacher: clean(data.get("teacher")), color: data.get("color"), notes: clean(data.get("notes"))
    });
    closeDialog(scheduleDialog);
    showToast("Clase guardada en tu horario.");
  } catch (error) { formError(scheduleForm, error.message || "No fue posible guardar la clase."); }
  finally { setFormLoading(scheduleForm, false); }
});

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(taskForm);
  const completed = data.get("status") === "completed";
  setFormLoading(taskForm, true);
  try {
    await saveRecord("student_tasks", clean(data.get("id")), {
      title: clean(data.get("title")), course: clean(data.get("course")), due_at: toIsoOrNull(data.get("due")), priority: data.get("priority"), status: data.get("status"), notes: clean(data.get("notes")), completed_at: completed ? new Date().toISOString() : null
    });
    closeDialog(taskDialog);
    showToast("Tarea guardada.");
  } catch (error) { formError(taskForm, error.message || "No fue posible guardar la tarea."); }
  finally { setFormLoading(taskForm, false); }
});

eventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(eventForm);
  if (data.get("end") && String(data.get("end")) < String(data.get("start"))) {
    formError(eventForm, "La fecha de término no puede ser anterior al inicio.");
    return;
  }
  setFormLoading(eventForm, true);
  try {
    await saveRecord("student_events", clean(data.get("id")), {
      title: clean(data.get("title")), starts_at: toIsoOrNull(data.get("start")), ends_at: toIsoOrNull(data.get("end")), location: clean(data.get("location")), color: data.get("color"), notes: clean(data.get("notes"))
    });
    closeDialog(eventDialog);
    showToast("Evento guardado.");
  } catch (error) { formError(eventForm, error.message || "No fue posible guardar el evento."); }
  finally { setFormLoading(eventForm, false); }
});

async function deleteRecord(kind, id) {
  const labels = { schedule: ["esta clase", "student_schedule_items"], task: ["esta tarea", "student_tasks"], event: ["este evento", "student_events"] };
  const [label, table] = labels[kind];
  if (!window.confirm(`¿Quieres eliminar ${label}?`)) return;
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) { showToast(error.message || "No fue posible eliminar el elemento.", "error"); return; }
  await loadOrganizer();
  showToast("Elemento eliminado.");
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.matches("[data-dialog-close]")) return closeDialog(button.closest("dialog"));
  if (button.dataset.tab) return switchTab(button.dataset.tab);
  if (button.matches("[data-add-schedule]")) return openSchedule();
  if (button.matches("[data-add-task]")) return openTask();
  if (button.matches("[data-add-event]")) return openEvent();
  if (button.matches("[data-quick-add]")) return state.tab === "tasks" ? openTask() : state.tab === "events" ? openEvent() : openSchedule();
  const { action, id } = button.dataset;
  if (!action || !id) return;
  if (action === "edit-schedule") openSchedule(state.schedule.find((item) => item.id === id));
  if (action === "edit-task") openTask(state.tasks.find((item) => item.id === id));
  if (action === "edit-event") openEvent(state.events.find((item) => item.id === id));
  if (action.startsWith("delete-")) await deleteRecord(action.replace("delete-", ""), id);
});

document.querySelector("[data-task-list]").addEventListener("change", async (event) => {
  const checkbox = event.target.closest('[data-action="toggle-task"]');
  if (!checkbox) return;
  checkbox.disabled = true;
  const completed = checkbox.checked;
  const { error } = await supabase.from("student_tasks").update({ status: completed ? "completed" : "pending", completed_at: completed ? new Date().toISOString() : null }).eq("id", checkbox.dataset.id);
  if (error) {
    checkbox.checked = !completed;
    checkbox.disabled = false;
    showToast(error.message || "No fue posible actualizar la tarea.", "error");
    return;
  }
  await loadOrganizer();
  showToast(completed ? "Tarea completada." : "Tarea marcada como pendiente.");
});

document.querySelector("[data-task-filter]").addEventListener("change", renderTasks);

function parseCsv(textValue) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  const value = textValue.replace(/^\uFEFF/, "");
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '"' && quoted && value[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && value[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = "";
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalize(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function scheduleFromCsv(content) {
  const rows = parseCsv(content);
  if (rows.length < 2) throw new Error("El archivo debe incluir encabezados y al menos una clase.");
  const headers = rows[0].map(normalize);
  const column = (name) => headers.indexOf(name);
  const required = ["materia", "dia", "inicio", "fin"];
  if (required.some((name) => column(name) < 0)) throw new Error("Faltan columnas obligatorias: materia, dia, inicio y fin.");
  const dayMap = new Map(DAYS.map((day, index) => [normalize(day), index + 1]));
  const valid = [], invalid = [];
  rows.slice(1, 201).forEach((row, index) => {
    const subject = clean(row[column("materia")]);
    const day = dayMap.get(normalize(row[column("dia")]));
    const start = row[column("inicio")]?.slice(0, 5);
    const end = row[column("fin")]?.slice(0, 5);
    if (!subject || !day || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || end <= start) {
      invalid.push(index + 2);
      return;
    }
    const candidateColor = row[column("color")];
    valid.push({ user_id: state.user.id, subject, day_of_week: day, start_time: start, end_time: end, room: clean(row[column("aula")]), teacher: clean(row[column("docente")]), color: /^#[0-9a-f]{6}$/i.test(candidateColor) ? candidateColor : "#0b6b3a", notes: clean(row[column("notas")]) });
  });
  if (!valid.length) throw new Error(`No se encontraron clases válidas${invalid.length ? `; revisa las filas ${invalid.join(", ")}` : ""}.`);
  return { valid, invalid };
}

document.querySelector("[data-import-trigger]").addEventListener("click", () => document.querySelector("[data-import-file]").click());
document.querySelector("[data-import-file]").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 1024 * 1024) return showToast("El archivo CSV no debe superar 1 MB.", "error");
  try {
    const { valid, invalid } = scheduleFromCsv(await file.text());
    const { error } = await supabase.from("student_schedule_items").insert(valid);
    if (error) throw error;
    await loadOrganizer();
    showToast(`${valid.length} clase${valid.length === 1 ? " importada" : "s importadas"}${invalid.length ? `; se omitieron las filas ${invalid.join(", ")}` : ""}.`);
  } catch (error) { showToast(error.message || "No fue posible importar el archivo.", "error"); }
});

document.querySelector("[data-download-template]").addEventListener("click", () => {
  const content = "materia,dia,inicio,fin,aula,docente,color,notas\nMatemáticas,Lunes,08:00,10:00,Edificio D,Nombre docente,#0B6B3A,\nInglés,Miércoles,12:00,13:30,Salones de Idiomas,,#287FA0,";
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla-horario-dragones-maps.csv";
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("[data-google-signin]").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const message = document.querySelector("[data-gate-message]");
  button.disabled = true;
  button.querySelector("span").textContent = "Conectando con Google…";
  try { await iniciarSesionConGoogle("organizador.html"); }
  catch (error) {
    message.textContent = error.message || "No fue posible iniciar sesión con Google.";
    message.hidden = false;
    button.disabled = false;
    button.querySelector("span").textContent = "Continuar con Google";
  }
});

document.querySelector("[data-sign-out]").addEventListener("click", async (event) => {
  event.currentTarget.disabled = true;
  try { await cerrarSesion(); window.location.reload(); }
  catch (error) { showToast(error.message || "No fue posible cerrar la sesión.", "error"); event.currentTarget.disabled = false; }
});

async function setSession(user) {
  state.user = user;
  loading.hidden = true;
  if (!user) {
    gate.hidden = false;
    app.hidden = true;
    topAccount.hidden = true;
    return;
  }
  gate.hidden = true;
  app.hidden = false;
  topAccount.hidden = false;
  topName.textContent = displayName(user);
  try { await loadOrganizer(); }
  catch (error) {
    showToast(error.message || "No fue posible cargar tu organizador.", "error");
  }
}

const { data: sessionData } = await supabase.auth.getSession();
await setSession(sessionData.session?.user ?? null);
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") setSession(null);
  if (event === "SIGNED_IN" && session?.user?.id !== state.user?.id) setSession(session.user);
});
