"use client";

import { useId } from "react";
import { Cyl, Dot, M, Rise, Solid, tone } from "./flat-kit";
import { Fade, Part, Plate, RAIL, Static, Travel, at, faceY, plane, seg, type Box, type SceneProps } from "./iso-kit";
import { TRAY, Tray } from "./packs";

/**
 * Nursery bench (5.2 m) with five plug trays filling left → right (substrate, germinating,
 * seedlings), a seeding gantry straddling the second tray, and substrate bags on a pallet in front.
 * Painter's order: far legs, stretcher, near legs, bench top, trays (x ascending), gantry near post,
 * head and beam (above everything), then the pallet (front-left, no screen overlap).
 */
const BENCH = { x: -150, y: -70, z: 38, w: 260, d: 40, h: 3 } satisfies Box;
const LEG_X = [-144, -20, 104];
const TRAY_Y = -62;
const TRAY_X0 = -144;
const TRAY_PITCH = 52;
const GROW: (0 | 1 | 2)[] = [0, 0, 1, 2, 2];
const GX = -70;
const BEAM = { x: GX - 2.5, y: -84, z: 86, w: 5, d: 68, h: 6 } satisfies Box;
const HEAD = { x: GX - 7, y: -58, z: 56, w: 14, d: 18, h: 14 } satisfies Box;
const PALLET: Box = { x: -204, y: 4, w: 48, d: 34, h: 5 };
const BAGS: Box[] = [
  { x: -201, y: 6, z: 5, w: 42, d: 30, h: 13 },
  { x: -199, y: 7, z: 18, w: 40, d: 28, h: 13 },
  { x: -197, y: 8, z: 31, w: 38, d: 26, h: 12 },
];
const SW = "var(--oboya-soft-white)";

export function Propagation({ st, active }: SceneProps) {
  const id = useId();
  const steel = tone(M.steel);
  const leg = (x: number, y: number, k: string, delay: number) => <Solid key={k} box={{ x: x - 1.5, y: y - 1.5, w: 3, d: 3, h: BENCH.z }} tones={steel} delay={delay} line={false} />;
  return (
    <Static st={st}>
      <Plate>
        <defs>
          {[0, 1, 2].map((g) => (
            <g key={g} id={`${id}-tray${g}`}>
              <Tray grow={g as 0 | 1 | 2} delay={0.5 + g * 0.12} />
            </g>
          ))}
        </defs>

        {/* Bench: steel legs with a stretcher, white top */}
        {LEG_X.map((x) => leg(x, BENCH.y + 5, `a${x}`, 0))}
        <Solid box={{ x: BENCH.x + 4, y: BENCH.y + 19, z: 10, w: BENCH.w - 8, d: 2.4, h: 2.4 }} tones={steel} delay={0.1} line={false} />
        <Solid box={{ x: GX - 2.5, y: -82, w: 5, d: 5, h: BEAM.z }} tones={steel} delay={0.3} line={false} />
        {LEG_X.map((x) => leg(x, BENCH.y + BENCH.d - 5, `b${x}`, 0.05))}
        <Solid box={BENCH} color={M.white} delay={0.2} shadow={0.25} />

        {/* Trays: substrate, germinating, grown */}
        <Part i={0} active={active}>
          {GROW.map((g, k) => (
            <g key={k} transform={at(TRAY_X0 + k * TRAY_PITCH, TRAY_Y, BENCH.z + BENCH.h)}>
              <use href={`#${id}-tray${g}`} />
            </g>
          ))}
        </Part>

        {/* Seeding gantry: near post, beam, carriage, seeder head with a yellow hopper, seed drops */}
        <Part i={2} active={active}>
          <Solid box={{ x: GX - 2.5, y: -21, w: 5, d: 5, h: BEAM.z }} tones={steel} delay={0.3} line={false} />
          <Solid box={BEAM} tones={steel} delay={0.5} />
          <Solid box={{ x: GX - 4, y: HEAD.y + 4, z: HEAD.z + HEAD.h, w: 8, d: 10, h: BEAM.z - HEAD.z - HEAD.h }} tones={steel} delay={0.8} line={false} />
          <Solid box={HEAD} color={M.blue} dark delay={0.9} />
          <Cyl cx={GX + 2} cy={HEAD.y + 9} z={HEAD.z + HEAD.h} r={3.6} h={6} color={M.yellow} delay={1.1} shadow={false} />
          <Fade delay={1.4} dur={0.4}>
            <Dot at={[HEAD.x + HEAD.w, HEAD.y + 5, HEAD.z + 9]} r={1.6} fill={M.leafLight} />
            <Dot at={[HEAD.x + HEAD.w, HEAD.y + 9, HEAD.z + 9]} r={1.6} fill={M.fruit} />
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <Dot at={[GX - 2 + k * 2.5, HEAD.y + 6 + k * 3, HEAD.z - 3 - k * 2]} r={1.1} fill={M.card} />
                <Dot at={[GX - 1 + k * 2.5, HEAD.y + 7 + k * 3, HEAD.z - 9 - k * 1.5]} r={1.1} fill={M.card} />
              </g>
            ))}
          </Fade>
        </Part>

        {/* Substrate bags on a wooden pallet */}
        <Part i={1} active={active}>
          <Solid box={PALLET} color={M.card} delay={0.5} shadow={0.3} />
          <Rise delay={0.8} dur={0.4}>
            <path d={[0.25, 0.5, 0.75].map((f) => seg([PALLET.x, PALLET.y + PALLET.d * f, PALLET.h + 0.1], [PALLET.x + PALLET.w, PALLET.y + PALLET.d * f, PALLET.h + 0.1])).join("")} fill="none" stroke={tone(M.card).line} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.6)" }} />
          </Rise>
          {BAGS.map((b, k) => (
            <g key={k}>
              <Solid box={b} color={M.white} delay={0.7 + k * 0.18} />
              <Fade delay={1.1 + k * 0.18} dur={0.4}>
                <path d={faceY(b.x + 3, b.y + b.d, (b.z ?? 0) + 3, b.w - 6, b.h - 6)} fill={M.leaf} />
                <path d={faceY(b.x + 6, b.y + b.d, (b.z ?? 0) + 5.5, 9, b.h - 11)} fill={SW} />
                <path d={plane(b.x + 3, b.y + 5, b.w - 6, 6, (b.z ?? 0) + b.h + 0.2)} fill={M.leafLight} />
              </Fade>
            </g>
          ))}
        </Part>

        {/* Unit: a tray of seedlings rides the rail. */}
        <Travel>
          <g transform={at(-TRAY.w / 2, RAIL.y - TRAY.d / 2, 0)}>
            <use href={`#${id}-tray2`} />
          </g>
        </Travel>
      </Plate>
    </Static>
  );
}
