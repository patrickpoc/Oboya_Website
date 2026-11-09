import type { HomeEcosystemStageId } from "@/lib/cms/repositories/homepage-repository";
import { pct } from "./iso-kit";

export type Hotspot = { left: number; top: number };

/**
 * Where each proof point lives in its scene (panel percentages, from world coordinates).
 * Index = proof point index. Scenes still on the old kit get provisional spots.
 */
export const HOTSPOTS: Record<HomeEcosystemStageId, Hotspot[]> = {
  // Default proof points: trays, substrates (bags), seeding (gantry head).
  propagation: [pct(-30, -46, 54), pct(-186, 32, 48), pct(46, -44, 96)],
  growing: [
    { left: 36, top: 48 },
    { left: 60, top: 40 },
    { left: 78, top: 62 },
  ],
  harvest: [
    { left: 34, top: 50 },
    { left: 58, top: 56 },
    { left: 76, top: 44 },
  ],
  packaging: [
    { left: 30, top: 52 },
    { left: 52, top: 42 },
    { left: 74, top: 58 },
  ],
  logistics: [
    { left: 32, top: 54 },
    { left: 56, top: 46 },
    { left: 78, top: 56 },
  ],
  // Default proof points: floor display, shelf-ready packs (middle shelf), potted plants (top shelf).
  retail: [pct(186, 60, 46), pct(0, 8, 72), pct(0, 8, 112)],
};
