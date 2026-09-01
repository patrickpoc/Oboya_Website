"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  SolutionCategoryBlock,
  type SolutionActionLink,
  type SolutionImagePosition,
  type SolutionStageLink,
} from "@/components/solutions/SolutionCategoryBlock";
import { fadeInUp } from "@/lib/animations";

interface SolutionCategoryBlockRevealProps {
  id: string;
  title: string;
  description: string;
  challengesLabel: string;
  challenges: string[];
  stagesLabel: string;
  stages: SolutionStageLink[];
  primaryCta: SolutionActionLink;
  secondaryLinks: SolutionActionLink[];
  imageSrc: string;
  imageAlt: string;
  imagePosition?: SolutionImagePosition;
  showTitle?: boolean;
}

export function SolutionCategoryBlockReveal({
  id,
  ...props
}: SolutionCategoryBlockRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      id={id}
      tabIndex={-1}
      className="scroll-mt-28"
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: true, margin: "-80px" }}
      variants={reduceMotion ? undefined : fadeInUp}
    >
      <SolutionCategoryBlock {...props} />
    </motion.article>
  );
}
