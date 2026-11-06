import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/cms/server/cache-invalidation.server", () => ({ invalidateMapLocations: vi.fn() }));
vi.mock("@/lib/cms/server/local-fs.server", () => ({ writeLocalJsonFile: vi.fn() }));
vi.mock("fs/promises", () => ({
  readFile: async () => JSON.stringify({ locations: [{ id: "seed", flag: "BR", offices: [] }] }),
}));

let result: { data: unknown; error: { message: string } | null };
vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: vi.fn(),
  createClient: async () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => result }) }) }),
  }),
}));

describe("readMapLocationsStrict", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));

  it("uses the file seed only when the row is confirmed absent", async () => {
    result = { data: null, error: null };
    const { readMapLocationsStrict } = await import("@/lib/map-locations.server");
    expect(await readMapLocationsStrict()).toHaveProperty("locations");
  });

  it("throws on a read error, null data and malformed data", async () => {
    const { readMapLocationsStrict } = await import("@/lib/map-locations.server");
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    for (const r of [
      { data: null, error: { message: "db" } },
      { data: { data: null }, error: null },
      { data: { data: { locations: "x" } }, error: null },
    ]) {
      result = r;
      await expect(readMapLocationsStrict()).rejects.toBeInstanceOf(CmsReadError);
    }
  });

  it("returns the stored document", async () => {
    result = { data: { data: { locations: [] } }, error: null };
    const { readMapLocationsStrict } = await import("@/lib/map-locations.server");
    expect((await readMapLocationsStrict()).locations).toEqual([]);
  });
});
