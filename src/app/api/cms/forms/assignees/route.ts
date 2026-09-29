import { NextResponse } from "next/server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { listCmsUsersDurable } from "@/lib/cms/server/users.server";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const auth = await cmsGuard("forms", "view");
  if ("response" in auth) return auth.response;
  try {
    const users = (await listCmsUsersDurable())
      .filter((u) => u.status === "active")
      .map((u) => ({ id: u.id, name: u.name }));
    return NextResponse.json({ users }, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ users: [] }, { headers: noStoreHeaders });
  }
}
