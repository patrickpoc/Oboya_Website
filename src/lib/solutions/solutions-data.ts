import type {
  SolutionArea,
  SolutionsAreaId,
  SolutionsCropFilter,
  SolutionStageCard,
  ValueChainFooterLink,
  ValueChainStageLink,
  ValueChainWheelSegment,
} from "@/lib/solutions/types";

/**
 * Central Solutions dataset for the institutional one-page.
 * Sector/stage hrefs are placeholders (`/`) until dedicated pages are wired.
 */

export const SOLUTION_CROP_FILTERS: SolutionsCropFilter[] = [
  { id: "all", labelKey: "all", shop: {} },
  {
    id: "flowers",
    labelKey: "flowers",
    areaKey: "flowers",
    shop: { cultures: ["flowers"] },
  },
  {
    id: "vegetables",
    labelKey: "vegetables",
    areaKey: "vegetables",
    shop: { cultures: ["vegetables"] },
  },
  {
    id: "fruits",
    labelKey: "fruits",
    areaKey: "fruits",
    shop: { cultures: ["fruits"] },
  },
];

export const SOLUTION_STAGE_CARDS: SolutionStageCard[] = [
  {
    id: "propagation",
    image: "/assets/solutions/stage-propagation.jpg",
    titleKey: "propagation",
    tagKeys: ["seedlingTrays", "substrates"],
    shop: { categoryId: "propagation" },
  },
  {
    id: "growing",
    image: "/assets/solutions/stage-growing.jpg",
    titleKey: "growing",
    tagKeys: ["seedlingTrays", "substrates", "pots", "irrigation"],
    shop: { categoryId: "growing" },
  },
  {
    id: "harvest",
    image: "/assets/solutions/stage-harvest.jpg",
    titleKey: "harvest",
    tagKeys: ["crates", "transportTrays", "harvestCarts"],
    shop: { categoryId: "harvest" },
  },
  {
    id: "postharvest",
    image: "/assets/solutions/stage-postharvest.jpg",
    titleKey: "postharvest",
    tagKeys: ["packaging", "crates"],
    shop: { categoryId: "post-harvest" },
  },
  {
    id: "transport-logistics",
    image: "/assets/solutions/stage-transport.png",
    titleKey: "transportLogistics",
    tagKeys: ["logisticsTrolleys", "displaySystems"],
    shop: { categoryId: "transport-and-logistics" },
  },
  {
    id: "retail",
    image: "/assets/solutions/stage-retail.jpg",
    titleKey: "retail",
    tagKeys: ["logisticsTrolleys", "displaySystems"],
    shop: { categoryId: "retail" },
  },
  {
    id: "automation",
    image: "/assets/solutions/stage-automation.jpg",
    titleKey: "automation",
    tagKeys: ["automationSystems", "greenhouseTech"],
    shop: { categoryId: "automation-and-machinery" },
  },
];

export const SOLUTION_AREAS: SolutionArea[] = [
  {
    id: "flowers",
    anchor: "flowers",
    layout: "image-right",
    image: "/assets/homepage/capabilities-partnerships.jpg",
    titleKey: "flowers",
    descriptionKey: "flowers",
    ctaKey: "flowers",
    shop: { q: "flowers" },
    items: [
      { id: "floriculture", nameKey: "floriculture", shop: { q: "flowers" } },
      { id: "potted-plants", nameKey: "pottedPlants", shop: { q: "pots" } },
      { id: "cut-flowers", nameKey: "cutFlowers", shop: { q: "flowers packaging" } },
    ],
  },
  {
    id: "fruits",
    anchor: "fruits",
    layout: "image-left",
    image: "/assets/homepage/hero-vineyard.jpg",
    titleKey: "fruits",
    descriptionKey: "fruits",
    ctaKey: "fruits",
    shop: { q: "fruits" },
    items: [
      { id: "berries", nameKey: "berries", shop: { q: "berries" } },
      { id: "avocado", nameKey: "avocado", shop: { q: "avocado" } },
      { id: "banana", nameKey: "banana", shop: { q: "banana" } },
    ],
  },
  {
    id: "vegetables",
    anchor: "vegetables",
    layout: "image-right",
    image: "/assets/homepage/greenhouse-technology.webp",
    titleKey: "vegetables",
    descriptionKey: "vegetables",
    ctaKey: "vegetables",
    shop: { cultures: ["vegetables"], q: "vegetables" },
    items: [
      { id: "tomato", nameKey: "tomato", shop: { cultures: ["vegetables"], q: "tomato" } },
      { id: "cucumber", nameKey: "cucumber", shop: { cultures: ["vegetables"], q: "cucumber" } },
      { id: "pepper", nameKey: "pepper", shop: { cultures: ["vegetables"], q: "pepper" } },
    ],
  },
  {
    id: "logistics-display",
    anchor: "logistics-display",
    layout: "image-left",
    image: "/assets/homepage/solutions-logistics.jpg",
    titleKey: "logisticsDisplay",
    descriptionKey: "logisticsDisplay",
    ctaKey: "logisticsDisplay",
    shop: { q: "logistics" },
    items: [
      { id: "rolling-containers", nameKey: "rollingContainers", shop: { q: "trolleys" } },
      { id: "display-systems", nameKey: "displaySystems", shop: { q: "display" } },
    ],
  },
  {
    id: "machinery-automation",
    anchor: "machinery-automation",
    layout: "image-right",
    image: "/assets/homepage/solutions-integrated.jpg",
    titleKey: "machineryAutomation",
    descriptionKey: "machineryAutomation",
    ctaKey: "machineryAutomation",
    shop: { q: "automation" },
    items: [
      { id: "automation-systems", nameKey: "automationSystems", shop: { q: "automation" } },
      {
        id: "greenhouse-tech",
        nameKey: "greenhouseTech",
        shop: { applications: ["greenhouse"], q: "greenhouse" },
      },
    ],
  },
];

/** Wheel segments clockwise from top. */
export const VALUE_CHAIN_WHEEL_SEGMENTS: ValueChainWheelSegment[] = [
  {
    id: "flowers",
    titleKey: "flowers",
    bodyKey: "flowers",
    image: "/assets/homepage/capabilities-partnerships.jpg",
    color: "var(--oboya-blue-light)",
    href: "/",
  },
  {
    id: "machinery-automation",
    titleKey: "machineryAutomation",
    bodyKey: "machineryAutomation",
    image: "/assets/homepage/solutions-integrated.jpg",
    color: "var(--oboya-blue)",
    href: "/",
  },
  {
    id: "vegetables",
    titleKey: "vegetables",
    bodyKey: "vegetables",
    image: "/assets/homepage/greenhouse-technology.webp",
    color: "#006b9a",
    href: "/",
  },
  {
    id: "logistics-display",
    titleKey: "logisticsDisplay",
    bodyKey: "logisticsDisplay",
    image: "/assets/homepage/solutions-logistics.jpg",
    color: "var(--oboya-blue-dark)",
    href: "/",
  },
  {
    id: "fruits",
    titleKey: "fruits",
    bodyKey: "fruits",
    image: "/assets/homepage/hero-vineyard.jpg",
    color: "var(--oboya-green)",
    href: "/",
  },
];

/**
 * Stage links for the active wheel sector.
 * `href` is a placeholder (`/`) until per-sector pages exist.
 */
export const VALUE_CHAIN_STAGE_LINKS: ValueChainStageLink[] = [
  { id: "propagation", titleKey: "propagation", href: "/" },
  { id: "growing", titleKey: "growing", href: "/" },
  { id: "harvest", titleKey: "harvest", href: "/" },
  { id: "postharvest", titleKey: "postharvest", href: "/" },
  { id: "transport-logistics", titleKey: "transportLogistics", href: "/" },
  { id: "retail", titleKey: "retail", href: "/" },
  { id: "automation", titleKey: "automation", href: "/" },
];

export const VALUE_CHAIN_FOOTER_LINKS: ValueChainFooterLink[] = [
  { id: "caseStudy", titleKey: "caseStudy", href: "/" },
  { id: "insights", titleKey: "insights", href: "/" },
  { id: "quote", titleKey: "quote", href: "/" },
];

export const SOLUTION_AREA_IDS: SolutionsAreaId[] = SOLUTION_AREAS.map(
  (area) => area.id
);

export function getSolutionArea(id: string): SolutionArea | undefined {
  return SOLUTION_AREAS.find((area) => area.id === id);
}

export function solutionAreaHref(id: SolutionsAreaId): string {
  return `/solutions?area=${id}`;
}

const CROP_FILTER_IDS = new Set<SolutionsCropFilter["id"]>([
  "flowers",
  "vegetables",
  "fruits",
]);

/** Homepage / deep-link area → Solutions crop filter. Non-crop areas map to All Crops. */
export function cropFilterFromAreaParam(
  area: string | null
): SolutionsCropFilter["id"] | null {
  if (!area) return null;
  const normalized = area.trim().toLowerCase();
  if (normalized === "all") return "all";
  if (
    normalized === "flowers" ||
    normalized === "vegetables" ||
    normalized === "fruits"
  ) {
    return normalized;
  }
  return "all";
}

/**
 * Resolve a Solutions deep-link for a homepage business-solutions card.
 * Crop cards → that filter; anything else → All Crops.
 */
export function solutionsHrefForBusinessCard(input: {
  id: string;
  href?: string;
  title?: string;
}): string {
  const id = input.id.trim().toLowerCase();
  if (CROP_FILTER_IDS.has(id as SolutionsCropFilter["id"])) {
    return `/solutions?area=${id}`;
  }

  const haystack = `${id} ${input.href ?? ""} ${input.title ?? ""}`.toLowerCase();
  if (/\bflowers?\b|flor(?:es|icultura)?\b/.test(haystack)) {
    return "/solutions?area=flowers";
  }
  if (
    /\bvegetables?\b|\bherbs?\b|vegetais|hortali[cç]as?|hierbas?\b/.test(
      haystack
    )
  ) {
    return "/solutions?area=vegetables";
  }
  if (/\bfruits?\b|frutas?\b/.test(haystack)) {
    return "/solutions?area=fruits";
  }

  try {
    const raw = (input.href || "").trim();
    if (raw) {
      const url = new URL(raw, "https://oboya.local");
      const area =
        url.searchParams.get("area") ||
        url.hash.replace(/^#/, "") ||
        (url.pathname.includes("/solutions/")
          ? url.pathname.split("/solutions/")[1]?.split(/[?#]/)[0]
          : "");
      const mapped = cropFilterFromAreaParam(area || null);
      if (mapped && mapped !== "all") {
        return `/solutions?area=${mapped}`;
      }
    }
  } catch {
    // fall through to All Crops
  }

  return "/solutions?area=all";
}
