"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Cherry,
  FlaskConical,
  Flower2,
  Sprout,
  Truck,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";

const pillIcons = {
  logistics: Truck,
  research: FlaskConical,
  plants: Sprout,
  vegetable: Sprout,
  flower: Flower2,
  fruit: Cherry,
} as const;

const pillGlass =
  "border border-white/30 bg-white/15 shadow-[0_12px_48px_rgb(0_0_0/25%)] backdrop-blur-2xl";

interface HeroProps {
  data: HomepageSettings["hero"];
  locale: string;
}

export function Hero({ data, locale }: HeroProps) {
  const title = pickLocalized(data.title, locale);
  const eyebrow = pickLocalized(data.eyebrow, locale);
  const description = pickLocalized(data.description, locale);
  // Exact mock break: "Your one-stop partner" / "for horticulture!"
  const titleLines = title.includes("\n")
    ? title.split("\n")
    : (() => {
        const match = title.match(/^(.*?partner)\s+(for\s+horticulture!?)$/i);
        return match ? [match[1], match[2]] : [title];
      })();

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-oboya-blue-dark"
    >
      <div className="absolute inset-0">
        <Image
          src={data.backgroundImage}
          alt={title.replace(/\n/g, " ")}
          fill
          priority
          className="object-cover object-[center_40%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-oboya-blue-dark/90" />
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent to-oboya-blue-dark" />
      </div>

      <Container className="relative z-10 flex flex-1 flex-col pt-20 md:pt-24">
        <div className="flex flex-1 flex-col items-center justify-center px-2 pb-6 pt-8 text-center md:pb-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex max-w-3xl flex-col items-center"
          >
            {eyebrow ? (
              <motion.p
                variants={fadeInUp}
                className="mb-4 text-sm font-semibold tracking-[0.2em] text-oboya-yellow-light uppercase md:mb-5"
              >
                {eyebrow}
              </motion.p>
            ) : null}

            <motion.h1
              variants={fadeInUp}
              className="font-display text-[clamp(2.35rem,6.5vw,4.5rem)] leading-[1.05] font-black tracking-[-0.02em] text-white"
            >
              {titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </motion.h1>

            {description ? (
              <motion.p
                variants={fadeInUp}
                className="mt-5 max-w-2xl font-body text-[clamp(0.95rem,1.6vw,1.125rem)] leading-relaxed font-normal text-white/90 md:mt-6"
              >
                {description}
              </motion.p>
            ) : null}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-3xl pb-8 md:pb-12"
        >
          {/* Mobile: vertical stack. sm+: single glass row */}
          <div className="flex flex-col gap-2 sm:hidden">
            {data.pills.map((pill) => {
              const Icon = pillIcons[pill.icon] ?? Sprout;
              return (
                <Link
                  key={pill.id}
                  href={pill.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-full px-3 py-2.5",
                    pillGlass,
                    "transition-colors hover:bg-white/20"
                  )}
                >
                  {pill.image ? (
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={pill.image}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="44px"
                      />
                    </span>
                  ) : (
                    <Icon className="size-6 shrink-0 text-white/90" />
                  )}
                  <span className="min-w-0 text-left">
                    <span className="block text-sm font-semibold text-white">
                      {pickLocalized(pill.label, locale)}
                    </span>
                    <span className="mt-0.5 block text-xs font-medium text-oboya-green-light">
                      {pickLocalized(pill.sublabel, locale)}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          <div
            className={cn(
              "hidden items-center rounded-full px-2 py-2.5 sm:flex sm:px-3 sm:py-3",
              pillGlass
            )}
          >
            {data.pills.map((pill, index) => {
              const Icon = pillIcons[pill.icon] ?? Sprout;
              return (
                <div key={pill.id} className="flex min-w-0 flex-1 items-center">
                  {index > 0 ? (
                    <span
                      className="mx-1 h-10 w-px shrink-0 bg-oboya-green/70 sm:mx-2 md:h-12"
                      aria-hidden
                    />
                  ) : null}
                  <Link
                    href={pill.href}
                    className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-full px-2 py-1.5 transition-colors hover:bg-white/10 sm:gap-3 sm:px-3"
                  >
                    {pill.image ? (
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-full sm:size-12 md:size-14">
                        <Image
                          src={pill.image}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="56px"
                        />
                      </span>
                    ) : (
                      <Icon className="size-6 shrink-0 text-white/90" />
                    )}
                    <span className="min-w-0 text-left">
                      <span className="block truncate text-sm font-semibold text-white sm:text-[0.95rem]">
                        {pickLocalized(pill.label, locale)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-oboya-green-light">
                        {pickLocalized(pill.sublabel, locale)}
                      </span>
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
