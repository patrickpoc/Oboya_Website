"use client";

import { useContext, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  EASE,
  StaticCtx,
  boxInner,
  boxLeft,
  boxOutline,
  boxRight,
  boxTop,
  cylinder,
  cylinderBody,
  cylinderHalf,
  disc,
  ink,
  iso,
  plane,
  type Box,
} from "./iso-kit";

/**
 * Detailed flat-isometric kit for the dark navy panel: filled objects with three-tone face shading
 * (top light, left mid, right dark), a thin outline and flat contact shadows. All colours are brand
 * tokens or color-mix() blends of them (terracotta, soil, steel, glass...). No filters, no <text>.
 */

// ---- Materials ---------------------------------------------------------------
const SW = "var(--oboya-soft-white)";
const BD = "var(--oboya-blue-dark)";
export const mix = (a: string, p: number, b: string = BD) => `color-mix(in srgb, ${a} ${p}%, ${b})`;
const warm = mix("var(--oboya-orange)", 60, "var(--oboya-yellow-dark)");
export const M = {
  terra: mix(warm, 86),
  soil: mix(mix("var(--oboya-orange)", 38, "var(--oboya-yellow-dark)"), 42),
  /** Black PP (pots, buckets, trays). */
  black: mix(BD, 84, SW),
  /** Galvanised steel. */
  steel: mix(BD, 34, SW),
  steelDark: mix(BD, 58, SW),
  white: SW,
  glass: mix("var(--oboya-blue-light)", 24, SW),
  card: mix(warm, 34, SW),
  concrete: mix(BD, 74, SW),
  leaf: "var(--oboya-green)",
  leafLight: "var(--oboya-green-light)",
  leafDark: mix("var(--oboya-green)", 70),
  lettuce: mix("var(--oboya-green-light)", 70, "var(--oboya-yellow-light)"),
  fruit: "var(--oboya-orange)",
  fruitDark: mix("var(--oboya-orange)", 72),
  yellow: "var(--oboya-yellow-light)",
  pink: mix("var(--oboya-orange)", 46, SW),
  blue: "var(--oboya-blue)",
  blueLight: "var(--oboya-blue-light)",
  water: mix("var(--oboya-blue-light)", 80, BD),
  shadow: BD,
} as const;

type Tones = { top: string; left: string; right: string; line: string };
/**
 * Three face tones and an outline from one base colour. `dark` materials (black PP, navy crates)
 * get a lighter outline so their edges still read on the navy plate.
 */
export const tone = (c: string, dark = false): Tones => ({
  top: mix(c, 80, SW),
  left: mix(c, 92),
  right: mix(c, 70),
  line: dark ? mix(c, 66, SW) : mix(c, 58),
});

const useStatic = () => useContext(StaticCtx);
const LINE = { strokeWidth: ink("light") } as const;
const THIN = { strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.5)" } as const;

// ---- Motion ------------------------------------------------------------------
/** Objects appear by fading in while settling down onto their surface. */
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
/** Flat contact shadow under a round footprint. */
export function Shadow({ cx, cy, r, z = 0, opacity = 0.35 }: { cx: number; cy: number; r: number; z?: number; opacity?: number }) {
  return <path d={disc(cx + 1, cy + 1, r, z)} fill={M.shadow} opacity={opacity} />;
}

/** Filled box with three-tone shading and outline; `shadow` is the opacity of a flat contact shadow. */
export function Solid({ box, color, tones, dark = false, delay = 0, line = true, shadow = 0 }: { box: Box; color?: string; tones?: Tones; dark?: boolean; delay?: number; line?: boolean; shadow?: number }) {
  const t = tones ?? tone(color ?? M.steel, dark);
  return (
    <Rise delay={delay}>
      {shadow ? <path d={plane(box.x + 2, box.y + 2, box.w + 1.5, box.d + 1.5, box.z ?? 0)} fill={M.shadow} opacity={shadow} /> : null}
      <path d={boxTop(box)} fill={t.top} />
      <path d={boxLeft(box)} fill={t.left} />
      <path d={boxRight(box)} fill={t.right} />
      {line ? <path d={boxOutline(box) + boxInner(box)} fill="none" stroke={t.line} strokeLinejoin="round" style={LINE} /> : null}
    </Rise>
  );
}

/** Pot, bucket or drum: shaded tapered cylinder; optional rim and inner fill (soil, water). */
export function Cyl({ cx, cy, z = 0, r, h, rb = r, color, dark = false, inner, innerDepth = 1.2, rim = false, delay = 0, shadow = true }: { cx: number; cy: number; z?: number; r: number; h: number; rb?: number; color: string; dark?: boolean; inner?: string; innerDepth?: number; rim?: boolean; delay?: number; shadow?: boolean }) {
  const t = tone(color, dark);
  const rr = rim ? r * 1.1 : r;
  const rimH = rim ? Math.min(1.8, h * 0.18) : 0;
  return (
    <Rise delay={delay}>
      {shadow ? <Shadow cx={cx} cy={cy} r={rb * 1.1} z={z} /> : null}
      <path d={cylinderBody(cx, cy, r, h - rimH, z, rb)} fill={t.left} />
      <path d={cylinderHalf(cx, cy, r, h - rimH, z, rb)} fill={t.right} />
      {rim ? (
        <>
          <path d={cylinderBody(cx, cy, rr, rimH, z + h - rimH)} fill={t.left} />
          <path d={cylinderHalf(cx, cy, rr, rimH, z + h - rimH)} fill={t.right} />
        </>
      ) : null}
      <path d={disc(cx, cy, rr, z + h)} fill={t.top} />
      {inner ? <path d={disc(cx, cy, r * 0.84, z + h - innerDepth)} fill={inner} /> : null}
      <path d={cylinder(cx, cy, rr, h, z, rb)} fill="none" stroke={t.line} style={LINE} />
    </Rise>
  );
}

/** Screen-space circle at a world point (fruit, bloom centre). */
export function Dot({ at, r, fill, stroke }: { at: [number, number, number]; r: number; fill: string; stroke?: string }) {
  const [cx, cy] = iso(at[0], at[1], at[2]);
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} style={stroke ? LINE : undefined} />;
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
/** Round leaflet (strawberry, lettuce heart). */
function roundLeaf(b: [number, number, number], dir: [number, number], len: number, lift: number) {
  return leaf(b, dir, len, lift, len * 0.55);
}
const stem = (a: [number, number, number], b: [number, number, number], color = M.leafDark, w: "light" | "base" = "light") => (
  <path d={`M${iso(...a).join(" ")}L${iso(...b).join(" ")}`} fill="none" stroke={color} strokeLinecap="round" style={{ strokeWidth: ink(w) }} />
);

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
const rot = (d: [number, number], a: number): [number, number] => [d[0] * Math.cos(a) - d[1] * Math.sin(a), d[0] * Math.sin(a) + d[1] * Math.cos(a)];

/** Tomato fruit: round, with a small dark calyx. */
export function TomatoFruit({ at, r = 2.6 }: { at: [number, number, number]; r?: number }) {
  const [cx, cy] = iso(at[0], at[1], at[2]);
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={M.fruit} />
      <circle cx={cx} cy={cy - r * 0.8} r={r * 0.34} fill={M.leafDark} />
    </>
  );
}

/** Lettuce head: ruffled outer leaves, lighter inner leaves and a pale heart. */
export function Lettuce({ x, y, z, r = 8 }: { x: number; y: number; z: number; r?: number }) {
  return (
    <>
      {DIRS8.map((d, k) => (
        <path key={`o${k}`} d={roundLeaf([x, y, z], d, r, r * 0.45)} fill={k % 2 ? M.leaf : M.leafDark} />
      ))}
      {DIRS8.map((d, k) => (
        <path key={`i${k}`} d={roundLeaf([x, y, z + 1], rot(d, 0.4), r * 0.66, r * 0.8)} fill={k % 2 ? M.lettuce : M.leafLight} />
      ))}
      <path d={disc(x, y, r * 0.3, z + r * 0.7)} fill={M.lettuce} />
    </>
  );
}

/**
 * Tomato plant: a stem with compound leaves (three leaflets each) and hanging trusses of fruit.
 * `h` is the stem height; `fruit` the number of trusses (0 = young plant).
 */
export function Tomato({ x, y, z, h = 34, fruit = 2 }: { x: number; y: number; z: number; h?: number; fruit?: number }) {
  const n = Math.max(2, Math.round(h / 9));
  const nodes = Array.from({ length: n }, (_, i) => ({ z: z + 5 + (i * (h - 6)) / n, d: DIRS8[(i * 3) % 8], len: 8 + (n - i) * 0.8 }));
  return (
    <>
      {stem([x, y, z], [x, y, z + h], M.leafDark, "base")}
      {nodes.map((nd, k) => (
        <g key={k}>
          {stem([x, y, nd.z], [x + nd.d[0] * nd.len * 0.7, y + nd.d[1] * nd.len * 0.7, nd.z + 1.5])}
          <path d={leaf([x, y, nd.z], nd.d, nd.len, 2.5, nd.len * 0.3)} fill={k % 2 ? M.leaf : M.leafLight} />
          <path d={leaf([x + nd.d[0] * nd.len * 0.45, y + nd.d[1] * nd.len * 0.45, nd.z + 1], rot(nd.d, 0.9), nd.len * 0.5, 1, nd.len * 0.16)} fill={M.leaf} />
          <path d={leaf([x + nd.d[0] * nd.len * 0.45, y + nd.d[1] * nd.len * 0.45, nd.z + 1], rot(nd.d, -0.9), nd.len * 0.5, 1, nd.len * 0.16)} fill={M.leafDark} />
        </g>
      ))}
      {Array.from({ length: fruit }, (_, i) => {
        const tz = z + h * 0.35 + i * (h * 0.3);
        const side = i % 2 ? 1 : -1;
        const px = x + side * 4;
        const py = y + (i % 2 ? -3 : 3);
        return (
          <g key={i}>
            {stem([x, y, tz + 2], [px, py, tz], M.leaf)}
            <TomatoFruit at={[px - 1.5, py + 1.5, tz - 3]} r={2.3} />
            <TomatoFruit at={[px + 1.8, py - 1, tz - 2.2]} r={2.3} />
            <TomatoFruit at={[px, py + 0.5, tz - 5.5]} r={2.3} />
          </g>
        );
      })}
    </>
  );
}

/** Strawberry fruit: a drop shape with a green calyx. */
export function Berry({ at, r = 2.2 }: { at: [number, number, number]; r?: number }) {
  const [cx, cy] = iso(at[0], at[1], at[2]);
  return (
    <>
      <path d={`M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}Q${cx + r * 0.7} ${cy + r * 1.1} ${cx} ${cy + r * 1.6}Q${cx - r * 0.7} ${cy + r * 1.1} ${cx - r} ${cy}Z`} fill={M.fruit} />
      <path d={`M${cx - r * 0.9} ${cy - r * 0.4}L${cx} ${cy - r * 1.1}L${cx + r * 0.9} ${cy - r * 0.4}L${cx} ${cy - r * 0.2}Z`} fill={M.leafDark} />
    </>
  );
}

/** Low strawberry plant: trifoliate leaves on short petioles, berries hanging at the front. */
export function Strawberry({ x, y, z, fruit = 3 }: { x: number; y: number; z: number; fruit?: number }) {
  return (
    <>
      {[1, 3, 5, 7, 0, 4].map((i, k) => {
        const d = DIRS8[i];
        const b: [number, number, number] = [x + d[0] * 5, y + d[1] * 5, z + 3.5];
        return (
          <g key={i}>
            {stem([x, y, z], b)}
            <path d={roundLeaf(b, d, 4.2, 1)} fill={k % 2 ? M.leaf : M.leafDark} />
            <path d={roundLeaf(b, rot(d, 1.1), 3.6, 0.6)} fill={M.leaf} />
            <path d={roundLeaf(b, rot(d, -1.1), 3.6, 0.6)} fill={M.leafLight} />
          </g>
        );
      })}
      {fruit > 0 ? <Berry at={[x + 4, y + 5, z + 1.5]} /> : null}
      {fruit > 1 ? <Berry at={[x - 3, y + 6, z + 1]} /> : null}
      {fruit > 2 ? <Berry at={[x + 6, y - 1, z + 1]} /> : null}
    </>
  );
}

/** Chrysanthemum head: ten two-tone petals around a dark-ringed centre, outlined so it reads small. */
function Mum({ at, r, color }: { at: [number, number, number]; r: number; color: string }) {
  const [cx, cy] = iso(at[0], at[1], at[2]);
  const n = 10;
  const petal = (k: number, scale: number) => {
    const a = (k / n) * Math.PI * 2 - Math.PI / 2;
    const tx = cx + Math.cos(a) * r * scale;
    const ty = cy + Math.sin(a) * r * 0.92 * scale;
    const px = cx + Math.cos(a - 0.36) * r * 0.7 * scale;
    const py = cy + Math.sin(a - 0.36) * r * 0.64 * scale;
    const qx = cx + Math.cos(a + 0.36) * r * 0.7 * scale;
    const qy = cy + Math.sin(a + 0.36) * r * 0.64 * scale;
    return `M${cx} ${cy}Q${px} ${py} ${tx} ${ty}Q${qx} ${qy} ${cx} ${cy}`;
  };
  const outer = Array.from({ length: n }, (_, k) => petal(k, 1)).join("");
  const inner = Array.from({ length: n }, (_, k) => petal(k + 0.5, 0.62)).join("");
  const centre = color === M.yellow ? M.fruitDark : color === M.fruit ? M.yellow : mix(M.yellow, 80, M.fruit);
  return (
    <>
      <path d={outer} fill={color} stroke={mix(color, 72)} strokeLinejoin="round" style={THIN} />
      <path d={inner} fill={mix(color, 78, SW)} />
      <circle cx={cx} cy={cy} r={r * 0.3} fill={centre} stroke={mix(centre, 65)} style={THIN} />
    </>
  );
}

/** Rose: a closed bud (outlined ellipse) with a darker inner petal curl and a green calyx. */
export function Rose({ at, r, color }: { at: [number, number, number]; r: number; color: string }) {
  const [cx, cy] = iso(at[0], at[1], at[2]);
  return (
    <>
      <path d={`M${cx - r * 0.7} ${cy + r * 0.5}L${cx} ${cy + r * 1.25}L${cx + r * 0.7} ${cy + r * 0.5}Z`} fill={M.leafDark} />
      <ellipse cx={cx} cy={cy} rx={r * 0.8} ry={r} fill={color} stroke={mix(color, 72)} style={THIN} />
      <path d={`M${cx - r * 0.45} ${cy - r * 0.15}Q${cx} ${cy + r * 0.55} ${cx + r * 0.42} ${cy - r * 0.3}M${cx - r * 0.2} ${cy - r * 0.6}Q${cx + r * 0.1} ${cy - r * 0.1} ${cx + r * 0.3} ${cy - r * 0.55}`} fill="none" stroke={mix(color, 62)} strokeLinecap="round" style={LINE} />
    </>
  );
}

/** Potted flowering plant (chrysanthemum): a leafy dome and `blooms` heads; `h` is the dome height. */
export function PottedMum({ x, y, z, color = M.yellow, h = 11, blooms = 4 }: { x: number; y: number; z: number; color?: string; h?: number; blooms?: number }) {
  const heads: [number, number, number][] = [
    [x - 3, y + 2.5, z + h],
    [x + 3.5, y - 1.5, z + h + 1],
    [x + 1, y + 4, z + h + 2],
    [x - 1.5, y - 3.5, z + h + 2.5],
    [x + 4, y + 3, z + h - 0.5],
  ];
  return (
    <>
      {DIRS8.map((d, k) => (
        <path key={k} d={roundLeaf([x, y, z], d, 6.5, 3.5)} fill={k % 2 ? M.leaf : M.leafDark} />
      ))}
      {DIRS8.map((d, k) => (
        <path key={`i${k}`} d={roundLeaf([x, y, z + 2.5], rot(d, 0.4), 5, h * 0.55)} fill={k % 2 ? M.leafLight : M.leaf} />
      ))}
      {heads.slice(0, blooms).map((b, k) => (
        <Mum key={k} at={b} r={4} color={color} />
      ))}
    </>
  );
}

/** Seedling: two tiny leaves on a short stem. */
export function Seedling({ x, y, z, s = 1 }: { x: number; y: number; z: number; s?: number }) {
  return (
    <>
      {stem([x, y, z], [x, y, z + 3 * s])}
      <path d={leaf([x, y, z + 2.5 * s], [1, -0.3], 3.6 * s, 1.2 * s, 1.5 * s)} fill={M.leafLight} />
      <path d={leaf([x, y, z + 2.5 * s], [-1, 0.3], 3.6 * s, 1.2 * s, 1.5 * s)} fill={M.leaf} />
    </>
  );
}

/**
 * Cut flowers rising from (x, y, z): straight stems with a leaf each; heads are chrysanthemums
 * (`kind="mum"`) or roses. `h` is the stem length.
 */
export function Stems({ x, y, z, h = 16, colors = [M.yellow, M.pink, M.fruit], kind = "mum", spread = 3 }: { x: number; y: number; z: number; h?: number; colors?: string[]; kind?: "mum" | "rose"; spread?: number }) {
  const tops: [number, number, number][] = colors.map((_, i) => [x + (i - (colors.length - 1) / 2) * spread, y - (i % 2) * spread * 0.8 + (i % 3 === 2 ? spread * 0.6 : 0), z + h + (i % 2) * 2.5]);
  return (
    <>
      {tops.map((t, k) => (
        <g key={k}>{stem([x + (t[0] - x) * 0.2, y + (t[1] - y) * 0.2, z], [t[0], t[1], t[2] - 2], M.leaf)}</g>
      ))}
      <path d={leaf([x, y, z + h * 0.45], [1, 0.4], 5, 2, 1.8)} fill={M.leaf} />
      <path d={leaf([x, y, z + h * 0.6], [-0.6, 0.9], 4.5, 2, 1.6)} fill={M.leafDark} />
      {tops.map((t, k) => (kind === "mum" ? <Mum key={k} at={t} r={3.6} color={colors[k]} /> : <Rose key={k} at={t} r={3} color={colors[k]} />))}
    </>
  );
}
