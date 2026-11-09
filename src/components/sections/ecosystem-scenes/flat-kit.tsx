"use client";

import { useContext, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  EASE,
  S,
  StaticCtx,
  boxInner,
  boxLeft,
  boxOutline,
  boxRight,
  boxTop,
  cylinder,
  cylinderBody,
  disc,
  ink,
  iso,
  plane,
  type Box,
} from "./iso-kit";

/**
 * Detailed flat-isometric kit: filled objects with three-tone face shading (top light, left mid,
 * right dark), a thin darker outline and flat contact shadows. All colours are brand tokens or
 * color-mix() blends of them (terracotta, soil, steel, glass...). No filters, no <text>.
 */

// ---- Materials ---------------------------------------------------------------
const SW = "var(--oboya-soft-white)";
const BD = "var(--oboya-blue-dark)";
export const mix = (a: string, p: number, b: string = BD) => `color-mix(in srgb, ${a} ${p}%, ${b})`;
const warm = mix("var(--oboya-orange)", 62, "var(--oboya-yellow-dark)");
export const M = {
  terra: mix(warm, 90),
  soil: mix(mix("var(--oboya-orange)", 40, "var(--oboya-yellow-dark)"), 48),
  black: mix(BD, 80, SW),
  steel: mix(BD, 28, SW),
  steelDark: mix(BD, 52, SW),
  white: SW,
  glass: mix("var(--oboya-blue-light)", 26, SW),
  card: mix(warm, 36, SW),
  leaf: "var(--oboya-green)",
  leafLight: "var(--oboya-green-light)",
  leafDark: mix("var(--oboya-green)", 72),
  lettuce: mix("var(--oboya-green-light)", 68, "var(--oboya-yellow-light)"),
  fruit: "var(--oboya-orange)",
  yellow: "var(--oboya-yellow-light)",
  pink: mix("var(--oboya-orange)", 50, SW),
  blue: "var(--oboya-blue)",
  blueLight: "var(--oboya-blue-light)",
  water: "var(--oboya-blue-light)",
  shadow: BD,
} as const;

export type Tones = { top: string; left: string; right: string; line: string };
/** Three face tones and an outline from one base colour. */
export const tone = (c: string, lineP = 55): Tones => ({ top: mix(c, 78, SW), left: c, right: mix(c, 74), line: mix(c, lineP) });

const useStatic = () => useContext(StaticCtx);
const LINE = { strokeWidth: ink("light") } as const;

// ---- Motion ------------------------------------------------------------------
/** Objects appear by fading in while settling down onto the ground. */
export function Rise({ children, delay = 0, dur = 0.6, lift = 10 }: { children: ReactNode; delay?: number; dur?: number; lift?: number }) {
  const st = useStatic();
  return (
    <motion.g
      initial={st ? false : { opacity: 0, y: -lift }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur, delay, ease: EASE }}
    >
      {children}
    </motion.g>
  );
}

// ---- Primitives --------------------------------------------------------------
/** Flat contact shadow under an object footprint (ellipse, low opacity). */
export function Shadow({ cx, cy, r, z = 0, opacity = 0.13 }: { cx: number; cy: number; r: number; z?: number; opacity?: number }) {
  return <path d={disc(cx, cy, r, z)} fill={M.shadow} opacity={opacity} />;
}

/** Filled box with three-tone shading and outline. */
export function Solid({ box, color, tones, delay = 0, line = true, shadow = 0 }: { box: Box; color?: string; tones?: Tones; delay?: number; line?: boolean; shadow?: number }) {
  const t = tones ?? tone(color ?? M.steel);
  return (
    <Rise delay={delay}>
      {shadow ? <path d={plane(box.x + 3, box.y + 3, box.w + 2, box.d + 2, box.z ?? 0)} fill={M.shadow} opacity={shadow} /> : null}
      <path d={boxTop(box)} fill={t.top} />
      <path d={boxLeft(box)} fill={t.left} />
      <path d={boxRight(box)} fill={t.right} />
      {line ? <path d={boxOutline(box) + boxInner(box)} fill="none" stroke={t.line} strokeLinejoin="round" style={LINE} /> : null}
    </Rise>
  );
}

/** Right half of a cylinder side (for the dark tone). */
function cylinderHalf(cx: number, cy: number, r: number, h: number, z = 0, rb = r) {
  const [sx, sy] = iso(cx, cy, z + h);
  const [, by] = iso(cx, cy, z);
  const rx = r * 1.2247 * S;
  const ry = r * 0.7071 * S;
  const bx = rb * 1.2247 * S;
  const byy = rb * 0.7071 * S;
  return `M${sx} ${sy + ry}A${rx} ${ry} 0 0 0 ${sx + rx} ${sy}L${sx + bx} ${by}A${bx} ${byy} 0 0 1 ${sx} ${by + byy}Z`;
}

/** Pot, bucket or drum: shaded tapered cylinder with a rim; optional inner fill (soil, water). */
export function Cyl({ cx, cy, z = 0, r, h, rb = r, color, inner, innerDepth = 1.5, delay = 0, shadow = true }: { cx: number; cy: number; z?: number; r: number; h: number; rb?: number; color: string; inner?: string; innerDepth?: number; delay?: number; shadow?: boolean }) {
  const t = tone(color);
  return (
    <Rise delay={delay}>
      {shadow ? <Shadow cx={cx + 1} cy={cy + 1} r={rb * 1.15} z={z} /> : null}
      <path d={cylinderBody(cx, cy, r, h, z, rb)} fill={t.left} />
      <path d={cylinderHalf(cx, cy, r, h, z, rb)} fill={t.right} />
      <path d={disc(cx, cy, r, z + h)} fill={t.top} />
      {inner ? <path d={disc(cx, cy, r * 0.8, z + h - innerDepth)} fill={inner} /> : null}
      <path d={cylinder(cx, cy, r, h, z, rb)} fill="none" stroke={t.line} style={LINE} />
    </Rise>
  );
}

// ---- Plants ------------------------------------------------------------------
/** Leaf: pointed oval from a base point toward a direction, lifting as it goes. */
export function leaf(b: [number, number, number], dir: [number, number], len: number, lift: number, width = len * 0.34) {
  const [bx, by, bz] = b;
  const [dx, dy] = dir;
  const n = Math.hypot(dx, dy) || 1;
  const ux = dx / n;
  const uy = dy / n;
  const tip = iso(bx + ux * len, by + uy * len, bz + lift);
  const m1 = iso(bx + ux * len * 0.5 - uy * width, by + uy * len * 0.5 + ux * width, bz + lift * 0.65);
  const m2 = iso(bx + ux * len * 0.5 + uy * width, by + uy * len * 0.5 - ux * width, bz + lift * 0.65);
  const base = iso(bx, by, bz);
  return `M${base.join(" ")}Q${m1.join(" ")} ${tip.join(" ")}Q${m2.join(" ")} ${base.join(" ")}Z`;
}

/** Screen-space circle at a world point (fruit, bloom). */
export function Dot({ at, r, fill, stroke }: { at: [number, number, number]; r: number; fill: string; stroke?: string }) {
  const [cx, cy] = iso(at[0], at[1], at[2]);
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} style={stroke ? LINE : undefined} />;
}

const DIRS8: [number, number][] = [
  [1, 0],
  [0.7, 0.7],
  [0, 1],
  [-0.7, 0.7],
  [-1, 0],
  [-0.7, -0.7],
  [0, -1],
  [0.7, -0.7],
];

/** Lettuce head: two rings of leaves and a pale heart. */
export function Lettuce({ x, y, z, r = 9 }: { x: number; y: number; z: number; r?: number }) {
  return (
    <>
      {DIRS8.map((d, k) => (
        <path key={`o${k}`} d={leaf([x, y, z], d, r, r * 0.5, r * 0.4)} fill={k % 2 ? M.leaf : M.leafDark} />
      ))}
      {DIRS8.map((d, k) => (
        <path key={`i${k}`} d={leaf([x, y, z + 1], [d[0] * 0.9 + d[1] * 0.4, d[1] * 0.9 - d[0] * 0.4], r * 0.62, r * 0.75, r * 0.3)} fill={k % 2 ? M.lettuce : M.leafLight} />
      ))}
      <path d={disc(x, y, r * 0.28, z + r * 0.6)} fill={M.lettuce} />
    </>
  );
}

/** Tomato plant: stem, alternating leaves, fruit trusses. `h` is the stem height. */
export function Tomato({ x, y, z, h = 34, fruit = 3 }: { x: number; y: number; z: number; h?: number; fruit?: number }) {
  const n = Math.max(2, Math.round(h / 9));
  const leaves = Array.from({ length: n }, (_, i) => {
    const zz = z + 6 + (i * (h - 8)) / n;
    const d = DIRS8[(i * 3) % 8];
    return leaf([x, y, zz], d, 10.5 + (n - i) * 0.9, 2.5, 3.9);
  });
  return (
    <>
      <path d={`M${iso(x, y, z).join(" ")}L${iso(x, y, z + h).join(" ")}`} fill="none" stroke={M.leafDark} style={{ strokeWidth: ink("base") }} strokeLinecap="round" />
      {leaves.map((d, k) => (
        <path key={k} d={d} fill={k % 2 ? M.leaf : M.leafLight} />
      ))}
      {Array.from({ length: fruit }, (_, i) => (
        <Dot key={i} at={[x + (i % 2 ? 4 : -3), y + (i % 2 ? -2 : 3), z + h * 0.45 + i * 5]} r={2.8} fill={M.fruit} />
      ))}
    </>
  );
}

/** Low strawberry plant with berries. */
export function Strawberry({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <>
      {[0, 2, 4, 6].map((i) => (
        <path key={i} d={leaf([x, y, z], DIRS8[i], 9, 3.5, 3.8)} fill={i % 4 ? M.leaf : M.leafDark} />
      ))}
      {[1, 3, 5, 7].map((i) => (
        <path key={i} d={leaf([x, y, z + 1], DIRS8[i], 7, 5, 3)} fill={M.leafLight} />
      ))}
      <Dot at={[x + 5, y + 4, z + 1.5]} r={2.8} fill={M.fruit} />
      <Dot at={[x - 4, y + 5, z + 1]} r={2.4} fill={M.fruit} />
      <Dot at={[x + 2, y - 6, z + 1]} r={2.2} fill={M.fruit} />
    </>
  );
}

/** Flowering potted plant: leaves and three blooms. */
export function Flowering({ x, y, z, color = M.pink, h = 14 }: { x: number; y: number; z: number; color?: string; h?: number }) {
  const blooms: [number, number, number][] = [
    [x - 3, y + 2, z + h],
    [x + 3.5, y - 1, z + h + 3],
    [x + 0.5, y + 4, z + h + 1],
  ];
  return (
    <>
      {[1, 3, 5, 7].map((i) => (
        <path key={i} d={leaf([x, y, z], DIRS8[i], 8, 4, 3.4)} fill={i % 4 === 1 ? M.leaf : M.leafDark} />
      ))}
      {blooms.map((b, k) => (
        <path key={k} d={`M${iso(x, y, z).join(" ")}L${iso(b[0], b[1], b[2]).join(" ")}`} fill="none" stroke={M.leafDark} style={LINE} />
      ))}
      {blooms.map((b, k) => (
        <Bloom key={k} at={b} r={3.4} color={color} />
      ))}
    </>
  );
}

/** Bloom: coloured head with a small yellow centre. */
export function Bloom({ at, r, color }: { at: [number, number, number]; r: number; color: string }) {
  const [cx, cy] = iso(at[0], at[1], at[2]);
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx} cy={cy} r={r * 0.36} fill={color === M.yellow ? M.fruit : M.yellow} />
    </>
  );
}

/** Seedling: two tiny leaves on a short stem. */
export function Seedling({ x, y, z, s = 1 }: { x: number; y: number; z: number; s?: number }) {
  return (
    <>
      <path d={`M${iso(x, y, z).join(" ")}L${iso(x, y, z + 3 * s).join(" ")}`} fill="none" stroke={M.leafDark} style={LINE} />
      <path d={leaf([x, y, z + 2.5 * s], [1, -0.3], 3.6 * s, 1.2 * s, 1.4 * s)} fill={M.leafLight} />
      <path d={leaf([x, y, z + 2.5 * s], [-1, 0.3], 3.6 * s, 1.2 * s, 1.4 * s)} fill={M.leaf} />
    </>
  );
}

/** Cut flower stems rising from (x, y, z): straight stems, a leaf each, blooms in `colors`. */
export function Stems({ x, y, z, h = 16, colors = [M.yellow, M.pink, M.fruit] }: { x: number; y: number; z: number; h?: number; colors?: string[] }) {
  const tops: [number, number, number][] = colors.map((_, i) => [x + (i - (colors.length - 1) / 2) * 3.2, y - (i % 2) * 2.5, z + h + (i % 2) * 3]);
  return (
    <>
      {tops.map((t, k) => (
        <path key={k} d={`M${iso(x, y, z).join(" ")}L${iso(t[0], t[1], t[2] - 2).join(" ")}`} fill="none" stroke={M.leaf} style={LINE} strokeLinecap="round" />
      ))}
      <path d={leaf([x, y, z + h * 0.45], [1, 0.4], 5, 2, 1.8)} fill={M.leaf} />
      {tops.map((t, k) => (
        <Bloom key={k} at={t} r={2.8} color={colors[k]} />
      ))}
    </>
  );
}
