"use client";

import { M, mix } from "./flat-kit";
import { DashMarch, Draw, Fade, H, PLATE, Plate, RAIL, Static, W, boxLeft, boxOutline, boxRight, boxTop, plane, seg } from "./iso-kit";

const { x0, x1, y0, y1, h } = PLATE;
const slab = { x: x0, y: y0, z: -h, w: x1 - x0, d: y1 - y0, h };
const SW = "var(--oboya-soft-white)";
const BD = "var(--oboya-blue-dark)";
/** Dark navy panel; the plate is a subtly lighter navy so objects and their shadows read. */
const GROUND = mix(BD, 86, SW);
const GROUND_SIDE = mix(BD, 93, SW);

/** Ground grid, 30-unit cells inside the plate. */
function gridPath() {
  const parts: string[] = [];
  for (let y = y0 + 30; y < y1 - 1; y += 30) parts.push(seg([x0, y], [x1, y]));
  for (let x = x0 + 30; x < x1 - 1; x += 30) parts.push(seg([x, y0], [x, y1]));
  return parts.join("");
}

/** Two tracks with ties across the plate; a dashed guide line between them. */
function railPaths() {
  const a = RAIL.y - RAIL.half;
  const b = RAIL.y + RAIL.half;
  const tracks = seg([x0, a], [x1, a]) + seg([x0, b], [x1, b]);
  const ties: string[] = [];
  for (let x = x0 + 15; x < x1; x += 30) ties.push(seg([x, a], [x, b]));
  const dashes = seg([x0, RAIL.y], [x1, RAIL.y]);
  return { tracks, ties: ties.join(""), dashes };
}

const GRID_D = gridPath();
const RAILS = railPaths();

/**
 * The shared ground: dark navy panel, lighter navy plate, faint grid and the flow rail. Mounted
 * once per panel, so the rail stays at the same coordinates while scenes change above it.
 */
export function Backdrop({ st }: { st: boolean }) {
  return (
    <Static st={st}>
      <Plate>
        <rect width={W} height={H} fill={BD} />
        <Fade delay={0.1} dur={0.8}>
          <path d={boxTop(slab)} fill={GROUND} />
          <path d={boxLeft(slab)} fill={GROUND_SIDE} />
          <path d={boxRight(slab)} fill={GROUND_SIDE} />
          <path d={boxOutline(slab)} fill="none" stroke={mix(BD, 62, SW)} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }} />
        </Fade>
        <Fade delay={0.3} dur={0.9}>
          <path d={GRID_D} fill="none" stroke={SW} opacity={0.07} style={{ strokeWidth: "var(--eco-ink, 1.2px)" }} />
        </Fade>
        {/* Rail bed, tracks and ties. */}
        <Fade delay={0.4} dur={0.6}>
          <path d={plane(x0, RAIL.y - RAIL.half - 3, x1 - x0, RAIL.half * 2 + 6)} fill={mix(BD, 78, SW)} />
        </Fade>
        <Draw d={RAILS.tracks} color={M.steel} delay={0.2} dur={1.1} />
        <Draw d={RAILS.ties} color={M.steelDark} w="light" delay={0.6} dur={0.8} />
        <DashMarch d={RAILS.dashes} color={M.blueLight} delay={0.8} opacity={0.6} />
      </Plate>
    </Static>
  );
}
