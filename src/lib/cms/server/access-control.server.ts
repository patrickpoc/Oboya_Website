import "server-only";

import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";
import type { AccessControlDoc, AccessRoleDefinition } from "@/lib/cms/permissions/access-types";
import {
  CMS_MODULES,
  isSystemRoleId,
  isValidRoleId,
} from "@/lib/cms/permissions/access-types";
import { buildDefaultAccessControlDoc } from "@/lib/cms/permissions/defaults";
import { hydrateAccessControl, getAccessSnapshot } from "@/lib/cms/permissions/access-store";

export const ACCESS_CONTROL_DOC_ID = "cms-access-control";

function normalizeDoc(raw: unknown): AccessControlDoc {
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

  const matrix =
    data.matrix && typeof data.matrix === "object"
      ? structuredClone(data.matrix)
      : structuredClone(fallback.matrix);

  // Super admin always full on every module.
  matrix.super_admin = Object.fromEntries(
    CMS_MODULES.map((m) => [m, "full" as const])
  );

  roles.sort((a, b) => a.sortOrder - b.sortOrder);
  return { roles, matrix };
}

export async function readAccessControlDurable(): Promise<AccessControlDoc> {
  const remote = await readCmsDocumentData(ACCESS_CONTROL_DOC_ID, {
    fresh: true,
  });
  const doc = normalizeDoc(remote ?? buildDefaultAccessControlDoc());
  hydrateAccessControl(doc);
  return doc;
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
