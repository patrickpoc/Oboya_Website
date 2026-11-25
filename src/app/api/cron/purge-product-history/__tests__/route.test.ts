import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const configured = vi.fn(() => true);
vi.mock("@/lib/supabase/admin", () => ({
  createServiceClient: () => ({ rpc }),
  isServiceRoleConfigured: () => configured(),
}));

import { GET } from "../route";

const req = (auth?: string) =>
  new Request("http://x/api/cron/purge-product-history", {
    headers: auth ? { authorization: auth } : {},
  });

describe("GET /api/cron/purge-product-history", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "s3cret";
    rpc.mockReset();
    configured.mockReturnValue(true);
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    delete process.env.CRON_SECRET;
    vi.restoreAllMocks();
  });

  it("rejects missing or wrong secret", async () => {
    expect((await GET(req())).status).toBe(401);
    expect((await GET(req("Bearer nope"))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    expect((await GET(req("Bearer undefined"))).status).toBe(401);
  });

  it("calls the purge rpc with 180 days and returns the count", async () => {
    rpc.mockResolvedValue({ data: 7, error: null });
    const res = await GET(req("Bearer s3cret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, removed: 7 });
    expect(rpc).toHaveBeenCalledWith("cms_products_history_purge", { retention_days: 180 });
  });

  it("returns 500 on rpc error without leaking details", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const res = await GET(req("Bearer s3cret"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Purge failed" });
  });

  it("returns 500 when the service role is not configured", async () => {
    configured.mockReturnValue(false);
    expect((await GET(req("Bearer s3cret"))).status).toBe(500);
  });
});
