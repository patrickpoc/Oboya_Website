"use client";

import { useId } from "react";
import {
  ACCENT,
  CONSTRUCTION,
  DashMarch,
  Draw,
  FACE,
  Fade,
  GRID,
  P,
  PLATE,
  Plate,
  RAIL,
  Static,
  boxLeft,
  boxOutline,
  boxRight,
  boxTop,
  iso,
  plane,
  seg,
} from "./iso-kit";

const { x0, x1, y0, y1, h } = PLATE;
const slab = { x: x0, y: y0, z: -h, w: x1 - x0, d: y1 - y0, h };

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
const [, topY] = iso(x0, y0, 0);
const [, botY] = iso(x1, y1, 0);

/**
 * The shared ground: plate, grid and flow rail. Mounted once per panel, so the rail
 * stays at the same coordinates while scenes change above it.
 */
export function Backdrop({ st }: { st: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <Static st={st}>
      <Plate>
        <defs>
          {/* The single allowed gradient: a faint ground fade on the plate. */}
          <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1="0" y1={topY} x2="0" y2={botY}>
            <stop offset="0" stopColor={FACE.soft} stopOpacity="0.55" />
            <stop offset="1" stopColor={FACE.soft} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <Fade delay={0.2} dur={0.9}>
          <path d={boxTop(slab)} fill={`url(#${id}-g)`} />
          <path d={boxLeft(slab)} fill={FACE.left} />
          <path d={boxRight(slab)} fill={FACE.right} />
        </Fade>
        <Fade delay={0.5} dur={1}>
          <path d={GRID_D} fill="none" stroke={GRID} style={{ strokeWidth: "var(--eco-ink, 1.2px)" }} />
        </Fade>
        <Draw d={boxOutline(slab)} color={CONSTRUCTION} delay={0} dur={1.4} />
        <Draw d={`M${P(x0, y1)}L${P(x0, y0)}L${P(x1, y0)}`} color={CONSTRUCTION} w="light" delay={0.6} dur={0.9} />
        {/* Rail bed, tracks and ties. */}
        <Fade delay={0.9} dur={0.7}>
          <path d={plane(x0, RAIL.y - RAIL.half, x1 - x0, RAIL.half * 2)} fill={FACE.right} />
        </Fade>
        <Draw d={RAILS.tracks} delay={0.4} dur={1.3} />
        <Draw d={RAILS.ties} color={CONSTRUCTION} w="light" delay={1} dur={0.9} />
        <DashMarch d={RAILS.dashes} color={ACCENT.blueLight} delay={1.2} opacity={0.45} />
      </Plate>
    </Static>
  );
}
