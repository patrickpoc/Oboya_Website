"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface SolutionsCtaProps {
  title: string;
  description: string;
  buttonLabel: string;
  imageSrc?: string;
  sharedBackdrop?: boolean;
  size?: "default" | "compact";
}

export function SolutionsCta({
  title,
  description,
  buttonLabel,
  imageSrc = "/assets/homepage/solutions-integrated.jpg",
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
          ? "min-h-[min(49vw,18.2rem)] md:min-h-[21rem] lg:min-h-[23.8rem]"
          : "min-h-[min(70vw,26rem)] md:min-h-[30rem] lg:min-h-[34rem]"
      )}
    >
      {!sharedBackdrop && imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          "absolute inset-0",
          sharedBackdrop ? "bg-black/55" : "bg-black/50"
        )}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 bg-gradient-to-b from-oboya-soft-white to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1 bg-gradient-to-t from-white to-transparent" aria-hidden />
      <div
        className={cn(
          "relative z-10 flex min-h-[inherit] flex-col items-center justify-center px-[var(--container-padding)] text-center",
          compact ? "py-[2.8rem] md:py-14" : "py-16 md:py-20"
        )}
      >
        <motion.div
          className={cn(
            "flex w-full max-w-[var(--container-max)] flex-col items-center",
            compact ? "gap-[1.4rem] md:gap-7" : "gap-6 md:gap-7"
          )}
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "-80px" }}
          variants={reduceMotion ? undefined : fadeInUp}
        >
          <h2
            className={cn(
              "font-display font-semibold leading-[1.15] tracking-[-0.02em] text-white text-balance",
              compact ? "max-w-none" : "max-w-3xl",
              compact
                ? "text-[clamp(2.1rem,3.8vw,3rem)]"
                : "text-[clamp(1.5rem,2.9vw,2.375rem)]"
            )}
          >
            {title}
          </h2>
          <p
            className={cn(
              "max-w-xl font-body leading-[1.55] text-oboya-soft-white",
              compact
                ? "text-base leading-relaxed text-white/92 sm:text-lg md:text-[1.25rem] md:leading-[1.6]"
                : "text-[0.9375rem] md:text-lg md:leading-[1.45]"
            )}
          >
            {description}
          </p>
          <Link
            href="/contact"
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
