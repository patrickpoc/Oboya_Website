"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  Leaf,
  Package,
  ShoppingCart,
  Sprout,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  circleFromChord,
  describeArc,
} from "@/lib/geometry/arc";
import { cn } from "@/lib/utils";

type StageId =
  | "propagation"
  | "growing"
  | "packaging"
  | "logistics"
  | "retail"
  | "pos";

type StageDef = {
  id: StageId;
  icon: LucideIcon;
  image: string;
};

const STAGES: StageDef[] = [
  {
    id: "propagation",
    icon: Sprout,
    image: "/assets/homepage/greenhouse-technology.webp",
  },
  {
    id: "growing",
    icon: Leaf,
    image: "/assets/homepage/hero-vineyard.jpg",
  },
  {
    id: "packaging",
    icon: Package,
    image: "/assets/homepage/capabilities-partnerships.jpg",
  },
  {
    id: "logistics",
    icon: Truck,
    image: "/assets/homepage/solutions-logistics.jpg",
  },
  {
    id: "retail",
    icon: Store,
    image: "/assets/homepage/solutions-integrated.jpg",
  },
  {
    id: "pos",
    icon: ShoppingCart,
    image: "/assets/homepage/capabilities-value-chain.jpg",
  },
];

const PILL_STEP_DESKTOP_DEG = 52;
const PILL_STEP_TABLET_DEG = 44;
const PILL_STEP_MOBILE_DEG = 38;
const IMAGE_SPIN_DEG = 180;
const IMAGE_SPIN_DURATION = 1.05;
const IMAGE_SPIN_EASE = [0.4, 0.0, 0.2, 1] as const;
const AUTOPLAY_MS = 1500;
const RIM_TRANSITION = `transform ${IMAGE_SPIN_DURATION}s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease`;
const NAV_TRANSITION = {
  duration: 0.45,
  ease: [0.33, 1, 0.28, 1] as const,
};
const SWIPE_THRESHOLD = 48;

function wrapIndex(index: number, count: number) {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

/**
 * Ecosystem story wheel: autoplays Propagation → Point of Sale,
 * then a centered arrow restarts by spinning forward into Propagation
 * as if it were the next stage on the rim.
 */
export function HomeEcosystemSection() {
  const t = useTranslations("homeEcosystem");
  const reduceMotion = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState(1);

  const count = STAGES.length;
  const isLastStage = active === count - 1;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const update = () => setWidth(frame.clientWidth || window.innerWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const goTo = useCallback(
    (target: number, dir: -1 | 1) => {
      if (isAnimating || count === 0) return;
      const next = wrapIndex(target, count);
      if (next === active) return;
      setDirection(dir);
      setIsAnimating(true);
      setActive(next);
    },
    [active, count, isAnimating]
  );

  const advance = useCallback(() => {
    if (isAnimating || isLastStage) return;
    goTo(active + 1, 1);
  }, [active, goTo, isAnimating, isLastStage]);

  const restart = useCallback(() => {
    if (isAnimating || !isLastStage) return;
    // Same forward spin as a normal next step — Propagation is the following beat.
    goTo(0, 1);
  }, [goTo, isAnimating, isLastStage]);

  const select = useCallback(
    (index: number) => {
      if (isAnimating || count === 0) return;
      if (index === active) return;
      // Forward wrap: last → Propagation (restart).
      if (active === count - 1 && index === 0) {
        goTo(0, 1);
        return;
      }
      // Otherwise only adjacent linear steps (no wrap-back).
      if (Math.abs(index - active) !== 1) return;
      if (active === 0 && index === count - 1) return;
      goTo(index, index > active ? 1 : -1);
    },
    [active, count, goTo, isAnimating]
  );

  const onPointerDown = (event: React.PointerEvent) => {
    pointerStartX.current = event.clientX;
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (pointerStartX.current == null || isAnimating) {
      pointerStartX.current = null;
      return;
    }
    const delta = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0) {
      // Swipe left → next / restart on last stage
      if (isLastStage) restart();
      else advance();
    } else if (!isLastStage && active > 0) {
      goTo(active - 1, -1);
    }
  };

  const finishSpin = useCallback(() => {
    setIsAnimating(false);
  }, []);

  useEffect(() => {
    if (!isAnimating) return;
    const ms = (reduceMotion ? 0.2 : IMAGE_SPIN_DURATION) * 1000 + 80;
    const id = window.setTimeout(finishSpin, ms);
    return () => window.clearTimeout(id);
  }, [active, finishSpin, isAnimating, reduceMotion]);

  // Auto-advance Propagation → … → Point of Sale; pause on the last stage.
  useEffect(() => {
    if (isAnimating || isLastStage) return;
    const id = window.setTimeout(advance, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [active, advance, isAnimating, isLastStage]);

  const metrics = useMemo(() => {
    const w = Math.max(width || 320, 320);
    const isMobile = w < 640;
    const isTablet = w < 1024;

    const pillStepDeg = isMobile
      ? PILL_STEP_MOBILE_DEG
      : isTablet
        ? PILL_STEP_TABLET_DEG
        : PILL_STEP_DESKTOP_DEG;

    // Fluid pill scale so icon + label stay inside the rim on narrow screens.
    const pillScale = isMobile
      ? Math.min(1, Math.max(0.72, w / 420))
      : isTablet
        ? 0.92
        : 1;
    const pillFontPx = Math.round((isMobile ? 10 : isTablet ? 12 : 13) * pillScale);
    const pillIconBoxPx = Math.round((isMobile ? 16 : isTablet ? 20 : 24) * pillScale);
    const pillIconPx = Math.round(pillIconBoxPx * 0.5);
    const pillPadY = Math.max(2, Math.round(4 * pillScale));
    const pillPadRight = Math.max(6, Math.round((isMobile ? 8 : 12) * pillScale));
    const pillPadLeft = Math.max(3, Math.round(4 * pillScale));
    const pillGap = Math.max(2, Math.round((isMobile ? 3 : 6) * pillScale));
    const pillLabelMaxW = isMobile
      ? Math.round(Math.min(72, w * 0.16) * pillScale)
      : null;

    // Keep neighbor pills inside the viewport (same rim behavior as desktop).
    const estimatedPillHalfW = isMobile
      ? Math.round(52 * pillScale + (pillLabelMaxW ?? 56) * 0.35)
      : isTablet
        ? 80
        : 110;
    const stepRad = (pillStepDeg * Math.PI) / 180;
    const maxOuterR = Math.max(
      110,
      (w * 0.5 - estimatedPillHalfW) / Math.sin(stepRad)
    );

    const guideGap = Math.round(
      Math.max(isMobile ? 26 : 36, Math.min(isMobile ? 36 : 48, w * 0.045))
    );
    const mediaRadius = Math.min(
      maxOuterR - guideGap,
      w * (isMobile ? 0.4 : isTablet ? 0.28 : 0.23)
    );
    const mediaChord = Math.max(mediaRadius * 2, 200);
    const mediaRise = mediaChord * 0.5;
    const media = circleFromChord(mediaChord, mediaRise, 0);
    const pillRadius = media.radius + guideGap;

    const rimClearance = isMobile ? 36 : 40;
    const wheelHeight = Math.ceil(rimClearance + pillRadius);
    const mediaLeft = (w - mediaChord) / 2;
    const mediaTop = wheelHeight - mediaRise;
    const mediaCx = w / 2;
    const mediaCy = mediaTop + media.cy;

    const guideAlpha = Math.min(Math.max(media.alpha, 82), 90);
    const guidePath = `${describeArc(
      mediaCx,
      mediaCy,
      pillRadius,
      -guideAlpha,
      guideAlpha
    )} Z`;

    return {
      w,
      wheelHeight,
      mediaChord,
      mediaRise,
      mediaLeft,
      mediaTop,
      mediaCx,
      mediaCy,
      guidePath,
      guideAlpha,
      pillRadius,
      pillStepDeg,
      pillFontPx,
      pillIconBoxPx,
      pillIconPx,
      pillPadY,
      pillPadRight,
      pillPadLeft,
      pillGap,
      pillLabelMaxW,
      isMobile,
      ready: width > 0,
    };
  }, [width]);

  const activeStage = STAGES[active];

  const imageVariants = useMemo(
    () => ({
      enter: (dir: number) =>
        reduceMotion
          ? { opacity: 0, rotate: 0 }
          : { opacity: 1, rotate: dir * IMAGE_SPIN_DEG },
      center: { opacity: 1, rotate: 0 },
      exit: (dir: number) =>
        reduceMotion
          ? { opacity: 0, rotate: 0 }
          : { opacity: 1, rotate: dir * -IMAGE_SPIN_DEG },
    }),
    [reduceMotion]
  );

  const bodyParagraphs = [t("body.p1"), t("body.p2"), t("body.p3")];

  return (
    <section
      aria-label={t("ariaLabel")}
      className="relative z-10 overflow-x-clip bg-oboya-blue-dark py-[var(--section-y)]"
    >
      <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-padding)] text-center">
        <h2 className="mx-auto max-w-4xl font-display text-[clamp(1.65rem,3.6vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white text-balance">
          {t("title")}
        </h2>
      </div>

      {/* Wheel */}
      <div
        ref={frameRef}
        className="relative mx-auto mt-6 w-full touch-pan-y overflow-x-clip overflow-y-visible sm:mt-8 md:mt-10 md:overflow-visible"
        style={{ height: metrics.ready ? metrics.wheelHeight : undefined, minHeight: metrics.ready ? undefined : 240 }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {metrics.ready ? (
          <>
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${metrics.w} ${metrics.wheelHeight}`}
          width={metrics.w}
          height={metrics.wheelHeight}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <path
            d={metrics.guidePath}
            fill="none"
            stroke="rgba(255,255,255,0.32)"
            strokeWidth={1.35}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div
          className="pointer-events-none absolute left-1/2 z-20"
          style={{
            width: metrics.pillRadius * 2,
            height: metrics.pillRadius * 2,
            top: metrics.mediaCy,
            transform: "translate3d(-50%, -50%, 0)",
          }}
        >
          <ul className="absolute inset-0 m-0 list-none p-0">
            {STAGES.map((stage, index) => {
              // Wrap signed offsets for smooth restart motion; hide the wrap-around
              // Propagation tip while parked on Point of Sale (only reveal on restart).
              let signed = index - active;
              if (signed > count / 2) signed -= count;
              if (signed < -count / 2) signed += count;

              const isActiveSlot = signed === 0;
              const isPrevSlot = signed === -1;
              const isNextSlot = signed === 1;
              // Hide wrap-around prev on the first stage (no POS on the left yet).
              const hideWrapPrev = active === 0 && isPrevSlot;
              // Hide wrap-around next on the last stage until restart is clicked.
              const hideWrapNext = isLastStage && isNextSlot;
              const visible =
                (isActiveSlot || isPrevSlot || isNextSlot) &&
                !hideWrapPrev &&
                !hideWrapNext;

              // Travel along the rim; park past-arc stages at the tip so they
              // enter from the guide ends, never from outside the line.
              const rawAngle = signed * metrics.pillStepDeg;
              const tip = metrics.guideAlpha;
              const displayAngle =
                Math.sign(rawAngle || 0) * Math.min(Math.abs(rawAngle), tip);
              const Icon = stage.icon;
              const fade = isActiveSlot ? 1 : isNextSlot ? 0.92 : 0.55;

              return (
                <li
                  key={stage.id}
                  className="absolute top-1/2 left-1/2 h-0 w-0"
                  style={{
                    transform: `rotate(${displayAngle}deg) translate3d(0, -${metrics.pillRadius}px, 0)`,
                    zIndex: isActiveSlot ? 3 : 1,
                    opacity: visible ? 1 : 0,
                    pointerEvents: visible && !isAnimating ? "auto" : "none",
                    transition: RIM_TRANSITION,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => select(index)}
                    disabled={isAnimating || !visible}
                    aria-label={t(`stages.${stage.id}`)}
                    aria-current={isActiveSlot ? "true" : undefined}
                    tabIndex={visible && !isAnimating ? 0 : -1}
                    className={cn(
                      "pointer-events-auto absolute left-0 top-0 flex items-center rounded-full border border-white/12 bg-oboya-blue/90 shadow-[0_2px_10px_rgba(0,0,0,0.25)] backdrop-blur-sm",
                      "text-left text-white hover:bg-oboya-blue disabled:pointer-events-none",
                      "transition-[opacity,background-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.33,1,0.28,1)]",
                      isActiveSlot &&
                        "bg-oboya-blue shadow-[0_0_0_1px_rgba(255,255,255,0.16)]"
                    )}
                    style={{
                      transform: `translate(-50%, -50%) rotate(${-displayAngle}deg)`,
                      opacity: fade,
                      transition: RIM_TRANSITION,
                      gap: metrics.pillGap,
                      paddingTop: metrics.pillPadY,
                      paddingBottom: metrics.pillPadY,
                      paddingRight: metrics.pillPadRight,
                      paddingLeft: metrics.pillPadLeft,
                    }}
                  >
                    <span
                      className="flex shrink-0 items-center justify-center rounded-full bg-oboya-blue-dark"
                      style={{
                        width: metrics.pillIconBoxPx,
                        height: metrics.pillIconBoxPx,
                      }}
                    >
                      <Icon
                        className="text-oboya-green-light"
                        style={{
                          width: metrics.pillIconPx,
                          height: metrics.pillIconPx,
                        }}
                        strokeWidth={2}
                        aria-hidden
                      />
                    </span>
                    <span
                      className="truncate whitespace-nowrap font-body font-medium tracking-wide"
                      style={{
                        fontSize: metrics.pillFontPx,
                        maxWidth: metrics.pillLabelMaxW ?? undefined,
                      }}
                    >
                      {t(`stages.${stage.id}`)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className="absolute z-10 overflow-hidden"
          style={{
            left: metrics.mediaLeft,
            top: metrics.mediaTop,
            width: metrics.mediaChord,
            height: metrics.mediaRise,
            borderRadius: `${metrics.mediaChord}px ${metrics.mediaChord}px 0 0`,
          }}
        >
          <AnimatePresence mode="sync" custom={direction} initial={false}>
            <motion.div
              key={activeStage.id}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={
                reduceMotion
                  ? { duration: 0.2 }
                  : {
                      duration: IMAGE_SPIN_DURATION,
                      ease: IMAGE_SPIN_EASE,
                    }
              }
              onAnimationComplete={(definition) => {
                if (definition === "center") finishSpin();
              }}
              className="absolute origin-bottom"
              style={{
                inset: "-6%",
                transformOrigin: "50% 100%",
              }}
            >
              <Image
                src={activeStage.image}
                alt={t(`stages.${activeStage.id}`)}
                fill
                className="object-cover object-center scale-[1.06]"
                sizes="(max-width: 768px) 94vw, 580px"
                priority={active === 0}
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-oboya-blue-dark/40"
                aria-hidden
              />
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex h-10 items-center justify-center sm:bottom-5 sm:h-12">
            <AnimatePresence initial={false}>
              {isLastStage && !isAnimating ? (
                <motion.div
                  key="restart-nav"
                  className="pointer-events-auto absolute top-1/2 left-1/2"
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, x: "-50%", y: "-50%", scale: 0.9 }
                  }
                  animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
                  exit={
                    reduceMotion
                      ? undefined
                      : { opacity: 0, x: "-50%", y: "-50%", scale: 0.9 }
                  }
                  transition={NAV_TRANSITION}
                >
                  <button
                    type="button"
                    onClick={restart}
                    disabled={isAnimating}
                    aria-label={t("restart")}
                    className="flex size-10 items-center justify-center rounded-full border border-white/85 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:pointer-events-none disabled:opacity-50 sm:size-11"
                  >
                    <ChevronRight className="size-5" aria-hidden />
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
          </>
        ) : null}
      </div>

      <div className="mx-auto mt-10 w-full max-w-[var(--container-max)] px-[var(--container-padding)] text-center md:mt-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {bodyParagraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 24)}
              className="font-body text-[clamp(1rem,1.5vw,1.125rem)] font-light leading-[1.65] text-white/90 text-pretty"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl font-display text-[clamp(1.35rem,2.8vw,2.15rem)] font-semibold leading-[1.25] tracking-[-0.02em] text-balance md:mt-12">
          <span className="text-oboya-green">{t("closingLine1")}</span>
          <br />
          <span className="text-white">{t("closingLine2")}</span>
        </p>
      </div>
    </section>
  );
}
