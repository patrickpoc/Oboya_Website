import { NextResponse } from "next/server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { revalidateShopPages } from "@/lib/cms/revalidate-site";
import { logCmsPerf } from "@/lib/cms/server/perf-log.server";

/** One-shot shop cache bust after bulk import/update (deferred per-write). */
export async function POST() {
  const auth = await cmsGuard("marketplace", "edit");
  if ("response" in auth) return auth.response;

  const started = Date.now();
  try {
    revalidateShopPages();
    logCmsPerf("POST /api/cms/products/revalidate", started);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to revalidate shop";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
