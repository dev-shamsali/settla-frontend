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
