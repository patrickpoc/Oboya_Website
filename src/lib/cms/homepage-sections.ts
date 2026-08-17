export const HOMEPAGE_SECTION_SLUGS = [
  "hero",
  "companyOverview",
  "capabilities",
  "businessSolutions",
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
    description: "Background image, headline, and primary / secondary CTAs.",
  },
  companyOverview: {
    title: "Statistics & Mission",
    description: "Scroll-telling headline, pinned image, and animated stats.",
  },
  capabilities: {
    title: "Why Oboya Horticulture",
    description: "Image carousel slides with title and description overlays.",
  },
  businessSolutions: {
    title: "Solutions Tailored",
    description: "Numbered solution cards in a testimonials-style carousel.",
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
    title: "Featured Innovations",
    description: "Innovation cards with image, copy, and learn-more links.",
  },
  latestNews: {
    title: "Latest News",
    description: "Eyebrow, headline, and number of blog posts shown.",
  },
  partners: {
    title: "Partners & Collaborations",
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
