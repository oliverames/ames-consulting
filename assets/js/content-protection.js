const editableSelector = "input, textarea, select, [contenteditable='true']";

function isEditable(target) {
  return target instanceof Element && Boolean(target.closest(editableSelector));
}

for (const eventName of ["copy", "cut"]) {
  document.addEventListener(eventName, (event) => {
    if (!isEditable(event.target)) event.preventDefault();
  });
}

document.addEventListener("contextmenu", (event) => {
  if (!isEditable(event.target)) event.preventDefault();
});

document.addEventListener("dragstart", (event) => {
  if (event.target instanceof HTMLImageElement) event.preventDefault();
});

document.addEventListener("keydown", (event) => {
  if (isEditable(event.target)) return;
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && ["c", "x", "s", "p"].includes(key)) event.preventDefault();
});
