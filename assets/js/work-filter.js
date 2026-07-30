const labels = {
  "blue-cross-vermont": "Blue Cross Vermont",
  "eastrise": "EastRise",
  "beta-technologies": "BETA Technologies",
  "green-mountain-community-fitness": "Green Mountain Community Fitness",
};

const organization = new URLSearchParams(window.location.search).get("organization");
const label = labels[organization];

if (label) {
  const projectCards = [...document.querySelectorAll(".work-list > .work-item")];
  const software = document.querySelector("#software-development");
  const title = document.querySelector("#project-list-title");
  const status = document.querySelector("#work-filter-status");

  for (const card of projectCards) {
    card.hidden = card.dataset.organization !== organization;
  }
  if (software) software.hidden = true;
  if (title) title.textContent = `${label} projects`;
  if (status) {
    const count = projectCards.filter((card) => !card.hidden).length;
    status.hidden = false;
    status.innerHTML = `${count} ${count === 1 ? "project" : "projects"}. <a href="./">Show all work</a>`;
  }
}
