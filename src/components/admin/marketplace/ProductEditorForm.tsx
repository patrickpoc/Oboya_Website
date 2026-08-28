"use client";

import { useAdminMarketplaceCatalog } from "@/hooks/use-admin-marketplace-catalog";
import { ProductMarketsCard } from "@/components/admin/marketplace/ProductMarketsCard";
import { ProductPublicationCard } from "@/components/admin/marketplace/ProductPublicationCard";
import { ProductRegistrationCard } from "@/components/admin/marketplace/ProductRegistrationCard";
import { ProductSeoCard } from "@/components/admin/marketplace/ProductSeoCard";
import { ProductTaxonomyCard } from "@/components/admin/marketplace/ProductTaxonomyCard";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

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
  const { catalog, currencies, loading: catalogLoading } = useAdminMarketplaceCatalog();

  const update = (patch: Partial<CmsProduct>) => onChange({ ...product, ...patch });

  return (
    <div className="space-y-6">
      <ProductRegistrationCard
        product={product}
        currencies={currencies}
        currenciesLoading={catalogLoading}
        onUpdate={update}
      />

      <ProductTaxonomyCard
        product={product}
        categories={catalog.categories}
        brands={catalog.brands}
        filterOptions={catalog.filterOptions}
        loading={catalogLoading}
        onUpdate={update}
      />

      <ProductMarketsCard
        product={product}
        countries={catalog.countries}
        onUpdate={update}
      />

      <ProductSeoCard product={product} onUpdate={update} />

      <ProductPublicationCard product={product} onUpdate={update} />
    </div>
  );
}
