"use client";

import {
  ACCENT,
  CONSTRUCTION,
  Draw,
  FACE,
  Faces,
  Fade,
  accentFace,
  boxInner,
  boxOutline,
  cylinder,
  cylinderBody,
  disc,
  iso,
  plane,
  post,
  type Box,
} from "./iso-kit";

/**
 * Retail packaging, drawn around the world origin and shared by the packaging and retail scenes.
 * Packs read as clear plastic (soft translucent faces) holding produce (orange dots);
 * orange is used for the produce only, never for the pack itself.
 */

/** Rectangle on the vertical left face (plane y = const). */
export const faceRectY = (x: number, y: number, z: number, w: number, h: number) =>
  `M${iso(x, y, z).join(" ")}L${iso(x + w, y, z).join(" ")}L${iso(x + w, y, z + h).join(" ")}L${iso(x, y, z + h).join(" ")}Z`;

// ---- Clamshell / punnet -----------------------------------------------------
export const CLAM: Box = { x: -8, y: -7, w: 16, d: 14, h: 8 };
const clamLid = plane(CLAM.x + 1.6, CLAM.y + 1.6, CLAM.w - 3.2, CLAM.d - 3.2, CLAM.h);
const clamDots = [
  [0.3, 0.32],
  [0.68, 0.3],
  [0.32, 0.7],
  [0.7, 0.68],
].map(([fx, fy]) => disc(CLAM.x + CLAM.w * fx, CLAM.y + CLAM.d * fy, 2.3, CLAM.h - 1.5));
const clamVents = [0.33, 0.66].map((f) => post(CLAM.x + CLAM.w * f, CLAM.y + CLAM.d, 2, CLAM.h - 2)).join("");

export function Clamshell({ delay = 1.2, unit = false }: { delay?: number; unit?: boolean }) {
  const dots = clamDots.map((d, k) => <path key={k} d={d} fill={ACCENT.orange} />);
  if (unit) {
    // Travelling unit: complete, rides the rail (no draw-on), outlined in the active green.
    return (
      <>
        <Fade delay={0} dur={0.3}>
          <Faces box={CLAM} top={FACE.soft} left={FACE.left} right={FACE.right} />
          {dots}
        </Fade>
        <path d={boxOutline(CLAM)} fill="none" stroke={ACCENT.greenLight} strokeLinejoin="round" style={{ strokeWidth: "var(--eco-ink, 1.2px)" }} />
        <path d={boxInner(CLAM) + clamLid + clamVents} fill="none" stroke={CONSTRUCTION} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }} />
      </>
    );
  }
  return (
    <>
      <Fade delay={delay + 0.3} dur={0.5}>
        <Faces box={CLAM} top={FACE.soft} left={FACE.left} right={FACE.right} />
        {dots}
      </Fade>
      <Draw d={boxOutline(CLAM)} delay={delay} dur={0.7} w="light" />
      <Draw d={boxInner(CLAM) + clamLid + clamVents} color={CONSTRUCTION} delay={delay + 0.2} dur={0.5} w="light" />
    </>
  );
}

// ---- Produce bag (upright, pinched top) -------------------------------------
export const BAG = { r: 5.5, rb: 6.5, h: 18 };
const bag = cylinder(0, 0, BAG.r, BAG.h, 0, BAG.rb);
const bagBody = cylinderBody(0, 0, BAG.r, BAG.h, 0, BAG.rb);
const bagTop = disc(0, 0, BAG.r, BAG.h);
const bagSeal = disc(0, 0, BAG.r * 0.55, BAG.h + 2.5);
const bagLeaves = [
  [-3, 1, 7],
  [1.5, -2, 11],
  [-1, 2.5, 4],
].map(([x, y, z]) => disc(x, y, 2, z));

export function Bag({ delay = 1.2 }: { delay?: number }) {
  return (
    <>
      <Fade delay={delay + 0.3} dur={0.5}>
        <path d={bagBody} fill={FACE.soft} />
        <path d={bagTop} fill={FACE.left} />
        {bagLeaves.map((d, k) => (
          <path key={k} d={d} fill={ACCENT.green} />
        ))}
      </Fade>
      <Draw d={bag} delay={delay} dur={0.7} w="light" />
      <Draw d={bagSeal} color={CONSTRUCTION} delay={delay + 0.4} dur={0.3} w="light" />
    </>
  );
}

// ---- Flower sleeve -----------------------------------------------------------
export const SLEEVE = { r: 5, rb: 2.8, h: 20 };
const sleeve = cylinder(0, 0, SLEEVE.r, SLEEVE.h, 0, SLEEVE.rb);
const sleeveBody = cylinderBody(0, 0, SLEEVE.r, SLEEVE.h, 0, SLEEVE.rb);
const heads = [
  [0, 0, 5],
  [-2.5, 1.5, 3],
  [2, -2, 2.5],
].map(([x, y, dz]) => disc(x, y, 2.6, SLEEVE.h + dz));
const stems = [
  [0, 0, 5],
  [-2.5, 1.5, 3],
  [2, -2, 2.5],
]
  .map(([x, y, dz]) => `M${iso(0, 0, SLEEVE.h - 2).join(" ")}L${iso(x, y, SLEEVE.h + dz).join(" ")}`)
  .join("");

export function Sleeve({ delay = 1.3 }: { delay?: number }) {
  return (
    <>
      <Fade delay={delay + 0.3} dur={0.5}>
        <path d={sleeveBody} fill={FACE.soft} />
        {heads.map((d, k) => (
          <path key={k} d={d} fill={ACCENT.yellowLight} />
        ))}
      </Fade>
      <Draw d={sleeve} delay={delay} dur={0.7} w="light" />
      <Draw d={stems} color={ACCENT.green} delay={delay + 0.4} dur={0.3} w="light" />
    </>
  );
}

// ---- Labelled carton ---------------------------------------------------------
export const CARTON: Box = { x: -8, y: -6, w: 16, d: 12, h: 12 };
const label = faceRectY(CARTON.x + 3, CARTON.y + CARTON.d, 4, CARTON.w - 6, 4.5);
const cartonLid = plane(CARTON.x, CARTON.y, CARTON.w, CARTON.d / 2, CARTON.h);

export function Carton({ delay = 1.2 }: { delay?: number }) {
  return (
    <>
      <Fade delay={delay + 0.3} dur={0.5}>
        <Faces box={CARTON} top={FACE.soft} left={accentFace("green", 14)} right={accentFace("green", 8)} />
        <path d={label} fill={FACE.soft} />
      </Fade>
      <Draw d={boxOutline(CARTON)} delay={delay} dur={0.7} w="light" />
      <Draw d={boxInner(CARTON) + cartonLid} color={CONSTRUCTION} delay={delay + 0.2} dur={0.5} w="light" />
    </>
  );
}
