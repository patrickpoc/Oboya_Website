"use client";

import { useId } from "react";
import { M, PottedMum, Rise, Solid, mix, tone } from "./flat-kit";
import { Part, Plate, RAIL, Repeat, Static, Travel, at, faceY, plane, type Box, type SceneProps } from "./iso-kit";
import { Bag, BucketDefs, Carton, Crate, Pot, Punnet, Sleeve } from "./packs";

/**
 * Supermarket gondola (5.4 m): dark plinth, opaque back panel with a green header, base deck and
 * two shelves with price rails. Painter's order: plinth, panel, then each level bottom-up with its
 * products drawn after its board. In front, a floor display with buckets of cut flowers.
 * Story: potted mums (growing → logistics) on top, punnets of cherry tomatoes (packaging) and
 * sleeves in the middle, bagged lettuce and cartons on the base; buckets from the CC trolley.
 */
const G = { x: -150, w: 270, y: -52 };
const PLINTH: Box = { x: G.x, y: G.y, w: G.w, d: 32, h: 8 };
const PANEL: Box = { x: G.x, y: G.y, z: 8, w: G.w, d: 4, h: 96 };
const SHELF1 = { x: G.x, y: G.y + 4, z: 38, w: G.w, d: 24, h: 2 } satisfies Box;
const SHELF2 = { x: G.x, y: G.y + 4, z: 70, w: G.w, d: 22, h: 2 } satisfies Box;
const ROW_Y = G.y + 17;
/** Floor display: a 2×2 grid of buckets (pitch 24 × 16 > rim Ø12.1) so no two rims touch on screen. */
const STAND: Box = { x: 116, y: 12, w: 48, d: 32, h: 6 };
const STAND_BUCKETS: [number, number, number][] = [
  [128, 20, 0],
  [128, 36, 2],
  [152, 20, 1],
  [152, 36, 1],
];
const SW = "var(--oboya-soft-white)";
const MUM_COLORS = [M.yellow, M.pink, SW, M.fruit];
/** Punnets in the arriving crate: a 2×2 layer inside the 27×17 interior, 0.5 below the rim. */
const CRATE_PUNNETS: [number, number][] = [
  [-5.75, -4.3],
  [5.75, -4.3],
  [-5.75, 4.3],
  [5.75, 4.3],
];

/** Price rail along a shelf front: light strip with small white tickets. */
function PriceRail({ z, y, delay }: { z: number; y: number; delay: number }) {
  return (
    <Rise delay={delay} dur={0.4}>
      <path d={faceY(G.x, y, z - 2.6, G.w, 2.6)} fill={mix(M.steel, 60, SW)} />
      {Array.from({ length: 7 }, (_, k) => (
        <path key={k} d={faceY(G.x + 14 + k * 38, y, z - 2.2, 8, 1.8)} fill={SW} />
      ))}
    </Rise>
  );
}

export function Retail({ st, active }: SceneProps) {
  const id = useId();
  const panel = tone(mix(M.steel, 72, SW));
  return (
    <Static st={st}>
      <Plate>
        <defs>
          {MUM_COLORS.map((c, k) => (
            <g key={k} id={`${id}-mum${k}`}>
              <Pot cx={0} cy={0} r={5} h={9} color={k % 2 ? M.terra : M.black} delay={1.1 + k * 0.05} shadow={false} />
              <Rise delay={1.4 + k * 0.05} lift={4}>
                <PottedMum x={0} y={0} z={9} color={c} h={10} blooms={4} />
              </Rise>
            </g>
          ))}
          <g id={`${id}-punnet`}>
            <Punnet delay={1.1} />
          </g>
          <g id={`${id}-bag`}>
            <Bag delay={1.2} />
          </g>
          <g id={`${id}-carton`}>
            <Carton delay={1.2} />
          </g>
          <BucketDefs id={id} delay={1.1} />
        </defs>

        {/* Gondola structure */}
        <Solid box={PLINTH} tones={tone(M.black, true)} delay={0} shadow={0.3} />
        <Solid box={PANEL} tones={panel} delay={0.15} />
        <Rise delay={0.5}>
          <path d={faceY(G.x, G.y + 4, PANEL.h + 8 - 8, G.w, 8)} fill={M.leaf} />
          <path d={plane(G.x, G.y, G.w, 4, PANEL.h + 8 + 0.1)} fill={M.leafDark} />
        </Rise>

        {/* Base deck: cartons and bagged lettuce */}
        <Part i={1} active={active}>
          <g transform={at(G.x + 24, ROW_Y + 2, 8)}>
            <Repeat href={`#${id}-carton`} n={3} dx={18} />
          </g>
          <g transform={at(G.x + 100, ROW_Y, 8)}>
            <Repeat href={`#${id}-bag`} n={4} dx={22} />
          </g>
          <g transform={at(G.x + 222, ROW_Y + 2, 8)}>
            <use href={`#${id}-carton`} />
            <use href={`#${id}-carton`} transform={at(0, 0, 10)} />
            <use href={`#${id}-carton`} transform={at(20, 0, 0)} />
          </g>
        </Part>

        {/* Shelf 1: punnets of cherry tomatoes and sleeved bunches */}
        <Solid box={SHELF1} color={M.white} delay={0.4} />
        <PriceRail z={SHELF1.z} y={SHELF1.y + SHELF1.d} delay={0.8} />
        <Part i={1} active={active}>
          <g transform={at(G.x + 22, ROW_Y - 2, 40)}>
            <Repeat href={`#${id}-punnet`} n={6} dx={20} />
            <use href={`#${id}-punnet`} transform={at(20, 0, 4.6)} />
            <use href={`#${id}-punnet`} transform={at(60, 0, 4.6)} />
          </g>
          <g transform={at(G.x + 176, ROW_Y + 5, 40)}>
            <Sleeve delay={1.25} colors={[M.pink, M.yellow, M.pink, SW]} />
          </g>
          <g transform={at(G.x + 200, ROW_Y + 5, 40)}>
            <Sleeve delay={1.3} colors={[M.fruit, M.pink, M.fruit]} kind="rose" />
          </g>
          <g transform={at(G.x + 224, ROW_Y + 5, 40)}>
            <Sleeve delay={1.35} colors={[M.yellow, SW, M.yellow, M.pink]} />
          </g>
        </Part>

        {/* Shelf 2: potted chrysanthemums */}
        <Solid box={SHELF2} color={M.white} delay={0.55} />
        <PriceRail z={SHELF2.z} y={SHELF2.y + SHELF2.d} delay={0.95} />
        <Part i={2} active={active}>
          <g transform={at(G.x + 22, ROW_Y - 3, 72)}>
            {Array.from({ length: 7 }, (_, k) => (
              <use key={k} href={`#${id}-mum${k % 4}`} transform={at(k * 36, 0, 0)} />
            ))}
          </g>
        </Part>

        {/* Floor display: dark stand with buckets of cut flowers */}
        <Part i={0} active={active}>
          <Solid box={STAND} tones={tone(M.black, true)} delay={0.6} shadow={0.3} />
          {STAND_BUCKETS.map(([bx, by, k]) => (
            <use key={`${bx}-${by}`} href={`#${id}-bucket${k}`} transform={at(bx, by, STAND.h)} />
          ))}
        </Part>

        {/* Unit: a crate of punnets arrives, a shelf-ready punnet leaves. */}
        <Travel
          from={
            <g transform={at(0, RAIL.y, 0)}>
              <Crate delay={0}>
                {CRATE_PUNNETS.map(([px, py], k) => (
                  <g key={k} transform={at(px, py, 1.5)}>
                    <Punnet delay={0} />
                  </g>
                ))}
              </Crate>
            </g>
          }
        >
          <g transform={at(0, RAIL.y, 0)}>
            <Punnet unit />
          </g>
        </Travel>
      </Plate>
    </Static>
  );
}
