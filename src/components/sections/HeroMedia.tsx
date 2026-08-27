"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface HeroMediaProps {
  mediaType: "image" | "video";
  imageSrc: string;
  videoSrc: string | null;
  alt: string;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function HeroMedia({
  mediaType,
  imageSrc,
  videoSrc,
  alt,
}: HeroMediaProps) {
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const canPlayVideo =
    mediaType === "video" &&
    Boolean(videoSrc) &&
    !reducedMotion &&
    !videoFailed;

  useEffect(() => {
    setShowVideo(false);
    setVideoFailed(false);
  }, [videoSrc, mediaType]);

  useEffect(() => {
    if (!canPlayVideo) return;
    const el = videoRef.current;
    if (!el) return;

    const tryPlay = async () => {
      try {
        el.muted = true;
        await el.play();
        setShowVideo(true);
      } catch {
        setVideoFailed(true);
        setShowVideo(false);
      }
    };

    if (el.readyState >= 2) {
      void tryPlay();
    } else {
      const onCanPlay = () => {
        void tryPlay();
      };
      el.addEventListener("canplay", onCanPlay);
      return () => el.removeEventListener("canplay", onCanPlay);
    }
  }, [canPlayVideo, videoSrc]);

  return (
    <div className="absolute inset-0">
      <Image
        src={imageSrc || "/assets/homepage/hero-vineyard.jpg"}
        alt={alt}
        fill
        priority
        className="object-cover object-[center_40%]"
        sizes="100vw"
      />

      {canPlayVideo && videoSrc ? (
        <video
          ref={videoRef}
          className={`absolute inset-0 size-full object-cover object-[center_40%] transition-opacity duration-500 ${
            showVideo ? "opacity-100" : "opacity-0"
          }`}
          src={videoSrc}
          poster={imageSrc || undefined}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-hidden
          tabIndex={-1}
          onError={() => {
            setVideoFailed(true);
            setShowVideo(false);
          }}
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-oboya-blue-dark/92" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent to-oboya-blue-dark" />
    </div>
  );
}
