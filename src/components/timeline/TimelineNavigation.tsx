"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  labels: {
    prev: string;
    next: string;
  };
  className?: string;
}

export function TimelineNavigation({
  onPrev,
  onNext,
  canPrev,
  canNext,
  labels,
  className,
}: TimelineNavigationProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label={labels.prev}
        className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-oboya-green hover:bg-oboya-green/20 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label={labels.next}
        className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-oboya-green hover:bg-oboya-green/20 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
