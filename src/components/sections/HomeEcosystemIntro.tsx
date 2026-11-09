"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useHomeIntro } from "@/components/layout/HomeIntroGate";
import { HomeEcosystemStageVisual } from "@/components/sections/ecosystem-scenes";
import { pickLocalized } from "@/lib/cms/utils";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { cn } from "@/lib/utils";

const OPENING_MS = 4000;
const STAGE_MS = 2500;
const CLOSING_HOLD_MS = 3000;
const SLOGAN_HOLD_MS = 20000;

// Phases: -1 idle (opening shown, not started), 0 opening, 1..N stages, N+1 closing, N+2 hold (then back to 0).
const IDLE = -1;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Live reduced-motion setting: updates mid-session, false on the server and first client render. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/** Static = reduced motion or CMS animations off. */
export function useEcosystemStatic(animationsEnabled: boolean) {
  const reduce = usePrefersReducedMotion();
  return animationsEnabled === false || reduce;
}

type Eco = HomepageSettings["homeEcosystem"];

const barBase = "block h-full origin-left rounded-full bg-oboya-green-light";

export function HomeEcosystemIntro({
  data,
  locale,
  isStatic,
}: {
  data: Eco;
  locale: string;
  isStatic: boolean;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { amount: 0.35 });
  const unlocked = useHomeIntro()?.isUnlocked ?? true;
  const [rawPhase, setPhase] = useState(IDLE);
  const [launched, setLaunched] = useState(false);
  const [hidden, setHidden] = useState(false);

  const stages = data.stages;
  const N = stages.length;
  const CLOSING = N + 1;
  const HOLD = N + 2;
  const t = (v: Eco["title"]) => pickLocalized(v, locale);
  // First start waits for the stage in view and the loading overlay gone; later returns just resume.
  if (!launched && !isStatic && inView && unlocked) setLaunched(true);
  const phase = rawPhase === IDLE && launched ? 0 : rawPhase;
  const running = !isStatic && !hidden && inView;

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // One clock per phase: the CSS animation of the progress element. It is paused and resumed with
  // the same play state, so the visible line and the remaining time cannot drift apart.
  const advance = () => setPhase(phase === HOLD ? 0 : phase + 1);
  const phaseMs = phase === 0 ? OPENING_MS : CLOSING_HOLD_MS;

  // Keep the last scene mounted at full opacity until the stage layer has faded out.
  const [last, setLast] = useState(-1);
  const [gone, setGone] = useState(false);
  const afterStages = phase >= CLOSING;
  useEffect(() => {
    if (!afterStages) return;
    const id = window.setTimeout(() => setGone(true), 700);
    return () => window.clearTimeout(id);
  }, [afterStages]);

  const stageIndex = phase >= 1 && phase <= N ? phase - 1 : -1;
  if (stageIndex >= 0 && last !== stageIndex) setLast(stageIndex);
  if (phase === 0 && last !== -1) setLast(-1);
  if (!afterStages && gone) setGone(false);
  const keep = afterStages && !gone ? last : -1;
  const fade = (on: boolean) => ({ opacity: on ? 1 : 0, y: on ? 0 : 10 });
  const fadeT = { duration: 0.5 };
  // The three layers share one grid cell: a layer fades out first, the next one fades in after it.
  const seq = (on: boolean) => ({
    ...fade(on),
    transition: on ? { duration: 0.5, delay: 0.5 } : fadeT,
  });
  const layer =
    "col-start-1 row-start-1 flex flex-col items-center justify-center text-center";
  const playState = running ? "running" : "paused";
  const BIG =
    "font-display text-[clamp(1.6rem,4vw,2.75rem)] font-light leading-snug text-white text-balance";
  // The leading "Oboya" (with optional comma, also the CJK one) is shown as the logo.
  const openingText = t(data.openingLine);
  const stripped = openingText.replace(/^\s*Oboya\s*[,，]?\s*/i, "");
  const openingRest =
    stripped.charAt(0).toLocaleUpperCase(locale) + stripped.slice(1);
  const openingLineEl = (
    <p
      className={cn(
        BIG,
        "flex flex-wrap items-center justify-center gap-x-6 gap-y-6 md:gap-y-8",
      )}
    >
      <Image
        src="/assets/logo.svg"
        alt=""
        width={160}
        height={39}
        className="h-[1.5em] w-auto brightness-0 invert"
      />
      <span>{openingRest}</span>
    </p>
  );
  const closingLines = (
    <p className={BIG}>
      {t(data.closingLine1)}
      <br />
      {t(data.closingLine2)}
    </p>
  );

  return (
    <div
      ref={stageRef}
      data-eco-phase={
        isStatic
          ? "static"
          : phase < 0
            ? "idle"
            : phase === 0
              ? "opening"
              : phase <= N
                ? "stage"
                : phase === CLOSING
                  ? "closing"
                  : "hold"
      }
      className="relative mx-auto w-full max-w-4xl px-[var(--container-padding)]"
    >
      {!isStatic && (phase === 0 || phase === CLOSING) ? (
        <span
          key={phase}
          aria-hidden
          className="absolute size-0 overflow-hidden"
          onAnimationEnd={advance}
          style={{
            animation: `eco-fill ${phaseMs}ms linear forwards`,
            animationPlayState: playState,
          }}
        />
      ) : null}
      {/* All sequence content as static text for assistive tech; the visuals are decorative. */}
      <div className="sr-only">
        <p>{t(data.openingLine)}</p>
        <ul>
          {stages.map((s) => (
            <li key={s.id}>{t(s.label)}</li>
          ))}
        </ul>
        <p>
          {t(data.closingLine1)} {t(data.closingLine2)}
        </p>
      </div>

      {isStatic ? (
        <div
          className="flex flex-col items-center gap-8 text-center"
          aria-hidden
        >
          <div className="flex flex-col items-center gap-8">
            {openingLineEl}
            {closingLines}
          </div>
          <ul className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stages.map((s) => (
              <li key={s.id} className="flex flex-col gap-3">
                <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl bg-oboya-blue ring-1 ring-white/15">
                  <HomeEcosystemStageVisual
                    stage={s}
                    label={t(s.label)}
                    static
                    sizes="(max-width: 640px) 94vw, (max-width: 1024px) 45vw, 290px"
                  />
                </div>
                <p className="font-display text-xl font-light text-white">
                  {t(s.label)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="grid" aria-hidden>
          <motion.div
            className={layer}
            initial={false}
            animate={seq(phase <= 0)}
            transition={fadeT}
          >
            {openingLineEl}
          </motion.div>

          <motion.div
            className={cn(layer, "gap-5")}
            initial={false}
            animate={seq(stageIndex >= 0)}
            transition={fadeT}
          >
            <div
              className="relative aspect-[2/1] w-full overflow-hidden rounded-3xl bg-oboya-blue ring-1 ring-white/15"
              style={{
                maxWidth: "min(100%, max(20rem, calc(2 * (100svh - 20rem))))",
              }}
            >
              {stages.map((s, i) => {
                const isCurrent = i === stageIndex;
                const preload = !!s.image && i === stageIndex + 1;
                const closingKeep = i === keep;
                const leaving =
                  (stageIndex >= 1 && i === stageIndex - 1) || closingKeep;
                if (!isCurrent && !preload && !leaving) return null;
                return (
                  <motion.div
                    key={s.id}
                    data-eco-scene={isCurrent ? s.id : undefined}
                    className="absolute inset-0"
                    initial={preload ? false : { opacity: 0 }}
                    animate={{ opacity: isCurrent || closingKeep ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <HomeEcosystemStageVisual
                      stage={s}
                      label={t(s.label)}
                      eager={preload}
                      sizes="(max-width: 896px) 94vw, 840px"
                    />
                  </motion.div>
                );
              })}
            </div>

            <div className="grid w-full">
              {stages.map((s, i) => (
                <motion.div
                  key={s.id}
                  className="col-start-1 row-start-1 flex flex-col items-center gap-3"
                  initial={false}
                  animate={fade(i === stageIndex)}
                  transition={fadeT}
                >
                  <p className="font-display text-[clamp(1.5rem,3.2vw,2.25rem)] font-light leading-tight text-white">
                    {t(s.label)}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="flex w-full max-w-sm gap-1.5">
              {stages.map((s, i) => (
                <span
                  key={s.id}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
                >
                  {i < stageIndex ? (
                    <span className={cn(barBase, "scale-x-100")} />
                  ) : null}
                  {i === stageIndex ? (
                    <span
                      key={phase}
                      className={barBase}
                      onAnimationEnd={advance}
                      style={{
                        animation: `eco-fill ${STAGE_MS}ms linear forwards`,
                        animationPlayState: playState,
                      }}
                    />
                  ) : null}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className={cn(layer, "gap-5")}
            initial={false}
            animate={seq(afterStages)}
            transition={fadeT}
          >
            {closingLines}
            <span className="h-0.5 w-full max-w-sm overflow-hidden rounded-full bg-white/20">
              {phase === HOLD ? (
                <span
                  key={HOLD}
                  className={barBase}
                  onAnimationEnd={advance}
                  style={{
                    animation: `eco-fill ${SLOGAN_HOLD_MS}ms linear forwards`,
                    animationPlayState: playState,
                  }}
                />
              ) : null}
            </span>
          </motion.div>
        </div>
      )}
    </div>
  );
}
