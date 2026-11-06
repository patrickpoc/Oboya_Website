import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
let result: { data: unknown; error: { message: string } | null };
const upsert = vi.fn(async () => ({ error: null }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => result }) }),
      upsert,
    }),
  }),
  createPublicClient: vi.fn(),
}));
vi.mock("@/lib/cms/server/cache-invalidation.server", () => ({ invalidateDocument: vi.fn() }));
vi.mock("@/lib/cms/server/local-fs.server", () => ({ writeLocalJsonFile: vi.fn() }));
vi.mock("@/lib/cms/server/cms-document.server", () => ({
  cmsDocumentFilePath: () => "",
  readCmsDocumentSeedFile: async () => null,
}));
const collectInUseMediaUrls = vi.fn(async () => new Set<string>());
vi.mock("@/lib/cms/server/in-use-media.server", () => ({
  assetsFromInUseUrls: () => [],
  collectInUseMediaUrls,
  isUrlInUse: () => false,
  normalizeMediaUrl: (u: string) => u,
}));
vi.mock("@/lib/cms/server/site-media.server", () => ({
  SITE_MEDIA_FOLDERS: [],
  scanSiteMediaAssets: async () => [],
}));

describe("media folders strict read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("throws on a read error or malformed document", async () => {
    const { readMediaFoldersStrict } = await import("@/lib/cms/server/media-folders.server");
    result = { data: null, error: { message: "db" } };
    await expect(readMediaFoldersStrict()).rejects.toThrow();
    result = { data: { status: "published", data: { folders: "x" } }, error: null };
    await expect(readMediaFoldersStrict()).rejects.toThrow(/malformed|Could not/);
  });

  it("an absent row falls back to defaults (first save)", async () => {
    const { readMediaFoldersStrict } = await import("@/lib/cms/server/media-folders.server");
    result = { data: null, error: null };
    expect((await readMediaFoldersStrict()).length).toBeGreaterThan(0);
  });

  it("sync writes the folder list after a good read (positive control)", async () => {
    result = { data: null, error: null };
    const { syncMediaLibraryFromSupabase } = await import("@/lib/cms/server/media-library.server");
    await syncMediaLibraryFromSupabase();
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ id: "media-folders" }));
  });

  it("sync skips the folder write after a failed read but still continues", async () => {
    result = { data: null, error: { message: "db" } };
    const { syncMediaLibraryFromSupabase } = await import("@/lib/cms/server/media-library.server");
    await expect(syncMediaLibraryFromSupabase()).resolves.toBeDefined();
    expect(upsert).not.toHaveBeenCalledWith(expect.objectContaining({ id: "media-folders" }));
    expect(collectInUseMediaUrls).toHaveBeenCalled();
  });
});
