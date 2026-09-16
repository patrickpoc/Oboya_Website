"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface SolutionsCtaProps {
  title: string;
  description: string;
  buttonLabel: string;
  href?: string;
  imageSrc?: string;
  /** When true, skip local image and rely on a page-level scroll backdrop. */
  sharedBackdrop?: boolean;
  size?: "default" | "compact";
}

export function SolutionsCta({
  title,
  description,
  buttonLabel,
  href = "/shop",
  imageSrc = "/assets/solutions/cta-horticulture.jpg",
  sharedBackdrop = false,
  size = "default",
}: SolutionsCtaProps) {
  const reduceMotion = useReducedMotion();
  const compact = size === "compact";

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        compact
          ? "min-h-[min(68vw,19rem)] sm:min-h-[20rem] md:min-h-[21rem] lg:min-h-[23.8rem]"
          : "min-h-[min(78vw,24rem)] sm:min-h-[26rem] md:min-h-[30rem] lg:min-h-[34rem]"
      )}
    >
      {!sharedBackdrop && imageSrc ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${imageSrc})` }}
          aria-hidden
        />
      ) : null}
      <div className="absolute inset-0 bg-black/55" aria-hidden />
      <div
        className={cn(
          "relative z-10 flex min-h-[inherit] flex-col items-center justify-center px-[var(--container-padding)] text-center",
          compact
            ? "py-10 sm:py-12 md:py-14"
            : "py-12 sm:py-14 md:py-20"
        )}
      >
        <motion.div
          className={cn(
            "flex w-full max-w-[var(--container-max)] flex-col items-center",
            compact ? "gap-4 sm:gap-5 md:gap-7" : "gap-5 sm:gap-6 md:gap-7"
          )}
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "-80px" }}
          variants={reduceMotion ? undefined : fadeInUp}
        >
          <h2
            className={cn(
              "font-display font-light leading-[1.15] tracking-[-0.02em] text-white text-balance",
              compact ? "max-w-none" : "max-w-3xl",
              compact
                ? "text-[clamp(1.5rem,5.2vw,3rem)]"
                : "text-[clamp(1.35rem,4.2vw,2.375rem)]"
            )}
          >
            {title}
          </h2>
          <p
            className={cn(
              "max-w-xl font-body text-oboya-soft-white text-pretty",
              compact
                ? "text-[clamp(0.9375rem,2.8vw,1.25rem)] leading-[1.55] text-white/92 md:leading-[1.6]"
                : "text-[clamp(0.9rem,2.4vw,1.125rem)] leading-[1.55] md:leading-[1.45]"
            )}
          >
            {description}
          </p>
          <Link
            href={href}
            className={cn(
              buttonVariants({ size: "cta" }),
              "border border-white bg-transparent text-white hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
            )}
          >
            {buttonLabel}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
