"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
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

  useEffect(() => {
    if (reduceMotion || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, slides.length]);

  return (
    <div className="absolute inset-0 bg-black" aria-hidden>
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
        />
      ))}
    </div>
  );
}
