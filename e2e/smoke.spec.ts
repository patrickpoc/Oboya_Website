import { expect, test, type Page } from "@playwright/test";

const locales = ["en", "pt-BR", "es", "zh-CN"] as const;

const routes = [
  { path: "", heading: "h2" },
  { path: "/solutions", heading: "h1" },
  { path: "/shop", heading: "h1, h2, h3" },
  { path: "/shop/products/SKU-001", heading: "h1" },
  { path: "/checkout", heading: "h1" },
  { path: "/work", heading: "h1" },
  { path: "/work/sample-greenhouse-technician", heading: "h1" },
] as const;

const SEED_SLUG = "sample-greenhouse-technician";

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

  test("/work-with-us redirects to /work", async ({ page }) => {
    await page.goto("/en/work-with-us", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/work(\?.*)?$/);
  });

  test("unknown opening slug shows the not-found page with noindex", async ({ page }) => {
    // AppProviders wraps all pages in <Suspense>, so streamed notFound() keeps HTTP 200 site-wide; noindex is injected instead.
    await page.goto("/en/work/does-not-exist-xyz", { waitUntil: "domcontentloaded" });
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
    await expect(page).toHaveTitle(/no longer available/i);
  });

  test.describe("mobile drawer", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("lists Work with us right after Shop", async ({ page }) => {
      await page.goto("/en/about", { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: "Open menu" }).first().click();
      const links = page.getByRole("navigation", { name: /menu/i }).getByRole("link");
      const labels = (await links.allTextContents()).map((l) => l.trim());
      const shop = labels.indexOf("Shop");
      expect(shop, labels.join("|")).toBeGreaterThanOrEqual(0);
      expect(labels[shop + 1]).toBe("Work with us");
    });
  });

  test("country filter with no openings shows the empty state", async ({ page }) => {
    await page.goto("/en/work?country=SE", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/No open roles in Sweden/).first()).toBeVisible();
    await expect(page.locator('a[href$="/work/apply"]').first()).toBeVisible();
  });

  test.describe("openings", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/en/work", { waitUntil: "domcontentloaded" });
      // Note: if Supabase is configured locally, the seeded opening must also exist in the DB.
      await expect(page.locator(`a[href$="/work/${SEED_SLUG}"]`).first()).toBeVisible();
    });

    test("detail page renders with apply form", async ({ page }) => {
      const response = await page.goto(`/en/work/${SEED_SLUG}`, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
      await page.goto(`/en/work/${SEED_SLUG}/apply`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("form input[type=email]")).toBeVisible();
      await expect(page.locator("form input[type=file]")).toHaveCount(1);
      await expect(page.locator("form input#apply-consentPrivacy")).toBeVisible();
      await expect(page.locator("form input#apply-consentPrivacy")).not.toBeChecked();
    });

    test("country filter updates the URL", async ({ page }) => {
      await page.getByRole("button", { name: /Brazil/ }).first().click();
      await expect(page).toHaveURL(/[?&]country=BR/);
    });
  });
});
