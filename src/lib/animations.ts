import type { Transition, Variants } from "framer-motion";

/** Smooth deceleration curve used across scroll-reveal sections. */
export const easeOutSmooth = [0.19, 1, 0.22, 1] as const;

/** @deprecated Use easeOutSmooth */
export const easeOutExpo = easeOutSmooth;

/** Shared whileInView viewport — triggers slightly before the section is centered. */
export const revealViewport = {
  once: true,
  margin: "-48px",
  amount: 0.2,
} as const;

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: easeOutSmooth },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.65, ease: easeOutSmooth },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.75, ease: easeOutSmooth },
  },
};

/** Horizontal carousel snap (arrow buttons). */
export const carouselSnapTransition: Transition = {
  type: "spring",
  stiffness: 210,
  damping: 32,
  mass: 0.9,
};

/** Image crossfade between carousel slides. */
export const crossfadeTransition: Transition = {
  duration: 0.85,
  ease: easeOutSmooth,
};

/** Short text swap inside carousels. */
export const contentSwapTransition: Transition = {
  duration: 0.55,
  ease: easeOutSmooth,
};
