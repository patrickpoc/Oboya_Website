import type { ShopFilters } from "@/lib/shop/types";

/** Crop filters in the Solutions explorer (Image 1). */
export type SolutionsCropFilterId =
  | "all"
  | "flowers"
  | "vegetables"
  | "fruits";

/** Five primary solution areas used for routing / homepage deep-links. */
export type SolutionsAreaId =
  | "flowers"
  | "fruits"
  | "vegetables"
  | "logistics-display"
  | "machinery-automation";

/** Explorer / value-chain stage cards. */
export type SolutionStageCardId =
  | "propagation"
  | "growing"
  | "harvest"
  | "postharvest"
  | "transport-logistics"
  | "retail"
  | "automation";

export type SolutionBlockLayout = "image-right" | "image-left";

/**
 * Explicit Shop deep-link target.
 * IDs must match CMS marketplace taxonomy when available.
 */
export interface ShopFilterTarget {
  categoryId?: string | null;
  subcategoryIds?: string[];
  brandIds?: string[];
  applications?: string[];
  cultures?: string[];
  certifications?: string[];
  countriesOfOrigin?: string[];
  q?: string;
}

export interface SolutionItem {
  id: string;
  nameKey: string;
  shop: ShopFilterTarget;
}

export interface SolutionArea {
  id: SolutionsAreaId;
  anchor: string;
  layout: SolutionBlockLayout;
  image: string;
  titleKey: string;
  descriptionKey: string;
  ctaKey: string;
  items: SolutionItem[];
  shop: ShopFilterTarget;
}

export interface SolutionStageCard {
  id: SolutionStageCardId;
  image: string;
  titleKey: string;
  tagKeys: string[];
  shop: ShopFilterTarget;
}

export interface SolutionsCropFilter {
  id: SolutionsCropFilterId;
  labelKey: string;
  areaKey?: "flowers" | "vegetables" | "fruits";
  shop: ShopFilterTarget;
}

/** Wheel segment = one of the five solution areas. */
export interface ValueChainWheelSegment {
  id: SolutionsAreaId;
  /** i18n under solutionsPage.valueChain.segments.* */
  titleKey: string;
  bodyKey: string;
  image: string;
  color: string;
  /**
   * Placeholder href for the sector overview.
   * Replace per-area when dedicated pages exist.
   */
  href: string;
}

/** Stage link shown beside the wheel for the active sector. */
export interface ValueChainStageLink {
  id: SolutionStageCardId;
  titleKey: string;
  /**
   * Placeholder — currently `/` for all; set per sector/stage later.
   */
  href: string;
}

export interface ValueChainFooterLink {
  id: "caseStudy" | "insights" | "quote";
  titleKey: string;
  href: string;
}

export type ShopHrefFilters = Pick<
  ShopFilters,
  | "categoryId"
  | "subcategoryIds"
  | "brandIds"
  | "applications"
  | "cultures"
  | "certifications"
  | "countriesOfOrigin"
>;
