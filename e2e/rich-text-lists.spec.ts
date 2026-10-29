import { expect, test } from "@playwright/test";

const timestamp = "2026-10-20T12:00:00.000Z";

test.describe("rich text editor lists", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      { name: "oboya_cookie_consent", value: encodeURIComponent(JSON.stringify({ v: 1, necessary: true, analytics: false, updatedAt: timestamp })), domain: "127.0.0.1", path: "/" },
      { name: "NEXT_LOCALE", value: "en", domain: "127.0.0.1", path: "/" },
    ]);
    await page.route("**/api/cms/**", (route) => route.fulfill({ json: { items: [], users: [], changes: [], count: 0 } }));
  });

  for (const [key, label, tag, marker] of [
    ["bullet", "Bullet list", "ul", "disc"],
    ["ordered", "Ordered list", "ol", "decimal"],
  ] as const) {
    test(`${key} list toolbar button turns selected lines into a visible list`, async ({ page }) => {
      await page.goto("/admin/careers/openings/new");
      const section = page.locator("details").filter({ has: page.locator("summary", { hasText: "Responsibilities" }) });
      await section.locator("summary").click();
      const editor = section.locator('[contenteditable="true"]');
      await editor.click();
      await page.keyboard.type("First duty");
      await page.keyboard.press("Enter");
      await page.keyboard.type("Second duty");
      await page.keyboard.press("Enter");
      await page.keyboard.type("Third duty");
      await page.keyboard.press("ControlOrMeta+a");
      await section.getByRole("button", { name: label, exact: true }).click();

      const items = editor.locator(`${tag} > li`);
      await expect(items).toHaveCount(3);
      const list = editor.locator(tag).first();
      expect(await list.evaluate((el) => getComputedStyle(el).listStyleType)).toBe(marker);
      expect(parseFloat(await list.evaluate((el) => getComputedStyle(el).paddingLeft))).toBeGreaterThan(0);
      // The toolbar reflects the caret position once it is inside the list.
      await items.nth(1).click();
      await expect(section.getByRole("button", { name: label, exact: true })).toHaveAttribute("aria-pressed", "true");
    });
  }

  test("toolbar marks reflect the current selection", async ({ page }) => {
    await page.goto("/admin/careers/openings/new");
    const section = page.locator("details").filter({ has: page.locator("summary", { hasText: "Responsibilities" }) });
    await section.locator("summary").click();
    const bold = section.getByRole("button", { name: "Bold", exact: true });
    await section.locator('[contenteditable="true"]').click();
    await bold.click();
    await expect(bold).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.type("Strong duty");
    await expect(section.locator('[contenteditable="true"] strong')).toHaveText("Strong duty");
  });
});
