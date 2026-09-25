import type { CmsAction, CmsModule, CmsUser, PermissionOverrides } from "@/lib/cms/types";
import { getAccessSnapshot } from "./access-store";
import { CMS_ACTIONS, FULL_ACTIONS } from "./access-types";
import { BUILTIN_MATRIX } from "./defaults";

function normalizeActions(level: unknown): CmsAction[] {
  if (level === "full") return [...FULL_ACTIONS];
  if (level === "none" || level == null) return [];
  if (Array.isArray(level)) {
    return level.filter((a): a is CmsAction =>
      (CMS_ACTIONS as readonly string[]).includes(a)
    );
  }
  return [];
}

function roleAllows(role: string, module: CmsModule, action: CmsAction): boolean {
  if (role === "super_admin") return true;
  const { matrix } = getAccessSnapshot();
  const row = matrix[role] ?? BUILTIN_MATRIX[role];
  if (!row) return false;
  const level = row[module];
  return normalizeActions(level).includes(action);
}

function overrideAllows(
  overrides: PermissionOverrides | undefined,
  module: CmsModule,
  action: CmsAction
): boolean | null {
  if (!overrides) return null;
  const denied = overrides.denies?.[module];
  if (denied?.includes(action)) return false;
  const granted = overrides.grants?.[module];
  if (granted?.includes(action)) return true;
  return null;
}

/**
 * Sync permission check for a role against the hydrated (or builtin) matrix.
 */
export function canAccess(
  role: string,
  module: CmsModule,
  action: CmsAction = "view"
): boolean {
  return roleAllows(role, module, action);
}

/**
 * Role permissions ∪ grants − denies. Super Admin always full (overrides ignored).
 */
export function canAccessUser(
  user: Pick<CmsUser, "role" | "permissionOverrides"> | null | undefined,
  module: CmsModule,
  action: CmsAction = "view"
): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;

  const override = overrideAllows(user.permissionOverrides, module, action);
  if (override === false) return false;
  if (override === true) return true;
  return roleAllows(user.role, module, action);
}
