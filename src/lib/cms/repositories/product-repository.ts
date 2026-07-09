import type { ShopProduct } from "@/lib/shop/types";
import type { CmsStatus, LocalizedString, SeoFields } from "@/lib/cms/types";
import productsData from "@/../data/shop/products.json";

export interface CmsProduct extends ShopProduct {
  name: LocalizedString;
  shortDescription: LocalizedString;
  description: LocalizedString;
  status: CmsStatus;
  seo: SeoFields;
}

let productsCache: CmsProduct[] | null = null;

function seedProducts(): CmsProduct[] {
  return (productsData as ShopProduct[]).map((p) => ({
    ...p,
    name: {
      en: p.id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      "pt-BR": p.id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      es: p.id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      "zh-CN": p.id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    },
    shortDescription: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
    description: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
    status: "published" as CmsStatus,
    seo: {
      title: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
      description: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
    },
  }));
}

export function getCmsProducts(): CmsProduct[] {
  if (!productsCache) productsCache = seedProducts();
  return productsCache;
}

export function getCmsProductById(id: string): CmsProduct | undefined {
  return getCmsProducts().find((p) => p.id === id);
}

export function saveCmsProduct(product: CmsProduct): CmsProduct {
  const products = getCmsProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) products[idx] = product;
  else products.push(product);
  productsCache = products;
  return product;
}

export function deleteCmsProduct(id: string): boolean {
  const products = getCmsProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  products.splice(idx, 1);
  productsCache = products;
  return true;
}

export function duplicateCmsProduct(id: string): CmsProduct | null {
  const original = getCmsProductById(id);
  if (!original) return null;
  const copy: CmsProduct = {
    ...JSON.parse(JSON.stringify(original)),
    id: `${original.id}-copy-${Date.now()}`,
    sku: `${original.sku}-COPY`,
    status: "draft",
  };
  return saveCmsProduct(copy);
}
