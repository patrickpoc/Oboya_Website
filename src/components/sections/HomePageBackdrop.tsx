"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { HeroMedia } from "@/components/sections/HeroMedia";

export const HomeScrollBackdropContext = createContext(false);

interface HomePageBackdropProps {
  enabled?: boolean;
  mediaType: "image" | "video";
  imageSrc: string;
  videoSrc: string | null;
  alt: string;
  children: ReactNode;
}

export function HomePageBackdrop({
  enabled = true,
  mediaType,
  imageSrc,
  videoSrc,
  alt,
  children,
}: HomePageBackdropProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const [showBackdrop, setShowBackdrop] = useState(true);

  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <HomeScrollBackdropContext.Provider value={true}>
      <div className="relative">
        {showBackdrop ? (
          <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
            <HeroMedia
              mediaType={mediaType}
              imageSrc={imageSrc}
              videoSrc={videoSrc}
              alt={alt}
              includeGradients={false}
            />
          </div>
        ) : null}
        <div className="relative z-10">
          {children}
          <div ref={endRef} className="h-px w-full" aria-hidden />
        </div>
      </div>
    </HomeScrollBackdropContext.Provider>
  );
}

export function useHomeScrollBackdrop() {
  return useContext(HomeScrollBackdropContext);
}
