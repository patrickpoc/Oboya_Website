import { NextResponse } from "next/server";
import { cmsGuardSession } from "@/lib/cms/server/require-cms-auth";
import { isApprover, listReviewableRequests } from "@/lib/cms/server/approvals.server";
import { countChangeRequests } from "@/lib/cms/server/change-requests.server";
import { OPEN_CHANGE_REQUEST_STATUSES } from "@/lib/cms/approvals/types";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const auth = await cmsGuardSession();
    if ("response" in auth) return auth.response;
    const approver = await isApprover(auth.user);
    const [review, mine] = await Promise.all([
      approver
        ? listReviewableRequests(auth.user).then((items) => items.length)
        : Promise.resolve(0),
      countChangeRequests({
        statuses: OPEN_CHANGE_REQUEST_STATUSES,
        requestedBy: auth.user.id,
      }),
    ]);
    return NextResponse.json({ approver, review, mine }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("Failed to count change requests:", error);
    return NextResponse.json(
      { approver: false, review: 0, mine: 0 },
      { headers: noStoreHeaders }
    );
  }
}
