export type SolutionCategoryId =
  | "flowers"
  | "vegetables"
  | "fruits"
  | "logistics-display"
  | "machinery-automation";

export const SOLUTION_CATEGORY_IDS: SolutionCategoryId[] = [
  "flowers",
  "vegetables",
  "fruits",
  "logistics-display",
  "machinery-automation",
];

export type SolutionStageId =
  | "propagation"
  | "growing"
  | "harvest"
  | "postharvest"
  | "transport"
  | "retail"
  | "automation";

export interface SolutionStageMeta {
  id: SolutionStageId;
  href: string;
}

export const SOLUTION_STAGES: SolutionStageMeta[] = [
  { id: "propagation", href: "/solutions" },
  { id: "growing", href: "/solutions" },
  { id: "harvest", href: "/solutions" },
  { id: "postharvest", href: "/solutions" },
  { id: "transport", href: "/solutions" },
  { id: "retail", href: "/solutions" },
  { id: "automation", href: "/solutions?area=machinery-automation" },
];

const CROP_STAGE_IDS: SolutionStageId[] = [
  "propagation",
  "growing",
  "harvest",
  "postharvest",
  "transport",
  "retail",
  "automation",
];

export const CATEGORY_STAGE_IDS: Record<SolutionCategoryId, SolutionStageId[]> = {
  flowers: CROP_STAGE_IDS,
  vegetables: CROP_STAGE_IDS,
  fruits: CROP_STAGE_IDS,
  "logistics-display": ["transport", "retail"],
  "machinery-automation": ["automation"],
};

export function isSolutionCategoryId(id: string): id is SolutionCategoryId {
  return id in CATEGORY_STAGE_IDS;
}

export function stagesForCategory(categoryId: string): SolutionStageMeta[] {
  if (!isSolutionCategoryId(categoryId)) return [];
  const ids = new Set(CATEGORY_STAGE_IDS[categoryId]);
  return SOLUTION_STAGES.filter((stage) => ids.has(stage.id));
}
