import type { CmsLocale, LocalizedString } from "@/lib/cms/types";
import { sanitizeSiteImageUrl } from "@/lib/cms/media-url";
import { buildShopHrefForSolution } from "@/lib/solutions/solutions-shop-linking";

export interface OboyaTerraShopTarget {
  categoryId?: string;
  subcategoryId?: string;
}

export interface OboyaTerraBlock {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  image: string;
  shop: OboyaTerraShopTarget;
}

export interface OboyaTerraSettings {
  blocks: OboyaTerraBlock[];
  exploreShop: OboyaTerraShopTarget;
  updatedAt: string;
}

const LOCALES: CmsLocale[] = ["en", "pt-BR", "es", "zh-CN"];
const MAX_BLOCKS = 12;
const MAX_ID = 120;
const MAX_TITLE = 200;
const MAX_DESCRIPTION = 1000;

type Seed = [string, LocalizedString, LocalizedString, string];

const SEEDS: Seed[] = [
  [
    "propagation",
    { "en": "Propagation", "pt-BR": "Propagação", "es": "Propagación", "zh-CN": "繁殖" },
    {
      "en": "Solutions developed to support healthy propagation, root initiation, and early-stage plant development.",
      "pt-BR": "Soluções desenvolvidas para apoiar a propagação saudável, o enraizamento e o desenvolvimento inicial das plantas.",
      "es": "Soluciones desarrolladas para favorecer una propagación saludable, el enraizamiento y el desarrollo temprano de las plantas.",
      "zh-CN": "专为支持健康繁殖、生根启动和植物早期发育而开发的解决方案。",
    },
    "/assets/solutions/flowers/propagation.jpg",
  ],
  [
    "growing-containers",
    { "en": "Growing Containers", "pt-BR": "Recipientes de Cultivo", "es": "Contenedores de Cultivo", "zh-CN": "种植容器" },
    {
      "en": "Designed to support plant health, operational efficiency and evolving sustainability objectives.",
      "pt-BR": "Projetados para apoiar a saúde das plantas, a eficiência operacional e metas de sustentabilidade em constante evolução.",
      "es": "Diseñados para favorecer la salud de las plantas, la eficiencia operativa y los objetivos de sostenibilidad en evolución.",
      "zh-CN": "旨在支持植物健康、运营效率以及不断发展的可持续发展目标。",
    },
    "/assets/solutions/vegetables/growing.jpg",
  ],
  [
    "decorative-retail",
    {
      "en": "Decorative & Retail Solutions",
      "pt-BR": "Soluções Decorativas e para Varejo",
      "es": "Soluciones Decorativas y para Retail",
      "zh-CN": "装饰与零售解决方案",
    },
    {
      "en": "Products that combine plant performance with attractive presentation.",
      "pt-BR": "Produtos que combinam desempenho para as plantas com uma apresentação atraente.",
      "es": "Productos que combinan el rendimiento de las plantas con una presentación atractiva.",
      "zh-CN": "兼具植物生长性能与美观展示效果的产品。",
    },
    "/assets/solutions/flowers/retail-v2.jpg",
  ],
  [
    "logistics-containers",
    {
      "en": "Logistics-Optimized Containers",
      "pt-BR": "Recipientes Otimizados para Logística",
      "es": "Contenedores Optimizados para Logística",
      "zh-CN": "物流优化容器",
    },
    {
      "en": "Solutions developed to improve transportation efficiency, handling and space utilization.",
      "pt-BR": "Soluções desenvolvidas para melhorar a eficiência do transporte, o manuseio e o aproveitamento de espaço.",
      "es": "Soluciones desarrolladas para mejorar la eficiencia del transporte, la manipulación y el aprovechamiento del espacio.",
      "zh-CN": "专为提升运输效率、搬运便利性和空间利用率而开发的解决方案。",
    },
    "/assets/solutions/vegetables/transport.jpg",
  ],
  [
    "specialized-growing",
    {
      "en": "Specialized Growing Solutions",
      "pt-BR": "Soluções de Cultivo Especializadas",
      "es": "Soluciones de Cultivo Especializadas",
      "zh-CN": "专业种植解决方案",
    },
    {
      "en": "Containers developed for specific crops, growing systems, and operational requirements.",
      "pt-BR": "Recipientes desenvolvidos para culturas, sistemas de cultivo e requisitos operacionais específicos.",
      "es": "Contenedores desarrollados para cultivos, sistemas de cultivo y requisitos operativos específicos.",
      "zh-CN": "针对特定作物、种植系统和运营需求而开发的容器。",
    },
    "/assets/solutions/vegetables/growing.jpg",
  ],
];

export const DEFAULT_OBOYA_TERRA_SETTINGS: OboyaTerraSettings = {
  blocks: SEEDS.map(([id, title, description, image]) => ({
    id,
    title,
    description,
    image,
    shop: {},
  })),
  exploreShop: {},
  updatedAt: "",
};

function localized(value: unknown, max: number): LocalizedString {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const text = (locale: CmsLocale) => {
    const raw = source[locale];
    return typeof raw === "string" && raw.trim() ? raw.slice(0, max) : "";
  };
  const en = text("en");
  const out = { en } as LocalizedString;
  for (const locale of LOCALES) {
    if (locale !== "en") out[locale] = text(locale) || en;
  }
  return out;
}

function shopId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim().slice(0, MAX_ID);
  return v || undefined;
}

function shopTarget(value: unknown): OboyaTerraShopTarget {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const categoryId = shopId(source.categoryId);
  const subcategoryId = shopId(source.subcategoryId);
  return {
    ...(categoryId ? { categoryId } : {}),
    ...(subcategoryId ? { subcategoryId } : {}),
  };
}

export function normalizeOboyaTerraSettings(raw: unknown): OboyaTerraSettings {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const updatedAt = typeof src.updatedAt === "string" ? src.updatedAt : "";
  if (!Array.isArray(src.blocks)) {
    return {
      ...structuredClone(DEFAULT_OBOYA_TERRA_SETTINGS),
      exploreShop: shopTarget(src.exploreShop),
      updatedAt,
    };
  }
  const seen = new Set<string>();
  const blocks: OboyaTerraBlock[] = [];
  for (const item of src.blocks.slice(0, MAX_BLOCKS)) {
    const b = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const base = shopId(b.id) ?? `block-${blocks.length + 1}`;
    let id = base;
    for (let n = 2; seen.has(id); n++) id = `${base.slice(0, MAX_ID - 4)}-${n}`;
    seen.add(id);
    blocks.push({
      id,
      title: localized(b.title, MAX_TITLE),
      description: localized(b.description, MAX_DESCRIPTION),
      image:
        sanitizeSiteImageUrl(b.image) ||
        SEEDS.find(([seedId]) => seedId === id || seedId === base)?.[3] ||
        SEEDS[0][3],
      shop: shopTarget(b.shop),
    });
  }
  return { blocks, exploreShop: shopTarget(src.exploreShop), updatedAt };
}

/** "/shop" when empty; otherwise the same deep-link builder Solutions uses. */
export function oboyaTerraShopHref(target: OboyaTerraShopTarget): string {
  const categoryId = target?.categoryId?.trim();
  const subcategoryId = target?.subcategoryId?.trim();
  if (!categoryId && !subcategoryId) return "/shop";
  return buildShopHrefForSolution({
    categoryId: categoryId || null,
    subcategoryIds: subcategoryId ? [subcategoryId] : [],
  });
}

let cache: OboyaTerraSettings | null = null;

export function getOboyaTerraSettings(): OboyaTerraSettings {
  if (!cache) cache = normalizeOboyaTerraSettings(undefined);
  return cache;
}

export function replaceOboyaTerraSettingsCache(settings: OboyaTerraSettings) {
  cache = normalizeOboyaTerraSettings(settings);
}

export function saveOboyaTerraSettings(settings: OboyaTerraSettings): OboyaTerraSettings {
  const updated = { ...normalizeOboyaTerraSettings(settings), updatedAt: new Date().toISOString() };
  cache = updated;
  return updated;
}
