"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 5500;

interface SolutionsHeroCarouselProps {
  images: string[];
  alt: string;
}

export function SolutionsHeroCarousel({
  images,
  alt,
}: SolutionsHeroCarouselProps) {
  const reduceMotion = useReducedMotion();
  const slides = images.length > 0 ? images : ["/assets/homepage/solutions-integrated.jpg"];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const autoPlayEnabled =
    !reduceMotion && !isTouch && !paused && slides.length > 1;

  useEffect(() => {
    if (!autoPlayEnabled) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [autoPlayEnabled, slides.length]);

  const go = (direction: -1 | 1) => {
    setPaused(true);
    setActive((prev) => (prev + direction + slides.length) % slides.length);
  };

  return (
    <div className="absolute inset-0 bg-black">
      <div className="sr-only" aria-live="polite">
        {alt}
      </div>
      {slides.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={index === active ? alt : ""}
          fill
          priority={index === 0}
          className={cn(
            "object-cover object-center transition-opacity duration-[1400ms] ease-out",
            index === active ? "opacity-100" : "opacity-0"
          )}
          sizes="100vw"
          aria-hidden={index !== active}
        />
      ))}
      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-3 px-4 md:hidden">
          <button
            type="button"
            onClick={() => go(-1)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/60 bg-black/30 text-white"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex gap-1.5" role="tablist" aria-label="Hero slides">
            {slides.map((src, index) => (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={index === active}
                onClick={() => {
                  setPaused(true);
                  setActive(index);
                }}
                className={cn(
                  "size-2 rounded-full transition-colors",
                  index === active ? "bg-white" : "bg-white/40"
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/60 bg-black/30 text-white"
            aria-label="Next slide"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
