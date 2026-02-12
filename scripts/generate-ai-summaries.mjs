#!/usr/bin/env node

/**
 * Generate AI summaries for blog posts using Mistral API
 * Usage: node scripts/generate-ai-summaries.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Configuration
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "efpjmkuwUNWJIXZG12IVghzUF0PHdyVb";
const MISTRAL_MODEL = "labs-mistral-small-creative";
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

// Writing style prompt based on user preferences
const STYLE_INSTRUCTIONS = `You write in a concise, focused style. Key principles:
- Direct and clear communication
- No unnecessary words or fluff
- Technical but accessible
- Get to the point quickly
- Avoid buzzwords and clichés`;

async function fetchMicroblogFeed(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch Micro.blog feed:", error.message);
    return null;
  }
}

async function loadLocalFallback() {
  try {
    const content = await readFile(join(projectRoot, "assets/data/content.example.json"), "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to load local fallback:", error.message);
    return null;
  }
}

function extractTextFromHtml(html) {
  // Simple HTML to text extraction
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateReadTime(text) {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

async function generateSummary(post) {
  const contentText = extractTextFromHtml(post.contentHtml || post.content || "");

  if (!contentText || contentText.length < 50) {
    console.log(`⚠️  Skipping "${post.title}" - content too short`);
    return null;
  }

  const prompt = `${STYLE_INSTRUCTIONS}

Based on the article below, write a single-sentence summary (max 20 words) that captures the core idea. Be direct and specific.

Article title: ${post.title}
Article content: ${contentText.slice(0, 2000)}

Summary:`;

  try {
    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Mistral API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content
      .trim()
      // Remove markdown formatting
      .replace(/\*\*"?/g, "")
      .replace(/"?\*\*/g, "")
      .replace(/^["']|["']$/g, "");

    console.log(`✓ Generated summary for "${post.title}"`);
    console.log(`  → ${summary}`);

    return summary;
  } catch (error) {
    console.error(`✗ Failed to generate summary for "${post.title}":`, error.message);
    return null;
  }
}

async function main() {
  console.log("🤖 Generating AI summaries for blog posts...\n");

  // Load site config to get feed URL
  const configPath = join(projectRoot, "assets/data/site.config.json");
  const config = JSON.parse(await readFile(configPath, "utf-8"));

  // Fetch posts
  let data = null;
  if (config.provider === "microblog" && config.microblogFeedUrl) {
    console.log("Fetching from Micro.blog feed...");
    data = await fetchMicroblogFeed(config.microblogFeedUrl);
  }

  if (!data) {
    console.log("Using local fallback content...");
    data = await loadLocalFallback();
  }

  if (!data || !data.posts || data.posts.length === 0) {
    console.error("❌ No posts found");
    process.exit(1);
  }

  console.log(`Found ${data.posts.length} posts\n`);

  // Generate summaries
  const enhancedPosts = [];
  for (const post of data.posts) {
    const contentText = extractTextFromHtml(post.contentHtml || post.content || "");
    const readTimeMinutes = calculateReadTime(contentText);

    const aiSummary = await generateSummary(post);

    enhancedPosts.push({
      ...post,
      summary: aiSummary || post.summary || "",
      readTimeMinutes,
      aiGenerated: aiSummary !== null
    });

    // Rate limiting - wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save enhanced posts
  const outputPath = join(projectRoot, "assets/data/posts-with-ai-summaries.json");
  await writeFile(outputPath, JSON.stringify({ posts: enhancedPosts }, null, 2));

  console.log(`\n✅ Saved ${enhancedPosts.length} posts with AI summaries to:`);
  console.log(`   ${outputPath}`);

  const aiGeneratedCount = enhancedPosts.filter(p => p.aiGenerated).length;
  console.log(`\n📊 Generated ${aiGeneratedCount} new AI summaries`);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
