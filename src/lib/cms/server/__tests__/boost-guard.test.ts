import { describe, expect, it, vi } from "vitest";
import { invalidBoostResponse, isValidBoostField, schemaPendingResponse } from "@/lib/cms/server/boost-guard";

describe("boost guard", () => {
  it("accepts absent and whole numbers 0-100 only", () => {
    for (const ok of [undefined, 0, 1, 100]) expect(isValidBoostField(ok)).toBe(true);
    for (const bad of [-1, 101, 1.5, NaN, "5", null]) expect(isValidBoostField(bad)).toBe(false);
  });

  it("returns 400 with field boost for the first bad product", async () => {
    expect(invalidBoostResponse([{ boost: 5 }, {}])).toBeNull();
    const res = invalidBoostResponse([{ id: "a", sku: "A", boost: 200 }]);
    expect(res?.status).toBe(400);
    expect(((await res!.json()) as { field: string }).field).toBe("boost");
  });

  it("maps only 503 errors to the generic schema message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(schemaPendingResponse(new Error("x"))).toBeNull();
    const res = schemaPendingResponse(Object.assign(new Error("secret detail"), { status: 503 }));
    expect(res?.status).toBe(503);
    expect(await res!.json()).toEqual({ error: "Product schema update pending" });
  });
});
