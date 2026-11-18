export const HOMEPAGE_SECTION_SLUGS = [
  "hero",
  "homeEcosystem",
  "capabilities",
  "businessSolutions",
  "challenges",
  "testimonials",
  "latestNews",
  "partners",
  "globalPresence",
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
  globalPresence: {
    title: "Global Presence (map)",
    description: "World map title and the green connection arrows (shown on the About page).",
  },
  challenges: {
    title: "Challenges",
    description: "Section title, photo, and captions pinned on the photo.",
  },
  homeEcosystem: {
    title: "Ecosystem Journey",
    description:
      "Opening line, six stages with description, proof points and optional image, closing lines and slogan.",
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
