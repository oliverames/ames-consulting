const dialog = document.querySelector("#recommendation-dialog");
const content = dialog?.querySelector("[data-recommendation-dialog-content]");
const closeButton = dialog?.querySelector(".recommendation-dialog__close");
const triggers = document.querySelectorAll("[data-recommendation-dialog]");

let opener = null;

function closeDialog() {
  if (dialog?.open) dialog.close();
}

if (dialog && content && closeButton) {
  for (const trigger of triggers) {
    trigger.addEventListener("click", () => {
      if (document.querySelector("dialog[open]")) return;

      const templateId = trigger.dataset.recommendationDialog;
      const template = document.getElementById(templateId);
      if (!(template instanceof HTMLTemplateElement)) return;

      const recommendation = template.content.cloneNode(true);
      const title = recommendation.querySelector("[data-recommendation-dialog-title]");
      if (title) dialog.setAttribute("aria-label", title.textContent.trim());
      content.replaceChildren(recommendation);
      opener = trigger;
      document.documentElement.classList.add("has-open-dialog");
      dialog.showModal();
      closeButton.focus();
    });
  }

  closeButton.addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("has-open-dialog");
    dialog.setAttribute("aria-label", "Full recommendation");
    content.replaceChildren();
    opener?.focus();
    opener = null;
  });
}
