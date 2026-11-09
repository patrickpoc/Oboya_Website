"use client";

import { Fragment } from "react";
import { BASELINE, CX, Contact, Flower, Gloss, Pop, Rise, SceneFrame, Shade, Wheel, tone, useMat } from "./kit";

type SceneProps = { st: boolean };
type FK = "Orange" | "Yellow" | "White";

const BUCKET_X = [348, 424, 500, 576, 652];
const PALETTE: FK[][] = [["Orange", "Yellow", "White"], ["White", "Orange", "Yellow"], ["Yellow", "White", "Orange"], ["Orange", "White", "Yellow"], ["Yellow", "Orange", "White"]];
const SHELF_Y = [190, 290];
const HEADS: Array<[number, number, number]> = [[-11, -58, 8], [0, -68, 9], [11, -58, 8]];

function Bucket({ x, y, row, i }: { x: number; y: number; row: number; i: number }) {
  const m = useMat();
  const pal = PALETTE[(i + row * 2) % PALETTE.length];
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-3 -32Q-8 -46 -11 -58M0 -32V-68M3 -32Q8 -46 11 -58" fill="none" strokeWidth={2} strokeLinecap="round" style={{ stroke: tone("green", 84) }} />
      {HEADS.map(([hx, hy, r], j) => (
        <g key={j} transform={`translate(${hx} ${hy})`}>
          <Flower r={r} n={5 + (j % 2)} k={pal[j]} rot={0.3 * j + i} />
        </g>
      ))}
      <path d="M-19 -34H19L15 0Q15 2 13 2H-13Q-15 2 -15 0Z" fill={m("plastic")} />
      <path d="M-18 -22H18L16.5 -12H-16.5Z" style={{ fill: tone("blue-light") }} />
      <Shade d="M19 -34L15 0Q15 2 13 2H6L10 -34Z" o={0.22} />
      <path d="M-21 -36H21Q22 -36 22 -34.5V-32Q22 -31 21 -31H-21Q-22 -31 -22 -32V-34.5Q-22 -36 -21 -36Z" fill={m("plastic")} />
      <Gloss d="M-16 -30L-13 -4" w={1.6} o={0.7} />
    </g>
  );
}

function Train({ st }: SceneProps) {
  const m = useMat();
  return (
    <>
      <Contact x={CX} y={BASELINE + 2} w={640} o={0.6} />
      <g data-eco-subject>
        <Rise st={st} x={130} y={0} dur={0.9}>
          {/* AGV */}
          <Wheel cx={134} cy={326} r={14} />
          <Wheel cx={226} cy={326} r={14} />
          <path d="M108 270H250Q262 270 262 282V318Q262 326 254 326H104Q96 326 96 318V282Q96 270 108 270Z" fill={m("plastic")} />
          <Shade d="M250 270Q262 270 262 282V318Q262 326 254 326H214L226 270Z" o={0.24} />
          <path d="M96 296H262V306H96Z" style={{ fill: tone("blue-light") }} />
          <path d="M100 262H258V270H100Z" fill={m("metal")} />
          <path d="M96 282H108V292H96Z" style={{ fill: tone("yellow-light") }} />
          <path d="M214 262V236" fill="none" strokeWidth={4} strokeLinecap="round" style={{ stroke: tone("soft-white", 75, "blue") }} />
          <path d="M206 236Q206 222 214 222Q222 222 222 236Z" fill={m("red")} />
          <Gloss d="M104 274H200" w={2} o={0.7} />
          <path d="M262 314H296V320H262Z" fill={m("metal")} />
          {/* trolley frame */}
          <Wheel cx={322} cy={326} r={14} />
          <Wheel cx={676} cy={326} r={14} />
          <path d="M296 100H304V300H296ZM696 100H704V300H696Z" fill={m("metal")} />
          <path d="M296 100H704V108H296Z" fill={m("metal")} />
          {SHELF_Y.map((y) => (
            <path key={y} d={`M290 ${y}H710V${y + 10}H290Z`} fill={m("metal")} />
          ))}
          <path d="M290 298H710V304H290Z" fillOpacity={0.3} style={{ fill: tone("blue-dark") }} />
          <Gloss d="M296 102H500M292 192H500M292 292H500" w={1.6} o={0.7} />
        </Rise>
        {SHELF_Y.map((y, row) => (
          <Fragment key={y}>
            {BUCKET_X.map((x, i) => (
              <Pop key={x} st={st} d={0.7 + row * 0.2 + i * 0.05} dur={0.4}>
                <Bucket x={x} y={y} row={row} i={i} />
              </Pop>
            ))}
          </Fragment>
        ))}
      </g>
    </>
  );
}

/** AGV towing a logistic trolley of flower buckets. */
export function Logistics({ st }: SceneProps) {
  return (
    <SceneFrame kind="store">
      <Train st={st} />
    </SceneFrame>
  );
}
