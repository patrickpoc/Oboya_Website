"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHomeIntro } from "@/components/layout/HomeIntroGate";

interface HeroMediaProps {
  mediaType: "image" | "video";
  imageSrc: string;
  videoSrc: string | null;
  alt: string;
  includeGradients?: boolean;
}

export function HeroMediaGradients() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-oboya-blue-dark/92" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent to-oboya-blue-dark" />
    </>
  );
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

function HeroMediaInner({
  mediaType,
  imageSrc,
  videoSrc,
  alt,
  includeGradients = true,
}: HeroMediaProps) {
  const intro = useHomeIntro();
  const markHeroReady = intro?.markHeroReady;
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const notified = useRef(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const wantsVideo =
    mediaType === "video" && Boolean(videoSrc) && !reducedMotion && !videoFailed;

  const notifyReady = useCallback(() => {
    if (notified.current) return;
    notified.current = true;
    markHeroReady?.();
  }, [markHeroReady]);

  useEffect(() => {
    if (wantsVideo) return;

    if (imageSrc) {
      let cancelled = false;
      const img = new window.Image();
      const done = () => {
        if (!cancelled) notifyReady();
      };
      img.onload = done;
      img.onerror = done;
      img.src = imageSrc;
      if (img.complete) done();
      return () => {
        cancelled = true;
      };
    }

    notifyReady();
  }, [wantsVideo, imageSrc, notifyReady]);

  useEffect(() => {
    if (!wantsVideo || !videoSrc) return;
    const el = videoRef.current;
    if (!el) return;

    let cancelled = false;
    let finished = false;

    const finish = async () => {
      if (cancelled || finished) return;
      finished = true;
      try {
        el.muted = true;
        await el.play();
        if (cancelled) return;
        setShowVideo(true);
        notifyReady();
      } catch {
        if (cancelled) return;
        setVideoFailed(true);
        setShowVideo(false);
        notifyReady();
      }
    };

    if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      void finish();
    } else {
      el.addEventListener("canplaythrough", finish, { once: true });
      el.addEventListener("canplay", finish, { once: true });
    }

    return () => {
      cancelled = true;
      el.removeEventListener("canplaythrough", finish);
      el.removeEventListener("canplay", finish);
    };
  }, [wantsVideo, videoSrc, notifyReady]);

  const showImage =
    Boolean(imageSrc) &&
    (mediaType === "image" || reducedMotion || videoFailed || !wantsVideo || !showVideo);

  return (
    <div className="absolute inset-0 size-full min-h-full bg-oboya-blue-dark">
      {showImage ? (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          priority
          className="size-full object-cover object-center"
          sizes="100vw"
        />
      ) : null}

      {wantsVideo && videoSrc ? (
        <video
          ref={videoRef}
          className={`absolute inset-0 size-full object-cover object-center transition-opacity duration-500 ${
            showVideo ? "opacity-100" : "opacity-0"
          }`}
          src={videoSrc}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-hidden
          tabIndex={-1}
          onPlaying={() => {
            setShowVideo(true);
            notifyReady();
          }}
          onError={() => {
            setVideoFailed(true);
            setShowVideo(false);
            notifyReady();
          }}
        />
      ) : null}

      {includeGradients ? <HeroMediaGradients /> : null}
    </div>
  );
}

/** Remount on media change so local play state resets without sync setState-in-effect. */
export function HeroMedia(props: HeroMediaProps) {
  return (
    <HeroMediaInner
      key={`${props.mediaType}:${props.videoSrc ?? ""}:${props.imageSrc}`}
      {...props}
    />
  );
}
