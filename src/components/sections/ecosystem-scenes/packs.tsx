"use client";

import { Bloom, Dot, Lettuce, M, Rise, Shadow, Solid, Stems, mix, tone } from "./flat-kit";
import { P, boxInner, boxOutline, cylinder, cylinderBody, disc, ink, iso, plane, type Box } from "./iso-kit";

/**
 * Retail packaging drawn around the world origin, shared by the packaging, retail and overview
 * scenes: clear clamshell of berries, bagged lettuce, flower sleeve bouquet, printed carton.
 */
const SW = "var(--oboya-soft-white)";
const GLASS = tone(M.glass);
const LINE = { strokeWidth: ink("light") } as const;

/** Rectangle on the vertical front face (plane y = const). */
export const faceY = (x: number, y: number, z: number, w: number, h: number) => `M${P(x, y, z)}L${P(x + w, y, z)}L${P(x + w, y, z + h)}L${P(x, y, z + h)}Z`;

// ---- Clamshell of strawberries -------------------------------------------------
export const CLAM: Box = { x: -8, y: -7, w: 16, d: 14, h: 8 };
const BERRIES: [number, number][] = [
  [0.25, 0.3],
  [0.6, 0.25],
  [0.3, 0.68],
  [0.7, 0.65],
  [0.5, 0.48],
];
export function Clamshell({ delay = 1, unit = false }: { delay?: number; unit?: boolean }) {
  const b = CLAM;
  return (
    <Rise delay={unit ? 0 : delay} dur={unit ? 0.3 : 0.6}>
      <Shadow cx={b.x + b.w / 2 + 1} cy={b.y + b.d / 2 + 1} r={9} />
      {/* base tray with berries sitting in it */}
      <path d={plane(b.x, b.y, b.w, b.d, 0.5)} fill={mix(M.fruit, 25, SW)} />
      {BERRIES.map(([fx, fy], k) => (
        <Dot key={k} at={[b.x + b.w * fx, b.y + b.d * fy, 3]} r={2.6} fill={M.fruit} />
      ))}
      {BERRIES.map(([fx, fy], k) => (
        <Dot key={`c${k}`} at={[b.x + b.w * fx, b.y + b.d * fy, 5.2]} r={1} fill={M.leaf} />
      ))}
      {/* clear lid */}
      <path d={`M${P(b.x, b.y + b.d, 0)}L${P(b.x + b.w, b.y + b.d, 0)}L${P(b.x + b.w, b.y + b.d, b.h)}L${P(b.x, b.y + b.d, b.h)}Z`} fill={GLASS.left} opacity={0.55} />
      <path d={`M${P(b.x + b.w, b.y, 0)}L${P(b.x + b.w, b.y + b.d, 0)}L${P(b.x + b.w, b.y + b.d, b.h)}L${P(b.x + b.w, b.y, b.h)}Z`} fill={GLASS.right} opacity={0.55} />
      <path d={plane(b.x, b.y, b.w, b.d, b.h)} fill={GLASS.top} opacity={0.5} />
      <path d={boxOutline(b) + boxInner(b)} fill="none" stroke={unit ? M.leafLight : GLASS.line} strokeLinejoin="round" style={LINE} />
      <path d={plane(b.x + 1.5, b.y + 1.5, b.w - 3, b.d - 3, b.h)} fill="none" stroke={GLASS.line} style={LINE} />
    </Rise>
  );
}

// ---- Bagged lettuce ------------------------------------------------------------------
export const BAG = { r: 6, rb: 7, h: 19 };
export function Bag({ delay = 1 }: { delay?: number }) {
  return (
    <Rise delay={delay}>
      <Shadow cx={1} cy={1} r={BAG.rb * 1.1} />
      <path d={cylinderBody(0, 0, BAG.r, BAG.h, 0, BAG.rb)} fill={mix(M.leafLight, 40, SW)} />
      <Lettuce x={0} y={0} z={3} r={6} />
      <path d={cylinderBody(0, 0, BAG.r, BAG.h, 0, BAG.rb)} fill={GLASS.left} opacity={0.42} />
      <path d={disc(0, 0, BAG.r, BAG.h)} fill={GLASS.top} opacity={0.8} />
      <path d={disc(0, 0, BAG.r * 0.55, BAG.h + 2.5)} fill={M.leaf} />
      <path d={cylinder(0, 0, BAG.r, BAG.h, 0, BAG.rb)} fill="none" stroke={GLASS.line} style={LINE} />
    </Rise>
  );
}

// ---- Flower sleeve bouquet -------------------------------------------------------------
export const SLEEVE = { r: 6, rb: 2.6, h: 20 };
export function Sleeve({ delay = 1, colors }: { delay?: number; colors?: string[] }) {
  return (
    <Rise delay={delay}>
      <Shadow cx={1} cy={1} r={SLEEVE.rb * 1.6} />
      <path d={cylinderBody(0, 0, SLEEVE.r, SLEEVE.h, 0, SLEEVE.rb)} fill={GLASS.left} opacity={0.75} />
      <path d={`M${iso(0, 0, 0).join(" ")}L${iso(0, 0, SLEEVE.h).join(" ")}`} fill="none" stroke={M.leafDark} style={LINE} />
      <path d={disc(0, 0, SLEEVE.r, SLEEVE.h)} fill={GLASS.top} opacity={0.7} />
      <Stems x={0} y={0} z={SLEEVE.h - 10} h={14} colors={colors} />
      <path d={cylinder(0, 0, SLEEVE.r, SLEEVE.h, 0, SLEEVE.rb)} fill="none" stroke={GLASS.line} style={LINE} />
    </Rise>
  );
}

// ---- Printed carton ---------------------------------------------------------------------
export const CARTON: Box = { x: -8, y: -6, w: 16, d: 12, h: 12 };
export function Carton({ delay = 1 }: { delay?: number }) {
  const b = CARTON;
  return (
    <>
      <Solid box={b} color={M.card} delay={delay} shadow={0.12} />
      <Rise delay={delay + 0.2}>
        <path d={faceY(b.x + 2, b.y + b.d, 3, b.w - 4, 5)} fill={SW} />
        <path d={faceY(b.x + 3, b.y + b.d, 4, 5, 3)} fill={M.leaf} />
        <path d={plane(b.x, b.y, b.w, b.d / 2 - 0.3, b.h + 0.2)} fill="none" stroke={tone(M.card).line} style={LINE} />
      </Rise>
    </>
  );
}

/** A single bloom used as a glyph. */
export { Bloom };
