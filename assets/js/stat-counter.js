/**
 * Stat counter animation for the proof strip.
 *
 * On first scroll into view, animates each .proof__cell .num element from
 * 0 to its final integer value over a short duration. The final value is
 * read from the element's text content at module load, so the counter
 * never invents numbers — it only animates toward whatever the HTML says.
 *
 * Hard rules:
 *   - Skipped entirely under prefers-reduced-motion: reduce (the static
 *     number stays exactly as authored)
 *   - Skipped if IntersectionObserver isn't available (graceful fallback)
 *   - Skipped if the parsed final value isn't a number (e.g. "2020" works,
 *     "since 2020" is left as-is)
 *   - Each cell animates exactly once
 */

(function () {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  const cells = document.querySelectorAll('[data-stripe] .proof__cell .num');
  if (!cells.length || typeof IntersectionObserver !== 'function') return;

  const DURATION_MS = 1200;

  function animateTo(el, target) {
    const start = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - start) / DURATION_MS);
      // ease-out cubic — fast then settles
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(target * eased);
      el.textContent = String(value);
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = String(target);
    }

    requestAnimationFrame(frame);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const final = parseInt(el.textContent, 10);
        if (!Number.isFinite(final)) {
          observer.unobserve(el);
          return;
        }
        el.textContent = '0';
        animateTo(el, final);
        observer.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );

  cells.forEach((el) => observer.observe(el));
})();
