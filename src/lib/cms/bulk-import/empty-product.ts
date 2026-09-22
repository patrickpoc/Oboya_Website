import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

/** Server/client-safe empty product seed (mirrors ProductEditorForm helper). */
export function createEmptyImportProduct(seed?: {
  id?: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
}): CmsProduct {
  return {
    id: seed?.id ?? `product-${Date.now()}`,
    sku: "",
    moq: 1,
    brandId: seed?.brandId ?? "",
    categoryId: seed?.categoryId ?? "",
    subcategoryId: seed?.subcategoryId ?? "",
    images: [""],
    imageColorIds: [[]],
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
    defaultColor: "",
    defaultColorName: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
    colorVariants: [],
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
