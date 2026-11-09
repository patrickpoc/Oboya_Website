"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Shared kit for the semi-realistic ecosystem scenes.
 * Front view, slight depth, one soft light from the top-left. Brand tokens only:
 * every tonal step is a `color-mix` of `var(--oboya-*)`, defined here and nowhere else.
 * Variation is hand-set or derived from indices (no Math.random: hydration-safe).
 */

// ---- Geometry (canvas units) ------------------------------------------------
const W = 800;
const H = 400;
const HORIZON = 232; // base of the far backdrop rows
const FLOOR = 290; // wall meets floor / bench line
export const BASELINE = 340; // every subject stands on this line
export const CX = W / 2;

// ---- Colour -----------------------------------------------------------------
export type Swatch =
  | "orange"
  | "blue"
  | "blue-light"
  | "green"
  | "green-light"
  | "blue-dark"
  | "yellow-light"
  | "yellow-dark"
  | "soft-white";

/** `a` mixed with `b` (default dark blue = shade). `pct` is how much of `a` stays. */
export const tone = (a: Swatch, pct = 100, b: Swatch = "blue-dark") =>
  pct >= 100 ? `var(--oboya-${a})` : `color-mix(in srgb, var(--oboya-${a}) ${pct}%, var(--oboya-${b}))`;
/** `a` mixed toward soft white (highlight). */
const lit = (a: Swatch, pct = 70) => tone(a, pct, "soft-white");
/** Brown for soil: orange and dark yellow, deepened with dark blue. Needs the nested mix. */
const SOIL = `color-mix(in srgb, color-mix(in srgb, var(--oboya-orange) 50%, var(--oboya-yellow-dark)) 46%, var(--oboya-blue-dark))`;

const n1 = (v: number) => Math.round(v * 10) / 10;

// ---- Materials --------------------------------------------------------------
export type MatKey =
  | "plastic"
  | "film"
  | "terracotta"
  | "metal"
  | "soil"
  | "leaf"
  | "leafLight"
  | "leafDeep"
  | "red"
  | "yellow"
  | "petalOrange"
  | "petalYellow"
  | "petalWhite"
  | "shadow"
  | "shadeX"
  | "under";

const Ctx = createContext("m");
/** Per-frame id prefix, so two mounted scenes never share gradient ids. */
export const useSid = () => useContext(Ctx);
export function useMat() {
  const id = useContext(Ctx);
  return (k: MatKey) => `url(#${id}-${k})`;
}

function Stop({ o, c, a = 1 }: { o: number; c: string; a?: number }) {
  return <stop offset={o} style={{ stopColor: c, stopOpacity: a }} />;
}

function Materials({ id }: { id: string }) {
  const g = (k: string) => `${id}-${k}`;
  const petal = (k: string, base: Swatch, core: Swatch) => (
    <radialGradient id={g(k)} cx="0.5" cy="0.5" r="0.55">
      <Stop o={0} c={tone(core, 80)} />
      <Stop o={0.45} c={tone(base)} />
      <Stop o={1} c={lit(base, 62)} />
    </radialGradient>
  );
  return (
    <defs>
      <linearGradient id={g("plastic")} x1="0" y1="0" x2="1" y2="1">
        <Stop o={0} c={tone("soft-white")} />
        <Stop o={0.55} c={tone("soft-white", 90)} />
        <Stop o={1} c={tone("soft-white", 64)} />
      </linearGradient>
      <linearGradient id={g("film")} x1="0" y1="0" x2="1" y2="1">
        <Stop o={0} c={tone("soft-white")} a={0.5} />
        <Stop o={0.45} c={tone("soft-white")} a={0.1} />
        <Stop o={1} c={tone("blue-light", 60, "soft-white")} a={0.26} />
      </linearGradient>
      <linearGradient id={g("terracotta")} x1="0" y1="0" x2="1" y2="1">
        <Stop o={0} c={lit("orange", 78)} />
        <Stop o={0.5} c={tone("orange")} />
        <Stop o={1} c={tone("orange", 62)} />
      </linearGradient>
      <linearGradient id={g("metal")} x1="0" y1="0" x2="1" y2="0">
        <Stop o={0} c={tone("soft-white", 78)} />
        <Stop o={0.3} c={tone("soft-white")} />
        <Stop o={0.62} c={tone("soft-white", 56, "blue")} />
        <Stop o={1} c={tone("soft-white", 72, "blue")} />
      </linearGradient>
      <linearGradient id={g("soil")} x1="0" y1="0" x2="1" y2="1">
        <Stop o={0} c={SOIL} />
        <Stop o={1} c={tone("blue-dark", 55, "orange")} />
      </linearGradient>
      <linearGradient id={g("leaf")} x1="0" y1="0" x2="1" y2="1">
        <Stop o={0} c={tone("green-light")} />
        <Stop o={0.5} c={tone("green")} />
        <Stop o={1} c={tone("green", 66)} />
      </linearGradient>
      <linearGradient id={g("leafLight")} x1="0" y1="0" x2="1" y2="1">
        <Stop o={0} c={lit("green-light", 74)} />
        <Stop o={0.55} c={tone("green-light")} />
        <Stop o={1} c={tone("green", 90)} />
      </linearGradient>
      <linearGradient id={g("leafDeep")} x1="0" y1="0" x2="1" y2="1">
        <Stop o={0} c={tone("green", 90)} />
        <Stop o={1} c={tone("green", 48)} />
      </linearGradient>
      <radialGradient id={g("red")} cx="0.5" cy="0.5" r="0.75" fx="0.33" fy="0.26">
        <Stop o={0} c={lit("orange", 70)} />
        <Stop o={0.35} c={tone("orange")} />
        <Stop o={1} c={tone("orange", 58)} />
      </radialGradient>
      <radialGradient id={g("yellow")} cx="0.5" cy="0.5" r="0.75" fx="0.33" fy="0.26">
        <Stop o={0} c={lit("yellow-light", 70)} />
        <Stop o={0.4} c={tone("yellow-light")} />
        <Stop o={1} c={tone("yellow-dark", 85)} />
      </radialGradient>
      {petal("petalOrange", "orange", "yellow-dark")}
      {petal("petalYellow", "yellow-light", "yellow-dark")}
      {petal("petalWhite", "soft-white", "yellow-light")}
      <radialGradient id={g("shadow")} cx="0.5" cy="0.5" r="0.5">
        <Stop o={0} c={tone("blue-dark")} a={0.8} />
        <Stop o={1} c={tone("blue-dark")} a={0} />
      </radialGradient>
      <linearGradient id={g("shadeX")} x1="0" y1="0" x2="1" y2="0">
        <Stop o={0} c={tone("blue-dark")} a={0} />
        <Stop o={0.55} c={tone("blue-dark")} a={0.04} />
        <Stop o={1} c={tone("blue-dark")} a={0.3} />
      </linearGradient>
      <linearGradient id={g("floor")} x1="0" y1="0" x2="0" y2="1">
        <Stop o={0} c={tone("blue", 62)} />
        <Stop o={0.45} c={tone("blue", 34)} />
        <Stop o={1} c={tone("blue-dark")} />
      </linearGradient>
      <radialGradient id={g("pool")} cx="0.5" cy="0.5" r="0.5">
        <Stop o={0} c={tone("soft-white")} a={0.2} />
        <Stop o={1} c={tone("soft-white")} a={0} />
      </radialGradient>
      <radialGradient id={g("vig")} cx="0.5" cy="0.5" r="0.78">
        <Stop o={0.62} c={tone("blue-dark")} a={0} />
        <Stop o={1} c={tone("blue-dark")} a={0.5} />
      </radialGradient>
      <linearGradient id={g("shaft")} x1="0" y1="0" x2="1" y2="1">
        <Stop o={0} c={tone("soft-white")} a={0.16} />
        <Stop o={1} c={tone("soft-white")} a={0} />
      </linearGradient>
      <linearGradient id={g("under")} x1="0" y1="0" x2="0" y2="1">
        <Stop o={0} c={tone("blue-dark")} a={0.55} />
        <Stop o={1} c={tone("blue-dark")} a={0} />
      </linearGradient>
    </defs>
  );
}

// ---- Light recipes ----------------------------------------------------------
/** Soft contact shadow on the surface under an object. Light is top-left, so it leans right. */
export function Contact({ x, y, w, o = 0.55 }: { x: number; y: number; w: number; o?: number }) {
  const m = useMat();
  return (
    <g>
      <ellipse cx={x + w * 0.03} cy={y} rx={w / 2} ry={w * 0.05} fill={m("shadow")} opacity={o} />
      <ellipse cx={x + w * 0.02} cy={y - 0.5} rx={w * 0.4} ry={w * 0.02} fill={m("shadow")} opacity={Math.min(1, o + 0.3)} />
    </g>
  );
}

/** Highlight stroke on the lit (top-left) edge of a form. */
export function Gloss({ d, w = 2, o = 0.6 }: { d: string; w?: number; o?: number }) {
  return (
    <path
      d={d}
      fill="none"
      strokeWidth={w}
      strokeLinecap="round"
      strokeOpacity={o}
      style={{ stroke: tone("soft-white") }}
    />
  );
}

/** Shade overlay for the side away from the light. */
export function Shade({ d, o = 0.3 }: { d: string; o?: number }) {
  return <path d={d} fillOpacity={o} style={{ fill: tone("blue-dark") }} />;
}

// ---- Motion (transforms and opacity only, finite, `st` renders the final frame) ----
const EASE = [0.22, 1, 0.36, 1] as const;

export function Rise({
  st,
  d = 0,
  x = 0,
  y = 12,
  dur = 0.6,
  children,
}: {
  st: boolean;
  d?: number;
  x?: number;
  y?: number;
  dur?: number;
  children: ReactNode;
}) {
  return (
    <motion.g
      initial={st ? false : { opacity: 0, x, y }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: dur, delay: d, ease: EASE }}
    >
      {children}
    </motion.g>
  );
}

export function Grow({ st, d = 0, dur = 0.6, children }: { st: boolean; d?: number; dur?: number; children: ReactNode }) {
  return (
    <motion.g
      initial={st ? false : { opacity: 0, scaleY: 0.08 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: dur, delay: d, ease: EASE }}
      style={{ originX: 0.5, originY: 1 }}
    >
      {children}
    </motion.g>
  );
}

export function Pop({ st, d = 0, dur = 0.45, children }: { st: boolean; d?: number; dur?: number; children: ReactNode }) {
  return (
    <motion.g
      initial={st ? false : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: dur, delay: d, ease: EASE }}
      style={{ originX: 0.5, originY: 1 }}
    >
      {children}
    </motion.g>
  );
}

// ---- Shapes -----------------------------------------------------------------
/** Scalloped, lobed outline. Deterministic: the lobe size follows the index. */
export function ruffle(cx: number, cy: number, rx: number, ry: number, n: number, bulge: number, phase = 0) {
  const pt = (a: number, k = 1): [number, number] => [n1(cx + rx * k * Math.cos(a)), n1(cy + ry * k * Math.sin(a))];
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = phase + (i / n) * Math.PI * 2;
    const b = phase + ((i + 1) / n) * Math.PI * 2;
    const k = 1 + bulge * (1 + 0.4 * Math.sin(i * 2.3 + phase));
    const p = pt(a);
    const c = pt((a + b) / 2, k);
    const q = pt(b);
    if (i === 0) d += `M${p[0]} ${p[1]}`;
    d += ` Q${c[0]} ${c[1]} ${q[0]} ${q[1]}`;
  }
  return `${d}Z`;
}

const zig = (x0: number, x1: number, y: number, n: number, depth: number) => {
  const w = (x1 - x0) / n;
  let s = "";
  for (let i = 0; i < n; i++) s += ` L${n1(x0 + w * (i + 0.5))} ${y + depth} L${n1(x0 + w * (i + 1))} ${y}`;
  return s;
};

// ---- Botanicals -------------------------------------------------------------
export type LeafKey = "leaf" | "leafLight" | "leafDeep";

/** Pointed leaf with a curved midrib, side veins, and a shaded half away from the light. */
export function Leaf({
  x = 0,
  y = 0,
  a = -45,
  len = 30,
  w = 0.3,
  bend = 0.1,
  k = "leaf",
  veins = 3,
}: {
  x?: number;
  y?: number;
  a?: number;
  len?: number;
  w?: number;
  bend?: number;
  k?: LeafKey;
  veins?: number;
}) {
  const m = useMat();
  const hw = len * w;
  const ty = len * bend;
  const rad = (a * Math.PI) / 180;
  const s = Math.sin(rad) - Math.cos(rad) > 0 ? -1 : 1; // side facing away from the top-left light
  const side = (q: number) =>
    `C${n1(len * 0.65)} ${n1(q * hw * 0.92 + ty * 0.5)} ${n1(len * 0.22)} ${n1(q * hw)} 0 0`;
  const outline = `M0 0 C${n1(len * 0.22)} ${n1(-hw)} ${n1(len * 0.65)} ${n1(-hw * 0.92 + ty * 0.5)} ${n1(len)} ${n1(ty)} ${side(1)}Z`;
  const half = `M0 0 Q${n1(len * 0.5)} ${n1(ty * 0.3)} ${n1(len)} ${n1(ty)} ${side(s)}Z`;
  let vd = `M0 0 Q${n1(len * 0.5)} ${n1(ty * 0.3)} ${n1(len)} ${n1(ty)}`;
  for (let i = 0; i < veins; i++) {
    const t = 0.2 + i * (0.55 / veins);
    const px = len * t;
    const py = ty * (0.6 * t + 0.4 * t * t);
    for (const q of [-1, 1])
      vd += `M${n1(px)} ${n1(py)}L${n1(len * (t + 0.17))} ${n1(py + q * hw * 0.62 * (1 - t * 0.5))}`;
  }
  return (
    <g transform={`translate(${n1(x)} ${n1(y)}) rotate(${a})`}>
      <path d={outline} fill={m(k)} />
      <Shade d={half} o={0.26} />
      <path
        d={vd}
        fill="none"
        strokeWidth={1.1}
        strokeLinecap="round"
        strokeOpacity={0.6}
        style={{ stroke: lit("green-light", 52) }}
      />
    </g>
  );
}


/** Light leaf for tiny plants: one path, no veins (they would vanish at this size). */
function LeafLite({ x = 0, y = 0, a = -45, len = 12, w = 0.4, k = "leaf" }: { x?: number; y?: number; a?: number; len?: number; w?: number; k?: LeafKey }) {
  const m = useMat();
  const hw = n1(len * w);
  return (
    <path
      transform={`translate(${n1(x)} ${n1(y)}) rotate(${a})`}
      d={`M0 0C${n1(len * 0.2)} ${-hw} ${n1(len * 0.7)} ${-hw} ${len} 0C${n1(len * 0.7)} ${hw} ${n1(len * 0.2)} ${hw} 0 0Z`}
      fill={m(k)}
    />
  );
}

/** True seedling on its own origin: stem, cotyledon pair, and (kind 1) first leaves. */
export function Sprout({ h, lean = 0, kind = 0 }: { h: number; lean?: number; kind?: 0 | 1 }) {
  return (
    <g>
      <path d={`M0 0Q${n1(lean * 0.2)} ${n1(-h * 0.5)} ${lean} ${-h}`} fill="none" strokeWidth={2.2} strokeLinecap="round" style={{ stroke: tone("green-light", 82) }} />
      {kind ? <LeafLite x={lean} y={-h} a={-114} len={12} w={0.3} k="leaf" /> : null}
      {kind ? <LeafLite x={lean} y={-h} a={-66} len={12} w={0.3} k="leafLight" /> : null}
      <LeafLite x={lean} y={-h * 0.92} a={-168} len={11} w={0.44} k="leafLight" />
      <LeafLite x={lean} y={-h * 0.92} a={-12} len={11} w={0.44} k="leaf" />
    </g>
  );
}

/** Frilly loose-leaf lettuce leaf: scalloped edge, midrib and veins. Points along +x, rotated by `a`. */
export function Frill({ len, w, a, k = "leaf" }: { len: number; w: number; a: number; k?: LeafKey }) {
  const m = useMat();
  let v = `M0 0H${n1(len * 0.92)}`;
  for (const t of [0.3, 0.5, 0.7]) for (const q of [-1, 1]) v += `M${n1(len * t)} 0L${n1(len * (t + 0.16))} ${n1(q * w * 0.7)}`;
  return (
    <g transform={`rotate(${a})`}>
      <path d={ruffle(len / 2, 0, len / 2, w, 9, 0.24, 0.3)} fill={m(k)} />
      <path d={v} fill="none" strokeWidth={1} strokeLinecap="round" strokeOpacity={0.5} style={{ stroke: lit("green-light", 45) }} />
    </g>
  );
}

const FAN: Array<Array<[number, number, number, LeafKey]>> = [
  [[-146, 34, 7, "leafDeep"], [-34, 34, 7, "leafDeep"], [-128, 42, 8, "leaf"], [-52, 42, 8, "leaf"], [-112, 50, 8, "leafLight"], [-68, 50, 8, "leaf"], [-98, 56, 8, "leafLight"], [-82, 54, 7, "leaf"], [-90, 61, 6, "leafLight"]],
  [[-142, 36, 7, "leaf"], [-38, 36, 7, "leafDeep"], [-124, 44, 8, "leafLight"], [-56, 44, 8, "leaf"], [-108, 52, 8, "leaf"], [-72, 52, 8, "leafLight"], [-96, 58, 7, "leaf"], [-84, 57, 7, "leafLight"], [-90, 62, 6, "leaf"]],
];

/** Loose-leaf lettuce: leaves fanning up from a base point at the origin. `s` scales it. */
function LooseLettuce({ v = 0, s = 1 }: { v?: 0 | 1; s?: number }) {
  return (
    <g transform={`scale(${s})`}>
      {FAN[v].map(([a, len, w, k], i) => (
        <Frill key={i} a={a} len={len} w={w} k={k} />
      ))}
    </g>
  );
}

/** Wheel with tyre, metal rim and hub. */
export function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const m = useMat();
  const c = (rr: number) => `M${cx - rr} ${cy}a${rr} ${rr} 0 1 0 ${rr * 2} 0a${rr} ${rr} 0 1 0 ${-rr * 2} 0Z`;
  return (
    <g>
      <path d={c(r)} style={{ fill: tone("blue-dark", 80) }} />
      <path d={c(r * 0.62)} fill={m("metal")} />
      <path d={c(r * 0.2)} style={{ fill: tone("blue-dark") }} />
      <Gloss d={`M${cx - r * 0.8} ${cy - r * 0.35}A${r * 0.86} ${r * 0.86} 0 0 1 ${cx - r * 0.2} ${cy - r * 0.84}`} w={1.6} o={0.35} />
    </g>
  );
}

const SEEDS = "M-3 -1h.01M2.5 -2.5h.01M-0.5 2h.01M4 3.5h.01M-5 4h.01M1.5 6.5h.01M-2.5 8h.01";
const CALYX = "M0 -6 L-6 -9.5 L-3.5 -5.5 L-8.5 -3.5 L-2 -3.5 L0 -0.5 L2 -3.5 L8.5 -3.5 L3.5 -5.5 L6 -9.5Z";

export function Strawberry({ rot = 0, s = 1 }: { rot?: number; s?: number }) {
  const m = useMat();
  return (
    <g transform={`rotate(${rot}) scale(${s})`}>
      <path d="M0 -7 C6.5 -8 10 -3 8 3 C6 8.5 2 11.5 0 11.5 C-2 11.5 -6 8.5 -8 3 C-10 -3 -6.5 -8 0 -7Z" fill={m("red")} />
      <path d={SEEDS} fill="none" strokeWidth={1.3} strokeLinecap="round" strokeOpacity={0.85} style={{ stroke: tone("yellow-light", 80, "soft-white") }} />
      <path d={CALYX} style={{ fill: tone("green", 90) }} />
    </g>
  );
}

export function Tomato({ rot = 0, s = 1, k = "red" }: { rot?: number; s?: number; k?: "red" | "yellow" }) {
  const m = useMat();
  return (
    <g transform={`rotate(${rot}) scale(${s})`}>
      <path d="M0 -7.5 C6 -9 11 -5 11 1 C11 7 6 10 0 10 C-6 10 -11 7 -11 1 C-11 -5 -6 -9 0 -7.5Z" fill={m(k)} />
      <path d="M0 -7 L-5 -9.5 L-2.4 -6.2 L-7 -4.6 L-1.8 -4.4 L0 -2 L1.8 -4.4 L7 -4.6 L2.4 -6.2 L5 -9.5Z" style={{ fill: tone("green", 92) }} />
      <Gloss d="M-7 -1 Q-6.5 -5 -3 -6.5" w={1.6} o={0.55} />
    </g>
  );
}

const rotPt = (x: number, y: number, a: number): [number, number] => [
  n1(x * Math.cos(a) - y * Math.sin(a)),
  n1(x * Math.sin(a) + y * Math.cos(a)),
];
function petals(r: number, n: number, rot: number) {
  const P: Array<[number, number]> = [[0, 0], [-0.55, -0.25], [-0.5, -0.95], [0, -1], [0.5, -0.95], [0.55, -0.25]];
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = rot + (i * Math.PI * 2) / n;
    const p = P.map(([x, y]) => rotPt(x * r, y * r, a));
    d += `M0 0 C${p[1]} ${p[2]} ${p[3]} C${p[4]} ${p[5]} 0 0Z`.replace(/,/g, " ");
  }
  return d;
}

/** Flower head on its own origin (centre). */
export function Flower({ r = 10, n = 5, k = "Orange", rot = 0 }: { r?: number; n?: number; k?: "Orange" | "Yellow" | "White"; rot?: number }) {
  const m = useMat();
  return (
    <g>
      <path
        d={petals(r, n, rot)}
        fill={m(`petal${k}` as MatKey)}
        strokeWidth={0.7}
        strokeOpacity={0.35}
        style={{ stroke: tone(k === "White" ? "blue-light" : "orange", 70) }}
      />
      <path d={ruffle(0, 0, r * 0.26, r * 0.26, 7, 0.3, rot)} style={{ fill: tone("yellow-dark", 92) }} />
    </g>
  );
}

// ---- Packaging models (origin = bottom centre; fit about 70 wide, 74 high) ----------
const BERRIES: Array<Array<[number, number, number]>> = [
  [[-21, -27, -20], [-7, -30, 10], [8, -29, -8], [21, -26, 18], [-26, -18, 12], [-13, -20, -14], [0, -21, 6], [13, -20, -4], [26, -17, 16], [-18, -10, 8], [-3, -11, -12], [12, -10, 14]],
  [[-22, -26, 14], [-8, -30, -12], [6, -30, 16], [20, -27, -10], [-27, -17, -10], [-14, -21, 18], [-1, -22, -6], [12, -21, 12], [25, -18, -14], [-19, -11, -14], [-4, -10, 10], [11, -11, -8]],
];

/** Clamshell. `kind` "berries" is the default; "tomatoes" is a second item for variety. */
export function Clamshell({ v = 0, kind = "berries" }: { v?: 0 | 1; kind?: "berries" | "tomatoes" }) {
  const m = useMat();
  return (
    <g>
      <path d="M-31 -17 L31 -17 L27 -2 L-27 -2Z" fillOpacity={0.3} style={{ fill: tone("blue-dark") }} />
      {BERRIES[v].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {kind === "berries" ? (
            <Strawberry rot={r} s={0.92 + (i % 3) * 0.06} />
          ) : (
            <Tomato rot={r} s={0.74 + (i % 3) * 0.05} k={i % 5 === 3 ? "yellow" : "red"} />
          )}
        </g>
      ))}
      <path d="M-33 -17 H33 L28 -0.5 Q27 1 25 1 H-25 Q-27 1 -28 -0.5Z" fill={m("film")} strokeWidth={1} strokeOpacity={0.5} style={{ stroke: tone("soft-white") }} />
      <Gloss d="M-14 -15 L-12 -2 M0 -15 V-2 M14 -15 L12 -2" w={1.2} o={0.28} />
      <path d="M-35 -20 H35 L34 -15 H-34Z" fill={m("plastic")} />
      <path d="M-33 -20 C-35 -38 -20 -47 0 -47 C20 -47 35 -38 33 -20Z" fill={m("film")} strokeWidth={1} strokeOpacity={0.45} style={{ stroke: tone("soft-white") }} />
      <Gloss d="M-27 -33 Q-20 -43 -6 -44" w={2.4} o={0.7} />
      <Gloss d="M26 -30 Q28 -26 28 -23" w={1.6} o={0.35} />
    </g>
  );
}

const BAG_TOP = `M-27 -66${zig(-27, 27, -66, 9, -4)}`;
const BAG = `${BAG_TOP} C31 -44 30 -20 27 -3${zig(27, -27, -3, 9, 3)} C-30 -20 -31 -44 -27 -66Z`;

export function LettuceBag({ v = 0 }: { v?: 0 | 1 }) {
  const m = useMat();
  return (
    <g>
      <g transform="translate(0 -6)">
        <LooseLettuce v={v} />
      </g>
      <path d={BAG} fill={m("film")} strokeWidth={1} strokeOpacity={0.5} style={{ stroke: tone("soft-white") }} />
      <path d="M-27 -66 H27 L27.6 -60 H-27.6Z" fill={m("plastic")} fillOpacity={0.92} />
      <path d="M-28 -7 H28 L27 -3 H-27Z" fill={m("plastic")} fillOpacity={0.7} />
      <Gloss d="M-21 -54 Q-25 -34 -22 -14" w={2.4} o={0.55} />
      <Gloss d="M25 -48 Q27 -34 25 -18" w={1.6} o={0.25} />
    </g>
  );
}

const SLEEVE = "M-10 0 Q0 2 10 0 L23 -40 Q0 -44 -23 -40Z";
const FLOWERS: Array<[number, number, number, number, "Orange" | "Yellow" | "White", number]> = [
  [-13, -52, 8, 5, "Orange", 0.2],
  [-3, -60, 8.5, 6, "White", 0.5],
  [8, -57, 8, 5, "Yellow", 0.1],
  [16, -48, 7.5, 5, "Orange", 0.7],
  [1, -47, 7, 6, "Yellow", 0.3],
];

export function FlowerSleeve({ v = 0 }: { v?: 0 | 1 }) {
  const m = useMat();
  const list = v ? [...FLOWERS].reverse() : FLOWERS;
  let stems = "";
  for (const [x, y] of FLOWERS) stems += `M${n1(x * 0.18)} -8Q${n1(x * 0.5)} -26 ${x} ${y}`;
  return (
    <g>
      <path d={stems} fill="none" strokeWidth={2} strokeLinecap="round" style={{ stroke: tone("green", 86) }} />
      {list.map(([x, y, r, n, k, rot], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <Flower r={r} n={n} k={k} rot={rot} />
        </g>
      ))}
      <path d={SLEEVE} fill={m("film")} strokeWidth={1} strokeOpacity={0.5} style={{ stroke: tone("soft-white") }} />
      <path d="M-10 0 Q0 2 10 0 L16.5 -20 Q0 -23 -16.5 -20Z" fill={m("plastic")} fillOpacity={0.94} />
      <Shade d="M4 0.8 Q7 0.5 10 0 L16.5 -20 Q10 -21.5 7 -21.8Z" o={0.22} />
      <Gloss d="M-18 -35 L-9 -8" w={2.2} o={0.6} />
    </g>
  );
}

// ---- Frame ------------------------------------------------------------------
const BUSHES: Array<[number, number, number]> = [[50, 56, 34], [180, 70, 40], [318, 58, 30], [468, 72, 38], [610, 60, 34], [748, 64, 40]];
const BOKEH: Array<[number, number, number]> = [[120, 58, 34], [262, 36, 22], [520, 28, 28], [690, 72, 30], [420, 88, 18]];
const DABS: Array<[number, number, number, LeafKey | "red" | "yellow"]> = [
  [96, 118, 14, "red"], [164, 120, 12, "leafLight"], [250, 118, 14, "yellow"], [330, 122, 12, "leaf"],
  [118, 178, 14, "leaf"], [206, 176, 13, "red"], [292, 180, 14, "leafLight"], [372, 176, 12, "yellow"],
  [560, 120, 14, "leafLight"], [640, 118, 13, "red"], [716, 122, 12, "leaf"],
  [590, 180, 14, "yellow"], [668, 176, 13, "leafLight"], [736, 180, 12, "red"],
];

function Backdrop({ id, kind, back }: { id: string; kind: "greenhouse" | "store"; back?: ReactNode }) {
  const bid = `${id}b`;
  return (
    <Ctx.Provider value={bid}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
        focusable="false"
      >
        <Materials id={bid} />
        <defs>
          <linearGradient id={`${bid}-bg`} x1="0" y1="0" x2="0" y2="1">
            <Stop o={0} c={kind === "store" ? tone("blue", 82, "blue-light") : tone("blue-light", 58, "blue")} />
            <Stop o={0.6} c={tone("blue", 92)} />
            <Stop o={1} c={tone("blue-dark")} />
          </linearGradient>
          <radialGradient id={`${bid}-glow`} cx="0.22" cy="0.08" r="0.62">
            <Stop o={0} c={tone("blue-light")} a={0.55} />
            <Stop o={1} c={tone("blue-light")} a={0} />
          </radialGradient>
          <filter id={`${bid}-b1`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id={`${bid}-b2`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="2.6" />
          </filter>
        </defs>
        <rect width={W} height={H} fill={`url(#${bid}-bg)`} />
        <rect width={W} height={H} fill={`url(#${bid}-glow)`} />
        <g filter={`url(#${bid}-b1)`}>
          {kind === "greenhouse" ? (
            <>
              <path d="M-60 270 Q400 -100 860 270 M-60 310 Q400 -30 860 310" fill="none" strokeWidth={9} strokeOpacity={0.2} style={{ stroke: tone("soft-white") }} />
              <path d="M120 70V292M280 30V292M520 30V292M680 70V292" fill="none" strokeWidth={10} strokeOpacity={0.1} style={{ stroke: tone("soft-white") }} />
              {BOKEH.map(([x, y, r]) => (
                <path key={x} d={ruffle(x, y, r, r, 9, 0.1, x)} fillOpacity={0.13} style={{ fill: tone("soft-white") }} />
              ))}
              {BUSHES.map(([x, rx, ry], i) => (
                <path key={x} d={ruffle(x, HORIZON + 34 - ry * 0.4, rx, ry, 8, 0.22, i)} fillOpacity={0.62} fill={`url(#${bid}-${i % 2 ? "leaf" : "leafDeep"})`} />
              ))}
              {BUSHES.map(([x, rx], i) => (
                <path key={x} d={ruffle(x + 62, HORIZON + 46, rx * 0.7, 26, 7, 0.2, i + 2)} fillOpacity={0.5} fill={`url(#${bid}-leafLight)`} />
              ))}
              <path d="M40 0H250L560 292H300Z" fill={`url(#${bid}-shaft)`} />
            </>
          ) : (
            <>
              <path d="M110 14H300Q310 14 310 22Q310 30 300 30H110Q100 30 100 22Q100 14 110 14ZM330 14H530Q540 14 540 22Q540 30 530 30H330Q320 30 320 22Q320 14 330 14ZM560 14H730Q740 14 740 22Q740 30 730 30H560Q550 30 550 22Q550 14 560 14Z" fillOpacity={0.6} style={{ fill: tone("soft-white") }} />
              <path d="M0 106H800M0 166H800M0 226H800" fill="none" strokeWidth={8} strokeOpacity={0.16} style={{ stroke: tone("soft-white") }} />
              {DABS.map(([x, y, r, k], i) => (
                <path key={`${x}-${y}`} d={ruffle(x, y, r + 8, r, 7, 0.22, i)} fillOpacity={0.55} fill={`url(#${bid}-${k})`} />
              ))}
              <path d="M30 0V292M770 0V292" fill="none" strokeWidth={14} strokeOpacity={0.08} style={{ stroke: tone("soft-white") }} />
              <path d="M40 0H260L520 292H260Z" fill={`url(#${bid}-shaft)`} />
            </>
          )}
        </g>
        {back ? <g filter={`url(#${bid}-b2)`} opacity={0.82}>{back}</g> : null}
      </svg>
    </Ctx.Provider>
  );
}

/**
 * Shared set for every scene: layered blurred backdrop (its own svg, so animation in the
 * foreground svg never re-rasterises the blur), floor and horizon line, light pool, vignette.
 */
export function SceneFrame({
  kind = "greenhouse",
  back,
  children,
}: {
  kind?: "greenhouse" | "store";
  /** Extra softly blurred shapes placed behind the subject (for example a machine). */
  back?: ReactNode;
  children: ReactNode;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <Ctx.Provider value={id}>
      <Backdrop id={id} kind={kind} back={back} />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
        focusable="false"
      >
        <Materials id={id} />
        <rect y={FLOOR} width={W} height={H - FLOOR} fill={`url(#${id}-floor)`} />
        <ellipse cx={CX - 40} cy={BASELINE + 8} rx={400} ry={62} fill={`url(#${id}-pool)`} />
        <path d={`M0 ${FLOOR + 0.8}H${W}`} strokeWidth={1.6} strokeOpacity={0.3} style={{ stroke: tone("soft-white") }} />
        {children}
        <rect width={W} height={H} fill={`url(#${id}-vig)`} pointerEvents="none" />
      </svg>
    </Ctx.Provider>
  );
}
