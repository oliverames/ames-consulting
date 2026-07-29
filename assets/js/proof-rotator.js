const rotator = document.querySelector("[data-proof-rotator]");

if (rotator) {
  const pages = [...rotator.querySelectorAll("[data-proof-page]")];
  const toggle = rotator.querySelector("[data-proof-toggle]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentPage = 0;
  let timer;
  let manuallyPaused = false;

  const showPage = (nextPage) => {
    pages[currentPage].classList.add("is-leaving");

    window.setTimeout(() => {
      pages[currentPage].hidden = true;
      pages[currentPage].classList.remove("is-visible", "is-leaving");
      currentPage = nextPage;
      pages[currentPage].hidden = false;
      window.requestAnimationFrame(() => pages[currentPage].classList.add("is-visible"));
    }, reduceMotion.matches ? 0 : 180);
  };

  const stop = () => {
    window.clearInterval(timer);
    timer = undefined;
  };

  const start = () => {
    stop();
    if (reduceMotion.matches || manuallyPaused || pages.length < 2) return;
    timer = window.setInterval(() => showPage((currentPage + 1) % pages.length), 6000);
  };

  const setToggleState = () => {
    toggle.textContent = manuallyPaused ? "Play metrics" : "Pause metrics";
    toggle.setAttribute("aria-pressed", String(manuallyPaused));
  };

  rotator.addEventListener("pointerenter", stop);
  rotator.addEventListener("pointerleave", start);
  rotator.addEventListener("focusin", stop);
  rotator.addEventListener("focusout", (event) => {
    if (!rotator.contains(event.relatedTarget)) start();
  });

  toggle.addEventListener("click", () => {
    manuallyPaused = !manuallyPaused;
    setToggleState();
    if (manuallyPaused) stop();
    else start();
  });

  reduceMotion.addEventListener("change", start);
  pages[0].classList.add("is-visible");
  setToggleState();
  start();
}
