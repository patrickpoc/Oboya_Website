import type { LocalizedString } from "@/lib/cms/types";
import type {
  ShopFilterTarget,
  SolutionsCropFilterId,
  SolutionStageCardId,
} from "@/lib/solutions/types";

function L(en: string, pt = en, es = en, zh = en): LocalizedString {
  return { en, "pt-BR": pt, es, "zh-CN": zh };
}

export interface SolutionsPageCrop {
  id: SolutionsCropFilterId;
  label: LocalizedString;
  /** Description shown when this crop is active (ignored for `all`). */
  description: LocalizedString;
  /** Sector title used in “Solutions for {sector}”. */
  sectorTitle: LocalizedString;
  /** Ordered “challenges we help address” bullets (max 8). */
  challenges: LocalizedString[];
  shop: ShopFilterTarget;
}

const MAX_CHALLENGES = 8;

function challengeList(...items: [string, string, string, string][]): LocalizedString[] {
  return items.map((item) => L(...item));
}

const DEFAULT_CHALLENGES: Record<string, LocalizedString[]> = {
  flowers: challengeList(
    ["Product protection", "Proteção do produto", "Protección del producto", "产品保护"],
    ["Post-harvest handling", "Manejo pós-colheita", "Manejo poscosecha", "采后处理"],
    ["Packaging efficiency", "Eficiência de embalagem", "Eficiencia de empaque", "包装效率"],
    ["Logistics performance", "Desempenho logístico", "Desempeño logístico", "物流绩效"],
    ["Labor productivity", "Produtividade da mão de obra", "Productividad de la mano de obra", "劳动生产率"],
    ["Retail presentation", "Apresentação no varejo", "Presentación en el comercio minorista", "零售陈列"]
  ),
  vegetables: challengeList(
    ["Production efficiency", "Eficiência de produção", "Eficiencia de producción", "生产效率"],
    ["Product consistency", "Consistência do produto", "Consistencia del producto", "产品一致性"],
    ["Packaging performance", "Desempenho da embalagem", "Desempeño del empaque", "包装性能"],
    ["Supply chain optimization", "Otimização da cadeia de suprimentos", "Optimización de la cadena de suministro", "供应链优化"],
    ["Sustainability objectives", "Metas de sustentabilidade", "Objetivos de sostenibilidad", "可持续发展目标"]
  ),
  fruits: challengeList(
    ["Damage reduction", "Redução de danos", "Reducción de daños", "减少损耗"],
    ["Transportation efficiency", "Eficiência no transporte", "Eficiencia en el transporte", "运输效率"],
    ["Product presentation", "Apresentação do produto", "Presentación del producto", "产品呈现"],
    ["Distribution performance", "Desempenho da distribuição", "Desempeño de la distribución", "配送绩效"],
    ["Retail execution", "Execução no varejo", "Ejecución en el comercio minorista", "零售执行"]
  ),
};

function defaultChallenges(cropId: string): LocalizedString[] {
  return (DEFAULT_CHALLENGES[cropId] ?? []).map((item) => ({ ...item }));
}

export type SolutionsBannerCropId = Exclude<SolutionsCropFilterId, "all">;

export interface SolutionsPageBanner {
  id: SolutionStageCardId | string;
  /** Shown for All Crops and for any crop without its own image. */
  image: string;
  cropImages?: Partial<Record<SolutionsBannerCropId, string>>;
  title: LocalizedString;
  /** Comma-free tag labels shown under the title. */
  tags: LocalizedString[];
  shop: ShopFilterTarget;
}

export interface SolutionsPageSettings {
  hero: {
    headline: LocalizedString;
    body: LocalizedString;
  };
  crops: SolutionsPageCrop[];
  banners: SolutionsPageBanner[];
  cta: {
    title: LocalizedString;
    description: LocalizedString;
    buttonLabel: LocalizedString;
    href: string;
  };
  updatedAt: string;
}

function defaultCrops(): SolutionsPageCrop[] {
  return [
    {
      id: "all",
      label: L("All Crops", "Todas as culturas", "Todos los cultivos", "全部作物"),
      description: L(
        "Supporting flower growers, exporters, distributors, and retailers from propagation to point of sale.",
        "Apoio a produtores de flores, exportadores, distribuidores e varejistas, da propagação ao ponto de venda.",
        "Apoyo a productores de flores, exportadores, distribuidores y minoristas, desde la propagación hasta el punto de venta.",
        "从育苗到零售终端，支持花卉种植者、出口商、分销商和零售商。"
      ),
      sectorTitle: L("every crop", "cada cultura", "cada cultivo", "每种作物"),
      challenges: defaultChallenges("all"),
      shop: {},
    },
    {
      id: "flowers",
      label: L("Flowers", "Flores", "Flores", "花卉"),
      description: L(
        "Supporting flower growers, exporters, distributors, and retailers from propagation to point of sale.",
        "Apoio a produtores de flores, exportadores, distribuidores e varejistas, da propagação ao ponto de venda.",
        "Apoyo a productores de flores, exportadores, distribuidores y minoristas, desde la propagación hasta el punto de venta.",
        "从育苗到零售终端，支持花卉种植者、出口商、分销商和零售商。"
      ),
      sectorTitle: L("Floriculture", "Floricultura", "Floricultura", "花卉种植"),
      challenges: defaultChallenges("flowers"),
      shop: { cultures: ["flowers"] },
    },
    {
      id: "vegetables",
      label: L("Vegetables & Herbs", "Hortaliças e ervas", "Hortalizas y hierbas", "蔬菜与香草"),
      description: L(
        "Supporting efficient production, handling, packaging, and commercialization for vegetable and herb operations.",
        "Apoio à produção, ao manuseio, à embalagem e à comercialização eficientes de hortaliças e ervas.",
        "Apoyo a la producción, manipulación, empaque y comercialización eficientes de hortalizas y hierbas.",
        "支持蔬菜与香草在生产、搬运、包装和销售环节的高效运营。"
      ),
      sectorTitle: L(
        "Vegetables & Herbs",
        "Hortaliças e ervas",
        "Hortalizas y hierbas",
        "蔬菜与香草"
      ),
      challenges: defaultChallenges("vegetables"),
      shop: { cultures: ["vegetables"] },
    },
    {
      id: "fruits",
      label: L("Fruits", "Frutas", "Frutas", "水果"),
      description: L(
        "Optimizing cultivation, handling, packaging, and distribution across the fruit supply chain.",
        "Otimização do cultivo, manuseio, embalagem e distribuição em toda a cadeia de frutas.",
        "Optimización del cultivo, la manipulación, el empaque y la distribución en toda la cadena de frutas.",
        "优化水果供应链中的种植、搬运、包装与配送。"
      ),
      sectorTitle: L("Fruits", "Frutas", "Frutas", "水果"),
      challenges: defaultChallenges("fruits"),
      shop: { cultures: ["fruits"] },
    },
  ];
}

const BANNER_CROP_IDS: SolutionsBannerCropId[] = ["flowers", "vegetables", "fruits"];

/** Previous single-line default of the solutions hero body (English). */
const LEGACY_HERO_BODY_EN =
  "Different crops, different markets, different operational realities. Every business faces unique challenges, but the objective remains the same: improve performance, protect quality, and support sustainable growth. Explore solutions tailored to your sector and designed to support every stage of your horticultural operation.";

function cropImages(stage: string): Record<SolutionsBannerCropId, string> {
  return {
    flowers: `/assets/solutions/flowers/${stage}.jpg`,
    vegetables: `/assets/solutions/vegetables/${stage}.jpg`,
    fruits: `/assets/solutions/fruits/${stage}.jpg`,
  };
}

export function resolveBannerImage(
  banner: SolutionsPageBanner,
  cropId: SolutionsCropFilterId
): string {
  if (cropId === "all") return banner.image;
  return banner.cropImages?.[cropId] || banner.image;
}

function defaultBanners(): SolutionsPageBanner[] {
  return [
    {
      id: "propagation",
      image: "/assets/solutions/stage-propagation.jpg",
      cropImages: cropImages("propagation"),
      title: L("Propagation Solutions", "Soluções de propagação", "Soluciones de propagación", "育苗解决方案"),
      tags: [
        L("Seedling trays", "Bandejas de mudas", "Bandejas de plántulas", "育苗盘"),
        L("Substrates", "Substratos", "Sustratos", "基质"),
      ],
      shop: { categoryId: "propagation" },
    },
    {
      id: "growing",
      image: "/assets/solutions/stage-growing.jpg",
      cropImages: cropImages("growing"),
      title: L("Growing Solutions", "Soluções de cultivo", "Soluciones de cultivo", "栽培解决方案"),
      tags: [
        L("Seedling trays", "Bandejas de mudas", "Bandejas de plántulas", "育苗盘"),
        L("Substrates", "Substratos", "Sustratos", "基质"),
        L("Pots", "Vasos", "Macetas", "花盆"),
        L("Irrigation", "Irrigação", "Riego", "灌溉"),
      ],
      shop: { categoryId: "growing" },
    },
    {
      id: "harvest",
      image: "/assets/solutions/stage-harvest.jpg",
      cropImages: cropImages("harvest"),
      title: L("Harvest Solutions", "Soluções de colheita", "Soluciones de cosecha", "采收解决方案"),
      tags: [
        L("Crates", "Caixas", "Cajas", "周转箱"),
        L("Transport trays", "Bandejas de transporte", "Bandejas de transporte", "运输托盘"),
        L("Harvest carts", "Carrinhos de colheita", "Carros de cosecha", "采收推车"),
      ],
      shop: { categoryId: "harvest" },
    },
    {
      id: "postharvest",
      image: "/assets/solutions/stage-postharvest.jpg",
      cropImages: cropImages("postharvest"),
      title: L("Postharvest Solutions", "Soluções de pós-colheita", "Soluciones de poscosecha", "采后解决方案"),
      tags: [
        L("Packaging", "Embalagem", "Empaque", "包装"),
        L("Crates", "Caixas", "Cajas", "周转箱"),
      ],
      shop: { categoryId: "post-harvest" },
    },
    {
      id: "transport-logistics",
      image: "/assets/solutions/stage-transport.png",
      cropImages: cropImages("transport"),
      title: L("Transport & Logistics", "Transporte e logística", "Transporte y logística", "运输与物流"),
      tags: [
        L("Logistics trolleys", "Carrinhos logísticos", "Carros logísticos", "物流推车"),
        L("Display systems", "Sistemas de exposição", "Sistemas de exhibición", "陈列系统"),
      ],
      shop: { categoryId: "transport-and-logistics" },
    },
    {
      id: "retail",
      image: "/assets/solutions/stage-retail.jpg",
      cropImages: cropImages("retail"),
      title: L("Retail", "Varejo", "Venta minorista", "零售"),
      tags: [
        L("Logistics trolleys", "Carrinhos logísticos", "Carros logísticos", "物流推车"),
        L("Display systems", "Sistemas de exposição", "Sistemas de exhibición", "陈列系统"),
      ],
      shop: { categoryId: "retail" },
    },
    {
      id: "automation",
      image: "/assets/solutions/stage-automation.jpg",
      cropImages: cropImages("automation"),
      title: L(
        "Automation & Machinery",
        "Automação e máquinas",
        "Automatización y maquinaria",
        "自动化与机械"
      ),
      tags: [
        L("Automation systems", "Sistemas de automação", "Sistemas de automatización", "自动化系统"),
        L("Greenhouse tech", "Tecnologia de estufa", "Tecnología de invernadero", "温室技术"),
      ],
      shop: { categoryId: "automation-and-machinery" },
    },
  ];
}

export function createDefaultSolutionsPageSettings(): SolutionsPageSettings {
  return {
    hero: {
      headline: L(
        "Solutions for Every Stage of Horticulture",
        "Soluções para cada etapa da horticultura",
        "Soluciones para cada etapa de la horticultura",
        "覆盖园艺每个阶段的解决方案"
      ),
      body: L(
        "Different crops, different markets, different operational realities.\nEvery business faces unique challenges, but the objective remains the same: improve performance, protect quality, and support sustainable growth.\nExplore solutions tailored to your sector and designed to support every stage of your horticultural operation.",
        "Culturas, mercados e realidades operacionais diferentes.\nCada negócio enfrenta desafios próprios, mas o objetivo é o mesmo: melhorar o desempenho, proteger a qualidade e sustentar o crescimento.\nExplore soluções feitas para o seu setor e para cada etapa da operação.",
        "Cultivos, mercados y realidades operativas distintas.\nCada negocio enfrenta desafíos propios, pero el objetivo es el mismo: mejorar el rendimiento, proteger la calidad y sostener el crecimiento.\nExplore soluciones hechas para su sector y para cada etapa de la operación.",
        "作物、市场和运营现实各不相同。\n每家企业都有自己的挑战，但目标一致：提升绩效、保障品质并支持可持续增长。\n探索为您的领域和园艺运营每个阶段设计的解决方案。"
      ),
    },
    crops: defaultCrops(),
    banners: defaultBanners(),
    cta: {
      title: L(
        "Which Solution is Right for You?",
        "Qual solução é a ideal para você?",
        "¿Qué solución es la adecuada para usted?",
        "哪种解决方案适合您？"
      ),
      description: L(
        "In our work culture, honesty is a priority. We are here to offer you the solution you really need. Find out what it is here.",
        "Em nossa cultura de trabalho, a honestidade é prioridade. Estamos aqui para oferecer a solução de que você realmente precisa. Descubra qual é aqui.",
        "En nuestra cultura de trabajo, la honestidad es una prioridad. Estamos aquí para ofrecerle la solución que realmente necesita. Descubra cuál es aquí.",
        "在我们的工作文化中，诚信是首要原则。我们致力于为您提供真正需要的解决方案。点击此处了解详情。"
      ),
      buttonLabel: L("Contact Us", "Fale conosco", "Contáctenos", "联系我们"),
      href: "/contact",
    },
    updatedAt: new Date().toISOString(),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

/**
 * Stage banners used to target `applications`, but the live shop catalogs
 * stages as categories (Propagation, Growing, …). Map legacy keys.
 */
const STAGE_APPLICATION_TO_CATEGORY: Record<string, string> = {
  propagation: "propagation",
  growing: "growing",
  harvest: "harvest",
  postharvest: "post-harvest",
  "post-harvest": "post-harvest",
  logistics: "transport-and-logistics",
  "transport-logistics": "transport-and-logistics",
  "transport-and-logistics": "transport-and-logistics",
  retail: "retail",
  automation: "automation-and-machinery",
  "automation-and-machinery": "automation-and-machinery",
};

function migrateLegacyStageShop(
  shop: ShopFilterTarget,
  bannerId?: string
): ShopFilterTarget {
  if (shop.categoryId) return shop;

  const fromApps = shop.applications?.[0];
  const key = fromApps || bannerId;
  if (!key) return shop;

  const categoryId = STAGE_APPLICATION_TO_CATEGORY[key];
  if (!categoryId) return shop;

  const next: ShopFilterTarget = { ...shop, categoryId };
  // Drop the sole stage application that was only a stand-in for category.
  if (
    next.applications?.length === 1 &&
    STAGE_APPLICATION_TO_CATEGORY[next.applications[0]!]
  ) {
    delete next.applications;
  }
  return next;
}

function normalizeShop(
  value: unknown,
  options?: { bannerId?: string }
): ShopFilterTarget {
  if (!isObject(value)) {
    return migrateLegacyStageShop({}, options?.bannerId);
  }
  const shop: ShopFilterTarget = {
    categoryId:
      typeof value.categoryId === "string" || value.categoryId === null
        ? (value.categoryId as string | null)
        : undefined,
    subcategoryIds: Array.isArray(value.subcategoryIds)
      ? value.subcategoryIds.filter((id): id is string => typeof id === "string")
      : undefined,
    applications: Array.isArray(value.applications)
      ? value.applications.filter((id): id is string => typeof id === "string")
      : undefined,
    cultures: Array.isArray(value.cultures)
      ? value.cultures.filter((id): id is string => typeof id === "string")
      : undefined,
    certifications: Array.isArray(value.certifications)
      ? value.certifications.filter((id): id is string => typeof id === "string")
      : undefined,
    countriesOfOrigin: Array.isArray(value.countriesOfOrigin)
      ? value.countriesOfOrigin.filter((id): id is string => typeof id === "string")
      : undefined,
    q: typeof value.q === "string" ? value.q : undefined,
  };
  return migrateLegacyStageShop(shop, options?.bannerId);
}

function normalizeLocalized(
  value: unknown,
  fallback: LocalizedString
): LocalizedString {
  if (!isObject(value)) return { ...fallback };
  return {
    en: typeof value.en === "string" && value.en.trim() ? value.en : fallback.en,
    "pt-BR":
      typeof value["pt-BR"] === "string" ? value["pt-BR"] : fallback["pt-BR"],
    es: typeof value.es === "string" ? value.es : fallback.es,
    "zh-CN":
      typeof value["zh-CN"] === "string" ? value["zh-CN"] : fallback["zh-CN"],
  };
}

function normalizeChallenges(value: unknown, cropId: string): LocalizedString[] {
  if (!Array.isArray(value)) return defaultChallenges(cropId);
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        isObject(item) && typeof item.en === "string" && item.en.trim() !== ""
    )
    .slice(0, MAX_CHALLENGES)
    .map((item) => normalizeLocalized(item, L(item.en as string)));
}

const LEGACY_CTA = {
  title: "Ready to find the right solution?",
  description:
    "Browse products in the Shop or contact our team for tailored recommendations.",
  buttonLabel: "Go to Shop",
  href: "/shop",
};

/** Stored value that still equals the old default (EN) upgrades to the new one. */
function ctaField(
  value: unknown,
  legacyEn: string,
  fallback: LocalizedString
): LocalizedString {
  if ((value as { en?: unknown } | undefined)?.en === legacyEn) {
    return { ...fallback };
  }
  return normalizeLocalized(value, fallback);
}

export function normalizeSolutionsPageSettings(
  value: unknown
): SolutionsPageSettings {
  const defaults = createDefaultSolutionsPageSettings();
  if (!isObject(value)) return defaults;

  const hero = isObject(value.hero) ? value.hero : {};
  const cta = isObject(value.cta) ? value.cta : {};

  const cropsRaw = Array.isArray(value.crops) ? value.crops : [];
  const bannersRaw = Array.isArray(value.banners) ? value.banners : [];

  const crops =
    cropsRaw.length > 0
      ? cropsRaw
          .filter(isObject)
          .map((crop, index) => {
            const byId = defaults.crops.find((item) => item.id === crop.id);
            const fallback = byId ?? defaults.crops[index] ?? defaults.crops[0]!;
            const description = normalizeLocalized(
              crop.description,
              fallback.description
            );
            // Promote legacy All Crops blurb to the verified copy.
            if (
              crop.id === "all" &&
              description.en.includes(
                "Discover how Oboya supports every stage of horticultural operations"
              )
            ) {
              return {
                id: "all" as SolutionsCropFilterId,
                label: normalizeLocalized(crop.label, fallback.label),
                description: { ...fallback.description },
                sectorTitle: normalizeLocalized(
                  crop.sectorTitle,
                  fallback.sectorTitle
                ),
                challenges: normalizeChallenges(crop.challenges, "all"),
                shop: normalizeShop(crop.shop),
              };
            }
            return {
              id: (typeof crop.id === "string"
                ? crop.id
                : fallback.id) as SolutionsCropFilterId,
              label: normalizeLocalized(crop.label, fallback.label),
              description,
              sectorTitle: normalizeLocalized(
                crop.sectorTitle,
                fallback.sectorTitle
              ),
              challenges: normalizeChallenges(
                crop.challenges,
                typeof crop.id === "string" ? crop.id : fallback.id
              ),
              shop: normalizeShop(crop.shop),
            };
          })
      : defaults.crops;

  const LEGACY_BANNER_IMAGES = new Set([
  "/assets/homepage/capabilities-value-chain.jpg",
  "/assets/homepage/hero-vineyard.jpg",
  "/assets/homepage/solutions-integrated.jpg",
  "/assets/homepage/capabilities-partnerships.jpg",
  "/assets/homepage/solutions-logistics.jpg",
  "/assets/homepage/capabilities-global-local.jpg",
  "/assets/homepage/greenhouse-technology.webp",
]);

const banners =
    bannersRaw.length > 0
      ? bannersRaw.filter(isObject).map((banner, index) => {
          const byId = defaults.banners.find(
            (item) => item.id === banner.id
          );
          const fallback = byId ?? defaults.banners[index] ?? defaults.banners[0]!;
          const tagsRaw = Array.isArray(banner.tags) ? banner.tags : [];
          const rawImage =
            typeof banner.image === "string" && banner.image
              ? banner.image
              : "";
          const image =
            !rawImage || LEGACY_BANNER_IMAGES.has(rawImage)
              ? fallback.image
              : rawImage;
          const storedCropImages = isObject(banner.cropImages)
            ? banner.cropImages
            : {};
          const bannerCropImages: Partial<Record<SolutionsBannerCropId, string>> = {};
          for (const cropId of BANNER_CROP_IDS) {
            const stored = storedCropImages[cropId];
            const value =
              typeof stored === "string" && stored.trim()
                ? stored.trim()
                : byId?.cropImages?.[cropId];
            if (value) bannerCropImages[cropId] = value;
          }
          return {
            id: typeof banner.id === "string" ? banner.id : fallback.id,
            image,
            cropImages: bannerCropImages,
            title: normalizeLocalized(banner.title, fallback.title),
            tags:
              tagsRaw.length > 0
                ? tagsRaw.map((tag, tagIndex) =>
                    normalizeLocalized(
                      tag,
                      fallback.tags[tagIndex] ?? L("Tag")
                    )
                  )
                : fallback.tags,
            shop: normalizeShop(banner.shop, {
              bannerId: typeof banner.id === "string" ? banner.id : fallback.id,
            }),
          };
        })
      : defaults.banners;

  return {
    hero: {
      headline: normalizeLocalized(hero.headline, defaults.hero.headline),
      // The old single-line default now has one sentence per line.
      body:
        (hero.body as { en?: unknown } | undefined)?.en === LEGACY_HERO_BODY_EN
          ? defaults.hero.body
          : normalizeLocalized(hero.body, defaults.hero.body),
    },
    crops,
    banners,
    cta: {
      title: ctaField(cta.title, LEGACY_CTA.title, defaults.cta.title),
      description: ctaField(
        cta.description,
        LEGACY_CTA.description,
        defaults.cta.description
      ),
      buttonLabel: ctaField(
        cta.buttonLabel,
        LEGACY_CTA.buttonLabel,
        defaults.cta.buttonLabel
      ),
      href:
        typeof cta.href === "string" &&
        cta.href.trim() &&
        cta.href.trim() !== LEGACY_CTA.href
          ? cta.href.trim()
          : defaults.cta.href,
    },
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : defaults.updatedAt,
  };
}

let cache: SolutionsPageSettings | null = null;

export function getSolutionsPageSettings(): SolutionsPageSettings {
  if (!cache) cache = createDefaultSolutionsPageSettings();
  return cache;
}

export function replaceSolutionsPageSettingsCache(
  settings: SolutionsPageSettings
): void {
  cache = normalizeSolutionsPageSettings(settings);
}

export function saveSolutionsPageSettings(
  settings: SolutionsPageSettings
): SolutionsPageSettings {
  cache = normalizeSolutionsPageSettings({
    ...settings,
    updatedAt: new Date().toISOString(),
  });
  return cache;
}
