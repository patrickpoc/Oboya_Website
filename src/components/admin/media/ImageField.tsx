"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Film, ImageIcon, Link2, Upload } from "lucide-react";
import { VideoThumbnail } from "@/components/admin/media/VideoThumbnail";
import {
  MediaLibraryDialog,
  type MediaLibraryItem,
} from "@/components/admin/media/MediaLibraryDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMediaAssets, saveMediaAsset, replaceMediaAssetsCache } from "@/lib/cms/repositories/media-repository";
import { FOLDER_WEBSITE_FILES } from "@/lib/cms/media-folder-ids";
import { uploadMediaFile } from "@/lib/cms/client/upload-media";
import type { MediaAsset } from "@/lib/cms/types";

type SourceMode = "upload" | "url" | "library";
export type { MediaLibraryItem };
/** @deprecated Use MediaLibraryItem */
export type MediaLibraryImage = MediaLibraryItem;

export { MediaLibraryDialog };

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
  const [libraryTick, setLibraryTick] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queueMicrotask(() => setUrlDraft(value));
  }, [value]);

  const refreshLibrary = useCallback(async () => {
    try {
      const res = await fetch("/api/cms/media");
      if (!res.ok) return;
      const data = (await res.json()) as { assets?: MediaAsset[] };
      if (data.assets) {
        replaceMediaAssetsCache(data.assets);
        setLibraryTick((n) => n + 1);
      }
    } catch {
      // Keep local seed library.
    }
  }, []);

  const assets = useMemo(
    () =>
      getMediaAssets().filter((asset) =>
        types.includes(asset.type as MediaFieldAllowedType)
      ),
    // libraryTick forces recompute after remote sync mutates the module cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [types, libraryTick]
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
      const asset = await uploadMediaFile(file, {
        folder: FOLDER_WEBSITE_FILES,
      });
      saveMediaAsset(asset);
      setLibraryTick((n) => n + 1);
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
            void refreshLibrary();
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
            tags: a.tags,
            folder: a.folder,
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
