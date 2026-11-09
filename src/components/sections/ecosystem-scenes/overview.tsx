"use client";

import { useId } from "react";
import { M, PottedMum, Rise, Solid, mix, tone } from "./flat-kit";
import { DashMarch, Fade, Plate, RAIL, Static, Travel, at, disc, faceY, iso, pct, plane, seg, type Box } from "./iso-kit";
import { BucketDefs, CC, CCTrolley, Crate, Pot, Punnet, Tray } from "./packs";

/**
 * Closing frame: the whole chain as six nodes on one line, lighting up in order, while one
 * punnet rides the full rail. Each node is the product that leaves its stage.
 */
const NODE_Y = -14;
const NODE_X = [-255, -193, -131, -69, -7, 55];
const PAD = 38;
const STEP = 0.4;
const [OX, OY] = iso(0, 0, 0);
/** Translate a symbol to world (x, y) and scale it about that point. */
const scaled = (x: number, y: number, k: number) => {
  const [sx, sy] = iso(x, y, 0);
  return `translate(${sx} ${sy}) scale(${k}) translate(${-OX} ${-OY})`;
};
const SW = "var(--oboya-soft-white)";
const BD = "var(--oboya-blue-dark)";
/** Node ring centres (panel %), ring radius (panel % of width) and the moment each lights up, for the stage-name labels. */
export const OVERVIEW_NODES = NODE_X.map((x, k) => ({ ...pct(x, NODE_Y, 0), r: 4.5, delay: 1.1 + k * STEP }));

function Glyph({ k, x, id }: { k: number; x: number; id: string }) {
  const y = NODE_Y;
  const d = 0.8 + k * STEP;
  switch (k) {
    case 0:
      return (
        <g transform={at(x - 20, y - 12, 0)}>
          <Tray grow={2} delay={d} />
        </g>
      );
    case 1:
      return (
        <>
          <Pot cx={x} cy={y} r={6} h={10} color={M.black} delay={d} />
          <Rise delay={d + 0.3}>
            <PottedMum x={x} y={y} z={10} color={M.yellow} h={11} blooms={4} />
          </Rise>
        </>
      );
    case 2:
      return (
        <g transform={at(x, y, 0)}>
          <Crate fill="tomato" delay={d} />
        </g>
      );
    case 3:
      return (
        <g transform={at(x, y, 0)}>
          <Punnet delay={d} />
          <g transform={at(0, 0, 4.6)}>
            <Punnet delay={d + 0.15} />
          </g>
        </g>
      );
    case 4:
      return (
        <g transform={scaled(x, y, 0.5)}>
          <CCTrolley
            x={-CC.w / 2}
            y={-CC.d / 2}
            levels={[CC.deck, 44]}
            top={74}
            delay={d}
            content={(lvl, z) => (
              <g transform={at(-CC.w / 2 + 12, 0, z)}>
                {[0, 1, 2].map((i) => (
                  <use key={i} href={`#${id}-bucket${(i + lvl) % 3}`} transform={at(i * 22, 0, 0)} />
                ))}
              </g>
            )}
          />
        </g>
      );
    default: {
      const base: Box = { x: x - 14, y: y - 9, w: 28, d: 18, h: 4 };
      return (
        <>
          <Solid box={base} tones={tone(M.black, true)} delay={d} />
          <Solid box={{ x: x - 14, y: y - 9, z: 4, w: 28, d: 3, h: 30 }} color={mix(M.steel, 72, SW)} delay={d + 0.1} />
          <Rise delay={d + 0.3} dur={0.4}>
            <path d={faceY(x - 14, y - 6, 30, 28, 4)} fill={M.leaf} />
          </Rise>
          <Solid box={{ x: x - 14, y: y - 6, z: 16, w: 28, d: 12, h: 1.6 }} color={M.white} delay={d + 0.2} />
          <g transform={at(x - 7, y, 17.6)}>
            <Punnet delay={d + 0.4} />
          </g>
          <g transform={at(x + 6, y, 17.6)}>
            <Punnet delay={d + 0.45} />
          </g>
          <Pot cx={x - 6} cy={y + 1} z={4} r={4} h={7} delay={d + 0.3} shadow={false} />
          <Rise delay={d + 0.5}>
            <PottedMum x={x - 6} y={y + 1} z={11} color={M.pink} h={6} blooms={2} />
          </Rise>
          <Pot cx={x + 6} cy={y + 1} z={4} r={4} h={7} color={M.black} delay={d + 0.35} shadow={false} />
          <Rise delay={d + 0.55}>
            <PottedMum x={x + 6} y={y + 1} z={11} color={M.yellow} h={6} blooms={2} />
          </Rise>
        </>
      );
    }
  }
}

export function Overview({ st }: { st: boolean }) {
  const id = useId();
  return (
    <Static st={st}>
      <Plate>
        <defs>
          <BucketDefs id={id} delay={0.8 + 4 * STEP + 0.3} />
        </defs>
        <Fade delay={0.2} dur={0.6}>
          {NODE_X.map((x) => (
            <path key={x} d={plane(x - PAD / 2, NODE_Y - PAD / 2, PAD, PAD)} fill={mix(SW, 10, BD)} />
          ))}
        </Fade>
        <DashMarch
          d={NODE_X.slice(1)
            .map((x, k) => seg([NODE_X[k] + PAD / 2 + 4, NODE_Y], [x - PAD / 2 - 4, NODE_Y]))
            .join("")}
          color={M.leafLight}
          delay={0.6}
          dur={1.6}
          opacity={0.8}
        />
        {NODE_X.map((x, k) => (
          <Fade key={x} delay={1.1 + k * STEP} dur={0.5}>
            <path d={disc(x, NODE_Y, 21)} fill="none" stroke={M.leafLight} opacity={0.7} style={{ strokeWidth: "var(--eco-ink, 1.2px)" }} />
          </Fade>
        ))}
        {NODE_X.map((x, k) => (
          <Glyph key={x} k={k} x={x} id={id} />
        ))}

        <Travel span={520}>
          <g transform={at(0, RAIL.y, 0)}>
            <Punnet unit />
          </g>
        </Travel>
      </Plate>
    </Static>
  );
}
