export const blogPosts = [
  {
    slug: "sustainable-packaging-trends",
    messageKey: "post1",
    date: "2026-03-12",
    author: "Oboya Editorial",
  },
  {
    slug: "greenhouse-innovation-2026",
    messageKey: "post2",
    date: "2026-02-28",
    author: "Oboya Editorial",
  },
  {
    slug: "berry-retail-growth",
    messageKey: "post3",
    date: "2026-01-15",
    author: "Oboya Editorial",
  },
] as const;

export const caseStudies = [
  {
    slug: "netherlands-greenhouse",
    messageKey: "case1",
    industry: "Greenhouses",
    country: "Netherlands",
  },
  {
    slug: "brazil-berry-packaging",
    messageKey: "case2",
    industry: "Berries",
    country: "Brazil",
  },
  {
    slug: "mexico-distribution",
    messageKey: "case3",
    industry: "Distribution",
    country: "Mexico",
  },
  {
    slug: "china-growing-media",
    messageKey: "case4",
    industry: "Growing Media",
    country: "China",
  },
] as const;

export type BlogPostSlug = (typeof blogPosts)[number]["slug"];
export type CaseStudySlug = (typeof caseStudies)[number]["slug"];
