import { NextResponse } from "next/server";
import {
  anonymizeApplication,
  deleteApplication,
  listExpiredPendingIds,
  listRetentionExpiredIds,
} from "@/lib/cms/server/careers-applications.server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = 200;
const MAX_BATCHES = 10;

const SYSTEM_ACTOR = { id: "system", name: "Retention job" };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = Date.now();
    let pendingRemoved = 0;
    let anonymized = 0;
    let failed = 0;
    // Oldest first, in batches. A batch with zero successes stops the loop so failing rows are not retried forever.
    const drain = async (list: (now: number, n: number) => Promise<string[]>, act: (id: string) => Promise<unknown>) => {
      let done = 0;
      for (let i = 0; i < MAX_BATCHES; i += 1) {
        const ids = await list(now, BATCH);
        if (!ids.length) break;
        let ok = 0;
        for (const id of ids) {
          try {
            await act(id);
            ok += 1;
          } catch {
            failed += 1;
          }
        }
        done += ok;
        if (!ok || ids.length < BATCH) break;
      }
      return done;
    };
    // deleteApplication removes the CV objects first, then the row.
    pendingRemoved = await drain(listExpiredPendingIds, deleteApplication);
    anonymized = await drain(listRetentionExpiredIds, (id) => anonymizeApplication(id, SYSTEM_ACTOR));
    console.info("[purge-careers]", { pendingRemoved, anonymized, failed });
    return NextResponse.json({ ok: true, pendingRemoved, anonymized, failed });
  } catch (error) {
    console.error("Careers purge failed:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}
