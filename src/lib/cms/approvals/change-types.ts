import type { CmsModule } from "@/lib/cms/types";

export type ChangeTypeDefinition = {
  id: string;
  module: CmsModule;
  entityType: string;
  /** Route integration exists; false = registered for future use. */
  available: boolean;
};

export const CHANGE_TYPES = [
  { id: "marketplace.price", module: "marketplace", entityType: "product", available: true },
  { id: "marketplace.bulk_update", module: "marketplace", entityType: "product_batch", available: true },
  { id: "marketplace.product_edit", module: "marketplace", entityType: "product", available: true },
  { id: "marketplace.product_create", module: "marketplace", entityType: "product", available: true },
  { id: "marketplace.product_delete", module: "marketplace", entityType: "product", available: true },
  { id: "website.homepage", module: "website", entityType: "homepage", available: true },
  { id: "website.about", module: "website", entityType: "about_page", available: true },
  { id: "website.solutions", module: "website", entityType: "solutions_page", available: true },
  { id: "website.news_page", module: "website", entityType: "news_page", available: true },
  { id: "website.faqs", module: "website", entityType: "faq", available: true },
  { id: "website.header", module: "website", entityType: "header", available: false },
  { id: "website.footer", module: "website", entityType: "footer", available: false },
  { id: "website.terms", module: "website", entityType: "terms", available: false },
  { id: "website.seo", module: "website", entityType: "seo", available: false },
  { id: "website.pages", module: "website", entityType: "page", available: false },
  { id: "blog.upsert", module: "blog", entityType: "blog_post", available: true },
  { id: "blog.delete", module: "blog", entityType: "blog_post", available: true },
  { id: "case_studies.upsert", module: "case_studies", entityType: "case_study", available: true },
  { id: "case_studies.delete", module: "case_studies", entityType: "case_study", available: true },
  { id: "careers.upsert", module: "careers", entityType: "job_opening", available: false },
  { id: "careers.delete", module: "careers", entityType: "job_opening", available: false },
] as const satisfies readonly ChangeTypeDefinition[];

export type ChangeTypeId = (typeof CHANGE_TYPES)[number]["id"];

const CHANGE_TYPE_IDS = new Set<string>(CHANGE_TYPES.map((c) => c.id));

export function isChangeTypeId(id: string): id is ChangeTypeId {
  return CHANGE_TYPE_IDS.has(id);
}

export function getChangeType(id: string): ChangeTypeDefinition | undefined {
  return CHANGE_TYPES.find((c) => c.id === id);
}

/** i18n key segment: "marketplace.price" -> "marketplace_price". */
export function changeTypeLabelKey(id: string): string {
  return id.replace(/\./g, "_");
}
