import { NextResponse } from "next/server";
import { listCmsUsersDurable } from "@/lib/cms/server/users.server";
import { cmsGuardSuperAdmin } from "@/lib/cms/server/require-cms-auth";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const auth = await cmsGuardSuperAdmin();
    if ("response" in auth) return auth.response;

    const users = await listCmsUsersDurable();
    return NextResponse.json(
      { ok: true, users },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error("Failed to list access-control users:", error);
    return NextResponse.json(
      { error: "Failed to list users" },
      { status: 500 }
    );
  }
}
