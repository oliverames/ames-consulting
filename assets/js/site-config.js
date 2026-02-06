const DEFAULT_CONFIG = {
  provider: "local",
  jsonFeedUrl: "",
  siteTitle: "ames.consulting",
  portfolioTag: "portfolio",
  homePreviewLimit: 6
};

export async function loadSiteConfig() {
  try {
    const response = await fetch("/assets/data/site.config.json", { cache: "no-store" });
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
