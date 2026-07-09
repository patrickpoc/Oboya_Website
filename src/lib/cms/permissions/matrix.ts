import type { CmsAction, CmsModule, CmsRole } from "@/lib/cms/types";

type PermissionLevel = CmsAction[] | "full" | "none";

const FULL: CmsAction[] = ["view", "create", "edit", "delete", "publish"];
const EDIT: CmsAction[] = ["view", "create", "edit", "publish"];
const VIEW: CmsAction[] = ["view"];

export const ROLE_LABELS: Record<CmsRole, string> = {
  super_admin: "Super Administrator",
  admin: "Administrator",
  content_manager: "Content Manager",
  marketplace_manager: "Marketplace Manager",
  sales_manager: "Sales Manager",
  hr_manager: "HR Manager",
  viewer: "Viewer",
};

const MATRIX: Record<CmsRole, Partial<Record<CmsModule, PermissionLevel>>> = {
  super_admin: {
    dashboard: "full",
    website: "full",
    marketplace: "full",
    global_presence: "full",
    case_studies: "full",
    blog: "full",
    careers: "full",
    media: "full",
    forms: "full",
    users: "full",
    settings: "full",
    analytics: "full",
    audit_logs: "full",
  },
  admin: {
    dashboard: VIEW,
    website: "full",
    marketplace: "full",
    global_presence: "full",
    case_studies: "full",
    blog: "full",
    careers: "full",
    media: "full",
    forms: VIEW,
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
    forms: VIEW,
    users: "none",
    settings: "none",
    analytics: VIEW,
    audit_logs: "none",
  },
  marketplace_manager: {
    dashboard: VIEW,
    website: VIEW,
    marketplace: "full",
    global_presence: EDIT,
    case_studies: VIEW,
    blog: VIEW,
    careers: VIEW,
    media: VIEW,
    forms: VIEW,
    users: "none",
    settings: "none",
    analytics: VIEW,
    audit_logs: "none",
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
    users: "none",
    settings: "none",
    analytics: VIEW,
    audit_logs: "none",
  },
  hr_manager: {
    dashboard: VIEW,
    website: VIEW,
    marketplace: VIEW,
    global_presence: VIEW,
    case_studies: VIEW,
    blog: VIEW,
    careers: "full",
    media: VIEW,
    forms: VIEW,
    users: "none",
    settings: "none",
    analytics: VIEW,
    audit_logs: "none",
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
    forms: VIEW,
    users: VIEW,
    settings: VIEW,
    analytics: VIEW,
    audit_logs: VIEW,
  },
};

export function getPermissions(role: CmsRole, module: CmsModule): CmsAction[] {
  const level = MATRIX[role]?.[module];
  if (!level || level === "none") return [];
  if (level === "full") return FULL;
  return level;
}

export function canAccess(
  role: CmsRole,
  module: CmsModule,
  action: CmsAction = "view"
): boolean {
  return getPermissions(role, module).includes(action);
}
