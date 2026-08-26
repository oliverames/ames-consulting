import { defineConfig } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
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
    // Loopback only: the source tree holds withheld media that must never be
    // served to the LAN during a local test run.
    command: `/usr/bin/python3 -m http.server ${PORT} --bind 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 30_000
  }
});
