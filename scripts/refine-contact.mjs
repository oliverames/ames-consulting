#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../contact/index.html", import.meta.url);
let html = await readFile(path, "utf8");
html = html.replace(
  /<label>What kind of work\?<select name="projectType">[\s\S]*?<\/select><\/label>/,
  `<fieldset class="contact-project-types"><legend>What kind of work?</legend><label><input type="radio" name="projectType" value="Photography and video"><span>Photography and video</span></label><label><input type="radio" name="projectType" value="Strategy and content"><span>Strategy and content</span></label><label><input type="radio" name="projectType" value="Website or digital system"><span>Website or digital system</span></label><label><input type="radio" name="projectType" value="Something else"><span>Something else</span></label></fieldset>`,
);
html = html.replace(/<p>Spam protection runs automatically\.<\/p>/g, "");
html = html.replace(
  /<ul><li><span>01<\/span><div><h3>Strategy and content[\s\S]*?<\/li><li><span>02<\/span><div><h3>Photography and video[\s\S]*?<\/li><li><span>03<\/span><div><h3>Websites and systems[\s\S]*?<\/li><\/ul>/,
  `<ul><li class="contact-notes__primary"><span>01</span><div><h3>Photography and video</h3><p>Show real people doing work that matters.</p></div></li><li><span>02</span><div><h3>Strategy and content</h3><p>Find the useful story and build a system around it.</p></div></li><li><span>03</span><div><h3>Websites and systems</h3><p>Fix the digital path behind the public experience.</p></div></li></ul>`,
);
await writeFile(path, html);
