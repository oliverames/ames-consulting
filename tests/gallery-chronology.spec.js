import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const galleryData = JSON.parse(await readFile(
  path.resolve("assets/data/event-galleries.json"),
  "utf8",
));
const publicEventGalleries = galleryData.campaigns.filter((campaign) =>
  campaign.published !== false
  && campaign.images.some((image) => image.src.includes("/assets/images/work/events/"))
);

for (const campaign of publicEventGalleries) {
  test(`${campaign.title} keeps its declared image order`, async ({ page }) => {
    await page.goto(`/work/${campaign.projectSlug || campaign.slug}/`);
    const gallery = page.locator(`[data-gallery="${campaign.slug}"]`);
    await expect(gallery).toHaveAttribute("data-order-mode", campaign.orderMode);

    const rendered = await gallery.locator("img").evaluateAll((images) => images.map((image) => ({
      file: new URL(image.src).pathname.split("/").at(-1),
      capturedAt: image.dataset.capturedAt || "",
    })));
    expect(rendered.map((image) => image.file)).toEqual(
      campaign.images.map((image) => path.basename(image.src)),
    );
    expect(rendered.map((image) => image.capturedAt)).toEqual(
      campaign.images.map((image) => image.capturedAt),
    );

    if (campaign.orderMode === "chronological") {
      const captureTimes = campaign.images.map((image) => Date.parse(image.capturedAt));
      expect(captureTimes).toEqual([...captureTimes].sort((left, right) => left - right));
    }
  });
}
