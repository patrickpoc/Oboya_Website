"use client";

import { useId } from "react";
import { Dot, M, PottedMum, Rise, Solid, mix, tone } from "./flat-kit";
import { Draw, Part, Plate, RAIL, Static, Travel, at, faceY, iso, plane, seg, type Box, type SceneProps } from "./iso-kit";
import { CC, CCTrolley, Crate, FlowerBucket, Pot, Punnet } from "./packs";

/**
 * Loading dock: a concrete wall with a half-open roller door and a dock light at the back; an AGV
 * with a sensor sweep towing a CC trolley of flower buckets and potted mums; a second CC trolley
 * parked by the door with crates of punnets (the tomato line). Trolleys are opaque: uprights,
 * shelves and contents in painter's order (see packs.tsx).
 */
const WALL = { x: -90, w: 290, y: -104, h: 80 };
const DOOR = { x: -20, w: 140, h: 64 };
const PARKED = { x: -140, y: -30 };
const TOWED = { x: -12, y: -32 };
const AGV: Box = { x: 70, y: -34, w: 56, d: 32, h: 11 };
const SW = "var(--oboya-soft-white)";

function arc(cx: number, cy: number, r: number, z: number, a0: number, a1: number, n = 10) {
  const pts: string[] = [];
  for (let k = 0; k <= n; k++) {
    const a = a0 + ((a1 - a0) * k) / n;
    pts.push(iso(cx + r * Math.cos(a), cy + r * Math.sin(a), z).join(" "));
  }
  return `M${pts.join("L")}`;
}
const FRONT = { x: AGV.x + AGV.w, y: AGV.y + AGV.d / 2 };
const SWEEP = [14, 24, 34].map((r) => arc(FRONT.x, FRONT.y, r, 1.5, -Math.PI * 0.4, Math.PI * 0.4));
const BUNCHES = [
  [M.yellow, M.pink, M.yellow, SW],
  [M.pink, SW, M.pink],
  [M.fruit, M.yellow, M.fruit, M.pink],
];

export function Logistics({ st, active }: SceneProps) {
  const id = useId();
  const wall = tone(M.concrete);
  const steel = tone(M.steel);
  return (
    <Static st={st}>
      <Plate>
        <defs>
          <g id={`${id}-crate`}>
            <Crate delay={0.9}>
              <g transform={at(-9, -2, 0)}>
                <Punnet delay={1.1} />
              </g>
              <g transform={at(0, -2, 0)}>
                <Punnet delay={1.15} />
              </g>
              <g transform={at(9, -2, 0)}>
                <Punnet delay={1.2} />
              </g>
            </Crate>
          </g>
          <g id={`${id}-mum`}>
            <Pot cx={0} cy={0} r={5} h={9} color={M.black} delay={1} shadow={false} />
            <Rise delay={1.3} lift={4}>
              <PottedMum x={0} y={0} z={9} color={M.yellow} h={10} blooms={4} />
            </Rise>
          </g>
        </defs>

        {/* Dock wall, roller door half open, dock light, safety stripe and leveller plate */}
        <Rise delay={0}>
          <path d={faceY(WALL.x, WALL.y, 0, WALL.w, WALL.h)} fill={wall.left} />
          <path d={plane(WALL.x, WALL.y - 8, WALL.w, 8, WALL.h)} fill={wall.top} />
          <path d={faceY(DOOR.x - 4, WALL.y, 0, DOOR.w + 8, DOOR.h + 4)} fill={M.steelDark} />
          <path d={faceY(DOOR.x, WALL.y, 0, DOOR.w, 18)} fill={mix(M.shadow, 92, SW)} />
          <path d={faceY(DOOR.x, WALL.y, 18, DOOR.w, DOOR.h - 18)} fill={M.steel} />
          <path d={[0.4, 0.55, 0.7, 0.85].map((f) => seg([DOOR.x, WALL.y, DOOR.h * f], [DOOR.x + DOOR.w, WALL.y, DOOR.h * f])).join("")} fill="none" stroke={M.steelDark} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }} />
          <path d={faceY(DOOR.x, WALL.y, 16, DOOR.w, 3)} fill={M.yellow} />
          <path d={faceY(WALL.x, WALL.y, 0, WALL.w, 2.5)} fill={M.yellow} />
          <path d={plane(DOOR.x + 10, WALL.y, DOOR.w - 20, 24)} fill={mix(M.steel, 70)} stroke={M.steelDark} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }} />
        </Rise>
        <Solid box={{ x: DOOR.x + DOOR.w + 8, y: WALL.y, z: DOOR.h + 2, w: 4, d: 8, h: 3 }} tones={steel} delay={0.4} line={false} />
        <Rise delay={0.7} dur={0.4}>
          <Dot at={[DOOR.x + DOOR.w + 10, WALL.y + 8, DOOR.h + 2]} r={2.2} fill={M.leafLight} />
        </Rise>

        {/* Parked trolley with crates of punnets */}
        <Part i={0} active={active}>
          <CCTrolley
            x={PARKED.x}
            y={PARKED.y}
            top={90}
            delay={0.4}
            content={(lvl, z) => (
              <g transform={at(PARKED.x + 17, PARKED.y + CC.d / 2, z)}>
                <use href={`#${id}-crate`} />
                {lvl < 2 ? <use href={`#${id}-crate`} transform={at(34, 0, 0)} /> : null}
              </g>
            )}
          />
        </Part>

        {/* Towed trolley: potted mums below, buckets of cut flowers above */}
        <Part i={1} active={active}>
          <CCTrolley
            x={TOWED.x}
            y={TOWED.y}
            top={90}
            delay={0.5}
            content={(lvl, z) =>
              lvl === 0 ? (
                <g transform={at(TOWED.x + 12, TOWED.y + CC.d / 2, z)}>
                  {[0, 1, 2, 3].map((k) => (
                    <use key={k} href={`#${id}-mum`} transform={at(k * 15, 0, 0)} />
                  ))}
                </g>
              ) : (
                <>
                  {[0, 1, 2].map((k) => (
                    <FlowerBucket key={k} cx={TOWED.x + 12 + k * 22} cy={TOWED.y + CC.d / 2} z={z} colors={BUNCHES[(k + lvl) % 3]} kind={lvl === 2 && k === 1 ? "rose" : "mum"} h={12} delay={1 + lvl * 0.15 + k * 0.08} shadow={false} />
                  ))}
                </>
              )
            }
          />
        </Part>

        {/* AGV: tow bar, white body with steel deck, blue bumper, lights, sensor sweep */}
        <Part i={2} active={active}>
          <Solid box={{ x: TOWED.x + CC.w, y: TOWED.y + CC.d / 2 - 1, z: 5, w: AGV.x - TOWED.x - CC.w, d: 2, h: 1.6 }} tones={steel} delay={1.2} line={false} />
          <Solid box={AGV} color={M.white} delay={0.7} shadow={0.3} />
          <Rise delay={1.1} dur={0.4}>
            <path d={plane(AGV.x + 5, AGV.y + 5, AGV.w - 10, AGV.d - 10, AGV.h + 0.2)} fill={M.steel} />
            <path d={faceY(AGV.x + 3, AGV.y + AGV.d, 2.5, AGV.w - 6, 3)} fill={M.blue} />
            <Dot at={[AGV.x + AGV.w - 7, AGV.y + AGV.d / 2, AGV.h]} r={2.4} fill={M.leafLight} />
            <Dot at={[FRONT.x, FRONT.y, 5]} r={2} fill={M.blueLight} />
          </Rise>
          {SWEEP.map((d, k) => (
            <Draw key={k} d={d} color={M.blueLight} delay={1.6 + k * 0.2} dur={0.6} opacity={0.9 - k * 0.25} />
          ))}
        </Part>

        {/* Unit: a punnet arrives; a low CC trolley with a crate and buckets leaves. */}
        <Travel
          from={
            <g transform={at(0, RAIL.y, 0)}>
              <Punnet delay={0} />
            </g>
          }
        >
          <CCTrolley
            x={-CC.w / 2}
            y={RAIL.y - CC.d / 2}
            levels={[CC.deck, 40]}
            top={66}
            delay={0}
            content={(lvl, z) =>
              lvl === 0 ? (
                <g transform={at(-CC.w / 2 + 17, RAIL.y, z)}>
                  <use href={`#${id}-crate`} />
                </g>
              ) : (
                <>
                  {[0, 1, 2].map((k) => (
                    <FlowerBucket key={k} cx={-CC.w / 2 + 12 + k * 22} cy={RAIL.y} z={z} colors={BUNCHES[k]} h={10} delay={0} shadow={false} />
                  ))}
                </>
              )
            }
          />
        </Travel>
      </Plate>
    </Static>
  );
}
