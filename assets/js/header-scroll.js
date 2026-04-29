// Toggles [data-scrolled] on .site-header once the page has scrolled past
// 10px so the blurred backdrop only appears when content is actually under
// the sticky header. The CSS at the top of `assets/css/main.css` reads this
// attribute and transitions the background, blur, and shadow accordingly.
//
// This module is meant to be loaded once per page via:
//   <script type="module" src="<relative-path>/assets/js/header-scroll.js"></script>
// It is side-effect-only — no exports.

const SCROLL_THRESHOLD = 10;

const header = document.querySelector(".site-header");

if (header) {
  const update = () => {
    header.toggleAttribute("data-scrolled", window.scrollY > SCROLL_THRESHOLD);
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
}
