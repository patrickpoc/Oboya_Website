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
  P,
  Part,
  Plate,
  RAIL,
  Repeat,
  Static,
  Travel,
  accentFace,
  boxInner,
  boxOutline,
  iso,
  plane,
  post,
  seg,
  type Box,
  type SceneProps,
} from "./iso-kit";

// Bench along x, three cell trays on it, a seeding gantry over the third tray, substrate bags at the front-left.
const BENCH = { x: -170, y: -70, z: 39, w: 280, d: 48, h: 5 };
const TRAY: Box = { x: 0, y: 0, z: 0, w: 84, d: 40, h: 7 };
const TRAY_AT = { x: -162, y: -66, z: 44 };
const TRAY_PITCH = 90;
const GANTRY = { x: 40, w: 14, y0: -92, y1: -2, z: 116 };
const BEAM: Box = { x: GANTRY.x, y: GANTRY.y0, z: GANTRY.z, w: GANTRY.w, d: GANTRY.y1 - GANTRY.y0, h: 6 };
const HEAD = { x: 38, y: -62, z: 80, w: 18, d: 28, h: 24 };
const BAGS: Box[] = [
  { x: -212, y: 10, w: 42, d: 34, h: 22 },
  { x: -210, y: 12, z: 22, w: 40, d: 32, h: 20 },
  { x: -166, y: 14, w: 42, d: 34, h: 22 },
];

/** Cell grid lines on the tray top (4 along x, 9 along y). */
function trayCells() {
  const { w, d, h } = TRAY;
  const parts: string[] = [];
  for (let r = 1; r < 5; r++) parts.push(seg([0, (d * r) / 5, h], [w, (d * r) / 5, h]));
  for (let c = 1; c < 10; c++) parts.push(seg([(w * c) / 10, 0, h], [(w * c) / 10, d, h]));
  return parts.join("");
}
/** One sprout per cell: a small chevron whose height follows the cell index. */
function traySprouts() {
  const { w, d, h } = TRAY;
  const parts: string[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 10; c++) {
      const cx = (w * (c + 0.5)) / 10;
      const cy = (d * (r + 0.5)) / 5;
      const k = 3 + ((c * 7 + r * 5) % 4);
      parts.push(`M${P(cx - 2.2, cy + 1.6, h)}L${P(cx, cy, h + k)}L${P(cx + 2.4, cy - 1.4, h)}`);
    }
  }
  return parts.join("");
}
const CELLS = trayCells();
const SPROUTS = traySprouts();

/** Rectangle on the vertical left face (plane y = const). */
const faceRectY = (x: number, y: number, z: number, w: number, h: number) =>
  `M${P(x, y, z)}L${P(x + w, y, z)}L${P(x + w, y, z + h)}L${P(x, y, z + h)}Z`;

const [trayDx, trayDy] = iso(TRAY_AT.x, TRAY_AT.y, TRAY_AT.z);
const [originX, originY] = iso(0, 0, 0);

export function Propagation({ st, active }: SceneProps) {
  const id = useId().replace(/:/g, "");
  const tray = `${id}-tray`;
  return (
    <Static st={st}>
      <Plate>
        <defs>
          <g id={tray}>
            <Fade delay={0.7}>
              <Faces box={TRAY} top={FACE.soft} />
            </Fade>
            <Draw d={boxOutline(TRAY)} delay={0.25} dur={0.9} />
            <Draw d={boxInner(TRAY)} delay={0.5} dur={0.6} w="light" />
            <Draw d={CELLS} color={CONSTRUCTION} w="light" delay={0.8} dur={1} />
            <Draw d={SPROUTS} color={ACCENT.green} w="base" delay={1.3} dur={1.2} />
          </g>
        </defs>

        {/* Bench */}
        <Draw
          d={
            post(BENCH.x, BENCH.y + BENCH.d, 0, BENCH.z) +
            post(BENCH.x + BENCH.w, BENCH.y + BENCH.d, 0, BENCH.z) +
            post(BENCH.x + BENCH.w, BENCH.y, 0, BENCH.z) +
            post(BENCH.x, BENCH.y, 0, BENCH.z) +
            seg([BENCH.x, BENCH.y + BENCH.d, 12], [BENCH.x + BENCH.w, BENCH.y + BENCH.d, 12]) +
            seg([BENCH.x + BENCH.w, BENCH.y + BENCH.d, 12], [BENCH.x + BENCH.w, BENCH.y, 12])
          }
          w="light"
          delay={0.1}
          dur={1}
        />
        <IsoBox box={BENCH} delay={0} dur={1.1} w="heavy" />

        {/* Trays */}
        <Part i={0} active={active}>
          <g transform={`translate(${trayDx - originX} ${trayDy - originY})`}>
            <Repeat href={`#${tray}`} n={3} dx={TRAY_PITCH} />
          </g>
        </Part>

        {/* Seeding gantry */}
        <Part i={2} active={active}>
          <Fade delay={0.6}>
            <path d={plane(GANTRY.x - 4, GANTRY.y0 - 4, GANTRY.w + 8, 8)} fill={FACE.left} />
            <path d={plane(GANTRY.x - 4, GANTRY.y1 - 4, GANTRY.w + 8, 8)} fill={FACE.left} />
          </Fade>
          <Draw
            d={
              post(GANTRY.x, GANTRY.y0, 0, GANTRY.z) +
              post(GANTRY.x + GANTRY.w, GANTRY.y0, 0, GANTRY.z) +
              post(GANTRY.x, GANTRY.y1, 0, GANTRY.z) +
              post(GANTRY.x + GANTRY.w, GANTRY.y1, 0, GANTRY.z)
            }
            delay={0.3}
            dur={1.2}
          />
          <IsoBox box={BEAM} delay={0.9} dur={0.8} inner={false} />
          <Draw d={post(47, -48, HEAD.z + HEAD.h, GANTRY.z)} delay={1.3} dur={0.4} />
          <IsoBox box={HEAD} delay={1.2} dur={0.7} top={FACE.soft} />
          <Draw
            d={[-58, -52, -46, -40].map((y) => post(47, y, 56, HEAD.z)).join("")}
            color={CONSTRUCTION}
            w="light"
            delay={1.7}
            dur={0.5}
          />
          <Fade delay={2}>
            {[-58, -52, -46, -40].map((y) => {
              const [cx, cy] = iso(47, y, 56);
              return <circle key={y} cx={cx} cy={cy} r={1.8} fill={ACCENT.blueLight} />;
            })}
            <circle cx={iso(56, -50, 96)[0]} cy={iso(56, -50, 96)[1]} r={2.6} fill={ACCENT.blueLight} />
          </Fade>
        </Part>

        {/* Substrate bags */}
        <Part i={1} active={active}>
          {BAGS.map((b, k) => (
            <IsoBox key={k} box={b} delay={0.5 + k * 0.2} dur={0.8} />
          ))}
          <Draw
            d={BAGS.map((b) => seg([b.x, b.y + b.d / 2, (b.z ?? 0) + b.h], [b.x + b.w, b.y + b.d / 2, (b.z ?? 0) + b.h])).join("")}
            color={CONSTRUCTION}
            w="light"
            delay={1.3}
            dur={0.6}
          />
          <Fade delay={1.5}>
            {BAGS.map((b, k) => (
              <path key={k} d={faceRectY(b.x + 7, b.y + b.d, (b.z ?? 0) + 7, b.w - 14, 6)} fill={accentFace("green", 55)} />
            ))}
          </Fade>
        </Part>

        {/* Unit: one cell tray rides the rail. */}
        <Travel>
          <Fade delay={0} dur={0.3}>
            <Faces box={{ x: -20, y: RAIL.y - 12, w: 40, d: 24, h: 6 }} top={FACE.soft} />
          </Fade>
          <path d={boxOutline({ x: -20, y: RAIL.y - 12, w: 40, d: 24, h: 6 })} fill="none" stroke={ACCENT.greenLight} strokeLinejoin="round" style={{ strokeWidth: "var(--eco-ink, 1.2px)" }} />
          <path d={boxInner({ x: -20, y: RAIL.y - 12, w: 40, d: 24, h: 6 })} fill="none" stroke={ACCENT.greenLight} strokeLinejoin="round" style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }} />
          <path
            d={[-12, -4, 4, 12].map((x) => seg([x, RAIL.y - 12, 6], [x, RAIL.y + 12, 6])).join("") + seg([-20, RAIL.y, 6], [20, RAIL.y, 6])}
            fill="none"
            stroke={CONSTRUCTION}
            style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }}
          />
        </Travel>
      </Plate>
    </Static>
  );
}
