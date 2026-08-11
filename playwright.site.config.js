import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config.js";

const SITE_PORT = 4174;

export default defineConfig({
  ...baseConfig,
  metadata: {
    ...(baseConfig.metadata || {}),
    siteRoot: "_site",
  },
  use: {
    ...baseConfig.use,
    baseURL: `http://127.0.0.1:${SITE_PORT}`,
  },
  webServer: {
    ...baseConfig.webServer,
    command: `PORT=${SITE_PORT} SITE_ROOT=_site node scripts/serve-built-site.mjs`,
    url: `http://127.0.0.1:${SITE_PORT}`,
    reuseExistingServer: false,
  },
});
