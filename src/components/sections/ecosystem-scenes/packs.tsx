"use client";

import type { ReactNode } from "react";
import { Cyl, Dot, Lettuce, M, Rise, Seedling, Shadow, Solid, Stems, TomatoFruit, leaf, mix, tone } from "./flat-kit";
import { P, at, boxInner, boxOutline, cylinder, cylinderBody, disc, faceY, ink, iso, plane, post, seg, type Box } from "./iso-kit";

/**
 * Oboya product objects shared by several scenes, drawn around the world origin unless they take a
 * position. Real-world scale at 1 unit ≈ 2 cm: plug tray 40×24, pot Ø10, crate 30×20×13,
 * CC trolley 68×28×95, punnet 10×8×4.5, bucket Ø11×16.
 */
const SW = "var(--oboya-soft-white)";
const GLASS = tone(M.glass);
const LINE = { strokeWidth: ink("light") } as const;
const THIN = { strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.55)" } as const;

// ---- Plug tray ---------------------------------------------------------------------
export const TRAY: Box = { x: 0, y: 0, w: 40, d: 24, h: 5 };
const CELLS = { cols: 6, rows: 4 };
const CELL = Array.from({ length: CELLS.rows * CELLS.cols }, (_, i) => {
  const c = i % CELLS.cols;
  const r = Math.floor(i / CELLS.cols);
  return { x: (TRAY.w * (c + 0.5)) / CELLS.cols, y: (TRAY.d * (r + 0.5)) / CELLS.rows };
});
const TRAY_GRID = (() => {
  const parts: string[] = [];
  for (let r = 1; r < CELLS.rows; r++) parts.push(seg([0, (TRAY.d * r) / CELLS.rows, TRAY.h], [TRAY.w, (TRAY.d * r) / CELLS.rows, TRAY.h]));
  for (let c = 1; c < CELLS.cols; c++) parts.push(seg([(TRAY.w * c) / CELLS.cols, 0, TRAY.h], [(TRAY.w * c) / CELLS.cols, TRAY.d, TRAY.h]));
  return parts.join("");
})();
/**
 * Black plug tray with substrate cells; `grow` 0 = filled cells, 1 = germinating, 2 = seedlings,
 * 3 = rooted chrysanthemum cuttings (the flower line starts here).
 */
export function Tray({ grow, delay = 0.4 }: { grow: 0 | 1 | 2 | 3; delay?: number }) {
  const t = tone(M.black, true);
  return (
    <>
      <Solid box={TRAY} tones={t} delay={delay} shadow={0.3} />
      <Rise delay={delay + 0.25} dur={0.4}>
        {CELL.map((c, i) => (
          <path key={i} d={plane(c.x - 2.6, c.y - 2.3, 5.2, 4.6, TRAY.h + 0.2)} fill={M.soil} />
        ))}
        <path d={TRAY_GRID} fill="none" stroke={t.line} style={THIN} />
      </Rise>
      {grow === 3 ? (
        <Rise delay={delay + 0.5} lift={3}>
          {CELL.map((c, i) => (
            <Cutting key={i} x={c.x} y={c.y} z={TRAY.h} bud={i % 3 === 0} />
          ))}
        </Rise>
      ) : grow > 0 ? (
        <Rise delay={delay + 0.5} lift={3}>
          {CELL.map((c, i) => (
            <Seedling key={i} x={c.x} y={c.y} z={TRAY.h} s={grow === 1 ? 0.7 + ((i * 7) % 3) * 0.12 : 1.25 + ((i * 5) % 3) * 0.18} />
          ))}
        </Rise>
      ) : null}
    </>
  );
}

/** Rooted chrysanthemum cutting: a short stem with three round leaves, some with a pink bud. */
function Cutting({ x, y, z, bud }: { x: number; y: number; z: number; bud: boolean }) {
  return (
    <>
      <path d={`M${iso(x, y, z).join(" ")}L${iso(x, y, z + 4).join(" ")}`} fill="none" stroke={M.leafDark} strokeLinecap="round" style={LINE} />
      <path d={leaf([x, y, z + 2], [1, 0.2], 3.4, 1.2, 1.8)} fill={M.leaf} />
      <path d={leaf([x, y, z + 2.6], [-0.8, 0.7], 3.2, 1.2, 1.7)} fill={M.leafDark} />
      <path d={leaf([x, y, z + 3.2], [-0.3, -1], 3, 1.4, 1.6)} fill={M.leafLight} />
      {bud ? <Dot at={[x, y, z + 5]} r={1.3} fill={M.pink} stroke={mix(M.pink, 60)} /> : null}
    </>
  );
}

// ---- Pot and bucket ----------------------------------------------------------------
/** Plant pot with rim and substrate. */
export function Pot({ cx, cy, z = 0, r = 5, h = 9, color = M.terra, delay = 0, shadow = true }: { cx: number; cy: number; z?: number; r?: number; h?: number; color?: string; delay?: number; shadow?: boolean }) {
  return <Cyl cx={cx} cy={cy} z={z} r={r} rb={r * 0.76} h={h} color={color} dark={color === M.black} inner={M.soil} rim delay={delay} shadow={shadow} />;
}
export const BUCKET = { r: 5.5, rb: 4.6, h: 16 };
/** Black flower bucket with water. */
export function Bucket({ cx, cy, z = 0, delay = 0, shadow = true }: { cx: number; cy: number; z?: number; delay?: number; shadow?: boolean }) {
  return <Cyl cx={cx} cy={cy} z={z} r={BUCKET.r} rb={BUCKET.rb} h={BUCKET.h} color={M.black} dark inner={M.water} innerDepth={2} rim delay={delay} shadow={shadow} />;
}
/** Bucket with a bunch of cut flowers in it. `h` is the stem length above the rim. */
export function FlowerBucket({ cx, cy, z = 0, colors, kind = "mum", h = 12, delay = 0, shadow = true }: { cx: number; cy: number; z?: number; colors: string[]; kind?: "mum" | "rose"; h?: number; delay?: number; shadow?: boolean }) {
  return (
    <>
      <Bucket cx={cx} cy={cy} z={z} delay={delay} shadow={shadow} />
      <Rise delay={delay + 0.3} lift={4}>
        <Stems x={cx} y={cy} z={z + BUCKET.h - 3} h={h} colors={colors} kind={kind} spread={3.2} />
      </Rise>
    </>
  );
}

/** Three bucket-of-flowers symbols (`${id}-bucket0..2`) for <use>: mums, roses, mixed. */
export function BucketDefs({ id, delay = 1 }: { id: string; delay?: number }) {
  const SWC = "var(--oboya-soft-white)";
  const sets: { colors: string[]; kind: "mum" | "rose" }[] = [
    { colors: [M.yellow, M.pink, M.yellow, SWC], kind: "mum" },
    { colors: [M.fruit, M.pink, M.fruit], kind: "rose" },
    { colors: [SWC, M.yellow, M.pink], kind: "mum" },
  ];
  return (
    <>
      {sets.map((b, k) => (
        <g key={k} id={`${id}-bucket${k}`}>
          <FlowerBucket cx={0} cy={0} colors={b.colors} kind={b.kind} h={12} delay={delay + k * 0.08} shadow={false} />
        </g>
      ))}
    </>
  );
}

// ---- Plastic crate -----------------------------------------------------------------
export const CRATE: Box = { x: -15, y: -10, w: 30, d: 20, h: 13 };
/** PP crate with handle slots and vents; `children` are the contents, drawn at the rim level. */
export function Crate({ color = M.blue, fill = "empty", delay = 0.6, children }: { color?: string; fill?: "empty" | "tomato"; delay?: number; children?: ReactNode }) {
  const b = CRATE;
  const t = tone(color, true);
  const slot = (x: number) => `M${P(x, b.y + b.d, b.h - 4.5)}L${P(x + 9, b.y + b.d, b.h - 4.5)}L${P(x + 9, b.y + b.d, b.h - 2.5)}L${P(x, b.y + b.d, b.h - 2.5)}Z`;
  const slotX = `M${P(b.x + b.w, b.y + 6, b.h - 4.5)}L${P(b.x + b.w, b.y + 14, b.h - 4.5)}L${P(b.x + b.w, b.y + 14, b.h - 2.5)}L${P(b.x + b.w, b.y + 6, b.h - 2.5)}Z`;
  return (
    <>
      <Solid box={b} tones={t} delay={delay} shadow={0.32} />
      <Rise delay={delay + 0.15} dur={0.4}>
        <path d={slot(b.x + 10.5) + slotX} fill={mix(color, 55)} />
        <path d={[0.2, 0.35, 0.5, 0.65, 0.8].map((f) => post(b.x + b.w * f, b.y + b.d, 2.5, b.h - 6.5)).join("") + [0.3, 0.5, 0.7].map((f) => post(b.x + b.w, b.y + b.d * f, 2.5, b.h - 6.5)).join("")} fill="none" stroke={mix(color, 80)} style={THIN} />
        {fill === "tomato" ? (
          <>
            <path d={plane(b.x + 1.5, b.y + 1.5, b.w - 3, b.d - 3, b.h - 1.5)} fill={M.fruitDark} />
            {[
              [0.18, 0.3],
              [0.4, 0.22],
              [0.64, 0.3],
              [0.86, 0.26],
              [0.28, 0.6],
              [0.52, 0.55],
              [0.76, 0.62],
              [0.4, 0.84],
              [0.64, 0.86],
              [0.16, 0.86],
            ].map(([fx, fy], k) => (
              <TomatoFruit key={k} at={[b.x + b.w * fx, b.y + b.d * fy, b.h + 0.6]} r={2.4} />
            ))}
          </>
        ) : (
          <path d={plane(b.x + 1.5, b.y + 1.5, b.w - 3, b.d - 3, b.h - 1)} fill={t.right} />
        )}
      </Rise>
      {children ? <g transform={at(0, 0, b.h - 2)}>{children}</g> : null}
    </>
  );
}

// ---- CC (Danish) trolley -------------------------------------------------------------
export const CC = { w: 68, d: 28, deck: 6, top: 100 } as const;
/**
 * Opaque CC trolley: casters, deck, four steel uprights and shelves, drawn in painter's order
 * (far uprights, then each level bottom-up with its contents, then near uprights).
 * `content(level, z)` draws what stands on the shelf at that level.
 */
export function CCTrolley({ x, y, levels = [CC.deck, 40, 74], top = CC.top, delay = 0.5, content }: { x: number; y: number; levels?: number[]; top?: number; delay?: number; content?: (level: number, z: number) => ReactNode }) {
  const { w, d } = CC;
  const steel = tone(M.steel);
  const upright = (px: number, py: number, k: number) => <Solid key={k} box={{ x: px - 1.2, y: py - 1.2, z: levels[0], w: 2.4, d: 2.4, h: top - levels[0] }} tones={steel} delay={delay + 0.15} line={false} />;
  const casters: [number, number][] = [
    [x + 5, y + 4],
    [x + w - 5, y + 4],
    [x + 5, y + d - 4],
    [x + w - 5, y + d - 4],
  ];
  return (
    <>
      <Rise delay={delay}>
        <path d={plane(x + 2, y + 2, w + 1, d + 1, 0)} fill={M.shadow} opacity={0.3} />
        {casters.map(([cx, cy], k) => (
          <path key={k} d={disc(cx, cy, 2.2, 1.6)} fill={M.black} />
        ))}
        <path d={casters.map(([cx, cy]) => post(cx, cy, 1.6, levels[0] - 3)).join("")} fill="none" stroke={M.steelDark} style={{ strokeWidth: ink("base") }} />
      </Rise>
      {upright(x + 1.2, y + 1.2, 0)}
      {upright(x + 1.2, y + d - 1.2, 1)}
      {levels.map((z, lvl) => (
        <g key={z}>
          <Solid box={{ x, y, z: z - (lvl === 0 ? 3.5 : 1.6), w, d, h: lvl === 0 ? 3.5 : 1.6 }} tones={lvl === 0 ? tone(M.steelDark) : steel} delay={delay + 0.1 + lvl * 0.12} />
          {content?.(lvl, z)}
        </g>
      ))}
      {upright(x + w - 1.2, y + 1.2, 2)}
      {upright(x + w - 1.2, y + d - 1.2, 3)}
    </>
  );
}

// ---- Punnet of cherry tomatoes -------------------------------------------------------
export const PUNNET: Box = { x: -5, y: -4, w: 10, d: 8, h: 4.5 };
const FRUIT: [number, number][] = [
  [0.22, 0.3],
  [0.55, 0.26],
  [0.85, 0.3],
  [0.35, 0.68],
  [0.7, 0.68],
];
/** Clear clamshell with cherry tomatoes and a green label band across the lid. */
export function Punnet({ delay = 1, unit = false }: { delay?: number; unit?: boolean }) {
  const b = PUNNET;
  return (
    <Rise delay={unit ? 0 : delay} dur={unit ? 0.3 : 0.6}>
      <path d={plane(b.x + 0.8, b.y + 0.8, b.w, b.d, 0)} fill={M.shadow} opacity={0.3} />
      <Solid box={{ ...b, h: 1.2 }} tones={GLASS} delay={0} line={false} />
      {FRUIT.map(([fx, fy], k) => (
        <TomatoFruit key={k} at={[b.x + b.w * fx, b.y + b.d * fy, 2.2]} r={1.9} />
      ))}
      <path d={faceY(b.x, b.y + b.d, 1.2, b.w, b.h - 1.2)} fill={GLASS.left} opacity={0.5} />
      <path d={`M${P(b.x + b.w, b.y, 1.2)}L${P(b.x + b.w, b.y + b.d, 1.2)}L${P(b.x + b.w, b.y + b.d, b.h)}L${P(b.x + b.w, b.y, b.h)}Z`} fill={GLASS.right} opacity={0.5} />
      <path d={plane(b.x, b.y, b.w, b.d, b.h)} fill={GLASS.top} opacity={0.45} />
      <path d={plane(b.x, b.y + 2.6, b.w, 2.6, b.h + 0.1)} fill={M.leaf} />
      <path d={plane(b.x + 1.2, b.y + 3.3, 3, 1.2, b.h + 0.2)} fill={SW} />
      <path d={boxOutline(b) + boxInner(b)} fill="none" stroke={unit ? M.leafLight : GLASS.line} strokeLinejoin="round" style={LINE} />
    </Rise>
  );
}

// ---- Bagged lettuce ------------------------------------------------------------------
export const BAG = { r: 5, rb: 5.6, h: 14 };
export function Bag({ delay = 1 }: { delay?: number }) {
  return (
    <Rise delay={delay}>
      <Shadow cx={0} cy={0} r={BAG.rb * 1.1} />
      <path d={cylinderBody(0, 0, BAG.r, BAG.h, 0, BAG.rb)} fill={mix(M.leafLight, 30)} />
      <Lettuce x={0} y={0} z={2} r={4.6} />
      <path d={cylinderBody(0, 0, BAG.r, BAG.h, 0, BAG.rb)} fill={GLASS.left} opacity={0.5} />
      <path d={cylinderBody(0, 0, BAG.r + 0.2, 3, 5.5, BAG.r + 0.3)} fill={M.leaf} opacity={0.92} />
      <path d={disc(0, 0, BAG.r, BAG.h)} fill={GLASS.top} opacity={0.85} />
      <path d={disc(0, 0, BAG.r * 0.45, BAG.h + 1.6)} fill={M.leafDark} />
      <path d={cylinder(0, 0, BAG.r, BAG.h, 0, BAG.rb)} fill="none" stroke={GLASS.line} style={LINE} />
    </Rise>
  );
}

// ---- Flower sleeve bouquet -------------------------------------------------------------
export const SLEEVE = { r: 5.6, rb: 2.2, h: 13 };
export function Sleeve({ delay = 1, colors = [M.pink, M.yellow, M.pink], kind = "mum" }: { delay?: number; colors?: string[]; kind?: "mum" | "rose" }) {
  return (
    <Rise delay={delay}>
      <Shadow cx={0} cy={0} r={SLEEVE.rb * 1.8} />
      <Stems x={0} y={0} z={4} h={SLEEVE.h - 1} colors={colors} kind={kind} spread={2.8} />
      <path d={cylinderBody(0, 0, SLEEVE.r, SLEEVE.h, 0, SLEEVE.rb)} fill={GLASS.left} opacity={0.62} />
      <path d={cylinderBody(0, 0, SLEEVE.rb + 1.1, 3, 4, SLEEVE.rb + 0.6)} fill={M.leaf} />
      <path d={disc(0, 0, SLEEVE.r, SLEEVE.h)} fill={GLASS.top} opacity={0.5} />
      <path d={cylinder(0, 0, SLEEVE.r, SLEEVE.h, 0, SLEEVE.rb)} fill="none" stroke={GLASS.line} style={LINE} />
    </Rise>
  );
}

// ---- Printed carton ---------------------------------------------------------------------
export const CARTON: Box = { x: -7, y: -5, w: 14, d: 10, h: 10 };
export function Carton({ delay = 1 }: { delay?: number }) {
  const b = CARTON;
  return (
    <>
      <Solid box={b} color={M.card} delay={delay} shadow={0.3} />
      <Rise delay={delay + 0.2} dur={0.4}>
        <path d={faceY(b.x + 2, b.y + b.d, 2.5, b.w - 4, 4.5)} fill={SW} />
        <path d={faceY(b.x + 2.8, b.y + b.d, 3.4, 4, 2.6)} fill={M.leaf} />
        <path d={seg([b.x, b.y + b.d / 2, b.h + 0.2], [b.x + b.w, b.y + b.d / 2, b.h + 0.2])} fill="none" stroke={tone(M.card).line} style={THIN} />
      </Rise>
    </>
  );
}

/** Small screen-space marker (sensor light, lamp). */
export { Dot };
