#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { createBrotliCompress, createGzip } from "node:zlib";

const root = path.resolve(process.env.SITE_ROOT || "_site");
const port = Number(process.env.PORT || 4173);
const compressible = /^(?:text\/|application\/(?:javascript|json|ld\+json|xml)|image\/svg\+xml)/;
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"],
]);

function insideRoot(candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

async function resolveRequestPath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const candidate = path.resolve(root, `.${decoded}`);
  if (!insideRoot(candidate)) return null;
  const candidateStat = await stat(candidate).catch(() => null);
  if (candidateStat?.isDirectory()) return path.join(candidate, "index.html");
  return candidateStat?.isFile() ? candidate : null;
}

const server = http.createServer(async (request, response) => {
  if (!request.url || !["GET", "HEAD"].includes(request.method || "")) {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  const pathname = new URL(request.url, "http://localhost").pathname;
  let filePath = await resolveRequestPath(pathname);
  let status = 200;
  if (!filePath) {
    filePath = path.join(root, "404.html");
    status = 404;
  }

  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const contentType = contentTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
  const headers = {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
    Vary: "Accept-Encoding",
  };
  const accepts = request.headers["accept-encoding"] || "";
  const shouldCompress = fileStat.size >= 1024 && compressible.test(contentType);
  let encoding = "";
  if (shouldCompress && /\bbr\b/.test(accepts)) encoding = "br";
  else if (shouldCompress && /\bgzip\b/.test(accepts)) encoding = "gzip";
  if (encoding) headers["Content-Encoding"] = encoding;
  else headers["Content-Length"] = String(fileStat.size);

  response.writeHead(status, headers);
  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const stream = createReadStream(filePath);
  if (encoding === "br") stream.pipe(createBrotliCompress()).pipe(response);
  else if (encoding === "gzip") stream.pipe(createGzip()).pipe(response);
  else stream.pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} on http://127.0.0.1:${port}`);
});
