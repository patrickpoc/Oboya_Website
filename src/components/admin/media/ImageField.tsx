"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Film, ImageIcon, Link2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMediaAssets, saveMediaAsset } from "@/lib/cms/repositories/media-repository";
import { uploadMediaFile } from "@/lib/cms/client/upload-media";
import type { MediaAsset } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

type SourceMode = "upload" | "url" | "library";
export type MediaLibraryItem = {
  id: string;
  name: string;
  url: string;
  type: MediaAsset["type"];
};
/** @deprecated Use MediaLibraryItem */
export type MediaLibraryImage = MediaLibraryItem;

export type MediaFieldAllowedType = "image" | "video";

interface MediaFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  optional?: boolean;
  allowedTypes?: MediaFieldAllowedType[];
}

const DEFAULT_TYPES: MediaFieldAllowedType[] = ["image"];

function acceptFor(types: MediaFieldAllowedType[]) {
  const parts: string[] = [];
  if (types.includes("image")) parts.push("image/*");
  if (types.includes("video")) parts.push("video/mp4,video/webm");
  return parts.join(",");
}

function fileNameFromUrl(url: string) {
  try {
    const path = url.startsWith("http")
      ? new URL(url).pathname
      : url.split("?")[0];
    const name = decodeURIComponent(path.split("/").filter(Boolean).pop() || "");
    return name || url;
  } catch {
    return url.split("/").pop()?.split("?")[0] || url;
  }
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

/** Seek to a frame so the admin preview shows a real thumbnail, not a blank box. */
function VideoThumbnail({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const [frame, setFrame] = useState<string | null>(null);

  return (
    <div
      key={src}
      className={cn("relative size-full bg-oboya-blue-dark/10", className)}
    >
      {frame ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={frame} alt="" className="size-full object-cover" />
      ) : (
        <video
          src={`${src}${src.includes("#") ? "" : "#t=0.1"}`}
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

export function MediaField({
  label,
  value,
  onChange,
  optional = false,
  allowedTypes = DEFAULT_TYPES,
}: MediaFieldProps) {
  const types = allowedTypes.length ? allowedTypes : DEFAULT_TYPES;
  const videoOnly = types.length === 1 && types[0] === "video";
  const [mode, setMode] = useState<SourceMode>("url");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [knownName, setKnownName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queueMicrotask(() => setUrlDraft(value));
  }, [value]);

  const assets = useMemo(
    () =>
      getMediaAssets().filter((asset) =>
        types.includes(asset.type as MediaFieldAllowedType)
      ),
    [types]
  );

  const isVideoValue = Boolean(value) && (videoOnly || isVideoUrl(value));

  const displayName = useMemo(() => {
    if (!value) return null;
    const fromLibrary = assets.find((asset) => asset.url === value);
    if (fromLibrary?.name) return fromLibrary.name;
    if (knownName) return knownName;
    return fileNameFromUrl(value);
  }, [value, assets, knownName]);

  useEffect(() => {
    if (!value) {
      queueMicrotask(() => setKnownName(null));
      return;
    }
    const fromLibrary = assets.find((asset) => asset.url === value);
    if (fromLibrary?.name) {
      queueMicrotask(() => setKnownName(fromLibrary.name));
    }
  }, [value, assets]);

  const applyUpload = async (file: File) => {
    setUploading(true);
    try {
      const asset = await uploadMediaFile(file);
      saveMediaAsset(asset);
      setKnownName(asset.name || file.name);
      onChange(asset.url);
      setMode("upload");
      toast.success("Media uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-oboya-soft-white/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-sm font-medium">
          {label}
          {optional ? (
            <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
          ) : null}
        </Label>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => {
              setKnownName(null);
              onChange("");
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>

      {value ? (
        <div className="max-w-xs space-y-2">
          <div className="relative h-28 w-full overflow-hidden rounded-lg border border-border/60 bg-white">
            {isVideoValue ? (
              <VideoThumbnail src={value} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="size-full object-cover" />
            )}
          </div>
          {displayName ? (
            <p
              className="truncate font-body text-xs leading-5 text-oboya-blue-dark"
              title={displayName}
            >
              <span className="font-medium">
                {isVideoValue ? "Video" : "File"}:
              </span>{" "}
              <span className="text-muted-foreground">{displayName}</span>
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex h-28 max-w-xs items-center justify-center rounded-lg border border-dashed border-border bg-white text-xs text-muted-foreground">
          No {videoOnly ? "video" : "media"} selected
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={mode === "upload" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          disabled={uploading}
          onClick={() => {
            setMode("upload");
            fileRef.current?.click();
          }}
        >
          <Upload className="size-3.5" />
          {uploading ? "Uploading…" : "Upload from PC"}
        </Button>
        <Button
          type="button"
          variant={mode === "url" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setMode("url")}
        >
          <Link2 className="size-3.5" />
          Paste link
        </Button>
        <Button
          type="button"
          variant={mode === "library" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => {
            setMode("library");
            setLibraryOpen(true);
          }}
        >
          {videoOnly ? (
            <Film className="size-3.5" />
          ) : (
            <ImageIcon className="size-3.5" />
          )}
          Media library
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={acceptFor(types)}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void applyUpload(file);
          e.target.value = "";
        }}
      />

      {mode === "url" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {videoOnly ? "Video URL" : "Media URL"}
            </Label>
            <Input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://… or /assets/…"
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
            onClick={() => {
              const next = urlDraft.trim();
              setKnownName(next ? fileNameFromUrl(next) : null);
              onChange(next);
            }}
          >
            Apply URL
          </Button>
        </div>
      )}

      {libraryOpen && (
        <MediaLibraryDialog
          items={assets.map((a) => ({
            id: a.id,
            name: a.name,
            url: a.url,
            type: a.type,
          }))}
          selected={value}
          onClose={() => setLibraryOpen(false)}
          onSelect={(url, name) => {
            setKnownName(name);
            onChange(url);
            setLibraryOpen(false);
          }}
        />
      )}
    </div>
  );
}

/** @deprecated Prefer MediaField — kept for existing image-only editors */
export function ImageField(props: Omit<MediaFieldProps, "allowedTypes">) {
  return <MediaField {...props} allowedTypes={["image"]} />;
}

export function MediaLibraryDialog({
  items,
  selected,
  onSelect,
  onClose,
}: {
  items: MediaLibraryItem[];
  selected?: string;
  onSelect: (url: string, name: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-oboya-blue-dark/40 backdrop-blur-[2px]"
        aria-label="Close media library"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-label="Media library"
        className="relative z-10 flex max-h-[min(80vh,640px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-oboya-blue-dark">
              Media library
            </h3>
            <p className="text-xs text-muted-foreground">
              Choose a file to use in this field
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching media yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((asset) => {
                const active = selected === asset.url;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => onSelect(asset.url, asset.name)}
                    className={cn(
                      "overflow-hidden rounded-xl border bg-oboya-soft-white text-left transition-shadow hover:shadow-md",
                      active
                        ? "border-oboya-green ring-2 ring-oboya-green/40"
                        : "border-border/60"
                    )}
                  >
                    <div className="relative aspect-video bg-muted">
                      {asset.type === "video" ? (
                        <VideoThumbnail src={asset.url} />
                      ) : (
                        <Image
                          src={asset.url}
                          alt={asset.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <p className="truncate px-2 py-1.5 text-[11px] text-muted-foreground">
                      {asset.name}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
