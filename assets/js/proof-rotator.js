const rotator = document.querySelector("[data-proof-rotator]");

if (rotator) {
  const pages = [...rotator.querySelectorAll("[data-proof-page]")];
  let currentPage = Math.max(0, pages.findIndex((page) => !page.hidden));

  const showPage = (nextPage) => {
    currentPage = nextPage;
    pages.forEach((page, index) => {
      page.hidden = index !== currentPage;
      page.classList.toggle("is-visible", index === currentPage);
      page.removeAttribute("aria-hidden");
    });
    rotator.setAttribute(
      "aria-label",
      `Selected results, page ${currentPage + 1} of ${pages.length}`,
    );
  };

  showPage(currentPage);

  if (pages.length > 1) {
    const controls = document.createElement("div");
    controls.className = "proof__controls";
    controls.innerHTML = `<button class="proof__control" type="button" data-proof-previous>Previous results</button><button class="proof__control" type="button" data-proof-next>Next results</button>`;
    controls
      .querySelector("[data-proof-previous]")
      .addEventListener("click", () =>
        showPage((currentPage - 1 + pages.length) % pages.length),
      );
    controls
      .querySelector("[data-proof-next]")
      .addEventListener("click", () =>
        showPage((currentPage + 1) % pages.length),
      );
    rotator.append(controls);
  }
}
