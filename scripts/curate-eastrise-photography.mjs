#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const dataPath = "assets/data/eastrise-photography.json";
const data = JSON.parse(await readFile(dataPath, "utf8"));
const bySlug = new Map(data.series.map((series) => [series.slug, series]));
const linkedin = bySlug.get("linkedin-published-photography");

if (!linkedin) {
  console.log("EastRise photography is already curated.");
  process.exit(0);
}

const take = (seriesSlug, positions) => {
  const series = bySlug.get(seriesSlug);
  return positions.map((position) => series.images[position - 1]).filter(Boolean);
};

const linked = (positions) => take("linkedin-published-photography", positions);
const community = bySlug.get("community-and-volunteer-work");
const memberStories = bySlug.get("member-stories");
const businessStories = bySlug.get("member-and-business-stories");

const definitions = [
  ["shred-fest", "Shred Fest", "Document destruction and community service at EastRise branches.", take("shred-fest", [1, 2, 3, 4, 5])],
  ["karina-and-ryan", "Karina and Ryan", "A first-time homebuyer story photographed with Karina, Ryan, and their family.", [...memberStories.images.slice(0, 9), ...linked([10, 20])]],
  ["john-and-donia", "John and Donia", "An EastRise member story photographed at home with John and Donia.", memberStories.images.slice(9)],
  ["bike-shop-member-story", "Bike Shop Member Story", "A Vermont couple photographed at work inside their bicycle shop.", linked([7, 13, 14, 21])],
  ["winooski-development", "Winooski Development", "Housing and economic development photographed in Winooski.", [...take("winooski-development", [1, 2, 3, 4, 5, 6, 7, 8, 9]), ...linked([6, 9])]],
  ["cots-financial-literacy", "COTS Financial Literacy", "EastRise staff sharing practical financial education with COTS participants.", [...community.images.slice(0, 3), ...linked([12])]],
  ["people-and-financial-counseling", "EastRise Staff at Work", "EastRise staff and financial counselors photographed in their working environment.", take("people-and-financial-counseling", [1, 2])],
  ["formal-headshots", "Formal Headshots", "Formal studio-style portraits made for EastRise public profiles.", linked([3, 17, 18])],
  ["eastrise-candid-portraits", "EastRise Candid Portraits", "Candid portraits of EastRise leaders and staff.", linked([1])],
  ["wood-for-good", "Wood for Good", "EastRise volunteers splitting and stacking firewood for neighbors.", [...take("wood-for-good", [1]), ...community.images.slice(3, 12), ...linked([5, 11, 15])]],
  ["wheels-for-warmth-2024", "Wheels for Warmth 2024", "The 2024 tire collection photographed across volunteers, donors, and the work site.", community.images.slice(14, 24)],
  ["veggievango-east-rise", "VeggieVanGo with EastRise", "EastRise staff supporting the Vermont Foodbank's VeggieVanGo distribution.", community.images.slice(26, 36)],
  ["veggievango-taylor-hoar", "VeggieVanGo with Taylor Hoar", "Taylor Hoar joining EastRise and the Vermont Foodbank for a VeggieVanGo distribution.", take("veggievango", [1, 2, 3, 4])],
  ["taylor-hoar-racing", "Taylor Hoar Racing", "Race days, portraits, and sponsor storytelling from Thunder Road.", [...take("taylor-hoar-racing", Array.from({ length: 36 }, (_, index) => index + 1)), ...linked([2, 19])]],
  ["eastrise-launch", "EastRise Launch", "Photography made for the 2024 EastRise brand launch and its first public campaign.", [...businessStories.images.slice(0, 12), businessStories.images[13], businessStories.images[12], businessStories.images[14], businessStories.images[16], businessStories.images[17], businessStories.images[19], businessStories.images[20], ...linked([4, 16, 23]), community.images[24]].filter(Boolean)],
];

data.series = definitions.map(([slug, title, description, images]) => ({
  slug,
  title,
  description,
  images,
  ...(slug === "karina-and-ryan" ? { videoId: "bFtuCFhGZQg" } : {}),
}));
data.totalImages = data.series.reduce((total, series) => total + series.images.length, 0);
data.curatedAt = "2026-07-30";
await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Curated ${data.totalImages} EastRise photographs into ${data.series.length} named projects.`);
