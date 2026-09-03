"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface AboutPageBackdropProps {
  imageSrc: string | null;
  alt: string;
  children: ReactNode;
  /** Solid sections after the hero scroll-backdrop (Timeline onward). */
  afterBackdrop?: ReactNode;
}

/**
 * Keeps the About hero image + black fade fixed while content scrolls,
 * until the sentinel after Timeline (Impact onward is solid).
 */
export function AboutPageBackdrop({
  imageSrc,
  alt,
  children,
  afterBackdrop,
}: AboutPageBackdropProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const [showBackdrop, setShowBackdrop] = useState(true);

  useEffect(() => {
    const el = endRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setShowBackdrop(rect.top >= 0);
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
        <div className="hero-fixed-backdrop" aria-hidden>
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={alt}
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-oboya-blue-dark" />
          )}
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ) : null}

      <div className="relative z-10">
        {children}
        <div ref={endRef} className="h-0 w-full" aria-hidden />
      </div>

      {afterBackdrop ? (
        <div className="relative z-10">{afterBackdrop}</div>
      ) : null}
    </div>
  );
}
