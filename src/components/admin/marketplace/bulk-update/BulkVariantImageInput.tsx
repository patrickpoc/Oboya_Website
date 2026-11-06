"use client";

import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MediaLibraryDialog } from "@/components/admin/media/MediaLibraryDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getMediaAssets,
  replaceMediaAssetsCache,
} from "@/lib/cms/repositories/media-repository";
import type { MediaAsset } from "@/lib/cms/types";

/** Compact image cell: paste a link or pick from the media library. */
export function BulkVariantImageInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const t = useTranslations("admin.products.bulk");
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  const openLibrary = async () => {
    setOpen(true);
    try {
      const res = await fetch("/api/cms/media?limit=80&offset=0");
      if (!res.ok) return;
      const data = (await res.json()) as { assets?: MediaAsset[] };
      if (data.assets) {
        replaceMediaAssetsCache(data.assets);
        setTick((n) => n + 1);
      }
    } catch {
      // Keep the cached library.
    }
  };

  // `tick` re-reads the module cache after the remote sync above.
  const items = getMediaAssets()
    .filter((asset) => asset.type === "image")
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      url: asset.url,
      type: asset.type,
      tags: asset.tags,
      folder: asset.folder,
    }));

  return (
    <div className="flex min-w-[14rem] items-center gap-1.5" data-library-tick={tick}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("imageUrlPlaceholder")}
        className="h-9 text-sm"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 shrink-0"
        aria-label={t("openMediaLibrary")}
        title={t("openMediaLibrary")}
        onClick={() => void openLibrary()}
      >
        <ImageIcon className="size-4" />
      </Button>
      {open && (
        <MediaLibraryDialog
          items={items}
          selected={value}
          onClose={() => setOpen(false)}
          onSelect={(url) => {
            onChange(url);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
