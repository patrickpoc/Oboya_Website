"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { pickLocalized } from "@/lib/cms/utils";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";

const ZOOM = 2.5;
const MOVE_S = 0.8;
const CAPTION_W = 300;
const FADE_S = 0.25;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

/** White caption box that cross-fades (opacity only) between steps. */
function CaptionBox({ id, text, still, className }: { id: string; text: string; still: boolean; className: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.p
        key={id}
        className={`w-fit rounded-md bg-white px-4 py-2.5 font-body text-base leading-snug text-oboya-blue-dark shadow-md md:text-lg ${className}`}
        initial={still ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: still ? 0 : FADE_S }}
      >
        {text}
      </motion.p>
    </AnimatePresence>
  );
}

/** Greenhouse photo with a magnifying lens that moves between points via prev/next buttons. */
export function HomeChallenges({
  data,
  locale,
  animationsEnabled,
}: {
  data: HomepageSettings["challenges"];
  locale: string;
  animationsEnabled: boolean;
}) {
  const t = useTranslations("homeChallenges");
  const reduceMotion = useReducedMotion();
  const still = Boolean(reduceMotion) || !animationsEnabled;
  const frameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [ratio, setRatio] = useState(1.5);
  const [active, setActive] = useState(0);

  const points = data.points;
  const count = points.length;
  const caption = (i: number) => pickLocalized(points[i].caption, locale);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setSize({ w: frame.clientWidth, h: frame.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const { w, h } = size;
  const mobile = w > 0 && w < 640;
  const R = mobile ? 64 : w < 1024 ? 100 : 120;
  const pt = points[active];
  // Photo is object-cover and x/y are % of the whole image: map through the rendered image rect.
  const scale = Math.max(w / ratio, h) || 1;
  const rw = scale * ratio;
  const rh = scale;
  const ox = (w - rw) / 2;
  const oy = (h - rh) / 2;
  const px = ox + (pt.x / 100) * rw;
  const py = oy + (pt.y / 100) * rh;

  const lensX = clamp(px, R + 8, w - R - 8);
  const lensY = clamp(py, (mobile ? 124 : 180) + R, h - R - (mobile ? 80 : 72));
  // Ring's lower-right (or lower-left) anchor for the connector line.
  const d = R * 0.707;
  const side = lensX + d + CAPTION_W + 16 <= w ? 1 : -1;
  const lineX = lensX + side * d;
  const lineY = lensY + d;
  const mobCapW = Math.min(260, w - 32);
  const mobCapX = clamp(lensX - mobCapW / 2, 16, w - mobCapW - 16);

  const bgSize = `${rw * ZOOM}px ${rh * ZOOM}px`;
  const bgPos = `${R - (px - ox) * ZOOM}px ${R - (py - oy) * ZOOM}px`;
  const move = still ? { duration: 0 } : { duration: MOVE_S, ease: [0.22, 1, 0.36, 1] as const };
  
  const step = (dir: 1 | -1) => setActive((a) => (a + dir + count) % count);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else return;
    e.preventDefault();
  };

  return (
    <section className="relative overflow-hidden bg-oboya-soft-white">
      <div
        ref={frameRef}
        className="relative aspect-[4/5] w-full sm:aspect-auto sm:h-[clamp(540px,52vw,760px)]"
      >
        <Image
          src={data.image}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight);
          }}
        />
        <div className="absolute inset-0 bg-oboya-soft-white/60" aria-hidden />

        <h2 className="pointer-events-none absolute inset-x-0 top-0 z-[1] mx-auto max-w-3xl whitespace-pre-line px-[var(--container-padding)] pt-10 text-center font-display text-[clamp(2rem,4vw,3rem)] font-light leading-[1.15] tracking-tight text-oboya-blue-dark text-balance md:pt-14">
          {pickLocalized(data.title, locale)}
        </h2>

        {w > 0 && (
          <>
            {/* Lens */}
            <motion.div
              className="pointer-events-none absolute left-0 top-0 z-[2]"
              style={{ width: R * 2, height: R * 2, marginLeft: -R, marginTop: -R }}
              initial={false}
              animate={{ x: lensX, y: lensY }}
              transition={move}
              aria-hidden
            >
              <motion.div
                className="size-full rounded-full border-[12px] border-oboya-soft-white/70 bg-no-repeat shadow-[0_12px_40px_rgba(1,32,63,0.3)]"
                style={{ backgroundImage: `url(${data.image})`, backgroundOrigin: "border-box" }}
                initial={false}
                animate={{ backgroundSize: bgSize, backgroundPosition: bgPos }}
                transition={move}
              />
            </motion.div>

            {/* Caption (desktop) */}
            {mobile ? (
              <motion.div
                className="pointer-events-none absolute left-0 top-0 z-[2]"
                style={{ width: mobCapW }}
                initial={false}
                animate={{ x: mobCapX, y: lensY + R + 10 }}
                transition={move}
                aria-hidden
              >
                <CaptionBox id={pt.id} text={caption(active)} still={still} className="mx-auto text-center" />
              </motion.div>
            ) : (
              <motion.div
                className="pointer-events-none absolute left-0 top-0 z-[2]"
                style={{ width: CAPTION_W, marginLeft: side === 1 ? 0 : -CAPTION_W }}
                initial={false}
                animate={{ x: lineX, y: lineY }}
                transition={move}
                aria-hidden
              >
                <CaptionBox
                  id={pt.id}
                  text={caption(active)}
                  still={still}
                  className={`max-w-full ${side === 1 ? "" : "ml-auto"}`}
                />
              </motion.div>
            )}
          </>
        )}

        {count > 1 && (
          <div
            role="group"
            aria-label={t("group")}
            onKeyDown={onKeyDown}
            className="absolute bottom-4 right-4 z-[3] flex gap-3 md:bottom-8 md:right-8"
          >
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={t("prev")}
              className="flex size-10 items-center justify-center rounded-full border-2 border-oboya-blue-dark text-oboya-blue-dark transition-colors hover:bg-oboya-blue-dark/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-blue-dark focus-visible:ring-offset-2 md:size-12"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={t("next")}
              className="flex size-10 items-center justify-center rounded-full bg-white text-oboya-blue-dark shadow-md transition-colors hover:bg-oboya-soft-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-blue-dark focus-visible:ring-offset-2 md:size-12"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {t("status", { n: active + 1, total: count, caption: caption(active) })}
      </p>
    </section>
  );
}
