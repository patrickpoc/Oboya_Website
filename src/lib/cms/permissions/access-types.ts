import type {
  CmsAction,
  CmsModule,
  CmsSystemRole,
} from "@/lib/cms/types";
import { SYSTEM_ROLE_IDS } from "@/lib/cms/types";
import type { PermissionLevel } from "@/lib/cms/types";

export type AccessRoleDefinition = {
  id: string;
  label: string;
  system: boolean;
  active: boolean;
  sortOrder: number;
};

export type AccessMatrix = Record<
  string,
  Partial<Record<CmsModule, PermissionLevel>>
>;

export type AccessControlDoc = {
  roles: AccessRoleDefinition[];
  matrix: AccessMatrix;
};

export const CMS_MODULES: CmsModule[] = [
  "dashboard",
  "website",
  "marketplace",
  "global_presence",
  "case_studies",
  "blog",
  "careers",
  "media",
  "forms",
  "users",
  "settings",
  "analytics",
  "audit_logs",
];

export const CMS_ACTIONS: CmsAction[] = [
  "view",
  "create",
  "edit",
  "delete",
  "publish",
];

export const FULL_ACTIONS: CmsAction[] = [...CMS_ACTIONS];

export function isSystemRoleId(id: string): id is CmsSystemRole {
  return (SYSTEM_ROLE_IDS as readonly string[]).includes(id);
}

export function isValidRoleId(id: string): boolean {
  return /^[a-z][a-z0-9_]{1,31}$/.test(id);
}
