"use client";

import { useMemo, useState } from "react";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

export function VideoThumbnail({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const [frame, setFrame] = useState<string | null>(null);
  const previewSrc = useMemo(() => {
    const join = src.includes("?") ? "&" : "?";
    return `${src}${join}preview=1#t=0.15`;
  }, [src]);

  return (
    <div className={cn("relative size-full bg-oboya-blue-dark/10", className)}>
      {frame ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={frame} alt="" className="size-full object-cover" />
      ) : (
        <video
          src={previewSrc}
          className="size-full object-cover"
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          onLoadedData={(e) => {
            const v = e.currentTarget;
            if (v.currentTime < 0.05) {
              try {
                v.currentTime = 0.15;
              } catch {
                // Some browsers block seeks until more data arrives.
              }
            }
          }}
          onSeeked={(e) => {
            const v = e.currentTarget;
            if (!v.videoWidth || !v.videoHeight) return;
            try {
              const canvas = document.createElement("canvas");
              const maxW = 480;
              const scale = Math.min(1, maxW / v.videoWidth);
              canvas.width = Math.max(1, Math.round(v.videoWidth * scale));
              canvas.height = Math.max(1, Math.round(v.videoHeight * scale));
              const ctx = canvas.getContext("2d");
              if (!ctx) return;
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              setFrame(canvas.toDataURL("image/jpeg", 0.72));
            } catch {
              // CORS-tainted canvas — keep the seeked <video> frame visible.
            }
          }}
        />
      )}
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-black/45 text-white shadow-sm backdrop-blur-[1px]">
          <Film className="size-4" />
        </span>
      </span>
    </div>
  );
}
