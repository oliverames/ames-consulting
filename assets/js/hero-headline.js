const headline = document.querySelector("[data-hero-headline]");

const variants = [
  ["I photograph ", "people", " while they’re doing the work."],
  ["I photograph ", "people at work", ", at events, and in their communities."],
  ["I photograph ", "employees, customers, and volunteers", " for organizations."],
  ["I make ", "portrait and workplace photographs", " on location."],
  ["I photograph ", "portraits, events, and documentary projects", " across Vermont."],
];

if (headline) {
  const storageKey = "ames-hero-headline";
  let previous = -1;

  try {
    previous = Number.parseInt(window.sessionStorage.getItem(storageKey), 10);
  } catch {
    // The default photography headline remains when storage is unavailable.
  }

  let next = Math.floor(Math.random() * variants.length);
  if (next === previous) next = (next + 1) % variants.length;

  const [before, emphasis, after] = variants[next];
  const em = document.createElement("em");
  em.textContent = emphasis;
  headline.replaceChildren(before, em, after);

  try {
    window.sessionStorage.setItem(storageKey, String(next));
  } catch {
    // The selected headline still renders when storage is unavailable.
  }
}
