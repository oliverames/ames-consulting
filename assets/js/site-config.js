const DEFAULT_CONFIG = {
  contactFormEndpoint: "/api/contact",
  contactFormSuccessMessage: "Thanks, your message was sent."
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
