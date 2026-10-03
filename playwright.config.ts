import { defineConfig, devices } from "@playwright/test";

// Prerequisite: settla-backend running at NEXT_PUBLIC_API_URL (default http://localhost:4000) and seeded (npm run seed).
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "e2e-results.json" }]],
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /responsive.spec.ts/ }, { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive\.spec\.ts/ }],
  webServer: { command: "npx next start -p 3000", url: "http://localhost:3000", reuseExistingServer: true, timeout: 60_000 },
});
