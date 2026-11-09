"use client";

import { useId } from "react";
import {
  ACCENT,
  CONSTRUCTION,
  Draw,
  FACE,
  Faces,
  Fade,
  INK,
  IsoBox,
  Part,
  Plate,
  RAIL,
  Repeat,
  Static,
  Travel,
  accentFace,
  boxInner,
  boxOutline,
  cylinder,
  cylinderBody,
  disc,
  iso,
  plane,
  post,
  seg,
  type Box,
  type SceneProps,
} from "./iso-kit";

// Gondola along x: plinth, back panel, three shelves of repeated packs; a floor display with buckets at the front-right.
const G = { x: -140, w: 290, y: -14, d: 44 };
const PLINTH: Box = { x: G.x, y: G.y, w: G.w, d: G.d, h: 10 };
const PANEL: Box = { x: G.x, y: G.y, z: 10, w: G.w, d: 5, h: 96 };
const SHELF_Z = [36, 66, 96];
const shelf = (z: number): Box => ({ x: G.x, y: G.y + 5, z, w: G.w, d: 36, h: 3 });
const PACK_PITCH = 25;
const PACKS = 11;
const PACK_X0 = G.x + 8;
const PACK_Y = G.y + 14;
const STAND: Box = { x: 160, y: 40, w: 50, d: 40, h: 14 };
const BUCKETS: [number, number][] = [
  [173, 52],
  [197, 54],
  [185, 68],
];

/** Potted plant: pot cylinder, two leaf strokes. Drawn around the world origin. */
const POT_R = 6;
const POT_H = 12;
const pot = cylinder(0, 0, POT_R, POT_H, 0, 4.5);
const potBody = cylinderBody(0, 0, POT_R, POT_H, 0, 4.5);
const potTop = disc(0, 0, POT_R, POT_H);
const leaves =
  `M${iso(0, 0, POT_H).join(" ")}Q${iso(-7, 2, POT_H + 9).join(" ")} ${iso(-9, 6, POT_H + 16).join(" ")}` +
  `M${iso(0, 0, POT_H).join(" ")}Q${iso(6, -3, POT_H + 10).join(" ")} ${iso(10, -7, POT_H + 14).join(" ")}` +
  `M${iso(0, 0, POT_H).join(" ")}L${iso(1, 1, POT_H + 18).join(" ")}`;

/** Produce pack: a low clamshell with an orange lid. */
const CLAM: Box = { x: -7, y: -6, w: 14, d: 12, h: 9 };
/** Flower sleeve: upright, slightly tapered, with a yellow head. */
const SLEEVE = { r: 5, rb: 3, h: 20 };
const sleeve = cylinder(0, 0, SLEEVE.r, SLEEVE.h, 0, SLEEVE.rb);
const sleeveBody = cylinderBody(0, 0, SLEEVE.r, SLEEVE.h, 0, SLEEVE.rb);
const head = disc(0, 0, 3.4, SLEEVE.h + 5);
const stem = post(0, 0, SLEEVE.h, SLEEVE.h + 5);

const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};

const W_INK = { strokeWidth: "var(--eco-ink, 1.2px)" } as const;
const W_LIGHT = { strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" } as const;

export function Retail({ st, active }: SceneProps) {
  const id = useId().replace(/:/g, "");
  const plantId = `${id}-plant`;
  const clamId = `${id}-clam`;
  const sleeveId = `${id}-sleeve`;
  return (
    <Static st={st}>
      <Plate>
        <defs>
          <g id={plantId}>
            <Fade delay={1.4} dur={0.5}>
              <path d={potBody} fill={FACE.left} />
              <path d={potTop} fill={FACE.right} />
            </Fade>
            <Draw d={pot} delay={1.1} dur={0.7} w="light" />
            <Draw d={leaves} color={ACCENT.green} delay={1.6} dur={0.7} />
          </g>
          <g id={clamId}>
            <Fade delay={1.5} dur={0.5}>
              <Faces box={CLAM} top={accentFace("orange", 60)} left={FACE.left} right={FACE.right} />
            </Fade>
            <Draw d={boxOutline(CLAM)} delay={1.2} dur={0.7} w="light" />
            <Draw d={boxInner(CLAM)} delay={1.4} dur={0.5} w="light" color={CONSTRUCTION} />
          </g>
          <g id={sleeveId}>
            <Fade delay={1.6} dur={0.5}>
              <path d={sleeveBody} fill={FACE.soft} />
              <path d={head} fill={ACCENT.yellowLight} />
            </Fade>
            <Draw d={sleeve} delay={1.3} dur={0.7} w="light" />
            <Draw d={stem} color={ACCENT.green} delay={1.7} dur={0.3} w="light" />
          </g>
        </defs>

        {/* Gondola */}
        <g>
          <IsoBox box={PLINTH} delay={0} dur={1} w="heavy" />
          <IsoBox box={PANEL} delay={0.2} dur={1.1} inner={false} left={FACE.left} right={FACE.right} top={FACE.soft} />
          {/* Panel perforation: vertical construction lines on the front face */}
          <Draw
            d={Array.from({ length: 9 }, (_, k) => post(G.x + 29 + k * 29, G.y + 5, 16, 100)).join("")}
            color={CONSTRUCTION}
            w="light"
            delay={0.9}
            dur={0.8}
            opacity={0.6}
          />
          {SHELF_Z.map((z, k) => (
            <IsoBox key={z} box={shelf(z)} delay={0.5 + k * 0.15} dur={0.8} inner={false} top={FACE.soft} />
          ))}
          {/* Price rails along the shelf fronts */}
          <Draw
            d={SHELF_Z.map((z) => seg([G.x, G.y + 41, z + 3], [G.x + G.w, G.y + 41, z + 3])).join("")}
            color={ACCENT.greenLight}
            w="light"
            delay={1.1}
            dur={0.9}
            opacity={0.8}
          />
        </g>

        {/* Shelf contents */}
        <Part i={2} active={active}>
          <g transform={at(PACK_X0 + 7, PACK_Y + 10, SHELF_Z[2] + 3)}>
            <Repeat href={`#${plantId}`} n={PACKS} dx={PACK_PITCH} />
          </g>
        </Part>
        <Part i={1} active={active}>
          <g transform={at(PACK_X0 + 7, PACK_Y + 8, SHELF_Z[1] + 3)}>
            <Repeat href={`#${clamId}`} n={PACKS} dx={PACK_PITCH} />
          </g>
          <g transform={at(PACK_X0 + 7, PACK_Y + 10, SHELF_Z[0] + 3)}>
            <Repeat href={`#${sleeveId}`} n={PACKS} dx={PACK_PITCH} />
          </g>
        </Part>

        {/* Floor display */}
        <Part i={0} active={active}>
          <IsoBox box={STAND} delay={0.6} dur={0.9} />
          <Fade delay={1.2}>
            <path d={plane(STAND.x + 4, STAND.y + 4, STAND.w - 8, STAND.d - 8, STAND.h)} fill={FACE.right} />
          </Fade>
          {BUCKETS.map(([bx, by], k) => (
            <g key={k}>
              <Fade delay={1.5 + k * 0.1} dur={0.5}>
                <path d={cylinderBody(bx, by, 8, 20, STAND.h, 6.5)} fill={FACE.left} />
                <path d={disc(bx, by, 8, STAND.h + 20)} fill={FACE.right} />
              </Fade>
              <Draw d={cylinder(bx, by, 8, 20, STAND.h, 6.5)} delay={1.2 + k * 0.1} dur={0.7} />
              <Draw
                d={[-3, 0, 3].map((o) => seg([bx + o, by - o, STAND.h + 20], [bx + o * 1.6, by - o * 1.6, STAND.h + 36 + (o === 0 ? 4 : 0)])).join("")}
                color={ACCENT.green}
                w="light"
                delay={1.8 + k * 0.1}
                dur={0.5}
              />
              <Fade delay={2.1 + k * 0.1} dur={0.4}>
                {[-3, 0, 3].map((o) => (
                  <path key={o} d={disc(bx + o * 1.6, by - o * 1.6, 3, STAND.h + 36 + (o === 0 ? 4 : 0))} fill={ACCENT.yellowLight} />
                ))}
              </Fade>
            </g>
          ))}
        </Part>

        {/* Unit: a retail pack on the rail. */}
        <Travel>
          <Fade delay={0} dur={0.3}>
            <Faces box={{ x: -14, y: RAIL.y - 10, w: 28, d: 20, h: 16 }} top={accentFace("orange", 60)} />
          </Fade>
          <path d={boxOutline({ x: -14, y: RAIL.y - 10, w: 28, d: 20, h: 16 })} fill="none" stroke={ACCENT.greenLight} strokeLinejoin="round" style={W_INK} />
          <path d={boxInner({ x: -14, y: RAIL.y - 10, w: 28, d: 20, h: 16 })} fill="none" stroke={INK} strokeLinejoin="round" style={W_LIGHT} />
        </Travel>
      </Plate>
    </Static>
  );
}
