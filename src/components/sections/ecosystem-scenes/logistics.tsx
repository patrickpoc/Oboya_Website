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
  Static,
  Travel,
  accentFace,
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

// Dock: a faint door frame at the back, an AGV with a blue sensor arc towing a CC trolley of
// flower buckets toward the rail, and a second trolley parked by the door.
const DOCK = { x: -30, w: 140, y: -98, h: 66 };
const AGV: Box = { x: 86, y: -12, w: 60, d: 36, h: 12 };
const CC = { x: -4, y: -14, w: 70, d: 36, base: 6, h: 80, shelves: [30, 56] };
const PARKED = { x: -150, y: -56 };
const BUCKET = { r: 7.5, rb: 6, h: 17 };

/** CC (Danish) trolley: base on casters, four uprights, ledges. Returns paths around world (x, y). */
function trolleyPaths(x: number, y: number) {
  const { w, d, base, h } = CC;
  const uprights = [
    [x, y],
    [x + w, y],
    [x, y + d],
    [x + w, y + d],
  ]
    .map(([px, py]) => post(px, py, base + 4, base + h))
    .join("");
  const top = seg([x, y, base + h], [x + w, y, base + h]) + seg([x, y + d, base + h], [x + w, y + d, base + h]) + seg([x + w, y, base + h], [x + w, y + d, base + h]);
  const casters = [
    [x + 6, y + 5],
    [x + w - 6, y + 5],
    [x + 6, y + d - 5],
    [x + w - 6, y + d - 5],
  ]
    .map(([px, py]) => post(px, py, 1, base))
    .join("");
  return { uprights, top, casters, deck: { x, y, z: base, w, d, h: 4 } as Box };
}
const shelf = (x: number, y: number, z: number): Box => ({ x: x + 1, y: y + 1, z, w: CC.w - 2, d: CC.d - 2, h: 2 });
const TOW = trolleyPaths(CC.x, CC.y);
const PARK = trolleyPaths(PARKED.x, PARKED.y);

/** Flower bucket with stems and heads, drawn around the origin. */
const bucket = cylinder(0, 0, BUCKET.r, BUCKET.h, 0, BUCKET.rb);
const bucketBody = cylinderBody(0, 0, BUCKET.r, BUCKET.h, 0, BUCKET.rb);
const bucketTop = disc(0, 0, BUCKET.r, BUCKET.h);
const STEMS_AT: [number, number, number][] = [
  [-2.5, 1.2, 8],
  [0.5, -2, 11],
  [2.5, 1.6, 7],
  [-0.5, 1, 13],
];
const stems = STEMS_AT.map(([x, y, dz]) => `M${iso(0, 0, BUCKET.h - 3).join(" ")}L${iso(x, y, BUCKET.h + dz).join(" ")}`).join("");
const heads = STEMS_AT.map(([x, y, dz]) => disc(x, y, 2.6, BUCKET.h + dz));

/** Horizontal arc on the ground around (cx, cy): polyline sampled on the iso projection. */
function arc(cx: number, cy: number, r: number, z: number, a0: number, a1: number, n = 10) {
  const pts: string[] = [];
  for (let k = 0; k <= n; k++) {
    const a = a0 + ((a1 - a0) * k) / n;
    pts.push(iso(cx + r * Math.cos(a), cy + r * Math.sin(a), z).join(" "));
  }
  return `M${pts.join("L")}`;
}
// The AGV drives along +x; its sensor sweeps ahead of the front face.
const FRONT = { x: AGV.x + AGV.w, y: AGV.y + AGV.d / 2 };
const SWEEP = [16, 28, 40].map((r) => arc(FRONT.x, FRONT.y, r, 2, -Math.PI * 0.42, Math.PI * 0.42));
const TOWBAR = seg([CC.x + CC.w, CC.y + CC.d / 2, 6], [AGV.x, AGV.y + AGV.d / 2, 6]);

/** Buckets on the towed trolley: three per level, base and two shelves. */
const LEVELS = [CC.base + 4, ...CC.shelves.map((z) => z + 2)];
const SLOTS: [number, number][] = [
  [CC.x + 12, CC.y + CC.d / 2],
  [CC.x + 35, CC.y + CC.d / 2],
  [CC.x + 58, CC.y + CC.d / 2],
];

const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};
const W_INK = { strokeWidth: "var(--eco-ink, 1.2px)" } as const;
const W_LIGHT = { strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" } as const;

/** The unit: a low trolley deck with three buckets. */
const UNIT_DECK: Box = { x: -24, y: RAIL.y - 10, z: 3, w: 48, d: 20, h: 3 };

export function Logistics({ st, active }: SceneProps) {
  const id = useId();
  const bucketId = `${id}-bucket`;
  return (
    <Static st={st}>
      <Plate>
        <defs>
          <g id={bucketId}>
            <Fade delay={1.3} dur={0.5}>
              <path d={bucketBody} fill={accentFace("blueLight", 34)} />
              <path d={bucketTop} fill={FACE.left} />
            </Fade>
            <Draw d={bucket} delay={1} dur={0.7} w="light" />
            <Draw d={stems} color={ACCENT.green} delay={1.5} dur={0.4} w="light" />
            <Fade delay={1.8} dur={0.4}>
              {heads.map((d, k) => (
                <path key={k} d={d} fill={ACCENT.yellowLight} />
              ))}
            </Fade>
          </g>
        </defs>

        {/* Dock door: faint frame and leaf, leveller plate on the ground */}
        <Fade delay={0.4} dur={0.8}>
          <path d={`M${iso(DOCK.x, DOCK.y, 0).join(" ")}L${iso(DOCK.x + DOCK.w, DOCK.y, 0).join(" ")}L${iso(DOCK.x + DOCK.w, DOCK.y, DOCK.h).join(" ")}L${iso(DOCK.x, DOCK.y, DOCK.h).join(" ")}Z`} fill={FACE.right} />
          <path d={plane(DOCK.x + 10, DOCK.y, DOCK.w - 20, 26)} fill={FACE.left} />
        </Fade>
        <Draw d={post(DOCK.x, DOCK.y, 0, DOCK.h) + seg([DOCK.x, DOCK.y, DOCK.h], [DOCK.x + DOCK.w, DOCK.y, DOCK.h]) + post(DOCK.x + DOCK.w, DOCK.y, 0, DOCK.h)} color={CONSTRUCTION} delay={0} dur={1.2} />
        <Draw d={post(DOCK.x - 6, DOCK.y, 0, DOCK.h + 6) + seg([DOCK.x - 6, DOCK.y, DOCK.h + 6], [DOCK.x + DOCK.w + 6, DOCK.y, DOCK.h + 6]) + post(DOCK.x + DOCK.w + 6, DOCK.y, 0, DOCK.h + 6)} w="light" delay={0.2} dur={1.2} />
        <Draw d={[0.2, 0.4, 0.6, 0.8].map((f) => seg([DOCK.x, DOCK.y, DOCK.h * f], [DOCK.x + DOCK.w, DOCK.y, DOCK.h * f])).join("")} color={CONSTRUCTION} w="light" delay={0.8} dur={0.8} opacity={0.6} />
        <Draw d={plane(DOCK.x + 10, DOCK.y, DOCK.w - 20, 26)} color={CONSTRUCTION} w="light" delay={0.9} dur={0.6} />

        {/* Parked trolley by the door */}
        <Part i={0} active={active}>
          <Draw d={PARK.casters} w="light" delay={0.6} dur={0.3} />
          <IsoBox box={PARK.deck} delay={0.5} dur={0.8} inner={false} top={FACE.soft} />
          <Draw d={PARK.uprights + PARK.top} delay={0.9} dur={0.9} w="light" />
          {CC.shelves.map((z, k) => (
            <IsoBox key={z} box={shelf(PARKED.x, PARKED.y, z)} delay={1.2 + k * 0.15} dur={0.6} inner={false} top={FACE.soft} />
          ))}
        </Part>

        {/* Towed CC trolley with buckets */}
        <Part i={1} active={active}>
          <Draw d={TOW.casters} w="light" delay={0.6} dur={0.3} />
          <IsoBox box={TOW.deck} delay={0.5} dur={0.8} w="heavy" inner={false} top={FACE.soft} />
          <Draw d={TOW.uprights + TOW.top} delay={0.9} dur={0.9} />
          {LEVELS.map((z, lvl) => (
            <g key={z}>
              {lvl > 0 ? <IsoBox box={shelf(CC.x, CC.y, CC.shelves[lvl - 1])} delay={1 + lvl * 0.15} dur={0.6} inner={false} top={FACE.soft} /> : null}
              {SLOTS.map(([bx, by], k) => (
                <use key={k} href={`#${bucketId}`} transform={at(bx, by, z)} />
              ))}
            </g>
          ))}
        </Part>

        {/* AGV */}
        <Part i={2} active={active}>
          <Draw d={TOWBAR} w="light" delay={1.4} dur={0.4} />
          <IsoBox box={AGV} delay={0.7} dur={0.9} w="heavy" top={FACE.soft} />
          <Draw d={plane(AGV.x + 6, AGV.y + 6, AGV.w - 12, AGV.d - 12, AGV.h)} color={CONSTRUCTION} w="light" delay={1.3} dur={0.5} />
          <Fade delay={1.6} dur={0.4}>
            <circle cx={iso(AGV.x + AGV.w - 8, AGV.y + AGV.d / 2, AGV.h)[0]} cy={iso(AGV.x + AGV.w - 8, AGV.y + AGV.d / 2, AGV.h)[1]} r={2.6} fill={ACCENT.greenLight} />
            <circle cx={iso(FRONT.x, FRONT.y, 4)[0]} cy={iso(FRONT.x, FRONT.y, 4)[1]} r={2.2} fill={ACCENT.blueLight} />
          </Fade>
          {SWEEP.map((d, k) => (
            <Draw key={k} d={d} color={ACCENT.blueLight} w="light" delay={1.8 + k * 0.2} dur={0.6} opacity={0.8 - k * 0.22} />
          ))}
        </Part>

        {/* Unit: a bucket trolley rides the rail. */}
        <Travel>
          <Fade delay={0} dur={0.3}>
            <Faces box={UNIT_DECK} top={FACE.soft} />
          </Fade>
          <path d={boxOutline(UNIT_DECK)} fill="none" stroke={ACCENT.greenLight} strokeLinejoin="round" style={W_INK} />
          <path d={[-18, 18].map((dx) => post(dx, RAIL.y + 10, 0, 3) + post(dx, RAIL.y - 10, 0, 3)).join("")} fill="none" stroke={CONSTRUCTION} style={W_LIGHT} />
          {[-14, 0, 14].map((dx) => (
            <g key={dx} transform={at(dx, RAIL.y, 6)}>
              <path d={bucketBody} fill={accentFace("blueLight", 34)} />
              <path d={bucket} fill="none" stroke={ACCENT.greenLight} style={W_LIGHT} />
              <path d={stems} fill="none" stroke={ACCENT.green} style={W_LIGHT} />
              {heads.map((d, k) => (
                <path key={k} d={d} fill={ACCENT.yellowLight} />
              ))}
            </g>
          ))}
        </Travel>
      </Plate>
    </Static>
  );
}
