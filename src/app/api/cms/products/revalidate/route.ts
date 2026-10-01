import { NextResponse } from "next/server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { invalidateCatalog } from "@/lib/cms/server/cache-invalidation.server";
import { logCmsPerf } from "@/lib/cms/server/perf-log.server";

/**
 * One-shot catalog bust after a bulk import/update. Each deferred write
 * already invalidated its own product pages; only the shared list remains.
 */
export async function POST() {
  const auth = await cmsGuard("marketplace", "edit");
  if ("response" in auth) return auth.response;

  const started = Date.now();
  try {
    invalidateCatalog();
    logCmsPerf("POST /api/cms/products/revalidate", started);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to revalidate shop";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
