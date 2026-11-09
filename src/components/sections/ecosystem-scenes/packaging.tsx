"use client";

import { useId } from "react";
import { Dot, M, Rise, Solid, mix, tone } from "./flat-kit";
import { Draw, P, Part, Plate, RAIL, Repeat, Static, Travel, cylinder, cylinderBody, disc, iso, plane, post, seg, type Box, type SceneProps } from "./iso-kit";
import { Bag, Carton, Clamshell, Sleeve } from "./packs";

// Packhouse line along x: a belt conveyor on legs carrying loose strawberries into a flow-wrap
// machine with a housing and film reel; finished packs come out and pass a label applicator.
const BELT = { x: -180, y: -46, z: 12, w: 360, d: 34, h: 8 } satisfies Box;
const BELT_TOP = BELT.z + BELT.h;
const MACHINE = { x: -86, y: -58, z: BELT_TOP - 2, w: 84, d: 58, h: 44 } satisfies Box;
const REEL = { x: MACHINE.x + 42, y: MACHINE.y + 30, r: 10, h: 7, z: MACHINE.z + MACHINE.h };
const ARM = { x: 122, y0: -88, z: 62, head: { x: 112, y: -37, z: 42, w: 18, d: 16, h: 10 } satisfies Box };
const OUT_Y = BELT.y + BELT.d / 2;
const SW = "var(--oboya-soft-white)";

const legs = [BELT.x + 10, BELT.x + BELT.w / 2, BELT.x + BELT.w - 10]
  .map((x) => post(x, BELT.y + 3, 0, BELT.z) + post(x, BELT.y + BELT.d - 3, 0, BELT.z) + seg([x, BELT.y + 3, 6], [x, BELT.y + BELT.d - 3, 6]))
  .join("");
const rollers = (() => {
  const parts: string[] = [];
  for (let x = BELT.x + 10; x < BELT.x + BELT.w; x += 18) parts.push(seg([x, BELT.y + 2, BELT_TOP + 0.3], [x, BELT.y + BELT.d - 2, BELT_TOP + 0.3]));
  return parts.join("");
})();
const INFEED = [
  [-166, 10],
  [-156, 22],
  [-146, 8],
  [-138, 18],
  [-124, 12],
  [-112, 24],
  [-102, 9],
  [-150, 14],
].map(([dx, dy]) => [dx, BELT.y + dy] as [number, number]);

const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};
const big = (x: number, y: number, z: number, k = 1.25) => `${at(x, y, z)} translate(${ox} ${oy}) scale(${k}) translate(${-ox} ${-oy})`;
const faceY = (x: number, y: number, z: number, w: number, h: number) => `M${P(x, y, z)}L${P(x + w, y, z)}L${P(x + w, y, z + h)}L${P(x, y, z + h)}Z`;

export function Packaging({ st, active }: SceneProps) {
  const id = useId();
  const steel = tone(M.steel);
  return (
    <Static st={st}>
      <Plate>
        <defs>
          <g id={`${id}-clam`}>
            <Clamshell delay={1.2} />
          </g>
        </defs>

        {/* Belt conveyor */}
        <Draw d={legs} color={M.steelDark} delay={0} dur={0.8} />
        <Solid box={BELT} color={M.steel} delay={0.1} shadow={0.1} />
        <Rise delay={0.4}>
          <path d={plane(BELT.x, BELT.y + 2, BELT.w, BELT.d - 4, BELT_TOP + 0.2)} fill={M.black} />
          <path d={rollers} fill="none" stroke={mix(M.black, 70, SW)} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.6)" }} />
        </Rise>
        <Rise delay={0.9} lift={4}>
          {INFEED.map(([x, y], k) => (
            <g key={k}>
              <Dot at={[x, y, BELT_TOP + 2]} r={3.2} fill={M.fruit} />
              <Dot at={[x, y, BELT_TOP + 4.6]} r={1.2} fill={M.leaf} />
            </g>
          ))}
        </Rise>

        {/* Flow-wrap machine: white housing over the belt, blue control panel, film reel on top */}
        <Solid box={MACHINE} color={M.white} delay={0.5} />
        <Rise delay={0.9}>
          {/* tunnel openings in and out */}
          <path d={`M${P(MACHINE.x, MACHINE.y + 14, MACHINE.z + 2)}L${P(MACHINE.x, MACHINE.y + 44, MACHINE.z + 2)}L${P(MACHINE.x, MACHINE.y + 44, MACHINE.z + 16)}L${P(MACHINE.x, MACHINE.y + 14, MACHINE.z + 16)}Z`} fill={M.black} opacity={0.5} />
          <path d={`M${P(MACHINE.x + MACHINE.w, MACHINE.y + 14, MACHINE.z + 2)}L${P(MACHINE.x + MACHINE.w, MACHINE.y + 44, MACHINE.z + 2)}L${P(MACHINE.x + MACHINE.w, MACHINE.y + 44, MACHINE.z + 16)}L${P(MACHINE.x + MACHINE.w, MACHINE.y + 14, MACHINE.z + 16)}Z`} fill={M.black} opacity={0.6} />
          {/* control panel and status lights on the front face */}
          <path d={faceY(MACHINE.x + 8, MACHINE.y + MACHINE.d, MACHINE.z + 22, 26, 14)} fill={M.blue} />
          <path d={faceY(MACHINE.x + 11, MACHINE.y + MACHINE.d, MACHINE.z + 26, 20, 7)} fill={mix(M.blueLight, 55, SW)} />
          <Dot at={[MACHINE.x + 46, MACHINE.y + MACHINE.d, MACHINE.z + 32]} r={2} fill={M.leafLight} />
          <Dot at={[MACHINE.x + 54, MACHINE.y + MACHINE.d, MACHINE.z + 32]} r={2} fill={M.fruit} />
          <path d={faceY(MACHINE.x + 6, MACHINE.y + MACHINE.d, MACHINE.z + 4, MACHINE.w - 12, 2)} fill={steel.right} />
        </Rise>
        <Rise delay={1.1}>
          <path d={cylinderBody(REEL.x, REEL.y, REEL.r, REEL.h, REEL.z)} fill={steel.left} />
          <path d={disc(REEL.x, REEL.y, REEL.r, REEL.z + REEL.h)} fill={M.white} />
          <path d={disc(REEL.x, REEL.y, 3, REEL.z + REEL.h)} fill={steel.right} />
          <path d={cylinder(REEL.x, REEL.y, REEL.r, REEL.h, REEL.z)} fill="none" stroke={steel.line} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }} />
          <path d={`M${P(REEL.x - REEL.r, REEL.y, REEL.z + 3)}L${P(MACHINE.x + 20, MACHINE.y + 30, MACHINE.z + MACHINE.h)}`} fill="none" stroke={steel.line} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }} />
        </Rise>

        {/* Outputs: clamshells, bagged lettuce, flower sleeve, carton */}
        <Part i={0} active={active}>
          <g transform={big(20, OUT_Y, BELT_TOP)}>
            <Repeat href={`#${id}-clam`} n={2} dx={22} />
          </g>
        </Part>
        <Part i={1} active={active}>
          <g transform={big(76, OUT_Y - 5, BELT_TOP)}>
            <Bag delay={1.4} />
          </g>
          <g transform={big(152, OUT_Y + 6, BELT_TOP)}>
            <Sleeve delay={1.5} />
          </g>
          <g transform={big(170, OUT_Y - 6, BELT_TOP)}>
            <Carton delay={1.6} />
          </g>
        </Part>

        {/* Label applicator: steel column, arm, head over the pack, label leaving the head */}
        <Part i={2} active={active}>
          <Solid box={{ x: ARM.x - 4, y: ARM.y0 - 4, w: 8, d: 8, h: ARM.z }} color={M.steel} delay={1} />
          <Solid box={{ x: ARM.x - 3, y: ARM.y0, z: ARM.z - 5, w: 6, d: ARM.head.y + ARM.head.d / 2 - ARM.y0, h: 5 }} color={M.steel} delay={1.2} />
          <Draw d={post(ARM.x, ARM.head.y + ARM.head.d / 2, ARM.head.z + ARM.head.h, ARM.z - 5)} color={M.steelDark} delay={1.4} dur={0.3} />
          <Solid box={ARM.head} color={M.blue} delay={1.4} />
          <Rise delay={1.9} lift={4}>
            <path d={plane(ARM.head.x + 4, ARM.head.y + 4, 10, 8, ARM.head.z - 5)} fill={SW} stroke={steel.line} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.6)" }} />
            <path d={plane(ARM.head.x + 6, ARM.head.y + 5, 6, 2, ARM.head.z - 4.8)} fill={M.leaf} />
            <Dot at={[ARM.x, ARM.head.y + ARM.head.d / 2 - 9, ARM.z - 2]} r={2.2} fill={M.blueLight} />
          </Rise>
          <g transform={big(ARM.head.x + 9, ARM.head.y + 8, BELT_TOP)}>
            <use href={`#${id}-clam`} />
          </g>
        </Part>

        {/* Unit: a clamshell rides the rail. */}
        <Travel>
          <g transform={at(0, RAIL.y, 0)}>
            <Clamshell unit />
          </g>
        </Travel>
      </Plate>
    </Static>
  );
}
