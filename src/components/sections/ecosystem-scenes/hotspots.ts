import type { HomeEcosystemStageId } from "@/lib/cms/repositories/homepage-repository";
import { pct } from "./iso-kit";

/** Where a label hangs: the leader runs vertically from the dot to `ly`, then horizontally to `lx`. */
export type Anchor = { lx: number; ly: number; side: "l" | "r" };
/**
 * A callout: the dot sits on the object (panel percentages from world coordinates); `d` is the
 * desktop/tablet label anchor, `m` the compact mobile one (the 4:3 panel crops the 8:5 layer to
 * ~8–92 % horizontally, and pills are wider relative to the panel).
 */
export type Hotspot = { left: number; top: number; d: Anchor; m: Anchor };

const anchor = (left: number, top: number, dx: number, dy: number): Anchor => ({
  lx: Math.round((left + dx) * 10) / 10,
  ly: Math.round((top + dy) * 10) / 10,
  side: dx < 0 ? "l" : "r",
});
const callout = (p: [number, number, number], d: [number, number], m: [number, number]): Hotspot => {
  const { left, top } = pct(...p);
  return { left, top, d: anchor(left, top, ...d), m: anchor(left, top, ...m) };
};

/**
 * Where each proof point lives in its scene. Index = proof point index (default CMS order).
 * Offsets are planned per breakpoint so pills never cover a product, another pill, the unit at
 * rest on the rail or a panel edge; leaders stay short and pills sit on floor, sky or flat
 * backdrop (wall, glass) only.
 */
export const HOTSPOTS: Record<HomeEcosystemStageId, Hotspot[]> = {
  // trays (fourth tray), substrates (bottom bag, front face), seeding (seeder head)
  propagation: [
    callout([32, -50, 46], [6, -16], [-2, 20]),
    callout([-176, 36, 10], [6, 12], [4, 14]),
    callout([-71, -49, 72], [6, -12], [4, -14]),
  ],
  // pots (first mum pot on the bench), substrates (cut-away container), irrigation (tank base)
  growing: [
    callout([-154, -40, 24], [6, -12], [4, -12]),
    callout([150, 18, 12], [6, 8], [-4, 8]),
    callout([-178, 12, 6], [6, 12], [4, 14]),
  ],
  // crates (top crate on the trolley), trolleys (trolley deck), handling (cut flowers in buckets)
  harvest: [
    callout([-31, 14, 40], [6, 20], [12, -24]),
    callout([-4, 26, 12], [6, 14], [-4, 26]),
    callout([-90, 24, 22], [-8, -16], [-2, -16]),
  ],
  // clamshells (punnet on the belt), bags (bag at the end of the line), labels (applicator head)
  packaging: [
    callout([32, -37, 40], [-6, 16], [-4, 14]),
    callout([104, -39, 46], [-6, 16], [-2, 22]),
    callout([72, -37, 58], [6, -18], [4, -16]),
  ],
  // trolleys (top crate on the parked trolley), buckets (bucket on the towed trolley), agv (deck)
  logistics: [
    callout([-123, -16, 87], [-6, -6], [4, -10]),
    callout([22, -18, 58], [6, -14], [4, -12]),
    callout([98, -18, 12], [6, 12], [2, 14]),
  ],
  // displays (floor stand bucket), shelf-ready (punnet on the middle shelf), potted (pot on the top shelf)
  retail: [
    callout([152, 23, 24], [8, 0], [-8, 12]),
    callout([-66, -37, 44], [-6, 14], [-4, 12]),
    callout([-18, -38, 84], [6, -12], [4, -12]),
  ],
};
