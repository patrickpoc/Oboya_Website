"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  MediaLibraryDialog,
  type MediaLibraryItem,
} from "@/components/admin/media/MediaLibraryDialog";
import { LocalizedFieldGrid } from "@/components/admin/marketplace/LocalizedFieldGrid";
import { ColorHexField } from "@/components/admin/marketplace/ColorHexField";
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
import type { CmsLocale, LocalizedString } from "@/lib/cms/types";
import type { ProductColorVariant } from "@/lib/shop/types";
import {
  createEmptyColorVariant,
  normalizeLocalizedColorName,
} from "@/lib/shop/color-variants";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface ProductColorVariantsCardProps {
  product: CmsProduct;
  currencies: string[];
  currenciesLoading?: boolean;
  onUpdate: (patch: Partial<CmsProduct>) => void;
}

function toLocalizedString(
  value: ReturnType<typeof normalizeLocalizedColorName>
): LocalizedString {
  return {
    en: value.en ?? "",
    "pt-BR": value["pt-BR"] ?? "",
    es: value.es ?? "",
    "zh-CN": value["zh-CN"] ?? "",
  };
}

export function ProductColorVariantsCard({
  product,
  currencies,
  currenciesLoading = false,
  onUpdate,
}: ProductColorVariantsCardProps) {
  const t = useTranslations("admin.products.editor");
  const tProducts = useTranslations("admin.products");
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const [uploadVariantId, setUploadVariantId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryVariantId, setLibraryVariantId] = useState<string | null>(null);
  const [libraryTick, setLibraryTick] = useState(0);

  const variants = product.colorVariants ?? [];
  const defaultColorName = toLocalizedString(
    normalizeLocalizedColorName(product.defaultColorName)
  );

  const refreshLibrary = async () => {
    try {
      const response = await fetch("/api/cms/media?limit=80&offset=0");
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

  const setVariants = (next: ProductColorVariant[]) => {
    onUpdate({
      colorVariants: next.map((variant, index) => ({
        ...variant,
        sortOrder: index,
      })),
    });
  };

  const updateVariant = (
    id: string,
    patch: Partial<ProductColorVariant>
  ) => {
    setVariants(
      variants.map((variant) =>
        variant.id === id ? { ...variant, ...patch } : variant
      )
    );
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      createEmptyColorVariant(variants.length, currencies),
    ]);
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter((variant) => variant.id !== id));
  };

  const moveVariant = (id: string, direction: -1 | 1) => {
    const index = variants.findIndex((variant) => variant.id === id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= variants.length) return;
    const next = [...variants];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setVariants(next);
  };

  const openImageUpload = (variantId: string) => {
    setUploadVariantId(variantId);
    requestAnimationFrame(() => imageUploadRef.current?.click());
  };

  const openMediaLibrary = (variantId: string) => {
    setLibraryVariantId(variantId);
    void refreshLibrary().then(() => setLibraryOpen(true));
  };

  const uploadImage = (variantId: string, file: File) => {
    void (async () => {
      try {
        const asset = await uploadMediaFile(file, {
          folder: FOLDER_ECOVASO_PRODUCTS,
        });
        saveMediaAsset(asset);
        updateVariant(variantId, { image: asset.url });
        toast.success(t("variantImageUploaded"));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tProducts("uploadFailed"));
      }
    })();
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>{t("colorsTitle")}</CardTitle>
        <CardDescription>{t("colorsDescription")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <input
          ref={imageUploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            const variantId = uploadVariantId;
            event.target.value = "";
            setUploadVariantId(null);
            if (file && variantId) uploadImage(variantId, file);
          }}
        />

        <div className="rounded-xl border border-oboya-blue/20 bg-oboya-blue/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="size-8 shrink-0 rounded-full border border-border/70 shadow-sm"
              style={{
                backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(product.defaultColor)
                  ? product.defaultColor
                  : "#888888",
              }}
              aria-hidden
            />
            <div>
              <p className="text-sm font-semibold text-oboya-blue-dark">
                {t("defaultProductColor")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("defaultProductColorHint")}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="default-color-hex">{t("swatchColor")}</Label>
              <ColorHexField
                id="default-color-hex"
                value={product.defaultColor ?? ""}
                onChange={(next) => onUpdate({ defaultColor: next })}
                fallback="#000000"
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="mt-4">
            <LocalizedFieldGrid
              label={t("defaultColorName")}
              value={defaultColorName}
              onChange={(locale: CmsLocale, nextValue: string) => {
                const next = { ...defaultColorName, [locale]: nextValue };
                onUpdate({
                  defaultColorName: next,
                });
              }}
              placeholder={t("defaultColorNamePlaceholder")}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {t("defaultColorSku", { sku: product.sku || "—" })}
            </p>
          </div>
        </div>

        {variants.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noAdditionalColors")}
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium text-oboya-blue-dark">
              {t("additionalColors")}
            </p>
            {variants.map((variant, index) => {
              const nameI18n = toLocalizedString(
                normalizeLocalizedColorName(variant.nameI18n, variant.name)
              );
              return (
                <div
                  key={variant.id}
                  className="rounded-xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex items-center gap-2 pt-1">
                      <span
                        className="size-8 shrink-0 rounded-full border border-border/70 shadow-sm"
                        style={{ backgroundColor: variant.color || "#888" }}
                        aria-hidden
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={index === 0}
                          onClick={() => moveVariant(variant.id, -1)}
                          aria-label={t("moveColorUp")}
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={index === variants.length - 1}
                          onClick={() => moveVariant(variant.id, 1)}
                          aria-label={t("moveColorDown")}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label htmlFor={`color-sku-${variant.id}`}>{t("sku")}</Label>
                            <Input
                              id={`color-sku-${variant.id}`}
                              value={variant.sku ?? ""}
                              onChange={(event) =>
                                updateVariant(variant.id, {
                                  sku: event.target.value,
                                })
                              }
                              onBlur={() => {
                                const trimmed = (variant.sku ?? "").trim();
                                if (trimmed && trimmed !== variant.id) {
                                  updateVariant(variant.id, { id: trimmed, sku: trimmed });
                                }
                              }}
                              placeholder={`${product.sku || "SKU"}-COLOR`}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`color-moq-${variant.id}`}>{t("moq")}</Label>
                            <Input
                              id={`color-moq-${variant.id}`}
                              type="number"
                              min={1}
                              step={1}
                              value={variant.moq ?? 1}
                              onChange={(event) =>
                                updateVariant(variant.id, {
                                  moq: Math.max(1, Math.floor(Number(event.target.value) || 1)),
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`color-hex-${variant.id}`}>
                            {t("swatchColor")}
                          </Label>
                          <ColorHexField
                            id={`color-hex-${variant.id}`}
                            value={variant.color}
                            onChange={(next) =>
                              updateVariant(variant.id, { color: next })
                            }
                            fallback="#4DAF4E"
                            placeholder="#4DAF4E"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeVariant(variant.id)}
                      aria-label={t("removeColor", { name: variant.name || t("colorFallback") })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-4">
                    <LocalizedFieldGrid
                      label={t("colorName")}
                      value={nameI18n}
                      onChange={(locale: CmsLocale, nextValue: string) => {
                        const next = { ...nameI18n, [locale]: nextValue };
                        updateVariant(variant.id, {
                          nameI18n: next,
                          name: next.en || nextValue,
                        });
                      }}
                      placeholder={t("colorNamePlaceholder")}
                    />
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[11rem_1fr]">
                    <div className="space-y-2">
                      <Label>{t("productImage")}</Label>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border/60 bg-white">
                        {variant.image ? (
                          <Image
                            src={variant.image}
                            alt={variant.name || t("colorVariantAlt")}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="176px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <ImageIcon className="size-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openImageUpload(variant.id)}
                        >
                          <Upload className="size-3.5" />
                          {tProducts("upload")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openMediaLibrary(variant.id)}
                        >
                          {tProducts("library")}
                        </Button>
                      </div>
                      <Input
                        value={variant.image}
                        onChange={(event) =>
                          updateVariant(variant.id, {
                            image: event.target.value,
                          })
                        }
                        placeholder={t("imageUrl")}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("prices")}</Label>
                      {currenciesLoading ? (
                        <p className="text-sm text-muted-foreground">
                          {t("loadingCurrencies")}
                        </p>
                      ) : currencies.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {t("configureCurrencies")}
                        </p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {currencies.map((currency) => (
                            <div key={currency} className="space-y-1.5">
                              <Label
                                htmlFor={`variant-price-${variant.id}-${currency}`}
                              >
                                {currency}
                              </Label>
                              <Input
                                id={`variant-price-${variant.id}-${currency}`}
                                type="number"
                                min={0}
                                step="0.001"
                                value={variant.prices[currency] ?? ""}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  const nextPrices = { ...variant.prices };
                                  if (value.trim() === "") {
                                    delete nextPrices[currency];
                                  } else {
                                    nextPrices[currency] = Number(value);
                                  }
                                  updateVariant(variant.id, {
                                    prices: nextPrices,
                                  });
                                }}
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t("variantPriceFallback")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button type="button" variant="outline" onClick={addVariant}>
          <Plus className="size-4" />
          {t("addColor")}
        </Button>

        {libraryOpen ? (
          <MediaLibraryDialog
            items={mediaLibraryImages}
            selected={
              libraryVariantId
                ? variants.find((variant) => variant.id === libraryVariantId)
                    ?.image
                : undefined
            }
            onClose={() => {
              setLibraryOpen(false);
              setLibraryVariantId(null);
            }}
            onSelect={(url) => {
              if (libraryVariantId) {
                updateVariant(libraryVariantId, { image: url });
              }
              setLibraryOpen(false);
              setLibraryVariantId(null);
            }}
            defaultFolderId={FOLDER_ECOVASO_PRODUCTS}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
