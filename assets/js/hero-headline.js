const headline = document.querySelector("[data-hero-headline]");

const variants = [
  ["I photograph ", "people", " doing work that matters."],
  ["I make photographs that feel like the ", "people", " in them."],
  ["I photograph the moments that explain ", "what an organization does", "."],
  ["I turn real work into ", "photographs", " people remember."],
  ["I translate complex ideas into ", "stories", " people care about."],
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
