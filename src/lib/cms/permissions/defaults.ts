import type { CmsAction, CmsModule, PermissionLevel } from "@/lib/cms/types";
import type { AccessControlDoc, AccessMatrix, AccessRoleDefinition } from "./access-types";
import { CMS_MODULES, FULL_ACTIONS } from "./access-types";
import { SYSTEM_ROLE_IDS } from "@/lib/cms/types";

const FULL: PermissionLevel = "full";
const NONE: PermissionLevel = "none";
const EDIT: CmsAction[] = ["view", "create", "edit", "publish"];
const VIEW: CmsAction[] = ["view"];
/** Analysts draft and edit but cannot publish or delete — a manager signs off. */
const DRAFT: CmsAction[] = ["view", "create", "edit"];

/** Labels match previous ROLE_LABELS in matrix.ts. */
export const BUILTIN_ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrator",
  admin: "Administrator",
  ceo: "CEO",
  cfo: "CFO",
  cto: "CTO",
  content_manager: "Content Manager",
  marketplace_manager: "Marketplace Manager",
  sales_manager: "Sales Manager",
  hr_manager: "HR Manager",
  content_analyst: "Content Analyst",
  marketplace_analyst: "Marketplace Analyst",
  sales_analyst: "Sales Analyst",
  hr_analyst: "HR Analyst",
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
  ceo: {
    dashboard: VIEW,
    website: FULL,
    marketplace: FULL,
    global_presence: FULL,
    case_studies: FULL,
    blog: FULL,
    careers: FULL,
    media: FULL,
    forms: FULL,
    users: VIEW,
    settings: VIEW,
    analytics: VIEW,
    audit_logs: VIEW,
  },
  cfo: {
    dashboard: VIEW,
    website: VIEW,
    marketplace: FULL,
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
  cto: {
    dashboard: VIEW,
    website: EDIT,
    marketplace: VIEW,
    global_presence: VIEW,
    case_studies: VIEW,
    blog: VIEW,
    careers: VIEW,
    media: FULL,
    forms: NONE,
    users: EDIT,
    settings: FULL,
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
  content_analyst: {
    dashboard: VIEW,
    website: DRAFT,
    marketplace: VIEW,
    global_presence: VIEW,
    case_studies: DRAFT,
    blog: DRAFT,
    careers: VIEW,
    media: DRAFT,
    forms: NONE,
    users: NONE,
    settings: NONE,
    analytics: VIEW,
    audit_logs: NONE,
  },
  marketplace_analyst: {
    dashboard: VIEW,
    website: VIEW,
    marketplace: DRAFT,
    global_presence: DRAFT,
    case_studies: VIEW,
    blog: VIEW,
    careers: VIEW,
    media: DRAFT,
    forms: NONE,
    users: NONE,
    settings: NONE,
    analytics: VIEW,
    audit_logs: NONE,
  },
  sales_analyst: {
    dashboard: VIEW,
    website: VIEW,
    marketplace: VIEW,
    global_presence: VIEW,
    case_studies: VIEW,
    blog: VIEW,
    careers: VIEW,
    media: VIEW,
    forms: ["view", "edit"],
    users: NONE,
    settings: NONE,
    analytics: VIEW,
    audit_logs: NONE,
  },
  hr_analyst: {
    dashboard: VIEW,
    website: VIEW,
    marketplace: VIEW,
    global_presence: VIEW,
    case_studies: VIEW,
    blog: VIEW,
    careers: DRAFT,
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

/** Canonical order: platform admins, C-level, managers, analysts, read-only. */
export function buildBuiltinRoles(): AccessRoleDefinition[] {
  return SYSTEM_ROLE_IDS.map((id, index) => ({
    id,
    label: BUILTIN_ROLE_LABELS[id] ?? id,
    system: true,
    active: true,
    sortOrder: index,
  }));
}

export function buildDefaultAccessControlDoc(): AccessControlDoc {
  return {
    roles: buildBuiltinRoles(),
    matrix: structuredClone(BUILTIN_MATRIX),
  };
}

export const ROLE_TIERS = ["platform", "c_level", "manager", "analyst", "custom"] as const;
export type RoleTier = (typeof ROLE_TIERS)[number];

const BUILTIN_ROLE_TIER: Record<string, RoleTier> = {
  super_admin: "platform",
  admin: "platform",
  viewer: "platform",
  ceo: "c_level",
  cfo: "c_level",
  cto: "c_level",
  content_manager: "manager",
  marketplace_manager: "manager",
  sales_manager: "manager",
  hr_manager: "manager",
  content_analyst: "analyst",
  marketplace_analyst: "analyst",
  sales_analyst: "analyst",
  hr_analyst: "analyst",
};

export function roleTier(roleId: string): RoleTier {
  return BUILTIN_ROLE_TIER[roleId] ?? "custom";
}

export { FULL_ACTIONS };
