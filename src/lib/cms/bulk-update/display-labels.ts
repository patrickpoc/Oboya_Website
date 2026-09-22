import { pickLocalizedLabel } from "@/lib/shop/localized-label";
import type { BulkUpdateCatalog } from "@/lib/cms/bulk-update/types";
import type { BulkEditableField } from "@/lib/cms/bulk-update/types";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

export type LabeledOption = { id: string; name: string };

function labelOf(
  locale: string,
  name: string,
  nameI18n?: Parameters<typeof pickLocalizedLabel>[2]
) {
  return pickLocalizedLabel(locale, name, nameI18n).trim() || name;
}

export function categoryOptions(
  catalog: BulkUpdateCatalog,
  locale = "en"
): LabeledOption[] {
  return catalog.categories.map((category) => ({
    id: category.id,
    name: labelOf(locale, category.name, category.nameI18n),
  }));
}

export function subcategoryOptions(
  catalog: BulkUpdateCatalog,
  categoryId: string | undefined,
  locale = "en"
): LabeledOption[] {
  const category = catalog.categories.find((item) => item.id === categoryId);
  const subs = category
    ? category.subcategories
    : catalog.categories.flatMap((item) => item.subcategories);
  return subs.map((sub) => ({
    id: sub.id,
    name: labelOf(locale, sub.name, sub.nameI18n),
  }));
}

export function brandOptions(
  catalog: BulkUpdateCatalog,
  locale = "en"
): LabeledOption[] {
  return catalog.brands.map((brand) => ({
    id: brand.id,
    name: labelOf(locale, brand.name, brand.nameI18n),
  }));
}

export function filterOptionLabels(
  catalog: BulkUpdateCatalog,
  groupId: string,
  locale = "en"
): LabeledOption[] {
  return (catalog.filterOptions[groupId] ?? []).map((option) => ({
    id: option.id,
    name: labelOf(locale, option.name, option.nameI18n),
  }));
}

export function marketOptions(catalog: BulkUpdateCatalog): LabeledOption[] {
  return catalog.countries.map((country) => ({
    id: country.code,
    name: country.name ? `${country.code} — ${country.name}` : country.code,
  }));
}

/** Resolve a stored id to its display name from the catalog. */
export function resolveCatalogDisplayName(
  catalog: BulkUpdateCatalog,
  kind:
    | "category"
    | "subcategory"
    | "brand"
    | "application"
    | "cultures"
    | "certifications"
    | "countryOfOrigin"
    | "market",
  id: string,
  locale = "en"
): string {
  const trimmed = id.trim();
  if (!trimmed) return "";

  switch (kind) {
    case "category": {
      const category = catalog.categories.find((item) => item.id === trimmed);
      return category
        ? labelOf(locale, category.name, category.nameI18n)
        : trimmed;
    }
    case "subcategory": {
      for (const category of catalog.categories) {
        const sub = category.subcategories.find((item) => item.id === trimmed);
        if (sub) return labelOf(locale, sub.name, sub.nameI18n);
      }
      return trimmed;
    }
    case "brand": {
      const brand = catalog.brands.find((item) => item.id === trimmed);
      return brand ? labelOf(locale, brand.name, brand.nameI18n) : trimmed;
    }
    case "application":
    case "cultures":
    case "certifications":
    case "countryOfOrigin": {
      const groupId =
        kind === "application"
          ? "applications"
          : kind === "cultures"
            ? "cultures"
            : kind === "certifications"
              ? "certifications"
              : "countriesOfOrigin";
      const option = (catalog.filterOptions[groupId] ?? []).find(
        (item) => item.id === trimmed
      );
      return option ? labelOf(locale, option.name, option.nameI18n) : trimmed;
    }
    case "market": {
      const country = catalog.countries.find((item) => item.code === trimmed);
      return country?.name ? `${country.code} — ${country.name}` : trimmed;
    }
    default:
      return trimmed;
  }
}

/**
 * Ensure current value(s) appear in the option list, labeled with catalog names.
 */
export function withCurrentLabeledOption(
  options: LabeledOption[],
  value: string | undefined | null,
  resolveMissing: (id: string) => string
): LabeledOption[] {
  const id = (value ?? "").trim();
  if (!id) return options;
  if (options.some((option) => option.id === id)) return options;
  return [{ id, name: resolveMissing(id) }, ...options];
}

export function withCurrentLabeledOptions(
  options: LabeledOption[],
  values: string[] | undefined,
  resolveMissing: (id: string) => string
): LabeledOption[] {
  const list = values ?? [];
  const missing = list.filter(
    (id) => id && !options.some((option) => option.id === id)
  );
  if (missing.length === 0) return options;
  return [
    ...missing.map((id) => ({ id, name: resolveMissing(id) })),
    ...options,
  ];
}

/** Human-readable value for change indicators / review UI. */
export function formatFieldDisplayValue(
  field: BulkEditableField,
  product: CmsProduct,
  catalog: BulkUpdateCatalog,
  locale = "en"
): string {
  switch (field) {
    case "moq":
      return String(product.moq ?? "");
    case "categoryId":
      return resolveCatalogDisplayName(
        catalog,
        "category",
        product.categoryId || "",
        locale
      );
    case "subcategoryId":
      return resolveCatalogDisplayName(
        catalog,
        "subcategory",
        product.subcategoryId || "",
        locale
      );
    case "brandId":
      return resolveCatalogDisplayName(
        catalog,
        "brand",
        product.brandId || "",
        locale
      );
    case "application":
      return (product.application ?? [])
        .map((id) =>
          resolveCatalogDisplayName(catalog, "application", id, locale)
        )
        .join("; ");
    case "cultures":
      return (product.cultures ?? [])
        .map((id) => resolveCatalogDisplayName(catalog, "cultures", id, locale))
        .join("; ");
    case "certifications":
      return (product.certifications ?? [])
        .map((id) =>
          resolveCatalogDisplayName(catalog, "certifications", id, locale)
        )
        .join("; ");
    case "countryOfOrigin":
      return resolveCatalogDisplayName(
        catalog,
        "countryOfOrigin",
        product.countryOfOrigin || "",
        locale
      );
    case "enabledCountries": {
      const map = product.enabledCountries ?? product.availability ?? {};
      return Object.entries(map)
        .filter(([, enabled]) => enabled)
        .map(([code]) =>
          resolveCatalogDisplayName(catalog, "market", code, locale)
        )
        .sort()
        .join("; ");
    }
    case "status":
      return product.status === "published" ? "Yes" : "No";
    default:
      return "";
  }
}
