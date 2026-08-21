function makeDismissible(panel, handle, closeButton) {
  if (!panel || !handle || !closeButton) return;
  let pointerId = null;
  let startY = 0;
  let startTime = 0;
  let dragging = false;

  const reset = () => {
    dragging = false;
    panel.style.removeProperty("--sheet-drag-y");
    handle.classList.remove("is-dragging");
  };

  handle.addEventListener("pointerdown", (event) => {
    if (window.innerWidth > 900 || !panel.classList.contains("is-open") || event.isPrimary === false) return;
    pointerId = event.pointerId;
    startY = event.clientY;
    startTime = performance.now();
    dragging = true;
    handle.classList.add("is-dragging");
    handle.setPointerCapture(pointerId);
  });

  handle.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const deltaY = Math.max(0, event.clientY - startY);
    if (!deltaY) return;
    event.preventDefault();
    panel.style.setProperty("--sheet-drag-y", `${Math.min(deltaY, window.innerHeight * .72)}px`);
  }, { passive: false });

  handle.addEventListener("pointerup", (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const distance = Math.max(0, event.clientY - startY);
    const velocity = distance / Math.max(performance.now() - startTime, 1);
    reset();
    if (distance > 92 || velocity > .55) closeButton.click();
  });

  handle.addEventListener("pointercancel", reset);
  closeButton.addEventListener("click", reset);
}

function makeExpandablePlaceSheet(panel, handle, closeButton) {
  if (!panel || !handle || !closeButton) return;
  let pointerId = null;
  let startY = 0;
  let startTime = 0;
  let dragging = false;
  let moved = false;

  const setExpanded = (expanded) => {
    panel.classList.toggle("is-expanded", expanded);
    handle.setAttribute("aria-expanded", String(expanded));
    handle.setAttribute("aria-label", expanded ? "Contraer información del lugar" : "Expandir información del lugar");
    panel.style.removeProperty("--sheet-drag-y");
    if (!expanded) panel.scrollTo({ top: 0, behavior: "smooth" });
  };

  handle.addEventListener("click", () => {
    if (moved || window.innerWidth > 900 || !panel.classList.contains("is-open")) return;
    setExpanded(!panel.classList.contains("is-expanded"));
  });

  handle.addEventListener("pointerdown", (event) => {
    if (window.innerWidth > 900 || !panel.classList.contains("is-open") || event.isPrimary === false) return;
    pointerId = event.pointerId;
    startY = event.clientY;
    startTime = performance.now();
    dragging = true;
    moved = false;
    handle.classList.add("is-dragging");
    handle.setPointerCapture(pointerId);
  });

  handle.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const deltaY = event.clientY - startY;
    if (Math.abs(deltaY) < 4) return;
    moved = true;
    event.preventDefault();
    const expanded = panel.classList.contains("is-expanded");
    const drag = expanded ? Math.max(0, deltaY) : Math.max(-160, deltaY);
    panel.style.setProperty("--sheet-drag-y", `${drag}px`);
  }, { passive: false });

  handle.addEventListener("pointerup", (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const deltaY = event.clientY - startY;
    const velocity = deltaY / Math.max(performance.now() - startTime, 1);
    const expanded = panel.classList.contains("is-expanded");
    dragging = false;
    handle.classList.remove("is-dragging");
    panel.style.removeProperty("--sheet-drag-y");

    if (expanded && (deltaY > 64 || velocity > .48)) setExpanded(false);
    else if (!expanded && (deltaY < -42 || velocity < -.42)) setExpanded(true);
    else if (!expanded && (deltaY > 88 || velocity > .55)) closeButton.click();

    window.setTimeout(() => { moved = false; }, 0);
  });

  handle.addEventListener("pointercancel", () => {
    dragging = false;
    moved = false;
    handle.classList.remove("is-dragging");
    panel.style.removeProperty("--sheet-drag-y");
  });

  closeButton.addEventListener("click", () => setExpanded(false));
}

export function configureBottomSheets() {
  makeExpandablePlaceSheet(
    document.querySelector("[data-place-panel]"),
    document.querySelector("[data-place-swipe-handle]"),
    document.querySelector("[data-place-close]")
  );
  makeDismissible(
    document.querySelector("[data-route-panel]"),
    document.querySelector("[data-route-swipe-handle]"),
    document.querySelector("[data-route-close]")
  );
}
