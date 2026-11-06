import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));

let result: { data: unknown; error: { message: string } | null };
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => result }) }) }),
  }),
  createPublicClient: vi.fn(),
}));

const writeCmsDocumentData = vi.fn();
vi.mock("@/lib/cms/server/cms-document.server", () => ({
  cmsDocumentFilePath: () => "",
  readCmsDocumentSeedFile: async () => null,
  readCmsDocumentData: async () => null,
  writeCmsDocumentData,
}));
vi.mock("@/lib/cms/sanitize-rich-html.server", () => ({
  sanitizeLocalizedRichHtml: (v: unknown) => v,
}));
vi.mock("@/lib/cms/server/cache-invalidation.server", () => ({ invalidateDocument: vi.fn() }));
vi.mock("@/lib/cms/server/local-fs.server", () => ({ writeLocalJsonFile: vi.fn() }));

const published = (data: unknown) => ({ data: { status: "published", data }, error: null });
const failed = { data: null, error: { message: "db secret" } };

describe("document strict readers and saves", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const cases: Array<{
    name: string;
    load: () => Promise<Record<string, (...args: never[]) => Promise<unknown>>>;
    strict: string;
    save: string;
    saveArg: unknown;
    malformed: unknown;
  }> = [
    {
      name: "about",
      load: () => import("@/lib/cms/server/about-page.server") as never,
      strict: "readAboutPageSettingsStrict",
      save: "saveAboutPageSettingsDurable",
      saveArg: { hero: {} },
      malformed: { nope: 1 },
    },
    {
      name: "news",
      load: () => import("@/lib/cms/server/news-page.server") as never,
      strict: "readNewsPageSettingsStrict",
      save: "saveNewsPageSettingsDurable",
      saveArg: { headline: {}, postsPerPage: 3 },
      malformed: { nope: 1 },
    },
    {
      name: "solutions",
      load: () => import("@/lib/cms/server/solutions-page.server") as never,
      strict: "readSolutionsPageSettingsStrict",
      save: "saveSolutionsPageSettingsDurable",
      saveArg: { hero: {}, banners: [] },
      malformed: { nope: 1 },
    },
    {
      name: "faqs",
      load: () => import("@/lib/cms/server/faqs.server") as never,
      strict: "readFaqsStrict",
      save: "saveFaqItemDurable",
      saveArg: { id: "new-faq" },
      malformed: { categories: 1 },
    },
    {
      name: "blog-posts",
      load: () => import("@/lib/cms/server/blog-posts.server") as never,
      strict: "readBlogPostsStrict",
      save: "saveBlogPostDurable",
      saveArg: { id: "p", body: { en: "" } },
      malformed: { not: "an array" },
    },
    {
      name: "blog-categories",
      load: () => import("@/lib/cms/server/blog-categories.server") as never,
      strict: "readBlogCategoriesStrict",
      save: "saveBlogCategoryDurable",
      saveArg: { id: "c" },
      malformed: "x",
    },
    {
      name: "blog-authors",
      load: () => import("@/lib/cms/server/blog-authors.server") as never,
      strict: "readBlogAuthorsStrict",
      save: "saveBlogAuthorDurable",
      saveArg: { id: "a" },
      malformed: "x",
    },
    {
      name: "case-studies",
      load: () => import("@/lib/cms/server/case-studies.server") as never,
      strict: "readCaseStudiesStrict",
      save: "saveCaseStudyDurable",
      saveArg: {
        id: "s", excerpt: {}, challenge: {}, solution: {}, implementation: {}, results: {},
        testimonial: { quote: {} },
      },
      malformed: "x",
    },
  ];

  for (const c of cases) {
    describe(c.name, () => {
      it("read error and malformed data throw CmsReadError; save writes nothing", async () => {
        const mod = await c.load();
        const { CmsReadError } = await import("@/lib/cms/server/strict-read");
        result = failed;
        await expect((mod[c.strict] as () => Promise<unknown>)()).rejects.toBeInstanceOf(CmsReadError);
        await expect((mod[c.save] as (a: unknown) => Promise<unknown>)(c.saveArg)).rejects.toBeInstanceOf(CmsReadError);
        result = published(c.malformed);
        await expect((mod[c.strict] as () => Promise<unknown>)()).rejects.toBeInstanceOf(CmsReadError);
        await expect((mod[c.save] as (a: unknown) => Promise<unknown>)(c.saveArg)).rejects.toBeInstanceOf(CmsReadError);
        expect(writeCmsDocumentData).not.toHaveBeenCalled();
      });

      it("first save works when the row is confirmed absent", async () => {
        const mod = await c.load();
        result = { data: null, error: null };
        await expect((mod[c.strict] as () => Promise<unknown>)()).resolves.toBeDefined();
        await (mod[c.save] as (a: unknown) => Promise<unknown>)(c.saveArg);
        expect(writeCmsDocumentData).toHaveBeenCalledTimes(1);
      });
    });
  }

  it("delete with a failing read writes nothing", async () => {
    const faqs = await import("@/lib/cms/server/faqs.server");
    const blog = await import("@/lib/cms/server/blog-posts.server");
    result = failed;
    await expect(faqs.deleteFaqItemDurable("x")).rejects.toThrow();
    await expect(blog.deleteBlogPostDurable("x")).rejects.toThrow();
    expect(writeCmsDocumentData).not.toHaveBeenCalled();
  });
});

describe("homepage strict read", () => {
  it("throws on a malformed or failed document (Supabase configured)", async () => {
    const { readHomepageSettingsStrict, saveHomepageSettingsDurable } = await import(
      "@/lib/cms/server/homepage.server"
    );
    result = published({ nope: 1 });
    await expect(readHomepageSettingsStrict()).rejects.toThrow();
    result = failed;
    await expect(saveHomepageSettingsDurable({ hero: {} } as never)).rejects.toThrow();
    expect(writeCmsDocumentData).not.toHaveBeenCalled();
  });
});
