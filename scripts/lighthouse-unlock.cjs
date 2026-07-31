// Lighthouse CI puppeteer script: unlock the construction gate before each
// audit. Without this, every audit measures the password screen instead of the
// real page, and the performance budget passes on the wrong content.
module.exports = async (browser, context) => {
  const page = await browser.newPage();
  await page.goto(context.url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("amesConsultingConstructionAccess", "true");
  });
  await page.close();
};
