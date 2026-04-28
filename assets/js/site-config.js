const DEFAULT_CONFIG = {
  provider: "local",
  jsonFeedUrl: "",
  siteTitle: "ames.consulting",
  siteUrl: "https://ames.consulting",
  siteDescription: "Placeholder consulting, writing, and portfolio content for a static site demo.",
  authorName: "Avery Morgan",
  locale: "en_US",
  twitterHandle: "",
  defaultSocialImage: "",
  contactFormEndpoint: "",
  contactFormSuccessMessage: "Thanks, your message was sent.",
  portfolioTag: "portfolio",
  homePreviewLimit: 6
};

export async function loadSiteConfig() {
  try {
    const configUrl = new URL("../data/site.config.json", import.meta.url);
    const response = await fetch(configUrl, { cache: "no-store" });
    if (!response.ok) {
      return DEFAULT_CONFIG;
    }

    const config = await response.json();
    return {
      ...DEFAULT_CONFIG,
      ...config
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}
