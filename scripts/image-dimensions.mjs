// Shared intrinsic-image measurement used by apply-image-dimensions.mjs and
// apply-seo.mjs (og:image:width/height). Pure-JS header parsing so builds
// never depend on native image tooling.

import { readFile } from "node:fs/promises";

export function webpDimensions(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const format = buffer.toString("ascii", 12, 16);
  if (format === "VP8X") {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height };
  }
  if (format === "VP8 ") {
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }
  if (format === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    const width = 1 + (bits & 0x3fff);
    const height = 1 + ((bits >> 14) & 0x3fff);
    return { width, height };
  }
  return null;
}

export function pngDimensions(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

export function jpegDimensions(buffer) {
  if (buffer.readUInt16BE(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const size = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    }
    offset += 2 + size;
  }
  return null;
}

export function svgDimensions(text) {
  const open = text.match(/<svg\b[^>]*>/);
  if (!open) return null;
  const attr = (name) => {
    const match = open[0].match(new RegExp(`\\b${name}="([0-9.]+)(?:px)?"`));
    return match ? Math.round(Number(match[1])) : null;
  };
  const width = attr("width");
  const height = attr("height");
  if (width && height) return { width, height };
  const viewBox = open[0].match(/\bviewBox="[0-9.\s-]*?([0-9.]+)\s+([0-9.]+)"/);
  if (viewBox) return { width: Math.round(Number(viewBox[1])), height: Math.round(Number(viewBox[2])) };
  return null;
}

export async function imageDimensions(path) {
  const buffer = await readFile(path);
  if (path.endsWith(".svg")) return svgDimensions(buffer.toString("utf8"));
  return webpDimensions(buffer) ?? pngDimensions(buffer) ?? jpegDimensions(buffer);
}
