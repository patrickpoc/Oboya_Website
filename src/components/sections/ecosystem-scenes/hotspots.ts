import type { HomeEcosystemStageId } from "@/lib/cms/repositories/homepage-repository";
import { pct } from "./iso-kit";

/**
 * A callout: the dot sits on the object (panel percentages from world coordinates); the leader
 * runs vertically to `ly`, then horizontally to `lx`, where the label hangs on its `side`.
 */
export type Hotspot = { left: number; top: number; lx: number; ly: number; side: "l" | "r" };

const callout = (p: [number, number, number], dx: number, dy: number): Hotspot => {
  const { left, top } = pct(...p);
  return { left, top, lx: Math.round((left + dx) * 10) / 10, ly: Math.round((top + dy) * 10) / 10, side: dx < 0 ? "l" : "r" };
};

/**
 * Where each proof point lives in its scene. Index = proof point index (default CMS order).
 * Label offsets were chosen so labels never cover the object they name, each other or the edges.
 */
export const HOTSPOTS: Record<HomeEcosystemStageId, Hotspot[]> = {
  // trays (fourth tray), substrates (top bag), seeding (seeder head)
  propagation: [callout([32, -50, 46], 6, -16), callout([-176, 23, 44], 6, -14), callout([-71, -49, 72], 6, -12)],
  // pots (mum pot on the bench), substrates (cut-away container), irrigation (tank)
  growing: [callout([-34, -40, 24], -6, -30), callout([150, 18, 12], 6, 8), callout([-178, 12, 30], 6, 12)],
  // crates (top crate on the trolley), trolleys (trolley deck), handling (cut flowers in buckets)
  harvest: [callout([-31, 14, 40], 6, 20), callout([-4, 26, 12], 6, 14), callout([-150, 40, 22], -6, -16)],
  // clamshells (punnet on the belt), bags (bag at the end of the line), labels (applicator head)
  packaging: [callout([32, -37, 40], -6, 16), callout([104, -39, 46], -6, 16), callout([72, -37, 58], 6, -18)],
  // trolleys (top crate on the parked trolley), buckets (bucket on the towed trolley), agv (deck)
  logistics: [callout([-123, -16, 87], -6, -6), callout([22, -18, 58], 6, -14), callout([98, -18, 12], 6, 12)],
  // displays (floor stand bucket), shelf-ready (punnet on the middle shelf), potted (pot on the top shelf)
  retail: [callout([152, 23, 24], 8, 0), callout([-66, -37, 44], -6, 14), callout([-18, -38, 84], 6, -12)],
};
