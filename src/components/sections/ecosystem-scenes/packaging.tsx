"use client";

import { useId } from "react";
import { Cyl, Dot, M, Rise, Solid, TomatoFruit, mix, tone } from "./flat-kit";
import { Part, Plate, RAIL, Static, Travel, at, faceX, faceY, plane, type Box, type SceneProps } from "./iso-kit";
import { Bag, Carton, Crate, Punnet, Sleeve } from "./packs";

/**
 * Packhouse line along x: a crate of tomatoes from the harvest is tipped onto a belt conveyor
 * (72 cm high, steel frame), the fruit runs through a white flow-wrap machine with a film reel,
 * punnets come out and pass a label applicator; bagged lettuce, a sleeved bunch and a carton wait
 * at the end of the line. Painter's order: belt and infeed, machine (it straddles the belt), the
 * outputs in front of its right face, then the applicator arm and head above them.
 */
const BELT = { x: -180, y: -52, z: 30, w: 360, d: 30, h: 6 } satisfies Box;
const TOP = BELT.z + BELT.h;
const MID = BELT.y + BELT.d / 2;
const LEG_X = [-172, -62, 48, 168];
const MACHINE: Box = { x: -80, y: -64, w: 70, d: 54, h: 76 };
const REEL = { x: MACHINE.x + 20, y: MACHINE.y + 27, r: 9, h: 6, z: MACHINE.h };
const ARM = { x: 72, y0: -84, z: 68 };
const HEAD = { x: ARM.x - 6, y: MID - 6, z: TOP + 12, w: 12, d: 12, h: 8 } satisfies Box;
const SW = "var(--oboya-soft-white)";
const INFEED: [number, number][] = [
  [-134, 10],
  [-126, 20],
  [-118, 8],
  [-110, 17],
  [-100, 12],
  [-92, 21],
];

export function Packaging({ st, active }: SceneProps) {
  const id = useId();
  const steel = tone(M.steel);
  return (
    <Static st={st}>
      <Plate>
        <defs>
          <g id={`${id}-punnet`}>
            <Punnet delay={1.2} />
          </g>
        </defs>

        {/* Belt conveyor: legs, frame, belt surface with side guides */}
        {LEG_X.map((x) => (
          <Solid key={`a${x}`} box={{ x: x - 1.5, y: BELT.y + 3, w: 3, d: 3, h: BELT.z }} tones={steel} delay={0} line={false} />
        ))}
        {LEG_X.map((x) => (
          <Solid key={`b${x}`} box={{ x: x - 1.5, y: BELT.y + BELT.d - 6, w: 3, d: 3, h: BELT.z }} tones={steel} delay={0.05} line={false} />
        ))}
        <Solid box={BELT} tones={steel} delay={0.1} shadow={0.25} />
        <Rise delay={0.4} dur={0.4}>
          <path d={plane(BELT.x, BELT.y + 3, BELT.w, BELT.d - 6, TOP + 0.2)} fill={M.steelDark} />
          <path d={faceY(BELT.x, BELT.y + BELT.d, TOP, BELT.w, 1.6)} fill={steel.top} />
        </Rise>

        {/* Infeed: a crate tipped at the start of the belt, fruit rolling toward the machine */}
        <g transform={at(-160, MID, TOP)}>
          <Crate fill="tomato" delay={0.6} />
        </g>
        <Rise delay={0.9} lift={4}>
          {INFEED.map(([x, dy], k) => (
            <TomatoFruit key={k} at={[x, BELT.y + dy, TOP + 2.2]} r={2.4} />
          ))}
        </Rise>

        {/* Flow-wrap machine: white housing over the belt, tunnel on the out side, blue control panel, film reel */}
        <Solid box={MACHINE} color={M.white} delay={0.5} shadow={0.25} />
        <Rise delay={0.9} dur={0.4}>
          <path d={faceX(MACHINE.x + MACHINE.w, BELT.y + 2, TOP - 4, BELT.d - 4, 16)} fill={mix(M.steelDark, 70)} />
          <path d={faceY(MACHINE.x + 8, MACHINE.y + MACHINE.d, 54, 24, 14)} fill={M.blue} />
          <path d={faceY(MACHINE.x + 10.5, MACHINE.y + MACHINE.d, 58, 19, 7)} fill={mix(M.blueLight, 60, SW)} />
          <Dot at={[MACHINE.x + 42, MACHINE.y + MACHINE.d, 64]} r={1.8} fill={M.leafLight} />
          <Dot at={[MACHINE.x + 49, MACHINE.y + MACHINE.d, 64]} r={1.8} fill={M.fruit} />
          <path d={faceY(MACHINE.x + 6, MACHINE.y + MACHINE.d, 6, MACHINE.w - 12, 2)} fill={steel.right} />
          <path d={faceY(MACHINE.x + 6, MACHINE.y + MACHINE.d, 12, MACHINE.w - 12, 30)} fill="none" stroke={tone(M.white).line} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.6)" }} />
        </Rise>
        <Cyl cx={REEL.x} cy={REEL.y} z={REEL.z} r={REEL.r} h={REEL.h} color={M.white} delay={1.1} shadow={false} />
        <Rise delay={1.2} dur={0.3}>
          <path d={plane(REEL.x - 2.5, REEL.y - 2.5, 5, 5, REEL.z + REEL.h + 0.2)} fill={steel.right} />
        </Rise>

        {/* Outputs: punnets of cherry tomatoes */}
        <Part i={0} active={active}>
          <g transform={at(10, MID, TOP)}>
            <use href={`#${id}-punnet`} />
            <use href={`#${id}-punnet`} transform={at(22, 0, 0)} />
            <use href={`#${id}-punnet`} transform={at(44, 0, 0)} />
          </g>
          <g transform={at(ARM.x, MID, TOP)}>
            <use href={`#${id}-punnet`} />
          </g>
        </Part>

        {/* Bags, sleeves and a carton at the end of the line */}
        <Part i={1} active={active}>
          <g transform={at(104, MID - 2, TOP)}>
            <Bag delay={1.4} />
          </g>
          <g transform={at(128, MID + 2, TOP)}>
            <Sleeve delay={1.5} colors={[M.pink, M.yellow, M.pink]} />
          </g>
          <g transform={at(154, MID - 1, TOP)}>
            <Carton delay={1.6} />
          </g>
        </Part>

        {/* Label applicator: column behind the belt, arm over it, blue head, label leaving the head */}
        <Part i={2} active={active}>
          <Solid box={{ x: ARM.x - 3, y: ARM.y0 - 3, w: 6, d: 6, h: ARM.z }} tones={steel} delay={1} />
          <Solid box={{ x: ARM.x - 2, y: ARM.y0, z: ARM.z - 4, w: 4, d: MID - ARM.y0, h: 4 }} tones={steel} delay={1.2} />
          <Solid box={{ x: ARM.x - 1.5, y: MID - 1.5, z: HEAD.z + HEAD.h, w: 3, d: 3, h: ARM.z - 4 - HEAD.z - HEAD.h }} tones={steel} delay={1.3} line={false} />
          <Solid box={HEAD} color={M.blue} dark delay={1.4} />
          <Rise delay={1.9} lift={3} dur={0.4}>
            <path d={plane(HEAD.x + 3, HEAD.y + 3, 6, 5, HEAD.z - 3.5)} fill={SW} />
            <path d={plane(HEAD.x + 3.6, HEAD.y + 3.6, 4.8, 1.4, HEAD.z - 3.4)} fill={M.leaf} />
            <Dot at={[ARM.x + 6, MID - 6, HEAD.z + HEAD.h - 2]} r={1.6} fill={M.blueLight} />
          </Rise>
        </Part>

        {/* Unit: a crate of tomatoes arrives, a labelled punnet leaves. */}
        <Travel
          from={
            <g transform={at(0, RAIL.y, 0)}>
              <Crate fill="tomato" delay={0} />
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
