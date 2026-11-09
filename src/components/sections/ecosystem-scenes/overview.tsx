"use client";

import {
  ACCENT,
  CONSTRUCTION,
  DashMarch,
  Draw,
  FACE,
  Fade,
  INK,
  IsoBox,
  Plate,
  RAIL,
  Static,
  Travel,
  cylinder,
  cylinderBody,
  disc,
  iso,
  plane,
  post,
  seg,
  type Box,
} from "./iso-kit";
import { Clamshell } from "./packs";

/**
 * Closing frame: the whole chain as six nodes on one line, lighting up in order,
 * while one unit rides the full rail. Glyphs echo the stage scenes.
 */
const NODE_Y = -14;
const NODE_X = [-200, -120, -40, 40, 120, 200];
const PAD = 36;
const STEP = 0.55;
const W_LIGHT = { strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" } as const;
const [ox, oy] = iso(0, 0, 0);
const at = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(x, y, z);
  return `translate(${Math.round((sx - ox) * 10) / 10} ${Math.round((sy - oy) * 10) / 10})`;
};

function Glyph({ k, x }: { k: number; x: number }) {
  const y = NODE_Y;
  const d = 0.9 + k * STEP;
  switch (k) {
    case 0: {
      const tray: Box = { x: x - 11, y: y - 8, w: 22, d: 16, h: 4 };
      return (
        <>
          <IsoBox box={tray} delay={d} dur={0.6} top={FACE.soft} />
          <Fade delay={d + 0.5}>
            {[-6, 0, 6].map((o) => (
              <path key={o} d={disc(x + o, y, 1.6, 4)} fill={ACCENT.green} />
            ))}
          </Fade>
        </>
      );
    }
    case 1:
      return (
        <>
          <Fade delay={d + 0.4}>
            <path d={cylinderBody(x, y, 7, 12, 0, 5)} fill={FACE.left} />
          </Fade>
          <Draw d={cylinder(x, y, 7, 12, 0, 5)} delay={d} dur={0.6} />
          <Draw d={post(x, y, 12, 26) + seg([x, y, 20], [x - 6, y + 4, 27]) + seg([x, y, 17], [x + 6, y - 4, 24])} color={ACCENT.green} delay={d + 0.4} dur={0.5} />
        </>
      );
    case 2: {
      const crate: Box = { x: x - 11, y: y - 8, w: 22, d: 16, h: 13 };
      return (
        <>
          <IsoBox box={crate} delay={d} dur={0.6} top={FACE.soft} />
          <Fade delay={d + 0.5}>
            {[
              [-5, -3],
              [2, -4],
              [-2, 2],
              [5, 1],
            ].map(([dx, dy]) => (
              <path key={`${dx}${dy}`} d={disc(x + dx, y + dy, 1.9, 14)} fill={ACCENT.orange} />
            ))}
          </Fade>
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
      const deck: Box = { x: x - 12, y: y - 8, z: 6, w: 24, d: 16, h: 2 };
      return (
        <>
          <IsoBox box={deck} delay={d} dur={0.6} inner={false} />
          <Draw d={post(x - 12, y + 8, 8, 26) + post(x + 12, y + 8, 8, 26) + post(x + 12, y - 8, 8, 26) + seg([x - 12, y + 8, 26], [x + 12, y + 8, 26]) + seg([x + 12, y + 8, 26], [x + 12, y - 8, 26])} color={INK} w="light" delay={d + 0.3} dur={0.6} />
          <Fade delay={d + 0.5}>
            {[-8, 0, 8].map((o) => (
              <path key={o} d={disc(x + o, y, 2, 6)} fill={ACCENT.blueLight} />
            ))}
          </Fade>
        </>
      );
    }
    default: {
      const base: Box = { x: x - 12, y: y - 8, w: 24, d: 16, h: 3 };
      return (
        <>
          <IsoBox box={base} delay={d} dur={0.5} inner={false} />
          <Draw d={post(x - 12, y - 8, 3, 28) + post(x + 12, y - 8, 3, 28) + seg([x - 12, y - 8, 15], [x + 12, y - 8, 15]) + seg([x - 12, y - 8, 28], [x + 12, y - 8, 28])} delay={d + 0.2} dur={0.6} />
          <Fade delay={d + 0.6}>
            {[-8, -2, 4].map((o) => (
              <path key={o} d={plane(x + o, y - 6, 4, 10, 15)} fill={FACE.soft} />
            ))}
            {[-6, 0, 6].map((o) => (
              <path key={o} d={disc(x + o, y - 1, 1.4, 15.5)} fill={ACCENT.orange} />
            ))}
          </Fade>
        </>
      );
    }
  }
}

export function Overview({ st }: { st: boolean }) {
  return (
    <Static st={st}>
      <Plate>
        {/* Node pads and the connecting line */}
        <Fade delay={0.2} dur={0.6}>
          {NODE_X.map((x) => (
            <path key={x} d={plane(x - PAD / 2, NODE_Y - PAD / 2, PAD, PAD)} fill={FACE.right} />
          ))}
        </Fade>
        <Draw d={NODE_X.map((x) => plane(x - PAD / 2, NODE_Y - PAD / 2, PAD, PAD)).join("")} color={CONSTRUCTION} w="light" delay={0.1} dur={1} />
        <DashMarch
          d={NODE_X.slice(1)
            .map((x, k) => seg([NODE_X[k] + PAD / 2 + 4, NODE_Y], [x - PAD / 2 - 4, NODE_Y]))
            .join("")}
          color={ACCENT.greenLight}
          delay={0.6}
          dur={1.6}
          opacity={0.75}
        />
        {/* Lit rings, one after another */}
        {NODE_X.map((x, k) => (
          <Fade key={x} delay={1.2 + k * STEP} dur={0.5}>
            <path d={disc(x, NODE_Y, 19)} fill="none" stroke={ACCENT.greenLight} style={W_LIGHT} />
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
