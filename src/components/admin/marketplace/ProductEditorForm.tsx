"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import { LocaleFieldTabs } from "@/components/admin/forms/LocaleFieldTabs";
import {
  MediaLibraryDialog,
  type MediaLibraryImage,
} from "@/components/admin/media/ImageField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMediaAssets, saveMediaAsset } from "@/lib/cms/repositories/media-repository";
import { uploadMediaFile } from "@/lib/cms/client/upload-media";
import { FOLDER_ECOVASO_PRODUCTS } from "@/lib/cms/media-folder-ids";
import { getShopCatalog } from "@/lib/shop/catalog";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsLocale, CmsStatus } from "@/lib/cms/types";
import { toast } from "sonner";

interface ProductEditorFormProps {
  product: CmsProduct;
  onChange: (next: CmsProduct) => void;
}

export function createEmptyCmsProduct(seed?: {
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
}): CmsProduct {
  return {
    id: `product-${Date.now()}`,
    sku: "",
    moq: 1,
    brandId: seed?.brandId ?? "",
    categoryId: seed?.categoryId ?? "",
    subcategoryId: seed?.subcategoryId ?? "",
    images: [""],
    tags: [],
    availability: {},
    enabledCountries: {},
    prices: {},
    application: [],
    cultures: [],
    certifications: [],
    countryOfOrigin: "",
    stockStatus: "in_stock",
    stockQuantity: null,
    unlimitedStock: true,
    specs: [],
    documents: [],
    relatedProductIds: [],
    name: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
    shortDescription: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
    description: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
    status: "draft",
    seo: {
      title: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
      description: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
    },
    deletedAt: null,
    purgeAt: null,
  };
}

export function ProductEditorForm({ product, onChange }: ProductEditorFormProps) {
  const [locale, setLocale] = useState<CmsLocale>("pt-BR");
  const [newTag, setNewTag] = useState("");
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const [uploadTargetIndex, setUploadTargetIndex] = useState<number | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryTargetIndex, setLibraryTargetIndex] = useState<number | null>(null);
  const catalog = getShopCatalog();
  const mediaLibraryImages = useMemo<MediaLibraryImage[]>(
    () =>
      getMediaAssets()
        .filter((asset) => asset.type === "image")
        .map((asset) => ({
          id: asset.id,
          name: asset.name,
          url: asset.url,
          type: asset.type,
        })),
    []
  );

  const selectedCategory = useMemo(
    () => catalog.categories.find((c) => c.id === product.categoryId),
    [catalog.categories, product.categoryId]
  );
  const currencies = useMemo(() => {
    const set = new Set<string>();
    catalog.countries.forEach((country) => {
      country.currencies.forEach((currency) => set.add(currency));
      set.add(country.defaultCurrency);
    });
    Object.keys(product.prices ?? {}).forEach((currency) => set.add(currency));
    return Array.from(set).sort();
  }, [catalog.countries, product.prices]);

  const update = (patch: Partial<CmsProduct>) => onChange({ ...product, ...patch });

  const updateLocalized = (
    key: "name" | "shortDescription" | "description",
    value: string
  ) => {
    onChange({
      ...product,
      [key]: { ...product[key], [locale]: value },
    });
  };

  const updateSeoLocalized = (key: "title" | "description", value: string) => {
    onChange({
      ...product,
      seo: {
        ...product.seo,
        [key]: { ...product.seo[key], [locale]: value },
      },
    });
  };

  const setImageAt = (index: number, value: string) => {
    const next = [...product.images];
    next[index] = value;
    update({ images: next });
  };

  const addImage = () => update({ images: [...product.images, ""] });
  const removeImage = (index: number) =>
    update({ images: product.images.filter((_, i) => i !== index) });
  const reorderImage = (fromIndex: number, toIndex: number) => {
    const clampedTo = Math.max(0, Math.min(toIndex, product.images.length - 1));
    if (fromIndex === clampedTo) return;
    const next = [...product.images];
    const [item] = next.splice(fromIndex, 1);
    next.splice(clampedTo, 0, item);
    update({ images: next });
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

  const setCurrencyPrice = (currency: string, value: string) => {
    const nextPrices = { ...product.prices };
    if (value.trim() === "") {
      delete nextPrices[currency];
    } else {
      nextPrices[currency] = Number(value);
    }
    update({ prices: nextPrices });
  };

  const toggleCountry = (countryCode: string, enabled: boolean) => {
    const next = { ...(product.enabledCountries ?? {}) };
    next[countryCode] = enabled;
    update({ enabledCountries: next, availability: { ...next } });
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (!tag || product.tags.includes(tag)) return;
    update({ tags: [...product.tags, tag] });
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    update({ tags: product.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label>SKU</Label>
          <Input value={product.sku} onChange={(e) => update({ sku: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <select
            value={product.status}
            onChange={(e) => update({ status: e.target.value as CmsStatus })}
            className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>MOQ</Label>
          <Input
            type="number"
            min={1}
            value={product.moq}
            onChange={(e) => update({ moq: Math.max(1, Number(e.target.value) || 1) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Stock Status</Label>
          <select
            value={product.stockStatus}
            onChange={(e) => update({ stockStatus: e.target.value as CmsProduct["stockStatus"] })}
            className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
          >
            <option value="in_stock">In stock</option>
            <option value="limited">Limited</option>
            <option value="on_request">On request</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <select
            value={product.categoryId}
            onChange={(e) => {
              const categoryId = e.target.value;
              const category = catalog.categories.find((c) => c.id === categoryId);
              update({
                categoryId,
                subcategoryId: category?.subcategories[0]?.id ?? "",
              });
            }}
            className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
          >
            {catalog.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Subcategory</Label>
          <select
            value={product.subcategoryId}
            onChange={(e) => update({ subcategoryId: e.target.value })}
            className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
          >
            {(selectedCategory?.subcategories ?? []).map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Brand</Label>
          <select
            value={product.brandId}
            onChange={(e) => update({ brandId: e.target.value })}
            className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
          >
            {catalog.brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button type="button" onClick={() => removeTag(tag)}>
                <Trash2 className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="new tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add tag
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Images (first = main image)</Label>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={addImage}>
              <Plus className="mr-1 size-3.5" /> Add image
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const nextIndex = product.images.length;
                addImage();
                setUploadTargetIndex(nextIndex);
                requestAnimationFrame(() => imageUploadRef.current?.click());
              }}
            >
              <Upload className="mr-1 size-3.5" /> Upload from PC
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const nextIndex = product.images.length;
                addImage();
                setLibraryTargetIndex(nextIndex);
                setLibraryOpen(true);
              }}
            >
              <ImageIcon className="mr-1 size-3.5" /> Media library
            </Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {product.images.map((image, index) => (
            <div
              key={`image-preview-${index}`}
              className="overflow-hidden rounded-lg border border-border/60 bg-muted/20"
            >
              <div className="relative aspect-square bg-muted/30">
                {image ? (
                  <Image src={image} alt={`Product image ${index}`} fill unoptimized className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    sem imagem
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-medium">{index === 0 ? "Main (0)" : `Image ${index}`}</span>
                <span className="text-[11px] text-muted-foreground">posição {index}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {product.images.map((image, index) => (
            <div key={`image-${index}`} className="flex gap-2">
              <select
                value={index}
                onChange={(e) => reorderImage(index, Number(e.target.value))}
                className="h-9 w-20 rounded-lg border border-input px-2.5 text-sm"
                aria-label={`Image order ${index}`}
              >
                {product.images.map((_, orderIndex) => (
                  <option key={`order-${index}-${orderIndex}`} value={orderIndex}>
                    {orderIndex}
                  </option>
                ))}
              </select>
              <Input
                value={image}
                placeholder="https://..."
                onChange={(e) => setImageAt(index, e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadTargetIndex(index);
                  imageUploadRef.current?.click();
                }}
              >
                <Upload className="mr-1 size-3.5" /> Upload
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLibraryTargetIndex(index);
                  setLibraryOpen(true);
                }}
              >
                <ImageIcon className="mr-1 size-3.5" /> Library
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => removeImage(index)}
                disabled={product.images.length <= 1}
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
              libraryTargetIndex !== null ? (product.images[libraryTargetIndex] ?? "") : undefined
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

      <div className="space-y-2">
        <Label>Prices per currency</Label>
        <p className="text-xs text-muted-foreground">
          Price equal to 0 or empty means product is hidden in that currency.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {currencies.map((currency) => (
            <div key={currency} className="space-y-1.5">
              <Label>{currency}</Label>
              <Input
                type="number"
                min={0}
                value={product.prices[currency] ?? ""}
                onChange={(e) => setCurrencyPrice(currency, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            id="unlimited-stock"
            type="checkbox"
            checked={product.unlimitedStock}
            onChange={(e) => update({ unlimitedStock: e.target.checked })}
          />
          <Label htmlFor="unlimited-stock">Unlimited stock</Label>
        </div>
        {!product.unlimitedStock && (
          <div className="space-y-1.5">
            <Label>Stock quantity</Label>
            <Input
              type="number"
              min={0}
              value={product.stockQuantity ?? 0}
              onChange={(e) =>
                update({ stockQuantity: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Available countries</Label>
        <p className="text-xs text-muted-foreground">
          New products should start disabled in all countries.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.countries.map((country) => {
            const enabled = Boolean(
              (product.enabledCountries ?? product.availability)[country.code]
            );
            return (
              <label
                key={country.code}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
              >
                <span className="text-sm">{country.name}</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => toggleCountry(country.code, e.target.checked)}
                />
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Translations</Label>
        <LocaleFieldTabs value={locale} onChange={setLocale}>
          {(loc) => (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name ({loc})</Label>
                <Input value={product.name[loc]} onChange={(e) => updateLocalized("name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Short description</Label>
                <Textarea
                  rows={2}
                  value={product.shortDescription[loc]}
                  onChange={(e) => updateLocalized("shortDescription", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={5}
                  value={product.description[loc]}
                  onChange={(e) => updateLocalized("description", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>SEO title</Label>
                <Input
                  value={product.seo.title[loc]}
                  onChange={(e) => updateSeoLocalized("title", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>SEO description</Label>
                <Textarea
                  rows={3}
                  value={product.seo.description[loc]}
                  onChange={(e) => updateSeoLocalized("description", e.target.value)}
                />
              </div>
            </div>
          )}
        </LocaleFieldTabs>
      </div>
    </div>
  );
}

