/**
 * Bento gallery lightbox.
 *
 * Wires up <a class="tile" data-shoot="..."> elements so that clicking them
 * opens an in-page <dialog class="lightbox"> via the View Transitions API
 * (with progressive-enhancement fallback). Without JS, the same <a> elements
 * route to /photography/<slug>/ — so this module is purely additive.
 *
 * Features:
 *   - View Transitions morph between tile and lightbox photo (Chrome 111+, Safari 18+)
 *   - Keyboard nav (Arrow Left/Right; Escape handled by <dialog>)
 *   - Pointer-event swipe on touch devices
 *   - Neighbor preload via <link rel="preload" as="image">
 *   - History integration (back button closes; deep link via #shoot/<slug>)
 *   - Focus restoration to the originating tile on close
 */

(function () {
  'use strict';

  const dataNode = document.getElementById('bento-galleries');
  const dialog = document.getElementById('bento-lightbox');
  if (!dataNode || !dialog || typeof dialog.showModal !== 'function') {
    // Native <dialog> not supported — leave the tiles as plain <a> links.
    return;
  }

  let galleries;
  try {
    galleries = JSON.parse(dataNode.textContent);
  } catch (err) {
    return; // malformed JSON is a markup bug; do nothing rather than throw.
  }

  const photo = document.getElementById('lightbox-photo');
  const titleEl = document.getElementById('lightbox-title');
  const counterEl = document.getElementById('lightbox-counter');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  // Active state -- module-scoped so render() can read without prop drilling.
  let activeSlug = null;
  let activeIdx = 0;
  let originTile = null; // for focus restoration on close
  let preloadLinks = []; // tracked so we can clean them up

  function buildSrc(slug, image) {
    return galleries[slug].basePath + image.src;
  }

  function preloadNeighbors(slug, idx) {
    // Drop previous preloads. Keep the active image's preload alive briefly
    // so a fast next/prev doesn't drop the cache.
    preloadLinks.forEach((l) => l.remove());
    preloadLinks = [];

    const images = galleries[slug].images;
    const offsets = [-1, 1, 2]; // prev, next, next+1
    offsets.forEach((off) => {
      const i = (idx + off + images.length) % images.length;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = buildSrc(slug, images[i]);
      document.head.appendChild(link);
      preloadLinks.push(link);
    });
  }

  function render() {
    if (!activeSlug) return;
    const gallery = galleries[activeSlug];
    const image = gallery.images[activeIdx];
    photo.src = buildSrc(activeSlug, image);
    photo.alt = image.alt || gallery.title;
    photo.width = image.width || 1200;
    photo.height = image.height || 800;
    titleEl.textContent = gallery.title;
    counterEl.textContent = (activeIdx + 1) + ' of ' + gallery.images.length;
    preloadNeighbors(activeSlug, activeIdx);
  }

  function openLightbox(slug, originEl) {
    if (!galleries[slug]) return false;

    activeSlug = slug;
    activeIdx = 0;
    originTile = originEl || null;

    // Tag the lightbox photo with the matching view-transition-name so the
    // browser can pair tile <-> photo and animate the morph.
    photo.style.viewTransitionName = 'lightbox-photo';

    const run = () => {
      render();
      dialog.showModal();
    };

    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(run);
    } else {
      run();
    }

    // Push history entry so the browser back button closes the lightbox
    // without unloading the page.
    if (location.hash !== '#shoot/' + slug) {
      history.pushState({ lightbox: slug }, '', '#shoot/' + slug);
    }

    return true;
  }

  function closeLightbox() {
    const run = () => dialog.close();
    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(run);
    } else {
      run();
    }

    preloadLinks.forEach((l) => l.remove());
    preloadLinks = [];

    // Pop history entry only if we're still at the lightbox URL. Avoids
    // double-pop when the user clicked back to close.
    if (location.hash.startsWith('#shoot/')) {
      history.replaceState(null, '', location.pathname + location.search);
    }

    if (originTile && typeof originTile.focus === 'function') {
      originTile.focus({ preventScroll: true });
    }

    activeSlug = null;
    originTile = null;
  }

  function step(delta) {
    if (!activeSlug) return;
    const len = galleries[activeSlug].images.length;
    activeIdx = (activeIdx + delta + len) % len;
    render();
  }

  // ─── Wire up tiles ──────────────────────────────────────────────────────
  document.querySelectorAll('.tile[data-shoot]').forEach((tile) => {
    const slug = tile.dataset.shoot;
    if (!galleries[slug]) return;

    // Mark the tile as enhanced so the CSS can show the expand affordance.
    tile.dataset.lightboxReady = 'true';

    tile.addEventListener('click', (event) => {
      // Honor modifier keys and middle-click; let the browser handle them
      // as normal navigation to /photography/<slug>/.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.button !== undefined && event.button !== 0) return;

      event.preventDefault();
      openLightbox(slug, tile);
    });
  });

  // ─── Dialog controls ────────────────────────────────────────────────────
  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(+1));

  // Backdrop click to close. The <dialog> element fills the visible region;
  // the backdrop is the area outside the dialog box. Clicking the backdrop
  // dispatches a click event on the dialog itself with target === dialog.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!dialog.open) return;
    if (event.key === 'ArrowLeft') step(-1);
    else if (event.key === 'ArrowRight') step(+1);
    // Escape is handled natively by <dialog>; we still need to clean up.
  });

  dialog.addEventListener('close', () => {
    // Catches Escape-key close and any close() not initiated by us.
    if (activeSlug) {
      preloadLinks.forEach((l) => l.remove());
      preloadLinks = [];
      if (originTile && typeof originTile.focus === 'function') {
        originTile.focus({ preventScroll: true });
      }
      activeSlug = null;
      originTile = null;
    }
  });

  // ─── Touch swipe ────────────────────────────────────────────────────────
  // Pointer Events unify mouse + touch + pen. We only act on swipes that
  // exceed a threshold and remain primarily horizontal (so vertical scroll
  // pans aren't accidentally consumed).
  let pointerStart = null;

  const stage = dialog.querySelector('.lightbox__stage');
  if (stage) {
    stage.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse') return; // mouse uses arrows + buttons
      pointerStart = { x: event.clientX, y: event.clientY };
    });

    stage.addEventListener('pointerup', (event) => {
      if (!pointerStart) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerStart = null;
      const SWIPE_MIN = 40; // px

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_MIN) {
        step(dx < 0 ? +1 : -1); // swipe left = next; swipe right = prev
      } else if (dy > SWIPE_MIN * 2 && Math.abs(dy) > Math.abs(dx)) {
        // Long downward swipe closes (mirrors iOS sheet dismiss gesture).
        closeLightbox();
      }
    });

    stage.addEventListener('pointercancel', () => {
      pointerStart = null;
    });
  }

  // ─── History (back-button + deep link) ─────────────────────────────────
  window.addEventListener('popstate', () => {
    if (dialog.open) {
      dialog.close();
    } else if (location.hash.startsWith('#shoot/')) {
      const slug = location.hash.slice('#shoot/'.length);
      const tile = document.querySelector('.tile[data-shoot="' + CSS.escape(slug) + '"]');
      openLightbox(slug, tile);
    }
  });

  // Open on initial page load if URL has a #shoot/<slug> hash.
  if (location.hash.startsWith('#shoot/')) {
    const slug = location.hash.slice('#shoot/'.length);
    const tile = document.querySelector('.tile[data-shoot="' + CSS.escape(slug) + '"]');
    if (tile && galleries[slug]) {
      // Defer one tick so the rest of the page paints first.
      requestAnimationFrame(() => openLightbox(slug, tile));
    }
  }
})();
