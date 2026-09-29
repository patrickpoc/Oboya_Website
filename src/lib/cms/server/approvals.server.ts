import "server-only";

import { NextResponse } from "next/server";
import { getChangeType, type ChangeTypeId } from "@/lib/cms/approvals/change-types";
import {
  canReviewRequest,
  findPolicy,
  isPolicyApprover,
  policyRequiresApproval,
  reviewableChangeTypes,
} from "@/lib/cms/approvals/policies";
import {
  OPEN_CHANGE_REQUEST_STATUSES,
  type ApprovalPolicy,
  type ChangeRequest,
  type ChangeRequestAction,
  type ChangeRequestDiff,
  type PendingApprovalInfo,
  type ReviewDecision,
} from "@/lib/cms/approvals/types";
import type { CmsUser } from "@/lib/cms/types";
import { addAuditLogDurable } from "@/lib/cms/server/audit-logs.server";
import { readApprovalPoliciesDurable } from "@/lib/cms/server/approval-policies.server";
import {
  getChangeRequest,
  insertChangeRequest,
  listChangeRequests,
  updateChangeRequest,
} from "@/lib/cms/server/change-requests.server";
import { getApplier } from "@/lib/cms/server/approval-appliers.server";

export class ApprovalError extends Error {
  constructor(
    public status: 400 | 403 | 404 | 409 | 500,
    message: string
  ) {
    super(message);
  }
}

export async function getPolicy(changeType: ChangeTypeId): Promise<ApprovalPolicy> {
  return findPolicy(await readApprovalPoliciesDurable(), changeType);
}

/** True when this user's change of `changeType` must be held for approval. */
export async function requiresApprovalFor(
  user: CmsUser,
  changeType: ChangeTypeId
): Promise<boolean> {
  return policyRequiresApproval(user, await getPolicy(changeType));
}

async function audit(
  user: Pick<CmsUser, "id" | "name">,
  request: ChangeRequest,
  action: string,
  details?: string
) {
  try {
    await addAuditLogDurable({
      userId: user.id,
      userName: user.name,
      action: `approval.${action}`,
      module: request.module,
      resourceId: request.entityId,
      details: [request.changeType, request.entityLabel, details].filter(Boolean).join(" | "),
    });
  } catch (error) {
    console.error("Approval audit log failed:", error);
  }
}

/** Hook for future e-mail/Slack notifications. */
async function onChangeRequestCreated(_request: ChangeRequest): Promise<void> {}

export type SubmitInput = {
  user: CmsUser;
  changeType: ChangeTypeId;
  entityId: string;
  entityLabel: string;
  action: ChangeRequestAction;
  payload: unknown;
  snapshot: unknown;
  diff: ChangeRequestDiff;
  summary: string;
};

export async function submitChangeRequest(input: SubmitInput): Promise<ChangeRequest> {
  const def = getChangeType(input.changeType);
  if (!def) throw new ApprovalError(400, "Unknown change type");

  const previous = await listChangeRequests({
    statuses: OPEN_CHANGE_REQUEST_STATUSES,
    changeTypes: [input.changeType],
    entityType: def.entityType,
    entityId: input.entityId,
    requestedBy: input.user.id,
  });
  for (const old of previous) {
    await updateChangeRequest(old.id, { status: "superseded" });
  }

  const request = await insertChangeRequest({
    changeType: input.changeType,
    module: def.module,
    entityType: def.entityType,
    entityId: input.entityId,
    entityLabel: input.entityLabel,
    action: input.action,
    requestedBy: input.user.id,
    requestedByName: input.user.name,
    payloadProposed: input.payload,
    snapshotBefore: input.snapshot ?? null,
    diff: input.diff,
    summary: input.summary,
  });
  await audit(input.user, request, "submitted", input.summary);
  await onChangeRequestCreated(request);
  return request;
}

export type GateResult<T> =
  | { applied: true; result: T }
  | { applied: false; request: ChangeRequest };

export async function submitOrApply<T>(
  input: Omit<SubmitInput, "diff" | "summary" | "snapshot"> & {
    /** Eager snapshot, or `loadSnapshot` to read it only when the change is held. */
    snapshot?: unknown;
    loadSnapshot?: () => Promise<unknown>;
    diff: ChangeRequestDiff | ((snapshot: unknown) => ChangeRequestDiff);
    summary: string | ((diff: ChangeRequestDiff) => string);
    apply: () => Promise<T>;
  }
): Promise<GateResult<T>> {
  if (!(await requiresApprovalFor(input.user, input.changeType))) {
    return { applied: true, result: await input.apply() };
  }
  const snapshot = input.loadSnapshot ? await input.loadSnapshot() : input.snapshot ?? null;
  const diff = typeof input.diff === "function" ? input.diff(snapshot) : input.diff;
  const summary = typeof input.summary === "function" ? input.summary(diff) : input.summary;
  const request = await submitChangeRequest({ ...input, snapshot, diff, summary });
  return { applied: false, request };
}

/** Gate for single-document settings pages (homepage, about, …). */
export async function gateSettingsDocument<T>(input: {
  user: CmsUser;
  changeType: ChangeTypeId;
  entityId: string;
  entityLabel: string;
  body: T;
  read: () => Promise<T>;
  save: (body: T) => Promise<T>;
  revalidate: () => void;
}): Promise<NextResponse> {
  const { diffJson, summarizeDiff } = await import("@/lib/cms/approvals/diff");
  const gate = await submitOrApply({
    user: input.user,
    changeType: input.changeType,
    entityId: input.entityId,
    entityLabel: input.entityLabel,
    action: "update",
    payload: input.body,
    loadSnapshot: input.read,
    diff: (before) => ({ entries: diffJson(before, input.body) }),
    summary: (d) => summarizeDiff(d.entries),
    apply: async () => {
      const saved = await input.save(input.body);
      try {
        input.revalidate();
      } catch {
        // Ignore when revalidation is unavailable.
      }
      return saved;
    },
  });
  if (!gate.applied) return pendingApprovalResponse(gate.request, input.body as object);
  return NextResponse.json(gate.result);
}

export function toPendingInfo(request: ChangeRequest): PendingApprovalInfo {
  return {
    requestId: request.id,
    changeType: request.changeType,
    summary: request.summary,
  };
}

/** 202 response for a fully held change; `body` keeps editor state in sync. */
export function pendingApprovalResponse(request: ChangeRequest, body?: object) {
  return NextResponse.json(
    { ...(body ?? {}), pendingApproval: toPendingInfo(request) },
    { status: 202 }
  );
}

export function stripApprovalMeta<T>(body: T): T {
  if (body && typeof body === "object" && "pendingApproval" in body) {
    const { pendingApproval: _omit, ...rest } = body as T & { pendingApproval?: unknown };
    return rest as T;
  }
  return body;
}

export function approvalErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ApprovalError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(fallback, error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: 500 }
  );
}

export async function reviewChangeRequest(input: {
  id: string;
  user: CmsUser;
  decision: ReviewDecision;
  comment?: string;
  force?: boolean;
}): Promise<ChangeRequest> {
  const request = await getChangeRequest(input.id);
  if (!request) throw new ApprovalError(404, "Change request not found");
  if (!OPEN_CHANGE_REQUEST_STATUSES.includes(request.status)) {
    throw new ApprovalError(409, "This request is no longer open");
  }

  const policy = await getPolicy(request.changeType);
  if (request.requestedBy === input.user.id) {
    throw new ApprovalError(403, "You cannot review your own request");
  }
  if (!canReviewRequest(input.user, policy, request)) {
    throw new ApprovalError(403, "You are not an approver for this change type");
  }

  const comment = input.comment?.trim() || null;
  const now = new Date().toISOString();

  if (input.decision === "in_review") {
    const next = await updateChangeRequest(request.id, {
      status: "in_review",
      inReviewBy: input.user.id,
      inReviewByName: input.user.name,
      reviewComment: comment ?? request.reviewComment,
    });
    await audit(input.user, next, "in_review", comment ?? undefined);
    return next;
  }

  if (input.decision === "reject") {
    if (policy.requireRejectComment && !comment) {
      throw new ApprovalError(400, "A comment is required to reject");
    }
    const next = await updateChangeRequest(request.id, {
      status: "rejected",
      reviewerId: input.user.id,
      reviewerName: input.user.name,
      reviewedAt: now,
      reviewComment: comment,
    });
    await audit(input.user, next, "rejected", comment ?? undefined);
    return next;
  }

  const applier = await getApplier(request.changeType);
  if (!applier) throw new ApprovalError(400, "This change type cannot be applied yet");

  const conflicts = await applier.detectConflicts(request);
  if (conflicts.length > 0 && !input.force) {
    const next = await updateChangeRequest(request.id, {
      status: "conflict",
      diff: { ...request.diff, conflicts },
      inReviewBy: input.user.id,
      inReviewByName: input.user.name,
    });
    await audit(input.user, next, "conflict", conflicts.join(", "));
    return next;
  }

  try {
    const diff = await applier.apply(request, { force: Boolean(input.force) });
    const next = await updateChangeRequest(request.id, {
      status: "approved",
      reviewerId: input.user.id,
      reviewerName: input.user.name,
      reviewedAt: now,
      reviewComment: comment,
      appliedAt: new Date().toISOString(),
      applyError: null,
      ...(diff ? { diff } : {}),
    });
    await audit(input.user, next, input.force ? "approved_forced" : "approved", comment ?? undefined);
    return next;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply change";
    const next = await updateChangeRequest(request.id, {
      status: "failed",
      reviewerId: input.user.id,
      reviewerName: input.user.name,
      reviewedAt: now,
      reviewComment: comment,
      applyError: message,
    });
    await audit(input.user, next, "apply_failed", message);
    return next;
  }
}

export async function cancelChangeRequest(id: string, user: CmsUser): Promise<ChangeRequest> {
  const request = await getChangeRequest(id);
  if (!request) throw new ApprovalError(404, "Change request not found");
  if (!OPEN_CHANGE_REQUEST_STATUSES.includes(request.status)) {
    throw new ApprovalError(409, "This request is no longer open");
  }
  if (request.requestedBy !== user.id && user.role !== "super_admin") {
    throw new ApprovalError(403, "Only the requester can cancel this request");
  }
  const next = await updateChangeRequest(id, { status: "cancelled" });
  await audit(user, next, "cancelled");
  return next;
}

/** Requests this user may act on (maker != checker already filtered). */
export async function listReviewableRequests(user: CmsUser, statuses = OPEN_CHANGE_REQUEST_STATUSES) {
  const doc = await readApprovalPoliciesDurable();
  const types = reviewableChangeTypes(user, doc);
  if (types.length === 0) return [];
  const items = await listChangeRequests({ statuses, changeTypes: types });
  return items.filter((r) => r.requestedBy !== user.id);
}

export async function isApprover(user: CmsUser): Promise<boolean> {
  const doc = await readApprovalPoliciesDurable();
  return doc.policies.some((p) => p.requiresApproval && isPolicyApprover(user, p));
}
