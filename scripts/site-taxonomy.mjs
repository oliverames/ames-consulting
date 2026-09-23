import { SERVICES as SERVICE_IDENTITIES } from "../assets/js/service-taxonomy.js";

const SERVICE_COPY = Object.freeze({
  "photography-and-video": Object.freeze({
    homeDescription: "Most of my work happens on location with people who have a job to do. I plan the shoot, then leave room for what actually happens.",
    aboutDescription: "I photograph people at work and produce documentary video.",
  }),
  "strategy-and-content": Object.freeze({
    homeDescription: "I write and plan content around the question a reader is trying to answer, then I check whether it worked.",
    aboutDescription: "I find out what people are asking, then plan and write the content needed to answer them.",
  }),
  "practical-technology": Object.freeze({
    homeDescription: "I build websites and apps. I also set up Square POS and UniFi systems and automate repetitive work.",
    aboutDescription: "I work on websites, content migrations, accessibility, analytics, and small automations.",
  }),
});

export const SERVICES = Object.freeze(
  SERVICE_IDENTITIES.map((service) => Object.freeze({ ...service, ...SERVICE_COPY[service.slug] })),
);

export const SERVICE_TITLES = Object.freeze(
  Object.fromEntries(SERVICES.map(({ slug, title }) => [slug, title])),
);

export const WORK_PROJECT_TITLES = Object.freeze({
  "apple-core": "Apple Core",
  "beta-technologies": "BETA Technologies",
  "bike-fitting": "Bike Fitting",
  bridgeport: "Bridgeport",
  "connecticut-college": "Connecticut College",
  "drone-photography": "Drone Photography",
  "fairbanks-planetarium": "Fairbanks Museum Planetarium",
  "flight-paths": "Flight Paths",
  "giron-family": "Giron Family Portrait Sessions",
  "green-mountain-community-fitness": "Green Mountain Community Fitness",
  "london-2019": "London at Dusk",
  "meta-mcp-server": "Meta MCP",
  "neg-ecp-conference-2026": "47th NEG-ECP Conference",
  "ping-warden": "Ping Warden",
  "skylight-bridge": "Skylight Bridge",
  "stowe-ski-instruction": "Stowe Ski Instruction",
  "sweat-heart-throwdown": "Sweat-Heart Throwdown",
  "vermont-foodbank-volunteer-day-2026": "Vermont Foodbank Volunteer Day",
  "vtdigger-membership": "VTDigger Membership",
  "whale-dance-randolph": "Whale Dance in Randolph",
  "ynab-mcp-server": "YNAB MCP",
});

export function workProjectTitleForRoute(route) {
  const match = route.match(/^\/work\/([^/]+)\/$/);
  return match ? WORK_PROJECT_TITLES[match[1]] || "" : "";
}
