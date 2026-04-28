function normalizeRootPath(path) {
  return path.replace(/^\.\//, "");
}

function getGalleryCover(gallery) {
  if (gallery.coverImage) {
    return gallery.coverImage;
  }

  const firstImage = gallery.images?.find((image) => image.url || image.filename);
  if (!firstImage) {
    return null;
  }

  return firstImage.url || `./assets/images/photography/${gallery.slug}/${firstImage.filename}`;
}

function formatGalleryMeta(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.valueOf())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric"
  }).format(date);
}

function renderPhotographyStrip(galleries, container) {
  if (!container || galleries.length === 0 || container.querySelector(".path-thumb")) {
    return;
  }

  const fragment = document.createDocumentFragment();

  galleries.forEach((gallery) => {
    const coverImage = getGalleryCover(gallery);
    if (!coverImage) {
      return;
    }

    const link = document.createElement("a");
    link.href = `photography/${gallery.slug}/`;
    link.className = "path-thumb";
    link.title = gallery.title;

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "path-thumb__img";

    const img = document.createElement("img");
    img.src = normalizeRootPath(coverImage);
    img.alt = gallery.title;
    img.loading = "lazy";
    img.width = gallery.images?.[0]?.width || 1200;
    img.height = gallery.images?.[0]?.height || 800;

    const body = document.createElement("div");
    body.className = "path-thumb__body";

    const meta = document.createElement("span");
    meta.className = "path-thumb__meta";
    meta.textContent = formatGalleryMeta(gallery.date);

    const title = document.createElement("h4");
    title.className = "path-thumb__title";
    title.textContent = gallery.title;

    imageWrapper.append(img);
    body.append(meta, title);
    link.append(imageWrapper, body);
    fragment.append(link);
  });

  if (fragment.childElementCount > 0) {
    container.replaceChildren(fragment);
  }
}

async function loadPhotographyGalleries() {
  const response = await fetch(new URL("../data/photography.json", import.meta.url));
  if (!response.ok) {
    throw new Error(`Unable to load photography galleries (${response.status})`);
  }

  const data = await response.json();
  return Array.isArray(data.galleries) ? data.galleries : [];
}

const photographyStrip = document.getElementById("photography-strip");

if (photographyStrip) {
  loadPhotographyGalleries()
    .then((galleries) => renderPhotographyStrip(galleries, photographyStrip))
    .catch(() => {
      // Keep the static homepage placeholders visible when local files or feeds are unavailable.
    });
}
