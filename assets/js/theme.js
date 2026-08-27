const STORAGE_KEY = "dragonesmaps.theme";
const sunIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const moonIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>';

function currentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function saveTheme(theme) {
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* El tema seguirá activo durante la visita. */ }
}

function updateThemeColor(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "dark" ? "#0b1711" : "#0b6b3a";
}

function createToggle(compact = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = compact ? "icon-button theme-toggle theme-toggle--compact" : "theme-toggle";
  button.dataset.themeToggle = "";
  button.setAttribute("role", "switch");
  const label = document.createElement("span");
  label.className = compact ? "sr-only" : "theme-toggle__label";
  button.append(label);
  return button;
}

function ensureToggle() {
  const existing = document.querySelector("[data-theme-toggle]");
  if (existing) return existing;
  const menu = document.querySelector("[data-menu-panel]");
  if (menu) {
    const wrapper = document.createElement("div");
    wrapper.className = "side-menu__theme";
    const button = createToggle(false);
    wrapper.append(button);
    menu.append(wrapper);
    return button;
  }
  const header = document.querySelector(".simple-header");
  if (!header) return null;
  const button = createToggle(true);
  (header.querySelector(".simple-header__actions") || header).append(button);
  return button;
}

function renderToggle(button) {
  const dark = currentTheme() === "dark";
  const actionLabel = dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  button.setAttribute("aria-checked", String(dark));
  button.setAttribute("aria-label", actionLabel);
  button.title = actionLabel;
  button.dataset.mode = dark ? "dark" : "light";
  const label = button.querySelector(".theme-toggle__label, .sr-only");
  if (label) label.textContent = actionLabel;
  button.insertAdjacentHTML("afterbegin", dark ? sunIcon : moonIcon);
  const icons = button.querySelectorAll(":scope > svg");
  icons.forEach((icon, index) => { if (index > 0) icon.remove(); });
  updateThemeColor(dark ? "dark" : "light");
}

export function configurarTema() {
  const button = ensureToggle();
  if (!button) return;
  renderToggle(button);
  button.addEventListener("click", () => {
    const theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
    renderToggle(button);
  });
}
