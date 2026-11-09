"use client";

import { useId } from "react";
import {
  ACCENT,
  CONSTRUCTION,
  Draw,
  FACE,
  Faces,
  Fade,
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
  disc,
  iso,
  post,
  seg,
  type Box,
  type SceneProps,
} from "./iso-kit";

// Three receding crop hedges along x with produce, a pipe rail in front of them carrying a
// harvest trolley with stacked slotted crates, and a stack of empty crates at the front-right.
const HEDGE = { x0: -190, w: 380, d: 16, h: 38 };
const HEDGE_Y = [-100, -68, -36];
const PIPE = { y: 2, half: 5, x0: -200, x1: 200 };
const TROLLEY = { x: -40, w: 64, d: 28, z: 9, h: 4 };
const CRATE: Box = { x: 0, y: 0, w: 28, d: 22, h: 13 };
const STACK = { x: 118, y: 40 };

/** Hedge foliage: scalloped line along the front face at height z. */
function hedgeTop(y: number, z = HEDGE.h) {
  const parts: string[] = [];
  for (let x = HEDGE.x0; x < HEDGE.x0 + HEDGE.w; x += 20) {
    const [ax, ay] = iso(x, y, z);
    const [bx, by] = iso(x + 20, y, z);
    const [mx, my] = iso(x + 10, y, z + 6);
    parts.push(`M${ax} ${ay}Q${mx} ${my} ${bx} ${by}`);
  }
  return parts.join("");
}
/** Stakes along the front of the hedge and the training wire they carry. */
function hedgeWires(y: number) {
  const parts: string[] = [];
  for (let x = HEDGE.x0 + 20; x < HEDGE.x0 + HEDGE.w; x += 60) parts.push(post(x, y, 0, HEDGE.h + 10));
  parts.push(seg([HEDGE.x0, y, HEDGE.h + 10], [HEDGE.x0 + HEDGE.w, y, HEDGE.h + 10]));
  return parts.join("");
}
const fruit = (y: number) => {
  const pts: [number, number][] = [];
  for (let k = 0; k < 14; k++) {
    const x = HEDGE.x0 + 14 + k * 27 + ((k * 7) % 3) * 3;
    const z = 8 + ((k * 5) % 3) * 9;
    pts.push(iso(x, y + HEDGE.d, z));
  }
  return pts;
};

/** Crate: slotted sides (short verticals on both visible faces). */
function crateSlots({ x, y, w, d, h, z = 0 }: Box) {
  const parts: string[] = [];
  for (let k = 1; k < 5; k++) parts.push(post(x + (w * k) / 5, y + d, z + 3, z + h - 4));
  for (let k = 1; k < 4; k++) parts.push(post(x + w, y + (d * k) / 4, z + 3, z + h - 4));
  return parts.join("");
}
const CRATE_SLOTS = crateSlots(CRATE);
const produceDots = (b: Box) => {
  const z = (b.z ?? 0) + b.h + 1;
  return [
    [0.2, 0.28],
    [0.46, 0.22],
    [0.72, 0.3],
    [0.3, 0.56],
    [0.56, 0.5],
    [0.8, 0.6],
    [0.42, 0.78],
    [0.68, 0.8],
  ].map(([fx, fy]) => disc(b.x + b.w * fx, b.y + b.d * fy, 1.9, z));
};

const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};
const W_INK = { strokeWidth: "var(--eco-ink, 1.2px)" } as const;
const W_LIGHT = { strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" } as const;

const TROLLEY_BOX: Box = { x: TROLLEY.x, y: PIPE.y - TROLLEY.d / 2, z: TROLLEY.z, w: TROLLEY.w, d: TROLLEY.d, h: TROLLEY.h };
const WHEELS: [number, number][] = [
  [TROLLEY.x + 8, PIPE.y - PIPE.half],
  [TROLLEY.x + TROLLEY.w - 8, PIPE.y - PIPE.half],
  [TROLLEY.x + 8, PIPE.y + PIPE.half],
  [TROLLEY.x + TROLLEY.w - 8, PIPE.y + PIPE.half],
];

export function Harvest({ st, active }: SceneProps) {
  const id = useId().replace(/:/g, "");
  const crateId = `${id}-crate`;
  const fullId = `${id}-full`;
  return (
    <Static st={st}>
      <Plate>
        <defs>
          <g id={crateId}>
            <Fade delay={1} dur={0.5}>
              <Faces box={CRATE} top={FACE.soft} />
            </Fade>
            <Draw d={boxOutline(CRATE)} delay={0.7} dur={0.7} />
            <Draw d={boxInner(CRATE)} delay={0.9} dur={0.5} w="light" />
            <Draw d={CRATE_SLOTS} color={CONSTRUCTION} w="light" delay={1.2} dur={0.5} />
          </g>
          <g id={fullId}>
            <use href={`#${crateId}`} />
            <Fade delay={1.6} dur={0.4}>
              {produceDots(CRATE).map((d, k) => (
                <path key={k} d={d} fill={ACCENT.orange} />
              ))}
            </Fade>
          </g>
        </defs>

        {/* Crop hedges, back to front */}
        <Part i={2} active={active}>
          {HEDGE_Y.map((y, k) => {
            const box: Box = { x: HEDGE.x0, y, w: HEDGE.w, d: HEDGE.d, h: HEDGE.h };
            return (
              <g key={y}>
                <IsoBox box={box} delay={0.2 + k * 0.15} dur={1} inner={false} top={accentFace("green", 26)} left={accentFace("green", 15)} right={accentFace("green", 10)} />
                <Draw d={hedgeWires(y + HEDGE.d + 1)} color={CONSTRUCTION} w="light" delay={0.6 + k * 0.15} dur={0.8} opacity={0.5} />
                <Draw d={hedgeTop(y + HEDGE.d) + hedgeTop(y + HEDGE.d, HEDGE.h * 0.62) + hedgeTop(y + HEDGE.d, HEDGE.h * 0.28)} color={ACCENT.green} w="light" delay={0.9 + k * 0.15} dur={1} opacity={0.85} />
                <Fade delay={1.5 + k * 0.15} dur={0.5}>
                  {fruit(y).map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r={2.1} fill={ACCENT.orange} />
                  ))}
                </Fade>
              </g>
            );
          })}
        </Part>

        {/* Pipe rail */}
        <Draw d={seg([PIPE.x0, PIPE.y - PIPE.half], [PIPE.x1, PIPE.y - PIPE.half]) + seg([PIPE.x0, PIPE.y + PIPE.half], [PIPE.x1, PIPE.y + PIPE.half])} delay={0.3} dur={1.2} />
        <Draw d={Array.from({ length: 9 }, (_, k) => seg([PIPE.x0 + 20 + k * 45, PIPE.y - PIPE.half - 3], [PIPE.x0 + 20 + k * 45, PIPE.y + PIPE.half + 3])).join("")} color={CONSTRUCTION} w="light" delay={0.9} dur={0.6} />

        {/* Trolley with crates */}
        <Part i={1} active={active}>
          <Fade delay={0.9} dur={0.4}>
            {WHEELS.map(([x, y], k) => (
              <path key={k} d={disc(x, y, 3.2, 2)} fill={FACE.soft} />
            ))}
          </Fade>
          <Draw d={WHEELS.map(([x, y]) => post(x, y, 2, TROLLEY.z)).join("")} w="light" delay={0.8} dur={0.4} />
          <IsoBox box={TROLLEY_BOX} delay={0.6} dur={0.9} w="heavy" inner={false} top={FACE.soft} />
          {/* Push handle at the back end */}
          <Draw
            d={
              post(TROLLEY.x, PIPE.y - TROLLEY.d / 2 + 4, TROLLEY.z + TROLLEY.h, TROLLEY.z + 40) +
              post(TROLLEY.x, PIPE.y + TROLLEY.d / 2 - 4, TROLLEY.z + TROLLEY.h, TROLLEY.z + 40) +
              seg([TROLLEY.x, PIPE.y - TROLLEY.d / 2 + 4, TROLLEY.z + 40], [TROLLEY.x, PIPE.y + TROLLEY.d / 2 - 4, TROLLEY.z + 40])
            }
            delay={1.1}
            dur={0.6}
          />
        </Part>
        <Part i={0} active={active}>
          {/* Two columns, two high: lower crates full, top ones being filled */}
          <g transform={at(TROLLEY.x + 4, PIPE.y - CRATE.d / 2, TROLLEY.z + TROLLEY.h)}>
            <Repeat href={`#${fullId}`} n={2} dx={30} />
          </g>
          <g transform={at(TROLLEY.x + 4, PIPE.y - CRATE.d / 2, TROLLEY.z + TROLLEY.h + CRATE.h)}>
            <use href={`#${fullId}`} />
            <use href={`#${crateId}`} transform={at(30, 0, 0)} />
          </g>
          {/* Empty crates stacked at the front-right */}
          <g transform={at(STACK.x, STACK.y, 0)}>
            {[0, 1, 2].map((k) => (
              <use key={k} href={`#${crateId}`} transform={at(0, 0, CRATE.h * k)} />
            ))}
          </g>
          <g transform={at(STACK.x + 34, STACK.y + 2, 0)}>
            <use href={`#${fullId}`} />
          </g>
        </Part>

        {/* Unit: a full crate rides the rail. */}
        <Travel>
          <g transform={at(-CRATE.w / 2, RAIL.y - CRATE.d / 2, 0)}>
            <Fade delay={0} dur={0.3}>
              <Faces box={CRATE} top={FACE.soft} />
              {produceDots(CRATE).map((d, k) => (
                <path key={k} d={d} fill={ACCENT.orange} />
              ))}
            </Fade>
            <path d={boxOutline(CRATE)} fill="none" stroke={ACCENT.greenLight} strokeLinejoin="round" style={W_INK} />
            <path d={boxInner(CRATE) + CRATE_SLOTS} fill="none" stroke={CONSTRUCTION} style={W_LIGHT} />
          </g>
        </Travel>
      </Plate>
    </Static>
  );
}
