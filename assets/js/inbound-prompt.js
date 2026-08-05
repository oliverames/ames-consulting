const PROMPT_DELAY_MS = 30_000;
const DISMISSAL_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const DISMISSED_KEY = "ames_inbound_prompt_dismissed_at";
const SCROLL_TRIGGER = 0.35;

const variants = [
  {
    match:
      /\/(photography|portraits|family|corporate-cup|girls-on-the-run|giron|sweat-heart|bike-fitting)/,
    type: "Photography and video",
    title: "Need photographs that feel like the people in them?",
    body: "Tell me what you need to show, who it is for, and where the photographs need to work.",
  },
  {
    match: /\/(blog|writing|strategy-and-content|eastrise-writing)/,
    type: "Strategy and content",
    title: "Have something difficult to explain?",
    body: "Tell me what people need to understand and where the explanation keeps getting stuck.",
  },
  {
    match: /\/(practical-technology|credit-union-websites)/,
    type: "Website or digital system",
    title: "Is useful work stuck behind a persnickety system?",
    body: "Tell me what should happen, what happens now, and who has to work around it.",
  },
];

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Privacy-restricted browsers can still use the prompt for this visit.
  }
}

function relativeContactUrl(type) {
  const depth = location.pathname.split("/").filter(Boolean).length;
  const base = depth === 0 ? "contact/" : `${"../".repeat(depth)}contact/`;
  return `${base}?project=${encodeURIComponent(type)}`;
}

function currentVariant() {
  return (
    variants.find((variant) => variant.match.test(location.pathname)) || {
      type: "Something else",
      title: "Have something useful that needs a clearer story?",
      body: "Tell me what you are making and where it is getting stuck. I will tell you if I can help.",
    }
  );
}

function wasRecentlyDismissed() {
  const dismissedAt = Number(storageGet(DISMISSED_KEY));
  return (
    Number.isFinite(dismissedAt) &&
    Date.now() - dismissedAt < DISMISSAL_WINDOW_MS
  );
}

function scrollProgress() {
  const available = document.documentElement.scrollHeight - innerHeight;
  // A page that cannot scroll counts as unscrolled, not fully scrolled.
  return available <= 0 ? 0 : scrollY / available;
}

function anotherDialogIsOpen(dialog) {
  return [...document.querySelectorAll("dialog[open]")].some(
    (other) => other !== dialog,
  );
}

function initInboundPrompt() {
  if (
    location.pathname.includes("/contact") ||
    document.querySelector("[data-inbound-prompt]")
  )
    return;

  const variant = currentVariant();
  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "inbound-launcher";
  launcher.textContent = "Start a project";
  launcher.setAttribute("aria-haspopup", "dialog");
  launcher.setAttribute("aria-controls", "inbound-prompt");
  launcher.hidden = true;

  const dialog = document.createElement("dialog");
  dialog.id = "inbound-prompt";
  dialog.className = "inbound-prompt";
  dialog.dataset.inboundPrompt = "";
  dialog.innerHTML = `<div class="inbound-prompt__mesh" aria-hidden="true"></div><button class="inbound-prompt__close" type="button" aria-label="Close project prompt">×</button><span class="inbound-prompt__eyebrow">Ames Consulting · Montpelier, Vermont</span><h2>${variant.title}</h2><p>${variant.body}</p><div class="inbound-prompt__actions"><a class="btn btn--primary" href="${relativeContactUrl(variant.type)}">Tell me about the project →</a><button class="btn btn--ghost" type="button" data-inbound-dismiss>Keep looking</button></div>`;

  document.body.append(launcher, dialog);
  const footer = document.querySelector(".site-footer");
  if (footer) {
    const footerObserver = new IntersectionObserver(
      ([entry]) =>
        launcher.classList.toggle(
          "inbound-launcher--over-footer",
          entry.isIntersecting,
        ),
      { threshold: 0.05 },
    );
    footerObserver.observe(footer);
  }
  const closeButton = dialog.querySelector(".inbound-prompt__close");
  const dismissButton = dialog.querySelector("[data-inbound-dismiss]");
  const contactLink = dialog.querySelector("a");
  let elapsed = 0;
  let startedAt = 0;
  let timer = 0;
  let hasEnoughTime = false;
  let hasEnoughScroll = scrollProgress() >= SCROLL_TRIGGER;

  const remember = () => storageSet(DISMISSED_KEY, String(Date.now()));
  const close = ({ rememberChoice = true } = {}) => {
    if (rememberChoice) remember();
    if (dialog.open) dialog.close();
  };
  const open = ({ automatic = false } = {}) => {
    if (dialog.open) return;
    if (automatic && wasRecentlyDismissed()) return;
    // Never stack over another open dialog, such as the image viewer.
    if (anotherDialogIsOpen(dialog)) return;
    dialog.showModal();
  };
  const maybeOpen = () => {
    if (hasEnoughTime && hasEnoughScroll && !wasRecentlyDismissed())
      open({ automatic: true });
  };
  const stopTimer = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = 0;
    elapsed += Date.now() - startedAt;
  };
  const startTimer = () => {
    if (timer || hasEnoughTime || document.hidden) return;
    startedAt = Date.now();
    timer = setTimeout(
      () => {
        timer = 0;
        hasEnoughTime = true;
        maybeOpen();
      },
      Math.max(0, PROMPT_DELAY_MS - elapsed),
    );
  };
  const updateScroll = () => {
    const progress = scrollProgress();
    launcher.hidden = progress < 0.18;
    hasEnoughScroll ||= progress >= SCROLL_TRIGGER;
    maybeOpen();
  };

  launcher.addEventListener("click", () => open());
  closeButton.addEventListener("click", () => close());
  dismissButton.addEventListener("click", () => close());
  contactLink.addEventListener("click", remember);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopTimer();
    else startTimer();
  });
  addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();
  startTimer();
}

initInboundPrompt();
