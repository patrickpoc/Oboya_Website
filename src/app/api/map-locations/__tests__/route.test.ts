import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const data = {
  viewBox: { width: 1, height: 1 },
  locations: [
    {
      id: "brazil",
      x: 1,
      y: 1,
      flag: "BR",
      hasFactories: false,
      sendOnly: false,
      translations: { en: { country: "Brazil" } },
      offices: [
        {
          id: "a",
          email: "secret@x.com",
          showEmail: false,
          showPhone: false,
          translations: { en: { phone: "123" }, "pt-BR": { phone: "456" } },
        },
        {
          id: "b",
          email: "ok@x.com",
          showEmail: true,
          showPhone: true,
          translations: { en: { phone: "789" } },
        },
      ],
    },
  ],
};

vi.mock("@/lib/map-locations.server", () => ({
  readMapLocations: async () => data,
  writeMapLocations: vi.fn(),
}));
vi.mock("@/lib/cms/server/require-cms-auth", () => ({ cmsGuard: vi.fn() }));
vi.mock("@/lib/cms/revalidate-site", () => ({ revalidateMapPages: vi.fn() }));

describe("GET /api/map-locations", () => {
  it("strips hidden email and phone", async () => {
    const { GET } = await import("../route");
    const body = await (await GET()).json();
    const [a, b] = body.locations[0].offices;
    expect(a.email).toBe("");
    expect(a.translations.en.phone).toBe("");
    expect(a.translations["pt-BR"].phone).toBe("");
    expect(b.email).toBe("ok@x.com");
    expect(b.translations.en.phone).toBe("789");
  });
});
