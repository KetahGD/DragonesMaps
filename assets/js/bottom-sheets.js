function makeDismissible(panel, handle, closeButton) {
  if (!panel || !handle || !closeButton) return;
  let pointerId = null;
  let startY = 0;
  let startX = 0;
  let startTime = 0;
  let distance = 0;
  let dragging = false;

  const resetStyles = () => {
    panel.style.removeProperty("transition");
    panel.style.removeProperty("transform");
    handle.classList.remove("is-dragging");
  };

  const finish = (dismiss) => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove("is-dragging");
    panel.style.transition = "transform 180ms ease";
    if (dismiss) {
      panel.style.transform = "translateY(105%)";
      window.setTimeout(() => {
        closeButton.click();
        window.setTimeout(resetStyles, 250);
      }, 150);
    } else {
      panel.style.transform = "translateY(0)";
      window.setTimeout(resetStyles, 190);
    }
  };

  handle.addEventListener("pointerdown", (event) => {
    if (window.innerWidth > 900 || !panel.classList.contains("is-open") || event.isPrimary === false) return;
    pointerId = event.pointerId;
    startY = event.clientY;
    startX = event.clientX;
    startTime = performance.now();
    distance = 0;
    dragging = true;
    handle.classList.add("is-dragging");
    handle.setPointerCapture(pointerId);
    panel.style.transition = "none";
  });

  handle.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const deltaY = event.clientY - startY;
    const deltaX = event.clientX - startX;
    if (deltaY < 0 || Math.abs(deltaX) > Math.abs(deltaY) * 1.25) return;
    event.preventDefault();
    distance = deltaY;
    const softened = Math.min(deltaY, window.innerHeight * .72);
    panel.style.transform = `translateY(${softened}px)`;
  }, { passive: false });

  handle.addEventListener("pointerup", (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    distance = Math.max(distance, event.clientY - startY);
    const elapsed = Math.max(performance.now() - startTime, 1);
    const velocity = distance / elapsed;
    finish(distance > 92 || velocity > .55);
  });

  handle.addEventListener("pointercancel", () => finish(false));
  closeButton.addEventListener("click", () => window.setTimeout(resetStyles, 260));
}

export function configureBottomSheets() {
  makeDismissible(
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
