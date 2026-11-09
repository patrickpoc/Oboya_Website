"use client";

import { useId } from "react";
import { M, Rise, Solid, Tomato, mix, tone } from "./flat-kit";
import { Draw, Part, Plate, RAIL, Static, Travel, at, disc, post, seg, type Box, type SceneProps } from "./iso-kit";
import { CRATE, Crate, FlowerBucket, Pot } from "./packs";

/**
 * Harvest in the tomato house: three rows of mature plants on gutters, strings to a crop wire
 * (drawn before the plants), a pipe-rail trolley with crates of fruit, empty crates stacked at the
 * front and two buckets of freshly cut chrysanthemums (the flower line) by the aisle.
 */
const ROW = { x0: -180, w: 360 };
const ROW_Y = [-88, -54, -20];
const PLANT = { x0: -160, n: 7, pitch: 50, z: 13, h: 40, wire: 62 };
const PIPE = { y: 14, half: 5, x0: -210, x1: 210 };
const TROLLEY = { x: -50, y: PIPE.y - 12, z: 9, w: 56, d: 24, h: 3.5 } satisfies Box;
const WHEELS: [number, number][] = [
  [TROLLEY.x + 8, PIPE.y - PIPE.half],
  [TROLLEY.x + TROLLEY.w - 8, PIPE.y - PIPE.half],
  [TROLLEY.x + 8, PIPE.y + PIPE.half],
  [TROLLEY.x + TROLLEY.w - 8, PIPE.y + PIPE.half],
];
const STACK = { x: 122, y: 46 };
const SW = "var(--oboya-soft-white)";
const BAR = mix(M.steel, 55);

export function Harvest({ st, active }: SceneProps) {
  const id = useId();
  const steel = tone(M.steel);
  return (
    <Static st={st}>
      <Plate>
        <defs>
          <g id={`${id}-plant`}>
            <Tomato x={0} y={0} z={0} h={PLANT.h} fruit={3} />
          </g>
          <g id={`${id}-full`}>
            <Crate fill="tomato" />
          </g>
          <g id={`${id}-empty`}>
            <Crate />
          </g>
        </defs>

        {/* Crop rows, back to front: gutter, growbag, end posts, wire + strings, plants */}
        <Part i={2} active={active}>
          {ROW_Y.map((y, k) => (
            <g key={y}>
              <Solid box={{ x: ROW.x0 - 1.2, y: y - 1.2, w: 2.4, d: 2.4, h: PLANT.wire }} tones={steel} delay={0.1 + k * 0.1} line={false} />
              <Solid box={{ x: ROW.x0, y: y - 7, w: ROW.w, d: 14, h: 8 }} color={M.white} delay={0.1 + k * 0.1} />
              <Solid box={{ x: ROW.x0 + 2, y: y - 6, z: 8, w: ROW.w - 4, d: 12, h: 5 }} color={M.soil} delay={0.2 + k * 0.1} line={false} />
              <Draw d={seg([ROW.x0, y, PLANT.wire], [ROW.x0 + ROW.w, y, PLANT.wire]) + Array.from({ length: PLANT.n }, (_, i) => post(PLANT.x0 + i * PLANT.pitch, y, PLANT.z + PLANT.h - 2, PLANT.wire)).join("")} color={BAR} w="light" delay={0.3 + k * 0.1} dur={0.8} />
              <Rise delay={0.5 + k * 0.12} lift={6}>
                <g transform={at(PLANT.x0, y, PLANT.z)}>
                  {Array.from({ length: PLANT.n }, (_, i) => (
                    <use key={i} href={`#${id}-plant`} transform={at(i * PLANT.pitch, 0, 0)} />
                  ))}
                </g>
              </Rise>
              <Solid box={{ x: ROW.x0 + ROW.w - 1.2, y: y - 1.2, w: 2.4, d: 2.4, h: PLANT.wire }} tones={steel} delay={0.1 + k * 0.1} line={false} />
            </g>
          ))}
        </Part>

        {/* Pipe rail: sleepers and two steel pipes */}
        <Rise delay={0.4}>
          {Array.from({ length: 9 }, (_, k) => (
            <path key={k} d={seg([PIPE.x0 + 20 + k * 48, PIPE.y - PIPE.half - 3, 1], [PIPE.x0 + 20 + k * 48, PIPE.y + PIPE.half + 3, 1])} fill="none" stroke={M.steelDark} strokeLinecap="round" style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 1.8)" }} />
          ))}
        </Rise>
        <Draw d={seg([PIPE.x0, PIPE.y - PIPE.half, 2.2], [PIPE.x1, PIPE.y - PIPE.half, 2.2]) + seg([PIPE.x0, PIPE.y + PIPE.half, 2.2], [PIPE.x1, PIPE.y + PIPE.half, 2.2])} color={M.steel} w="heavy" delay={0.3} dur={1.1} />

        {/* Harvest trolley: wheels, deck, push handle at the left end, crates */}
        <Part i={1} active={active}>
          <Rise delay={0.7}>
            {WHEELS.map(([x, y], k) => (
              <path key={k} d={disc(x, y, 3.2, 3)} fill={M.black} />
            ))}
            <path d={WHEELS.map(([x, y]) => post(x, y, 3, TROLLEY.z)).join("")} fill="none" stroke={M.steelDark} style={{ strokeWidth: "var(--eco-ink, 1.2px)" }} />
          </Rise>
          <Solid box={TROLLEY} tones={steel} delay={0.6} />
          <Solid box={{ x: TROLLEY.x, y: TROLLEY.y + 3, z: TROLLEY.z + TROLLEY.h, w: 2.2, d: 2.2, h: 40 }} tones={steel} delay={0.9} line={false} />
          <Solid box={{ x: TROLLEY.x, y: TROLLEY.y + TROLLEY.d - 5.2, z: TROLLEY.z + TROLLEY.h, w: 2.2, d: 2.2, h: 40 }} tones={steel} delay={0.9} line={false} />
          <Solid box={{ x: TROLLEY.x - 0.2, y: TROLLEY.y + 3, z: TROLLEY.z + TROLLEY.h + 40, w: 2.6, d: TROLLEY.d - 6, h: 2.6 }} tones={steel} delay={1.1} line={false} />
        </Part>
        <Part i={0} active={active}>
          <g transform={at(TROLLEY.x + 4 + CRATE.w / 2, PIPE.y, TROLLEY.z + TROLLEY.h)}>
            <use href={`#${id}-full`} />
            <use href={`#${id}-full`} transform={at(0, 0, CRATE.h)} />
            <use href={`#${id}-full`} transform={at(CRATE.w + 2, 0, 0)} />
            <use href={`#${id}-empty`} transform={at(CRATE.w + 2, 0, CRATE.h)} />
          </g>
          {/* Empty crates stacked by the aisle, one full beside them */}
          <g transform={at(STACK.x, STACK.y, 0)}>
            {[0, 1, 2].map((k) => (
              <use key={k} href={`#${id}-empty`} transform={at(0, 0, CRATE.h * k)} />
            ))}
            <use href={`#${id}-full`} transform={at(CRATE.w + 4, 2, 0)} />
          </g>
        </Part>

        {/* Cut chrysanthemums in buckets: the flower line is harvested too */}
        <Part i={2} active={active}>
          <FlowerBucket cx={-170} cy={60} colors={[M.yellow, SW, M.yellow, M.pink]} h={14} delay={1} />
          <FlowerBucket cx={-184} cy={48} colors={[M.pink, M.yellow, SW]} h={13} delay={1.15} />
        </Part>

        {/* Unit: a young potted tomato arrives, a crate of fruit leaves. */}
        <Travel
          from={
            <>
              <Pot cx={0} cy={RAIL.y} r={5.5} h={9} delay={0} />
              <Tomato x={0} y={RAIL.y} z={9} h={16} fruit={0} />
            </>
          }
        >
          <g transform={at(0, RAIL.y, 0)}>
            <Crate fill="tomato" delay={0} />
          </g>
        </Travel>
      </Plate>
    </Static>
  );
}
