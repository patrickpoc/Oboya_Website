import { describe, expect, it } from "vitest";
import {
  CLOSING_MS,
  ECO_INITIAL,
  HOLD_MS,
  STAGE_MS,
  deriveEco,
  ecoReducer,
  type EcoAction,
  type EcoState,
} from "../useEcosystemSequence";

const COUNT = 6;
const run = (actions: EcoAction[], from: EcoState = ECO_INITIAL) => actions.reduce(ecoReducer, from);
const advance: EcoAction = { type: "advance", count: COUNT };

describe("ecosystem sequence: phase transitions", () => {
  it("is idle before launch and on the first stage right after (no opening)", () => {
    expect(deriveEco(ECO_INITIAL, COUNT, false)).toMatchObject({ kind: "idle", stageIndex: -1 });
    const launched = run([{ type: "launch" }]);
    expect(deriveEco(launched, COUNT, false)).toMatchObject({ kind: "stage", phase: 1, stageIndex: 0, phaseMs: STAGE_MS });
  });

  it("walks stages → closing → hold → first stage again", () => {
    let s = run([{ type: "launch" }]);
    const kinds: string[] = [];
    for (let i = 0; i < COUNT + 2; i++) {
      s = ecoReducer(s, advance);
      kinds.push(deriveEco(s, COUNT, false).kind);
    }
    expect(kinds).toEqual([...Array(COUNT - 1).fill("stage"), "closing", "hold", "stage"]);
    expect(deriveEco(s, COUNT, false).stageIndex).toBe(0);
  });

  it("reports stage indices and clock lengths per phase", () => {
    let s = run([{ type: "launch" }]);
    expect(deriveEco(s, COUNT, false)).toMatchObject({ kind: "stage", stageIndex: 0, phaseMs: STAGE_MS });
    for (let i = 1; i < COUNT; i++) s = ecoReducer(s, advance);
    expect(deriveEco(s, COUNT, false).stageIndex).toBe(COUNT - 1);
    s = ecoReducer(s, advance);
    expect(deriveEco(s, COUNT, false)).toMatchObject({ kind: "closing", stageIndex: -1, phaseMs: CLOSING_MS });
    s = ecoReducer(s, advance);
    expect(deriveEco(s, COUNT, false)).toMatchObject({ kind: "hold", phaseMs: HOLD_MS });
  });

  it("launch is idempotent", () => {
    const once = run([{ type: "launch" }]);
    expect(ecoReducer(once, { type: "launch" })).toBe(once);
  });
});

describe("ecosystem sequence: user control", () => {
  it("selecting a step shows it and stops autoplay", () => {
    const s = run([{ type: "launch" }, advance, { type: "select", index: 3, isStatic: false }]);
    expect(s.userPaused).toBe(true);
    expect(deriveEco(s, COUNT, false)).toMatchObject({ kind: "stage", stageIndex: 3 });
  });

  it("toggle pauses and resumes, and launches if needed", () => {
    const paused = run([{ type: "toggle" }]);
    expect(paused).toMatchObject({ launched: true, userPaused: true });
    expect(ecoReducer(paused, { type: "toggle" }).userPaused).toBe(false);
  });

  it("advance after a selection continues from the selected step", () => {
    const s = run([{ type: "launch" }, { type: "select", index: 1, isStatic: false }, advance]);
    expect(deriveEco(s, COUNT, false).stageIndex).toBe(2);
  });
});

describe("ecosystem sequence: static path", () => {
  it("always shows a stage (first by default) with no autoplay phases", () => {
    expect(deriveEco(ECO_INITIAL, COUNT, true)).toMatchObject({ kind: "static", stageIndex: 0, phase: 1 });
    const closing = { ...ECO_INITIAL, phase: COUNT + 1 };
    expect(deriveEco(closing, COUNT, true)).toMatchObject({ kind: "static", stageIndex: 0 });
  });

  it("rail navigation works without touching the pause state", () => {
    const s = run([{ type: "select", index: 4, isStatic: true }]);
    expect(s.userPaused).toBe(false);
    expect(deriveEco(s, COUNT, true)).toMatchObject({ kind: "static", stageIndex: 4 });
  });
});
