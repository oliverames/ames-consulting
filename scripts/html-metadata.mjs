const RAW_TEXT_ELEMENTS = new Set([
  "iframe",
  "noembed",
  "noframes",
  "script",
  "style",
  "textarea",
  "title",
  "xmp",
]);
const ATTRIBUTE_PATTERN = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;

function decodeCharacterReferences(value) {
  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|(amp|comma|gt|lt|NewLine|nbsp|quot|Tab));?/gi,
    (reference, decimal, hexadecimal, named) => {
      if (decimal || hexadecimal) {
        const codePoint = Number.parseInt(decimal || hexadecimal, decimal ? 10 : 16);
        if (
          codePoint === 0
          || codePoint > 0x10FFFF
          || (codePoint >= 0xD800 && codePoint <= 0xDFFF)
        ) return "\uFFFD";
        return String.fromCodePoint(codePoint);
      }

      const replacements = {
        amp: "&",
        comma: ",",
        gt: ">",
        lt: "<",
        newline: "\n",
        nbsp: "\u00A0",
        quot: '"',
        tab: "\t",
      };
      return replacements[named.toLowerCase()] ?? reference;
    },
  );
}

function metaAttributes(tag) {
  const attributes = new Map();
  const source = tag.replace(/^<meta\b/i, "").replace(/\/?>$/, "");

  for (const match of source.matchAll(ATTRIBUTE_PATTERN)) {
    attributes.set(
      match[1].toLowerCase(),
      decodeCharacterReferences(match[2] ?? match[3] ?? match[4] ?? ""),
    );
  }

  return attributes;
}

function findTagEnd(html, start) {
  let quote = "";
  for (let index = start + 1; index < html.length; index += 1) {
    const character = html[index];
    if (quote) {
      if (character === quote) quote = "";
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return index + 1;
    }
  }
  return html.length;
}

function activeMetaTags(html) {
  const tags = [];
  let templateDepth = 0;
  let cursor = 0;

  while (cursor < html.length) {
    const start = html.indexOf("<", cursor);
    if (start < 0) break;

    if (html.startsWith("<!--", start)) {
      const commentEnd = html.indexOf("-->", start + 4);
      cursor = commentEnd < 0 ? html.length : commentEnd + 3;
      continue;
    }

    const end = findTagEnd(html, start);
    const tag = html.slice(start, end);
    const tagName = tag.match(/^<\s*(\/?)\s*([a-z][\w:-]*)/i);
    if (!tagName) {
      cursor = end;
      continue;
    }

    const closing = Boolean(tagName[1]);
    const name = tagName[2].toLowerCase();
    const selfClosing = /\/\s*>$/.test(tag);

    if (name === "template") {
      templateDepth = closing
        ? Math.max(0, templateDepth - 1)
        : templateDepth + (selfClosing ? 0 : 1);
      cursor = end;
      continue;
    }

    if (!closing && RAW_TEXT_ELEMENTS.has(name) && !selfClosing) {
      const closingTag = new RegExp(`<\\/\\s*${name}\\s*>`, "ig");
      closingTag.lastIndex = end;
      const match = closingTag.exec(html);
      cursor = match ? match.index + match[0].length : html.length;
      continue;
    }

    if (!closing && name === "meta" && templateDepth === 0) {
      tags.push({ start, end, tag });
    }
    cursor = end;
  }

  return tags;
}

function robotsDirectives(tag) {
  const attributes = metaAttributes(tag);
  if (attributes.get("name")?.toLowerCase() !== "robots") return [];
  return (attributes.get("content") || "")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
}

export function hasRobotsDirective(html, directive = "noindex") {
  const expected = directive.toLowerCase();
  return activeMetaTags(html).some(({ tag }) => {
    const directives = robotsDirectives(tag);
    return directives.includes(expected)
      || (expected === "noindex" && directives.includes("none"));
  });
}

export function removeMetaByName(html, name) {
  const expected = name.toLowerCase();
  const removals = activeMetaTags(html).filter(({ tag }) => (
    metaAttributes(tag).get("name")?.toLowerCase() === expected
  ));
  if (!removals.length) return html;

  let output = "";
  let cursor = 0;
  for (const { start, end } of removals) {
    output += html.slice(cursor, start);
    cursor = end;
  }
  return output + html.slice(cursor);
}
