export type CmsLocale = "en" | "pt-BR" | "es" | "zh-CN";

export type CmsStatus = "draft" | "scheduled" | "published" | "archived";

/** Built-in system role ids (cannot be deleted). */
export const SYSTEM_ROLE_IDS = [
  "super_admin",
  "admin",
  "ceo",
  "cfo",
  "cto",
  "content_manager",
  "marketplace_manager",
  "sales_manager",
  "hr_manager",
  "content_analyst",
  "marketplace_analyst",
  "sales_analyst",
  "hr_analyst",
  "viewer",
] as const;

export type CmsSystemRole = (typeof SYSTEM_ROLE_IDS)[number];

/** Role id: system slug or custom slug. */
export type CmsRole = string;

export type CmsAction = "view" | "create" | "edit" | "delete" | "publish";

export type CmsModule =
  | "dashboard"
  | "website"
  | "marketplace"
  | "global_presence"
  | "case_studies"
  | "blog"
  | "careers"
  | "media"
  | "forms"
  | "users"
  | "settings"
  | "analytics"
  | "audit_logs";

export type PermissionLevel = CmsAction[] | "full" | "none";

export type PermissionOverrides = {
  grants?: Partial<Record<CmsModule, CmsAction[]>>;
  denies?: Partial<Record<CmsModule, CmsAction[]>>;
};

export interface LocalizedString {
  en: string;
  "pt-BR": string;
  es: string;
  "zh-CN": string;
}

export interface SeoFields {
  title: LocalizedString;
  description: LocalizedString;
  ogImage?: string;
}

export interface CmsUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  jobTitle?: string;
  role: CmsRole;
  locale: CmsLocale;
  status: "active" | "inactive";
  mustChangePassword?: boolean;
  permissionOverrides?: PermissionOverrides;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: CmsModule;
  resourceId?: string;
  details?: string;
  createdAt: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  type: "image" | "document" | "video";
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: LocalizedString;
  folder: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const FORM_SUBMISSION_STATUSES = [
  "new",
  "in_progress",
  "replied",
  "converted",
  "archived",
  "spam",
] as const;

export type FormSubmissionStatus = (typeof FORM_SUBMISSION_STATUSES)[number];

export const FORM_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type FormPriority = (typeof FORM_PRIORITIES)[number];

export interface FormSubmission {
  id: string;
  type: "contact" | "quote" | "newsletter" | "career";
  status: FormSubmissionStatus;
  data: Record<string, unknown>;
  createdAt: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  tags?: string[];
  priority?: FormPriority;
  readAt?: string | null;
  updatedAt?: string | null;
  lastActivityAt?: string | null;
}

export type FormActivityKind =
  | "note"
  | "status"
  | "assign"
  | "tags"
  | "priority"
  | "reply"
  | "pii"
  | "merge";

export interface FormActivity {
  id: string;
  submissionId: string;
  kind: FormActivityKind;
  body?: string | null;
  meta?: Record<string, unknown>;
  actorId?: string | null;
  actorName?: string | null;
  createdAt: string;
}

export interface FormSubmissionPatch {
  status?: FormSubmissionStatus;
  assigneeId?: string | null;
  assigneeName?: string | null;
  tags?: string[];
  priority?: FormPriority;
  /** true marks as read now, false marks as unread */
  read?: boolean;
}

export interface ContactSubmissionData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  countryName: string;
  subject: string;
  message: string;
}

export interface DashboardStats {
  products: number;
  pendingQuotes: number;
  formSubmissions: number;
  visitors: number;
  activeCountries: number;
  publishedPosts: number;
  openJobs: number;
}
