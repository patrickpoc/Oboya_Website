import { NextResponse } from "next/server";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RETENTION_DAYS = 180;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!isServiceRoleConfigured()) throw new Error("Service role unavailable");
    const { data, error } = await createServiceClient().rpc("cms_products_history_purge", {
      retention_days: RETENTION_DAYS,
    });
    if (error) throw new Error(error.message);
    const removed = typeof data === "number" ? data : 0;
    console.info("[purge-product-history]", { removed });
    return NextResponse.json({ ok: true, removed });
  } catch (error) {
    console.error("Product history purge failed:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}
