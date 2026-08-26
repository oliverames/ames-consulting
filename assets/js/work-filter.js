const labels = {
  "beta-technologies": "BETA Technologies",
  "eastrise": "EastRise",
  "green-mountain-community-fitness": "Green Mountain Community Fitness",
};

const organization = new URLSearchParams(window.location.search).get("organization");
// Object.hasOwn keeps inherited names such as "toString" from masquerading as
// filters; an unrecognized value falls back to the unfiltered view.
const label = Object.hasOwn(labels, organization ?? "") ? labels[organization] : undefined;

// An unrecognized ?organization= value falls back to the unfiltered view, so
// "All" stays marked current rather than leaving no filter highlighted.
const activeFilter = label ? organization : "all";
for (const link of document.querySelectorAll("[data-work-filter]")) {
  if (link.dataset.workFilter === activeFilter) link.setAttribute("aria-current", "true");
}

if (label) {
  const projectCards = [...document.querySelectorAll(".work-list > .work-item")];
  const software = document.querySelector("#software-development");
  const title = document.querySelector("#project-list-title");
  const status = document.querySelector("#work-filter-status");

  for (const card of projectCards) {
    card.hidden = card.dataset.organization !== organization;
  }
  for (const category of document.querySelectorAll(".work-category")) {
    category.hidden = !category.querySelector(".work-item:not([hidden])");
  }
  if (software) software.hidden = true;
  if (title) title.textContent = `${label} projects`;
  if (status) {
    const count = projectCards.filter((card) => !card.hidden).length;
    status.hidden = false;
    status.innerHTML = `${count} ${count === 1 ? "project" : "projects"}. <a href="./">Show all work</a>`;
  }
}
