"use client";

import {
  ACCENT,
  CONSTRUCTION,
  DashMarch,
  Draw,
  FACE,
  Faces,
  Fade,
  INK,
  IsoBox,
  Plate,
  RAIL,
  Static,
  Travel,
  accentFace,
  boxInner,
  boxOutline,
  cylinder,
  cylinderBody,
  disc,
  plane,
  post,
  seg,
  type Box,
} from "./iso-kit";

/**
 * Closing frame: the whole chain as six nodes on one line, lighting up in order,
 * while one unit rides the full rail. Glyphs echo the stage scenes.
 */
const NODE_Y = -24;
const NODE_X = [-215, -129, -43, 43, 129, 215];
const PAD = 38;
const STEP = 0.55;
const W_LIGHT = { strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" } as const;

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
          <IsoBox box={crate} delay={d} dur={0.6} />
          <Draw d={plane(x - 7, y - 4, 14, 8, 13)} color={ACCENT.orange} w="light" delay={d + 0.5} dur={0.4} />
        </>
      );
    }
    case 3: {
      const pack: Box = { x: x - 7, y: y - 6, w: 14, d: 12, h: 18 };
      return <IsoBox box={pack} delay={d} dur={0.6} top={accentFace("orange", 60)} />;
    }
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
              <path key={o} d={plane(x + o, y - 6, 4, 10, 15)} fill={accentFace("orange", 55)} />
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
          <Fade delay={0} dur={0.3}>
            <Faces box={{ x: -14, y: RAIL.y - 10, w: 28, d: 20, h: 16 }} top={accentFace("orange", 60)} />
          </Fade>
          <path d={boxOutline({ x: -14, y: RAIL.y - 10, w: 28, d: 20, h: 16 })} fill="none" stroke={ACCENT.greenLight} strokeLinejoin="round" style={{ strokeWidth: "var(--eco-ink, 1.2px)" }} />
          <path d={boxInner({ x: -14, y: RAIL.y - 10, w: 28, d: 20, h: 16 })} fill="none" stroke={INK} strokeLinejoin="round" style={W_LIGHT} />
        </Travel>
      </Plate>
    </Static>
  );
}
