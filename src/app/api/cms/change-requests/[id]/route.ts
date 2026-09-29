import { NextResponse } from "next/server";
import type { ReviewDecision } from "@/lib/cms/approvals/types";
import { canReviewRequest } from "@/lib/cms/approvals/policies";
import { cmsGuardSession } from "@/lib/cms/server/require-cms-auth";
import { getChangeRequest } from "@/lib/cms/server/change-requests.server";
import {
  approvalErrorResponse,
  cancelChangeRequest,
  getPolicy,
  reviewChangeRequest,
} from "@/lib/cms/server/approvals.server";
import { noStoreHeaders } from "@/lib/security/http-cache";
import { currentVsProposed } from "@/lib/cms/server/approval-appliers.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

const DECISIONS: ReviewDecision[] = ["approve", "in_review", "reject"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await cmsGuardSession();
    if ("response" in auth) return auth.response;
    const { id } = await params;
    const item = await getChangeRequest(id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const policy = await getPolicy(item.changeType);
    const canReview = canReviewRequest(auth.user, policy, item);
    const isOwner = item.requestedBy === auth.user.id;
    if (!canReview && !isOwner && auth.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const currentDiff =
      item.status === "conflict" && canReview
        ? await currentVsProposed(item).catch(() => [])
        : undefined;
    return NextResponse.json(
      {
        item,
        currentDiff,
        canReview,
        canCancel: isOwner || auth.user.role === "super_admin",
        requireRejectComment: policy.requireRejectComment,
      },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    return approvalErrorResponse(error, "Failed to load change request");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await cmsGuardSession();
    if ("response" in auth) return auth.response;
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      decision?: string;
      action?: string;
      comment?: string;
      force?: boolean;
    };

    if (body.action === "cancel") {
      const item = await cancelChangeRequest(id, auth.user);
      return NextResponse.json({ item });
    }

    if (!body.decision || !DECISIONS.includes(body.decision as ReviewDecision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    const item = await reviewChangeRequest({
      id,
      user: auth.user,
      decision: body.decision as ReviewDecision,
      comment: body.comment,
      force: Boolean(body.force),
    });
    return NextResponse.json({ item });
  } catch (error) {
    return approvalErrorResponse(error, "Failed to update change request");
  }
}
