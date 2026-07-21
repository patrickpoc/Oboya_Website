export const HOMEPAGE_SECTION_SLUGS = [
  "hero",
  "companyOverview",
  "capabilities",
  "globalPresence",
  "testimonials",
  "featuredProducts",
  "latestNews",
  "partners",
  "settings",
] as const;

export type HomepageSectionSlug = (typeof HOMEPAGE_SECTION_SLUGS)[number];

export const HOMEPAGE_SECTION_META: Record<
  HomepageSectionSlug,
  { title: string; description: string }
> = {
  hero: {
    title: "Hero",
    description: "Background image, headline, and navigation pills.",
  },
  companyOverview: {
    title: "Statistics & Mission",
    description: "Headline segments, stats, and mission image.",
  },
  capabilities: {
    title: "Capabilities",
    description: "Capability cards with images and links.",
  },
  globalPresence: {
    title: "Global Presence",
    description: "Section title only — the interactive map is fixed.",
  },
  testimonials: {
    title: "Testimonials",
    description: "Customer quotes, authors, and roles.",
  },
  featuredProducts: {
    title: "Featured Categories",
    description: "Shop categories highlighted on the homepage.",
  },
  latestNews: {
    title: "Latest News",
    description: "Eyebrow, headline, and number of blog posts shown.",
  },
  partners: {
    title: "Partners & Clients",
    description: "Partner logos, names, and optional links.",
  },
  settings: {
    title: "Settings",
    description: "Section visibility and homepage animations.",
  },
};

export function isHomepageSectionSlug(s: string): s is HomepageSectionSlug {
  return (HOMEPAGE_SECTION_SLUGS as readonly string[]).includes(s);
}
