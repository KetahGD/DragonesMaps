(() => {
  const key = "dragonesmaps.theme";
  let theme = "";
  try { theme = localStorage.getItem(key) || ""; } catch { /* Preferencia no disponible. */ }
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = theme;
})();
