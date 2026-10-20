import type {
  AboutImpactStat,
  AboutImpactStatIcon,
  AboutMediaImage,
  AboutMissionVisionBlock,
} from "@/lib/cms/repositories/about-page/types";
import { loc } from "@/lib/cms/repositories/about-page/locale";
import { defaultSettings } from "@/lib/cms/repositories/about-page/defaults";

export const VALUE_IMAGE_FALLBACKS: Record<
  string,
  { image: AboutMediaImage; objectPosition?: string }
> = {
  innovation: {
    image: {
      src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1400&auto=format&fit=crop",
      alt: loc(
        "Modern greenhouse with rows of growing plants",
        "Estufa moderna com fileiras de plantas em crescimento",
        "Invernadero moderno con filas de plantas en crecimiento",
        "现代化温室中成排生长的植物"
      ),
    },
    objectPosition: "center 45%",
  },
  integrity: {
    image: {
      src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1400&auto=format&fit=crop",
      alt: loc(
        "Business partners shaking hands in agreement",
        "Parceiros de negócios apertando as mãos em acordo",
        "Socios comerciales estrechandose la mano en acuerdo",
        "商业伙伴握手达成协议"
      ),
    },
    objectPosition: "center 30%",
  },
  "customer-oriented": {
    image: {
      src: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1400&auto=format&fit=crop",
      alt: loc(
        "Grower inspecting crops in a cultivated field",
        "Produtor inspecionando cultivos em um campo cultivado",
        "Productor inspeccionando cultivos en un campo cultivado",
        "种植者在农田中检查作物"
      ),
    },
    objectPosition: "center 40%",
  },
  professional: {
    image: {
      src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1400&auto=format&fit=crop",
      alt: loc(
        "Technician working carefully in a production environment",
        "Técnico trabalhando com cuidado em ambiente de produção",
        "Técnico trabajando con cuidado en un entorno de producción",
        "技术人员在生产环境中细致工作"
      ),
    },
    objectPosition: "center 35%",
  },
  responsibility: {
    image: {
      src: "https://images.unsplash.com/photo-1470058869958-2a77ade41c02?q=80&w=1400&auto=format&fit=crop",
      alt: loc(
        "Lush green plants growing in a sustainable environment",
        "Plantas verdes exuberantes crescendo em ambiente sustentável",
        "Plantas verdes exuberantes creciendo en un entorno sostenible",
        "可持续环境中茂盛生长的绿色植物"
      ),
    },
    objectPosition: "center 40%",
  },
};

export function fallbackValueImage(id: string): {
  image: AboutMediaImage;
  objectPosition?: string;
} {
  return (
    VALUE_IMAGE_FALLBACKS[id] ?? {
      image: {
        src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=1400&auto=format&fit=crop",
        alt: loc(
          "Horticulture greenhouse interior",
          "Interior de estufa de horticultura",
          "Interior de invernadero de horticultura",
          "园艺温室内部"
        ),
      },
      objectPosition: "center center",
    }
  );
}

export const IMPACT_STAT_DEFAULTS: AboutImpactStat[] = defaultSettings().impact.stats;

export const IMPACT_ICON_BY_ID: Record<string, AboutImpactStatIcon> = {
  countries: "globe",
  manufacturing: "factory",
  offices: "building",
  employees: "users",
  team: "users",
  clients: "handshake",
  products: "package",
  years: "calendar",
  facilities: "factory",
};

export const IMPACT_ACCENT_BY_ID: Record<string, string> = {
  countries: "#004F7C",
  manufacturing: "#4DAF4E",
  offices: "#009CD4",
  employees: "#01203F",
  team: "#01203F",
  clients: "#ea5744",
  products: "#75C566",
  years: "#909B03",
  facilities: "#4DAF4E",
};

export function fallbackImpactMedia(id: string): Pick<
  AboutImpactStat,
  "image" | "objectPosition" | "accentColor"
> {
  const fromDefaults = IMPACT_STAT_DEFAULTS.find((stat) => stat.id === id);
  if (fromDefaults) {
    return {
      image: fromDefaults.image,
      objectPosition: fromDefaults.objectPosition,
      accentColor: fromDefaults.accentColor,
    };
  }
  return {
    accentColor: IMPACT_ACCENT_BY_ID[id] ?? "#4DAF4E",
    objectPosition: "center center",
    image: {
      src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=1400&auto=format&fit=crop",
      alt: loc(
        "Horticulture greenhouse interior",
        "Interior de estufa de horticultura",
        "Interior de invernadero de horticultura",
        "园艺温室内部"
      ),
    },
  };
}

export function normalizeImpactStats(stats: AboutImpactStat[]): AboutImpactStat[] {
  if (!Array.isArray(stats) || stats.length === 0) {
    return IMPACT_STAT_DEFAULTS;
  }

  const byId = new Map(stats.map((stat) => [stat.id, stat]));
  const required = [
    "countries",
    "manufacturing",
    "offices",
    "employees",
    "clients",
    "products",
    "years",
  ];

  // Preserve incoming order; append any missing required stats from defaults
  // (do not wipe custom values when a legacy doc is incomplete).
  const orderedIds: string[] = [];
  const seen = new Set<string>();
  for (const stat of stats) {
    if (!stat?.id || seen.has(stat.id)) continue;
    seen.add(stat.id);
    orderedIds.push(stat.id);
  }
  for (const id of required) {
    if (seen.has(id)) continue;
    seen.add(id);
    orderedIds.push(id);
  }

  return orderedIds.map((id) => {
    const fromDefaults = IMPACT_STAT_DEFAULTS.find((stat) => stat.id === id);
    const stat = byId.get(id) ?? fromDefaults;
    if (!stat) {
      return IMPACT_STAT_DEFAULTS[0];
    }
    const media = fallbackImpactMedia(id);
    const src = stat.image?.src ?? "";
    // Promote former pending placeholders when defaults now carry verified numbers.
    const promoteFromDefaults =
      Boolean(fromDefaults) &&
      fromDefaults?.pending !== true &&
      (stat.pending === true ||
        (typeof stat.value === "number" &&
          stat.value === 0 &&
          !stat.suffix));
    const value = promoteFromDefaults
      ? (fromDefaults?.value ?? stat.value)
      : stat.value;
    const suffix = promoteFromDefaults
      ? (fromDefaults?.suffix ?? stat.suffix ?? "")
      : (stat.suffix ?? "");
    const pending = promoteFromDefaults
      ? false
      : stat.pending === true;
    return {
      ...fromDefaults,
      ...stat,
      id,
      value,
      suffix,
      icon: stat.icon ?? IMPACT_ICON_BY_ID[id] ?? fromDefaults?.icon ?? "globe",
      pending,
      accentColor:
        stat.accentColor ??
        IMPACT_ACCENT_BY_ID[id] ??
        media.accentColor,
      objectPosition: stat.objectPosition ?? media.objectPosition,
      image: src
        ? {
            src,
            alt: stat.image?.alt ?? media.image.alt,
          }
        : media.image,
    };
  });
}

/** Broken Unsplash IDs previously used on About (return HTTP 404). */
export const BROKEN_ABOUT_IMAGE_MARKERS = [
  "photo-1573497019940-1cfe6d4b9f07",
  "photo-1466692476867-a0881dfc0648",
];

export function repairMissionVisionImages(
  block: AboutMissionVisionBlock | undefined,
  fallback: AboutMissionVisionBlock
): AboutMissionVisionBlock {
  const images = (block?.images?.length ? block.images : fallback.images).map(
    (image, index) => {
      const src = image?.src ?? "";
      const broken =
        !src || BROKEN_ABOUT_IMAGE_MARKERS.some((marker) => src.includes(marker));
      if (!broken) return image;
      return fallback.images[index] ?? fallback.images[0]!;
    }
  );

  return {
    ...fallback,
    ...block,
    title: block?.title ?? fallback.title,
    body: block?.body ?? fallback.body,
    images,
  };
}
