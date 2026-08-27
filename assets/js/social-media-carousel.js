const carousels = document.querySelectorAll("[data-media-carousel]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function currentIndex(track, items) {
  const maximumScroll = track.scrollWidth - track.clientWidth;
  if (track.scrollLeft >= maximumScroll - 2) return items.length - 1;

  const trackLeft = track.getBoundingClientRect().left;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  items.forEach((item, index) => {
    const distance = Math.abs(item.getBoundingClientRect().left - trackLeft);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

for (const carousel of carousels) {
  const track = carousel.querySelector("[data-media-carousel-track]");
  const items = [...carousel.querySelectorAll("[data-media-carousel-item]")];
  const count = carousel.querySelector("[data-media-carousel-count]");
  const previous = carousel.querySelector("[data-media-carousel-previous]");
  const next = carousel.querySelector("[data-media-carousel-next]");
  if (!track || items.length < 2 || !count || !previous || !next) continue;

  let frame = 0;
  const update = () => {
    frame = 0;
    const hasOverflow = track.scrollWidth - track.clientWidth > 2;
    count.hidden = !hasOverflow;
    previous.hidden = !hasOverflow;
    next.hidden = !hasOverflow;
    if (!hasOverflow) {
      previous.disabled = true;
      next.disabled = true;
      return;
    }

    const index = currentIndex(track, items);
    count.textContent = `${index + 1}/${items.length}`;
    previous.disabled = index === 0;
    next.disabled = index === items.length - 1;
  };

  const scheduleUpdate = () => {
    if (frame) return;
    frame = requestAnimationFrame(update);
  };

  const move = (offset) => {
    const index = currentIndex(track, items);
    const destination = items[Math.max(0, Math.min(items.length - 1, index + offset))];
    destination.scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "nearest",
      inline: "start",
    });
  };

  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  track.addEventListener("scroll", scheduleUpdate, { passive: true });
  new ResizeObserver(scheduleUpdate).observe(track);
  update();
}
