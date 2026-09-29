import "server-only";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  ChangeRequest,
  ChangeRequestDiff,
  ChangeRequestStatus,
} from "@/lib/cms/approvals/types";
import type { ChangeTypeId } from "@/lib/cms/approvals/change-types";
import type { CmsModule } from "@/lib/cms/types";
import { writeLocalJsonFile } from "@/lib/cms/server/local-fs.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

const TABLE = "cms_change_requests";
const LOCAL_FILE = path.join(process.cwd(), "data", "cms", "change-requests.json");

type Row = {
  id: string;
  change_type: string;
  module: string;
  entity_type: string;
  entity_id: string;
  entity_label: string;
  action: string;
  requested_by: string | null;
  requested_by_name: string;
  requested_at: string;
  payload_proposed: unknown;
  snapshot_before: unknown;
  diff: ChangeRequestDiff | null;
  summary: string;
  status: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  in_review_by: string | null;
  in_review_by_name: string | null;
  applied_at: string | null;
  apply_error: string | null;
  updated_at: string;
};

function rowToRequest(row: Row): ChangeRequest {
  return {
    id: row.id,
    changeType: row.change_type as ChangeTypeId,
    module: row.module as CmsModule,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label ?? "",
    action: row.action as ChangeRequest["action"],
    requestedBy: row.requested_by ?? "",
    requestedByName: row.requested_by_name ?? "",
    requestedAt: row.requested_at,
    payloadProposed: row.payload_proposed,
    snapshotBefore: row.snapshot_before,
    diff: row.diff ?? { entries: [] },
    summary: row.summary ?? "",
    status: row.status as ChangeRequestStatus,
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name,
    reviewedAt: row.reviewed_at,
    reviewComment: row.review_comment,
    inReviewBy: row.in_review_by,
    inReviewByName: row.in_review_by_name,
    appliedAt: row.applied_at,
    applyError: row.apply_error,
    updatedAt: row.updated_at,
  };
}

function requestToRow(req: ChangeRequest): Row {
  return {
    id: req.id,
    change_type: req.changeType,
    module: req.module,
    entity_type: req.entityType,
    entity_id: req.entityId,
    entity_label: req.entityLabel,
    action: req.action,
    requested_by: req.requestedBy || null,
    requested_by_name: req.requestedByName,
    requested_at: req.requestedAt,
    payload_proposed: req.payloadProposed ?? {},
    snapshot_before: req.snapshotBefore ?? null,
    diff: req.diff,
    summary: req.summary,
    status: req.status,
    reviewer_id: req.reviewerId,
    reviewer_name: req.reviewerName,
    reviewed_at: req.reviewedAt,
    review_comment: req.reviewComment,
    in_review_by: req.inReviewBy,
    in_review_by_name: req.inReviewByName,
    applied_at: req.appliedAt,
    apply_error: req.applyError,
    updated_at: req.updatedAt,
  };
}

type DbError = { code?: string; message: string };

function isMissingTable(error: DbError) {
  return error.code === "PGRST205" || error.code === "42P01";
}

function writeError(error: DbError): Error {
  if (isMissingTable(error)) {
    return new Error(
      "Approval workflow storage is not set up: apply migration 20260929_cms_change_requests.sql"
    );
  }
  return new Error(error.message);
}

async function client() {
  return isServiceRoleConfigured() ? createServiceClient() : await createClient();
}

async function readLocal(): Promise<ChangeRequest[]> {
  try {
    const raw = await readFile(LOCAL_FILE, "utf-8");
    const parsed = JSON.parse(raw) as ChangeRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocal(items: ChangeRequest[]) {
  await writeLocalJsonFile(LOCAL_FILE, items);
}

export type ChangeRequestFilter = {
  statuses?: ChangeRequestStatus[];
  changeTypes?: string[];
  module?: string;
  requestedBy?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
};

export async function listChangeRequests(
  filter: ChangeRequestFilter = {}
): Promise<ChangeRequest[]> {
  const limit = filter.limit ?? 200;
  if (isSupabaseConfigured()) {
    if (filter.changeTypes && filter.changeTypes.length === 0) return [];
    const db = await client();
    let query = db
      .from(TABLE)
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(limit);
    if (filter.statuses?.length) query = query.in("status", filter.statuses);
    if (filter.changeTypes?.length) query = query.in("change_type", filter.changeTypes);
    if (filter.module) query = query.eq("module", filter.module);
    if (filter.requestedBy) query = query.eq("requested_by", filter.requestedBy);
    if (filter.entityType) query = query.eq("entity_type", filter.entityType);
    if (filter.entityId) query = query.eq("entity_id", filter.entityId);
    const { data, error } = await query;
    if (error) {
      if (isMissingTable(error)) return [];
      throw new Error(error.message);
    }
    return ((data as Row[] | null) ?? []).map(rowToRequest);
  }

  const items = await readLocal();
  return items
    .filter((r) => !filter.statuses?.length || filter.statuses.includes(r.status))
    .filter((r) => !filter.changeTypes || filter.changeTypes.includes(r.changeType))
    .filter((r) => !filter.module || r.module === filter.module)
    .filter((r) => !filter.requestedBy || r.requestedBy === filter.requestedBy)
    .filter((r) => !filter.entityType || r.entityType === filter.entityType)
    .filter((r) => !filter.entityId || r.entityId === filter.entityId)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
    .slice(0, limit);
}

export async function getChangeRequest(id: string): Promise<ChangeRequest | null> {
  if (isSupabaseConfigured()) {
    const db = await client();
    const { data, error } = await db.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) {
      if (isMissingTable(error)) return null;
      throw new Error(error.message);
    }
    return data ? rowToRequest(data as Row) : null;
  }
  return (await readLocal()).find((r) => r.id === id) ?? null;
}

export async function insertChangeRequest(
  input: Omit<
    ChangeRequest,
    | "id"
    | "requestedAt"
    | "updatedAt"
    | "status"
    | "reviewerId"
    | "reviewerName"
    | "reviewedAt"
    | "reviewComment"
    | "inReviewBy"
    | "inReviewByName"
    | "appliedAt"
    | "applyError"
  >
): Promise<ChangeRequest> {
  const now = new Date().toISOString();
  const request: ChangeRequest = {
    ...input,
    id: randomUUID(),
    requestedAt: now,
    updatedAt: now,
    status: "pending",
    reviewerId: null,
    reviewerName: null,
    reviewedAt: null,
    reviewComment: null,
    inReviewBy: null,
    inReviewByName: null,
    appliedAt: null,
    applyError: null,
  };

  if (isSupabaseConfigured()) {
    const db = await client();
    const { data, error } = await db
      .from(TABLE)
      .insert(requestToRow(request))
      .select("*")
      .single();
    if (error) throw writeError(error);
    return rowToRequest(data as Row);
  }

  const items = await readLocal();
  await writeLocal([request, ...items]);
  return request;
}

export async function updateChangeRequest(
  id: string,
  patch: Partial<ChangeRequest>
): Promise<ChangeRequest> {
  const current = await getChangeRequest(id);
  if (!current) throw new Error("Change request not found");
  const next: ChangeRequest = {
    ...current,
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const db = await client();
    const { data, error } = await db
      .from(TABLE)
      .update(requestToRow(next))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw writeError(error);
    return rowToRequest(data as Row);
  }

  const items = await readLocal();
  await writeLocal(items.map((r) => (r.id === id ? next : r)));
  return next;
}

export async function countChangeRequests(filter: ChangeRequestFilter): Promise<number> {
  if (isSupabaseConfigured()) {
    if (filter.changeTypes && filter.changeTypes.length === 0) return 0;
    const db = await client();
    let query = db.from(TABLE).select("id", { count: "exact", head: true });
    if (filter.statuses?.length) query = query.in("status", filter.statuses);
    if (filter.changeTypes?.length) query = query.in("change_type", filter.changeTypes);
    if (filter.requestedBy) query = query.eq("requested_by", filter.requestedBy);
    const { count, error } = await query;
    if (error) {
      if (isMissingTable(error)) return 0;
      throw new Error(error.message);
    }
    return count ?? 0;
  }
  return (await listChangeRequests({ ...filter, limit: 10_000 })).length;
}
