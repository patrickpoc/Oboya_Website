"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : ["/assets/world-map.svg"];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-oboya-soft-white">
        <Image src={list[active]} alt={alt} fill className="object-cover" />
      </div>
      {list.length > 1 && (
        <div className="flex gap-2">
          {list.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative size-14 overflow-hidden rounded-md border-2 transition-colors",
                active === index
                  ? "border-oboya-green"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image src={src} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
