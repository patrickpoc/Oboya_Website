"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Backdrop,
  HOTSPOTS,
  HomeEcosystemStageVisual,
  OVERVIEW_NODES,
  Overview,
  SceneClock,
} from "@/components/sections/ecosystem-scenes";
import { HomeEcosystemCallouts, HomeEcosystemOverviewLabels } from "@/components/sections/HomeEcosystemCallouts";
import type { EcoPhaseKind } from "@/components/sections/useEcosystemSequence";
import {
  CLOSING_MS,
  STAGE_MS,
} from "@/components/sections/useEcosystemSequence";
import { pickLocalized } from "@/lib/cms/utils";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import type { LocalizedString } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

type Eco = HomepageSettings["homeEcosystem"];
type Stage = Eco["stages"][number];

const fadeT = { duration: 0.5, ease: "easeOut" as const };
const layer = "col-start-1 row-start-1";
const BIG =
  "font-display text-[clamp(1.6rem,3.2vw,2.5rem)] font-light leading-[1.15] tracking-tight text-white text-balance";

/** Text column + isometric panel for the current phase. */
export function HomeEcosystemStage({
  data,
  locale,
  kind,
  stageIndex,
  isStatic,
  playState,
  autoplay,
  onHoverChange,
}: {
  data: Eco;
  locale: string;
  kind: EcoPhaseKind;
  stageIndex: number;
  isStatic: boolean;
  playState: "running" | "paused";
  autoplay: boolean;
  onHoverChange: (hovering: boolean) => void;
}) {
  const stages = data.stages as Stage[];
  const t = (v: LocalizedString) => pickLocalized(v, locale);
  const [active, setActive] = useState<number | null>(null);
  const afterStages = kind === "closing" || kind === "hold";
  const inStage = kind === "stage" || kind === "static";
  const idle = kind === "idle";
  const current = stageIndex >= 0 ? stages[stageIndex] : null;

  // Emphasis resets whenever the scene changes (autoplay or rail), so every callout is back.
  const sceneKey = `${kind}:${stageIndex}`;
  const [seenScene, setSeenScene] = useState(sceneKey);
  if (seenScene !== sceneKey) {
    setSeenScene(sceneKey);
    setActive(null);
  }
  // A press outside any callout or proof point (tap or click) restores all callouts.
  useEffect(() => {
    if (active == null) return;
    const clear = (e: globalThis.PointerEvent) => {
      const el = e.target as Element | null;
      if (el?.closest("[data-eco-callout],[data-eco-point]")) return;
      setActive(null);
    };
    document.addEventListener("pointerdown", clear);
    return () => document.removeEventListener("pointerdown", clear);
  }, [active]);

  const show = (on: boolean) => ({ opacity: on ? 1 : 0, y: on ? 0 : 8 });

  const textLayer = (on: boolean, children: ReactNode, key: string) => (
    <motion.div
      key={key}
      className={cn(layer, "flex flex-col justify-center")}
      initial={false}
      animate={show(on)}
      transition={
        isStatic ? { duration: 0 } : on ? { ...fadeT, delay: 0.25 } : fadeT
      }
      aria-hidden={!on}
      inert={!on}
      style={{ pointerEvents: on ? "auto" : "none" }}
    >
      {children}
    </motion.div>
  );

  return (
    <div
      data-eco-phase={kind}
      className="grid grid-cols-12 gap-x-6 gap-y-8 lg:gap-y-0"
      onPointerEnter={(e) => e.pointerType === "mouse" && onHoverChange(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && onHoverChange(false)}
    >
      {/* Text column */}
      <div className="order-2 col-span-12 grid lg:order-1 lg:col-span-4 lg:pr-6">
        {stages.map((s, i) => {
          // Before the cycle starts (section not yet in view) the first stage's text is shown.
          const on = (inStage && i === stageIndex) || (idle && i === 0);
          const points = s.points.slice(0, 3);
          const description = t(s.description);
          return textLayer(
            on,
            <>
              <span className="block h-0.5 w-10 bg-oboya-green-light" aria-hidden />
              <h3 className={cn(BIG, "mt-5")}>{t(s.label)}</h3>
              {description ? (
                <p className="mt-4 max-w-[34ch] font-body text-[clamp(0.95rem,1.2vw,1.05rem)] font-light leading-[1.6] text-white/75 text-pretty">
                  {description}
                </p>
              ) : null}
              {points.length ? (
                <ul className="mt-5 flex flex-col gap-2.5">
                  {points.map((pt, k) => {
                    const lit = active === k;
                    return (
                      <li
                        key={pt.id}
                        tabIndex={0}
                        data-eco-point
                        className="flex items-center gap-3 rounded-sm font-body text-sm font-normal leading-snug text-white/85 outline-none focus-visible:ring-2 focus-visible:ring-oboya-green-light/70"
                        onPointerEnter={(e) => e.pointerType === "mouse" && setActive(k)}
                        onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
                        onPointerDown={(e) => e.pointerType !== "mouse" && setActive(lit ? null : k)}
                        onFocus={() => setActive(k)}
                        onBlur={(e) => {
                          const to = e.relatedTarget as Element | null;
                          if (!to?.closest("[data-eco-callout]")) setActive(null);
                        }}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "h-1.5 w-2.5 shrink-0 transition-colors duration-300 [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]",
                            lit
                              ? "bg-oboya-green-light"
                              : "bg-oboya-blue-light/80",
                          )}
                        />
                        <span
                          className={cn(
                            "transition-colors duration-300",
                            lit && "text-white",
                          )}
                        >
                          {t(pt.text)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </>,
            s.id,
          );
        })}

        {!isStatic
          ? textLayer(
              afterStages,
              <>
                <p className={BIG}>
                  {t(data.closingLine1)}
                  <br />
                  {t(data.closingLine2)}
                </p>
                <motion.p
                  className="mt-5 font-body text-[0.95rem] font-light text-white/70"
                  initial={false}
                  animate={{ opacity: kind === "hold" ? 1 : 0 }}
                  transition={fadeT}
                  aria-hidden={kind !== "hold"}
                >
                  {t(data.slogan)}
                </motion.p>
              </>,
              "closing",
            )
          : null}
      </div>

      {/* Panel */}
      <div className="order-1 col-span-12 lg:order-2 lg:col-span-8">
        <div className="relative">
          <SceneClock.Provider
            value={{
              ms: afterStages ? CLOSING_MS : STAGE_MS,
              playState,
              rest: !autoplay,
            }}
          >
            <div
              className={cn(
                "relative isolate aspect-[4/3] w-full overflow-hidden rounded-md bg-oboya-blue-dark ring-1 ring-white/15 sm:aspect-[8/5]",
                "[--eco-ink:2.3px] sm:[--eco-ink:1.9px] md:[--eco-ink:1.7px] lg:[--eco-ink:1.45px] xl:[--eco-ink:1.25px]",
              )}
              aria-hidden
            >
              <Backdrop st={isStatic || idle} />

              <AnimatePresence initial={false}>
                {/* Before the cycle starts the first stage sits at rest in the panel (its text is shown too). */}
                {idle ? (
                  <motion.div key={`${stages[0].id}-idle`} className="absolute inset-0" initial={false} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                    <HomeEcosystemStageVisual stage={stages[0]} label={t(stages[0].label)} static sizes="(max-width: 1024px) 94vw, 840px" />
                  </motion.div>
                ) : null}
                {stages.map((s, i) => {
                  const isCurrent = inStage && i === stageIndex;
                  const preload = !!s.image && inStage && i === stageIndex + 1;
                  if (!isCurrent && !preload) return null;
                  return (
                    <motion.div
                      key={s.id}
                      data-eco-scene={isCurrent ? s.id : undefined}
                      className="absolute inset-0"
                      initial={preload || isStatic ? false : { opacity: 0 }}
                      animate={{ opacity: isCurrent ? 1 : 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: isStatic ? 0 : 0.4 }}
                    >
                      <HomeEcosystemStageVisual
                        stage={s}
                        label={t(s.label)}
                        static={isStatic}
                        active={isCurrent ? active : null}
                        eager={preload}
                        sizes="(max-width: 1024px) 94vw, 840px"
                      />
                    </motion.div>
                  );
                })}

                {afterStages ? (
                  <motion.div
                    key="overview"
                    data-eco-scene="overview"
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Overview st={false} />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Hotspots, linked to the proof points. The layer keeps the SVG viewBox aspect so
                  percentages stay true when the panel is cropped (mobile). */}
              {current && !current.image ? (
                <HomeEcosystemCallouts
                  key={current.id}
                  id={current.id}
                  spots={HOTSPOTS[current.id].slice(0, current.points.length)}
                  texts={current.points.map((pt) => t(pt.text))}
                  active={active}
                  isStatic={isStatic}
                  onActive={setActive}
                />
              ) : null}
              {afterStages ? (
                <HomeEcosystemOverviewLabels nodes={OVERVIEW_NODES} labels={stages.map((s) => t(s.label))} isStatic={isStatic} />
              ) : null}

              {/* Corner ticks */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-2 top-2 size-2.5 border-l border-t border-white/35"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute right-2 top-2 size-2.5 border-r border-t border-white/35"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-2 left-2 size-2.5 border-b border-l border-white/35"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-2 right-2 size-2.5 border-b border-r border-white/35"
              />
            </div>
          </SceneClock.Provider>

          {/* Plate strip: a ruler under the panel. */}
          <div aria-hidden className="mt-2 flex items-end gap-0 px-1">
            {Array.from({ length: 25 }, (_, k) => (
              <span key={k} className="flex flex-1 flex-col items-start">
                <span
                  className={cn(
                    "w-px bg-white/30",
                    k % 6 === 0 ? "h-2" : "h-1",
                  )}
                />
              </span>
            ))}
            <span className="h-2 w-px bg-white/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
