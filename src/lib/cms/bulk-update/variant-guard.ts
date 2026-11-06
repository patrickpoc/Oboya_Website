import { imageUrlProblem } from "@/lib/cms/bulk-import/images";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { validateColorVariants } from "@/lib/shop/color-variants";
import type { ProductColorVariant } from "@/lib/shop/types";

const skuKey = (value: string | undefined | null) => (value ?? "").trim().toLowerCase();

function variantsOf(product: CmsProduct | null | undefined): ProductColorVariant[] {
  return Array.isArray(product?.colorVariants) ? product.colorVariants : [];
}

/** True when the write touches color data (variants or the default color they depend on). */
export function colorDataChanged(
  incoming: CmsProduct,
  previous: CmsProduct | null | undefined
): boolean {
  return (
    JSON.stringify(variantsOf(incoming)) !== JSON.stringify(variantsOf(previous)) ||
    (incoming.defaultColor ?? "") !== (previous?.defaultColor ?? "") ||
    JSON.stringify(incoming.defaultColorName ?? null) !==
      JSON.stringify(previous?.defaultColorName ?? null)
  );
}

/**
 * Wrong-typed `colorVariants` (not an array, or an entry whose `sku`/`image` is not a string)
 * would crash or slip past the checks below, so reject it up front. Runs only when the field
 * differs from the stored one, like the other checks.
 */
export function variantShapeProblem(
  incoming: CmsProduct,
  previous: CmsProduct | null | undefined
): string | null {
  const raw: unknown = incoming.colorVariants;
  if (raw === undefined || raw === null) return null;
  if (JSON.stringify(raw) === JSON.stringify(previous?.colorVariants ?? null)) return null;
  if (!Array.isArray(raw)) return "colorVariants must be an array.";
  for (const entry of raw as unknown[]) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      return "Each color variant must be an object.";
    }
    const item = entry as Record<string, unknown>;
    if (typeof item.id !== "string" || typeof item.sku !== "string") {
      return "Each color variant needs a text id and SKU.";
    }
    if (item.image !== undefined && item.image !== null && typeof item.image !== "string") {
      return "Color variant image must be a text URL.";
    }
  }
  return null;
}

/**
 * First problem with a variant change, or null. Runs only when color data changed, so a save
 * that leaves `colorVariants` alone on a legacy invalid product still succeeds. Extra checks
 * (image URL, sort order, SKU ownership) apply to variants that are new or whose field changed.
 *
 * `others` = every other product, trashed included (pending versions for a batch).
 */
export function findVariantProblem(
  incoming: CmsProduct,
  previous: CmsProduct | null | undefined,
  others: Array<Pick<CmsProduct, "id" | "sku" | "colorVariants">>
): string | null {
  const shape = variantShapeProblem(incoming, previous);
  if (shape) return shape;
  const variants = variantsOf(incoming);
  if (variants.length === 0 || !colorDataChanged(incoming, previous)) return null;

  const basic = validateColorVariants(variants, {
    defaultColor: incoming.defaultColor,
    defaultColorName: incoming.defaultColorName,
  });
  if (basic) return basic;

  const before = new Map(variantsOf(previous).map((variant) => [variant.id, variant]));
  const owners = new Map<string, string>();
  for (const other of others) {
    if (other.id === incoming.id) continue;
    for (const raw of [other.id, other.sku, ...variantsOf(other as CmsProduct).map((v) => v.sku)]) {
      const key = skuKey(raw);
      if (key && !owners.has(key)) owners.set(key, other.id);
    }
  }

  for (const variant of variants) {
    const prior = before.get(variant.id);
    const label = variant.sku || variant.id;
    if (!prior || prior.sku !== variant.sku) {
      const key = skuKey(variant.sku);
      if (key === skuKey(incoming.sku)) return `Color SKU "${variant.sku}" duplicates the product SKU.`;
      const owner = owners.get(key);
      if (owner) return `Color SKU "${variant.sku}" already belongs to product "${owner}".`;
    }
    if (!prior || prior.image !== variant.image) {
      const problem = imageUrlProblem(variant.image ?? "");
      if (problem) return `Color "${label}": ${problem}`;
    }
    if (!prior || prior.sortOrder !== variant.sortOrder) {
      if (!Number.isInteger(variant.sortOrder) || variant.sortOrder < 0) {
        return `Color "${label}": sort order must be an integer of 0 or more.`;
      }
    }
  }
  return null;
}
