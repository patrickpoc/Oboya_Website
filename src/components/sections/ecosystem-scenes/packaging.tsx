"use client";

import { BASELINE, CX, Clamshell, Contact, FlowerSleeve, Gloss, LettuceBag, Pop, Rise, SceneFrame, Shade, tone, useMat } from "./kit";

type SceneProps = { st: boolean };
const TY = 314; // items rest here on the table plane

function Table({ st }: SceneProps) {
  const m = useMat();
  return (
    <>
      <Contact x={CX} y={BASELINE + 2} w={640} o={0.6} />
      <g data-eco-subject>
        <Rise st={st} y={14} dur={0.55}>
          <path d="M160 288H640L700 322H100Z" fill={m("plastic")} />
          <Shade d="M640 288L700 322H560Z" o={0.18} />
          <Gloss d="M164 290H420" w={1.8} o={0.7} />
          <path d="M100 322H700V334Q700 340 694 340H106Q100 340 100 334Z" fill={m("metal")} />
          <path d="M100 330H700V338Q700 340 694 340H106Q100 340 100 338Z" fillOpacity={0.25} style={{ fill: tone("blue-dark") }} />
          <Gloss d="M104 324H400" w={1.6} o={0.7} />
          {/* stack of empty trays */}
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(0 ${-i * 10})`}>
              <path d="M112 310L124 298H176L188 310Z" fill={m("plastic")} />
              <path d="M112 310H188V314H112Z" fill={m("film")} strokeWidth={1} strokeOpacity={0.5} style={{ stroke: tone("soft-white") }} />
            </g>
          ))}
          {/* film roll lying on the table */}
          <path d="M628 280H692Q704 280 704 296Q704 312 692 312H628Q616 312 616 296Q616 280 628 280Z" fill={m("film")} strokeWidth={1.2} strokeOpacity={0.6} style={{ stroke: tone("soft-white") }} />
          <path d="M628 280Q614 280 614 296Q614 312 628 312Q642 312 642 296Q642 280 628 280Z" fill={m("metal")} />
          <path d="M628 290Q622 290 622 296Q622 302 628 302Q634 302 634 296Q634 290 628 290Z" style={{ fill: tone("blue-dark", 70) }} />
          <Gloss d="M650 284H690M654 290H694" w={2} o={0.7} />
        </Rise>
        <Pop st={st} d={0.35} dur={0.5}>
          <g transform={`translate(262 ${TY}) scale(2)`}>
            <Clamshell v={0} />
          </g>
        </Pop>
        <Pop st={st} d={0.6} dur={0.5}>
          <g transform={`translate(410 ${TY}) scale(2)`}>
            <LettuceBag v={0} />
          </g>
        </Pop>
        <Pop st={st} d={0.85} dur={0.5}>
          <g transform={`translate(552 ${TY}) scale(2)`}>
            <FlowerSleeve v={0} />
          </g>
        </Pop>
        <Rise st={st} d={1} y={0} dur={0.4}>
          <Gloss d="M200 190L330 304M360 176L470 296M500 184L590 296" w={5} o={0.12} />
        </Rise>
      </g>
    </>
  );
}

export function Packaging({ st }: SceneProps) {
  return (
    <SceneFrame kind="store">
      <Table st={st} />
    </SceneFrame>
  );
}
