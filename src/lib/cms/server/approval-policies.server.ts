import "server-only";

import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";
import {
  buildDefaultApprovalPolicies,
  normalizeApprovalPolicies,
} from "@/lib/cms/approvals/policies";
import type { ApprovalPoliciesDoc } from "@/lib/cms/approvals/types";

export const APPROVAL_POLICIES_DOC_ID = "cms-approval-policies";

/** Short cross-request memo; saves in this isolate refresh it immediately. */
const TTL_MS = 30_000;
let cached: { doc: ApprovalPoliciesDoc; expiresAt: number } | null = null;

export async function readApprovalPoliciesDurable(options?: {
  fresh?: boolean;
}): Promise<ApprovalPoliciesDoc> {
  if (!options?.fresh && cached && Date.now() < cached.expiresAt) {
    return cached.doc;
  }
  const remote = await readCmsDocumentData(APPROVAL_POLICIES_DOC_ID, { fresh: true });
  const doc = normalizeApprovalPolicies(remote ?? buildDefaultApprovalPolicies());
  cached = { doc, expiresAt: Date.now() + TTL_MS };
  return doc;
}

export async function saveApprovalPoliciesDurable(
  input: ApprovalPoliciesDoc
): Promise<ApprovalPoliciesDoc> {
  const doc = normalizeApprovalPolicies(input);
  await writeCmsDocumentData(APPROVAL_POLICIES_DOC_ID, "users", doc);
  cached = { doc, expiresAt: Date.now() + TTL_MS };
  return doc;
}
