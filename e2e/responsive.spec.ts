import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("mobile: drawer nav, no horizontal overflow on key pages", async ({ page }) => {
  await login(page);
  for (const p of ["/dashboard", "/cases", "/approvals", "/escalations", "/settings"]) {
    await page.goto(p);
    await page.waitForLoadState("load");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${p} overflows horizontally`).toBeLessThanOrEqual(1);
  }
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
});

test("mobile: landing has no horizontal overflow and a working menu", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const y of [0, 900, 1800, 3000, 99999]) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `landing overflows at scrollY ${y}`).toBeLessThanOrEqual(1);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("link", { name: "Security" }).first()).toBeVisible();
});
