import { expect, test, type Page } from "@playwright/test";

const locales = ["en", "pt-BR", "es", "zh-CN"] as const;

const routes = [
  { path: "", heading: "h2" },
  { path: "/solutions", heading: "h1" },
  { path: "/shop", heading: "h1, h2, h3" },
  { path: "/shop/products/SKU-001", heading: "h1" },
  { path: "/checkout", heading: "h1" },
] as const;

async function open(page: Page, path: string, heading: string) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.includes("Failed to load resource")) return;
    errors.push(text);
  });

  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response?.status(), path).toBe(200);
  await expect(page.locator(heading).first(), path).toBeVisible();
  expect(errors, path).toEqual([]);
}

test.describe("public smoke", () => {
  for (const locale of locales) {
    for (const route of routes) {
      test(`${locale}${route.path || "/"} returns 200 with a heading`, async ({ page }) => {
        await open(page, `/${locale}${route.path}`, route.heading);
      });
    }
  }

  test("admin login renders the form", async ({ page }) => {
    const response = await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    // Production without Supabase hides the form and explains that admin is off.
    const email = page.locator('input[type="email"]');
    const unavailable = page.getByText("Admin is not available.");
    await expect(email.or(unavailable)).toBeVisible();
    if (await email.count()) {
      await expect(page.locator('input[type="password"]')).toBeVisible();
    }
  });
});
