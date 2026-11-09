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
  accentFace,
  cylinder,
  cylinderBody,
  disc,
  iso,
  post,
  seg,
  type Box,
  type SceneProps,
} from "./iso-kit";

// Greenhouse bay: frame with gable trusses, three hanging gutters of pots whose plants grow
// left to right, an overhead irrigation header with laterals and drip lines, one cut-away pot.
const BAY = { x0: -180, x1: 180, y0: -92, y1: 30, eave: 50, ridge: 70 };
const RIDGE_Y = (BAY.y0 + BAY.y1) / 2;
const POST_PITCH = 90;
const ROWS = [-72, -38, -4];
const GUTTER = { x0: -166, w: 332, d: 14, z: 12, h: 5 };
const POT_PITCH = 24;
const POTS = 14;
const POT = { r: 6.5, rb: 5, h: 10 };
const POT_Z = GUTTER.z + GUTTER.h;
const PIPE_Z = 44;
const CUT = { x: 140, y: 48, r: 17, rb: 13, h: 28 };

/** Frame: posts, eave beams, ridge, end trusses and rafters. */
function framePaths() {
  const posts: string[] = [];
  const rafters: string[] = [];
  for (let x = BAY.x0; x <= BAY.x1 + 1; x += POST_PITCH) {
    posts.push(post(x, BAY.y0, 0, BAY.eave), post(x, BAY.y1, 0, BAY.eave));
    rafters.push(seg([x, BAY.y0, BAY.eave], [x, RIDGE_Y, BAY.ridge]), seg([x, RIDGE_Y, BAY.ridge], [x, BAY.y1, BAY.eave]));
  }
  const beams =
    seg([BAY.x0, BAY.y0, BAY.eave], [BAY.x1, BAY.y0, BAY.eave]) +
    seg([BAY.x0, BAY.y1, BAY.eave], [BAY.x1, BAY.y1, BAY.eave]) +
    seg([BAY.x0, RIDGE_Y, BAY.ridge], [BAY.x1, RIDGE_Y, BAY.ridge]);
  // End trusses: king post and two struts at each gable.
  const truss = [BAY.x0, BAY.x1]
    .map(
      (x) =>
        seg([x, BAY.y0, BAY.eave], [x, BAY.y1, BAY.eave]) +
        post(x, RIDGE_Y, BAY.eave, BAY.ridge) +
        seg([x, RIDGE_Y, BAY.eave], [x, (BAY.y0 + RIDGE_Y) / 2, (BAY.eave + BAY.ridge) / 2]) +
        seg([x, RIDGE_Y, BAY.eave], [x, (BAY.y1 + RIDGE_Y) / 2, (BAY.eave + BAY.ridge) / 2]),
    )
    .join("");
  return { posts: posts.join(""), rafters: rafters.join(""), beams, truss };
}
const FRAME = framePaths();

/** Plant at growth stage k (0..3): a stem and arching leaves that get longer and more numerous. */
function plant(k: number) {
  const h = 5 + k * 5;
  const base = iso(0, 0, POT.h).join(" ");
  let d = `M${base}L${iso(0, 0, POT.h + h).join(" ")}`;
  // Leaves leave the stem at increasing heights and arch outward then down.
  const leaves: [number, number, number][] = [
    [-1, 0.6, 0.9],
    [1, -0.6, 1],
    [-0.5, -1, 0.8],
    [0.7, 1, 0.7],
  ];
  for (let i = 0; i <= k; i++) {
    const [ux, uy, f] = leaves[i];
    const z = POT.h + 2 + i * 3.5;
    const s = (4 + k * 2.2) * f;
    const c = iso(ux * s * 0.7, uy * s * 0.7, z + s * 0.9).join(" ");
    const t = iso(ux * s * 1.5, uy * s * 1.5, z + s * 0.5).join(" ");
    d += `M${iso(0, 0, z).join(" ")}Q${c} ${t}`;
  }
  return d;
}
const POT_D = cylinder(0, 0, POT.r, POT.h, 0, POT.rb);
const POT_BODY = cylinderBody(0, 0, POT.r, POT.h, 0, POT.rb);
const POT_TOP = disc(0, 0, POT.r - 1.2, POT.h);
const PLANTS = [0, 1, 2, 3].map(plant);

/** Header pipe along y at the left gable, laterals above each row, drip lines to every other pot. */
function irrigationPaths() {
  const header = seg([BAY.x0 + 6, BAY.y0 + 6, PIPE_Z], [BAY.x0 + 6, BAY.y1 - 6, PIPE_Z]) + post(BAY.x0 + 6, BAY.y0 + 6, 0, PIPE_Z);
  const laterals = ROWS.map((y) => seg([BAY.x0 + 6, y, PIPE_Z], [GUTTER.x0 + GUTTER.w, y, PIPE_Z])).join("");
  const drips: string[] = [];
  ROWS.forEach((y) => {
    for (let k = 1; k < POTS; k += 2) {
      const x = GUTTER.x0 + 12 + k * POT_PITCH;
      drips.push(post(x, y, POT_Z + POT.h + 2, PIPE_Z));
    }
  });
  return { header, laterals, drips: drips.join("") };
}
const IRRIG = irrigationPaths();

/** Cut-away pot: the near half is removed; the section shows substrate layers and roots. */
const cutSection = (() => {
  const { x, y, r, h } = CUT;
  // Section plane through the centre, along x (a vertical rectangle on plane y = const).
  const rect = `M${iso(x - r, y, 0).join(" ")}L${iso(x + r, y, 0).join(" ")}L${iso(x + r, y, h).join(" ")}L${iso(x - r, y, h).join(" ")}Z`;
  const layers = [h * 0.35, h * 0.68].map((z) => seg([x - r + 2, y, z], [x + r - 2, y, z])).join("");
  const roots = [-8, -3, 3, 8]
    .map((o) => `M${iso(x + o * 0.6, y, h - 2).join(" ")}Q${iso(x + o, y, h * 0.55).join(" ")} ${iso(x + o * 1.4, y, 4).join(" ")}`)
    .join("");
  return { rect, layers, roots };
})();

const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};
const W_INK = { strokeWidth: "var(--eco-ink, 1.2px)" } as const;
const W_LIGHT = { strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" } as const;

export function Growing({ st, active }: SceneProps) {
  const id = useId();
  const potId = (k: number) => `${id}-pot${k}`;
  return (
    <Static st={st}>
      <Plate>
        <defs>
          {PLANTS.map((d, k) => (
            <g key={k} id={potId(k)}>
              <Fade delay={1.1 + k * 0.1} dur={0.5}>
                <path d={POT_BODY} fill={FACE.left} />
                <path d={POT_TOP} fill={accentFace("green", 22)} />
              </Fade>
              <Draw d={POT_D} delay={0.8 + k * 0.1} dur={0.7} w="light" />
              <Draw d={d} color={ACCENT.green} delay={1.5 + k * 0.15} dur={0.7} />
            </g>
          ))}
        </defs>

        {/* Greenhouse frame (behind everything) */}
        <Draw d={FRAME.posts} color={CONSTRUCTION} w="light" delay={0} dur={1.1} />
        <Draw d={FRAME.beams} delay={0.3} dur={1.2} />
        <Draw d={FRAME.rafters} color={CONSTRUCTION} w="light" delay={0.6} dur={1} opacity={0.8} />
        <Draw d={FRAME.truss} delay={0.7} dur={0.9} w="light" />

        {/* Gutters with pots, back row first */}
        {ROWS.map((y, r) => {
          const g: Box = { x: GUTTER.x0, y: y - GUTTER.d / 2, z: GUTTER.z, w: GUTTER.w, d: GUTTER.d, h: GUTTER.h };
          return (
            <g key={y}>
              <Draw
                d={[0.15, 0.5, 0.85].map((f) => post(GUTTER.x0 + GUTTER.w * f, y, 0, GUTTER.z)).join("")}
                color={CONSTRUCTION}
                w="light"
                delay={0.3 + r * 0.1}
                dur={0.6}
              />
              <IsoBox box={g} delay={0.4 + r * 0.12} dur={0.9} inner={false} top={FACE.soft} />
              <Part i={0} active={active}>
                {[0, 1, 2, 3].map((k) => (
                  <g key={k} transform={at(GUTTER.x0 + 12 + k * Math.ceil(POTS / 4) * POT_PITCH, y, POT_Z)}>
                    <Repeat href={`#${potId(k)}`} n={k === 3 ? POTS - 3 * Math.ceil(POTS / 4) : Math.ceil(POTS / 4)} dx={POT_PITCH} />
                  </g>
                ))}
              </Part>
            </g>
          );
        })}

        {/* Irrigation */}
        <Part i={2} active={active}>
          <Draw d={IRRIG.header + IRRIG.laterals} color={ACCENT.blueLight} delay={1} dur={1.2} />
          <Draw d={IRRIG.drips} color={ACCENT.blueLight} w="light" delay={1.9} dur={0.6} opacity={0.75} />
          <Fade delay={2.4} dur={0.4}>
            {ROWS.map((y) => {
              const [cx, cy] = iso(BAY.x0 + 6, y, PIPE_Z);
              return <circle key={y} cx={cx} cy={cy} r={2.4} fill={ACCENT.blueLight} />;
            })}
          </Fade>
        </Part>

        {/* Cut-away pot with substrate */}
        <Part i={1} active={active}>
          <Fade delay={1.3} dur={0.5}>
            <path d={cylinderBody(CUT.x, CUT.y, CUT.r, CUT.h, 0, CUT.rb)} fill={FACE.left} />
            <path d={cutSection.rect} fill={accentFace("green", 30)} />
          </Fade>
          <Draw d={cylinder(CUT.x, CUT.y, CUT.r, CUT.h, 0, CUT.rb)} delay={1} dur={0.8} />
          <Draw d={cutSection.rect} delay={1.3} dur={0.6} w="light" />
          <Draw d={cutSection.layers} color={CONSTRUCTION} w="light" delay={1.8} dur={0.5} />
          <Draw d={cutSection.roots} color={FACE.soft} w="light" delay={2} dur={0.6} />
          <g transform={at(CUT.x, CUT.y, CUT.h - POT.h)}>
            <Draw d={PLANTS[3]} color={ACCENT.green} delay={2.1} dur={0.7} />
          </g>
        </Part>

        {/* Unit: a potted plant rides the rail. */}
        <Travel>
          <g transform={at(0, RAIL.y, 0)}>
            <Fade delay={0} dur={0.3}>
              <path d={POT_BODY} fill={FACE.left} />
              <path d={POT_TOP} fill={accentFace("green", 22)} />
            </Fade>
            <path d={POT_D} fill="none" stroke={ACCENT.greenLight} strokeLinejoin="round" style={W_INK} />
            <path d={PLANTS[1]} fill="none" stroke={ACCENT.green} strokeLinecap="round" style={W_LIGHT} />
          </g>
        </Travel>
      </Plate>
    </Static>
  );
}
