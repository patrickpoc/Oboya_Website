"use client";

import { useId } from "react";
import { M, mix } from "./flat-kit";
import {
  ACCENT,
  DashMarch,
  Draw,
  Fade,
  GRID,
  H,
  PLATE,
  Plate,
  RAIL,
  Static,
  W,
  boxLeft,
  boxOutline,
  boxRight,
  boxTop,
  plane,
  seg,
} from "./iso-kit";

const { x0, x1, y0, y1, h } = PLATE;
const slab = { x: x0, y: y0, z: -h, w: x1 - x0, d: y1 - y0, h };
const SW = "var(--oboya-soft-white)";
const SKY_TOP = mix(M.blueLight, 22, SW);
const GROUND = mix(M.leafLight, 9, SW);

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
 * The shared ground: ambient sky, light plate, grid and flow rail. Mounted once per panel,
 * so the rail stays at the same coordinates while scenes change above it.
 */
export function Backdrop({ st }: { st: boolean }) {
  const id = useId();
  return (
    <Static st={st}>
      <Plate>
        <defs>
          {/* Ambient sky: the one allowed 2-stop gradient. */}
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={SKY_TOP} />
            <stop offset="1" stopColor={SW} />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${id})`} />
        <Fade delay={0.1} dur={0.8}>
          <path d={boxTop(slab)} fill={GROUND} />
          <path d={boxLeft(slab)} fill={mix(M.steel, 70, SW)} />
          <path d={boxRight(slab)} fill={M.steel} />
          <path d={boxOutline(slab)} fill="none" stroke={M.steelDark} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }} />
        </Fade>
        <Fade delay={0.3} dur={0.9}>
          <path d={GRID_D} fill="none" stroke={GRID} style={{ strokeWidth: "var(--eco-ink, 1.2px)" }} />
        </Fade>
        {/* Rail bed, tracks and ties. */}
        <Fade delay={0.4} dur={0.6}>
          <path d={plane(x0, RAIL.y - RAIL.half - 3, x1 - x0, RAIL.half * 2 + 6)} fill={mix(M.steel, 45, SW)} />
        </Fade>
        <Draw d={RAILS.tracks} color={M.steelDark} delay={0.2} dur={1.1} />
        <Draw d={RAILS.ties} color={M.steel} w="light" delay={0.6} dur={0.8} />
        <DashMarch d={RAILS.dashes} color={ACCENT.blueLight} delay={0.8} opacity={0.55} />
      </Plate>
    </Static>
  );
}
