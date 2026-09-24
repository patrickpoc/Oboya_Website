import { NextResponse } from "next/server";
import { purgeExpiredProducts } from "@/lib/cms/server/products.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";

/** Explicit trash purge — not run on catalog GET hot paths. */
export async function POST() {
  const auth = await cmsGuard("marketplace", "edit");
  if ("response" in auth) return auth.response;

  try {
    const purged = await purgeExpiredProducts({ asAdmin: true });
    return NextResponse.json({ ok: true, purged });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to purge products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
