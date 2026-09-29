import type { CmsModule } from "@/lib/cms/types";
import type { ChangeTypeId } from "@/lib/cms/approvals/change-types";

export type ApprovalPolicy = {
  changeType: ChangeTypeId;
  requiresApproval: boolean;
  approverRoleIds: string[];
  approverUserIds: string[];
  exemptRoleIds: string[];
  requireRejectComment: boolean;
};

export type ApprovalPoliciesDoc = {
  policies: ApprovalPolicy[];
};

export const CHANGE_REQUEST_STATUSES = [
  "pending",
  "in_review",
  "approved",
  "rejected",
  "conflict",
  "cancelled",
  "superseded",
  "failed",
] as const;

export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

export const OPEN_CHANGE_REQUEST_STATUSES: ChangeRequestStatus[] = [
  "pending",
  "in_review",
  "conflict",
];

export type ChangeRequestAction = "create" | "update" | "delete" | "bulk";

export type ChangeDiffEntry = {
  path: string;
  before: unknown;
  after: unknown;
};

export type BulkItemDiff = {
  productId: string;
  sku: string;
  name: string;
  changes: ChangeDiffEntry[];
  result?: "SUCCESS" | "FAILED" | "CONFLICT";
  error?: string;
};

export type ChangeRequestDiff = {
  entries: ChangeDiffEntry[];
  items?: BulkItemDiff[];
  conflicts?: string[];
};

export type ChangeRequest = {
  id: string;
  changeType: ChangeTypeId;
  module: CmsModule;
  entityType: string;
  entityId: string;
  entityLabel: string;
  action: ChangeRequestAction;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  payloadProposed: unknown;
  snapshotBefore: unknown;
  diff: ChangeRequestDiff;
  summary: string;
  status: ChangeRequestStatus;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  inReviewBy: string | null;
  inReviewByName: string | null;
  appliedAt: string | null;
  applyError: string | null;
  updatedAt: string;
};

export type PendingApprovalInfo = {
  requestId: string;
  changeType: ChangeTypeId;
  summary: string;
};

export type ReviewDecision = "approve" | "in_review" | "reject";
