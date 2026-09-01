export const blogPosts = [
  {
    slug: "2025-exhibition-overview",
    messageKey: "post1",
    date: "2026-06-04",
    author: "Oboya Editorial",
    categoryId: "events",
    featuredImage: "/assets/homepage/greenhouse-technology.webp",
  },
  {
    slug: "sustainable-packaging-trends",
    messageKey: "post2",
    date: "2026-03-12",
    author: "Oboya Editorial",
    categoryId: "sustainability",
    featuredImage: "/assets/homepage/asia-pacific-expansion.webp",
  },
  {
    slug: "greenhouse-innovation-2026",
    messageKey: "post3",
    date: "2026-02-28",
    author: "Oboya Editorial",
    categoryId: "innovation",
    featuredImage: "/assets/homepage/greenhouse-technology.webp",
  },
  {
    slug: "berry-retail-growth",
    messageKey: "post4",
    date: "2026-01-15",
    author: "Oboya Editorial",
    categoryId: "market",
    featuredImage: "/assets/homepage/asia-pacific-expansion.webp",
  },
  {
    slug: "asia-pacific-expansion",
    messageKey: "post5",
    date: "2025-11-20",
    author: "Oboya Editorial",
    categoryId: "general",
    featuredImage: "/assets/homepage/asia-pacific-expansion.webp",
  },
  {
    slug: "greenhouse-technology",
    messageKey: "post6",
    date: "2025-10-08",
    author: "Oboya Editorial",
    categoryId: "innovation",
    featuredImage: "/assets/homepage/greenhouse-technology.webp",
  },
  {
    slug: "circular-packaging-program",
    messageKey: "post7",
    date: "2025-09-14",
    author: "Oboya Editorial",
    categoryId: "sustainability",
    featuredImage: "/assets/homepage/greenhouse-technology.webp",
  },
  {
    slug: "retail-display-innovation",
    messageKey: "post8",
    date: "2025-08-02",
    author: "Oboya Editorial",
    categoryId: "market",
    featuredImage: "/assets/homepage/asia-pacific-expansion.webp",
  },
  {
    slug: "global-partner-summit",
    messageKey: "post9",
    date: "2025-07-18",
    author: "Oboya Editorial",
    categoryId: "events",
    featuredImage: "/assets/homepage/greenhouse-technology.webp",
  },
] as const;

export const caseStudies = [
  {
    slug: "lvg-plants-pot-wrapping",
    messageKey: "case1",
    industry: "Ornamental Horticulture & Orchid Production",
    country: "South Africa",
  },
  {
    slug: "elite-flowers-integrated-logistics",
    messageKey: "case2",
    industry: "Grower and Exporter",
    country: "Colombia",
  },
  {
    slug: "elite-flowers-rfid-agv-pilot",
    messageKey: "case3",
    industry: "Grower and Exporter",
    country: "Colombia",
  },
  {
    slug: "flor-de-azama-inclusive-automation",
    messageKey: "case4",
    industry: "Rose and Summer Flower Production",
    country: "Ecuador",
  },
] as const;

export type BlogPostSlug = (typeof blogPosts)[number]["slug"];
export type CaseStudySlug = (typeof caseStudies)[number]["slug"];
