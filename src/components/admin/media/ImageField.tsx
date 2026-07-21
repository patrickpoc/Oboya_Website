"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Link2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getMediaAssets,
  saveMediaAsset,
} from "@/lib/cms/repositories/media-repository";
import { cn } from "@/lib/utils";

type ImageSourceMode = "upload" | "url" | "library";

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  optional?: boolean;
}

export function ImageField({
  label,
  value,
  onChange,
  optional = false,
}: ImageFieldProps) {
  const [mode, setMode] = useState<ImageSourceMode>("url");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlDraft(value);
  }, [value]);

  const images = useMemo(
    () => getMediaAssets().filter((asset) => asset.type === "image"),
    [libraryOpen]
  );

  const applyUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      if (!dataUrl) return;
      const asset = saveMediaAsset({
        id: `media-upload-${Date.now()}`,
        name: file.name,
        url: dataUrl,
        type: "image",
        mimeType: file.type || "image/jpeg",
        size: file.size,
        folder: "uploads",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      onChange(asset.url);
      setMode("upload");
    };
    reader.readAsDataURL(file);
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="size-full object-cover" />
        </div>
      ) : (
        <div className="flex h-28 max-w-xs items-center justify-center rounded-lg border border-dashed border-border bg-white text-xs text-muted-foreground">
          No image selected
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={mode === "upload" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => {
            setMode("upload");
            fileRef.current?.click();
          }}
        >
          <Upload className="size-3.5" />
          Upload from PC
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
          <ImageIcon className="size-3.5" />
          Media library
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) applyUpload(file);
          e.target.value = "";
        }}
      />

      {mode === "url" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Image URL</Label>
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
          images={images}
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

function MediaLibraryDialog({
  images,
  selected,
  onSelect,
  onClose,
}: {
  images: { id: string; name: string; url: string }[];
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
              Choose an image to use in this field
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
          {images.length === 0 ? (
            <p className="text-sm text-muted-foreground">No images in the library yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((asset) => {
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
                      <Image
                        src={asset.url}
                        alt={asset.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
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
