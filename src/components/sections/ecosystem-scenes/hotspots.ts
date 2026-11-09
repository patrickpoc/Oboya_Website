import type { HomeEcosystemStageId } from "@/lib/cms/repositories/homepage-repository";
import { pct } from "./iso-kit";

export type Hotspot = { left: number; top: number };

/**
 * Where each proof point lives in its scene (panel percentages, from world coordinates).
 * Index = proof point index.
 */
export const HOTSPOTS: Record<HomeEcosystemStageId, Hotspot[]> = {
  // Default proof points: trays, substrates (bags), seeding (gantry head).
  propagation: [pct(7, -42, 44), pct(-157, 37, 54), pct(-114, -43, 68)],
  // pots (middle gutter), substrates (cut-away pot), irrigation (header pipe).
  growing: [pct(0, -40, 28), pct(142, 48, 22), pct(-174, -40, 46)],
  // crates (stack on the trolley), trolleys (trolley deck), handling (front hedge produce).
  harvest: [pct(-26, 8, 42), pct(-14, 22, 12), pct(80, -24, 36)],
  // clamshells (first output), bags (bag on the belt), labels (applicator head).
  packaging: [pct(32, -29, 30), pct(76, -34, 44), pct(121, -29, 52)],
  // trolleys (parked trolley), buckets (middle shelf of the towed trolley), agv (deck).
  logistics: [pct(-115, -38, 62), pct(31, 4, 58), pct(116, 6, 12)],
  // Default proof points: floor display, shelf-ready packs (middle shelf), potted plants (top shelf).
  retail: [pct(188, 44, 38), pct(-5, -10, 60), pct(-5, -10, 96)],
};
