export type CmsLocale = "en" | "pt-BR" | "es" | "zh-CN";

export type CmsStatus = "draft" | "scheduled" | "published" | "archived";

export type CmsRole =
  | "super_admin"
  | "admin"
  | "content_manager"
  | "marketplace_manager"
  | "sales_manager"
  | "hr_manager"
  | "viewer";

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

export type MediaOptimizationStatus =
  | "pending"
  | "optimized"
  | "skipped"
  | "failed";

export type MediaImageFormat =
  | "webp"
  | "avif"
  | "jpeg"
  | "png"
  | "svg"
  | "gif";

export interface MediaImageVariant {
  url: string;
  width: number;
  height: number;
  size: number;
  mimeType: string;
}

export interface MediaAssetVariants {
  thumb?: MediaImageVariant;
  mobile?: MediaImageVariant;
  desktop?: MediaImageVariant;
  mobileAvif?: MediaImageVariant;
  desktopAvif?: MediaImageVariant;
  desktopJpeg?: MediaImageVariant;
  card?: MediaImageVariant;
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
  optimizationStatus?: MediaOptimizationStatus;
  originalUrl?: string;
  originalSize?: number;
  originalMimeType?: string;
  format?: MediaImageFormat;
  variants?: MediaAssetVariants;
}

export type FormSubmissionStatus = "new" | "read" | "replied" | "archived";

export interface FormSubmission {
  id: string;
  type: "contact" | "quote" | "newsletter" | "career";
  status: FormSubmissionStatus;
  data: Record<string, unknown>;
  createdAt: string;
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
