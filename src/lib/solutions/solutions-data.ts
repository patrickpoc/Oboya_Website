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
    shop: { q: "flowers" },
  },
  {
    id: "vegetables",
    labelKey: "vegetables",
    areaKey: "vegetables",
    shop: { cultures: ["vegetables"], q: "vegetables" },
  },
  {
    id: "fruits",
    labelKey: "fruits",
    areaKey: "fruits",
    shop: { q: "fruits" },
  },
];

export const SOLUTION_STAGE_CARDS: SolutionStageCard[] = [
  {
    id: "propagation",
    image: "/assets/homepage/capabilities-value-chain.jpg",
    titleKey: "propagation",
    tagKeys: ["seedlingTrays", "substrates"],
    shop: { q: "propagation trays" },
  },
  {
    id: "growing",
    image: "/assets/homepage/hero-vineyard.jpg",
    titleKey: "growing",
    tagKeys: ["seedlingTrays", "substrates", "pots", "irrigation"],
    shop: { q: "pots irrigation" },
  },
  {
    id: "harvest",
    image: "/assets/homepage/solutions-integrated.jpg",
    titleKey: "harvest",
    tagKeys: ["crates", "transportTrays", "harvestCarts"],
    shop: { q: "crates harvest" },
  },
  {
    id: "postharvest",
    image: "/assets/homepage/capabilities-partnerships.jpg",
    titleKey: "postharvest",
    tagKeys: ["packaging", "crates"],
    shop: { q: "packaging" },
  },
  {
    id: "transport-logistics",
    image: "/assets/homepage/solutions-logistics.jpg",
    titleKey: "transportLogistics",
    tagKeys: ["logisticsTrolleys", "displaySystems"],
    shop: { q: "trolleys logistics" },
  },
  {
    id: "retail",
    image: "/assets/homepage/capabilities-global-local.jpg",
    titleKey: "retail",
    tagKeys: ["logisticsTrolleys", "displaySystems"],
    shop: { q: "display retail" },
  },
  {
    id: "automation",
    image: "/assets/homepage/greenhouse-technology.webp",
    titleKey: "automation",
    tagKeys: ["automationSystems", "greenhouseTech"],
    shop: { q: "automation" },
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

export function cropFilterFromAreaParam(
  area: string | null
): SolutionsCropFilter["id"] | null {
  if (!area) return null;
  if (area === "flowers" || area === "vegetables" || area === "fruits") {
    return area;
  }
  return null;
}
