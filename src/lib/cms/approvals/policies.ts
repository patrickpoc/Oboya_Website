import {
  CHANGE_TYPES,
  isChangeTypeId,
  type ChangeTypeId,
} from "@/lib/cms/approvals/change-types";
import type {
  ApprovalPoliciesDoc,
  ApprovalPolicy,
  ChangeRequest,
} from "@/lib/cms/approvals/types";
import type { CmsUser } from "@/lib/cms/types";

export function defaultPolicy(changeType: ChangeTypeId): ApprovalPolicy {
  return {
    changeType,
    requiresApproval: false,
    approverRoleIds: [],
    approverUserIds: [],
    exemptRoleIds: ["super_admin"],
    requireRejectComment: true,
  };
}

export function buildDefaultApprovalPolicies(): ApprovalPoliciesDoc {
  return { policies: CHANGE_TYPES.map((c) => defaultPolicy(c.id)) };
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.filter((v): v is string => typeof v === "string" && v.trim() !== ""))
  );
}

export function normalizeApprovalPolicies(raw: unknown): ApprovalPoliciesDoc {
  const input =
    raw && typeof raw === "object" && Array.isArray((raw as ApprovalPoliciesDoc).policies)
      ? (raw as ApprovalPoliciesDoc).policies
      : [];
  const byType = new Map<ChangeTypeId, ApprovalPolicy>();
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const changeType = String((item as ApprovalPolicy).changeType ?? "");
    if (!isChangeTypeId(changeType)) continue;
    const base = defaultPolicy(changeType);
    byType.set(changeType, {
      changeType,
      requiresApproval: Boolean(item.requiresApproval),
      approverRoleIds: stringList(item.approverRoleIds),
      approverUserIds: stringList(item.approverUserIds),
      exemptRoleIds: Array.isArray(item.exemptRoleIds)
        ? stringList(item.exemptRoleIds)
        : base.exemptRoleIds,
      requireRejectComment:
        typeof item.requireRejectComment === "boolean"
          ? item.requireRejectComment
          : base.requireRejectComment,
    });
  }
  return {
    policies: CHANGE_TYPES.map((c) => byType.get(c.id) ?? defaultPolicy(c.id)),
  };
}

export function findPolicy(
  doc: ApprovalPoliciesDoc,
  changeType: ChangeTypeId
): ApprovalPolicy {
  return doc.policies.find((p) => p.changeType === changeType) ?? defaultPolicy(changeType);
}

export function isExemptFromPolicy(user: CmsUser, policy: ApprovalPolicy): boolean {
  return policy.exemptRoleIds.includes(user.role);
}

export function policyRequiresApproval(user: CmsUser, policy: ApprovalPolicy): boolean {
  return policy.requiresApproval && !isExemptFromPolicy(user, policy);
}

/** Approver for the policy in general (ignores maker != checker). */
export function isPolicyApprover(user: CmsUser, policy: ApprovalPolicy): boolean {
  if (user.status !== "active") return false;
  if (user.role === "super_admin") return true;
  return (
    policy.approverRoleIds.includes(user.role) ||
    policy.approverUserIds.includes(user.id)
  );
}

/** Maker-checker: the requester can never review their own request. */
export function canReviewRequest(
  user: CmsUser,
  policy: ApprovalPolicy,
  request: Pick<ChangeRequest, "requestedBy">
): boolean {
  if (request.requestedBy === user.id) return false;
  return isPolicyApprover(user, policy);
}

export function reviewableChangeTypes(
  user: CmsUser,
  doc: ApprovalPoliciesDoc
): ChangeTypeId[] {
  return doc.policies
    .filter((p) => isPolicyApprover(user, p))
    .map((p) => p.changeType);
}

/** Show approvals UI only when the user approves at least one active policy. */
export function isApproverForAnyActivePolicy(
  user: CmsUser,
  doc: ApprovalPoliciesDoc
): boolean {
  return doc.policies.some((p) => p.requiresApproval && isPolicyApprover(user, p));
}
