const rotator = document.querySelector("[data-proof-rotator]");

if (rotator) {
  const pages = [...rotator.querySelectorAll("[data-proof-page]")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentPage = 0;
  let timer;

  const showPage = (nextPage) => {
    pages[currentPage].classList.remove("is-visible");
    pages[currentPage].setAttribute("aria-hidden", "true");
    currentPage = nextPage;
    pages[currentPage].classList.add("is-visible");
    pages[currentPage].setAttribute("aria-hidden", "false");
  };

  const stop = () => {
    window.clearInterval(timer);
    timer = undefined;
  };

  const start = () => {
    stop();
    if (reduceMotion.matches || pages.length < 2) return;
    timer = window.setInterval(() => showPage((currentPage + 1) % pages.length), 12000);
  };

  rotator.addEventListener("pointerenter", stop);
  rotator.addEventListener("pointerleave", start);
  rotator.addEventListener("focusin", stop);
  rotator.addEventListener("focusout", (event) => {
    if (!rotator.contains(event.relatedTarget)) start();
  });

  reduceMotion.addEventListener("change", start);
  pages.forEach((page, index) => {
    page.hidden = reduceMotion.matches && index !== 0;
    page.classList.toggle("is-visible", index === 0);
    page.setAttribute("aria-hidden", index === 0 ? "false" : "true");
  });
  start();
}
