"use client";

import { useId } from "react";
import {
  ACCENT,
  CONSTRUCTION,
  Draw,
  FACE,
  Fade,
  IsoBox,
  Part,
  Plate,
  RAIL,
  Repeat,
  Static,
  Travel,
  accentFace,
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
import { Bag, Carton, Clamshell, Sleeve } from "./packs";

// Gondola along x: plinth, back panel, three shelves of repeated packs; a floor display with buckets at the front-right.
const G = { x: -170, w: 330, y: -36, d: 44 };
const PLINTH: Box = { x: G.x, y: G.y, w: G.w, d: G.d, h: 10 };
const PANEL: Box = { x: G.x, y: G.y, z: 10, w: G.w, d: 5, h: 80 };
const SHELF_Z = [28, 54, 80];
const shelf = (z: number): Box => ({ x: G.x, y: G.y + 5, z, w: G.w, d: 36, h: 3 });
const PITCH = 30;
const PACKS = 11;
const PACK_X0 = G.x + 15;
const PACK_Y = G.y + 26;
const STAND: Box = { x: 160, y: 22, w: 56, d: 44, h: 14 };
const BUCKETS: [number, number][] = [
  [175, 36],
  [201, 38],
  [188, 54],
];

/** Potted plant: pot cylinder, three leaf strokes. Drawn around the world origin. */
const POT_R = 6.5;
const POT_H = 12;
const pot = cylinder(0, 0, POT_R, POT_H, 0, 4.8);
const potBody = cylinderBody(0, 0, POT_R, POT_H, 0, 4.8);
const potTop = disc(0, 0, POT_R - 1, POT_H);
/** Flower bucket for the floor display: three stems with yellow heads. */
const BK = { r: 8, rb: 6.5, h: 20 };
const bucketStems = [-3, 0, 3].map((o) => seg([o, -o, BK.h], [o * 1.6, -o * 1.6, BK.h + 16 + (o === 0 ? 4 : 0)])).join("");
const bucketHeads = [-3, 0, 3].map((o) => disc(o * 1.6, -o * 1.6, 3, BK.h + 16 + (o === 0 ? 4 : 0)));
const leaves =
  `M${iso(0, 0, POT_H).join(" ")}Q${iso(-7, 2, POT_H + 9).join(" ")} ${iso(-9, 6, POT_H + 16).join(" ")}` +
  `M${iso(0, 0, POT_H).join(" ")}Q${iso(6, -3, POT_H + 10).join(" ")} ${iso(10, -7, POT_H + 14).join(" ")}` +
  `M${iso(0, 0, POT_H).join(" ")}L${iso(1, 1, POT_H + 18).join(" ")}`;

const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};

export function Retail({ st, active }: SceneProps) {
  const id = useId();
  const plantId = `${id}-plant`;
  const clamId = `${id}-clam`;
  const bagId = `${id}-bag`;
  const sleeveId = `${id}-sleeve`;
  const cartonId = `${id}-carton`;
  const bucketId = `${id}-bucket`;
  return (
    <Static st={st}>
      <Plate>
        <defs>
          <g id={plantId}>
            <Fade delay={1.4} dur={0.5}>
              <path d={potBody} fill={FACE.left} />
              <path d={potTop} fill={accentFace("green", 22)} />
            </Fade>
            <Draw d={pot} delay={1.1} dur={0.7} w="light" />
            <Draw d={leaves} color={ACCENT.green} delay={1.6} dur={0.7} />
          </g>
          <g id={clamId}>
            <Clamshell delay={1.2} />
          </g>
          <g id={bagId}>
            <Bag delay={1.3} />
          </g>
          <g id={sleeveId}>
            <Sleeve delay={1.3} />
          </g>
          <g id={cartonId}>
            <Carton delay={1.4} />
          </g>
          <g id={bucketId}>
            <Fade delay={1.5} dur={0.5}>
              <path d={cylinderBody(0, 0, BK.r, BK.h, 0, BK.rb)} fill={FACE.left} />
              <path d={disc(0, 0, BK.r, BK.h)} fill={FACE.right} />
            </Fade>
            <Draw d={cylinder(0, 0, BK.r, BK.h, 0, BK.rb)} delay={1.2} dur={0.7} />
            <Draw d={bucketStems} color={ACCENT.green} w="light" delay={1.8} dur={0.5} />
            <Fade delay={2.1} dur={0.4}>
              {bucketHeads.map((d, k) => (
                <path key={k} d={d} fill={ACCENT.yellowLight} />
              ))}
            </Fade>
          </g>
        </defs>

        {/* Gondola */}
        <g>
          <IsoBox box={PLINTH} delay={0} dur={1} w="heavy" />
          <IsoBox box={PANEL} delay={0.2} dur={1.1} inner={false} left={FACE.left} right={FACE.right} top={FACE.soft} />
          {/* Panel perforation: vertical construction lines on the front face */}
          <Draw
            d={Array.from({ length: 10 }, (_, k) => post(G.x + 30 + k * 30, G.y + 5, 16, 86)).join("")}
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

        {/* Shelf contents: potted plants on top, clamshells and cartons in the middle, bags and sleeves below */}
        <Part i={2} active={active}>
          <g transform={at(PACK_X0, PACK_Y, SHELF_Z[2] + 3)}>
            <Repeat href={`#${plantId}`} n={PACKS} dx={PITCH} />
          </g>
        </Part>
        <Part i={1} active={active}>
          <g transform={at(PACK_X0, PACK_Y, SHELF_Z[1] + 3)}>
            <Repeat href={`#${clamId}`} n={6} dx={PITCH * 2} />
            <Repeat href={`#${cartonId}`} n={5} dx={PITCH * 2} start={0.5} />
          </g>
          <g transform={at(PACK_X0, PACK_Y, SHELF_Z[0] + 3)}>
            <Repeat href={`#${bagId}`} n={6} dx={PITCH * 2} />
            <Repeat href={`#${sleeveId}`} n={5} dx={PITCH * 2} start={0.5} />
          </g>
        </Part>

        {/* Floor display */}
        <Part i={0} active={active}>
          <IsoBox box={STAND} delay={0.6} dur={0.9} />
          <Fade delay={1.2}>
            <path d={plane(STAND.x + 4, STAND.y + 4, STAND.w - 8, STAND.d - 8, STAND.h)} fill={FACE.right} />
          </Fade>
          {BUCKETS.map(([bx, by], k) => (
            <use key={k} href={`#${bucketId}`} transform={at(bx, by, STAND.h)} />
          ))}
          {/* Clamshells stacked on the display */}
          <use href={`#${clamId}`} transform={at(STAND.x + 12, STAND.y + 34, STAND.h)} />
          <use href={`#${clamId}`} transform={at(STAND.x + 12, STAND.y + 34, STAND.h + 8)} />
        </Part>

        {/* Unit: a shelf pack on the rail. */}
        <Travel>
          <g transform={at(0, RAIL.y, 0)}>
            <Clamshell unit />
          </g>
        </Travel>
      </Plate>
    </Static>
  );
}
