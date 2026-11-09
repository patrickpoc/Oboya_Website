"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Isometric (30°) projection kit on the dark navy panel; filled objects live in flat-kit.tsx.
 * One projection, one ground plate and one flow rail shared by every scene (see backdrop.tsx).
 * Brand tokens only (and color-mix() blends of them), no filters, no <text>, no Math.random and no
 * infinite animations.
 *
 * World axes: x runs right-down on screen, y runs left-down, z up. The camera sits at (-∞, -∞, +∞),
 * so painter's order is by increasing `x + y` (far to near); objects stacked on one footprint are
 * drawn bottom-up, each surface before the objects standing on it.
 */

// ---- Projection -------------------------------------------------------------
export const W = 800;
export const H = 500;
const OX = 400;
const OY = 300;
/** World unit to screen pixel. One world unit reads as ~2 cm (pot Ø10, crate 30×20, CC trolley 68×28×95). */
export const S = 1.4;
const COS = 0.8660254 * S;
const SIN = 0.5 * S;

const r1 = (v: number) => Math.round(v * 10) / 10;
/** World (x right-down, y left-down, z up) to screen. */
export const iso = (x: number, y: number, z = 0): [number, number] => [
  r1(OX + (x - y) * COS),
  r1(OY + (x + y) * SIN - z * S),
];
/** Screen point as "x y". */
export const P = (x: number, y: number, z = 0) => iso(x, y, z).join(" ");
/** Screen point as a percentage of the panel (for HTML hotspots). */
export const pct = (x: number, y: number, z = 0) => {
  const [sx, sy] = iso(x, y, z);
  return { left: r1((sx / W) * 100), top: r1((sy / H) * 100) };
};
/** Screen offset of a world shift along the x axis (used by <use> and by the travelling unit). */
const alongX = (dx: number): [number, number] => [r1(dx * COS), r1(dx * SIN)];
const alongY = (dy: number): [number, number] => [r1(-dy * COS), r1(dy * SIN)];
const [OX0, OY0] = iso(0, 0, 0);
/** SVG transform that moves a symbol drawn around the world origin to world (x, y, z). */
export const at = (x: number, y: number, z = 0) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${r1(sx - OX0)} ${r1(sy - OY0)})`;
};

// ---- Ground plate and rail (fixed across scenes) -----------------------------
/** The plate is longer than the frame along x: its left and right corners bleed off the panel. */
export const PLATE = { x0: -300, x1: 300, y0: -112, y1: 100, h: 6 } as const;
/** The flow rail: two tracks along x at the front of the plate. */
export const RAIL = { y: 80, half: 6 } as const;

// ---- Colour -----------------------------------------------------------------
/** Dark panel: ink is soft white mixed toward dark blue. */
const sw = (p: number) => `color-mix(in srgb, var(--oboya-soft-white) ${p}%, var(--oboya-blue-dark))`;
const INK = sw(72);

// ---- Stroke weights ---------------------------------------------------------
/** Three weights from one CSS variable set on the panel (`--eco-ink`). */
type Weight = "light" | "base" | "heavy";
const MUL: Record<Weight, number> = { light: 0.7, base: 1, heavy: 1.6 };
export const ink = (w: Weight = "base") => `calc(var(--eco-ink, 1.2px) * ${MUL[w]})`;
export const EASE = [0.22, 1, 0.36, 1] as const;

// ---- Scene context ----------------------------------------------------------
export type SceneProps = { st: boolean; active?: number | null };
/** Per-panel playback: the clock duration and play state of the current phase. */
export const SceneClock = createContext<{ ms: number; playState: "running" | "paused"; rest: boolean }>({
  ms: 4000,
  playState: "running",
  rest: false,
});
export const StaticCtx = createContext(false);
/** Mark everything inside as static (complete frame, no draw-on). */
export function Static({ st, children }: { st: boolean; children: ReactNode }) {
  return <StaticCtx.Provider value={st}>{children}</StaticCtx.Provider>;
}
const useStatic = () => useContext(StaticCtx);

// ---- Path builders ----------------------------------------------------------
export type Box = { x: number; y: number; z?: number; w: number; d: number; h: number };

/** Visible silhouette of a box (hexagon). */
export function boxOutline({ x, y, z = 0, w, d, h }: Box) {
  const t = z + h;
  return `M${P(x, y, t)}L${P(x + w, y, t)}L${P(x + w, y, z)}L${P(x + w, y + d, z)}L${P(x, y + d, z)}L${P(x, y + d, t)}Z`;
}
/** The three inner edges meeting at the front-top corner. */
export function boxInner({ x, y, z = 0, w, d, h }: Box) {
  const t = z + h;
  const c = P(x + w, y + d, t);
  return `M${P(x + w, y, t)}L${c}L${P(x, y + d, t)}M${c}L${P(x + w, y + d, z)}`;
}
export function boxTop({ x, y, z = 0, w, d, h }: Box) {
  const t = z + h;
  return `M${P(x, y, t)}L${P(x + w, y, t)}L${P(x + w, y + d, t)}L${P(x, y + d, t)}Z`;
}
export function boxLeft({ x, y, z = 0, w, d, h }: Box) {
  const t = z + h;
  return `M${P(x, y + d, t)}L${P(x + w, y + d, t)}L${P(x + w, y + d, z)}L${P(x, y + d, z)}Z`;
}
export function boxRight({ x, y, z = 0, w, d, h }: Box) {
  const t = z + h;
  return `M${P(x + w, y, t)}L${P(x + w, y + d, t)}L${P(x + w, y + d, z)}L${P(x + w, y, z)}Z`;
}
/** Rectangle on a horizontal plane. */
export function plane(x: number, y: number, w: number, d: number, z = 0) {
  return `M${P(x, y, z)}L${P(x + w, y, z)}L${P(x + w, y + d, z)}L${P(x, y + d, z)}Z`;
}
/** Rectangle on the vertical plane y = const (faces the viewer's left-front). */
export const faceY = (x: number, y: number, z: number, w: number, h: number) =>
  `M${P(x, y, z)}L${P(x + w, y, z)}L${P(x + w, y, z + h)}L${P(x, y, z + h)}Z`;
/** Rectangle on the vertical plane x = const (faces the viewer's right-front). */
export const faceX = (x: number, y: number, z: number, d: number, h: number) =>
  `M${P(x, y, z)}L${P(x, y + d, z)}L${P(x, y + d, z + h)}L${P(x, y, z + h)}Z`;
/** Horizontal circle (ellipse on screen) centred at world (cx, cy, z). */
export function disc(cx: number, cy: number, r: number, z = 0) {
  const [sx, sy] = iso(cx, cy, z);
  const rx = r1(r * 1.2247 * S);
  const ry = r1(r * 0.7071 * S);
  return `M${r1(sx - rx)} ${sy}A${rx} ${ry} 0 1 0 ${r1(sx + rx)} ${sy}A${rx} ${ry} 0 1 0 ${r1(sx - rx)} ${sy}Z`;
}
/** Vertical cylinder (pot, bucket): top ellipse, two sides and the visible front arc. `rb` tapers the base. */
export function cylinder(cx: number, cy: number, r: number, h: number, z = 0, rb = r) {
  const [sx, sy] = iso(cx, cy, z + h);
  const [, by] = iso(cx, cy, z);
  const rx = r1(r * 1.2247 * S);
  const ry = r1(r * 0.7071 * S);
  const bx = r1(rb * 1.2247 * S);
  const byy = r1(rb * 0.7071 * S);
  return (
    `M${r1(sx - rx)} ${sy}A${rx} ${ry} 0 1 0 ${r1(sx + rx)} ${sy}A${rx} ${ry} 0 1 0 ${r1(sx - rx)} ${sy}` +
    `M${r1(sx - rx)} ${sy}L${r1(sx - bx)} ${by}A${bx} ${byy} 0 0 0 ${r1(sx + bx)} ${by}L${r1(sx + rx)} ${sy}`
  );
}
/** Side silhouette of a cylinder as a fill (no top). */
export function cylinderBody(cx: number, cy: number, r: number, h: number, z = 0, rb = r) {
  const [sx, sy] = iso(cx, cy, z + h);
  const [, by] = iso(cx, cy, z);
  const rx = r1(r * 1.2247 * S);
  const ry = r1(r * 0.7071 * S);
  const bx = r1(rb * 1.2247 * S);
  const byy = r1(rb * 0.7071 * S);
  return `M${r1(sx - rx)} ${sy}A${rx} ${ry} 0 0 0 ${r1(sx + rx)} ${sy}L${r1(sx + bx)} ${by}A${bx} ${byy} 0 0 1 ${r1(sx - bx)} ${by}Z`;
}
/** Right half of a cylinder side (the shaded tone). */
export function cylinderHalf(cx: number, cy: number, r: number, h: number, z = 0, rb = r) {
  const [sx, sy] = iso(cx, cy, z + h);
  const [, by] = iso(cx, cy, z);
  const rx = r1(r * 1.2247 * S);
  const ry = r1(r * 0.7071 * S);
  const bx = r1(rb * 1.2247 * S);
  const byy = r1(rb * 0.7071 * S);
  return `M${sx} ${r1(sy + ry)}A${rx} ${ry} 0 0 0 ${r1(sx + rx)} ${sy}L${r1(sx + bx)} ${by}A${bx} ${byy} 0 0 1 ${sx} ${r1(by + byy)}Z`;
}
/** Vertical line from z0 to z1 at (x, y). */
export const post = (x: number, y: number, z0: number, z1: number) => `M${P(x, y, z0)}L${P(x, y, z1)}`;
/** Straight segment between two world points. */
export const seg = (a: [number, number, number?], b: [number, number, number?]) =>
  `M${P(a[0], a[1], a[2] ?? 0)}L${P(b[0], b[1], b[2] ?? 0)}`;

// ---- Animated primitives ----------------------------------------------------
type DrawProps = {
  d: string;
  w?: Weight;
  color?: string;
  delay?: number;
  dur?: number;
  opacity?: number;
  className?: string;
};
/** Stroke draw-on (pathLength). Multi-subpath `d` draws in order within one element. */
export function Draw({ d, w = "base", color = INK, delay = 0, dur = 1.1, opacity = 1, className }: DrawProps) {
  const st = useStatic();
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ strokeWidth: ink(w), opacity }}
      initial={st ? false : { pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: dur, delay, ease: EASE }}
    />
  );
}

/** Opacity fade for a group (faces, dots, accents). */
export function Fade({
  children,
  delay = 0.8,
  dur = 0.7,
  to = 1,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  dur?: number;
  to?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const st = useStatic();
  return (
    <motion.g
      className={className}
      style={style}
      initial={st ? false : { opacity: 0 }}
      animate={{ opacity: to }}
      transition={{ duration: dur, delay, ease: "easeOut" }}
    >
      {children}
    </motion.g>
  );
}

/** Dashed rail segment: the dashes march once along the line, then rest. */
export function DashMarch({ d, color = "var(--oboya-blue-light)", delay = 0, dur = 1.4, opacity = 0.7 }: { d: string; color?: string; delay?: number; dur?: number; opacity?: number }) {
  const st = useStatic();
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeDasharray="5 9"
      style={{ strokeWidth: ink("light"), opacity }}
      initial={st ? false : { strokeDashoffset: 84, opacity: 0 }}
      animate={{ strokeDashoffset: 0, opacity }}
      transition={{ duration: dur, delay, ease: EASE }}
    />
  );
}

const anim = (name: string, ms: number, playState: string): CSSProperties => ({
  animationName: name,
  animationDuration: `${ms}ms`,
  animationTimingFunction: "linear",
  animationFillMode: "both",
  animationPlayState: playState as CSSProperties["animationPlayState"],
});

/**
 * A product unit rides the rail: enters from the left, rests, exits right, over the whole phase.
 * Driven by CSS animations so it shares the clock's play state (hover pause).
 * `from` is what arrives (the previous stage's output); it swaps for `children` (this stage's
 * output) while the unit rests. Children are drawn around world x=0 on the rail (y = RAIL.y).
 */
export function Travel({ children, from, span = 420 }: { children: ReactNode; from?: ReactNode; span?: number }) {
  const st = useStatic();
  const { ms, playState, rest } = useContext(SceneClock);
  const [tx, ty] = alongX(span);
  // Static frame or autoplay stopped by the user: the unit sits at rest, already transformed.
  if (st || rest) return <g>{children}</g>;
  return (
    <g style={{ "--eco-tx": `${tx}px`, "--eco-ty": `${ty}px`, ...anim("eco-travel", ms, playState) } as CSSProperties}>
      {from ? <g style={anim("eco-swap-out", ms, playState)}>{from}</g> : null}
      <g style={from ? anim("eco-swap-in", ms, playState) : undefined}>{children}</g>
    </g>
  );
}

/**
 * Hotspot-linked part of a scene: when a proof point is hovered, the other parts recede.
 * `i` is the proof point index (0..2).
 */
export function Part({ i, active, children }: { i: number; active?: number | null; children: ReactNode }) {
  const dim = active != null && active !== i;
  return (
    <g style={{ opacity: dim ? 0.45 : 1, transition: "opacity 300ms ease" }}>{children}</g>
  );
}

/** Repeat a symbol along the world x (and optionally y) axis, far to near. */
export function Repeat({ href, n, dx = 0, dy = 0, start = 0, className }: { href: string; n: number; dx?: number; dy?: number; start?: number; className?: string }) {
  return (
    <>
      {Array.from({ length: n }, (_, k) => {
        const [ax, ay] = alongX((start + k) * dx);
        const [bx, by] = alongY(k * dy);
        return <use key={k} href={href} transform={`translate(${r1(ax + bx)} ${r1(ay + by)})`} className={className} />;
      })}
    </>
  );
}

/** Full-bleed scene SVG. */
export function Plate({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className ?? "absolute inset-0 h-full w-full"}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable="false"
    >
      {children}
    </svg>
  );
}
