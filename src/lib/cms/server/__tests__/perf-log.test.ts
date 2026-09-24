import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("cms perf logging", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns elapsed ms for a past start time", async () => {
    const { logCmsPerf } = await import("@/lib/cms/server/perf-log.server");
    const started = Date.now() - 25;
    const ms = logCmsPerf("test.label", started, { ok: true });
    expect(ms).toBeGreaterThanOrEqual(20);
    expect(ms).toBeLessThan(5000);
  });
});
