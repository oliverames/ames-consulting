// Toggles [data-scrolled] on .site-header once the page has scrolled past
// 10px so the blurred backdrop only appears when content is actually under
// the sticky header. The CSS at the top of `assets/css/main.css` reads this
// attribute and transitions the background, blur, and shadow accordingly.
//
// This module is meant to be loaded once per page via:
//   <script type="module" src="<relative-path>/assets/js/header-scroll.js"></script>
// It is side-effect-only — no exports.

import "./inbound-prompt.js";
import "./gallery-card-scrub.js";

const SCROLL_THRESHOLD = 10;

const header = document.querySelector(".site-header");
const siteNav = document.querySelector(".site-nav");

function revealNavLink(link) {
  if (!(siteNav instanceof HTMLElement) || !(link instanceof HTMLAnchorElement)) {
    return;
  }
  if (!siteNav.contains(link) || siteNav.scrollWidth <= siteNav.clientWidth) {
    return;
  }

  const navBounds = siteNav.getBoundingClientRect();
  const linkBounds = link.getBoundingClientRect();
  const isFullyVisible =
    linkBounds.left >= navBounds.left && linkBounds.right <= navBounds.right;

  if (!isFullyVisible) {
    link.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
  }
}

if (siteNav) {
  const currentLink = siteNav.querySelector("[aria-current]");
  const revealCurrentLink = () => revealNavLink(currentLink);

  requestAnimationFrame(revealCurrentLink);
  document.fonts?.ready.then(revealCurrentLink);
  siteNav.addEventListener("focusin", (event) => revealNavLink(event.target));
}

if (header) {
  const update = () => {
    header.toggleAttribute("data-scrolled", window.scrollY > SCROLL_THRESHOLD);
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
}
