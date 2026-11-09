"use client";

import { useId } from "react";
import { Dot, M, Rise, Seedling, Shadow, Solid, mix, tone } from "./flat-kit";
import {
  Draw,
  Fade,
  P,
  Part,
  Plate,
  RAIL,
  Static,
  Travel,
  iso,
  plane,
  post,
  seg,
  type Box,
  type SceneProps,
} from "./iso-kit";

// Nursery bench with black cell trays of seedlings, a seeding gantry dropping seed over the last
// tray, and printed substrate bags stacked on a wooden pallet at the front-left.
const BENCH = { x: -130, y: -66, z: 34, w: 280, d: 50, h: 4 };
const TRAY: Box = { x: 0, y: 0, z: 0, w: 82, d: 40, h: 6 };
const TRAY_AT = { x: -124, y: -62, z: BENCH.z + BENCH.h };
const TRAY_PITCH = 90;
const CELLS = { cols: 8, rows: 4 };
const GANTRY = { x: -118, w: 8, y0: -82, y1: 2, z: 82 };
const HEAD = { x: -122, y: -56, z: 56, w: 16, d: 26, h: 18 } satisfies Box;
const PALLET: Box = { x: -186, y: 14, w: 54, d: 44, h: 5 };
const BAGS: Box[] = [
  { x: -182, y: 16, z: 5, w: 46, d: 40, h: 16 },
  { x: -180, y: 18, z: 21, w: 44, d: 36, h: 15 },
  { x: -178, y: 20, z: 36, w: 42, d: 34, h: 15 },
];
const SW = "var(--oboya-soft-white)";

/** Cell grid on the tray top and one seedling per cell; growth by column so trays read left→right. */
function trayGrid() {
  const { w, d, h } = TRAY;
  const parts: string[] = [];
  for (let r = 1; r < CELLS.rows; r++) parts.push(seg([0, (d * r) / CELLS.rows, h], [w, (d * r) / CELLS.rows, h]));
  for (let c = 1; c < CELLS.cols; c++) parts.push(seg([(w * c) / CELLS.cols, 0, h], [(w * c) / CELLS.cols, d, h]));
  return parts.join("");
}
const GRID_D = trayGrid();
const CELL_CENTRES = Array.from({ length: CELLS.rows * CELLS.cols }, (_, i) => {
  const c = i % CELLS.cols;
  const r = Math.floor(i / CELLS.cols);
  return { x: (TRAY.w * (c + 0.5)) / CELLS.cols, y: (TRAY.d * (r + 0.5)) / CELLS.rows };
});

const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};
/** Rectangle on the vertical front face (plane y = const). */
const faceY = (x: number, y: number, z: number, w: number, h: number) => `M${P(x, y, z)}L${P(x + w, y, z)}L${P(x + w, y, z + h)}L${P(x, y, z + h)}Z`;

function Tray({ grow, delay }: { grow: number; delay: number }) {
  return (
    <>
      <Solid box={TRAY} color={M.black} delay={delay} />
      <Fade delay={delay + 0.3} dur={0.4}>
        {CELL_CENTRES.map((c, i) => (
          <path key={i} d={plane(c.x - 3.6, c.y - 3.6, 7.2, 7.2, TRAY.h + 0.2)} fill={M.soil} />
        ))}
        <path d={GRID_D} fill="none" stroke={mix(M.black, 80, SW)} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.6)" }} />
      </Fade>
      <Rise delay={delay + 0.6} lift={4}>
        {CELL_CENTRES.map((c, i) =>
          grow > 0 ? <Seedling key={i} x={c.x} y={c.y} z={TRAY.h} s={grow * (1.3 + ((i * 7) % 3) * 0.2)} /> : null,
        )}
      </Rise>
    </>
  );
}

export function Propagation({ st, active }: SceneProps) {
  const id = useId();
  return (
    <Static st={st}>
      <Plate>
        <defs>
          {[0, 0.6, 1].map((g, k) => (
            <g key={k} id={`${id}-tray${k}`}>
              <Tray grow={g} delay={0.4 + k * 0.15} />
            </g>
          ))}
        </defs>

        {/* Bench: steel legs and rails, white top */}
        <Draw
          d={
            [BENCH.x + 6, BENCH.x + BENCH.w / 2, BENCH.x + BENCH.w - 6]
              .map((x) => post(x, BENCH.y + 4, 0, BENCH.z) + post(x, BENCH.y + BENCH.d - 4, 0, BENCH.z) + seg([x, BENCH.y + 4, 12], [x, BENCH.y + BENCH.d - 4, 12]))
              .join("") +
            seg([BENCH.x + 6, BENCH.y + BENCH.d - 4, 12], [BENCH.x + BENCH.w - 6, BENCH.y + BENCH.d - 4, 12])
          }
          color={M.steelDark}
          delay={0}
          dur={0.9}
        />
        <Solid box={BENCH} color={M.white} delay={0.2} shadow={0.1} />

        {/* Trays: empty with substrate, germinating, grown */}
        <Part i={0} active={active}>
          {[0, 1, 2].map((k) => (
            <g key={k} transform={at(TRAY_AT.x + k * TRAY_PITCH, TRAY_AT.y, TRAY_AT.z)}>
              <use href={`#${id}-tray${k}`} />
            </g>
          ))}
        </Part>

        {/* Seeding gantry over the empty tray: two columns, a beam, a blue seeder head dropping seed */}
        <Part i={2} active={active}>
          <Solid box={{ x: GANTRY.x, y: GANTRY.y0 - 6, w: GANTRY.w, d: 8, h: GANTRY.z }} color={M.steel} delay={0.5} />
          <Solid box={{ x: GANTRY.x, y: GANTRY.y1 - 2, w: GANTRY.w, d: 8, h: GANTRY.z }} color={M.steel} delay={0.5} />
          <Solid box={{ x: GANTRY.x - 1, y: GANTRY.y0 - 6, z: GANTRY.z, w: GANTRY.w + 2, d: GANTRY.y1 - GANTRY.y0 + 8, h: 6 }} color={M.steel} delay={0.7} />
          <Draw d={post(GANTRY.x + GANTRY.w / 2, HEAD.y + HEAD.d / 2, HEAD.z + HEAD.h, GANTRY.z)} color={M.steelDark} delay={1} dur={0.4} />
          <Solid box={HEAD} color={M.blue} delay={1} />
          <Fade delay={1.5} dur={0.4}>
            <Dot at={[HEAD.x + HEAD.w, HEAD.y + 6, HEAD.z + 10]} r={1.8} fill={M.leafLight} />
            <Dot at={[HEAD.x + HEAD.w, HEAD.y + 11, HEAD.z + 10]} r={1.8} fill={M.yellow} />
          </Fade>
          {/* Seed drops: small dark dots between the head and the tray */}
          <Fade delay={1.6} dur={0.5}>
            {[-46, -40, -34].map((y, k) => (
              <g key={y}>
                <Dot at={[GANTRY.x + 4, y, HEAD.z - 5 - k * 3]} r={1.4} fill={M.soil} />
                <Dot at={[GANTRY.x + 4, y, HEAD.z - 13 - k * 2]} r={1.4} fill={M.soil} />
              </g>
            ))}
          </Fade>
        </Part>

        {/* Substrate bags on a pallet */}
        <Part i={1} active={active}>
          <Rise delay={0.5}>
            <Shadow cx={PALLET.x + PALLET.w / 2 + 2} cy={PALLET.y + PALLET.d / 2 + 2} r={34} />
          </Rise>
          <Solid box={PALLET} color={M.card} delay={0.5} />
          <Draw d={[0.25, 0.5, 0.75].map((f) => seg([PALLET.x, PALLET.y + PALLET.d * f, PALLET.h], [PALLET.x + PALLET.w, PALLET.y + PALLET.d * f, PALLET.h])).join("")} color={tone(M.card).line} w="light" delay={0.8} dur={0.4} />
          {BAGS.map((b, k) => (
            <g key={k}>
              <Solid box={b} color={M.white} delay={0.7 + k * 0.18} />
              <Fade delay={1.1 + k * 0.18} dur={0.4}>
                {/* print band and brand block on the front face, green strip on top */}
                <path d={faceY(b.x + 4, b.y + b.d, (b.z ?? 0) + 4, b.w - 8, b.h - 8)} fill={M.leaf} />
                <path d={faceY(b.x + 8, b.y + b.d, (b.z ?? 0) + 7, 10, b.h - 14)} fill={M.white} />
                <path d={plane(b.x + 4, b.y + 6, b.w - 8, 8, (b.z ?? 0) + b.h + 0.2)} fill={M.leafLight} />
              </Fade>
            </g>
          ))}
        </Part>

        {/* Unit: a tray of seedlings rides the rail. */}
        <Travel>
          <g transform={at(-TRAY.w / 4, RAIL.y - TRAY.d / 4, 0)}>
            <g transform={`translate(${ox} ${oy}) scale(0.5) translate(${-ox} ${-oy})`}>
              <use href={`#${id}-tray2`} />
            </g>
          </g>
        </Travel>
      </Plate>
    </Static>
  );
}
