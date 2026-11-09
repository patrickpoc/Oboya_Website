"use client";

import { Fragment } from "react";
import { BASELINE, CX, Contact, Frill, Gloss, Leaf, Rise, SceneFrame, Shade, Strawberry, tone, useMat, type LeafKey } from "./kit";

type SceneProps = { st: boolean };

const POTS = [160, 280, 400, 520, 640];
const PIPE_Y = 66;

// Plant leaves for the lettuce pots and the strawberry pots: [angle, length, material].
const STRAW_LEAVES: Array<[number, number, LeafKey]> = [[-165, 40, "leafDeep"], [-15, 40, "leaf"], [-135, 50, "leaf"], [-45, 50, "leafDeep"], [-112, 58, "leafLight"], [-68, 58, "leaf"], [-90, 50, "leafLight"]];
const FRUIT: Array<[number, number, number]> = [[-34, 12, -24], [30, 8, 20], [-8, 20, 6]];
const LETTUCE: Array<[number, number, number, LeafKey, number]> = [[-160, 58, 15, "leafDeep", 0], [-20, 58, 15, "leafDeep", 0], [-138, 70, 16, "leaf", 1], [-42, 70, 16, "leaf", 1], [-116, 78, 16, "leafLight", 2], [-64, 78, 16, "leaf", 2], [-97, 84, 15, "leafLight", 3], [-83, 74, 14, "leaf", 3]];

function Pot({ x }: { x: number }) {
  const m = useMat();
  return (
    <g transform={`translate(${x} ${BASELINE})`}>
      <path d="M-40 -66H40L32 -4Q31 0 26 0H-26Q-31 0 -32 -4Z" fill={m("terracotta")} />
      <Shade d="M40 -66L32 -4Q31 0 26 0H8L18 -66Z" o={0.24} />
      <path d="M-45 -76H45Q48 -76 48 -72V-64Q48 -61 45 -61H-45Q-48 -61 -48 -64V-72Q-48 -76 -45 -76Z" fill={m("terracotta")} />
      <Shade d="M-48 -64H48V-61Q48 -61 45 -61H-45Q-48 -61 -48 -64Z" o={0.3} />
      <path d="M-40 -75Q0 -81 40 -75L38 -70Q0 -65 -38 -70Z" fill={m("soil")} />
      <Gloss d="M-42 -74H-6M-34 -58L-30 -12" w={2} o={0.55} />
    </g>
  );
}

function Plant({ x, i }: { x: number; i: number }) {
  const lettuce = i % 2 === 0;
  return (
    <g transform={`translate(${x} ${BASELINE - 72})`}>
      {lettuce
        ? LETTUCE.map(([a, len, w, k], j) => <Frill key={j} a={a} len={len} w={w} k={k} />)
        : (
          <>
            <path d="M0 0Q-2 -22 -4 -42M0 0Q4 -20 10 -38" fill="none" strokeWidth={2.5} strokeLinecap="round" style={{ stroke: tone("green", 80) }} />
            {STRAW_LEAVES.map(([a, len, k], j) => <Leaf key={j} a={a} len={len} w={0.36} k={k} bend={((j % 3) - 1) * 0.07} />)}
            {FRUIT.map(([fx, fy, r], j) => (
              <g key={j} transform={`translate(${fx} ${fy - 2})`}>
                <Strawberry rot={r} s={1.15} />
              </g>
            ))}
          </>
        )}
    </g>
  );
}

function Drop({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 -9C3 -4 5 -1 5 2A5 5 0 0 1 -5 2C-5 -1 -3 -4 0 -9Z" style={{ fill: tone("blue-light") }} />
      <path d="M-2.4 0Q-2.4 -3 -0.8 -5" fill="none" strokeWidth={1.2} strokeLinecap="round" strokeOpacity={0.7} style={{ stroke: tone("soft-white") }} />
    </g>
  );
}

function Rig({ st }: SceneProps) {
  const m = useMat();
  return (
    <>
      <Contact x={CX} y={BASELINE + 2} w={640} o={0.6} />
      <g data-eco-subject>
        <Rise st={st} y={-14} dur={0.6}>
          <path d="M92 58H108V340H92ZM692 58H708V340H692Z" fill={m("metal")} />
          <path d={`M88 ${PIPE_Y - 10}H712Q716 ${PIPE_Y - 10} 716 ${PIPE_Y - 6}V${PIPE_Y + 6}Q716 ${PIPE_Y + 10} 712 ${PIPE_Y + 10}H88Q84 ${PIPE_Y + 10} 84 ${PIPE_Y + 6}V${PIPE_Y - 6}Q84 ${PIPE_Y - 10} 88 ${PIPE_Y - 10}Z`} fill={m("metal")} />
          <Gloss d={`M90 ${PIPE_Y - 6}H400`} w={2} o={0.7} />
          {POTS.map((x) => (
            <Fragment key={x}>
              <path d={`M${x - 1.5} ${PIPE_Y + 10}V132`} fill="none" strokeWidth={3} strokeLinecap="round" style={{ stroke: tone("soft-white", 80, "blue") }} />
              <path d={`M${x - 5} 132H${x + 5}L${x + 2.5} 140H${x - 2.5}Z`} fill={m("plastic")} />
            </Fragment>
          ))}
        </Rise>
        {POTS.map((x, i) => (
          <Rise key={x} st={st} d={0.15 + i * 0.1} y={12} dur={0.55}>
            <Pot x={x} />
          </Rise>
        ))}
        {POTS.map((x, i) => (
          <Rise key={x} st={st} d={0.45 + i * 0.1} y={22} dur={0.6}>
            <Plant x={x} i={i} />
          </Rise>
        ))}
        {POTS.map((x, i) => (
          <Rise key={x} st={st} d={0.6 + i * 0.08} y={-28} dur={0.6}>
            <Drop x={x} y={150 + (i % 2) * 8} />
            <Drop x={x + (i % 2 ? 3 : -3)} y={168 + (i % 3) * 4} />
          </Rise>
        ))}
      </g>
    </>
  );
}

export function Growing({ st }: SceneProps) {
  return (
    <SceneFrame kind="greenhouse">
      <Rig st={st} />
    </SceneFrame>
  );
}
