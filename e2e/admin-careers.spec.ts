import { expect, test, type Page } from "@playwright/test";
import type { JobApplication, JobOpeningWithStats } from "../src/lib/cms/careers/types";

const timestamp = "2026-10-20T12:00:00.000Z";
const localized = (en = "") => ({ en, "pt-BR": "", es: "", "zh-CN": "" });
const opening: JobOpeningWithStats = {
  id: "11111111-1111-4111-8111-111111111111", slug: "greenhouse-specialist", title: localized("Greenhouse specialist"),
  summary: localized("Help our growers thrive."), description: localized("<p>Work with growers.</p>"),
  responsibilities: localized(), requirements: localized(), niceToHave: localized(), benefits: localized(),
  department: "Operations", countryCode: "BR", city: "Fortaleza", workModel: "hybrid",
  employmentType: "full_time", seniority: "mid", positions: 1, showSalary: false, status: "draft",
  createdAt: timestamp, updatedAt: timestamp,
};
const candidate: JobApplication = {
  id: "visual-application", openingId: opening.id, fullName: "Alex Example", email: "alex@example.test",
  countryCode: "BR", city: "Fortaleza", languages: [], consentPrivacy: true, consentTalentPool: false,
  consentPrivacyAt: timestamp, status: "new", tags: [], source: "website", rating: 3,
  cvPath: "mock/cv.pdf", cvFilename: "alex-example.pdf", cvSize: 1024, cvMime: "application/pdf",
  createdAt: timestamp, updatedAt: timestamp,
};

/** Every CMS request is contained in this fixture; writes never reach local JSON or staging. */
async function mockCareers(page: Page, overrides: Partial<JobApplication> = {}) {
  let current = { ...structuredClone(candidate), ...overrides };
  const writes: { path: string; body: Record<string, unknown> }[] = [];
  await page.route("**/api/cms/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const body = request.postDataJSON() as Record<string, unknown> | null;
    if (method !== "GET") writes.push({ path, body: body ?? {} });
    const send = (json: unknown) => route.fulfill({ json });
    if (path === "/api/cms/users") return send({ users: [] });
    if (path === "/api/cms/access-control") return route.fulfill({ status: 403, json: {} });
    if (path.endsWith("/activities")) {
      if (method === "POST") return send({ activity: { id: "mock-note", applicationId: candidate.id, kind: "note", body: body?.body, createdAt: timestamp } });
      return send({ activities: [] });
    }
    if (path.endsWith("/cv")) {
      if (method === "DELETE") {
        current = { ...current, cvPath: undefined, cvFilename: undefined, cvSize: undefined, cvMime: undefined };
        return send({ item: current });
      }
      return route.fulfill({ status: 400, json: { error: "unexpected_mock_request" } });
    }
    if (path === `/api/cms/careers/applications/${candidate.id}`) {
      if (method === "PATCH") current = { ...current, ...body, ...(body?.markRead ? { readAt: timestamp } : {}) };
      return send({ item: current });
    }
    if (path === "/api/cms/careers/applications") return send({ items: [current] });
    if (path === `/api/cms/careers/openings/${opening.id}`) return send({ item: opening });
    if (path === "/api/cms/careers/openings") return send({ items: [opening] });
    return send({ items: [], changes: [], count: 0 });
  });
  return writes;
}

async function noPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
}

test.describe("admin careers with isolated mock APIs", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([{ name: "oboya_cookie_consent", value: encodeURIComponent(JSON.stringify({ v: 1, necessary: true, analytics: false, updatedAt: timestamp })), domain: "127.0.0.1", path: "/" }, { name: "NEXT_LOCALE", value: "en", domain: "127.0.0.1", path: "/" }]);
  });

  for (const width of [390, 768, 1440]) {
    test(`lists and editors fit a ${width}px viewport`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 950 });
      await mockCareers(page);
      for (const [path, ready] of [
        ["openings", "Greenhouse specialist"], ["openings/new", "Title"],
        ["applications", "Alex Example"], [`applications/${candidate.id}`, "Full name"],
      ]) {
        await page.goto(`/admin/careers/${path}`);
        if (ready === "Title" || ready === "Full name") await expect(page.getByLabel(ready, { exact: true })).toBeVisible();
        else await expect(page.getByRole("link", { name: new RegExp(`${ready}$`) }).first()).toBeVisible();
        await noPageOverflow(page);
        await page.screenshot({ path: testInfo.outputPath(`${path.replaceAll("/", "-")}-${width}.png`), fullPage: true });
      }
    });
  }

  test("opening slug follows the title until manually edited", async ({ page }) => {
    await mockCareers(page);
    await page.goto("/admin/careers/openings/new");
    const title = page.getByLabel("Title", { exact: true });
    const slug = page.getByLabel("Slug", { exact: true });
    await title.fill("Growing specialist");
    await expect(slug).toHaveValue("growing-specialist");
    await slug.fill("custom-growing-role");
    await title.fill("Senior growing specialist");
    await expect(slug).toHaveValue("custom-growing-role");
  });

  test("pipeline filtering persists in URL and CSV export", async ({ page }) => {
    await mockCareers(page);
    await page.goto("/admin/careers/applications?source=website");
    await expect(page.getByRole("link", { name: /Alex Example$/ })).toBeVisible();
    await page.getByRole("tab", { name: /^Screening/ }).click();
    await expect(page).toHaveURL(/[?&]status=screening/);
    const exportLink = page.getByRole("link", { name: "Export CSV" });
    await expect(exportLink).toHaveAttribute("href", /status=screening/);
    await expect(exportLink).toHaveAttribute("href", /source=website/);
    await expect(page.getByRole("link", { name: /Alex Example$/ })).toHaveCount(0);
  });

  test("immediate notes and CV changes preserve unsaved candidate edits", async ({ page }) => {
    const writes = await mockCareers(page);
    await page.goto(`/admin/careers/applications/${candidate.id}`);
    const name = page.getByLabel("Full name", { exact: true });
    await name.fill("Alex Updated");
    await page.getByPlaceholder("Add a note for the team").fill("A useful interview note");
    await page.getByRole("button", { name: "Add note", exact: true }).click();
    await expect(page.getByText("A useful interview note", { exact: true })).toBeVisible();
    await expect(name).toHaveValue("Alex Updated");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(page.getByText("No CV uploaded.", { exact: true })).toBeVisible();
    await expect(name).toHaveValue("Alex Updated");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect.poll(() => writes.findLast((write) => write.path.endsWith(candidate.id) && write.body.fullName === "Alex Updated")?.body).toMatchObject({ fullName: "Alex Updated" });
    expect(writes.findLast((write) => write.body.fullName === "Alex Updated")?.body.cvPath).toBeUndefined();
  });

  test("mobile navigation opens and closes without blocking the list", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockCareers(page);
    await page.goto("/admin/careers/openings");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("button", { name: "Close navigation" }).first()).toBeVisible();
    await page.getByRole("complementary").getByRole("button", { name: "Close navigation" }).click();
    await expect(page.locator("button.fixed.inset-0")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Greenhouse specialist", exact: true })).toBeVisible();
  });
  test("secondary opening actions support the keyboard", async ({ page }) => {
    await mockCareers(page);
    await page.goto("/admin/careers/openings");
    const actions = page.getByRole("button", { name: "Actions", exact: true });
    await actions.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menuitem", { name: "Duplicate" })).toHaveCount(0);
    await expect(actions).toBeFocused();
  });

  test("language and collapsed content changes preserve the draft", async ({ page }) => {
    await mockCareers(page);
    await page.goto("/admin/careers/openings/new");
    const title = page.getByLabel("Title", { exact: true });
    await title.fill("English title");
    await page.getByRole("tab", { name: "Português", exact: true }).first().click();
    await title.fill("Título em português");
    await page.getByRole("tab", { name: "English", exact: true }).first().click();
    await expect(title).toHaveValue("English title");
    const section = page.locator("details").filter({ has: page.locator("summary", { hasText: "Responsibilities" }) });
    await section.locator("summary").click();
    await section.locator('[contenteditable="true"]').fill("Coordinate growers");
    await section.locator("summary").click();
    await section.locator("summary").click();
    await expect(section.locator('[contenteditable="true"]')).toHaveText("Coordinate growers");
  });

  test("existing consents are locked and anonymized candidates cannot be edited", async ({ page }) => {
    await mockCareers(page);
    await page.goto(`/admin/careers/applications/${candidate.id}`);
    await expect(page.getByRole("switch", { name: "Candidate gave consent to the privacy policy" })).toBeDisabled();
    await page.unroute("**/api/cms/**");
    await mockCareers(page, { anonymizedAt: timestamp, fullName: "", email: "" });
    await page.reload();
    await expect(page.getByText(/This application was anonymized/)).toBeVisible();
    await expect(page.getByLabel("Full name", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Save", exact: true })).toHaveCount(0);
  });

  test("manual application creation is unavailable", async ({ page, request }) => {
    await mockCareers(page);
    await page.goto("/admin/careers/applications");
    await expect(page.getByRole("link", { name: "New application", exact: true })).toHaveCount(0);
    await page.goto("/admin/careers/applications/new?opening=11111111-1111-4111-8111-111111111111");
    await expect(page).toHaveURL(/\/admin\/careers\/applications$/);
    await expect(page.getByLabel("Full name", { exact: true })).toHaveCount(0);
    const response = await request.post("/api/cms/careers/applications", { data: {} });
    expect(response.status()).toBe(405);
  });

});
