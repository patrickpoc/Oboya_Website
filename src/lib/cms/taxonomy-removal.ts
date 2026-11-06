import { getProductOptionIds } from "@/lib/shop/filter-groups";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type {
  ShopCategory,
  ShopFilterGroup,
  ShopFilterOptions,
} from "@/lib/shop/types";

export type RemovalTarget =
  | { kind: "subcategory"; id: string }
  | { kind: "category"; id: string }
  | { kind: "option"; id: string; groupId: string }
  | { kind: "group"; id: string };

export type TaxonomyDoc = {
  categories: ShopCategory[];
  filterGroups: ShopFilterGroup[];
  filterOptions: ShopFilterOptions;
};

/** Only the reference columns a removal may touch. */
export type ReferencePatch = Partial<
  Pick<
    CmsProduct,
    | "categoryId"
    | "subcategoryId"
    | "application"
    | "cultures"
    | "certifications"
    | "countryOfOrigin"
    | "customFilters"
  >
>;

type ProductRefs = Pick<
  CmsProduct,
  | "categoryId"
  | "subcategoryId"
  | "application"
  | "cultures"
  | "certifications"
  | "countryOfOrigin"
  | "customFilters"
>;

export type ResolvedReplacement =
  | { ok: true; subcategoryId?: string; categoryId?: string }
  | { ok: false; error: string };

/** Required references (subcategory, category) need a replacement. */
export function requiresReplacement(target: RemovalTarget): boolean {
  return target.kind === "subcategory" || target.kind === "category";
}

export const MAX_ID_LENGTH = 200;

const validId = (value: unknown): value is string =>
  typeof value === "string" && Boolean(value.trim()) && value.length <= MAX_ID_LENGTH;

export function isRemovalTarget(value: unknown): value is RemovalTarget {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!validId(v.id)) return false;
  if (v.kind === "option") return validId(v.groupId);
  return (
    v.kind === "subcategory" || v.kind === "category" || v.kind === "group"
  );
}

/** Only the canonical target fields (drops anything else sent by the client). */
export function canonicalTarget(target: RemovalTarget): RemovalTarget {
  return target.kind === "option"
    ? { kind: "option", id: target.id, groupId: target.groupId }
    : { kind: target.kind, id: target.id };
}

function subcategoryIdsOf(doc: Pick<TaxonomyDoc, "categories">, categoryId: string) {
  return new Set(
    doc.categories.find((c) => c.id === categoryId)?.subcategories.map((s) => s.id) ?? []
  );
}

export function targetExists(target: RemovalTarget, doc: TaxonomyDoc): boolean {
  switch (target.kind) {
    case "subcategory":
      return doc.categories.some((c) => c.subcategories.some((s) => s.id === target.id));
    case "category":
      return doc.categories.some((c) => c.id === target.id);
    case "group":
      return doc.filterGroups.some((g) => g.id === target.id);
    case "option":
      return (
        Object.hasOwn(doc.filterOptions, target.groupId) &&
        doc.filterOptions[target.groupId]!.some((o) => o.id === target.id)
      );
  }
}

export function productUsesTarget(
  target: RemovalTarget,
  product: ProductRefs,
  doc: Pick<TaxonomyDoc, "categories">
): boolean {
  switch (target.kind) {
    case "subcategory":
      return product.subcategoryId === target.id;
    case "category":
      return (
        product.categoryId === target.id ||
        subcategoryIdsOf(doc, target.id).has(product.subcategoryId)
      );
    case "option":
      return getProductOptionIds(product, target.groupId).includes(target.id);
    case "group":
      return getProductOptionIds(product, target.id).length > 0;
  }
}

export function findAffectedProducts<T extends ProductRefs>(
  target: RemovalTarget,
  products: T[],
  doc: Pick<TaxonomyDoc, "categories">
): T[] {
  return products.filter((product) => productUsesTarget(target, product, doc));
}

/** Validates the replacement id against the saved document. */
export function resolveReplacement(
  target: RemovalTarget,
  replacementId: string | undefined,
  doc: TaxonomyDoc
): ResolvedReplacement {
  if (!requiresReplacement(target)) return { ok: true };
  const id = replacementId?.trim();
  if (!id) return { ok: false, error: "A replacement is required." };
  const doomed =
    target.kind === "category" ? subcategoryIdsOf(doc, target.id) : new Set([target.id]);
  if (doomed.has(id)) return { ok: false, error: "Replacement must differ from the removed item." };
  const category = doc.categories.find((c) => c.subcategories.some((s) => s.id === id));
  if (!category) return { ok: false, error: "Replacement subcategory not found." };
  if (target.kind === "category" && category.id === target.id) {
    return { ok: false, error: "Replacement must be outside the removed category." };
  }
  return { ok: true, subcategoryId: id, categoryId: category.id };
}

/** Patch for one affected product; empty object when nothing changes. */
export function computeProductPatch(
  target: RemovalTarget,
  product: CmsProduct,
  replacement: Extract<ResolvedReplacement, { ok: true }>
): ReferencePatch {
  switch (target.kind) {
    case "subcategory":
    case "category":
      return {
        subcategoryId: replacement.subcategoryId ?? product.subcategoryId,
        categoryId: replacement.categoryId ?? product.categoryId,
      };
    case "option":
      return groupPatch(
        product,
        target.groupId,
        getProductOptionIds(product, target.groupId).filter((id) => id !== target.id)
      );
    case "group":
      return groupPatch(product, target.id, []);
  }
}

/** Typed counterpart of `patchProductFilterValues`, limited to reference fields. */
function groupPatch(product: CmsProduct, groupId: string, nextIds: string[]): ReferencePatch {
  switch (groupId) {
    case "applications":
      return { application: nextIds };
    case "cultures":
      return { cultures: nextIds };
    case "certifications":
      return { certifications: nextIds };
    case "countriesOfOrigin":
      return { countryOfOrigin: nextIds[0] ?? "" };
    default:
      return { customFilters: { ...(product.customFilters ?? {}), [groupId]: nextIds } };
  }
}

/** Removes the target from the taxonomy document (other entries untouched). */
export function removeFromDocument(target: RemovalTarget, doc: TaxonomyDoc): TaxonomyDoc {
  switch (target.kind) {
    case "subcategory":
      return {
        ...doc,
        categories: doc.categories.map((c) => ({
          ...c,
          subcategories: c.subcategories.filter((s) => s.id !== target.id),
        })),
      };
    case "category":
      return { ...doc, categories: doc.categories.filter((c) => c.id !== target.id) };
    case "group": {
      const filterOptions = { ...doc.filterOptions };
      delete filterOptions[target.id];
      return {
        ...doc,
        filterGroups: doc.filterGroups.filter((g) => g.id !== target.id),
        filterOptions,
      };
    }
    case "option":
      return {
        ...doc,
        filterOptions: {
          ...doc.filterOptions,
          [target.groupId]: (doc.filterOptions[target.groupId] ?? []).filter(
            (o) => o.id !== target.id
          ),
        },
      };
  }
}
