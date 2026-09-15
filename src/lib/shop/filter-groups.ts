import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type {
  FilterOption,
  ShopBrand,
  ShopCategory,
  ShopFilterGroup,
  ShopFilterOptions,
  ShopFilters,
  ShopLocalizedText,
  ShopProduct,
} from "@/lib/shop/types";

export const BUILTIN_FILTER_GROUP_IDS = [
  "applications",
  "cultures",
  "certifications",
  "countriesOfOrigin",
] as const;

/** Semantic aliases used by Solutions deep-links and legacy seed data. */
const FILTER_VALUE_ALIASES: Record<string, string[]> = {
  flowers: ["flowers", "floriculture"],
  fruits: ["fruits"],
  vegetables: ["vegetables", "vegetables-herbs", "vegetables-and-herbs"],
  propagation: ["propagation"],
  growing: ["growing"],
  harvest: ["harvest"],
  postharvest: ["postharvest", "post-harvest"],
  logistics: ["logistics", "logistics-display", "transport-logistics"],
  retail: ["retail"],
  automation: [
    "automation",
    "automation-machinery",
    "machinery-automation",
    "automation-and-machinery",
  ],
  greenhouse: ["greenhouse"],
  "post-harvest": ["postharvest", "post-harvest"],
  "transport-and-logistics": [
    "logistics",
    "transport-logistics",
    "transport-and-logistics",
  ],
  "transport-logistics": [
    "logistics",
    "transport-logistics",
    "transport-and-logistics",
  ],
  "automation-and-machinery": [
    "automation",
    "automation-and-machinery",
    "machinery-automation",
  ],
};

/** Anything with id + display name that can appear in shop URLs. */
export type SluggableEntity = {
  id: string;
  name: string;
  nameI18n?: ShopLocalizedText;
  slug?: string;
};

export interface ShopFilterTaxonomy {
  categories: ShopCategory[];
  brands: ShopBrand[];
  filterOptions: ShopFilterOptions;
}

export function slugifyFilterOption(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function entityPublicKey(entity: SluggableEntity): string {
  const slug =
    entity.slug?.trim() ||
    slugifyFilterOption(entity.nameI18n?.en || entity.name);
  return slug || entity.id;
}

export function optionPublicKey(option: FilterOption): string {
  return entityPublicKey(option);
}

function aliasKeysFor(value: string): Set<string> {
  const needle = value.trim().toLowerCase();
  const keys = new Set<string>([needle, slugifyFilterOption(needle)]);
  for (const [canonical, aliases] of Object.entries(FILTER_VALUE_ALIASES)) {
    if (canonical === needle || aliases.includes(needle)) {
      keys.add(canonical);
      for (const alias of aliases) keys.add(alias);
    }
  }
  return keys;
}

/** Map a URL / Solutions value to the live CMS entity id, or null if unknown. */
export function resolveEntityId(
  value: string,
  entities: SluggableEntity[]
): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (entities.length === 0) return raw;

  const byId = entities.find((entity) => entity.id === raw);
  if (byId) return byId.id;

  const keys = aliasKeysFor(raw);
  for (const entity of entities) {
    const publicKey = entityPublicKey(entity);
    if (keys.has(publicKey)) return entity.id;
    for (const key of keys) {
      if (publicKey === key) return entity.id;
      if (publicKey.startsWith(`${key}-`)) return entity.id;
    }
    const en = (entity.nameI18n?.en || entity.name).trim().toLowerCase();
    if (keys.has(en) || keys.has(slugifyFilterOption(en))) return entity.id;
  }

  return null;
}

export function resolveFilterOptionId(
  value: string,
  options: FilterOption[]
): string | null {
  return resolveEntityId(value, options);
}

export function resolveEntityIds(
  values: string[],
  entities: SluggableEntity[]
): string[] {
  if (entities.length === 0) return [...new Set(values.filter(Boolean))];
  const resolved: string[] = [];
  for (const value of values) {
    const id = resolveEntityId(value, entities);
    if (id) resolved.push(id);
  }
  return [...new Set(resolved)];
}

export function resolveFilterOptionIds(
  values: string[],
  options: FilterOption[]
): string[] {
  return resolveEntityIds(values, options);
}

function flatSubcategories(categories: ShopCategory[]): SluggableEntity[] {
  return categories.flatMap((category) => category.subcategories);
}

function mapPublicIds(values: string[], entities: SluggableEntity[]): string[] {
  return values.map((id) => {
    const entity = entities.find((item) => item.id === id);
    return entity ? entityPublicKey(entity) : id;
  });
}

export function resolveShopFilters(
  filters: ShopFilters,
  taxonomy: ShopFilterTaxonomy
): ShopFilters {
  const { filterOptions, categories, brands } = taxonomy;
  const customFilters: Record<string, string[]> = {};
  for (const [groupId, values] of Object.entries(filters.customFilters ?? {})) {
    customFilters[groupId] = resolveEntityIds(
      values,
      filterOptions[groupId] ?? []
    );
  }

  const categoryId = filters.categoryId
    ? resolveEntityId(filters.categoryId, categories)
    : null;

  return {
    ...filters,
    categoryId,
    subcategoryIds: resolveEntityIds(
      filters.subcategoryIds,
      flatSubcategories(categories)
    ),
    brandIds: resolveEntityIds(filters.brandIds, brands),
    applications: resolveEntityIds(
      filters.applications,
      filterOptions.applications ?? []
    ),
    cultures: resolveEntityIds(filters.cultures, filterOptions.cultures ?? []),
    certifications: resolveEntityIds(
      filters.certifications,
      filterOptions.certifications ?? []
    ),
    countriesOfOrigin: resolveEntityIds(
      filters.countriesOfOrigin,
      filterOptions.countriesOfOrigin ?? []
    ),
    customFilters,
  };
}

/** Prefer stable slugs in the address bar instead of generated CMS ids. */
export function toPublicShopFilters(
  filters: ShopFilters,
  taxonomy: ShopFilterTaxonomy
): ShopFilters {
  const { filterOptions, categories, brands } = taxonomy;
  const customFilters: Record<string, string[]> = {};
  for (const [groupId, values] of Object.entries(filters.customFilters ?? {})) {
    customFilters[groupId] = mapPublicIds(
      values,
      filterOptions[groupId] ?? []
    );
  }

  const category = filters.categoryId
    ? categories.find((item) => item.id === filters.categoryId)
    : null;

  return {
    ...filters,
    categoryId: category ? entityPublicKey(category) : filters.categoryId,
    subcategoryIds: mapPublicIds(
      filters.subcategoryIds,
      flatSubcategories(categories)
    ),
    brandIds: mapPublicIds(filters.brandIds, brands),
    applications: mapPublicIds(
      filters.applications,
      filterOptions.applications ?? []
    ),
    cultures: mapPublicIds(filters.cultures, filterOptions.cultures ?? []),
    certifications: mapPublicIds(
      filters.certifications,
      filterOptions.certifications ?? []
    ),
    countriesOfOrigin: mapPublicIds(
      filters.countriesOfOrigin,
      filterOptions.countriesOfOrigin ?? []
    ),
    customFilters,
  };
}

export function uniqueOptionId(
  preferred: string,
  existing: Array<{ id: string }>
): string {
  const base = slugifyFilterOption(preferred) || "option";
  if (!existing.some((item) => item.id === base)) return base;
  let index = 2;
  while (existing.some((item) => item.id === `${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}

export function withEntitySlug<T extends SluggableEntity>(entity: T): T {
  const slug =
    entity.slug?.trim() ||
    slugifyFilterOption(entity.nameI18n?.en || entity.name) ||
    undefined;
  return slug ? { ...entity, slug } : { ...entity };
}

export function normalizeCategories(categories: ShopCategory[]): ShopCategory[] {
  return categories.map((category) => {
    const withSlug = withEntitySlug(category);
    return {
      ...withSlug,
      subcategories: category.subcategories.map((sub) => withEntitySlug(sub)),
    };
  });
}

export function normalizeBrands(brands: ShopBrand[]): ShopBrand[] {
  return brands.map((brand) => withEntitySlug(brand));
}

export type BuiltinFilterGroupId = (typeof BUILTIN_FILTER_GROUP_IDS)[number];

export const DEFAULT_FILTER_GROUPS: ShopFilterGroup[] = [
  { id: "applications", name: "Application" },
  { id: "cultures", name: "Crop / Culture" },
  { id: "certifications", name: "Certifications" },
  { id: "countriesOfOrigin", name: "Country of Manufacture" },
];

export function isBuiltinFilterGroupId(id: string): id is BuiltinFilterGroupId {
  return (BUILTIN_FILTER_GROUP_IDS as readonly string[]).includes(id);
}

export function emptyShopFilterOptions(): ShopFilterOptions {
  return {
    applications: [],
    cultures: [],
    certifications: [],
    countriesOfOrigin: [],
  };
}

function normalizeOption(option: FilterOption): FilterOption {
  return withEntitySlug({
    ...option,
    name: option.name?.trim() || option.id,
  });
}

/** Ensure builtins exist and every group has an options array. */
export function normalizeFilterOptions(
  options: ShopFilterOptions | Record<string, FilterOption[]> | null | undefined,
  groups?: ShopFilterGroup[]
): ShopFilterOptions {
  const base = emptyShopFilterOptions();
  const source = options && typeof options === "object" ? options : {};
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      base[key] = value.map((option) => normalizeOption(option));
    }
  }
  for (const group of groups ?? DEFAULT_FILTER_GROUPS) {
    if (!Array.isArray(base[group.id])) {
      base[group.id] = [];
    }
  }
  return base;
}

export function normalizeFilterGroups(
  groups: ShopFilterGroup[] | null | undefined,
  options: ShopFilterOptions
): ShopFilterGroup[] {
  if (Array.isArray(groups) && groups.length > 0) {
    return groups
      .filter((group) => group && typeof group.id === "string" && group.id.trim())
      .map((group) => ({
        id: group.id.trim(),
        name: group.name?.trim() || group.id,
        nameI18n: group.nameI18n,
      }));
  }

  const fromOptions = BUILTIN_FILTER_GROUP_IDS.filter(
    (id) => Array.isArray(options[id])
  );
  const ids = fromOptions.length > 0 ? fromOptions : [...BUILTIN_FILTER_GROUP_IDS];
  return ids.map((id) => {
    const fallback = DEFAULT_FILTER_GROUPS.find((group) => group.id === id);
    return {
      id,
      name: fallback?.name ?? id,
      nameI18n: fallback?.nameI18n,
    };
  });
}

export function getProductOptionIds(
  product: Pick<
    ShopProduct,
    | "application"
    | "cultures"
    | "certifications"
    | "countryOfOrigin"
    | "customFilters"
  >,
  groupId: string
): string[] {
  if (groupId === "applications") return product.application ?? [];
  if (groupId === "cultures") return product.cultures ?? [];
  if (groupId === "certifications") return product.certifications ?? [];
  if (groupId === "countriesOfOrigin") {
    return product.countryOfOrigin ? [product.countryOfOrigin] : [];
  }
  return product.customFilters?.[groupId] ?? [];
}

export function countOptionUsage(
  groupId: string,
  optionId: string,
  products: Array<
    Pick<
      ShopProduct,
      | "application"
      | "cultures"
      | "certifications"
      | "countryOfOrigin"
      | "customFilters"
    >
  >
): number {
  return products.filter((product) =>
    getProductOptionIds(product, groupId).includes(optionId)
  ).length;
}

export function countGroupUsage(
  groupId: string,
  products: Array<
    Pick<
      ShopProduct,
      | "application"
      | "cultures"
      | "certifications"
      | "countryOfOrigin"
      | "customFilters"
    >
  >
): number {
  return products.filter(
    (product) => getProductOptionIds(product, groupId).length > 0
  ).length;
}

export function patchProductFilterValues<T extends CmsProduct | ShopProduct>(
  product: T,
  groupId: string,
  nextIds: string[]
): Partial<T> {
  if (groupId === "applications") {
    return { application: nextIds } as Partial<T>;
  }
  if (groupId === "cultures") {
    return { cultures: nextIds } as Partial<T>;
  }
  if (groupId === "certifications") {
    return { certifications: nextIds } as Partial<T>;
  }
  if (groupId === "countriesOfOrigin") {
    return { countryOfOrigin: nextIds[0] ?? "" } as Partial<T>;
  }
  return {
    customFilters: {
      ...(product.customFilters ?? {}),
      [groupId]: nextIds,
    },
  } as Partial<T>;
}

export function initFilterGroupI18n(
  name: string,
  i18n?: ShopLocalizedText
): ShopLocalizedText {
  return {
    en: i18n?.en?.trim() || name,
    "pt-BR": i18n?.["pt-BR"] || "",
    es: i18n?.es || "",
    "zh-CN": i18n?.["zh-CN"] || "",
  };
}
