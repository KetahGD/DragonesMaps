import { AREAS_ADMINISTRATIVAS, CONTACTOS_ADMINISTRATIVOS } from "../data/administrative-directory.js";

const search = document.querySelector("[data-admin-search]");
const filters = document.querySelector("[data-admin-filters]");
const list = document.querySelector("[data-admin-list]");
const count = document.querySelector("[data-admin-count]");
const toggle = document.querySelector("[data-admin-toggle]");
const content = document.querySelector("[data-admin-content]");
let activeArea = "all";

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function createText(tag, value, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function phoneHref(value) {
  const base = value.split(/ext\./i)[0].replace(/\D/g, "");
  return base ? `tel:+52${base}` : "";
}

function createContact(contact) {
  const card = document.createElement("article");
  card.className = "admin-contact";
  const area = createText("span", AREAS_ADMINISTRATIVAS[contact.area], "admin-contact__area");
  const title = createText("h3", contact.cargo);
  const name = createText("p", contact.nombre || "Área de atención", "admin-contact__name");
  card.append(area, title, name);

  const actions = document.createElement("div");
  actions.className = "admin-contact__actions";
  if (contact.telefono) {
    const phone = document.createElement("a");
    phone.href = phoneHref(contact.telefono);
    phone.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-4-1-1.2 2a15 15 0 0 1-9.8-9.8L8 7 7 3Z"/></svg>';
    phone.append(createText("span", contact.telefono));
    actions.append(phone);
  }
  if (contact.correo) {
    const email = document.createElement("a");
    email.href = `mailto:${contact.correo}`;
    email.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>';
    email.append(createText("span", contact.correo));
    actions.append(email);
  }
  card.append(actions);
  return card;
}

function render() {
  const term = normalize(search?.value);
  const visible = CONTACTOS_ADMINISTRATIVOS.filter((contact) => activeArea === "all" || contact.area === activeArea)
    .filter((contact) => !term || normalize(`${contact.cargo} ${contact.nombre} ${contact.telefono} ${contact.correo} ${AREAS_ADMINISTRATIVAS[contact.area]}`).includes(term));
  list.replaceChildren();
  count.textContent = `${visible.length} ${visible.length === 1 ? "contacto" : "contactos"}`;
  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "admin-directory__empty";
    empty.append(createText("strong", "No encontramos coincidencias"), createText("span", "Prueba con otro nombre, área, teléfono o correo."));
    list.append(empty);
    return;
  }
  visible.forEach((contact) => list.append(createContact(contact)));
}

function buildFilters() {
  const options = [["all", "Todas"], ...Object.entries(AREAS_ADMINISTRATIVAS)];
  options.forEach(([id, label], index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.area = id;
    button.setAttribute("aria-pressed", String(index === 0));
    button.addEventListener("click", () => {
      activeArea = id;
      filters.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      render();
    });
    filters.append(button);
  });
}

if (search && filters && list && count) {
  buildFilters();
  search.addEventListener("input", render);
  render();
}

toggle?.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  content.hidden = !open;
  const title = toggle.querySelector("strong");
  if (title) title.textContent = open ? "Ocultar contactos administrativos" : "Mostrar contactos administrativos";
  if (open) window.setTimeout(() => search?.focus({ preventScroll: true }), 160);
});
