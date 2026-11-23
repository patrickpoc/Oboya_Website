import { afterEach, describe, expect, it, vi } from "vitest";
import { sanitizeSiteImageUrl } from "@/lib/cms/media-url";

afterEach(() => vi.unstubAllEnvs());

describe("sanitizeSiteImageUrl", () => {
  it("allows local uploads/assets rasters only", () => {
    expect(sanitizeSiteImageUrl("/assets/a.webp")).toBe("/assets/a.webp");
    expect(sanitizeSiteImageUrl("/other/a.webp")).toBe("");
    expect(sanitizeSiteImageUrl("/assets/a.svg")).toBe("");
    expect(sanitizeSiteImageUrl("/assets/a.png?x=1")).toBe("");
    expect(sanitizeSiteImageUrl("/assets/%2e%2e/a.png")).toBe("");
  });

  it("allows only the configured Supabase public storage host", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    const ok = "https://abc.supabase.co/storage/v1/object/public/media/a.jpg";
    expect(sanitizeSiteImageUrl(ok)).toBe(ok);
    expect(sanitizeSiteImageUrl("https://evil.co/storage/v1/object/public/a.jpg")).toBe("");
    expect(sanitizeSiteImageUrl("http://abc.supabase.co/storage/v1/object/public/a.jpg")).toBe("");
    expect(sanitizeSiteImageUrl(null)).toBe("");
  });
});
