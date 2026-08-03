#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../contact/index.html", import.meta.url);
let html = await readFile(path, "utf8");
html = html
  .replace("Tell me what you are trying to make <em>clearer.</em>", "Tell me what you want people to <em>see.</em>")
  .replace("If something is difficult to explain or held together by one persnickety spreadsheet, I can probably help.", "Start with the photograph, story, or digital experience you need. I can help make the work clear and memorable.");
html = html.replace(/<p>Spam protection runs automatically\.<\/p>/g, "");
html = html.replace(
  /<ul><li><span>01<\/span><div><h3>Strategy and content[\s\S]*?<\/li><li><span>02<\/span><div><h3>Photography and video[\s\S]*?<\/li><li><span>03<\/span><div><h3>Websites and systems[\s\S]*?<\/li><\/ul>/,
  `<ul><li class="contact-notes__primary"><span>01</span><div><h3>Photography and video</h3><p>Show real people doing work that matters.</p></div></li><li><span>02</span><div><h3>Strategy and content</h3><p>Find the useful story and build a system around it.</p></div></li><li><span>03</span><div><h3>Websites and systems</h3><p>Fix the digital path behind the public experience.</p></div></li></ul>`,
);
await writeFile(path, html);
