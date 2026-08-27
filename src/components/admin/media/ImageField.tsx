"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Film, ImageIcon, Link2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMediaAssets } from "@/lib/cms/repositories/media-repository";
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

  const isVideoValue =
    Boolean(value) &&
    (/\.(mp4|webm)(\?|$)/i.test(value) || value.includes("video"));

  const applyUpload = async (file: File) => {
    setUploading(true);
    try {
      const mime = (file.type || "").toLowerCase();
      const isVideo = mime.startsWith("video/");
      const max = isVideo ? 50 * 1024 * 1024 : 8 * 1024 * 1024;
      if (file.size > max) {
        throw new Error(
          `File too large. Max ${isVideo ? "50MB" : "8MB"}.`
        );
      }

      // Prefer direct-to-Supabase when configured — Vercel cannot write public/uploads
      // and serverless request bodies cap around 4.5MB.
      const useDirect =
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        (isVideo || file.size > 3.5 * 1024 * 1024);

      let asset: MediaAsset | undefined;

      if (useDirect) {
        const signRes = await fetch("/api/cms/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sign",
            mimeType: mime,
            size: file.size,
            name: file.name,
          }),
        });
        const signed = (await signRes.json()) as {
          error?: string;
          id?: string;
          publicUrl?: string;
          signedUrl?: string;
          token?: string;
          kind?: MediaAsset["type"];
          mimeType?: string;
          originalName?: string;
        };
        if (!signRes.ok || !signed.signedUrl || !signed.id || !signed.publicUrl) {
          throw new Error(signed.error ?? "Could not start upload");
        }

        const putRes = await fetch(signed.signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": mime || "application/octet-stream",
          },
          body: file,
        });
        if (!putRes.ok) {
          const detail = await putRes.text().catch(() => "");
          throw new Error(
            detail ||
              "Storage upload failed. Confirm the cms-media bucket exists in Supabase."
          );
        }

        const completeRes = await fetch("/api/cms/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete",
            id: signed.id,
            url: signed.publicUrl,
            type: signed.kind ?? (isVideo ? "video" : "image"),
            mimeType: signed.mimeType ?? mime,
            size: file.size,
            name: signed.originalName ?? file.name,
          }),
        });
        const completed = (await completeRes.json()) as {
          error?: string;
          asset?: MediaAsset;
        };
        if (!completeRes.ok || !completed.asset) {
          throw new Error(completed.error ?? "Upload finalize failed");
        }
        asset = completed.asset;
      } else {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/cms/media", { method: "POST", body });
        const data = (await res.json()) as {
          error?: string;
          asset?: MediaAsset;
        };
        if (!res.ok || !data.asset) {
          throw new Error(data.error ?? "Upload failed");
        }
        asset = data.asset;
      }

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
            onClick={() => onChange("")}
          >
            Clear
          </Button>
        ) : null}
      </div>

      {value ? (
        <div className="relative h-28 w-full max-w-xs overflow-hidden rounded-lg border border-border/60 bg-white">
          {isVideoValue || videoOnly ? (
            <video
              src={value}
              className="size-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          )}
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
            onClick={() => onChange(urlDraft.trim())}
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
          onSelect={(url) => {
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
  onSelect: (url: string) => void;
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
                    onClick={() => onSelect(asset.url)}
                    className={cn(
                      "overflow-hidden rounded-xl border bg-oboya-soft-white text-left transition-shadow hover:shadow-md",
                      active
                        ? "border-oboya-green ring-2 ring-oboya-green/40"
                        : "border-border/60"
                    )}
                  >
                    <div className="relative aspect-video bg-muted">
                      {asset.type === "video" ? (
                        <video
                          src={asset.url}
                          className="absolute inset-0 size-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
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
