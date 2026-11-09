"use client";

import { useId } from "react";
import { Dot, M, Rise, Solid, Tomato, mix, tone } from "./flat-kit";
import { Draw, P, Part, Plate, RAIL, Repeat, Static, Travel, disc, iso, plane, post, seg, type Box, type SceneProps } from "./iso-kit";

// Tomato rows on gutters with a pipe rail between them, a harvest trolley riding the pipes with
// stacked plastic crates of fruit, and a stack of empty crates at the front.
const ROW = { x0: -190, w: 380 };
const ROW_Y = [-100, -62, -24];
const GUTTER_H = 8;
const PLANT_PITCH = 30;
const PIPE = { y: 8, half: 5, x0: -200, x1: 200 };
const TROLLEY = { x: -46, w: 64, d: 26, z: 8, h: 4 };
const CRATE: Box = { x: 0, y: 0, w: 28, d: 22, h: 13 };
const STACK = { x: 118, y: 44 };
const SW = "var(--oboya-soft-white)";

/** Plastic crate: shaded box with handle slot and vent slots on the visible faces. */
function Crate({ full, delay = 0.8 }: { full: boolean; delay?: number }) {
  const b = CRATE;
  const t = tone(M.blue);
  return (
    <>
      <Solid box={b} color={M.blue} delay={delay} shadow={0.12} />
      <Rise delay={delay + 0.15}>
        {/* handle slot on the front face, vents on the right face */}
        <path d={`M${P(b.x + 9, b.y + b.d, b.h - 5)}L${P(b.x + b.w - 9, b.y + b.d, b.h - 5)}L${P(b.x + b.w - 9, b.y + b.d, b.h - 2.5)}L${P(b.x + 9, b.y + b.d, b.h - 2.5)}Z`} fill={t.line} />
        <path d={[0.25, 0.5, 0.75].map((f) => post(b.x + b.w, b.y + b.d * f, 2.5, b.h - 7)).join("")} fill="none" stroke={t.line} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.9)" }} />
        {full ? (
          <>
            <path d={plane(b.x + 1.5, b.y + 1.5, b.w - 3, b.d - 3, b.h - 0.5)} fill={mix(M.fruit, 35, M.soil)} />
            {[
              [0.2, 0.3],
              [0.45, 0.22],
              [0.72, 0.3],
              [0.3, 0.6],
              [0.56, 0.52],
              [0.8, 0.62],
              [0.42, 0.82],
              [0.68, 0.84],
            ].map(([fx, fy], k) => (
              <Dot key={k} at={[b.x + b.w * fx, b.y + b.d * fy, b.h + 1]} r={2.6} fill={M.fruit} />
            ))}
          </>
        ) : (
          <path d={plane(b.x + 1.5, b.y + 1.5, b.w - 3, b.d - 3, 1)} fill={t.right} />
        )}
      </Rise>
    </>
  );
}

const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};

const TROLLEY_BOX: Box = { x: TROLLEY.x, y: PIPE.y - TROLLEY.d / 2, z: TROLLEY.z, w: TROLLEY.w, d: TROLLEY.d, h: TROLLEY.h };
const WHEELS: [number, number][] = [
  [TROLLEY.x + 8, PIPE.y - PIPE.half],
  [TROLLEY.x + TROLLEY.w - 8, PIPE.y - PIPE.half],
  [TROLLEY.x + 8, PIPE.y + PIPE.half],
  [TROLLEY.x + TROLLEY.w - 8, PIPE.y + PIPE.half],
];

export function Harvest({ st, active }: SceneProps) {
  const id = useId();
  return (
    <Static st={st}>
      <Plate>
        <defs>
          <g id={`${id}-plant`}>
            <Tomato x={0} y={0} z={0} h={44} fruit={4} />
          </g>
          <g id={`${id}-full`}>
            <Crate full />
          </g>
          <g id={`${id}-empty`}>
            <Crate full={false} />
          </g>
        </defs>

        {/* Crop rows: white gutters on the ground, substrate slabs, tall tomato plants on strings */}
        <Part i={2} active={active}>
          {ROW_Y.map((y, k) => (
            <g key={y}>
              <Solid box={{ x: ROW.x0, y: y - 7, w: ROW.w, d: 14, h: GUTTER_H }} color={M.white} delay={0.1 + k * 0.1} />
              <Rise delay={0.3 + k * 0.1}>
                {Array.from({ length: 12 }, (_, i) => (
                  <path key={i} d={plane(ROW.x0 + 6 + i * PLANT_PITCH, y - 5, 22, 10, GUTTER_H + 0.3)} fill={M.soil} />
                ))}
              </Rise>
              <Draw d={seg([ROW.x0, y, GUTTER_H + 70], [ROW.x0 + ROW.w, y, GUTTER_H + 70]) + post(ROW.x0, y, 0, GUTTER_H + 70) + post(ROW.x0 + ROW.w, y, 0, GUTTER_H + 70)} color={M.steelDark} w="light" delay={0.2 + k * 0.1} dur={0.8} />
              <Draw d={Array.from({ length: 12 }, (_, i) => post(ROW.x0 + 17 + i * PLANT_PITCH, y, GUTTER_H + 40, GUTTER_H + 70)).join("")} color={mix(M.steel, 70, SW)} w="light" delay={0.5 + k * 0.1} dur={0.6} />
              <Rise delay={0.5 + k * 0.12} lift={6}>
                <g transform={at(ROW.x0 + 17, y, GUTTER_H)}>
                  <Repeat href={`#${id}-plant`} n={12} dx={PLANT_PITCH} />
                </g>
              </Rise>
            </g>
          ))}
        </Part>

        {/* Pipe rail: two steel pipes on short supports */}
        <Draw d={Array.from({ length: 9 }, (_, k) => seg([PIPE.x0 + 20 + k * 45, PIPE.y - PIPE.half - 3, 1.5], [PIPE.x0 + 20 + k * 45, PIPE.y + PIPE.half + 3, 1.5])).join("")} color={M.steelDark} delay={0.4} dur={0.6} />
        <Draw d={seg([PIPE.x0, PIPE.y - PIPE.half, 2], [PIPE.x1, PIPE.y - PIPE.half, 2]) + seg([PIPE.x0, PIPE.y + PIPE.half, 2], [PIPE.x1, PIPE.y + PIPE.half, 2])} color={M.steelDark} w="heavy" delay={0.3} dur={1.1} />

        {/* Harvest trolley with crates */}
        <Part i={1} active={active}>
          <Rise delay={0.7}>
            {WHEELS.map(([x, y], k) => (
              <path key={k} d={disc(x, y, 3.4, 3)} fill={M.black} />
            ))}
            <path d={WHEELS.map(([x, y]) => post(x, y, 3, TROLLEY.z)).join("")} fill="none" stroke={M.steelDark} style={{ strokeWidth: "var(--eco-ink, 1.2px)" }} />
          </Rise>
          <Solid box={TROLLEY_BOX} color={M.steel} delay={0.6} />
          <Draw
            d={
              post(TROLLEY.x, PIPE.y - TROLLEY.d / 2 + 4, TROLLEY.z + TROLLEY.h, TROLLEY.z + 42) +
              post(TROLLEY.x, PIPE.y + TROLLEY.d / 2 - 4, TROLLEY.z + TROLLEY.h, TROLLEY.z + 42) +
              seg([TROLLEY.x, PIPE.y - TROLLEY.d / 2 + 4, TROLLEY.z + 42], [TROLLEY.x, PIPE.y + TROLLEY.d / 2 - 4, TROLLEY.z + 42])
            }
            color={M.steelDark}
            w="heavy"
            delay={1}
            dur={0.6}
          />
        </Part>
        <Part i={0} active={active}>
          <g transform={at(TROLLEY.x + 4, PIPE.y - CRATE.d / 2, TROLLEY.z + TROLLEY.h)}>
            <Repeat href={`#${id}-full`} n={2} dx={30} />
          </g>
          <g transform={at(TROLLEY.x + 4, PIPE.y - CRATE.d / 2, TROLLEY.z + TROLLEY.h + CRATE.h)}>
            <use href={`#${id}-full`} />
            <use href={`#${id}-empty`} transform={at(30, 0, 0)} />
          </g>
          {/* Empty crates stacked at the front, one full beside them */}
          <g transform={at(STACK.x, STACK.y, 0)}>
            {[0, 1, 2].map((k) => (
              <use key={k} href={`#${id}-empty`} transform={at(0, 0, CRATE.h * k)} />
            ))}
          </g>
          <g transform={at(STACK.x + 34, STACK.y + 2, 0)}>
            <use href={`#${id}-full`} />
          </g>
        </Part>

        {/* Unit: a full crate rides the rail. */}
        <Travel>
          <g transform={at(-CRATE.w / 2, RAIL.y - CRATE.d / 2, 0)}>
            <Crate full delay={0} />
          </g>
        </Travel>
      </Plate>
    </Static>
  );
}
