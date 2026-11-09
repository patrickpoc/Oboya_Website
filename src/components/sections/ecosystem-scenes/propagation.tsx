"use client";

import { BASELINE, CX, Contact, Gloss, Grow, Rise, SceneFrame, Shade, Sprout, tone, useMat } from "./kit";

type SceneProps = { st: boolean };

const COLS = 11;
const ROWS = [212, 236, 260, 284, 308];
// Tray top plane: back edge y=196 (x 232..568), front edge y=322 (x 148..652).
const widthAt = (y: number) => 336 + 1.333 * (y - 196);
const pitchAt = (y: number) => (widthAt(y) - 30) / COLS;
const cellX = (y: number, i: number) => CX + (i - (COLS - 1) / 2) * pitchAt(y);

function cell(cx: number, cy: number, w: number, h: number) {
  return `M${cx - w / 2} ${cy - h / 2}Q${cx} ${cy - h / 2 - 2} ${cx + w / 2} ${cy - h / 2}L${cx + w / 2 - 2} ${cy + h / 2 - 1}Q${cx} ${cy + h / 2 + 1.5} ${cx - w / 2 + 2} ${cy + h / 2 - 1}Z`;
}

function Machine() {
  const m = useMat();
  return (
    <g>
      <path d="M118 176H682V204H118Z" fill={m("metal")} />
      <path d="M150 60H168V204H150ZM632 60H650V204H632Z" fill={m("metal")} />
      <path d="M150 58H650V80H150Z" fill={m("metal")} />
      <path d="M326 80H474V128H326Z" fill={m("plastic")} />
      <path d="M326 110H474V120H326Z" style={{ fill: tone("blue-light") }} />
      <path d="M368 58L384 30H416L432 58Z" fill={m("metal")} />
      <path d="M350 128V152M367 128V152M384 128V152M401 128V152M418 128V152M435 128V152M452 128V152" fill="none" strokeWidth={3.5} strokeLinecap="round" style={{ stroke: tone("soft-white", 70, "blue") }} />
    </g>
  );
}

function Tray({ st }: SceneProps) {
  const m = useMat();
  return (
    <>
      <Contact x={CX} y={BASELINE + 2} w={580} o={0.6} />
      <g data-eco-subject>
        <Rise st={st} y={16} dur={0.6}>
          <path d="M244 196H556Q566 196 570 204L650 312Q656 322 646 322H154Q144 322 150 312L230 204Q234 196 244 196Z" fill={m("plastic")} />
          <Shade d="M556 196Q566 196 570 204L650 312Q656 322 646 322H560Z" o={0.18} />
          <Gloss d="M246 198H430" w={1.8} o={0.7} />
          {ROWS.map((y, r) =>
            Array.from({ length: COLS }, (_, i) => {
              const w = pitchAt(y) * 0.76;
              return <path key={`${r}-${i}`} d={cell(cellX(y, i), y, w, w * 0.46)} fill={m("soil")} strokeWidth={1.2} strokeOpacity={0.35} style={{ stroke: tone("blue-dark") }} />;
            })
          )}
        </Rise>
        {ROWS.map((y, r) => (
          <Grow key={y} st={st} d={0.25 + r * 0.14} dur={0.6}>
            {Array.from({ length: COLS }, (_, i) => {
              // Hand-set from the indices: height, lean and whether first leaves have opened.
              const h = 11 + ((i * 7 + r * 5) % 6) * 2.6 + r * 1.2;
              const lean = (((i * 5 + r * 3) % 7) - 3) * 1.1;
              const kind = (i + r * 2) % 3 === 0 ? 1 : 0;
              return (
                <g key={i} transform={`translate(${cellX(y, i)} ${y})`}>
                  <Sprout h={h} lean={lean} kind={kind} />
                </g>
              );
            })}
          </Grow>
        ))}
        <Rise st={st} y={16} dur={0.6}>
          <path d="M150 314H650L646 332Q645 340 636 340H164Q155 340 154 332Z" fill={m("plastic")} />
          <path d="M150 314H650L646 332Q645 340 636 340H164Q155 340 154 332Z" fill={m("shadeX")} />
          <Gloss d="M152 316H648" w={2.2} o={0.75} />
          <path d="M155 331H645L644 337Q643 340 636 340H164Q157 340 156 337Z" fillOpacity={0.18} style={{ fill: tone("blue-dark") }} />
        </Rise>
      </g>
    </>
  );
}

export function Propagation({ st }: SceneProps) {
  return (
    <SceneFrame kind="greenhouse" back={<Machine />}>
      <Tray st={st} />
    </SceneFrame>
  );
}
