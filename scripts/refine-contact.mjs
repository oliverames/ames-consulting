#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../contact/index.html", import.meta.url);
let html = await readFile(path, "utf8");
html = html
  .replace("Tell me what you are trying to make <em>clearer.</em>", "Tell me what you’re <em>working on.</em>")
  .replace("If something is difficult to explain or held together by one persnickety spreadsheet, I can probably help.", "If you need photographs, help explaining something, or a better website or system, send me a note.");
html = html.replace(/<p>Spam protection runs automatically\.<\/p>/g, "");
html = html
  .replace(
    '<label>Organization <span>(optional)</span><input type="text" name="organization"',
    '<label><span class="contact-form__label-text">Organization <span class="contact-form__optional">(optional)</span></span><input type="text" name="organization"',
  )
  .replace(
    '<label>Timing <span>(optional)</span><input type="text" name="timeframe"',
    '<label><span class="contact-form__label-text">Timing <span class="contact-form__optional">(optional)</span></span><input type="text" name="timeframe"',
  );
html = html.replace(
  /<ul><li><span>01<\/span><div><h3>Strategy and content[\s\S]*?<\/li><li><span>02<\/span><div><h3>Photography and video[\s\S]*?<\/li><li><span>03<\/span><div><h3>Websites and systems[\s\S]*?<\/li><\/ul>/,
  `<ul><li class="contact-notes__primary"><span>01</span><div><h3>Photography and video</h3><p>I photograph people at work, at events, and on location.</p></div></li><li><span>02</span><div><h3>Strategy and content</h3><p>I plan and write content around the questions people ask.</p></div></li><li><span>03</span><div><h3>Websites and systems</h3><p>I build or repair websites, apps, and workflows.</p></div></li></ul>`,
);
html = html
  .replaceAll("Photograph people where the work happens.", "I photograph people at work, at events, and on location.")
  .replaceAll("Plan and write content around the questions people ask.", "I plan and write content around the questions people ask.")
  .replaceAll("Build or repair the website, app, or workflow behind it.", "I build or repair websites, apps, and workflows.");
await writeFile(path, html);
