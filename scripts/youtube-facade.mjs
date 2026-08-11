const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const decodeHtmlAttribute = (value = "") => String(value)
  .replaceAll("&quot;", '"')
  .replaceAll("&gt;", ">")
  .replaceAll("&lt;", "<")
  .replaceAll("&amp;", "&");

export function youtubeIframe(videoId, title) {
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
    throw new Error(`Invalid YouTube video ID: ${videoId}`);
  }
  const playerUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
  const accessibleTitle = escapeHtml(title);
  const srcdoc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${accessibleTitle}</title><style>html,body,main,a{width:100%;height:100%;margin:0}body{background:#231f1b}h1{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}a{position:relative;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 22% 20%,rgba(204,142,52,.52),transparent 38%),radial-gradient(circle at 82% 82%,rgba(145,45,38,.58),transparent 42%),linear-gradient(145deg,#2d2925,#171412);color:#fff;font:700 1rem system-ui,sans-serif;text-decoration:none}a::before{position:absolute;inset:1rem auto auto 1rem;color:#f3d89b;content:"AMES CONSULTING VIDEO";font-size:.68rem;letter-spacing:.14em}span{position:relative;display:flex;align-items:center;gap:.65rem;padding:.78rem 1.05rem;border:1px solid rgba(255,255,255,.42);border-radius:999px;background:rgba(20,18,16,.88);box-shadow:0 4px 18px rgba(0,0,0,.4)}b{font-size:1.35rem}a:focus-visible{outline:4px solid #f4c95d;outline-offset:-4px}</style></head><body><main aria-label="${accessibleTitle} video player"><h1>${accessibleTitle}</h1><a href="${playerUrl}?autoplay=1" aria-label="Play ${accessibleTitle}"><span><b aria-hidden="true">&#9654;</b>Play ${accessibleTitle}</span></a></main></body></html>`;
  return `<iframe src="${playerUrl}" srcdoc="${escapeHtml(srcdoc)}" title="${accessibleTitle}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
}

export function youtubeFacade(videoId, title, className = "video-embed") {
  return `<div class="${escapeHtml(className)}">${youtubeIframe(videoId, title)}</div>`;
}

export function applyYoutubeFacades(html) {
  return html.replace(
    /<iframe\b[^>]*\bsrc="https:\/\/www\.youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{6,20})[^\"]*"[^>]*><\/iframe>/g,
    (iframe, videoId) => {
      const title = iframe.match(/\btitle="([^"]+)"/)?.[1] || "YouTube video";
      return youtubeIframe(videoId, decodeHtmlAttribute(title));
    },
  );
}
