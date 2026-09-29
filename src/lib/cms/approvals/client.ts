import type { PendingApprovalInfo } from "@/lib/cms/approvals/types";

export function readPendingApprovals(payload: unknown): PendingApprovalInfo[] {
  if (!payload || typeof payload !== "object") return [];
  const data = payload as {
    pendingApproval?: PendingApprovalInfo;
    pendingApprovals?: PendingApprovalInfo[];
  };
  if (Array.isArray(data.pendingApprovals) && data.pendingApprovals.length > 0) {
    return data.pendingApprovals;
  }
  return data.pendingApproval ? [data.pendingApproval] : [];
}

export function withoutApprovalMeta<T>(payload: T): T {
  if (!payload || typeof payload !== "object") return payload;
  const {
    pendingApproval: _a,
    pendingApprovals: _b,
    ...rest
  } = payload as T & { pendingApproval?: unknown; pendingApprovals?: unknown };
  return rest as T;
}

export const APPROVALS_CHANGED_EVENT = "cms:approvals-changed";

export function emitApprovalsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(APPROVALS_CHANGED_EVENT));
  }
}
