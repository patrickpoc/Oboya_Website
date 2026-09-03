export const HOMEPAGE_SECTION_SLUGS = [
  "hero",
  "capabilities",
  "businessSolutions",
  "testimonials",
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
  capabilities: {
    title: "Why Oboya Horticulture",
    description: "Image carousel slides with title and description overlays.",
  },
  businessSolutions: {
    title: "Solutions Tailored",
    description: "Numbered solution cards in a testimonials-style carousel.",
  },
  testimonials: {
    title: "Testimonials",
    description: "Customer quotes, authors, and roles.",
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
