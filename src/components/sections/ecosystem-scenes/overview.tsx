"use client";

import { Cyl, Flowering, M, Rise, Seedling, Solid, Stems, mix } from "./flat-kit";
import { DashMarch, Draw, Fade, Plate, RAIL, Static, Travel, disc, iso, plane, post, seg, type Box } from "./iso-kit";
import { Clamshell } from "./packs";

/**
 * Closing frame: the whole chain as six nodes on one line, lighting up in order,
 * while one unit rides the full rail. Each node is a miniature of its stage.
 */
const NODE_Y = -14;
const NODE_X = [-200, -120, -40, 40, 120, 200];
const PAD = 36;
const STEP = 0.5;
const SW = "var(--oboya-soft-white)";

const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};

function Glyph({ k, x }: { k: number; x: number }) {
  const y = NODE_Y;
  const d = 0.8 + k * STEP;
  switch (k) {
    case 0: {
      const tray: Box = { x: x - 11, y: y - 8, w: 22, d: 16, h: 4 };
      return (
        <>
          <Solid box={tray} color={M.black} delay={d} />
          <Rise delay={d + 0.3}>
            {[-6, 0, 6].map((o) => (
              <Seedling key={o} x={x + o} y={y} z={4} s={1.3} />
            ))}
          </Rise>
        </>
      );
    }
    case 1:
      return (
        <>
          <Cyl cx={x} cy={y} r={7} rb={5.4} h={11} color={M.terra} inner={M.soil} delay={d} />
          <Rise delay={d + 0.3}>
            <Flowering x={x} y={y} z={11} color={M.pink} h={12} />
          </Rise>
        </>
      );
    case 2: {
      const crate: Box = { x: x - 11, y: y - 8, w: 22, d: 16, h: 13 };
      return (
        <>
          <Solid box={crate} color={M.blue} delay={d} />
          <Rise delay={d + 0.3}>
            <path d={plane(x - 9.5, y - 6.5, 19, 13, 12.5)} fill={mix(M.fruit, 35, M.soil)} />
            {[
              [-5, -3],
              [2, -4],
              [-2, 2],
              [5, 1],
              [0, -0.5],
            ].map(([dx, dy]) => (
              <path key={`${dx}${dy}`} d={disc(x + dx, y + dy, 2.2, 14)} fill={M.fruit} />
            ))}
          </Rise>
        </>
      );
    }
    case 3:
      return (
        <g transform={at(x, y, 0)}>
          <Clamshell delay={d} />
        </g>
      );
    case 4: {
      const deck: Box = { x: x - 12, y: y - 8, z: 5, w: 24, d: 16, h: 3 };
      return (
        <>
          <Solid box={deck} color={M.steel} delay={d} />
          <Draw d={post(x - 12, y + 8, 8, 28) + post(x + 12, y + 8, 8, 28) + post(x + 12, y - 8, 8, 28) + post(x - 12, y - 8, 8, 28) + seg([x - 12, y + 8, 28], [x + 12, y + 8, 28]) + seg([x + 12, y + 8, 28], [x + 12, y - 8, 28])} color={M.steelDark} w="light" delay={d + 0.2} dur={0.6} />
          {[-7, 0, 7].map((o) => (
            <g key={o}>
              <Cyl cx={x + o} cy={y} z={8} r={3.2} rb={2.6} h={8} color={M.black} inner={M.water} delay={d + 0.3} shadow={false} />
              <Rise delay={d + 0.5}>
                <Stems x={x + o} y={y} z={15} h={8} colors={[M.pink, M.yellow]} />
              </Rise>
            </g>
          ))}
        </>
      );
    }
    default: {
      const base: Box = { x: x - 12, y: y - 8, w: 24, d: 16, h: 3 };
      return (
        <>
          <Solid box={base} color={M.steelDark} delay={d} />
          <Solid box={{ x: x - 12, y: y - 8, z: 3, w: 24, d: 3, h: 26 }} color={mix(M.steel, 35, SW)} delay={d + 0.1} />
          <Solid box={{ x: x - 12, y: y - 5, z: 14, w: 24, d: 13, h: 2 }} color={M.white} delay={d + 0.2} />
          <Rise delay={d + 0.4}>
            {[-7, 0, 7].map((o) => (
              <path key={o} d={plane(x + o - 3, y - 3, 6, 6, 16.2)} fill={M.fruit} />
            ))}
            {[-7, 0, 7].map((o) => (
              <path key={o} d={plane(x + o - 3, y - 3, 6, 6, 5.2)} fill={M.leafLight} />
            ))}
          </Rise>
        </>
      );
    }
  }
}

export function Overview({ st }: { st: boolean }) {
  return (
    <Static st={st}>
      <Plate>
        <Fade delay={0.2} dur={0.6}>
          {NODE_X.map((x) => (
            <path key={x} d={plane(x - PAD / 2, NODE_Y - PAD / 2, PAD, PAD)} fill={mix(M.steel, 30, SW)} />
          ))}
        </Fade>
        <DashMarch
          d={NODE_X.slice(1)
            .map((x, k) => seg([NODE_X[k] + PAD / 2 + 4, NODE_Y], [x - PAD / 2 - 4, NODE_Y]))
            .join("")}
          color={M.leaf}
          delay={0.6}
          dur={1.6}
          opacity={0.8}
        />
        {NODE_X.map((x, k) => (
          <Fade key={x} delay={1.1 + k * STEP} dur={0.5}>
            <path d={disc(x, NODE_Y, 19)} fill="none" stroke={M.leafLight} style={{ strokeWidth: "var(--eco-ink, 1.2px)" }} />
          </Fade>
        ))}
        {NODE_X.map((x, k) => (
          <Glyph key={x} k={k} x={x} />
        ))}

        <Travel span={520}>
          <g transform={at(0, RAIL.y, 0)}>
            <Clamshell unit />
          </g>
        </Travel>
      </Plate>
    </Static>
  );
}
