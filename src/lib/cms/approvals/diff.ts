import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { ChangeDiffEntry } from "@/lib/cms/approvals/types";
import type { CurrencyCode } from "@/lib/shop/types";

type PriceMap = Partial<Record<CurrencyCode, number>>;

export type ProductPricePatch = {
  prices: PriceMap;
  variantPrices: Record<string, PriceMap>;
};

const IGNORED_KEYS = new Set(["updatedAt", "updated_at", "pendingApproval"]);

export function stableStringify(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>)
    .filter((k) => !IGNORED_KEYS.has(k) && (value as Record<string, unknown>)[k] !== undefined)
    .sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
    .join(",")}}`;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Leaf-level JSON diff; arrays of objects with `id` are compared by id. */
export function diffJson(
  before: unknown,
  after: unknown,
  path = "",
  out: ChangeDiffEntry[] = [],
  limit = 200
): ChangeDiffEntry[] {
  if (out.length >= limit) return out;
  if (deepEqual(before, after)) return out;

  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of keys) {
      if (IGNORED_KEYS.has(key)) continue;
      diffJson(before[key], after[key], path ? `${path}.${key}` : key, out, limit);
    }
    return out;
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const byId =
      before.every((x) => isPlainObject(x) && typeof x.id === "string") &&
      after.every((x) => isPlainObject(x) && typeof x.id === "string");
    if (byId) {
      const prev = new Map(before.map((x) => [(x as { id: string }).id, x]));
      const next = new Map(after.map((x) => [(x as { id: string }).id, x]));
      for (const id of new Set([...prev.keys(), ...next.keys()])) {
        diffJson(prev.get(id), next.get(id), `${path}[${id}]`, out, limit);
      }
      return out;
    }
  }

  out.push({ path: path || "(root)", before: before ?? null, after: after ?? null });
  return out;
}

function normalizePrices(prices: PriceMap | undefined): PriceMap {
  const out: PriceMap = {};
  for (const [code, value] of Object.entries(prices ?? {})) {
    if (typeof value === "number" && Number.isFinite(value)) {
      out[code as CurrencyCode] = value;
    }
  }
  return out;
}

export function extractProductPrices(product: CmsProduct | undefined | null): ProductPricePatch {
  const variantPrices: Record<string, PriceMap> = {};
  for (const variant of product?.colorVariants ?? []) {
    if (variant?.id) variantPrices[variant.id] = normalizePrices(variant.prices);
  }
  return { prices: normalizePrices(product?.prices), variantPrices };
}

export function diffProductPrices(
  before: CmsProduct | undefined | null,
  after: CmsProduct
): { changed: boolean; entries: ChangeDiffEntry[]; proposed: ProductPricePatch; snapshot: ProductPricePatch } {
  const snapshot = extractProductPrices(before);
  const proposed = extractProductPrices(after);
  const entries: ChangeDiffEntry[] = [];
  const codes = new Set([
    ...Object.keys(snapshot.prices),
    ...Object.keys(proposed.prices),
  ]) as Set<CurrencyCode>;
  for (const code of codes) {
    if (snapshot.prices[code] !== proposed.prices[code]) {
      entries.push({
        path: `prices.${code}`,
        before: snapshot.prices[code] ?? null,
        after: proposed.prices[code] ?? null,
      });
    }
  }
  // Only variants that exist on both sides; new/removed variants are structural edits.
  for (const [variantId, next] of Object.entries(proposed.variantPrices)) {
    const prev = snapshot.variantPrices[variantId];
    if (!prev) continue;
    const vcodes = new Set([...Object.keys(prev), ...Object.keys(next)]) as Set<CurrencyCode>;
    for (const code of vcodes) {
      if (prev[code] !== next[code]) {
        entries.push({
          path: `colorVariants[${variantId}].prices.${code}`,
          before: prev[code] ?? null,
          after: next[code] ?? null,
        });
      }
    }
  }
  return { changed: entries.length > 0, entries, proposed, snapshot };
}

/** Returns `product` with price fields reverted to `previous` (existing variants only). */
export function withPricesFrom(product: CmsProduct, previous: CmsProduct | undefined | null): CmsProduct {
  const prev = extractProductPrices(previous);
  return {
    ...product,
    prices: { ...prev.prices },
    colorVariants: (product.colorVariants ?? []).map((variant) =>
      prev.variantPrices[variant.id]
        ? { ...variant, prices: { ...prev.variantPrices[variant.id] } }
        : variant
    ),
  };
}

export function applyPricePatch(product: CmsProduct, patch: ProductPricePatch): CmsProduct {
  return {
    ...product,
    prices: { ...patch.prices },
    colorVariants: (product.colorVariants ?? []).map((variant) =>
      patch.variantPrices[variant.id]
        ? { ...variant, prices: { ...patch.variantPrices[variant.id] } }
        : variant
    ),
  };
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.length > 40 ? `${value.slice(0, 40)}…` : value;
  const json = JSON.stringify(value);
  return json.length > 40 ? `${json.slice(0, 40)}…` : json;
}

export function formatDiffValue(value: unknown): string {
  return formatValue(value);
}

export function summarizeDiff(entries: ChangeDiffEntry[], max = 3): string {
  if (entries.length === 0) return "";
  const parts = entries
    .slice(0, max)
    .map((e) => `${e.path}: ${formatValue(e.before)} -> ${formatValue(e.after)}`);
  const rest = entries.length - max;
  return rest > 0 ? `${parts.join("; ")} (+${rest})` : parts.join("; ");
}
