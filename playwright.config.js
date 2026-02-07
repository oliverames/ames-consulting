import { defineConfig } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: true,
  reporter: process.env.CI ? [["github"], ["html", { outputFolder: "playwright-report" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" }
    }
  ],
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
