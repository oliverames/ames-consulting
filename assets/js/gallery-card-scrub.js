const CARD_SELECTOR = ".work-item, .path-thumb, .organization-project-card, .gallery-preview a";
const IMAGE_SELECTOR = ":scope > img, .path-thumb__img img, .organization-project-card__image img, .gallery-preview__image img";
const GALLERY_SELECTOR = ".campaign-collage img, .portrait-gallery img, .website-screen-gallery img, .photo-gallery img";
const STEP_PIXELS = 48;
const cache = new Map();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function absoluteUrl(value, base = document.baseURI) {
  try {
    return new URL(value, base).href;
  } catch {
    return "";
  }
}

function isSoftwareCard(card) {
  const href = card.getAttribute("href") || "";
  return Boolean(card.closest("#software-development, .software-showcase"))
    || /(?:ping-warden|apple-core|bridgeport|meta-mcp|ynab-mcp|skylight-bridge)/.test(href);
}

async function galleryFor(card, image) {
  const href = card.getAttribute("href");
  if (!href) return [];
  const targetUrl = new URL(href, document.baseURI);
  const cacheKey = targetUrl.href;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const request = fetch(targetUrl.href, { credentials: "same-origin" })
    .then((response) => response.ok ? response.text() : "")
    .then((markup) => {
      if (!markup) return [];
      const parsed = new DOMParser().parseFromString(markup, "text/html");
      let scope = parsed;
      if (targetUrl.hash) {
        const anchor = parsed.getElementById(decodeURIComponent(targetUrl.hash.slice(1)));
        scope = anchor?.closest("section") || anchor?.parentElement || parsed;
      }
      const pinned = absoluteUrl(image.currentSrc || image.src);
      const candidates = [...scope.querySelectorAll(GALLERY_SELECTOR)]
        .map((candidate) => absoluteUrl(candidate.getAttribute("src"), targetUrl.href))
        .filter(Boolean);
      return [...new Set([pinned, ...candidates])];
    })
    .catch(() => []);
  cache.set(cacheKey, request);
  return request;
}

function preload(url) {
  if (!url) return;
  const image = new Image();
  image.src = url;
}

function attach(card) {
  if (isSoftwareCard(card)) return;
  const image = card.querySelector(IMAGE_SELECTOR);
  if (!image) return;

  const pinnedSrc = image.getAttribute("src");
  const pinnedSrcset = image.getAttribute("srcset");
  let frames = [];
  let frameIndex = 0;
  let lastX = 0;
  let travel = 0;
  let hovering = false;

  image.addEventListener("pointerenter", async (event) => {
    if (reducedMotion.matches || event.pointerType === "touch") return;
    hovering = true;
    lastX = event.clientX;
    travel = 0;
    const loaded = await galleryFor(card, image);
    // The pointer may have left while the gallery list loaded; do not re-arm
    // scrub state after pointerleave already cleared it.
    if (!hovering) return;
    frames = loaded;
    frameIndex = Math.max(0, frames.indexOf(absoluteUrl(image.currentSrc || image.src)));
    image.toggleAttribute("data-gallery-scrub-ready", frames.length > 1);
    preload(frames[(frameIndex + 1) % frames.length]);
  });

  image.addEventListener("pointermove", (event) => {
    if (frames.length < 2 || reducedMotion.matches || event.pointerType === "touch") return;
    travel += event.clientX - lastX;
    lastX = event.clientX;
    const steps = Math.trunc(travel / STEP_PIXELS);
    if (!steps) return;
    travel -= steps * STEP_PIXELS;
    frameIndex = ((frameIndex + steps) % frames.length + frames.length) % frames.length;
    image.removeAttribute("srcset");
    image.src = frames[frameIndex];
    preload(frames[((frameIndex + Math.sign(steps)) % frames.length + frames.length) % frames.length]);
  });

  image.addEventListener("pointerleave", () => {
    hovering = false;
    frames = [];
    frameIndex = 0;
    travel = 0;
    image.removeAttribute("data-gallery-scrub-ready");
    image.src = pinnedSrc;
    if (pinnedSrcset) image.setAttribute("srcset", pinnedSrcset);
    else image.removeAttribute("srcset");
  });
}

if (!reducedMotion.matches) {
  document.querySelectorAll(CARD_SELECTOR).forEach(attach);
}
