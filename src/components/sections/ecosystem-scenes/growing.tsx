"use client";

import { useId } from "react";
import { Cyl, Dot, Lettuce, M, Rise, Seedling, Shadow, Solid, Strawberry, Tomato, mix, tone } from "./flat-kit";
import {
  Draw,
  Fade,
  P,
  Part,
  Plate,
  RAIL,
  Repeat,
  Static,
  Travel,
  cylinderBody,
  disc,
  iso,
  post,
  seg,
  type Box,
  type SceneProps,
} from "./iso-kit";

// Glass greenhouse bay (cut away at the front) with three hanging gutters: tomatoes at the back,
// lettuce in the middle, strawberries in front, each crop growing left to right. Blue irrigation
// header with laterals and drip lines; a cut-away terracotta pot shows the substrate.
const BAY = { x0: -180, x1: 180, y0: -96, y1: 30, eave: 54, ridge: 76 };
const RIDGE_Y = (BAY.y0 + BAY.y1) / 2;
const BAY_PITCH = 60;
const ROWS = { tomato: -74, lettuce: -40, berry: -6 };
const GUTTER = { x0: -166, w: 332, d: 14, z: 10, h: 5 };
const POT_PITCH = 25;
const POTS = 13;
const POT_Z = GUTTER.z + GUTTER.h;
const PIPE_Z = 46;
const CUT = { x: 142, y: 48, r: 17, rb: 13, h: 28 };
const SW = "var(--oboya-soft-white)";

/** Vertical rectangle on plane y = const. */
const wallY = (x0: number, x1: number, y: number, z0: number, z1: number) => `M${P(x0, y, z0)}L${P(x1, y, z0)}L${P(x1, y, z1)}L${P(x0, y, z1)}Z`;
/** Roof plane on the far side: eave at y0 up to the ridge. */
const roofBack = `M${P(BAY.x0, BAY.y0, BAY.eave)}L${P(BAY.x1, BAY.y0, BAY.eave)}L${P(BAY.x1, RIDGE_Y, BAY.ridge)}L${P(BAY.x0, RIDGE_Y, BAY.ridge)}Z`;
const gable = `M${P(BAY.x0, BAY.y0, BAY.eave)}L${P(BAY.x0, RIDGE_Y, BAY.ridge)}L${P(BAY.x0, BAY.y1, BAY.eave)}Z`;
const gableWall = `M${P(BAY.x0, BAY.y0, 0)}L${P(BAY.x0, BAY.y1, 0)}L${P(BAY.x0, BAY.y1, BAY.eave)}L${P(BAY.x0, BAY.y0, BAY.eave)}Z`;

function framePaths() {
  const posts: string[] = [];
  const rafters: string[] = [];
  for (let x = BAY.x0; x <= BAY.x1 + 1; x += BAY_PITCH) {
    posts.push(post(x, BAY.y0, 0, BAY.eave), post(x, BAY.y1, 0, BAY.eave));
    rafters.push(seg([x, BAY.y0, BAY.eave], [x, RIDGE_Y, BAY.ridge]), seg([x, RIDGE_Y, BAY.ridge], [x, BAY.y1, BAY.eave]));
  }
  const beams =
    seg([BAY.x0, BAY.y0, BAY.eave], [BAY.x1, BAY.y0, BAY.eave]) +
    seg([BAY.x0, BAY.y1, BAY.eave], [BAY.x1, BAY.y1, BAY.eave]) +
    seg([BAY.x0, RIDGE_Y, BAY.ridge], [BAY.x1, RIDGE_Y, BAY.ridge]);
  // Glazing bars on the back wall and roof.
  const bars: string[] = [];
  for (let x = BAY.x0 + 20; x < BAY.x1; x += 20) bars.push(post(x, BAY.y0, 0, BAY.eave), seg([x, BAY.y0, BAY.eave], [x, RIDGE_Y, BAY.ridge]));
  bars.push(seg([BAY.x0, BAY.y0, BAY.eave / 2], [BAY.x1, BAY.y0, BAY.eave / 2]));
  bars.push(seg([BAY.x0, (BAY.y0 + RIDGE_Y) / 2, (BAY.eave + BAY.ridge) / 2], [BAY.x1, (BAY.y0 + RIDGE_Y) / 2, (BAY.eave + BAY.ridge) / 2]));
  return { posts: posts.join(""), rafters: rafters.join(""), beams, bars: bars.join("") };
}
const FRAME = framePaths();

/** Irrigation: header along y at the left gable, laterals above each row, drip lines to every other pot. */
function irrigationPaths() {
  const rows = Object.values(ROWS);
  const header = seg([BAY.x0 + 6, BAY.y0 + 6, PIPE_Z], [BAY.x0 + 6, BAY.y1 - 6, PIPE_Z]) + post(BAY.x0 + 6, BAY.y0 + 6, 0, PIPE_Z);
  const laterals = rows.map((y) => seg([BAY.x0 + 6, y, PIPE_Z], [GUTTER.x0 + GUTTER.w, y, PIPE_Z])).join("");
  const drips: string[] = [];
  rows.forEach((y) => {
    for (let k = 1; k < POTS; k += 2) drips.push(post(GUTTER.x0 + 12 + k * POT_PITCH, y, POT_Z + 10, PIPE_Z));
  });
  return { header, laterals, drips: drips.join("") };
}
const IRRIG = irrigationPaths();

const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};

/** Pot symbol with a crop at growth stage k (0..3). */
function Plant({ crop, k }: { crop: keyof typeof ROWS; k: number }) {
  const g = k / 3;
  if (crop === "tomato") return k === 0 ? <Seedling x={0} y={0} z={9} s={1.4} /> : <Tomato x={0} y={0} z={9} h={14 + g * 28} fruit={k >= 2 ? k + 1 : 0} />;
  if (crop === "lettuce") return k === 0 ? <Seedling x={0} y={0} z={9} s={1.2} /> : <Lettuce x={0} y={0} z={9} r={5 + g * 6} />;
  return k === 0 ? <Seedling x={0} y={0} z={9} s={1.1} /> : k === 1 ? <Lettuce x={0} y={0} z={9} r={4} /> : <Strawberry x={0} y={0} z={9} />;
}

function Gutter({ y, crop, delay, id }: { y: number; crop: keyof typeof ROWS; delay: number; id: string }) {
  const g: Box = { x: GUTTER.x0, y: y - GUTTER.d / 2, z: GUTTER.z, w: GUTTER.w, d: GUTTER.d, h: GUTTER.h };
  const per = Math.ceil(POTS / 4);
  return (
    <g>
      <Draw d={[0.12, 0.5, 0.88].map((f) => post(GUTTER.x0 + GUTTER.w * f, y, 0, GUTTER.z)).join("")} color={M.steelDark} w="light" delay={delay} dur={0.5} />
      <Solid box={g} color={M.white} delay={delay + 0.1} />
      {[0, 1, 2, 3].map((k) => (
        <g key={k} transform={at(GUTTER.x0 + 12 + k * per * POT_PITCH, y, POT_Z)}>
          <Repeat href={`#${id}-${crop}${k}`} n={k === 3 ? POTS - 3 * per : per} dx={POT_PITCH} />
        </g>
      ))}
    </g>
  );
}

export function Growing({ st, active }: SceneProps) {
  const id = useId();
  const glass = tone(M.glass);
  return (
    <Static st={st}>
      <Plate>
        <defs>
          {(Object.keys(ROWS) as (keyof typeof ROWS)[]).map((crop) =>
            [0, 1, 2, 3].map((k) => (
              <g key={`${crop}${k}`} id={`${id}-${crop}${k}`}>
                <Cyl cx={0} cy={0} r={6} rb={4.6} h={9} color={crop === "lettuce" ? M.black : M.terra} inner={M.soil} delay={0.5 + k * 0.1} />
                <Rise delay={0.9 + k * 0.12}>
                  <Plant crop={crop} k={k} />
                </Rise>
              </g>
            )),
          )}
        </defs>

        {/* Greenhouse: back wall and roof glass, left gable, frame */}
        <Fade delay={0} dur={0.8}>
          <path d={wallY(BAY.x0, BAY.x1, BAY.y0, 0, BAY.eave)} fill={glass.left} opacity={0.55} />
          <path d={roofBack} fill={glass.top} opacity={0.75} />
          <path d={gableWall} fill={glass.right} opacity={0.5} />
          <path d={gable} fill={glass.top} opacity={0.7} />
        </Fade>
        <Draw d={FRAME.bars} color={mix(M.steel, 70, SW)} w="light" delay={0.3} dur={0.9} />
        <Draw d={FRAME.posts + FRAME.rafters} color={M.steelDark} w="light" delay={0.2} dur={1} />
        <Draw d={FRAME.beams} color={M.steelDark} delay={0.4} dur={1} />
        {/* Ground: a strip of pale concrete path under the gutters */}
        <Fade delay={0.2}>
          <path d={`M${P(BAY.x0, BAY.y0)}L${P(BAY.x1, BAY.y0)}L${P(BAY.x1, BAY.y1)}L${P(BAY.x0, BAY.y1)}Z`} fill={mix(M.steel, 18, SW)} />
        </Fade>

        {/* Gutters with crops, back to front */}
        <Part i={0} active={active}>
          <Gutter y={ROWS.tomato} crop="tomato" delay={0.4} id={id} />
          <Gutter y={ROWS.lettuce} crop="lettuce" delay={0.55} id={id} />
          <Gutter y={ROWS.berry} crop="berry" delay={0.7} id={id} />
        </Part>

        {/* Irrigation */}
        <Part i={2} active={active}>
          <Draw d={IRRIG.header + IRRIG.laterals} color={M.water} delay={1} dur={1.1} />
          <Draw d={IRRIG.drips} color={M.water} w="light" delay={1.8} dur={0.6} opacity={0.8} />
          <Fade delay={2.2} dur={0.4}>
            {Object.values(ROWS).map((y) => (
              <Dot key={y} at={[BAY.x0 + 6, y, PIPE_Z]} r={2.6} fill={M.blue} />
            ))}
          </Fade>
        </Part>

        {/* Cut-away pot: front half removed, substrate layers and roots visible */}
        <Part i={1} active={active}>
          <Rise delay={1.1}>
            <Shadow cx={CUT.x + 2} cy={CUT.y + 2} r={CUT.rb * 1.2} />
            <path d={cylinderBody(CUT.x, CUT.y, CUT.r, CUT.h, 0, CUT.rb)} fill={tone(M.terra).left} />
            {/* section plane */}
            <path d={`M${P(CUT.x - CUT.r, CUT.y, 0)}L${P(CUT.x + CUT.r, CUT.y, 0)}L${P(CUT.x + CUT.r, CUT.y, CUT.h)}L${P(CUT.x - CUT.r, CUT.y, CUT.h)}Z`} fill={M.soil} />
            <path d={`M${P(CUT.x - CUT.r + 1, CUT.y, 0)}L${P(CUT.x + CUT.r - 1, CUT.y, 0)}L${P(CUT.x + CUT.r - 1, CUT.y, CUT.h * 0.3)}L${P(CUT.x - CUT.r + 1, CUT.y, CUT.h * 0.3)}Z`} fill={mix(M.soil, 70, SW)} />
            <path d={`M${P(CUT.x - CUT.r + 1, CUT.y, CUT.h * 0.3)}L${P(CUT.x + CUT.r - 1, CUT.y, CUT.h * 0.3)}L${P(CUT.x + CUT.r - 1, CUT.y, CUT.h * 0.42)}L${P(CUT.x - CUT.r + 1, CUT.y, CUT.h * 0.42)}Z`} fill={mix(M.steel, 60, SW)} />
            <path d={disc(CUT.x, CUT.y, CUT.r, CUT.h)} fill={tone(M.terra).top} />
            <path d={`M${P(CUT.x - CUT.r, CUT.y, CUT.h)}A${CUT.r * 1.2247 * 1.4} ${CUT.r * 0.7071 * 1.4} 0 0 1 ${P(CUT.x + CUT.r, CUT.y, CUT.h)}L${P(CUT.x + CUT.r, CUT.y, CUT.h)}Z`} fill={M.soil} />
            <path
              d={[-9, -4, 2, 7].map((o) => `M${P(CUT.x + o * 0.4, CUT.y, CUT.h - 3)}Q${P(CUT.x + o, CUT.y, CUT.h * 0.55)} ${P(CUT.x + o * 1.5, CUT.y, 4)}`).join("")}
              fill="none"
              stroke={mix(M.card, 85, SW)}
              style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.8)" }}
              strokeLinecap="round"
            />
            <path d={cylinderBody(CUT.x, CUT.y, CUT.r, CUT.h, 0, CUT.rb)} fill="none" stroke={tone(M.terra).line} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }} />
          </Rise>
          <Rise delay={1.5}>
            <Tomato x={CUT.x} y={CUT.y} z={CUT.h - 2} h={30} fruit={3} />
          </Rise>
        </Part>

        {/* Unit: a potted tomato seedling rides the rail. */}
        <Travel>
          <Cyl cx={0} cy={RAIL.y} r={6.5} rb={5} h={9} color={M.terra} inner={M.soil} delay={0} />
          <g>
            <Tomato x={0} y={RAIL.y} z={9} h={16} fruit={0} />
          </g>
        </Travel>
      </Plate>
    </Static>
  );
}
