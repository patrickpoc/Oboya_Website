"use client";

import Image from "next/image";
import { Search, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ZOOM_SCALE = 1.8;
/** Fallback while natural size loads (portrait-ish). */
const FALLBACK_RATIO = 3 / 4;

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const t = useTranslations("shop");
  const [active, setActive] = useState(0);
  const [zoomOn, setZoomOn] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  /** width / height of the active image */
  const [ratio, setRatio] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const list = images.length > 0 ? images : ["/assets/world-map.svg"];
  const src = list[Math.min(active, list.length - 1)] ?? list[0];
  const aspect = ratio && ratio > 0 ? ratio : FALLBACK_RATIO;

  useEffect(() => {
    setActive(0);
    setZoomOn(false);
    setOrigin({ x: 50, y: 50 });
  }, [images]);

  useEffect(() => {
    setZoomOn(false);
    setOrigin({ x: 50, y: 50 });
  }, [active]);

  useEffect(() => {
    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (cancelled) return;
      const w = probe.naturalWidth;
      const h = probe.naturalHeight;
      if (w > 0 && h > 0) setRatio(w / h);
    };
    probe.onerror = () => {
      if (!cancelled) setRatio(FALLBACK_RATIO);
    };
    probe.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  const updateOrigin = useCallback((clientX: number, clientY: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    setOrigin({ x, y });
  }, []);

  return (
    <div className="space-y-3">
      <div
        ref={frameRef}
        className={cn(
          "relative mx-auto w-full overflow-hidden rounded-lg bg-oboya-soft-white",
          "[--gallery-max-h:min(38vh,16.5rem)] sm:[--gallery-max-h:min(42vh,20rem)] md:[--gallery-max-h:min(70vh,36rem)]",
          zoomOn && "cursor-crosshair"
        )}
        style={{
          aspectRatio: String(aspect),
          maxHeight: "var(--gallery-max-h)",
          maxWidth: `min(100%, calc(var(--gallery-max-h) * ${aspect}))`,
        }}
        onPointerMove={(event) => {
          if (!zoomOn) return;
          updateOrigin(event.clientX, event.clientY);
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, 36rem"
          className="object-contain object-center will-change-transform"
          style={
            zoomOn
              ? {
                  transform: `scale(${ZOOM_SCALE})`,
                  transformOrigin: `${origin.x}% ${origin.y}%`,
                  transition: "transform 150ms ease-out",
                }
              : { transition: "none" }
          }
          draggable={false}
        />

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setZoomOn((prev) => {
              const next = !prev;
              if (next) {
                updateOrigin(event.clientX, event.clientY);
              } else {
                setOrigin({ x: 50, y: 50 });
              }
              return next;
            });
          }}
          aria-pressed={zoomOn}
          aria-label={zoomOn ? t("zoomDisable") : t("zoomEnable")}
          className={cn(
            "absolute right-2.5 bottom-2.5 z-10 inline-flex size-9 items-center justify-center rounded-full border shadow-sm transition-colors",
            zoomOn
              ? "border-oboya-green bg-oboya-green text-white"
              : "border-border/70 bg-white/95 text-oboya-blue-dark hover:border-oboya-green/50 hover:text-oboya-green"
          )}
        >
          {zoomOn ? (
            <ZoomOut className="size-4" aria-hidden />
          ) : (
            <Search className="size-4" aria-hidden />
          )}
        </button>
      </div>

      {list.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {list.map((imageSrc, index) => (
            <button
              key={`${imageSrc}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative size-14 shrink-0 overflow-hidden rounded-md border-2 bg-oboya-soft-white transition-colors",
                active === index
                  ? "border-oboya-green"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={imageSrc}
                alt=""
                fill
                unoptimized
                className="object-contain object-center"
                sizes="56px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
