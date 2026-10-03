import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const PASSWORD = "Settla!Demo123";
export async function login(page: Page, role = "tenant_admin") {
  await page.goto("/login");
  await page.getByLabel("Work email").fill(`${role}@urbanstep.test`);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

/** Setup-only API access (separate session from the browser, so token rotation is not disturbed). */
export async function api(request: APIRequestContext, path: string, method = "POST") {
  const l = await request.post("http://localhost:4000/api/v1/auth/login", { data: { email: "tenant_admin@urbanstep.test", password: PASSWORD } });
  const token = (await l.json()).data.accessToken as string;
  const r = await request.fetch(`http://localhost:4000/api/v1${path}`, { method, headers: { authorization: `Bearer ${token}` } });
  return (await r.json()).data;
}
