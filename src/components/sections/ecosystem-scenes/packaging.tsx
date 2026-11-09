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
import { Bag, Carton, Clamshell, Sleeve } from "./packs";

// Packing line along x: belt with roller ticks, loose produce in, a wireframe flow-wrap machine
// mid-way, finished packs out, and a label applicator arm over the exit end.
const BELT = { x: -180, y: -46, z: 12, w: 360, d: 34, h: 8 } satisfies Box;
const BELT_TOP = BELT.z + BELT.h;
const MACHINE = { x: -86, y: -58, z: BELT_TOP, w: 84, d: 58, h: 46 } satisfies Box;
const REEL = { x: MACHINE.x + 42, y: MACHINE.y + 29, r: 10, h: 7, z: MACHINE.z + MACHINE.h };
const ARM = { x: 120, y0: -88, z: 64, head: { x: 111, y: -37, z: 44, w: 18, d: 16, h: 10 } };
const OUT_Y = BELT.y + BELT.d / 2;

function beltLegs() {
  return [BELT.x + 10, BELT.x + BELT.w / 2, BELT.x + BELT.w - 10]
    .map((x) => post(x, BELT.y + 2, 0, BELT.z) + post(x, BELT.y + BELT.d - 2, 0, BELT.z))
    .join("");
}
function rollerTicks() {
  const parts: string[] = [];
  for (let x = BELT.x + 10; x < BELT.x + BELT.w; x += 20) parts.push(seg([x, BELT.y + 2, BELT_TOP], [x, BELT.y + BELT.d - 2, BELT_TOP]));
  return parts.join("");
}
/** Belt edge rails and the end rollers. */
const beltRails =
  seg([BELT.x, BELT.y, BELT_TOP + 2], [BELT.x + BELT.w, BELT.y, BELT_TOP + 2]) +
  seg([BELT.x, BELT.y + BELT.d, BELT_TOP + 2], [BELT.x + BELT.w, BELT.y + BELT.d, BELT_TOP + 2]);

/** Machine internals: film path, pinch rollers, a cut-off blade line. */
function machineInner() {
  const { x, y, z, w, d, h } = MACHINE;
  const cx = x + w / 2;
  return (
    // film from reel down into the former
    seg([cx, y + 29, z + h], [cx - 10, y + 29, z + 26]) +
    seg([cx - 10, y + 29, z + 26], [cx + 6, y + 12, z + 26]) +
    // forming tube along the belt
    plane(x + 12, y + 16, w - 24, 24, z + 18) +
    // mid-height frame
    seg([x, y, z + h / 2], [x + w, y, z + h / 2]) +
    seg([x + w, y, z + h / 2], [x + w, y + d, z + h / 2]) +
    seg([x, y + d, z + h / 2], [x + w, y + d, z + h / 2]) +
    // blade
    seg([x + w - 10, y + 10, z + 8], [x + w - 10, y + d - 10, z + 8])
  );
}
const INNER = machineInner();

const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};
/** Place and enlarge a pack (scaled about the world origin it is drawn around). */
const big = (x: number, y: number, z: number, k = 1.25) => `${at(x, y, z)} translate(${ox} ${oy}) scale(${k}) translate(${-ox} ${-oy})`;

/** Loose produce on the infeed: orange dots scattered on the belt. */
const INFEED = [
  [-166, 10],
  [-154, 22],
  [-144, 8],
  [-134, 18],
  [-120, 12],
  [-108, 24],
  [-98, 9],
].map(([dx, dy]) => disc(dx, BELT.y + dy, 3, BELT_TOP + 0.5));

export function Packaging({ st, active }: SceneProps) {
  const id = useId();
  const clamId = `${id}-clam`;
  return (
    <Static st={st}>
      <Plate>
        <defs>
          <g id={clamId}>
            <Clamshell delay={1.4} />
          </g>
        </defs>

        {/* Belt */}
        <Draw d={beltLegs()} color={CONSTRUCTION} w="light" delay={0} dur={0.8} />
        <IsoBox box={BELT} delay={0.1} dur={1.2} w="heavy" inner={false} top={FACE.soft} />
        <Draw d={rollerTicks()} color={CONSTRUCTION} w="light" delay={0.9} dur={0.9} opacity={0.8} />
        <Draw d={beltRails} w="light" delay={0.6} dur={1.1} />
        <Fade delay={1.3} dur={0.5}>
          {INFEED.map((d, k) => (
            <path key={k} d={d} fill={ACCENT.orange} />
          ))}
        </Fade>

        {/* Outputs, left of the machine exit toward the arm: clamshells, bags, sleeves, cartons */}
        <Part i={0} active={active}>
          <g transform={big(18, OUT_Y, BELT_TOP)}>
            <Repeat href={`#${clamId}`} n={2} dx={22} />
          </g>
        </Part>
        <Part i={1} active={active}>
          <g transform={big(74, OUT_Y - 6, BELT_TOP)}>
            <Bag delay={1.5} />
          </g>
          <g transform={big(150, OUT_Y + 6, BELT_TOP)}>
            <Sleeve delay={1.6} />
          </g>
          <g transform={big(170, OUT_Y - 5, BELT_TOP)}>
            <Carton delay={1.7} />
          </g>
        </Part>

        {/* Flow-wrap machine: wireframe, no faces */}
        <Draw d={boxOutline(MACHINE)} delay={0.5} dur={1.1} />
        <Draw d={boxInner(MACHINE)} w="light" delay={0.8} dur={0.7} />
        <Draw d={INNER} color={CONSTRUCTION} w="light" delay={1.1} dur={1} />
        <Fade delay={1.5} dur={0.5}>
          <path d={cylinderBody(REEL.x, REEL.y, REEL.r, REEL.h, REEL.z)} fill={FACE.left} />
          <path d={disc(REEL.x, REEL.y, REEL.r, REEL.z + REEL.h)} fill={FACE.soft} />
        </Fade>
        <Draw d={cylinder(REEL.x, REEL.y, REEL.r, REEL.h, REEL.z) + disc(REEL.x, REEL.y, 3, REEL.z + REEL.h)} delay={1.3} dur={0.7} w="light" />
        <Fade delay={2}>
          {[0.25, 0.5, 0.75].map((f) => {
            const [cx, cy] = iso(MACHINE.x + MACHINE.w * f, MACHINE.y, MACHINE.z + MACHINE.h - 6);
            return <circle key={f} cx={cx} cy={cy} r={2} fill={f === 0.5 ? ACCENT.greenLight : ACCENT.blueLight} />;
          })}
        </Fade>

        {/* Label applicator: column at the back, arm over the belt, head above the pack */}
        <Part i={2} active={active}>
          <Fade delay={1.4}>
            <path d={plane(ARM.x - 8, ARM.y0 - 8, 16, 16)} fill={FACE.left} />
          </Fade>
          <Draw d={post(ARM.x, ARM.y0, 0, ARM.z) + seg([ARM.x, ARM.y0, ARM.z], [ARM.x, ARM.head.y + ARM.head.d / 2, ARM.z]) + post(ARM.x, ARM.head.y + ARM.head.d / 2, ARM.head.z + ARM.head.h, ARM.z)} delay={1.2} dur={1} />
          <IsoBox box={ARM.head} delay={1.7} dur={0.6} top={FACE.soft} />
          {/* The label leaving the head and the one already on the pack */}
          <Fade delay={2.3} dur={0.4}>
            <path d={plane(ARM.head.x + 4, ARM.head.y + 4, 10, 8, ARM.head.z - 6)} fill={FACE.soft} />
            <path d={plane(ARM.head.x + 5, ARM.head.y + 5, 8, 6, BELT_TOP + 10.2)} fill={FACE.soft} />
          </Fade>
          <Draw d={post(ARM.head.x + 9, ARM.head.y + 8, BELT_TOP + 12, ARM.head.z)} color={ACCENT.blueLight} w="light" delay={2.1} dur={0.4} opacity={0.8} />
          <Fade delay={2.4}>
            <circle cx={iso(ARM.x, ARM.head.y + ARM.head.d / 2 - 10, ARM.z)[0]} cy={iso(ARM.x, ARM.head.y + ARM.head.d / 2 - 10, ARM.z)[1]} r={2.4} fill={ACCENT.blueLight} />
          </Fade>
        </Part>
        <Part i={2} active={active}>
          <g transform={big(ARM.head.x + 9, ARM.head.y + 8, BELT_TOP)}>
            <use href={`#${clamId}`} />
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
