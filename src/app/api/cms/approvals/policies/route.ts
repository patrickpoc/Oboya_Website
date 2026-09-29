import { NextResponse } from "next/server";
import type { ApprovalPoliciesDoc } from "@/lib/cms/approvals/types";
import {
  readApprovalPoliciesDurable,
  saveApprovalPoliciesDurable,
} from "@/lib/cms/server/approval-policies.server";
import {
  cmsGuardSession,
  cmsGuardSuperAdmin,
} from "@/lib/cms/server/require-cms-auth";
import { addAuditLogDurable } from "@/lib/cms/server/audit-logs.server";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const auth = await cmsGuardSession();
    if ("response" in auth) return auth.response;
    const doc = await readApprovalPoliciesDurable({ fresh: true });
    return NextResponse.json(doc, { headers: noStoreHeaders });
  } catch (error) {
    console.error("Failed to load approval policies:", error);
    return NextResponse.json({ error: "Failed to load approval policies" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await cmsGuardSuperAdmin();
    if ("response" in auth) return auth.response;

    const payload = (await request.json()) as ApprovalPoliciesDoc;
    if (!payload || !Array.isArray(payload.policies)) {
      return NextResponse.json({ error: "Invalid approval policies" }, { status: 400 });
    }
    const saved = await saveApprovalPoliciesDurable(payload);
    try {
      await addAuditLogDurable({
        userId: auth.user.id,
        userName: auth.user.name,
        action: "approval.policies_updated",
        module: "users",
        details: `${saved.policies.filter((p) => p.requiresApproval).length} active policies`,
      });
    } catch {
      // Audit is best-effort.
    }
    return NextResponse.json(saved, { headers: noStoreHeaders });
  } catch (error) {
    console.error("Failed to save approval policies:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save approval policies" },
      { status: 500 }
    );
  }
}
