import type { CmsAction, CmsModule } from "@/lib/cms/types";
import { canAccess as resolveCanAccess } from "./access-resolve";
import { BUILTIN_ROLE_LABELS, BUILTIN_MATRIX } from "./defaults";
import { FULL_ACTIONS } from "./access-types";
import { getAccessSnapshot, getRoleLabel } from "./access-store";

/** @deprecated Prefer getRoleLabel from access-store; kept for Roles page. */
export const ROLE_LABELS: Record<string, string> = { ...BUILTIN_ROLE_LABELS };

export function getPermissions(role: string, module: CmsModule): CmsAction[] {
  const { matrix } = getAccessSnapshot();
  const level = matrix[role]?.[module] ?? BUILTIN_MATRIX[role]?.[module];
  if (!level || level === "none") return [];
  if (level === "full") return [...FULL_ACTIONS];
  return level;
}

export function canAccess(
  role: string,
  module: CmsModule,
  action: CmsAction = "view"
): boolean {
  return resolveCanAccess(role, module, action);
}

export { getRoleLabel };
export { canAccessUser } from "./access-resolve";
