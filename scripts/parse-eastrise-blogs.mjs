import { readFileSync, writeFileSync } from "fs";
import { parseStringPromise } from "xml2js";

/**
 * Parse WordPress WXR export and extract blog posts
 * Converts WordPress Gutenberg block HTML to clean HTML
 */

const XML_PATH = ".context/attachments/2025-11-09 All EastRise Blogs.xml";
const OUTPUT_PATH = "assets/data/eastrise-blogs.json";

async function parseWpExport() {
  console.log("Reading WordPress export...");
  const xmlContent = readFileSync(XML_PATH, "utf-8");

  console.log("Parsing XML...");
  const result = await parseStringPromise(xmlContent);

  const channel = result.rss.channel[0];
  const items = channel.item || [];

  console.log(`Found ${items.length} items`);

  const posts = items
    .filter((item) => {
      // Only include published posts (not drafts, not pages)
      const postType = item["wp:post_type"]?.[0];
      const status = item["wp:status"]?.[0];
      return postType === "post" && status === "publish";
    })
    .map((item) => {
      const title = item.title?.[0] || "Untitled";
      const link = item.link?.[0] || "";
      const pubDate = item.pubDate?.[0] || "";
      const categories = (item.category || [])
        .filter((cat) => cat.$.domain === "category")
        .map((cat) => cat._);

      // Extract content from CDATA
      let content = item["content:encoded"]?.[0] || "";

      // Clean up WordPress Gutenberg blocks and excess whitespace
      content = cleanWpContent(content);

      // Extract featured image URL from post meta
      const postMeta = item["wp:postmeta"] || [];
      let featuredImageUrl = null;

      for (const meta of postMeta) {
        const key = meta["wp:meta_key"]?.[0];
        if (key === "_thumbnail_id") {
          const attachmentId = meta["wp:meta_value"]?.[0];
          // Try to find the attachment with this ID
          featuredImageUrl = findAttachmentUrl(items, attachmentId);
          break;
        }
      }

      // Create slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Extract excerpt (first paragraph of content, stripped of HTML)
      const excerpt = extractExcerpt(content);

      return {
        id: slug,
        slug,
        title,
        originalUrl: link,
        publishedAt: new Date(pubDate).toISOString(),
        categories,
        content,
        excerpt,
        featuredImage: featuredImageUrl,
      };
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  console.log(`Extracted ${posts.length} published blog posts`);

  // Write to JSON file
  const output = {
    posts,
    meta: {
      source: "EastRise Credit Union Blog",
      totalPosts: posts.length,
      dateRange: {
        earliest: posts[posts.length - 1]?.publishedAt,
        latest: posts[0]?.publishedAt,
      },
    },
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`✓ Wrote ${OUTPUT_PATH}`);

  // Print some stats
  console.log("\nStats:");
  console.log(`  Total posts: ${posts.length}`);
  console.log(`  Date range: ${output.meta.dateRange.earliest?.split("T")[0]} to ${output.meta.dateRange.latest?.split("T")[0]}`);
  console.log(`  Posts with featured images: ${posts.filter((p) => p.featuredImage).length}`);

  // Show sample categories
  const allCategories = new Set(posts.flatMap((p) => p.categories));
  console.log(`  Categories: ${Array.from(allCategories).slice(0, 10).join(", ")}${allCategories.size > 10 ? "..." : ""}`);
}

function cleanWpContent(html) {
  return (
    html
      // Remove WordPress block comments
      .replace(/<!-- \/?(wp:|\/wp:)[^>]+ -->/g, "")
      // Remove empty paragraphs
      .replace(/<p>\s*<\/p>/g, "")
      // Normalize whitespace
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function findAttachmentUrl(items, attachmentId) {
  // Look for attachment post type with matching post_id
  const attachment = items.find((item) => {
    const postType = item["wp:post_type"]?.[0];
    const postId = item["wp:post_id"]?.[0];
    return postType === "attachment" && postId === attachmentId;
  });

  return attachment?.["wp:attachment_url"]?.[0] || null;
}

function extractExcerpt(html) {
  // Strip HTML tags
  const text = html.replace(/<[^>]+>/g, " ");
  // Normalize whitespace
  const normalized = text.replace(/\s+/g, " ").trim();
  // Take first ~200 characters, break at word boundary
  if (normalized.length <= 200) return normalized;

  const truncated = normalized.slice(0, 200);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0 ? truncated.slice(0, lastSpace) + "..." : truncated + "...";
}

parseWpExport().catch((err) => {
  console.error("Error parsing WordPress export:", err);
  process.exit(1);
});
