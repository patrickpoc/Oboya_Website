import type { CmsAction, CmsModule, PermissionLevel } from "@/lib/cms/types";
import type { AccessControlDoc, AccessMatrix, AccessRoleDefinition } from "./access-types";
import { CMS_MODULES, FULL_ACTIONS } from "./access-types";

const FULL: PermissionLevel = "full";
const NONE: PermissionLevel = "none";
const EDIT: CmsAction[] = ["view", "create", "edit", "publish"];
const VIEW: CmsAction[] = ["view"];

/** Labels match previous ROLE_LABELS in matrix.ts. */
export const BUILTIN_ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrator",
  admin: "Administrator",
  content_manager: "Content Manager",
  marketplace_manager: "Marketplace Manager",
  sales_manager: "Sales Manager",
  hr_manager: "HR Manager",
  viewer: "Viewer",
};

/** Built-in permission matrix (seed / fallback) — matches prior MATRIX. */
export const BUILTIN_MATRIX: AccessMatrix = {
  super_admin: Object.fromEntries(
    CMS_MODULES.map((m) => [m, FULL])
  ) as Record<CmsModule, PermissionLevel>,
  admin: {
    dashboard: VIEW,
    website: FULL,
    marketplace: FULL,
    global_presence: FULL,
    case_studies: FULL,
    blog: FULL,
    careers: FULL,
    media: FULL,
    forms: FULL,
    users: EDIT,
    settings: EDIT,
    analytics: VIEW,
    audit_logs: VIEW,
  },
  content_manager: {
    dashboard: VIEW,
    website: EDIT,
    marketplace: VIEW,
    global_presence: VIEW,
    case_studies: EDIT,
    blog: EDIT,
    careers: VIEW,
    media: EDIT,
    forms: NONE,
    users: NONE,
    settings: NONE,
    analytics: VIEW,
    audit_logs: NONE,
  },
  marketplace_manager: {
    dashboard: VIEW,
    website: VIEW,
    marketplace: FULL,
    global_presence: EDIT,
    case_studies: VIEW,
    blog: VIEW,
    careers: VIEW,
    media: EDIT,
    forms: NONE,
    users: NONE,
    settings: NONE,
    analytics: VIEW,
    audit_logs: NONE,
  },
  sales_manager: {
    dashboard: VIEW,
    website: VIEW,
    marketplace: VIEW,
    global_presence: VIEW,
    case_studies: VIEW,
    blog: VIEW,
    careers: VIEW,
    media: VIEW,
    forms: EDIT,
    users: NONE,
    settings: NONE,
    analytics: VIEW,
    audit_logs: NONE,
  },
  hr_manager: {
    dashboard: VIEW,
    website: VIEW,
    marketplace: VIEW,
    global_presence: VIEW,
    case_studies: VIEW,
    blog: VIEW,
    careers: FULL,
    media: VIEW,
    forms: NONE,
    users: NONE,
    settings: NONE,
    analytics: VIEW,
    audit_logs: NONE,
  },
  viewer: {
    dashboard: VIEW,
    website: VIEW,
    marketplace: VIEW,
    global_presence: VIEW,
    case_studies: VIEW,
    blog: VIEW,
    careers: VIEW,
    media: VIEW,
    forms: NONE,
    users: NONE,
    settings: VIEW,
    analytics: VIEW,
    audit_logs: VIEW,
  },
};

export function buildBuiltinRoles(): AccessRoleDefinition[] {
  return [
    { id: "super_admin", label: BUILTIN_ROLE_LABELS.super_admin, system: true, active: true, sortOrder: 0 },
    { id: "admin", label: BUILTIN_ROLE_LABELS.admin, system: true, active: true, sortOrder: 1 },
    { id: "content_manager", label: BUILTIN_ROLE_LABELS.content_manager, system: true, active: true, sortOrder: 2 },
    { id: "marketplace_manager", label: BUILTIN_ROLE_LABELS.marketplace_manager, system: true, active: true, sortOrder: 3 },
    { id: "sales_manager", label: BUILTIN_ROLE_LABELS.sales_manager, system: true, active: true, sortOrder: 4 },
    { id: "hr_manager", label: BUILTIN_ROLE_LABELS.hr_manager, system: true, active: true, sortOrder: 5 },
    { id: "viewer", label: BUILTIN_ROLE_LABELS.viewer, system: true, active: true, sortOrder: 6 },
  ];
}

export function buildDefaultAccessControlDoc(): AccessControlDoc {
  return {
    roles: buildBuiltinRoles(),
    matrix: structuredClone(BUILTIN_MATRIX),
  };
}

export { FULL_ACTIONS };
