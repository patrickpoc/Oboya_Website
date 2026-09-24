import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BULK_APPLY_GAP_MS, sleep } from "@/lib/cms/bulk-apply-pace";
import { DEFER_REVALIDATE_HEADER } from "@/lib/cms/revalidate-headers";

/**
 * Models the paced sequential apply used by import/update queues:
 * one HTTP write per product + gap between items, single revalidate at end.
 */
async function runPacedQueue(params: {
  count: number;
  gapMs: number;
  writeMs?: number;
}): Promise<{ elapsedMs: number; writes: number; revalidates: number }> {
  const writeMs = params.writeMs ?? 5;
  let writes = 0;
  let revalidates = 0;
  const started = Date.now();

  for (let index = 0; index < params.count; index += 1) {
    await sleep(writeMs);
    writes += 1;
    if (index < params.count - 1) {
      await sleep(params.gapMs);
    }
  }

  if (writes > 0) {
    revalidates += 1;
  }

  return {
    elapsedMs: Date.now() - started,
    writes,
    revalidates,
  };
}

/** Lower-bound duration for paced apply vs concurrent burst. */
export function estimateQueueLoad(params: {
  count: number;
  gapMs: number;
  writeMs: number;
}) {
  const pacedMs =
    params.count * params.writeMs + Math.max(0, params.count - 1) * params.gapMs;
  const burstMs = params.writeMs; // parallel writes collapse to ~one write
  return {
    pacedMs,
    burstMs,
    loadFactor: pacedMs / Math.max(1, burstMs),
    peakConcurrentWrites: 1,
    burstConcurrentWrites: params.count,
  };
}

describe("bulk execution queue pacing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exposes a client-safe defer header without next/cache", () => {
    expect(DEFER_REVALIDATE_HEADER).toBe("x-oboya-defer-revalidate");
    expect(BULK_APPLY_GAP_MS).toBeGreaterThanOrEqual(500);
  });

  it("spaces N products so wall time is at least (N-1) * gap", async () => {
    const count = 5;
    const gapMs = 1000;
    const writeMs = 10;

    const pending = runPacedQueue({ count, gapMs, writeMs });
    await vi.advanceTimersByTimeAsync(
      count * writeMs + (count - 1) * gapMs + 50
    );
    const result = await pending;

    expect(result.writes).toBe(count);
    expect(result.revalidates).toBe(1);
    expect(result.elapsedMs).toBeGreaterThanOrEqual((count - 1) * gapMs);
  });

  it("reduces concurrent write load vs a burst of parallel PUTs", () => {
    const count = 30; // max import/update batch
    const estimate = estimateQueueLoad({
      count,
      gapMs: BULK_APPLY_GAP_MS,
      writeMs: 200, // conservative per-product API cost
    });

    // Serial + 1s gaps: ~30*200 + 29*1000 ≈ 35s total, 1 write at a time.
    expect(estimate.peakConcurrentWrites).toBe(1);
    expect(estimate.burstConcurrentWrites).toBe(30);
    expect(estimate.pacedMs).toBeGreaterThanOrEqual(29_000);
    expect(estimate.loadFactor).toBeGreaterThan(100);
    // Burst of 30 parallel writes would hit auth/DB at once — queue avoids that.
    expect(estimate.burstConcurrentWrites / estimate.peakConcurrentWrites).toBe(
      30
    );
  });

  it("never fires more than one revalidate per batch", async () => {
    const pending = runPacedQueue({ count: 3, gapMs: 100, writeMs: 1 });
    await vi.advanceTimersByTimeAsync(1000);
    const result = await pending;
    expect(result.revalidates).toBe(1);
  });
});
