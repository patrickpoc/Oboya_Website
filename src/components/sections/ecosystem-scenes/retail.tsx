"use client";

import { Fragment } from "react";
import {
  BASELINE,
  CX,
  Clamshell,
  Contact,
  FlowerSleeve,
  Gloss,
  LettuceBag,
  Rise,
  SceneFrame,
  Shade,
  tone,
  useMat,
  useSid,
} from "./kit";

type SceneProps = { st: boolean };

type Kind = "c0" | "c1" | "t1" | "b0" | "b1" | "s0" | "s1";

// Merchandised blocks per shelf: the same product repeated side by side, with a second row behind.
// Shelf board top y, then [product, count] blocks.
const SHELVES: Array<{ y: number; blocks: Array<[Kind, number]> }> = [
  { y: 138, blocks: [["c0", 3], ["b0", 4], ["s0", 3]] },
  { y: 228, blocks: [["s1", 3], ["c1", 3], ["b1", 4]] },
  { y: 318, blocks: [["b0", 3], ["t1", 3], ["s0", 4]] },
];
const SCALE = 0.8;
const PITCH: Record<string, number> = { c: 56, t: 56, b: 47, s: 47 };
const GAP = 8;

function layout(blocks: Array<[Kind, number]>) {
  const widths = blocks.map(([k, n]) => PITCH[k[0]] * n);
  const total = widths.reduce((a, b) => a + b, 0) + GAP * (blocks.length - 1);
  let x = CX - total / 2;
  return blocks.map(([k, n], bi) => {
    const p = PITCH[k[0]];
    const x0 = x;
    x += widths[bi] + GAP;
    return { k, n, p, x0 };
  });
}

function Defs() {
  const sid = useSid();
  return (
    <defs>
      <g id={`${sid}-c0`}><Clamshell v={0} /></g>
      <g id={`${sid}-c1`}><Clamshell v={1} /></g>
      <g id={`${sid}-t1`}><Clamshell v={1} kind="tomatoes" /></g>
      <g id={`${sid}-b0`}><LettuceBag v={0} /></g>
      <g id={`${sid}-b1`}><LettuceBag v={1} /></g>
      <g id={`${sid}-s0`}><FlowerSleeve v={0} /></g>
      <g id={`${sid}-s1`}><FlowerSleeve v={1} /></g>
    </defs>
  );
}

function Shelving({ st }: SceneProps) {
  const m = useMat();
  const sid = useSid();
  return (
    <>
      <Defs />
      <Contact x={CX} y={BASELINE + 2} w={580} o={0.6} />
      <g data-eco-subject>
        <Rise st={st} y={14} dur={0.55}>
          {/* back panel, side uprights, lit canopy (blank), plinth */}
          <path d="M136 58H664V326H136Z" style={{ fill: tone("blue", 55) }} />
          <path d="M136 58H664V326H136Z" fillOpacity={0.5} style={{ fill: tone("blue-light", 40, "blue") }} />
          <path d="M136 58H664V326H136Z" fill={m("shadeX")} />
          <path d="M124 56H136V338H124ZM664 56H676V338H664Z" fill={m("metal")} />
          <path d="M118 36H682Q686 36 686 40V54Q686 58 682 58H118Q114 58 114 54V40Q114 36 118 36Z" fill={m("plastic")} />
          <path d="M132 43H668Q672 43 672 46V50Q672 53 668 53H132Q128 53 128 50V46Q128 43 132 43Z" style={{ fill: tone("soft-white") }} fillOpacity={0.9} />
          <Gloss d="M120 38H420" w={1.6} o={0.7} />
          <path d="M124 326H676V338Q676 340 673 340H127Q124 340 124 338Z" fill={m("metal")} />
          <path d="M124 326H676V330H124Z" fillOpacity={0.3} style={{ fill: tone("blue-dark") }} />
        </Rise>
        {SHELVES.map(({ y, blocks }, row) => (
          <Fragment key={y}>
            <Rise st={st} d={0.1 + row * 0.1} y={10} dur={0.5}>
              <path d={`M136 ${y}H664V${y + 24}H136Z`} fill={m("under")} />
              <path d={`M130 ${y}H670V${y + 7}Q670 ${y + 8} 668 ${y + 8}H132Q130 ${y + 8} 130 ${y + 7}Z`} fill={m("metal")} />
              <Shade d={`M130 ${y + 4}H670V${y + 7}Q670 ${y + 8} 668 ${y + 8}H132Q130 ${y + 8} 130 ${y + 7}Z`} o={0.28} />
              <Gloss d={`M132 ${y + 1}H420`} w={1.4} o={0.75} />
              <ellipse cx={CX} cy={y + 0.5} rx={246} ry={3} fill={m("shadow")} opacity={0.55} />
            </Rise>
            {layout(blocks).map(({ k, n, p, x0 }, bi) => (
              <Rise key={bi} st={st} d={0.3 + row * 0.2 + bi * 0.1} y={10} dur={0.5}>
                {Array.from({ length: n - 1 }, (_, i) => (
                  <use key={`b${i}`} href={`#${sid}-${k}`} transform={`translate(${x0 + p * (i + 1)} ${y - 6}) scale(${SCALE * 0.92})`} />
                ))}
                {Array.from({ length: n }, (_, i) => (
                  <use key={`f${i}`} href={`#${sid}-${k}`} transform={`translate(${x0 + p * (i + 0.5)} ${y}) scale(${SCALE})`} />
                ))}
              </Rise>
            ))}
          </Fragment>
        ))}
      </g>
    </>
  );
}

export function Retail({ st }: SceneProps) {
  return (
    <SceneFrame kind="store">
      <Shelving st={st} />
    </SceneFrame>
  );
}
