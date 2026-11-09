import type { HomeEcosystemStageId } from "@/lib/cms/repositories/homepage-repository";
import { pct } from "./iso-kit";

export type Hotspot = { left: number; top: number };

/**
 * Where each proof point lives in its scene (panel percentages, from world coordinates).
 * Index = proof point index.
 */
export const HOTSPOTS: Record<HomeEcosystemStageId, Hotspot[]> = {
  // Default proof points: trays, substrates (bags), seeding (gantry head).
  propagation: [pct(10, -40, 51), pct(-132, 28, 48), pct(86, -38, 86)],
  // pots (middle gutter), substrates (cut-away pot), irrigation (header pipe).
  growing: [pct(0, -38, 30), pct(140, 48, 20), pct(-174, -38, 44)],
  // crates (stack on the trolley), trolleys (trolley deck), handling (front hedge produce).
  harvest: [pct(-10, 2, 40), pct(-40, 16, 12), pct(80, -20, 26)],
  // clamshells (first output), bags (bag on the belt), labels (applicator head).
  packaging: [pct(32, -29, 30), pct(74, -35, 42), pct(120, -29, 54)],
  // trolleys (parked trolley), buckets (middle shelf of the towed trolley), agv (deck).
  logistics: [pct(-115, -38, 62), pct(31, 4, 58), pct(116, 6, 12)],
  // Default proof points: floor display, shelf-ready packs (middle shelf), potted plants (top shelf).
  retail: [pct(188, 44, 38), pct(-5, -10, 60), pct(-5, -10, 96)],
};
