import { NextResponse } from "next/server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { readLeadCounts } from "@/lib/cms/server/forms.server";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const auth = await cmsGuard("forms", "view");
    if ("response" in auth) {
      return NextResponse.json({ unread: 0, open: 0 }, { headers: noStoreHeaders });
    }
    const counts = await readLeadCounts();
    return NextResponse.json(counts, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ unread: 0, open: 0 }, { headers: noStoreHeaders });
  }
}
