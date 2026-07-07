"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number;
  active?: boolean;
}

export function AnimatedCounter({
  value,
  suffix = "",
  duration = 2,
  active: activeProp,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const active = activeProp ?? isInView;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;

    const startTime = performance.now();
    const durationMs = duration * 1000;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [active, value, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}
