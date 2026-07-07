export type PageTemplate = "default" | "contact" | "listing";

export interface PageConfig {
  messageKey: string;
  parent?: string;
  template?: PageTemplate;
}

export const pageRegistry: Record<string, PageConfig> = {
  about: { messageKey: "about" },
  contact: { messageKey: "contact", template: "contact" },
  careers: { messageKey: "careers" },
  privacy: { messageKey: "privacy" },
  terms: { messageKey: "terms" },
  sustainability: { messageKey: "sustainability" },

  solutions: { messageKey: "solutions", template: "listing" },
  "solutions/vegetables": { messageKey: "solutionsVegetables", parent: "solutions" },
  "solutions/flowers": { messageKey: "solutionsFlowers", parent: "solutions" },
  "solutions/fruits": { messageKey: "solutionsFruits", parent: "solutions" },
  "solutions/propagation": { messageKey: "solutionsPropagation", parent: "solutions" },
  "solutions/packaging": { messageKey: "solutionsPackaging", parent: "solutions" },
  "solutions/sustainability": { messageKey: "solutionsSustainability", parent: "solutions" },
  "solutions/distribution": { messageKey: "solutionsDistribution", parent: "solutions" },
  "solutions/circular-economy": { messageKey: "solutionsCircularEconomy", parent: "solutions" },

  products: { messageKey: "products", template: "listing" },
  "products/growing-media": { messageKey: "productsGrowingMedia", parent: "products" },
  "products/packaging": { messageKey: "productsPackaging", parent: "products" },
  "products/equipment": { messageKey: "productsEquipment", parent: "products" },
  "products/strawberry-packaging": { messageKey: "productsStrawberryPackaging", parent: "products" },
  "products/flower-trolley": { messageKey: "productsFlowerTrolley", parent: "products" },

  news: { messageKey: "news", template: "listing" },
  "news/greenhouse-technology": { messageKey: "newsGreenhouseTechnology", parent: "news" },
  "news/asia-pacific-expansion": { messageKey: "newsAsiaPacificExpansion", parent: "news" },

  industries: { messageKey: "industries", template: "listing" },
  "industries/greenhouses": { messageKey: "industriesGreenhouses", parent: "industries" },
  "industries/nurseries": { messageKey: "industriesNurseries", parent: "industries" },
  "industries/retail": { messageKey: "industriesRetail", parent: "industries" },
  "industries/berries": { messageKey: "industriesBerries", parent: "industries" },
};

export function getPageSlug(slug: string[]): string {
  return slug.join("/");
}

export function getPageConfig(slug: string[]): PageConfig | undefined {
  return pageRegistry[getPageSlug(slug)];
}

export function getChildPages(parentSlug: string) {
  return Object.entries(pageRegistry)
    .filter(([, config]) => config.parent === parentSlug)
    .map(([path, config]) => ({ path: `/${path}`, messageKey: config.messageKey }));
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
