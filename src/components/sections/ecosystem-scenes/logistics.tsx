"use client";

import { useId } from "react";
import { Cyl, Dot, M, Rise, Solid, Stems, mix, tone } from "./flat-kit";
import { Draw, P, Part, Plate, RAIL, Static, Travel, disc, iso, plane, post, seg, type Box, type SceneProps } from "./iso-kit";

// Loading dock: a roller door in a wall at the back, an AGV with a blue sensor sweep towing a
// Danish (CC) trolley full of flower buckets, and an empty CC trolley parked by the door.
const DOCK = { x: -30, w: 140, y: -98, h: 66 };
const AGV = { x: 86, y: -12, w: 60, d: 36, h: 12 } satisfies Box;
const CC = { x: -4, y: -14, w: 70, d: 36, base: 6, h: 80, shelves: [30, 56] };
const PARKED = { x: -150, y: -56 };
const BUCKET = { r: 7.5, rb: 6, h: 17 };
const SW = "var(--oboya-soft-white)";

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
  const top = seg([x, y, base + h], [x + w, y, base + h]) + seg([x, y + d, base + h], [x + w, y + d, base + h]) + seg([x + w, y, base + h], [x + w, y + d, base + h]) + seg([x, y, base + h], [x, y + d, base + h]);
  const casters: [number, number][] = [
    [x + 6, y + 5],
    [x + w - 6, y + 5],
    [x + 6, y + d - 5],
    [x + w - 6, y + d - 5],
  ];
  return { uprights, top, casters, deck: { x, y, z: base, w, d, h: 4 } as Box };
}
const shelf = (x: number, y: number, z: number): Box => ({ x: x + 1, y: y + 1, z, w: CC.w - 2, d: CC.d - 2, h: 2 });
const TOW = trolleyPaths(CC.x, CC.y);
const PARK = trolleyPaths(PARKED.x, PARKED.y);

function arc(cx: number, cy: number, r: number, z: number, a0: number, a1: number, n = 10) {
  const pts: string[] = [];
  for (let k = 0; k <= n; k++) {
    const a = a0 + ((a1 - a0) * k) / n;
    pts.push(iso(cx + r * Math.cos(a), cy + r * Math.sin(a), z).join(" "));
  }
  return `M${pts.join("L")}`;
}
const FRONT = { x: AGV.x + AGV.w, y: AGV.y + AGV.d / 2 };
const SWEEP = [16, 28, 40].map((r) => arc(FRONT.x, FRONT.y, r, 2, -Math.PI * 0.42, Math.PI * 0.42));
const TOWBAR = seg([CC.x + CC.w, CC.y + CC.d / 2, 6], [AGV.x, AGV.y + AGV.d / 2, 6]);
const LEVELS = [CC.base + 4, ...CC.shelves.map((z) => z + 2)];
const SLOTS: [number, number][] = [
  [CC.x + 12, CC.y + CC.d / 2],
  [CC.x + 35, CC.y + CC.d / 2],
  [CC.x + 58, CC.y + CC.d / 2],
];
const FLOWERS = [
  [M.yellow, M.pink, M.fruit],
  [M.pink, SW, M.pink],
  [M.fruit, M.yellow, M.yellow],
];

const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};
const faceY = (x: number, y: number, z: number, w: number, h: number) => `M${P(x, y, z)}L${P(x + w, y, z)}L${P(x + w, y, z + h)}L${P(x, y, z + h)}Z`;

function Trolley({ paths, color, delay }: { paths: ReturnType<typeof trolleyPaths>; color: string; delay: number }) {
  return (
    <>
      <Rise delay={delay}>
        {paths.casters.map(([x, y], k) => (
          <path key={k} d={disc(x, y, 2.6, 2)} fill={M.black} />
        ))}
        <path d={paths.casters.map(([x, y]) => post(x, y, 2, CC.base)).join("")} fill="none" stroke={M.steelDark} style={{ strokeWidth: "var(--eco-ink, 1.2px)" }} />
      </Rise>
      <Solid box={paths.deck} color={color} delay={delay} shadow={0.12} />
      <Draw d={paths.uprights + paths.top} color={M.steelDark} delay={delay + 0.3} dur={0.8} />
    </>
  );
}

export function Logistics({ st, active }: SceneProps) {
  const id = useId();
  const wall = tone(mix(M.steel, 40, SW));
  return (
    <Static st={st}>
      <Plate>
        <defs>
          {FLOWERS.map((colors, k) => (
            <g key={k} id={`${id}-bucket${k}`}>
              <Cyl cx={0} cy={0} r={BUCKET.r} rb={BUCKET.rb} h={BUCKET.h} color={M.black} inner={M.water} delay={1 + k * 0.1} shadow={false} />
              <Rise delay={1.3 + k * 0.1} lift={5}>
                <Stems x={0} y={0} z={BUCKET.h - 2} h={14} colors={colors} />
                <Stems x={-2} y={2} z={BUCKET.h - 2} h={11} colors={[colors[1], colors[2]]} />
              </Rise>
            </g>
          ))}
        </defs>

        {/* Dock wall with roller door and a dock leveller plate */}
        <Rise delay={0}>
          <path d={faceY(DOCK.x - 40, DOCK.y, 0, DOCK.w + 80, DOCK.h + 10)} fill={wall.left} />
          <path d={plane(DOCK.x - 40, DOCK.y - 8, DOCK.w + 80, 8, DOCK.h + 10)} fill={wall.top} />
          <path d={faceY(DOCK.x, DOCK.y, 0, DOCK.w, DOCK.h)} fill={M.steelDark} />
          <path d={faceY(DOCK.x + 4, DOCK.y, 4, DOCK.w - 8, DOCK.h - 8)} fill={M.steel} />
          <path d={[0.2, 0.35, 0.5, 0.65, 0.8].map((f) => seg([DOCK.x + 4, DOCK.y, DOCK.h * f], [DOCK.x + DOCK.w - 4, DOCK.y, DOCK.h * f])).join("")} fill="none" stroke={M.steelDark} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }} />
          <path d={faceY(DOCK.x + 4, DOCK.y, 4, DOCK.w - 8, 10)} fill={M.black} opacity={0.5} />
          <path d={faceY(DOCK.x - 40, DOCK.y, 0, DOCK.w + 80, 3)} fill={M.yellow} />
          <path d={plane(DOCK.x + 10, DOCK.y, DOCK.w - 20, 26)} fill={mix(M.steel, 60, SW)} stroke={M.steelDark} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }} />
        </Rise>

        {/* Parked trolley */}
        <Part i={0} active={active}>
          <Trolley paths={PARK} color={M.steel} delay={0.5} />
          {CC.shelves.map((z, k) => (
            <Solid key={z} box={shelf(PARKED.x, PARKED.y, z)} color={M.steel} delay={1 + k * 0.15} />
          ))}
        </Part>

        {/* Towed trolley with buckets of flowers */}
        <Part i={1} active={active}>
          <Trolley paths={TOW} color={M.steel} delay={0.5} />
          {LEVELS.map((z, lvl) => (
            <g key={z}>
              {lvl > 0 ? <Solid box={shelf(CC.x, CC.y, CC.shelves[lvl - 1])} color={M.steel} delay={0.9 + lvl * 0.15} /> : null}
              {SLOTS.map(([bx, by], k) => (
                <use key={k} href={`#${id}-bucket${(k + lvl) % 3}`} transform={at(bx, by, z)} />
              ))}
            </g>
          ))}
        </Part>

        {/* AGV */}
        <Part i={2} active={active}>
          <Draw d={TOWBAR} color={M.steelDark} delay={1.3} dur={0.4} />
          <Solid box={AGV} color={M.white} delay={0.7} shadow={0.14} />
          <Rise delay={1.1}>
            <path d={plane(AGV.x + 6, AGV.y + 6, AGV.w - 12, AGV.d - 12, AGV.h + 0.2)} fill={M.steel} />
            <path d={faceY(AGV.x + 4, AGV.y + AGV.d, 3, AGV.w - 8, 3)} fill={M.blue} />
            <Dot at={[AGV.x + AGV.w - 8, AGV.y + AGV.d / 2, AGV.h]} r={2.8} fill={M.leafLight} />
            <Dot at={[FRONT.x, FRONT.y, 5]} r={2.4} fill={M.blueLight} />
          </Rise>
          {SWEEP.map((d, k) => (
            <Draw key={k} d={d} color={M.blueLight} w="light" delay={1.7 + k * 0.2} dur={0.6} opacity={0.85 - k * 0.22} />
          ))}
        </Part>

        {/* Unit: a bucket trolley rides the rail. */}
        <Travel>
          <Solid box={{ x: -24, y: RAIL.y - 10, z: 3, w: 48, d: 20, h: 3 }} color={M.steel} delay={0} />
          {[-14, 0, 14].map((dx, k) => (
            <g key={dx} transform={at(dx, RAIL.y, 6)}>
              <use href={`#${id}-bucket${k}`} />
            </g>
          ))}
        </Travel>
      </Plate>
    </Static>
  );
}
