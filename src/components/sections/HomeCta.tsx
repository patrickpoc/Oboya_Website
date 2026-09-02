"use client";

import { SolutionsCta } from "@/components/solutions/SolutionsCta";

interface HomeCtaProps {
  title: string;
  description: string;
  buttonLabel: string;
}

export function HomeCta({ title, description, buttonLabel }: HomeCtaProps) {
  return (
    <SolutionsCta
      title={title}
      description={description}
      buttonLabel={buttonLabel}
      sharedBackdrop
      size="compact"
    />
  );
}
