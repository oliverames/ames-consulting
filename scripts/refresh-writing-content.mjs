import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const exec = promisify(execFile);
// One hung feed API should fail loudly instead of stalling the whole refresh.
const FETCH_TIMEOUT_MS = 30_000;
const eastRiseSource = join(homedir(), "My Drive (Personal)", "Career", "Work Samples", "Oliver's EastRise Blog Posts.csv");
const linkedInProfileUrl = "https://www.linkedin.com/in/oliverames";

function parseCsvLine(line) {
  const fields = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      fields.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  fields.push(value);
  return fields;
}

function stripHtml(value = "") {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&rsquo;", "’")
    .replaceAll("&lsquo;", "‘")
    .replaceAll("&ldquo;", "“")
    .replaceAll("&rdquo;", "”")
    .replaceAll("&mdash;", "—")
    .replaceAll("&ndash;", "–")
    .replaceAll("&hellip;", "…")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .trim();
}

function bskyUrl(uri) {
  const postId = uri.split("/").pop();
  return `https://bsky.app/profile/oliverames.bsky.social/post/${postId}`;
}

async function json(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "ames.consulting writing archive" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return response.json();
}

function socialCrawlKey() {
  return process.env.SOCIALCRAWL_API_KEY || "";
}

function linkedInDate(id) {
  return new Date(Number(BigInt(id) >> 22n)).toISOString();
}

function linkedInActivityId(post) {
  return post.url?.match(/activity:(\d+)/)?.[1] || post.id;
}

async function currentLinkedInPosts() {
  const key = await socialCrawlKey();
  if (!key) {
    console.warn("SOCIALCRAWL_API_KEY is unavailable; retaining the checked-in LinkedIn archive.");
    const checkedIn = JSON.parse(
      await readFile(join(root, "assets/data/writing-feed.json"), "utf8"),
    );
    return checkedIn.posts
      .filter((post) => post.platforms?.includes("LinkedIn"))
      .map((post) => ({
        id: post.id.replace(/^linkedin:/, ""),
        ugcPostId: post.ugcPostId,
        date: post.date,
        text: post.text,
        url: post.links.find((link) => link.platform === "LinkedIn")?.url,
        image: post.image,
        assetId: post.assetId,
        localImage: post.localImage,
        mediaSource: post.mediaSource,
        sharedPost: post.sharedPost,
        media: post.media,
      }));
  }

  const url = new URL("https://www.socialcrawl.dev/v1/linkedin/profile/posts");
  url.searchParams.set("url", linkedInProfileUrl);
  url.searchParams.set("count", "100");
  const response = await fetch(url, {
    headers: {
      "User-Agent": "ames.consulting writing archive",
      "x-api-key": key,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${response.status} while refreshing LinkedIn posts`);
  const payload = await response.json();
  if (!payload.success || !Array.isArray(payload.data?.items)) {
    throw new Error("SocialCrawl returned an invalid LinkedIn profile-post response.");
  }
  return payload.data.items.map(({ post }) => {
    const activityId = linkedInActivityId(post);
    return {
      id: activityId,
      ugcPostId: post.id,
      date: linkedInDate(post.id),
      text: post.content?.text || "",
      url: `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}/`,
      mediaUrls: post.content?.media_urls || [],
    };
  });
}

let eastRise;
try {
  const csv = await readFile(eastRiseSource, "utf8");
  eastRise = csv.trim().split(/\r?\n/).slice(1).map((line, index) => {
    const [title, date, category, url] = parseCsvLine(line);
    return {
      id: index + 1,
      title,
      date: date === "Not Available" ? null : date,
      category: category === "Not Available" ? "Technology & Banking" : category,
      url: title === "Page Not Found (404)" ? null : url,
      available: title !== "Page Not Found (404)",
      archivedTitle: title === "Page Not Found (404)" ? "A Comprehensive Guide to EV Charging Apps" : null
    };
  });
} catch {
  eastRise = JSON.parse(await readFile(join(root, "assets/data/eastrise-writing.json"), "utf8")).articles;
}

const micro = await json("https://oliverames.micro.blog/feed.json");
const mastodonAccount = await json("https://mastodon.social/api/v1/accounts/lookup?acct=oliverames");
const mastodon = await json(`https://mastodon.social/api/v1/accounts/${mastodonAccount.id}/statuses?exclude_reblogs=true&exclude_replies=true&limit=20`);
const bluesky = await json("https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=oliverames.bsky.social&filter=posts_no_replies&limit=20");

const threadsOriginals = [
  { id: "Da0B9d1kdGK", date: "2026-07-15T00:00:00Z", text: "I’m so happy for them 😭😭😭" },
  { id: "Day64kCkVIk", date: "2026-07-14T00:00:00Z", text: "Crazy stuff. This is the fire, I think, creating the smoke haze in Vermont today." },
  { id: "Dau6BiVEYGY", date: "2026-07-13T00:00:00Z", text: "Slava Ukraini! 🇺🇦" },
  { id: "Dak4hmSEXjO", date: "2026-07-09T00:00:00Z", text: "The team that made this video truly cooked. Marketing at its finest!" }
];

const sharedImage = (filename, alt, width, height) => ({
  type: "image",
  src: `assets/images/writing/shared/${filename}`,
  alt,
  width,
  height,
});

const sharedPostMedia = {
  pride: [{
    type: "image",
    src: "assets/images/writing/dbd9983745d2.webp",
    alt: "Pride Month graphic reading Proud to care for all Vermonters",
    width: 800,
    height: 800,
  }],
  corporateCup: [
    ["corporate-cup-01.webp", "Participants gather for the Corporate Cup on the Vermont State House steps."],
    ["corporate-cup-02.webp", "A participant walks beneath a colorful umbrella during the rainy Corporate Cup."],
    ["corporate-cup-03.webp", "Two Corporate Cup participants walk together in the rain."],
    ["corporate-cup-04.webp", "Two women talk beneath umbrellas during the Corporate Cup."],
    ["corporate-cup-05.webp", "A smiling Corporate Cup participant in a pink coat stands beneath an umbrella."],
    ["corporate-cup-06.webp", "Two Corporate Cup participants talk beneath an umbrella."],
    ["corporate-cup-07.webp", "A large crowd gathers on the Vermont State House lawn for the Corporate Cup."],
    ["corporate-cup-08.webp", "The back of a blue 2026 Corporate Cup participant shirt."],
    ["corporate-cup-09.webp", "Two Corporate Cup participants smile beneath a rainbow umbrella."],
  ].map(([filename, alt]) => sharedImage(filename, alt, 1280, 853)),
  greenUp: [
    ["green-up-01.webp", "Five volunteers pose with green cleanup bags beside a road.", 1080, 720],
    ["green-up-02.webp", "Three volunteers walk beside blue cleanup equipment.", 1080, 720],
    ["green-up-03.webp", "Four Green Up Day volunteers stand together in safety vests.", 720, 720],
    ["green-up-04.webp", "A volunteer collects roadside litter on Green Up Day.", 1080, 720],
    ["green-up-05.webp", "A volunteer in a safety vest works among roadside brush.", 720, 1079],
    ["green-up-06.webp", "Two volunteers walk together carrying green cleanup bags.", 1080, 720],
    ["green-up-07.webp", "Four volunteers hold cleanup bags with Vermont mountains behind them.", 1080, 720],
    ["green-up-08.webp", "A volunteer in a striped shirt and safety vest pauses during Green Up Day.", 720, 960],
    ["green-up-09.webp", "A group of Green Up Day volunteers walks along a rural road.", 1124, 720],
    ["green-up-10.webp", "A volunteer lifts a green cleanup bag on a grassy hillside.", 720, 720],
  ].map(([filename, alt, width, height]) => sharedImage(filename, alt, width, height)),
};

const linkedInMediaAlts = new Map(Object.entries({
  "7446964935219224576": [
    "A woman speaks at a State House podium beside supporters and a sign calling for lower prescription drug costs.",
    "An empty State House podium displays a green sign reading ‘Cut Prescription Drug Costs: Make Medicine More Affordable.’",
    "A man in a navy suit and red tie speaks to reporters at the State House.",
  ],
  "7443387205353504768": [
    "A panoramic office view shows snow-covered fields, wooded hills, and distant Vermont mountains beneath a blue sky.",
  ],
  "7439306853655707650": [
    "The Blue Cross and Blue Shield of Vermont sign glows in late-day sunlight above a snow-covered hedge.",
  ],
  "7427369442927341568": [
    "The Sunshine Trail website displays an interactive East Coast map, community stops, and a live-impact panel.",
  ],
  "7424637123200221184": [
    "A teenage Oliver Ames wearing Rotary exchange pins stands beside a woman holding a Rotary gala program.",
  ],
  "7422289170049523714": [
    "A city bus carries an EastRise Credit Union wrap featuring a member portrait and the credit union’s branding.",
  ],
  "7397604744460025856": [
    "Race car driver Taylor Hoar poses in her EastRise racing suit with a helmet in front of her No. 48 car.",
  ],
  "7396613980082950144": [
    "Oliver Ames takes a rainy racetrack selfie in an orange jacket and reflective safety vest while holding a camera.",
  ],
  "7396253468706971648": [
    "Oliver Ames smiles for an indoor selfie while wearing a teal jacket.",
    "A large white BETA Technologies facility stands on a grassy slope beneath dark clouds.",
  ],
}));

function applyLinkedInMediaAlts(post) {
  const alts = linkedInMediaAlts.get(post.id);
  if (!alts || !post.media?.length) return post;
  if (alts.length !== post.media.length) {
    throw new Error(`LinkedIn media alt count does not match ${post.id}.`);
  }
  return {
    ...post,
    media: post.media.map((item, index) => ({ ...item, alt: alts[index] })),
  };
}

const linkedInFeed = await currentLinkedInPosts();

const linkedinOriginals = [
  {
    id: "7493102298634776576",
    ugcPostId: "7493102297154203648",
    date: "2026-08-12T00:33:22.750Z",
    text: "This Monday I had the honor and privilege to photograph the 47th New England Governors and Eastern Canadian Premiers Conference (NEG-ECP) at Shelburne Farms. Check out a few of my favorite shots from the day. 👇\n\nIn addition to the esteemed Heads of Delegation, special guests included Kyle Clark of BETA TECHNOLOGIES, U.S. Representative Becca Balint, and U.S. Senator Peter Welch.\n\nEnergy and affordability came up in nearly every conversation we had, and it was remarkable to hear people actually discuss ideas. It was far from how I'd imagined conversations like this would go, and what I heard instead was real warmth between them, and real respect for their constituents. It's how I grew up hoping politics would work, like I'd wandered into an episode of The West Wing.\n\nGovernor Phil Scott put the day in a sentence at the press conference: \"Our relationships are our most critical infrastructure.\"\n\nThanks to Amanda Wheeler for the introduction that put me in the room, and to Alex Demoly and everyone at GBIC: Greater Burlington Industrial Corporation for trusting me with the day.",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7493102298634776576/",
    media: [
      ["assets/images/work/events/neg-ecp-conference-2026/dsc00383.webp", "A row of delegates listens from behind microphones and nameplates inside the Coach Barn.", 1600, 1067],
      ["assets/images/work/events/neg-ecp-conference-2026/dsc00262.webp", "A delegate wearing glasses speaks with another attendee during the morning arrival.", 1600, 1067],
      ["assets/images/writing/linkedin/7493102297154203648-03.webp", "A smiling delegate in an orange blouse reacts during a conference discussion.", 1280, 853],
      ["assets/images/work/events/neg-ecp-conference-2026/dsc00759.webp", "Black-and-white side view of delegates seated shoulder to shoulder behind tabletop microphones.", 1600, 1067],
      ["assets/images/work/events/neg-ecp-conference-2026/dsc01227.webp", "Four delegates smile behind microphones with United States and Canadian flags behind them.", 1600, 1067],
      ["assets/images/work/events/neg-ecp-conference-2026/dsc00820.webp", "A gray-haired delegate leans forward to address the room from across the conference table.", 1600, 1067],
      ["assets/images/work/events/neg-ecp-conference-2026/dsc00562.webp", "A speaker is framed between blurred attendees in a black-and-white view across the table.", 1600, 1067],
      ["assets/images/work/events/neg-ecp-conference-2026/dsc01378.webp", "A summit delegate gestures while speaking beneath United States and Canadian flags inside the Coach Barn.", 1600, 1067],
      ["assets/images/work/events/neg-ecp-conference-2026/dsc00937.webp", "A delegate wearing glasses listens beside a colleague in a black-and-white photograph.", 1600, 1067],
      ["assets/images/work/events/neg-ecp-conference-2026/dsc00735.webp", "A bearded delegate wearing glasses speaks into a microphone during the working session.", 1600, 1067],
      ["assets/images/work/events/neg-ecp-conference-2026/dsc00781.webp", "A delegate listens across the table with a Canadian flag filling the foreground.", 1067, 1600],
      ["assets/images/work/events/neg-ecp-conference-2026/dsc00341.webp", "A smiling speaker addresses the room at a microphone in a black-and-white photograph.", 1600, 1067],
    ].map(([src, alt, width, height]) => ({ type: "image", src, alt, width, height })),
  },
  {
    id: "7467314005167054848",
    assetId: "linkedin:pride-month-2026",
    date: "2026-06-01T20:39:54.817Z",
    text: "I've sat in enough marketing meetings to know how easily a post like this gets hedged into nothing, and this one didn't. That says a lot about the people I work with and the organization behind it. Proud of both. 💙\n\nHappy #PrideMonth, #Vermont! 🌈",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7467314005167054848/",
    image: "",
    localImage: true,
    mediaSource: "https://www.linkedin.com/feed/update/urn:li:activity:7467227840711819264/",
    sharedPost: {
      author: "Blue Cross and Blue Shield of Vermont",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7467227840711819264/",
      text: "Pride Month is a good time to say something plainly: LGBTQ+ Vermonters deserve care that respects who they are, because feeling safe and seen is part of being healthy.\n\nAt Blue Cross and Blue Shield of Vermont, whole person care means supporting both body and mind, so our member benefits include access to mental health counseling. In addition, we offer personalized, voluntary, no-cost support to navigate gender affirming services from our expert team of nurses and social workers.\n\nWe’re proud to support organizations like Outright Vermont, the Pride Center of Vermont, and the Barre People's Health & Wellness Clinic, which partners with the Rainbow Bridge Community Center to help community members access youth and family support, crisis resources, and free affirming care information.\n\nStart with mental health support resources: https://lnkd.in/eXKRjT-h",
      media: sharedPostMedia.pride,
    },
  },
  {
    id: "7460836075540799489",
    date: "2026-05-14T23:38:56.040Z",
    text: "Three posts in one day? That can't be good for my reach! I just can't help it but to share the lovely faces of my new friends and colleagues at Blue Cross and Blue Shield of Vermont. 💙\n\nSpecial shoutout to my buddies from EastRise Credit Union! I'm glad I got the opportunity to say \"howdy\" and take your picture. 🧡",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7460836075540799489/",
    image: "",
    sharedPost: {
      author: "Blue Cross and Blue Shield of Vermont",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7460834826116538368/",
      media: sharedPostMedia.corporateCup,
    },
  },
  {
    id: "7460782290340843520",
    date: "2026-05-14T20:05:12.649Z",
    text: "Before I stepped into my new role at Blue Cross and Blue Shield of Vermont, I had the chance to do something I'd honestly dreamed about for years: work with the team at BETA TECHNOLOGIES.\n\nIt started as a contract to produce a series of workforce development videos for BETA’s manufacturing team, but from the first day of research through the final edit, it became something I’ll carry with me for a long time.\n\nI got to sit across from people who found their way to BETA through discovery flights, trade school programs, recoveries from serious accidents, and doors that probably weren’t supposed to open this far.\n\nThey’re building real careers in #Vermont manufacturing across quality, composites, assembly, and motors. Many of them wouldn’t be here (in some cases, wouldn’t even be in Vermont) if BETA wasn’t here too.\n\nSarah Deshaw, BETA's Workforce Development Lead, put it better than I could: \"When we invest in people here, we're investing in Vermont.\"\n\nJerry Ricciotti, Andrew Rowley, Colby Mesick — thank you for bringing me in. It meant more than you know. I hope we have a chance to work together again in the future!\n\n#Vermont #ElectricAviation #VideoProduction #BETATechnologies #WorkforceDevelopment",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7460782290340843520/",
    image: "",
    sharedPost: {
      author: "BETA TECHNOLOGIES",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7460776055541501953/",
      text: "Emma joined BETA through our partnership with the Community College of Vermont's Career Pathway Entry Program, building new skills and finding a pathway into electric aerospace.\n\nThere’s more than one way to get here. From first jobs to career changes, we’re hiring.\n\nCome build electric airplanes with us at careers.beta.team",
      media: [{
        type: "youtube",
        videoId: "4r5N5DjmSCU",
        title: "Flight Paths: Emma at BETA",
        poster: "assets/images/work/campaigns/flight-paths.webp",
      }],
    },
  },
  {
    id: "7460781094884421632",
    date: "2026-05-14T20:00:27.630Z",
    text: "Will was such a joy to work with on this shoot for EastRise Credit Union!",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7460781094884421632/",
    image: "",
    sharedPost: {
      author: "EastRise Credit Union",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7457506573163098113/",
      media: [{
        type: "youtube",
        videoId: "fAF3x-Iu2Bo",
        title: "EastRise is Here to Help You Reach Your Goals",
        poster: "assets/images/work/campaigns/will-barbecue.webp",
      }],
    },
  },
  {
    id: "7455326793370320897",
    date: "2026-04-29T18:47:00.813Z",
    text: "Another #GreenUpDay in the books! Loved getting out in the sunshine with the crew from Blue Cross and Blue Shield of Vermont and helping keep Vermont #Green. 💚💙",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7455326793370320897/",
    image: "",
    sharedPost: {
      author: "Blue Cross and Blue Shield of Vermont",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7455324792846725120/",
      media: sharedPostMedia.greenUp,
    },
  },
  {
    id: "7450594949588316160",
    date: "2026-04-16T17:24:21.342Z",
    text: "Proud to work for Blue Cross and Blue Shield of Vermont! The work that Vermont Businesses for Social Responsibility (VBSR) members do is critical to the future of our state.\n\nThanks for hosting BETA TECHNOLOGIES! I knew our paths would cross again soon. 🛫 #Vermont",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7450594949588316160/",
    image: "",
    sharedPost: {
      author: "Blue Cross and Blue Shield of Vermont",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7450593597449527296/",
      text: "Tuesday's Vermont Businesses for Social Responsibility (VBSR) Get-Together at BETA TECHNOLOGIES brought together Vermont employers who've committed to running their businesses in a way that's accountable to workers, community, and environment. Good conversations, and a lot to take back to the work ahead!\n\n📸 BETA TECHNOLOGIES/Brian Jenkins",
    },
  },
  {
    id: "7443387205353504768",
    date: "2026-03-27T20:03:21.203Z",
    text: "Not a bad view from the new office! #Vermont",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7443387205353504768/",
    image: "",
  },
  {
    id: "7440378580276203521",
    date: "2026-03-19T12:48:09.087Z",
    text: "Incredible first week at Blue Cross and Blue Shield of Vermont! What a way to cap it off, seeing many new and old faces in the State House. I'm pretty sure there was someone there from nearly stage of my life so far. Did I mention the athletes? Wow! What an inspiration. 💪",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7440378580276203521/",
    image: "",
    localImage: true,
    mediaSource: "https://www.linkedin.com/feed/update/urn:li:activity:7440377520501387266/",
    sharedPost: {
      author: "Blue Cross and Blue Shield of Vermont",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7440377520501387266/",
      text: "We’re proud to be the presenting sponsor of this year's Vermont Senior Games (National Senior Games Association)! 🏅\n\nYesterday at the State House, our President and CEO Beth Roberts joined Governor Phil Scott to celebrate the athletes who competed in the national games. At 50 and up, these Vermonters are proof of what is possible when you prioritize your health.\n\nExercise can be the best medicine, and we’re honored to support an organization that shares our goal of a healthy #Vermont. vermontseniorgames.org\n\n#HealthyAging #VermontSeniorGames #SeniorGames",
    },
  },
  {
    id: "7439306853655707650",
    date: "2026-03-16T13:49:29.549Z",
    text: "I'm excited to share that I've joined Blue Cross and Blue Shield of Vermont! I'll be supporting the organization and the brand team as their Social Media Strategist.\n\nAfter nearly seven years building what became one of Vermont's most engaging social media presences at EastRise Credit Union, I'm bringing that same energy to an organization whose mission hits close to home: helping Vermonters access quality, affordable healthcare.\n\nVermont is a small state with big challenges and healthcare is at the center of so many of them. I'm excited to tell stories that matter, build community, and help people understand the resources available to them. That's always been what I love most about this work: using digital platforms to connect real people with things that actually improve their lives.\n\nBeth Wirsul, you were my dance partner through this entire process, from the very first phone call to the day I signed. Your professionalism, warmth, and transparency set the tone for everything that followed. I knew I'd be joining a team that values doing the work well and treating people right.\n\nTo everyone who supported me during the search, the advisors, the references, the friends who listened, the people who made introductions and sent encouragement when I needed it most, THANK YOU! The past few months taught me a lot about patience, persistence, and the value of genuine relationships.\n\nHere's to the next chapter! Let's go, Vermont. 💪\n\n#BlueCrossVT #SocialMediaStrategy #Vermont",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7439306853655707650/",
    image: "",
  },
  {
    id: "7427369442927341568",
    date: "2026-02-11T15:14:29.045Z",
    text: "I spend a lot of my free time thinking about how the brands I love in Vermont could push their digital experiences further. I can’t help it! I see a brand doing something great and I immediately start thinking about what else they could build.\n\nI’ll give you an example.\n\nLawson’s Finest Liquids is one of Vermont’s most beloved craft breweries, and they’re in the middle of expanding into new markets along the East Coast. Their brand is incredible, their community impact is real, and their commitment to freshness is central to everything they do. But that story is mostly told through a traditional website. I kept thinking: what if you could experience that expansion as a journey?\n\nSo I built The Sunshine Trail, an interactive map that connects Lawson’s home in Waitsfield, Vermont to Asheville, North Carolina. 791 miles of mountain communities, outdoor adventures, and cold beer.\n\nThe map shows every Lawson’s location I could identify (breweries, retailers, bars, restaurants) alongside hiking trails, river put-ins, community partners, and DC fast chargers along a scenic road trip route through the Blue Ridge Parkway, Skyline Drive, and Vermont Route 100. Every design element pulls directly from Lawson’s brand: their colors, their fonts, their custom SVGs, even the signature wave animation from their website. It should feel like something Lawson’s built themselves.\n\nBut the details are where it gets fun. Hover over “Sunshine” in the header and god rays shoot across the page. On HDR displays, the sun pushes brightness beyond standard range. Hover over “Cold Beer” and it starts snowing, a nod to their chain of freshness promise. The Sip of Sunshine logo spins with real momentum physics, and clicking it launches emoji bursts. None of these get in the way if you’re just there for the map. That’s the whole point of them being Easter eggs.\n\nThe live impact widget projects real historical data forward, showing dollars raised and solar energy generated ticking up in real time. Community partner popups tell actual impact stories with donate buttons linking directly to each organization. An email capture modal triggers after 30 seconds on the route view, creating a natural top-of-funnel opportunity with genuine value exchange: a curated road trip itinerary.\n\nI built the whole thing with Claude as a coding partner, tested it across 15 screen sizes, and added full accessibility support throughout. On mobile, tilting your phone creates wind that blows the snowflakes. The map expands when you tap a marker so you have room to actually read the popup. Every interaction is designed to teach you how to use the site without having to explain anything.\n\nIf you want to explore it, the site is live at thesunshinetrail.com. It's password protected, so use \"linkedin\" to get in. Let me know what you think in the comments! 👇\n\n#DigitalMarketing #CraftBeer #Vermont #AI #WebDevelopment #BrandStrategy",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7427369442927341568/",
    image: "",
  },
  {
    id: "7424637123200221184",
    date: "2026-02-04T02:17:13.258Z",
    text: "After a busy few months, I'm thrilled to share some news: I'm officially a member of the Montpelier Rotary Club.\n\nRotary has been part of my story since I was sixteen. Charles Hogan and the Cambridge Rotary Club took a chance on me and sent me to Belgium for a year through their Youth Exchange program. That experience was unforgettable!\n\nNow, what feels like a short time later, I'm excited to be officially joining. Local community organizations like Rotary are exactly what we need right now. Real people, doing real work, in real places.\n\nThank you to Marc Gwinn and Mark Provost for sponsoring me. And to Charles Hogan and everyone at Cambridge Rotary who believed in a teenager with big ideas way back when.\n\nLooking forward to doing some good work with this crew.\n\nIf you're still following me from those days, say hi in the comments! I have so many wonderful memories of Rotary, of Belgium, of host families and late-night conversations and figuring out who I was going to be. Would love to reconnect.\n\n#Rotary #Vermont #Community #YouthExchange",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7424637123200221184/",
    image: "",
  },
  {
    id: "7422289170049523714",
    date: "2026-01-28T14:47:17.604Z",
    text: "It's not every day you see a photo you took on a bus! 🚌\n\nI was the professional photographer for EastRise Credit Union during my time there, doing imagery for everything from brand development all the way through our campaigns in late 2025 and 2026. I'm mostly a digital content guy, but there's truly nothing more special than seeing your work out in the world — on a bus, no less!\n\nAs a kid, I thought pictures on NYC buses were the highest form of advertising. Only the most prestigious brands could afford to advertise there. 🤭 That's still kind of how I feel? Seeing this in the wild, unexpectedly, was a moment.\n\nI started as a passionate hobbyist. EastRise helped me grow into a professional. They really do nurture their own, and I'm forever grateful for that.\n\nIf you ever need photography for your business, I'm around! I'd love to chat.",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7422289170049523714/",
    image: "",
    localImage: true,
    mediaSource: "https://www.linkedin.com/feed/update/urn:li:activity:7422289170049523714/",
  },
  {
    id: "7407619780834246657",
    date: "2025-12-19T03:16:22.671Z",
    text: "This was an incredible project to be involved in. There are limited opportunities to launch a new brand, and it was an honor to get to play a small part in this one! Kudos to the whole team at Adrenaline and EastRise Credit Union. 🙌",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7407619780834246657/",
    image: "",
    sharedPost: {
      author: "Adrenaline",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7401666966333202432/",
      text: "Brand and culture must work together to shape a cohesive organization from the inside out. See how these two merging credit union brands built upon a bold new brand identity, successfully integrating two cultures into a singular institution with a strong brand purpose. https://hubs.ly/Q03VgMYg0",
    },
  },
  {
    id: "7397604744460025856",
    date: "2025-11-21T12:00:11.929Z",
    text: "Working with Taylor Hoar was a highlight of my time at EastRise Credit Union.\n\nTaylor made history in 2025 as the first Vermonter ever selected for the prestigious Kulwicki Driver Development Program, becoming the first female finalist since 2022. At Thunder Road, she earned a podium finish in the Squier Cup and continues to prove herself in one of short track racing's most competitive environments.\n\nBut here's what I'll remember most:\n\nIt wasn't just her performance on the track—it was how she showed up everywhere else. Four years with Race to Read. Volunteering at the Vermont Foodbank. Bringing hope to kids at CAMP TA-KUM-TA.\n\nTaylor embodied something I see in Vermont's best: the drive to excel in your craft while lifting up the community around you.\n\nI'll see you on the high banks, Taylor! Keep showing #Vermont what hard work and heart can accomplish.\n\nOne of my favorite shots from 2025 📸 https://lnkd.in/etur9Gy8",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7397604744460025856/",
    image: "",
    localImage: true,
    mediaSource: "https://www.linkedin.com/feed/update/urn:li:activity:7397604744460025856/",
  },
  {
    id: "7396613980082950144",
    date: "2025-11-18T18:23:15.294Z",
    text: "After nearly seven years at EastRise Credit Union, I'm exploring what's next.\n\nIt's been a significant chapter. I arrived when we were VSECU, helped build Vermont's most engaging credit union social media presence, and navigated a complete organizational merger and rebrand. I'm proud of what we built—from a viral cow that raised funds for members during COVID, to content that consistently outperformed organizations many times our size, to establishing EastRise's digital voice.\n\nThanks to my wonderful colleagues—from facilities and branch teams to my compatriots in marketing. Y'all do great work, and I'm looking forward to seeing what you do next. I'm particularly thankful to Jevonne for her guidance and leadership.\n\nTo the members I got the pleasure of working with, you're incredible.\n\nWhen I graduated high school right here in Morrisville, Vermont, I thought I'd be looking outside the state for a meaningful career. I'm so happy that I chose to build that right here, along with my beautiful family.\n\nThe work mattered because it helped Vermonters understand that financial empowerment isn't intimidating—it's accessible. That's always been the thread through my career: making complex things clear, whether it's astronomy, independent journalism, or why your local credit union actually gives a damn about your financial future.\n\nI'm really excited for this next chapter. I'm looking for what's next—ideally with mission-driven organizations that prioritize authentic community connection. I thrive in innovative, data-driven environments, and where someone can be equally comfortable in a strategy meeting or behind the camera.\n\nThat intersection—where data meets storytelling—is where I thrive. I’m looking forward to finding the next place to do exactly that.",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7396613980082950144/",
    image: "",
  },
  {
    id: "7396253468706971648",
    date: "2025-11-17T18:30:42.684Z",
    text: "As a sixth-generation Vermonter, I had an incredible experience at BETA TECHNOLOGIES' Career Day yesterday. I couldn't be prouder to see our state leading the charge in electric aviation.\n\nWhat struck me most was how BETA embodies Vermont values while tackling global challenges. This isn't just about electric aircraft; it's about proving that transformative technology can emerge from a state that's always balanced innovation with purpose.\n\nWalking through the South Burlington facility, the scale, innovation, and genuine passion of the team were truly inspiring. This is Vermont manufacturing at its finest – sustainable, innovative, and built by people who genuinely care about the mission. Great to see this opportunity for graduates from University of Vermont and Vermont State University!\n\nThank you to everyone at BETA who took the time to share their perspectives. I'm incredibly excited about the future of sustainable aviation in Vermont, supported by a great tech ecosystem with partners like Vermont Manufacturing Extension Center (VMEC) and the Vermont Department of Labor.\n\n✈️⚡ #ElectricAviation #VermontInnovation #SustainableTransportation #BETATechnologies #Vermont #VT #VTtech #MadeinVermont #VermontBusiness #Industry40",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7396253468706971648/",
    image: "",
  },
  {
    id: "7392623143162650626",
    date: "2025-11-07T18:05:05.626Z",
    text: "Can’t think of anyone who deserves this more than Ibby. He’s been supporting us on social and the results have been stellar. Can’t believe he takes on so much! Way to go Ibby Wilson. 💚",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7392623143162650626/",
    image: "",
    sharedPost: {
      author: "EastRise Credit Union",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7392622065939550208/",
    },
  },
  {
    id: "7392295981154836481",
    date: "2025-11-06T20:25:04.125Z",
    text: "Whatever you think of AI, Federico Viticci is doing some great blogging over at MacStories. I particularly love the ways he's discovered to integrate Claude and Google Gemini. Truly using the two best tools out there.\n\n\"I’d also point out another advantage for implementing Gemini in Private Cloud Compute: it’s natively multimodal, and it’s very good at dealing with image recognition, OCR, and audio transcription (which I started using months ago, and I recently implemented as a skill in Claude). The vision capabilities of Gemini could probably come in handy for the on-screen awareness features that Siri was supposed to receive before Apple delayed them.\"\n\nhttps://lnkd.in/eHBdBb7n",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7392295981154836481/",
    image: "",
  },
  {
    id: "7391846002045128705",
    date: "2025-11-05T14:37:00.745Z",
    text: "I'm excited to moderate \"Community at the Core\" at Hula with Habitat for Humanity Executive Director Rebekah Stephens and Eric Axelrod (Wood4Good). We'll be chatting about how to build partnerships that work with communities, not just in them, and what that distinction actually means in practice.\n\nBurlington Young Professionals, if you're building something in #Vermont and wondering how to avoid the \"parachute nonprofit\" trap or the generic corporate community playbook, this session is for you.\n\nSee you there.\n\n🪵 Wood4Good, LTD. Warming Homes and Hearts",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7391846002045128705/",
    image: "",
    sharedPost: {
      author: "Hula",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7391491913914228736/",
    },
  },
  {
    id: "7391841822555414528",
    date: "2025-11-05T14:20:24.277Z",
    text: "Great social video needs two things most organizations struggle with: creators brave enough to be authentic on camera, and leaders willing to approve content that doesn't look \"corporate perfect.\"\n\nThat discomfort is the signal you're doing it right.",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7391841822555414528/",
    image: "",
    sharedPost: {
      author: "Marion Abrams",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7391096344867659777/",
      text: "When I hear teams worry about creating video content because they are afraid it requires special skills like editing, I tell them, \"Yes, it does.\" All the other things your team does require skills, why would this be different?\n\nDoesn't mean you can't learn them. But of course good creative work takes skills...",
    },
  },
  {
    id: "7389730138382422016",
    date: "2025-10-30T18:29:19.537Z",
    text: "Our October social media performance just peaked. One post. One event sponsorship. Our most shared post of the year. (Keep reading for the link!)\n\nEastRise Credit Union sponsored Wheels for Warmth—a tire donation drive supporting heating assistance for Vermonters heading into winter. But here's what made the difference:\n\nWe didn't post \"proud sponsor\" graphics. We made a practical guide. \"Here's exactly what you need to know before Saturday's tire sale.\" 🛞\n\nThe result? More shares than we've seen on any post this year. Most of the people who engaged weren't even following us yet. They found it worth passing along.\n\n🔗 https://lnkd.in/eAjuZYbJ\n\nHere's what we learned: People don't engage with institutions. They engage with their neighbors.\n\nInstead of corporate speak about \"community commitment,\" we leaned into Vermont culture—the real stuff. Halloween content with local humor. Employee spotlights featuring actual team members like Macey in our branches. Instagram Stories that performed because they felt like they came from a friend, not a financial brand.\n\nThe ROI? Our Thunder Road racing partnership with Taylor Hoar didn't just put our logo on a car—it brought her racing audience directly to our channels. That's athlete amplification working as it should.\n\nBut the real metric: heating assistance for Vermonters heading into winter.\nThe social media lesson?\n\n\"Vermont life meets internet culture\" works because it's specific. Generic \"community-focused\" content dies in the feed. Content that shows you actually understand the place you're in—that gets shared.\n\nFinancial institutions have an authenticity problem. The fix isn't better branding. It's actually being part of your community and proving it through every post.\n\nWhat's your take—are you seeing authentic local content outperform corporate messaging in your feeds? Let me know in the comments. 👇\n\n#SocialMediaStrategy #CommunityBanking #VermontBusiness #ContentStrategy #CreditUnion Filene Research Institute Global Alliance for Banking on Values #Vermont #DigitalContent",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7389730138382422016/",
    image: "",
  },
];

const linkedInEditorial = new Map(linkedinOriginals.map((item) => [item.id, item]));
for (const item of linkedInFeed) {
  const editorial = linkedInEditorial.get(item.id);
  if (editorial) {
    linkedInEditorial.set(item.id, { ...item, ...editorial });
  } else {
    linkedInEditorial.set(item.id, item);
  }
}
const currentLinkedInOriginals = [...linkedInEditorial.values()].map(applyLinkedInMediaAlts);

function sanitizePublicArchiveText(post) {
  const text = post.text
    .replace(/\n*https?:\/\/indieweb\.social\/\S+/giu, "")
    .replace(/\n*indieweb\.social\/\S+/giu, "");
  return { ...post, text: text.replace(/\n{3,}/g, "\n\n").trim() };
}

const rawPosts = [
  ...micro.items.map((item) => ({
    id: `microblog:${item.id}`,
    platform: "Micro.blog",
    date: item.date_published,
    title: item.title || "",
    text: stripHtml(item.content_html || item.content_text || ""),
    url: item.url,
    image: item.image || item.attachments?.find((attachment) => attachment.mime_type?.startsWith("image/"))?.url || ""
  })),
  ...mastodon.map((item) => ({
    id: `mastodon:${item.id}`,
    platform: "Mastodon",
    date: item.created_at,
    title: "",
    text: stripHtml(item.content),
    url: item.url,
    image: item.media_attachments?.find((attachment) => attachment.type === "image")?.url || ""
  })),
  ...bluesky.feed.filter((item) => !item.reason).map((item) => ({
    id: `bluesky:${item.post.uri}`,
    platform: "Bluesky",
    date: item.post.record.createdAt || item.post.indexedAt,
    title: "",
    text: item.post.record.text,
    url: bskyUrl(item.post.uri),
    image: item.post.embed?.images?.[0]?.fullsize || item.post.embed?.external?.thumb || ""
  })),
  ...threadsOriginals.map((item) => ({
    id: `threads:${item.id}`,
    platform: "Threads",
    date: item.date,
    title: "",
    text: item.text,
    url: `https://www.threads.com/@oliverames/post/${item.id}`,
    image: ""
  })),
  ...currentLinkedInOriginals.map((item) => ({
    id: `linkedin:${item.id}`,
    platform: "LinkedIn",
    date: item.date,
    title: "",
    text: item.text,
    url: item.url,
    image: item.image,
    assetId: item.assetId,
    localImage: item.localImage,
    mediaSource: item.mediaSource,
    sharedPost: item.sharedPost,
    media: item.media,
    mediaUrls: item.mediaUrls,
    ugcPostId: item.ugcPostId,
  }))
].filter((post) => post.text || post.title).map(sanitizePublicArchiveText);

for (const post of rawPosts) {
  if (post.title?.includes("The Sunshine Trail:")) {
    post.image = "https://cdn.uploads.micro.blog/92164/2026/the-sunshine-trail-screenshots.jpg";
  }
  if (post.title === "How I used AI to find what two service calls missed") {
    post.image = "";
    post.localImage = true;
    post.mediaSource = post.url;
  }
}

const grouped = new Map();
for (const post of rawPosts) {
  const key = `${post.title}\n${post.text}`.toLocaleLowerCase().replace(/\s+/g, " ").trim();
  const current = grouped.get(key);
  if (current) {
    if (!current.platforms.includes(post.platform)) current.platforms.push(post.platform);
    current.links.push({ platform: post.platform, url: post.url });
    if (new Date(post.date) > new Date(current.date)) current.date = post.date;
  } else {
    grouped.set(key, {
      id: post.id,
      platforms: [post.platform],
      links: [{ platform: post.platform, url: post.url }],
      date: post.date,
      title: post.title,
      text: post.text,
      image: post.image,
      assetId: post.assetId,
      localImage: post.localImage,
      mediaSource: post.mediaSource,
      sharedPost: post.sharedPost,
      media: post.media,
      mediaUrls: post.mediaUrls,
      ugcPostId: post.ugcPostId,
    });
  }
}
const posts = [...grouped.values()].sort((left, right) => new Date(right.date) - new Date(left.date));

const writingImageDirectory = join(root, "assets/images/writing");
await mkdir(writingImageDirectory, { recursive: true });
for (const post of posts.filter((item) => item.image)) {
  const response = await fetch(post.image, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${response.status} while downloading ${post.image}`);
  const stem = createHash("sha256").update(post.id).digest("hex").slice(0, 12);
  const source = join(writingImageDirectory, `${stem}.source`);
  const destination = join(writingImageDirectory, `${stem}.webp`);
  await writeFile(source, Buffer.from(await response.arrayBuffer()));
  await exec("/opt/homebrew/bin/magick", [source, "-auto-orient", "-resize", "1800x1800>", "-strip", "-quality", "86", destination]);
  await exec("/usr/bin/trash", [source]);
}

const linkedInImageDirectory = join(writingImageDirectory, "linkedin");
await mkdir(linkedInImageDirectory, { recursive: true });
for (const post of posts.filter((item) => item.mediaUrls?.length && !item.media?.length)) {
  const postId = post.id.replace(/^linkedin:/, "");
  const alts = linkedInMediaAlts.get(postId);
  if (!alts || alts.length !== post.mediaUrls.length) {
    throw new Error(`Add descriptive media alt text for LinkedIn post ${postId} before publishing it.`);
  }
  post.media = [];
  for (const [index, sourceUrl] of post.mediaUrls.entries()) {
    const filename = `${post.ugcPostId || post.id.replace(/^linkedin:/, "")}-${String(index + 1).padStart(2, "0")}.webp`;
    const destination = join(linkedInImageDirectory, filename);
    const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`${response.status} while downloading LinkedIn media ${sourceUrl}`);
    const image = sharp(Buffer.from(await response.arrayBuffer())).rotate().resize({
      width: 1800,
      height: 1800,
      fit: "inside",
      withoutEnlargement: true,
    }).webp({ quality: 86 });
    const { width, height } = await image.toFile(destination);
    post.media.push({
      type: "image",
      src: `assets/images/writing/linkedin/${filename}`,
      alt: alts[index],
      width,
      height,
    });
  }
}

for (const post of posts) {
  delete post.mediaUrls;
}

await writeFile(join(root, "assets/data/eastrise-writing.json"), `${JSON.stringify({ count: eastRise.length, articles: eastRise }, null, 2)}\n`);
await writeFile(join(root, "assets/data/writing-feed.json"), `${JSON.stringify({
  refreshedAt: new Date().toISOString(),
  canonicalBlog: "https://oliverames.micro.blog/",
  profiles: [
    { platform: "LinkedIn", url: "https://www.linkedin.com/in/oliverames", automated: true },
    { platform: "Micro.blog", url: "https://oliverames.micro.blog/", feed: "https://oliverames.micro.blog/feed.json", automated: true },
    { platform: "Mastodon", url: "https://mastodon.social/@oliverames", automated: true },
    { platform: "Bluesky", url: "https://bsky.app/profile/oliverames.bsky.social", automated: true },
    { platform: "Threads", url: "https://www.threads.com/@oliverames", automated: false },
    { platform: "Instagram", url: "https://www.instagram.com/oliverames/", automated: false }
  ],
  posts
}, null, 2)}\n`);

console.log(`Captured ${eastRise.length} EastRise articles and ${posts.length} personal posts.`);
