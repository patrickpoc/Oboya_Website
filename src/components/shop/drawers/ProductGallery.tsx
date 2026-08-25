"use client";

import Image from "next/image";
import { Search, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ZOOM_SCALE = 1.8;

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const t = useTranslations("shop");
  const [active, setActive] = useState(0);
  const [zoomOn, setZoomOn] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const frameRef = useRef<HTMLDivElement>(null);

  const list = images.length > 0 ? images : ["/assets/world-map.svg"];
  const src = list[active] ?? list[0];

  useEffect(() => {
    setZoomOn(false);
    setOrigin({ x: 50, y: 50 });
  }, [active]);

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
          "relative aspect-[4/3] overflow-hidden rounded-lg bg-oboya-soft-white",
          zoomOn && "cursor-crosshair"
        )}
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
          className="object-cover transition-transform duration-150 ease-out will-change-transform"
          style={
            zoomOn
              ? {
                  transform: `scale(${ZOOM_SCALE})`,
                  transformOrigin: `${origin.x}% ${origin.y}%`,
                }
              : undefined
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
        <div className="flex gap-2">
          {list.map((imageSrc, index) => (
            <button
              key={imageSrc}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative size-14 overflow-hidden rounded-md border-2 transition-colors",
                active === index
                  ? "border-oboya-green"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={imageSrc}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
