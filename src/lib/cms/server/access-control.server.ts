import "server-only";

import { writeCmsDocumentData } from "@/lib/cms/server/cms-document.server";
import { CmsReadError, readCmsDocumentChecked } from "@/lib/cms/server/strict-read";
import type { AccessControlDoc, AccessRoleDefinition } from "@/lib/cms/permissions/access-types";
import {
  CMS_ACTIONS,
  CMS_MODULES,
  isSystemRoleId,
  isValidRoleId,
} from "@/lib/cms/permissions/access-types";
import { buildDefaultAccessControlDoc } from "@/lib/cms/permissions/defaults";
import { hydrateAccessControl, getAccessSnapshot } from "@/lib/cms/permissions/access-store";

export const ACCESS_CONTROL_DOC_ID = "cms-access-control";

export function normalizeDoc(raw: unknown): AccessControlDoc {
  const fallback = buildDefaultAccessControlDoc();
  if (!raw || typeof raw !== "object") return fallback;

  const data = raw as Partial<AccessControlDoc>;
  const rolesIn = Array.isArray(data.roles) ? data.roles : [];
  const roles: AccessRoleDefinition[] = [];

  for (const r of rolesIn) {
    if (!r || typeof r !== "object") continue;
    const id = typeof r.id === "string" ? r.id : "";
    if (!isValidRoleId(id)) continue;
    roles.push({
      id,
      label:
        typeof r.label === "string" && r.label.trim()
          ? r.label.trim()
          : id,
      system: Boolean(r.system) || isSystemRoleId(id),
      active: r.active !== false,
      sortOrder:
        typeof r.sortOrder === "number" && Number.isFinite(r.sortOrder)
          ? r.sortOrder
          : roles.length,
    });
  }

  // Ensure all system roles exist.
  for (const builtin of fallback.roles) {
    if (!roles.some((r) => r.id === builtin.id)) {
      roles.push(builtin);
    }
  }

  // System roles keep the canonical hierarchy order; custom roles follow.
  const systemOrder = new Map(fallback.roles.map((r) => [r.id, r.sortOrder]));
  roles.sort((a, b) => {
    const sa = systemOrder.get(a.id);
    const sb = systemOrder.get(b.id);
    if (sa !== undefined && sb !== undefined) return sa - sb;
    if (sa !== undefined) return -1;
    if (sb !== undefined) return 1;
    return a.sortOrder - b.sortOrder;
  });
  roles.forEach((r, index) => {
    r.sortOrder = index;
  });

  const matrix =
    data.matrix && typeof data.matrix === "object"
      ? structuredClone(data.matrix)
      : structuredClone(fallback.matrix);

  // Roles added to the built-in set after the doc was saved get their default row.
  for (const [roleId, row] of Object.entries(fallback.matrix)) {
    if (!matrix[roleId]) matrix[roleId] = structuredClone(row);
  }

  // Super admin always full on every module.
  matrix.super_admin = Object.fromEntries(
    CMS_MODULES.map((m) => [m, "full" as const])
  );

  return { roles, matrix };
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === "object" && !Array.isArray(v);

type RawAccessDoc = { roles: unknown[]; matrix: Record<string, unknown> };

/** Only the top-level types decide whether a document is readable at all. */
const hasAccessDocShape = (v: unknown): v is RawAccessDoc =>
  isPlainObject(v) && Array.isArray(v.roles) && isPlainObject(v.matrix);

const DENY_ROW = () => Object.fromEntries(CMS_MODULES.map((m) => [m, "none" as const]));

/** A cell is "full", "none" or a list of known actions; anything else is treated as "none". */
function sanitizeCell(value: unknown): "full" | "none" | string[] {
  if (value === "full" || value === "none") return value;
  if (Array.isArray(value)) {
    return value.filter((a): a is string => typeof a === "string" && (CMS_ACTIONS as string[]).includes(a));
  }
  return "none";
}

/**
 * Drops role definitions and matrix rows that are not usable. A dropped role row
 * (custom or system) means that role has no permissions (deny-all); only super_admin
 * is exempt, because `normalizeDoc` always rebuilds its row as full. Unreadable cells
 * inside a row become "none" so one bad value cannot grant or break access.
 */
export function sanitizeAccessDoc(raw: RawAccessDoc): {
  doc: RawAccessDoc;
  droppedRoles: number;
  droppedMatrixRows: string[];
} {
  const roles = raw.roles.filter(
    (r) => isPlainObject(r) && typeof r.id === "string" && isValidRoleId(r.id)
  );
  const matrix: Record<string, unknown> = {};
  const droppedMatrixRows: string[] = [];
  for (const [roleId, row] of Object.entries(raw.matrix)) {
    if (isPlainObject(row)) {
      matrix[roleId] = Object.fromEntries(
        CMS_MODULES.filter((m) => m in row).map((m) => [m, sanitizeCell(row[m])])
      );
    } else {
      droppedMatrixRows.push(roleId);
      // `normalizeDoc` refills a missing system row with its default; deny instead.
      if (isSystemRoleId(roleId) && roleId !== "super_admin") matrix[roleId] = DENY_ROW();
    }
  }
  return {
    doc: { roles, matrix },
    droppedRoles: raw.roles.length - roles.length,
    droppedMatrixRows,
  };
}

/**
 * Admin baseline: throws on a failed read and never hydrates defaults from one.
 * Defaults apply only to a confirmed-absent row. A wrong top-level type is
 * unreadable; bad individual rows are dropped and logged so one bad entry
 * cannot lock everyone out.
 */
export async function readAccessControlStrict(): Promise<AccessControlDoc> {
  const remote = await readCmsDocumentChecked(ACCESS_CONTROL_DOC_ID, hasAccessDocShape);
  let source: unknown = buildDefaultAccessControlDoc();
  if (remote) {
    const { doc, droppedRoles, droppedMatrixRows } = sanitizeAccessDoc(remote);
    if (droppedRoles > 0 || droppedMatrixRows.length > 0) {
      console.error(
        `${ACCESS_CONTROL_DOC_ID}: dropped ${droppedRoles} bad role(s) and matrix row(s) [${droppedMatrixRows.join(", ")}]`
      );
    }
    source = doc;
  }
  const doc = normalizeDoc(source);
  hydrateAccessControl(doc);
  return doc;
}

/**
 * Display read: hydrates only after a good read. On a failed read the current
 * snapshot stays; on a cold start (nothing hydrated yet) it throws, so callers fail closed.
 */
export async function readAccessControlDurable(): Promise<AccessControlDoc> {
  try {
    return await readAccessControlStrict();
  } catch (error) {
    const snap = getAccessSnapshot();
    if (error instanceof CmsReadError && snap.hydrated) {
      return { roles: snap.roles, matrix: snap.matrix };
    }
    throw error;
  }
}

export async function saveAccessControlDurable(
  input: AccessControlDoc
): Promise<AccessControlDoc> {
  const doc = normalizeDoc(input);

  // Cannot delete or deactivate super_admin role definition.
  const superRole = doc.roles.find((r) => r.id === "super_admin");
  if (!superRole || !superRole.active) {
    throw new Error("The Super Admin role cannot be deactivated or removed");
  }

  // System roles cannot be deleted (must remain in list).
  for (const builtin of buildDefaultAccessControlDoc().roles) {
    if (!doc.roles.some((r) => r.id === builtin.id)) {
      throw new Error(`System role "${builtin.id}" cannot be deleted`);
    }
  }

  await writeCmsDocumentData(ACCESS_CONTROL_DOC_ID, "users", doc);
  hydrateAccessControl(doc);
  return doc;
}

/** Ensure in-memory snapshot is loaded (idempotent per request isolate). */
export async function ensureAccessControlHydrated(): Promise<AccessControlDoc> {
  const snap = getAccessSnapshot();
  if (snap.hydrated) {
    return { roles: snap.roles, matrix: snap.matrix };
  }
  return readAccessControlDurable();
}
