"use client";

import { BASELINE, CX, Contact, Gloss, Pop, Rise, SceneFrame, Shade, Strawberry, Tomato, Wheel, ruffle, tone, useMat } from "./kit";

type SceneProps = { st: boolean };

const ROW_BACK: Array<[number, number, number]> = [[40, 70, 30], [170, 80, 34], [310, 66, 28], [470, 80, 34], [610, 70, 30], [750, 76, 32]];

/** Generic crop rows receding behind the trolley (softly blurred by the frame). */
function Crops() {
  const m = useMat();
  return (
    <g>
      {ROW_BACK.map(([x, rx, ry], i) => (
        <path key={x} d={ruffle(x, 262, rx, ry, 9, 0.2, i)} fill={m(i % 2 ? "leaf" : "leafDeep")} />
      ))}
      {ROW_BACK.map(([x, rx, ry], i) => (
        <path key={`f${x}`} d={ruffle(x + 70, 284, rx * 0.8, ry * 0.8, 8, 0.2, i + 1)} fill={m(i % 2 ? "leafLight" : "leaf")} />
      ))}
    </g>
  );
}

const SLOTS = "M-62 -48H-40Q-36 -48 -36 -44V-40Q-36 -36 -40 -36H-62Q-66 -36 -66 -40V-44Q-66 -48 -62 -48ZM-14 -48H14Q18 -48 18 -44V-40Q18 -36 14 -36H-14Q-18 -36 -18 -40V-44Q-18 -48 -14 -48ZM40 -48H62Q66 -48 66 -44V-40Q66 -36 62 -36H40Q36 -36 36 -40V-44Q36 -48 40 -48Z";

function Crate({ x, kind }: { x: number; kind: "straw" | "tom" }) {
  const m = useMat();
  const rows: Array<[number, number]> = [[207, 7], [191, 6], [176, 4]]; // y, count
  let n = 0;
  return (
    <g transform={`translate(${x} 0)`}>
      {rows.map(([y, c], r) =>
        Array.from({ length: c }, (_, i) => {
          const k = n++;
          const px = (i - (c - 1) / 2) * 24 + ((k * 3) % 5) - 2;
          return (
            <g key={`${r}-${i}`} transform={`translate(${px} ${y})`}>
              {kind === "straw" ? <Strawberry rot={((k * 37) % 50) - 25} s={1.6} /> : <Tomato rot={(k * 29) % 40} s={1.15} k={k % 6 === 4 ? "yellow" : "red"} />}
            </g>
          );
        })
      )}
      <g transform="translate(0 284)">
        <path d="M-88 -74H88L82 -4Q81 0 77 0H-77Q-81 0 -82 -4Z" fill={m("plastic")} />
        <path d="M-88 -74H88L82 -4Q81 0 77 0H-77Q-81 0 -82 -4Z" style={{ fill: tone("blue-light", 60, "soft-white") }} fillOpacity={0.5} />
        <path d={SLOTS} style={{ fill: tone("blue-dark") }} fillOpacity={0.55} />
        <path d="M-92 -80H92Q94 -80 94 -77V-70Q94 -67 92 -67H-92Q-94 -67 -94 -70V-77Q-94 -80 -92 -80Z" fill={m("plastic")} />
        <Shade d="M88 -74L82 -4Q81 0 77 0H50L58 -74Z" o={0.22} />
        <Gloss d="M-90 -78H-10M-84 -62L-80 -12" w={2} o={0.7} />
      </g>
    </g>
  );
}

function Trolley({ st }: SceneProps) {
  const m = useMat();
  return (
    <>
      <Contact x={CX} y={BASELINE + 2} w={500} o={0.6} />
      <g data-eco-subject>
        <g transform="translate(-14 0)">
        <Rise st={st} x={-110} y={0} dur={0.8}>
          <Wheel cx={248} cy={316} r={24} />
          <Wheel cx={552} cy={316} r={24} />
          <path d="M212 284H588Q592 284 592 288V296Q592 300 588 300H212Q208 300 208 296V288Q208 284 212 284Z" fill={m("metal")} />
          <path d="M208 296H592V300H208Z" fillOpacity={0.3} style={{ fill: tone("blue-dark") }} />
          <path d="M592 288L636 190H664" fill="none" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: tone("soft-white", 82, "blue") }} />
          <path d="M208 288L164 228" fill="none" strokeWidth={7} strokeLinecap="round" style={{ stroke: tone("soft-white", 82, "blue") }} />
          <Gloss d="M598 280L638 194" w={1.6} o={0.6} />
        </Rise>
        <Pop st={st} d={0.7}>
          <Crate x={310} kind="straw" />
        </Pop>
        <Pop st={st} d={0.9}>
          <Crate x={490} kind="tom" />
        </Pop>
        </g>
      </g>
    </>
  );
}

/** Generic harvest trolley among crop rows. It does not depict any specific system. */
export function Harvest({ st }: SceneProps) {
  return (
    <SceneFrame kind="greenhouse" back={<Crops />}>
      <Trolley st={st} />
    </SceneFrame>
  );
}
