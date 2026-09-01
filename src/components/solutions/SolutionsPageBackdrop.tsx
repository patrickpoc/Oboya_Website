"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { SolutionsHeroCarousel } from "@/components/solutions/SolutionsHeroCarousel";

interface SolutionsPageBackdropProps {
  images: string[];
  alt: string;
  children: ReactNode;
}

export function SolutionsPageBackdrop({
  images,
  alt,
  children,
}: SolutionsPageBackdropProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const [showBackdrop, setShowBackdrop] = useState(true);

  useEffect(() => {
    const el = endRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const scrolledPast = rect.top < 0;
      setShowBackdrop(!scrolledPast);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="relative">
      {showBackdrop ? (
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
          <SolutionsHeroCarousel images={images} alt={alt} />
        </div>
      ) : null}
      <div className="relative z-10">
        {children}
        <div ref={endRef} className="h-px w-full" aria-hidden />
      </div>
    </div>
  );
}
