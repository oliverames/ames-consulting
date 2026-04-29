// Lightweight image viewer used across the site.
//
// Two ways to use this module:
//
// 1) Auto-init. Load it as a top-level module on any page that has content
//    images you want to make zoomable:
//
//      <script type="module" src="<relative-path>/assets/js/image-viewer.js"></script>
//
//    On DOMContentLoaded the script will:
//      - inject a <dialog id="image-viewer"> if the page doesn't already
//        contain one
//      - decorate every <img> inside <main>, <article>, or [data-zoomable]
//        (skipping anything wrapped in an <a> so links keep navigating)
//      - wire global click / keyboard / context-menu handlers
//
// 2) Manual import. Other modules (notably `app.js`) can import the named
//    helpers directly. The wiring functions are idempotent — calling them
//    a second time after auto-init is a no-op — so importers don't need to
//    coordinate with the auto-init.

let wiredViewer = false;
let wiredAssetProtection = false;

function buildViewerDialog() {
  const dialog = document.createElement("dialog");
  dialog.id = "image-viewer";
  dialog.setAttribute("aria-labelledby", "image-viewer-title");

  const article = document.createElement("article");
  article.className = "image-viewer-content";

  const header = document.createElement("header");

  const title = document.createElement("h2");
  title.id = "image-viewer-title";
  title.textContent = "Image Viewer";

  const closeButton = document.createElement("button");
  closeButton.id = "image-viewer-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close image viewer");
  closeButton.textContent = "Close";

  header.append(title, closeButton);

  const figure = document.createElement("figure");

  const image = document.createElement("img");
  image.id = "image-viewer-image";
  image.className = "protected-asset";
  image.src = "";
  image.alt = "";
  image.setAttribute("draggable", "false");

  const caption = document.createElement("figcaption");
  caption.id = "image-viewer-caption";

  figure.append(image, caption);
  article.append(header, figure);
  dialog.append(article);

  return dialog;
}

export function ensureViewerDialog() {
  if (document.getElementById("image-viewer")) {
    return;
  }
  document.body.append(buildViewerDialog());
}

export function decorateContentMedia(container) {
  if (!container) return;
  container.querySelectorAll("img").forEach((image) => {
    // Skip images that opt out, are already decorated, or are wrapped in a
    // link (those should keep navigating, not zoom).
    if (image.dataset.noZoom != null) return;
    if (image.classList.contains("zoomable-image")) return;
    if (image.closest("a")) return;

    image.classList.add("zoomable-image", "protected-asset");
    image.dataset.protectedAsset = "image";
    image.setAttribute("draggable", "false");
    image.style.webkitUserDrag = "none";

    if (!image.hasAttribute("loading")) {
      image.loading = "lazy";
    }

    if (!image.hasAttribute("decoding")) {
      image.decoding = "async";
    }

    if (!image.hasAttribute("referrerpolicy")) {
      image.referrerPolicy = "no-referrer";
    }

    if (!image.hasAttribute("tabindex")) {
      image.tabIndex = 0;
    }

    if (!image.hasAttribute("role")) {
      image.setAttribute("role", "button");
    }

    if (!image.hasAttribute("aria-label")) {
      const accessibleLabel = image.alt?.trim()
        ? `Open larger image: ${image.alt.trim()}`
        : "Open larger image";
      image.setAttribute("aria-label", accessibleLabel);
    }
  });
}

function isProtectedAssetTarget(target) {
  return Boolean(target.closest(".protected-asset, #image-viewer-image"));
}

export function wireImageViewer() {
  if (wiredViewer) return;

  const viewer = document.getElementById("image-viewer");
  const closeButton = document.getElementById("image-viewer-close");
  const viewerImage = document.getElementById("image-viewer-image");
  const viewerCaption = document.getElementById("image-viewer-caption");

  if (
    !(viewer instanceof HTMLDialogElement) ||
    !(viewerImage instanceof HTMLImageElement) ||
    !viewerCaption
  ) {
    return;
  }

  wiredViewer = true;

  const openViewer = (sourceImage) => {
    const source = sourceImage.currentSrc || sourceImage.src;
    if (!source) return;

    viewerImage.src = source;
    viewerImage.alt = sourceImage.alt || "Image preview";
    viewerCaption.textContent =
      sourceImage.alt || sourceImage.getAttribute("title") || "";
    viewer.showModal();
  };

  const closeViewer = () => {
    viewer.close();
    viewerImage.src = "";
    viewerImage.alt = "";
    viewerCaption.textContent = "";
  };

  closeButton?.addEventListener("click", closeViewer);

  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) {
      closeViewer();
    }
  });

  viewer.addEventListener("cancel", () => {
    viewerImage.src = "";
    viewerImage.alt = "";
    viewerCaption.textContent = "";
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const image = target.closest(".zoomable-image");
    if (!(image instanceof HTMLImageElement)) return;

    event.preventDefault();
    openViewer(image);
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    if (!target.classList.contains("zoomable-image")) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    openViewer(target);
  });
}

export function wireAssetProtection() {
  if (wiredAssetProtection) return;
  wiredAssetProtection = true;

  document.addEventListener("contextmenu", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (isProtectedAssetTarget(target)) {
      event.preventDefault();
    }
  });

  document.addEventListener("dragstart", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (isProtectedAssetTarget(target)) {
      event.preventDefault();
    }
  });

  document.addEventListener("keydown", (event) => {
    const saveShortcut =
      (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
    if (!saveShortcut) return;

    const viewer = document.getElementById("image-viewer");
    if (viewer instanceof HTMLDialogElement && viewer.open) {
      event.preventDefault();
    }
  });
}

// Auto-init once the DOM is ready. Other modules that import named helpers
// (like app.js) get the same wiring without doubled-up event listeners
// thanks to the idempotency flags above.
function autoInit() {
  ensureViewerDialog();

  // Decorate images in the main content areas. Header/nav/footer are
  // intentionally excluded because they hold logos, social icons, and
  // similar non-content imagery.
  document
    .querySelectorAll("main, article, [data-zoomable]")
    .forEach((container) => decorateContentMedia(container));

  wireImageViewer();
  wireAssetProtection();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit, { once: true });
} else {
  autoInit();
}
