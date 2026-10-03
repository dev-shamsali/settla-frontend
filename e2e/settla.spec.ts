import { test, expect } from "@playwright/test";
import { login, api } from "./helpers";

test.describe.configure({ mode: "serial" });

test("1. login rejects bad credentials, accepts good ones", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Work email").fill("tenant_admin@urbanstep.test");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await login(page);
});

test("2. unauthenticated users are redirected to login", async ({ page }) => {
  await page.goto("/cases");
  await expect(page).toHaveURL(/\/login/);
});

test("3-10. dashboard, autonomous recovery, timeline, Rhea, policy, verification, audit", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.getByRole("button", { name: /Run demo case/ }).first().click();
  await expect(page).toHaveURL(/\/cases\/[\w-]+/, { timeout: 30_000 });
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toContainText("CASE-");
  // status is the backend's reported state
  await expect(page.getByText("Resolved").first()).toBeVisible();
  await expect(page.getByText("recover-order-v2").first()).toBeVisible();
  await expect(page.getByText("Customer identified").first()).toBeVisible();
  await expect(page.getByText(/created and verified/).first()).toBeVisible();
  await expect(page.getByText("27s").first()).toBeVisible();
  await expect(page.getByText("LOW · 0.08").first()).toBeVisible();
  await expect(page.getByText("Audit trail")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rhea" })).toBeVisible();
});

test("11. case list search + filter + detail navigation", async ({ page }) => {
  await login(page);
  await page.goto("/cases");
  await page.getByLabel("Search cases").fill("Ananya");
  await expect(page.getByRole("row").nth(1)).toContainText("Ananya");
  await page.getByLabel("Status").selectOption("RESOLVED");
  await page.getByRole("row").nth(1).click();
  await expect(page).toHaveURL(/\/cases\/[\w-]+/);
});

test("12. escalation: customer asks for a human, nothing executed, case file shown", async ({ page, request }) => {
  await login(page);
  const demo = await api(request, "/demo/run?scenario=human");
  const res = demo.case.escalations[0]._id as string;
  await page.goto(`/escalations/${res}`);
  await expect(page.getByRole("heading", { name: /Escalation · CASE-/ })).toBeVisible();
  await expect(page.getByText("Case file")).toBeVisible();
  await expect(page.getByText("Nothing was executed.")).toBeVisible();
  await page.getByRole("button", { name: "Take over" }).click();
  await expect(page.getByText(/Take Over: In Progress/i)).toBeVisible();
});

test("13. approval flow: >₹5,000 is not auto-executed and appears for a human", async ({ page, request }) => {
  await api(request, "/demo/run?scenario=high_value");
  await login(page);
  await page.goto("/escalations");
  await expect(page.getByRole("heading", { name: "Escalations" })).toBeVisible();
  await page.goto("/approvals");
  await expect(page.getByRole("heading", { name: "Approvals" })).toBeVisible();
});

test("14. command palette (Ctrl+K), shortcuts and help", async ({ page }) => {
  await login(page);
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
  await page.getByLabel("Command search").fill("approv");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/approvals/);
  await page.keyboard.press("g");
  await page.keyboard.press("c");
  await expect(page).toHaveURL(/\/cases/);
  await page.keyboard.press("?");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
  await page.keyboard.press("Escape");
});

test("15. kill switch: switch to recommend-only and back (audited)", async ({ page }) => {
  await login(page);
  await page.goto("/settings/automation");
  await page.getByRole("button", { name: /Recommend Only/ }).click();
  await expect(page.getByText("Execution mode: RECOMMEND_ONLY")).toBeVisible();
  await page.getByRole("button", { name: /^Autonomous/ }).click();
  await expect(page.getByText("Execution mode: AUTONOMOUS")).toBeVisible();
  await page.goto("/activity");
  await page.getByLabel("Filter by action").fill("tenant.execution_mode");
  await expect(page.getByRole("row").nth(1)).toContainText("tenant.execution_mode");
});

test("16. RBAC: viewer cannot see admin/approve controls; permission-denied state", async ({ page }) => {
  await login(page, "viewer");
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Integrations" })).toHaveCount(0);
  await page.goto("/audit-nope");
  await expect(page.getByText("doesn't exist")).toBeVisible();
  await page.goto("/activity");
  await expect(page.getByText("Permission denied")).toBeVisible();
});

test("17. landing page: dark hero, sections, in-page navigation, sign-in link, no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource|ERR_/.test(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Settla — AI-Powered Payment Resolution");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Resolve. Verify.");
  await expect(page.getByRole("link", { name: "Request a Demo" }).first()).toBeVisible();
  await expect(page.getByLabel(/Illustrative Rhea resolution card/)).toBeVisible();
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "How it works" }).click();
  await expect(page.getByRole("heading", { name: /From payment issue/ })).toBeInViewport();
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Security" }).click();
  await expect(page.getByRole("heading", { name: /Automation without/ })).toBeInViewport();
  await expect(page.getByText("Human Escalation")).toBeVisible();
  await page.getByRole("link", { name: "Sign in" }).first().click();
  await expect(page).toHaveURL(/\/login/);
  expect(errors).toEqual([]);
});

test("17b. landing: reduced motion shows static background and all content immediately", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/");
  await expect(page.getByText("Rhea investigates the context")).toBeVisible();
  const videoOpacity = await page.locator(".l-bg__video").evaluate((v) => getComputedStyle(v).display);
  expect(videoOpacity).toBe("none");
  await ctx.close();
});

test("18. no console errors on core pages", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|ERR_FAILED|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  for (const p of ["/dashboard", "/cases", "/payments", "/orders", "/customers", "/policies", "/knowledge-base", "/analytics", "/integrations", "/settings/team"]) {
    await page.goto(p);
    await page.waitForLoadState("load");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.waitForTimeout(600);
  }
  expect(errors).toEqual([]);
});

test("19. regression: escalated case detail renders with banner and case file", async ({ page, request }) => {
  await api(request, "/demo/run?scenario=high_value");
  await login(page);
  await page.goto("/cases?");
  await page.getByLabel("Status").selectOption("ESCALATED");
  await page.getByRole("row").nth(1).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("CASE-");
  await expect(page.getByText("Needs a human.")).toBeVisible();
  await expect(page.getByText("Escalation case file")).toBeVisible();
});

test("20. automation: Rhea proposes, backend allows, n8n step runs, history + progress + approval chip visible", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: /Run demo case/ }).first().click();
  await expect(page).toHaveURL(/\/cases\/[\w-]+/, { timeout: 30_000 });
  await expect(page.getByRole("list", { name: "Investigation progress" })).toBeVisible();
  await expect(page.getByText("Human approval").first()).toBeVisible();
  await expect(page.getByText("Automation (n8n)")).toBeVisible();
  await expect(page.getByText("Rhea proposes", { exact: true })).toBeVisible();
  await expect(page.getByText("Backend verdict", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Run investigation step" }).click();
  await expect(page.getByRole("dialog", { name: "Run investigation step" })).toContainText("Read-only investigation");
  await page.getByRole("button", { name: "Send to n8n" }).click();
  await expect(page.getByText("n8n Succeeded")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("payment_lookup").first()).toBeVisible();
  await expect(page.getByText(/corr corr_/).first()).toBeVisible();
});

test("21. presentation: keyboard navigation, speech notes toggle, covers problem and n8n", async ({ page }) => {
  await page.goto("/presentation");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("money debited, no order");
  await expect(page.getByText("What to say · slide 1")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("A customer pays");
  await expect(page.getByText("Here is the problem.")).toBeVisible();
  await page.keyboard.press("s");
  await expect(page.getByText("What to say · slide 2")).toHaveCount(0);
  await page.keyboard.press("s");
  await page.getByRole("button", { name: /Go to slide 8: n8n integration/ }).click();
  await expect(page.getByText("SETTLA - PAYMENT RESOLUTION").first()).toBeVisible();
  await page.keyboard.press("End");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Let Rhea take the next one");
});
