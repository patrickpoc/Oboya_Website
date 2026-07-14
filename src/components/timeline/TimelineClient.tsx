"use client";

import dynamic from "next/dynamic";
import { timelineEvents } from "@/data/timeline";

const Timeline = dynamic(
  () => import("@/components/timeline/Timeline").then((mod) => mod.Timeline),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100svh] items-center justify-center bg-oboya-blue-dark">
        <div className="size-8 animate-pulse rounded-full bg-oboya-green/40" />
      </div>
    ),
  }
);

interface TimelineClientProps {
  labels: {
    prev: string;
    next: string;
    year: string;
    progressLabel: string;
    sectionLabel: string;
    discover: string;
    skip: string;
  };
}

export function TimelineClient({ labels }: TimelineClientProps) {
  return <Timeline events={timelineEvents} labels={labels} />;
}
