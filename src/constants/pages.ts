export type PageTemplate = "contact" | "about" | "faqs" | "legal";

export interface PageConfig {
  messageKey: string;
  template: PageTemplate;
}

/** Public pages with real content. Stub routes (careers, products, industries, old solution children) 404. */
export const pageRegistry: Record<string, PageConfig> = {
  about: { messageKey: "about", template: "about" },
  contact: { messageKey: "contact", template: "contact" },
  faqs: { messageKey: "faqs", template: "faqs" },
  privacy: { messageKey: "privacy", template: "legal" },
  terms: { messageKey: "terms", template: "legal" },
};

export function getPageSlug(slug: string[]): string {
  return slug.join("/");
}

export function getPageConfig(slug: string[]): PageConfig | undefined {
  return pageRegistry[getPageSlug(slug)];
}

export function getAllPageSlugs(): string[][] {
  return Object.keys(pageRegistry).map((path) => path.split("/"));
}

export function getPageTitleKey(messageKey: string) {
  return `pages.${messageKey}.title` as const;
}

export function getPageEyebrowKey(messageKey: string) {
  return `pages.${messageKey}.eyebrow` as const;
}
