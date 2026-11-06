import { afterEach, describe, expect, it, vi } from "vitest";
import { isAllowlistedImageSrc, needsUnoptimized } from "@/lib/shop/image-host";

afterEach(() => vi.unstubAllEnvs());

describe("image host allowlist (mirrors next.config remotePatterns)", () => {
  it("allows site paths, Unsplash and the project's public storage", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    expect(isAllowlistedImageSrc("/assets/a.jpg")).toBe(true);
    expect(isAllowlistedImageSrc("https://images.unsplash.com/photo-1")).toBe(true);
    expect(isAllowlistedImageSrc("https://proj.supabase.co/storage/v1/object/public/cms-media/a.jpg")).toBe(true);
    expect(needsUnoptimized("/assets/a.jpg")).toBe(false);
  });

  it("flags other hosts, other Supabase projects, other paths, http and protocol-relative", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    for (const src of [
      "https://cdn.example.com/a.jpg",
      "https://other.supabase.co/storage/v1/object/public/cms-media/a.jpg",
      "https://proj.supabase.co/rest/v1/a.jpg",
      "http://images.unsplash.com/a.jpg",
      "//images.unsplash.com/a.jpg",
      "data:image/png;base64,AAAA",
    ]) {
      expect(needsUnoptimized(src), src).toBe(true);
    }
  });
});
