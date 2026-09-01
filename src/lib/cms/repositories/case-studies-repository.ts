import type { CmsStatus, LocalizedString, SeoFields } from "@/lib/cms/types";
import { caseStudies } from "@/constants/content-data";

export type CaseStudyRegion = "europe" | "americas" | "asia" | "other";

export interface CmsCaseStudyTestimonial {
  quote: LocalizedString;
  author: string;
  company: string;
}

export interface CmsCaseStudy {
  id: string;
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  /** Short outcome metric shown on cards, e.g. "−18% handling time" */
  metric: LocalizedString;
  challenge: LocalizedString;
  solution: LocalizedString;
  implementation: LocalizedString;
  results: LocalizedString;
  client: string;
  timeline: LocalizedString;
  industry: string;
  country: string;
  region: CaseStudyRegion;
  segment: string;
  coverImage: string;
  images: string[];
  gallery: string[];
  downloads: { title: string; url: string }[];
  testimonial: CmsCaseStudyTestimonial;
  status: CmsStatus;
  seo: SeoFields;
  createdAt: string;
  updatedAt: string;
}

const emptyLoc = (): LocalizedString => ({
  en: "",
  "pt-BR": "",
  es: "",
  "zh-CN": "",
});

const loc = (en: string): LocalizedString => ({
  en,
  "pt-BR": en,
  es: en,
  "zh-CN": en,
});

const emptyTestimonial = (): CmsCaseStudyTestimonial => ({
  quote: emptyLoc(),
  author: "",
  company: "",
});

type SeedEntry = {
  title: LocalizedString;
  excerpt: LocalizedString;
  metric: LocalizedString;
  challenge: LocalizedString;
  solution: LocalizedString;
  implementation: LocalizedString;
  results: LocalizedString;
  client: string;
  timeline: LocalizedString;
  coverImage: string;
  images: string[];
  region: CaseStudyRegion;
  testimonial: CmsCaseStudyTestimonial;
};

const seedContent: Record<string, SeedEntry> = {
  case1: {
    title: loc("Automating Efficiency in Ornamental Horticulture"),
    excerpt: loc(
      "LVG Plants relied on a manual pot plant wrapping process that was labor-intensive and limited how many plants could be prepared for dispatch each day.\n\nOboya Horticulture South Africa proposed an automatic wrapping solution with four machines, phased installation, and staff training through 2026.\n\nExpected outcomes include higher wrapping capacity, greater consistency, reduced labor dependency, and faster dispatch preparation."
    ),
    metric: loc("Higher wrapping capacity"),
    challenge: loc(
      "LVG Plants relied on a manual wrapping process for pot plants. The process was labor-intensive, time-consuming, and limited how many plants could be prepared for dispatch each day."
    ),
    solution: loc(
      "Oboya Horticulture's South African branch proposed an automatic pot plant wrapping solution to improve speed, consistency, and operational efficiency. The project includes installing four wrapping machines, scheduled for completion by the end of 2026."
    ),
    implementation: loc(
      "The implementation plan includes phased installation, operational integration, and staff training to ensure seamless adoption."
    ),
    results: loc(
      "Expected benefits include higher wrapping capacity, greater consistency, reduced labor dependency, lower packing costs, faster dispatch preparation, and increased operational efficiency."
    ),
    client: "LVG Plants",
    timeline: loc("Through 2026"),
    coverImage:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1600&h=700&q=75",
    images: [
      "https://images.unsplash.com/photo-1466692476867-a0881dfc0648?auto=format&fit=crop&w=1000&h=1200&q=75",
      "/assets/homepage/capabilities-value-chain.jpg",
    ],
    region: "other",
    testimonial: {
      quote: loc(
        "Thank you, Oboya Horticulture, for your hard work and your quick responses, consistent follow-up, and commitment to finding the right solution."
      ),
      author: "Procurement Manager",
      company: "LVG Plants",
    },
  },
  case2: {
    title: loc("Improving Post-Harvest Efficiency Through Integrated Logistics"),
    excerpt: loc(
      "Elite Flowers sought to improve post-harvest productivity and reduce handling time across its operations in Colombia.\n\nSince 2020, the grower has deployed Oboya Horticulture trolleys and buckets, adding tractors in 2025 to move equipment between operational areas.\n\nThe rollout strengthened internal transportation, reduced worker fatigue, and delivered smoother workflow performance across post-harvest."
    ),
    metric: loc("Faster internal transportation"),
    challenge: loc(
      "Elite Flowers sought to improve post-harvest productivity and reduce handling time. Existing processes required excessive manual movement of stems and materials, increasing labor requirements and slowing operations."
    ),
    solution: loc(
      "Beginning in 2020, Elite Flowers implemented Oboya Horticulture trolleys and buckets to optimize internal logistics. In 2025, tractors were incorporated to transport equipment between operational areas, further improving mobility and reducing transport times."
    ),
    implementation: loc(
      "The new equipment was introduced progressively across post-harvest operations. Teams were trained to standardize workflows while maintaining uninterrupted daily production."
    ),
    results: loc(
      "Increased post-harvest productivity.\n\nFaster internal transportation.\n\nReduced workers' fatigue.\n\nImproved handling consistency.\n\nEnhanced operational efficiency.\n\nSmoother workflow performance."
    ),
    client: "Elite Flowers Colombia",
    timeline: loc("2020–2025"),
    coverImage:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1600&h=700&q=75",
    images: [
      "/assets/homepage/capabilities-global-local.jpg",
      "/assets/homepage/capabilities-partnerships.jpg",
    ],
    region: "americas",
    testimonial: {
      quote: loc(
        "The project demonstrates how integrated logistics solutions can help flower growers improve productivity while strengthening operational performance across post-harvest activities."
      ),
      author: "Operations Team",
      company: "Elite Flowers Colombia",
    },
  },
  case3: {
    title: loc("Advancing Traceability with RFID and AGV Automation"),
    excerpt: loc(
      "Elite Flowers is exploring better traceability, automation, and material flow across its Colombian operations.\n\nOboya Horticulture partnered on a pilot evaluating RFID tracking systems and AGV pallet systems for workflow integration and scalability.\n\nEarly results point to faster identification, reduced manual registration, and stronger data for future deployment decisions."
    ),
    metric: loc("Improved traceability"),
    challenge: loc(
      "Elite Flowers is exploring new ways to improve traceability, automation, and material flow across its operations. Manual registration and pallet handling processes created opportunities for greater efficiency and visibility."
    ),
    solution: loc(
      "Oboya Horticulture partnered with Elite Flowers in a pilot program evaluating RFID Tracking Systems and AGV Pallet Systems. The objective is to assess operational feasibility, workflow integration, and future scalability."
    ),
    implementation: loc(
      "Pilot activities include RFID identification testing, route simulations, AGV trials, user training, and operational performance evaluations."
    ),
    results: loc(
      "Initial observations indicate faster identification and tracking, reduced manual registration, improved traceability, potential for more efficient pallet movement, and valuable data for future deployment decisions."
    ),
    client: "Elite Flowers Colombia",
    timeline: loc("Pilot program"),
    coverImage:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&h=700&q=75",
    images: [
      "/assets/homepage/capabilities-value-chain.jpg",
      "/assets/homepage/capabilities-global-local.jpg",
    ],
    region: "americas",
    testimonial: {
      quote: loc(
        "The pilot with Oboya Horticulture RFID and AGV systems is giving us valuable insights. We can already see the potential for better traceability and more efficient pallet movement once fully implemented."
      ),
      author: "Operations Team",
      company: "Elite Flowers Colombia",
    },
  },
  case4: {
    title: loc("Improving Productivity Through Inclusive Automation"),
    excerpt: loc(
      "Flor de Azama Farm needed safer, more ergonomic post-harvest operations while supporting employees with disabilities and medical restrictions.\n\nOboya Horticulture supplied an automatic bouquet-tying machine to attach nutritional sachets, with technical support and implementation follow-up.\n\nProductivity rose roughly 70%, from 180–200 bouquets per operator to 330–340, with improved ergonomics and workplace inclusion."
    ),
    metric: loc("70% higher productivity"),
    challenge: loc(
      "The farm aimed to improve productivity in post-harvest operations while creating a safer, more ergonomic work environment. The manual process of attaching nutritional sachets involved repetitive hand movements, leading to employee discomfort and limited efficiency. They also needed a solution that supported employees with disabilities and medical restrictions."
    ),
    solution: loc(
      "Oboya Horticulture provided an automatic bouquet-tying machine to automate the attachment of nutritional sachets. This solution aimed to reduce manual labor, improve ergonomics, increase speed, and create a safer workstation. Oboya also provided technical support and implementation follow-up."
    ),
    implementation: loc(
      "The machine was integrated into post-harvest lines with operator training and ongoing technical support to ensure smooth adoption across shifts."
    ),
    results: loc(
      "70% higher productivity — output increased from approximately 180–200 bouquets per operator to 330–340 bouquets per operator.\n\nImproved ergonomics through reduction in repetitive hand movements and physical strain.\n\nGreater workplace inclusion with a safer environment suitable for employees with disabilities and medical restrictions.\n\nIncreased efficiency with faster, more consistent operations and less reliance on manual repetitive tasks."
    ),
    client: "Flor de Azama Farm – Falcon Farms",
    timeline: loc("Post-harvest operations"),
    coverImage:
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1600&h=700&q=75",
    images: [
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1000&h=1200&q=75",
      "/assets/homepage/capabilities-partnerships.jpg",
    ],
    region: "americas",
    testimonial: {
      quote: loc(
        "The machine has helped me tremendously. Before, we used rubber bands and tape, which could cause discomfort and even injuries to our hands. Today, the process is faster, more comfortable, and much safer. For me, this machine is a blessing."
      ),
      author: "Betty Mesa",
      company: "Flor de Azama Farm – Falcon Farms",
    },
  },
};

function seed(): CmsCaseStudy[] {
  return caseStudies.map((c) => {
    const copy = seedContent[c.messageKey];
    return {
      id: c.slug,
      slug: c.slug,
      title: copy?.title ?? loc(c.slug.replace(/-/g, " ")),
      excerpt: copy?.excerpt ?? emptyLoc(),
      metric: copy?.metric ?? emptyLoc(),
      challenge: copy?.challenge ?? emptyLoc(),
      solution: copy?.solution ?? emptyLoc(),
      implementation: copy?.implementation ?? emptyLoc(),
      results: copy?.results ?? emptyLoc(),
      client: copy?.client ?? "",
      timeline: copy?.timeline ?? emptyLoc(),
      industry: c.industry,
      country: c.country,
      region: copy?.region ?? "other",
      segment: c.industry,
      coverImage: copy?.coverImage ?? "",
      images: copy?.images ?? [],
      gallery: [],
      downloads: [],
      testimonial: copy?.testimonial ?? emptyTestimonial(),
      status: "published" as CmsStatus,
      seo: { title: emptyLoc(), description: emptyLoc() },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
  });
}

let cache: CmsCaseStudy[] | null = null;

export function getCaseStudies(): CmsCaseStudy[] {
  if (!cache) cache = seed();
  return cache;
}

export function replaceCaseStudiesCache(studies: CmsCaseStudy[]) {
  cache = studies.map((s) => ({ ...s }));
}

export function getCaseStudyById(id: string): CmsCaseStudy | undefined {
  return getCaseStudies().find((c) => c.id === id);
}

export function saveCaseStudy(study: CmsCaseStudy): CmsCaseStudy {
  const items = getCaseStudies();
  const idx = items.findIndex((c) => c.id === study.id);
  const updated = { ...study, updatedAt: new Date().toISOString() };
  if (idx >= 0) items[idx] = updated;
  else items.push(updated);
  cache = items;
  return updated;
}

export function deleteCaseStudy(id: string): boolean {
  const items = getCaseStudies();
  const idx = items.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  items.splice(idx, 1);
  cache = items;
  return true;
}
