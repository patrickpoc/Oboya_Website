"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import {
  MediaLibraryDialog,
  type MediaLibraryItem,
} from "@/components/admin/media/MediaLibraryDialog";
import { LocalizedFieldGrid } from "@/components/admin/marketplace/LocalizedFieldGrid";
import { RegistrationSection } from "@/components/admin/marketplace/RegistrationSection";
import { PRODUCT_EDITOR_SELECT_CLASS, PRODUCT_IMAGE_SECTION_DESCRIPTION } from "@/components/admin/marketplace/product-editor.constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { CmsLocale } from "@/lib/cms/types";
import type { MediaAsset } from "@/lib/cms/types";
import { toast } from "sonner";

interface ProductRegistrationCardProps {
  product: CmsProduct;
  currencies: string[];
  currenciesLoading?: boolean;
  onUpdate: (patch: Partial<CmsProduct>) => void;
}

export function ProductRegistrationCard({
  product,
  currencies,
  currenciesLoading = false,
  onUpdate,
}: ProductRegistrationCardProps) {
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const [uploadTargetIndex, setUploadTargetIndex] = useState<number | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryTargetIndex, setLibraryTargetIndex] = useState<number | null>(null);
  const [libraryTick, setLibraryTick] = useState(0);

  const refreshLibrary = async () => {
    try {
      const response = await fetch("/api/cms/media");
      if (!response.ok) return;
      const data = (await response.json()) as { assets?: MediaAsset[] };
      if (data.assets) {
        replaceMediaAssetsCache(data.assets);
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

  const setImageAt = (index: number, value: string) => {
    const next = [...product.images];
    next[index] = value;
    onUpdate({ images: next });
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

  const addImage = () => onUpdate({ images: [...product.images, ""] });
  const removeImage = (index: number) =>
    onUpdate({ images: product.images.filter((_, i) => i !== index) });

  const reorderImage = (fromIndex: number, toIndex: number) => {
    const clampedTo = Math.max(0, Math.min(toIndex, product.images.length - 1));
    if (fromIndex === clampedTo) return;
    const next = [...product.images];
    const [item] = next.splice(fromIndex, 1);
    next.splice(clampedTo, 0, item);
    onUpdate({ images: next });
  };

  const uploadImageAt = (index: number, file: File) => {
    void (async () => {
      try {
        const asset = await uploadMediaFile(file, { folder: FOLDER_ECOVASO_PRODUCTS });
        saveMediaAsset(asset);
        setImageAt(index, asset.url);
        toast.success("Image uploaded");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    })();
  };

  const setCurrencyPrice = (currency: string, value: string) => {
    const nextPrices = { ...product.prices };
    if (value.trim() === "") {
      delete nextPrices[currency];
    } else {
      nextPrices[currency] = Number(value);
    }
    onUpdate({ prices: nextPrices });
  };

  const updateName = (locale: CmsLocale, value: string) => {
    onUpdate({ name: { ...product.name, [locale]: value } });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Product registration</CardTitle>
        <CardDescription>Core product data from name through images.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <RegistrationSection
          title="Product name"
          description="Displayed on catalog cards and product pages."
          isFirst
        >
          <LocalizedFieldGrid
            label="Name"
            value={product.name}
            onChange={updateName}
            placeholder="e.g. Ecovaso Premium 15L"
          />
        </RegistrationSection>

        <RegistrationSection
          title="SKU & MOQ"
          description="Reference code and minimum order quantity."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="product-sku">SKU</Label>
              <Input
                id="product-sku"
                value={product.sku}
                onChange={(e) => onUpdate({ sku: e.target.value })}
                placeholder="e.g. SKU-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-moq">MOQ</Label>
              <Input
                id="product-moq"
                type="number"
                min={1}
                value={product.moq}
                onChange={(e) => onUpdate({ moq: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
          </div>
        </RegistrationSection>

        <RegistrationSection
          title="Price"
          description="Currencies configured in Marketplace → Currencies. Empty or 0 hides the product in that currency."
        >
          {currenciesLoading ? (
            <p className="text-sm text-muted-foreground">Loading currencies…</p>
          ) : currencies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No currencies configured.{" "}
              <Link
                href="/admin/marketplace/currencies"
                className="text-oboya-green underline-offset-2 hover:underline"
              >
                Add them in Currencies
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-3 rounded-lg bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {currencies.map((currency) => (
                <div key={currency} className="space-y-1.5">
                  <Label htmlFor={`price-${currency}`}>{currency}</Label>
                  <Input
                    id={`price-${currency}`}
                    type="number"
                    min={0}
                    value={product.prices[currency] ?? ""}
                    onChange={(e) => setCurrencyPrice(currency, e.target.value)}
                    placeholder="Hidden"
                  />
                </div>
              ))}
            </div>
          )}
        </RegistrationSection>

        <RegistrationSection title="Stock" description="Inventory signal shown to buyers.">
          <div className="grid gap-3 rounded-lg bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="product-stock-status">Stock status</Label>
              <select
                id="product-stock-status"
                value={product.stockStatus}
                onChange={(e) =>
                  onUpdate({ stockStatus: e.target.value as CmsProduct["stockStatus"] })
                }
                className={PRODUCT_EDITOR_SELECT_CLASS}
              >
                <option value="in_stock">In stock</option>
                <option value="limited">Limited</option>
                <option value="on_request">On request</option>
              </select>
            </div>

            <div className="flex items-end gap-2 pb-2">
              <input
                id="unlimited-stock"
                type="checkbox"
                className="size-4 rounded border-input"
                checked={product.unlimitedStock}
                onChange={(e) => onUpdate({ unlimitedStock: e.target.checked })}
              />
              <Label htmlFor="unlimited-stock">Unlimited stock</Label>
            </div>

            {!product.unlimitedStock && (
              <div className="space-y-1.5">
                <Label htmlFor="product-stock-quantity">Stock quantity</Label>
                <Input
                  id="product-stock-quantity"
                  type="number"
                  min={0}
                  value={product.stockQuantity ?? 0}
                  onChange={(e) =>
                    onUpdate({ stockQuantity: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </div>
            )}
          </div>
        </RegistrationSection>

        <RegistrationSection title="Images" description={PRODUCT_IMAGE_SECTION_DESCRIPTION}>
          <div className="space-y-4">
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

            <div className="space-y-2 rounded-lg bg-muted/30 p-4">
              {product.images.map((image, index) => (
                <div key={`image-${index}`} className="flex flex-wrap gap-2">
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
              ))}
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
            {libraryOpen && (
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
              />
            )}
          </div>
        </RegistrationSection>
      </CardContent>
    </Card>
  );
}
