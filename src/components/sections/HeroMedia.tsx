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

    if (!wantsVideo) {
      notifyReady();
    }
  }, [imageSrc, wantsVideo, notifyReady]);

  useEffect(() => {
    if (!wantsVideo || !videoSrc || imageSrc) return;
    const el = videoRef.current;
    if (!el) return;

    let cancelled = false;
    const onData = () => {
      if (!cancelled) notifyReady();
    };

    if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      onData();
    } else {
      el.addEventListener("loadeddata", onData, { once: true });
    }

    return () => {
      cancelled = true;
      el.removeEventListener("loadeddata", onData);
    };
  }, [wantsVideo, videoSrc, imageSrc, notifyReady]);

  useEffect(() => {
    if (!wantsVideo || !videoSrc) return;
    const el = videoRef.current;
    if (!el) return;

    let cancelled = false;

    const tryPlay = () => {
      if (cancelled) return;
      el.muted = true;
      void el.play().then(
        () => {
          if (!cancelled) setShowVideo(true);
        },
        () => {
          if (cancelled) return;
          setVideoFailed(true);
          setShowVideo(false);
        }
      );
    };

    if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      tryPlay();
    } else {
      el.addEventListener("loadeddata", tryPlay, { once: true });
    }

    return () => {
      cancelled = true;
      el.removeEventListener("loadeddata", tryPlay);
    };
  }, [wantsVideo, videoSrc]);

  const showImage =
    Boolean(imageSrc) &&
    (mediaType === "image" || !wantsVideo || !showVideo);

  return (
    <div className="absolute inset-0 bg-oboya-blue-dark">
      {showImage ? (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          priority
          className="object-cover object-[center_40%]"
          sizes="100vw"
        />
      ) : null}

      {wantsVideo && videoSrc ? (
        <video
          ref={videoRef}
          className={`absolute inset-0 size-full object-cover object-[center_40%] transition-opacity duration-500 ${
            showVideo ? "opacity-100" : "opacity-0"
          }`}
          src={videoSrc}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-hidden
          tabIndex={-1}
          onPlaying={() => setShowVideo(true)}
          onError={() => {
            setVideoFailed(true);
            setShowVideo(false);
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
