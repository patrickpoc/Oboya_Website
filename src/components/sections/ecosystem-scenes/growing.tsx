"use client";

import { useId } from "react";
import { Cyl, M, PottedMum, Rise, Seedling, Shadow, Solid, Strawberry, Tomato, mix, tone } from "./flat-kit";
import { Draw, Fade, P, Part, Plate, RAIL, Static, Travel, at, cylinderBody, disc, faceX, faceY, plane, post, seg, type SceneProps } from "./iso-kit";
import { Pot, TRAY, Tray } from "./packs";

/**
 * Greenhouse bay, cut away: only the far walls (back and left gable) and the far roof half are
 * drawn, as frosted panes with glazing bars; the near side is open so nothing is drawn over the
 * crops. Three rows back → front: tomatoes on a growbag gutter, potted chrysanthemums on a bench,
 * strawberries on a hanging gutter — each growing left → right. Blue irrigation from a tank at the
 * left runs a drip line along the back of every row, drawn after that row's surface and before its
 * plants. A cut-away container shows the substrate. Screen-parallel lines (crop wire vs. wall
 * transom, header vs. gable transom) are kept ≥ 10 px apart so they never read as a double line.
 */
const BAY = { x0: -190, x1: 190, y0: -100, y1: 30, eave: 60, ridge: 80 };
const RIDGE_Y = (BAY.y0 + BAY.y1) / 2;
const ROW = { x0: -170, w: 340 };
/** Tomato gutter is shorter so its end post and crop wire clear the right gable rafter. */
const TOM = { y: -76, z: 19, n: 7, pitch: 48, x0: -150, wire: 56, w: 332, post: 157.5 };
const MUM = { y: -40, z: 19, n: 8, pitch: 40, x0: -154 };
const BER = { y: -4, z: 35, n: 8, pitch: 42, x0: -152 };
const TANK = { x: -180, y: 12, r: 9, h: 26 };
const CUT = { x: 154, y: 20, r: 9, h: 16 };
/** Horizontal glazing bar height (eave/2 would sit 2.8 px from the crop wire on screen). */
const TRANSOM = 24;
/** Drip lines lie on each row's surface at its back edge. */
const DRIP = { tom: { y: TOM.y - 5, z: 13.4, x1: TOM.post - 8 }, mum: { y: MUM.y - 8, z: 19.4, x1: ROW.x0 + ROW.w - 6 }, ber: { y: BER.y - 5, z: 35.6, x1: ROW.x0 + ROW.w - 6 } };
const HEADER_Z = 42;
const SW = "var(--oboya-soft-white)";
const PANE = mix(M.blueLight, 26);
const PANE_ROOF = mix(M.blueLight, 34);
const BAR = mix(M.steel, 55);

const roofFar = `M${P(BAY.x0, BAY.y0, BAY.eave)}L${P(BAY.x1, BAY.y0, BAY.eave)}L${P(BAY.x1, RIDGE_Y, BAY.ridge)}L${P(BAY.x0, RIDGE_Y, BAY.ridge)}Z`;
const gable = `M${P(BAY.x0, BAY.y0, BAY.eave)}L${P(BAY.x0, RIDGE_Y, BAY.ridge)}L${P(BAY.x0, BAY.y1, BAY.eave)}Z`;
const bars = (() => {
  const parts: string[] = [];
  for (let x = BAY.x0 + 20; x < BAY.x1; x += 20) parts.push(post(x, BAY.y0, 0, BAY.eave), seg([x, BAY.y0, BAY.eave], [x, RIDGE_Y, BAY.ridge]));
  parts.push(seg([BAY.x0, BAY.y0, TRANSOM], [BAY.x1, BAY.y0, TRANSOM]));
  for (let y = BAY.y0 + 20; y < BAY.y1; y += 20) parts.push(post(BAY.x0, y, 0, BAY.eave));
  parts.push(seg([BAY.x0, BAY.y0, TRANSOM], [BAY.x0, BAY.y1, TRANSOM]));
  parts.push(seg([BAY.x0, RIDGE_Y, BAY.eave], [BAY.x0, RIDGE_Y, BAY.ridge]));
  return parts.join("");
})();

/** Irrigation: tank → riser → header along the gable (x = tank) → a vertical drop per row. */
const IRRIG = seg([TANK.x, TANK.y, TANK.h], [TANK.x, TANK.y, HEADER_Z]) + seg([TANK.x, TANK.y, HEADER_Z], [TANK.x, DRIP.tom.y, HEADER_Z]) + Object.values(DRIP).map((d) => post(TANK.x, d.y, d.z, HEADER_Z)).join("");
/** Drip line of one row, from the drop at the gable to the row's end. */
const drip = (d: { y: number; z: number; x1: number }) => seg([TANK.x, d.y, d.z], [d.x1, d.y, d.z]);

export function Growing({ st, active }: SceneProps) {
  const id = useId();
  const steel = tone(M.steel);
  return (
    <Static st={st}>
      <Plate>
        <defs>
          {[0, 1, 2].map((k) => (
            <g key={k} id={`${id}-tom${k}`}>
              <Pot cx={0} cy={0} r={5} h={9} delay={0.6 + k * 0.1} shadow={false} />
              <Rise delay={1 + k * 0.12}>{k === 0 ? <Seedling x={0} y={0} z={9} s={1.6} /> : <Tomato x={0} y={0} z={9} h={k === 1 ? 20 : 34} fruit={k === 1 ? 0 : 2} />}</Rise>
            </g>
          ))}
          {[0, 1, 2].map((k) => (
            <g key={k} id={`${id}-mum${k}`}>
              <Pot cx={0} cy={0} r={5} h={9} color={M.black} delay={0.7 + k * 0.1} shadow={false} />
              <Rise delay={1.1 + k * 0.12}>
                <PottedMum x={0} y={0} z={9} color={k === 1 ? M.yellow : M.pink} h={k === 0 ? 6 : 10} blooms={k === 0 ? 0 : k === 1 ? 2 : 4} />
              </Rise>
            </g>
          ))}
          {[0, 1].map((k) => (
            <g key={k} id={`${id}-ber${k}`}>
              <Rise delay={1.2 + k * 0.12}>
                <Strawberry x={0} y={0} z={0} fruit={k ? 3 : 0} />
              </Rise>
            </g>
          ))}
        </defs>

        {/* Greenhouse: frosted far walls and far roof, glazing bars, eave and ridge beams */}
        <g>
          <Fade delay={0} dur={0.8}>
            <path d={faceY(BAY.x0, BAY.y0, 0, BAY.x1 - BAY.x0, BAY.eave)} fill={PANE} />
            <path d={faceX(BAY.x0, BAY.y0, 0, BAY.y1 - BAY.y0, BAY.eave)} fill={mix(M.blueLight, 20)} />
            <path d={roofFar} fill={PANE_ROOF} />
            <path d={gable} fill={mix(M.blueLight, 20)} />
          </Fade>
        </g>
        <g>
          <Draw d={bars} color={BAR} w="light" delay={0.3} dur={1} />
        </g>
        <g>
          <Solid box={{ x: BAY.x0, y: BAY.y0 - 1.5, z: BAY.eave - 1.5, w: BAY.x1 - BAY.x0, d: 3, h: 3 }} tones={steel} delay={0.3} line={false} />
        </g>
        <g>
          <Solid box={{ x: BAY.x0, y: RIDGE_Y - 1.5, z: BAY.ridge - 1.5, w: BAY.x1 - BAY.x0, d: 3, h: 3 }} tones={steel} delay={0.4} line={false} />
        </g>
        {/* Gable rafters and corner posts close the cut-away cleanly at both ends */}
        <g>
          <Draw d={seg([BAY.x0, RIDGE_Y, BAY.ridge], [BAY.x0, BAY.y1, BAY.eave]) + seg([BAY.x1, BAY.y0, BAY.eave], [BAY.x1, RIDGE_Y, BAY.ridge]) + seg([BAY.x1, RIDGE_Y, BAY.ridge], [BAY.x1, BAY.y1, BAY.eave])} color={M.steel} w="heavy" delay={0.4} dur={0.9} />
        </g>
        <g>
          <Solid box={{ x: BAY.x0 - 1.2, y: BAY.y1 - 2.4, w: 2.4, d: 2.4, h: BAY.eave }} tones={steel} delay={0.4} line={false} />
        </g>
        <g>
          <Solid box={{ x: BAY.x1 - 2.4, y: BAY.y0 - 1.2, w: 2.4, d: 2.4, h: BAY.eave }} tones={steel} delay={0.4} line={false} />
        </g>
        <g>
          <Fade delay={0.2}>
            <path d={plane(BAY.x0, BAY.y0, BAY.x1 - BAY.x0, BAY.y1 - BAY.y0)} fill={M.concrete} />
          </Fade>
        </g>

        {/* Irrigation tank, riser, header along the gable and the drops (drip lines come with each row) */}
        <Part i={2} active={active}>
          <g>
            <Cyl cx={TANK.x} cy={TANK.y} r={TANK.r} h={TANK.h} color={M.blue} dark inner={M.water} innerDepth={2} rim delay={0.6} />
          </g>
          <g>
            <Draw d={IRRIG} color={M.blueLight} delay={1} dur={1.3} />
          </g>
        </Part>

        {/* Row 1: tomatoes on a growbag gutter; end posts carry a crop wire, strings on the plants tall enough */}
        <Part i={0} active={active}>
          <g>
            <Solid box={{ x: ROW.x0, y: TOM.y - 7, w: TOM.w, d: 14, h: 8 }} color={M.white} delay={0.4} />
          </g>
          <g>
            <Solid box={{ x: ROW.x0 + 5, y: TOM.y - 6, z: 8, w: TOM.post - 2.5 - (ROW.x0 + 5), d: 12, h: 5 }} color={M.soil} delay={0.5} line={false} />
          </g>
        </Part>
        <Part i={2} active={active}>
          <g>
            <Draw d={drip(DRIP.tom)} color={M.blueLight} delay={1.3} dur={0.8} />
          </g>
        </Part>
        <Part i={0} active={active}>
          {[ROW.x0 + 2.5, TOM.post].map((x) => (
            <g key={x}>
              <Solid box={{ x: x - 1.2, y: TOM.y - 1.2, z: 8, w: 2.4, d: 2.4, h: TOM.wire - 8 }} tones={steel} delay={0.6} line={false} />
            </g>
          ))}
          <g>
            <Draw d={seg([ROW.x0 + 2.5, TOM.y, TOM.wire], [TOM.post, TOM.y, TOM.wire]) + Array.from({ length: TOM.n }, (_, k) => (k < 2 ? "" : post(TOM.x0 + k * TOM.pitch, TOM.y, TOM.z + 10, TOM.wire))).join("")} color={BAR} w="light" delay={0.7} dur={0.8} />
          </g>
          <g transform={at(TOM.x0, TOM.y, 13)}>
            {Array.from({ length: TOM.n }, (_, k) => (
              <use key={k} href={`#${id}-tom${k < 2 ? 0 : k < 4 ? 1 : 2}`} transform={at(k * TOM.pitch, 0, 0)} />
            ))}
          </g>

          {/* Row 2: potted chrysanthemums on a bench */}
          {[0, 1, 2, 3].map((k) => (
            <g key={k}>
              <Solid box={{ x: ROW.x0 + 6 + k * 109, y: MUM.y - 9, w: 2.4, d: 2.4, h: 16 }} tones={steel} delay={0.5} line={false} />
            </g>
          ))}
          {[0, 1, 2, 3].map((k) => (
            <g key={k}>
              <Solid box={{ x: ROW.x0 + 6 + k * 109, y: MUM.y + 6, w: 2.4, d: 2.4, h: 16 }} tones={steel} delay={0.5} line={false} />
            </g>
          ))}
          <g>
            <Solid box={{ x: ROW.x0, y: MUM.y - 10, z: 16, w: ROW.w, d: 20, h: 3 }} color={M.white} delay={0.55} />
          </g>
        </Part>
        <Part i={2} active={active}>
          <g>
            <Draw d={drip(DRIP.mum)} color={M.blueLight} delay={1.4} dur={0.8} />
          </g>
        </Part>
        <Part i={0} active={active}>
          <g transform={at(MUM.x0, MUM.y, MUM.z)}>
            {Array.from({ length: MUM.n }, (_, k) => (
              <use key={k} href={`#${id}-mum${k < 3 ? 0 : k < 5 ? 1 : 2}`} transform={at(k * MUM.pitch, 0, 0)} />
            ))}
          </g>

          {/* Row 3: strawberries on a hanging gutter */}
          {[-160, 0, 160].map((x) => (
            <g key={x}>
              <Solid box={{ x: x - 1.2, y: BER.y - 1.2, w: 2.4, d: 2.4, h: 28 }} tones={steel} delay={0.6} line={false} />
            </g>
          ))}
          <g>
            <Solid box={{ x: ROW.x0, y: BER.y - 7, z: 28, w: ROW.w, d: 14, h: 7 }} color={M.white} delay={0.65} />
          </g>
          <g>
            <Rise delay={0.9} dur={0.4}>
              <path d={plane(ROW.x0 + 1.5, BER.y - 5.5, ROW.w - 3, 11, 35.2)} fill={M.soil} />
            </Rise>
          </g>
        </Part>
        <Part i={2} active={active}>
          <g>
            <Draw d={drip(DRIP.ber)} color={M.blueLight} delay={1.5} dur={0.8} />
          </g>
        </Part>
        <Part i={0} active={active}>
          <g transform={at(BER.x0, BER.y, BER.z)}>
            {Array.from({ length: BER.n }, (_, k) => (
              <use key={k} href={`#${id}-ber${k < 3 ? 0 : 1}`} transform={at(k * BER.pitch, 0, 0)} />
            ))}
          </g>
        </Part>

        {/* Cut-away container: substrate layers and roots in section, a fruiting tomato on top */}
        <Part i={1} active={active}>
          <g>
            <Rise delay={1.1}>
              <Shadow cx={CUT.x} cy={CUT.y} r={CUT.r} />
              <path d={cylinderBody(CUT.x, CUT.y, CUT.r, CUT.h, 0, CUT.r * 0.8)} fill={tone(M.terra).left} />
              <path d={faceY(CUT.x - CUT.r, CUT.y, 0.5, CUT.r * 2, CUT.h - 1)} fill={M.soil} />
              <path d={faceY(CUT.x - CUT.r + 1, CUT.y, 1, CUT.r * 2 - 2, CUT.h * 0.28)} fill={mix(M.card, 60)} />
              <path d={faceY(CUT.x - CUT.r + 1, CUT.y, CUT.h * 0.3, CUT.r * 2 - 2, CUT.h * 0.14)} fill={mix(M.soil, 70, SW)} />
              <path
                d={[-6, -2.5, 1.5, 5].map((o) => `M${P(CUT.x + o * 0.3, CUT.y, CUT.h - 2)}Q${P(CUT.x + o, CUT.y, CUT.h * 0.55)} ${P(CUT.x + o * 1.4, CUT.y, 3)}`).join("")}
                fill="none"
                stroke={mix(SW, 80, M.card)}
                strokeLinecap="round"
                style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }}
              />
              <path d={disc(CUT.x, CUT.y, CUT.r, CUT.h)} fill={tone(M.terra).top} />
              <path d={disc(CUT.x, CUT.y, CUT.r * 0.86, CUT.h - 1)} fill={M.soil} />
              <path d={cylinderBody(CUT.x, CUT.y, CUT.r, CUT.h, 0, CUT.r * 0.8)} fill="none" stroke={tone(M.terra).line} style={{ strokeWidth: "calc(var(--eco-ink, 1.2px) * 0.7)" }} />
            </Rise>
          </g>
          <g>
            <Rise delay={1.4}>
              <Tomato x={CUT.x} y={CUT.y} z={CUT.h - 1} h={20} fruit={1} />
            </Rise>
          </g>
        </Part>
        <g>
          <Solid box={{ x: BAY.x1 - 2.4, y: BAY.y1 - 2.4, w: 2.4, d: 2.4, h: BAY.eave }} tones={steel} delay={0.5} line={false} />
        </g>

        {/* Unit: a seedling tray arrives; a potted young tomato leaves. */}
        <Travel
          from={
            <g transform={at(-TRAY.w / 2, RAIL.y - TRAY.d / 2, 0)}>
              <Tray grow={2} delay={0} />
            </g>
          }
        >
          <g>
            <Pot cx={0} cy={RAIL.y} r={5.5} h={9} delay={0} />
            <Tomato x={0} y={RAIL.y} z={9} h={16} fruit={0} />
          </g>
        </Travel>
      </Plate>
    </Static>
  );
}
