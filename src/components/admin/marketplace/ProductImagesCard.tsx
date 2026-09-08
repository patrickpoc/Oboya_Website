"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import {
  MediaLibraryDialog,
  type MediaLibraryItem,
} from "@/components/admin/media/MediaLibraryDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getMediaAssets,
  getMediaFolders,
  replaceMediaAssetsCache,
  saveMediaAsset,
} from "@/lib/cms/repositories/media-repository";
import { uploadMediaFile } from "@/lib/cms/client/upload-media";
import { FOLDER_ECOVASO_PRODUCTS } from "@/lib/cms/media-folder-ids";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import {
  DEFAULT_COLOR_VARIANT_ID,
  getVariantDisplayName,
  hasColorVariants,
  normalizeImageColorIds,
  sortedColorVariants,
} from "@/lib/shop/color-variants";
import { PRODUCT_IMAGE_SECTION_DESCRIPTION } from "@/components/admin/marketplace/product-editor.constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductImagesCardProps {
  product: CmsProduct;
  onUpdate: (patch: Partial<CmsProduct>) => void;
}

export function ProductImagesCard({ product, onUpdate }: ProductImagesCardProps) {
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const [uploadTargetIndex, setUploadTargetIndex] = useState<number | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryTargetIndex, setLibraryTargetIndex] = useState<number | null>(null);
  const [libraryTick, setLibraryTick] = useState(0);

  const imageColorIds = useMemo(
    () => normalizeImageColorIds(product.imageColorIds, product.images.length),
    [product.imageColorIds, product.images.length]
  );

  const colorOptions = useMemo(() => {
    if (!hasColorVariants(product)) return [];
    const defaultName =
      getVariantDisplayName(
        {
          name: product.defaultColorName?.en || "Default",
          nameI18n: product.defaultColorName,
        },
        "en"
      ) || "Default";
    return [
      {
        id: DEFAULT_COLOR_VARIANT_ID,
        label: `${defaultName} (default)`,
        color: product.defaultColor || "#888888",
      },
      ...sortedColorVariants(product).map((variant) => ({
        id: variant.id,
        label: getVariantDisplayName(variant, "en") || variant.name || variant.sku,
        color: variant.color,
      })),
    ];
  }, [product]);

  const refreshLibrary = async () => {
    try {
      const response = await fetch("/api/cms/media");
      if (!response.ok) return;
      const data = (await response.json()) as { assets?: { id: string }[] };
      if (data.assets) {
        replaceMediaAssetsCache(
          data.assets as Parameters<typeof replaceMediaAssetsCache>[0]
        );
        setLibraryTick((n) => n + 1);
      }
    } catch {
      // Keep local cache.
    }
  };

  const folderNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const folder of getMediaFolders()) {
      map.set(folder.id, folder.name);
    }
    return map;
  }, []);

  const mediaLibraryImages = useMemo<MediaLibraryItem[]>(
    () =>
      getMediaAssets()
        .filter((asset) => asset.type === "image")
        .map((asset) => ({
          id: asset.id,
          name: asset.name,
          url: asset.url,
          type: asset.type,
          tags: asset.tags,
          folder: asset.folder,
          folderName: folderNameById.get(asset.folder),
        })),
    [folderNameById, libraryTick]
  );

  const filledImages = useMemo(
    () => product.images.filter((image) => image.trim().length > 0),
    [product.images]
  );

  const syncImages = (nextImages: string[], nextColorIds?: string[][]) => {
    const colors =
      nextColorIds ??
      normalizeImageColorIds(imageColorIds, nextImages.length);
    onUpdate({
      images: nextImages,
      imageColorIds: normalizeImageColorIds(colors, nextImages.length),
    });
  };

  const setImageAt = (index: number, value: string) => {
    const next = [...product.images];
    next[index] = value;
    syncImages(next, imageColorIds);
  };

  const setColorIdsAt = (index: number, colorId: string, enabled: boolean) => {
    const next = imageColorIds.map((ids) => [...ids]);
    const current = new Set(next[index] ?? []);
    if (enabled) current.add(colorId);
    else current.delete(colorId);
    next[index] = Array.from(current);
    syncImages(product.images, next);
  };

  const findEmptyImageSlotIndex = () =>
    product.images.findIndex((image) => !image.trim());

  const openMediaLibrary = (slotIndex?: number) => {
    const targetIndex = slotIndex ?? findEmptyImageSlotIndex();
    if (targetIndex < 0) {
      toast.error("Add an image slot before choosing from the library.");
      return;
    }
    setLibraryTargetIndex(targetIndex);
    void refreshLibrary().then(() => setLibraryOpen(true));
  };

  const addImage = () => {
    syncImages([...product.images, ""], [...imageColorIds, []]);
  };

  const openImageUpload = (slotIndex?: number) => {
    if (slotIndex !== undefined) {
      setUploadTargetIndex(slotIndex);
      requestAnimationFrame(() => imageUploadRef.current?.click());
      return;
    }

    const emptyIndex = findEmptyImageSlotIndex();
    if (emptyIndex >= 0) {
      setUploadTargetIndex(emptyIndex);
    } else {
      addImage();
      setUploadTargetIndex(product.images.length);
    }
    requestAnimationFrame(() => imageUploadRef.current?.click());
  };

  const removeImage = (index: number) => {
    if (product.images.length <= 1) return;
    syncImages(
      product.images.filter((_, i) => i !== index),
      imageColorIds.filter((_, i) => i !== index)
    );
  };

  const reorderImage = (fromIndex: number, toIndex: number) => {
    const clampedTo = Math.max(0, Math.min(toIndex, product.images.length - 1));
    if (fromIndex === clampedTo) return;
    const nextImages = [...product.images];
    const nextColors = imageColorIds.map((ids) => [...ids]);
    const [image] = nextImages.splice(fromIndex, 1);
    const [colors] = nextColors.splice(fromIndex, 1);
    nextImages.splice(clampedTo, 0, image);
    nextColors.splice(clampedTo, 0, colors);
    syncImages(nextImages, nextColors);
  };

  const uploadImageAt = (index: number, file: File) => {
    void (async () => {
      try {
        const asset = await uploadMediaFile(file, {
          folder: FOLDER_ECOVASO_PRODUCTS,
        });
        saveMediaAsset(asset);
        setImageAt(index, asset.url);
        toast.success("Image uploaded");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    })();
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Images</CardTitle>
        <CardDescription>
          {PRODUCT_IMAGE_SECTION_DESCRIPTION}
          {colorOptions.length > 0
            ? " Assign each slot to one or more colors so the shop carousel changes with the selected swatch."
            : " Add color variations first to assign images per color."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={addImage}>
            <Plus className="mr-1 size-3.5" /> Add slot
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => openImageUpload()}
          >
            <Upload className="mr-1 size-3.5" /> Upload
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => openMediaLibrary()}
          >
            <ImageIcon className="mr-1 size-3.5" /> Library
          </Button>
        </div>

        {filledImages.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {filledImages.length} image{filledImages.length === 1 ? "" : "s"} · Main:{" "}
            {product.images[0]?.trim() ? "set" : "missing"}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {product.images.map((image, index) => (
            <div
              key={`image-preview-${index}`}
              className="overflow-hidden rounded-lg border border-border/60 bg-muted/20"
            >
              <div className="relative aspect-square bg-muted/30">
                {image ? (
                  <Image
                    src={image}
                    alt={`Product image ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="px-2 py-1.5 text-xs font-medium">
                {index === 0 ? "Main image" : `Image ${index + 1}`}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-lg bg-muted/30 p-4">
          {product.images.map((image, index) => {
            const assigned = new Set(imageColorIds[index] ?? []);
            return (
              <div
                key={`image-${index}`}
                className="space-y-2 rounded-lg border border-border/50 bg-white/70 p-3"
              >
                <div className="flex flex-wrap gap-2">
                  <select
                    value={index}
                    onChange={(e) => reorderImage(index, Number(e.target.value))}
                    className="h-9 w-28 rounded-lg border border-input bg-background px-2.5 text-sm"
                    aria-label={`Position for image ${index + 1}`}
                  >
                    {product.images.map((_, orderIndex) => (
                      <option key={`order-${index}-${orderIndex}`} value={orderIndex}>
                        Position {orderIndex}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="min-w-[12rem] flex-1"
                    value={image}
                    placeholder="https://..."
                    onChange={(e) => setImageAt(index, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openImageUpload(index)}
                  >
                    <Upload className="mr-1 size-3.5" /> Upload
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openMediaLibrary(index)}
                  >
                    <ImageIcon className="mr-1 size-3.5" /> Library
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => removeImage(index)}
                    disabled={product.images.length <= 1}
                    aria-label={`Remove image slot ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {colorOptions.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Show for colors
                      {assigned.size === 0
                        ? " (untagged — shared only if no other slots are tagged)"
                        : ""}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((option) => {
                        const checked = assigned.has(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() =>
                              setColorIdsAt(index, option.id, !checked)
                            }
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                              checked
                                ? "border-oboya-blue bg-oboya-blue/10 text-oboya-blue-dark"
                                : "border-border text-muted-foreground hover:border-oboya-blue/40"
                            )}
                            aria-pressed={checked}
                          >
                            <span
                              className="size-3 rounded-full border border-black/10"
                              style={{ backgroundColor: option.color }}
                              aria-hidden
                            />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <input
          ref={imageUploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && uploadTargetIndex !== null) {
              uploadImageAt(uploadTargetIndex, file);
            }
            e.target.value = "";
            setUploadTargetIndex(null);
          }}
        />
        {libraryOpen ? (
          <MediaLibraryDialog
            items={mediaLibraryImages}
            selected={
              libraryTargetIndex !== null
                ? (product.images[libraryTargetIndex] ?? "")
                : undefined
            }
            onClose={() => {
              setLibraryOpen(false);
              setLibraryTargetIndex(null);
            }}
            onSelect={(url) => {
              if (libraryTargetIndex !== null) {
                setImageAt(libraryTargetIndex, url);
              }
              setLibraryOpen(false);
              setLibraryTargetIndex(null);
            }}
            defaultFolderId={FOLDER_ECOVASO_PRODUCTS}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
