"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { fadeInUp, staggerContainer, easeOutExpo } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { cn } from "@/lib/utils";

interface AboutPeopleProps {
  data: AboutPageSettings["people"];
  locale: string;
  /** Spotlight: one person in focus; scroll advances to the next. */
  scrollSpotlight?: boolean;
}

export function AboutPeople({
  data,
  locale,
  scrollSpotlight = false,
}: AboutPeopleProps) {
  if (scrollSpotlight) {
    return <PeopleScrollSpotlight data={data} locale={locale} />;
  }

  return <PeopleStaticGrid data={data} locale={locale} />;
}

function PeopleHeader({
  data,
  locale,
}: {
  data: AboutPageSettings["people"];
  locale: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={staggerContainer}
      className="mx-auto max-w-2xl text-center"
    >
      <motion.p
        variants={fadeInUp}
        className="font-body text-[0.8125rem] font-medium tracking-[0.04em] text-oboya-green md:text-sm"
      >
        {pickLocalized(data.eyebrow, locale)}
      </motion.p>
      <motion.h2
        variants={fadeInUp}
        className="mt-4 font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold tracking-[-0.02em] text-oboya-blue-dark text-balance"
      >
        {pickLocalized(data.title, locale)}
      </motion.h2>
      <motion.p
        variants={fadeInUp}
        className="mt-4 font-body text-[1.0625rem] leading-relaxed text-oboya-blue-dark/60"
      >
        {pickLocalized(data.description, locale)}
      </motion.p>
    </motion.div>
  );
}

function PeopleStaticGrid({
  data,
  locale,
}: {
  data: AboutPageSettings["people"];
  locale: string;
}) {
  return (
    <section className="bg-oboya-soft-white py-[clamp(5rem,12vw,9rem)]">
      <Container>
        <PeopleHeader data={data} locale={locale} />
        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="mt-14 grid gap-8 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-10"
        >
          {data.items.map((person) => (
            <motion.li key={person.id} variants={fadeInUp} className="group">
              <div className="relative aspect-[3/4] overflow-hidden bg-oboya-blue-dark/5">
                <Image
                  src={person.image}
                  alt={person.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-oboya-blue-dark">
                {person.name}
              </h3>
              <p className="mt-1 text-sm text-oboya-blue-dark/55">
                {pickLocalized(person.role, locale)}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}

/**
 * Previous spotlight structure restored:
 * one person in evidence, slide transitions, progress dots.
 * Driven by CSS sticky + scroll progress (no GSAP pin → no scroll conflict).
 */
function PeopleScrollSpotlight({
  data,
  locale,
}: {
  data: AboutPageSettings["people"];
  locale: string;
}) {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const prevActive = useRef(0);
  const items = data.items;
  const count = items.length;
  const person = items[active];

  useEffect(() => {
    if (reduce || count <= 1) return;

    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const rect = track.getBoundingClientRect();
      const trackHeight = track.offsetHeight;
      const viewport = window.innerHeight;
      // Progress through the sticky track (0 → 1)
      const scrolled = -rect.top;
      const range = Math.max(trackHeight - viewport, 1);
      const progress = Math.min(1, Math.max(0, scrolled / range));
      const next = Math.min(count - 1, Math.round(progress * (count - 1)));

      if (next !== prevActive.current) {
        setDirection(next > prevActive.current ? "forward" : "back");
        prevActive.current = next;
        setActive(next);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count, reduce]);

  if (!person) return null;

  const enterX = direction === "forward" ? 56 : -56;
  const exitX = direction === "forward" ? -56 : 56;
  // Tall track so sticky stays pinned while scrolling through people
  const trackStyle = {
    height: reduce ? "auto" : `${Math.max(count, 1) * 100}vh`,
  };

  return (
    <section className="bg-oboya-soft-white">
      <div ref={trackRef} className="relative" style={trackStyle}>
        <div
          className={cn(
            "flex flex-col justify-center py-16 md:py-20",
            !reduce && "sticky top-0 min-h-svh"
          )}
        >
          <Container>
            <PeopleHeader data={data} locale={locale} />

            <div className="relative mt-12 grid items-center gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-14">
              <div className="relative lg:col-span-6">
                <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden bg-oboya-blue-dark/5 lg:max-w-none">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={person.id}
                      className="absolute inset-0"
                      initial={reduce ? { opacity: 0 } : { x: enterX, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={reduce ? { opacity: 0 } : { x: exitX, opacity: 0 }}
                      transition={{ duration: 0.55, ease: easeOutExpo }}
                    >
                      <Image
                        src={person.image}
                        alt={person.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 90vw, 42vw"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="lg:col-span-5 lg:col-start-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.45, ease: easeOutExpo }}
                  >
                    <p className="font-body text-xs font-medium tracking-[0.16em] text-oboya-green uppercase">
                      {String(active + 1).padStart(2, "0")} /{" "}
                      {String(count).padStart(2, "0")}
                    </p>
                    <h3 className="mt-4 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.02em] text-oboya-blue-dark">
                      {person.name}
                    </h3>
                    <p className="mt-2 text-base text-oboya-blue-dark/55 md:text-lg">
                      {pickLocalized(person.role, locale)}
                    </p>
                    {person.bio ? (
                      <p className="mt-5 max-w-md font-body text-[1.0625rem] leading-relaxed text-oboya-blue-dark/60">
                        {pickLocalized(person.bio, locale)}
                      </p>
                    ) : null}
                  </motion.div>
                </AnimatePresence>

                <ul className="mt-10 flex flex-wrap gap-2">
                  {items.map((item, index) => (
                    <li key={item.id}>
                      <span
                        className={cn(
                          "block h-1.5 w-8 rounded-full transition-colors duration-300",
                          index === active
                            ? "bg-oboya-green"
                            : "bg-oboya-blue-dark/15"
                        )}
                        aria-hidden
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
