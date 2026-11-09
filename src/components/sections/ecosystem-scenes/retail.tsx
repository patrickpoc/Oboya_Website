"use client";

import { useId } from "react";
import { Cyl, Flowering, M, Rise, Solid, Stems, mix, tone } from "./flat-kit";
import { P, Part, Plate, RAIL, Repeat, Static, Travel, iso, plane, type Box, type SceneProps } from "./iso-kit";
import { Bag, Carton, Clamshell, Sleeve } from "./packs";

// Supermarket gondola: plinth, back panel, three shelves with price rails; potted flowering plants
// on top, clamshells and cartons in the middle, bagged lettuce and flower sleeves below. In front,
// a flower stand with buckets of cut flowers and a stacked produce display.
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
const SW = "var(--oboya-soft-white)";
const FLOWER_COLORS = [M.pink, M.yellow, M.fruit, SW];

const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};
const faceY = (x: number, y: number, z: number, w: number, h: number) => `M${P(x, y, z)}L${P(x + w, y, z)}L${P(x + w, y, z + h)}L${P(x, y, z + h)}Z`;

/** Price tag: white ticket with a green price bar, on the shelf front rail. */
function priceTags(z: number, n: number) {
  return Array.from({ length: n }, (_, k) => {
    const x = G.x + 10 + k * (G.w - 20) / n;
    return (
      <g key={k}>
        <path d={faceY(x, G.y + 41.2, z - 0.5, 10, 4.5)} fill={SW} />
        <path d={faceY(x + 1.5, G.y + 41.2, z + 0.5, 5, 1.6)} fill={M.leaf} />
      </g>
    );
  });
}

export function Retail({ st, active }: SceneProps) {
  const id = useId();
  const panel = tone(mix(M.steel, 35, SW));
  return (
    <Static st={st}>
      <Plate>
        <defs>
          {FLOWER_COLORS.map((c, k) => (
            <g key={k} id={`${id}-plant${k}`}>
              <Cyl cx={0} cy={0} r={6} rb={4.6} h={9} color={M.terra} inner={M.soil} delay={1.1 + k * 0.05} shadow={false} />
              <Rise delay={1.4 + k * 0.05} lift={4}>
                <Flowering x={0} y={0} z={9} color={c} h={12} />
              </Rise>
            </g>
          ))}
          <g id={`${id}-clam`}>
            <Clamshell delay={1.1} />
          </g>
          <g id={`${id}-bag`}>
            <Bag delay={1.2} />
          </g>
          <g id={`${id}-sleeveA`}>
            <Sleeve delay={1.2} colors={[M.pink, M.yellow, M.pink]} />
          </g>
          <g id={`${id}-sleeveB`}>
            <Sleeve delay={1.25} colors={[M.fruit, SW, M.yellow]} />
          </g>
          <g id={`${id}-carton`}>
            <Carton delay={1.3} />
          </g>
        </defs>

        {/* Gondola */}
        <Solid box={PLINTH} color={M.steelDark} delay={0} shadow={0.12} />
        <Solid box={PANEL} tones={panel} delay={0.15} />
        <Rise delay={0.5}>
          {/* back-panel header band in brand green */}
          <path d={faceY(G.x, G.y + 5, PANEL.h + 10 - 9, G.w, 8)} fill={M.leaf} />
        </Rise>
        {SHELF_Z.map((z, k) => (
          <g key={z}>
            <Solid box={shelf(z)} color={M.white} delay={0.4 + k * 0.12} />
            <Rise delay={0.8 + k * 0.12}>
              <path d={faceY(G.x, G.y + 41, z - 1, G.w, 5)} fill={mix(M.steel, 60, SW)} />
              {priceTags(z, 6)}
            </Rise>
          </g>
        ))}

        {/* Shelf contents */}
        <Part i={2} active={active}>
          <g transform={at(PACK_X0, PACK_Y, SHELF_Z[2] + 3)}>
            {Array.from({ length: PACKS }, (_, k) => (
              <use key={k} href={`#${id}-plant${k % 4}`} transform={at(k * PITCH, 0, 0)} />
            ))}
          </g>
        </Part>
        <Part i={1} active={active}>
          <g transform={at(PACK_X0, PACK_Y, SHELF_Z[1] + 3)}>
            <Repeat href={`#${id}-clam`} n={6} dx={PITCH * 2} />
            <Repeat href={`#${id}-carton`} n={5} dx={PITCH * 2} start={0.5} />
          </g>
          <g transform={at(PACK_X0, PACK_Y, SHELF_Z[0] + 3)}>
            <Repeat href={`#${id}-bag`} n={6} dx={PITCH * 2} />
            <Repeat href={`#${id}-sleeveA`} n={3} dx={PITCH * 4} start={0.5} />
            <Repeat href={`#${id}-sleeveB`} n={2} dx={PITCH * 4} start={1.5} />
          </g>
        </Part>

        {/* Floor: flower stand with buckets, plus a stack of clamshells on a produce display */}
        <Part i={0} active={active}>
          <Solid box={STAND} color={M.card} delay={0.6} shadow={0.12} />
          <Rise delay={1}>
            <path d={plane(STAND.x + 3, STAND.y + 3, STAND.w - 6, STAND.d - 6, STAND.h + 0.2)} fill={M.leafDark} />
          </Rise>
          {BUCKETS.map(([bx, by], k) => (
            <g key={k}>
              <Cyl cx={bx} cy={by} z={STAND.h} r={8} rb={6.5} h={20} color={M.black} inner={M.water} delay={1.1 + k * 0.1} shadow={false} />
              <Rise delay={1.5 + k * 0.1} lift={5}>
                <Stems x={bx} y={by} z={STAND.h + 18} h={16} colors={[FLOWER_COLORS[k], FLOWER_COLORS[(k + 1) % 4], FLOWER_COLORS[(k + 2) % 4]]} />
                <Stems x={bx - 2} y={by + 2} z={STAND.h + 18} h={12} colors={[FLOWER_COLORS[(k + 3) % 4], FLOWER_COLORS[k]]} />
              </Rise>
            </g>
          ))}
          <g transform={at(STAND.x + 12, STAND.y + 34, STAND.h)}>
            <use href={`#${id}-clam`} />
          </g>
          <g transform={at(STAND.x + 12, STAND.y + 34, STAND.h + 8)}>
            <use href={`#${id}-clam`} />
          </g>
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
