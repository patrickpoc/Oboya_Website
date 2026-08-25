"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { getCmsImageSources } from "@/lib/cms/media-sources";
import type { MediaAssetVariants } from "@/lib/cms/types";

/**
 * If the URL follows /uploads/{id}/desktop.webp (or sibling),
 * derive the rest of the variant set without a media lookup.
 */
export function deriveVariantsFromOptimizedUrl(
  url: string
): MediaAssetVariants | null {
  const match = url.match(
    /^\/uploads\/([^/]+)\/(desktop|mobile|card|thumb)\.(webp|avif|jpe?g)$/i
  );
  if (!match) return null;
  const id = match[1];
  const base = `/uploads/${id}`;
  return {
    thumb: {
      url: `${base}/thumb.webp`,
      width: 0,
      height: 0,
      size: 0,
      mimeType: "image/webp",
    },
    mobile: {
      url: `${base}/mobile.webp`,
      width: 0,
      height: 0,
      size: 0,
      mimeType: "image/webp",
    },
    mobileAvif: {
      url: `${base}/mobile.avif`,
      width: 0,
      height: 0,
      size: 0,
      mimeType: "image/avif",
    },
    card: {
      url: `${base}/card.webp`,
      width: 0,
      height: 0,
      size: 0,
      mimeType: "image/webp",
    },
    desktop: {
      url: `${base}/desktop.webp`,
      width: 0,
      height: 0,
      size: 0,
      mimeType: "image/webp",
    },
    desktopAvif: {
      url: `${base}/desktop.avif`,
      width: 0,
      height: 0,
      size: 0,
      mimeType: "image/avif",
    },
    desktopJpeg: {
      url: `${base}/desktop.jpg`,
      width: 0,
      height: 0,
      size: 0,
      mimeType: "image/jpeg",
    },
  };
}

type CmsResponsiveImageProps = {
  src: string;
  alt: string;
  variants?: MediaAssetVariants | null;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  /** Use next/image when no variants; picture when variants exist. */
  unoptimized?: boolean;
};

/**
 * Serves AVIF → WebP → JPEG/img with mobile/desktop srcsets when variants exist.
 * Falls back to next/image for plain CMS URLs.
 */
export function CmsResponsiveImage({
  src,
  alt,
  variants: variantsProp,
  fill = false,
  priority = false,
  className,
  sizes = "100vw",
  unoptimized = false,
}: CmsResponsiveImageProps) {
  const derived = variantsProp ?? deriveVariantsFromOptimizedUrl(src);
  const sources = getCmsImageSources(src, derived);

  if (!sources.hasVariants) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        priority={priority}
        className={className}
        sizes={sizes}
        unoptimized={unoptimized}
        {...(!fill
          ? {
              width: sources.width || 1920,
              height: sources.height || 1080,
            }
          : {})}
      />
    );
  }

  // Pre-optimized files — skip Next image optimizer double-processing.
  return (
    <picture className={cn(fill && "absolute inset-0 block size-full")}>
      {sources.desktopAvif || sources.mobileAvif ? (
        <source
          type="image/avif"
          srcSet={[
            sources.mobileAvif ? `${sources.mobileAvif} 1080w` : null,
            sources.desktopAvif ? `${sources.desktopAvif} 1920w` : null,
          ]
            .filter(Boolean)
            .join(", ")}
          sizes={sizes}
        />
      ) : null}
      <source
        type="image/webp"
        srcSet={[
          `${sources.mobileWebp} 1080w`,
          `${sources.desktopWebp} 1920w`,
        ].join(", ")}
        sizes={sizes}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sources.desktopJpeg || sources.desktopWebp}
        alt={alt}
        className={cn(fill && "size-full object-cover", className)}
        sizes={sizes}
        decoding={priority ? "sync" : "async"}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        width={sources.width || undefined}
        height={sources.height || undefined}
      />
    </picture>
  );
}
