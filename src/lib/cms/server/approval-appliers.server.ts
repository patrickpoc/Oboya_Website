import "server-only";

import type { ChangeTypeId } from "@/lib/cms/approvals/change-types";
import type {
  ChangeDiffEntry,
  ChangeRequest,
  ChangeRequestDiff,
} from "@/lib/cms/approvals/types";
import {
  applyPricePatch,
  deepEqual,
  diffJson,
  extractProductPrices,
  withPricesFrom,
  type ProductPricePatch,
} from "@/lib/cms/approvals/diff";
import type { StoreCountry } from "@/lib/cms/marketplace-countries";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import type { SolutionsPageSettings } from "@/lib/cms/repositories/solutions-page-repository";
import type { NewsPageSettings } from "@/lib/cms/repositories/news-page-repository";
import type { CmsFaqCategory, CmsFaqItem } from "@/lib/cms/repositories/faqs-repository";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import type { CmsCaseStudy } from "@/lib/cms/repositories/case-studies-repository";
import { readProductByIdStrict } from "@/lib/cms/server/products.server";
import {
  assertVariantChangesValid,
  createProductWrite,
  deleteProductWrite,
  mergeProductUpdate,
  invalidateCatalog,
  syncProductsFile,
  writeProduct,
} from "@/lib/cms/server/product-writes.server";

export type ProductEditPayload = { product: CmsProduct; preserveCurrentPrices: boolean };
export type ProductPricePayload = { productId: string; patch: ProductPricePatch };
export type CountriesChangePayload = { deactivate: string[]; remove: string[] };
export type ProductDeletePayload = { productId: string; hard: boolean };
export type BulkUpdatePayload = { products: CmsProduct[] };
export type FaqPayload =
  | { op: "save"; type: "category"; data: CmsFaqCategory }
  | { op: "save"; type: "faq"; data: CmsFaqItem }
  | { op: "delete"; type: "category" | "faq"; id: string };
export type DeleteByIdPayload = { id: string };

type Applier = {
  /** Returns human-readable conflict descriptions; empty = safe to apply. */
  detectConflicts(req: ChangeRequest): Promise<string[]>;
  /** Applies the proposed payload. May return an updated diff (bulk per-item results). */
  apply(req: ChangeRequest, options: { force: boolean }): Promise<ChangeRequestDiff | void>;
};

async function currentProduct(id: string) {
  // Strict: a failed read must leave the request open, not look like a missing product.
  return (await readProductByIdStrict(id)) ?? null;
}

/**
 * Requests created before brands were removed carry `brandId` in their snapshot. The read
 * path no longer returns it, so both sides drop it to avoid a false conflict.
 */
export function withoutLegacyBrand<T extends object | null | undefined>(product: T): T {
  if (!product || !("brandId" in product)) return product;
  const { brandId: _legacy, ...rest } = product as T & { brandId?: unknown };
  return rest as T;
}

function withoutPrices(product: CmsProduct | null | undefined) {
  if (!product) return null;
  return {
    ...product,
    prices: {},
    colorVariants: (product.colorVariants ?? []).map((v) => ({ ...v, prices: {} })),
  };
}

async function settingsDoc<T>(
  read: () => Promise<T>,
  save: (value: T) => Promise<unknown>,
  revalidate: () => void
): Promise<Applier> {
  return {
    async detectConflicts(req) {
      const current = await read();
      return deepEqual(current, req.snapshotBefore) ? [] : ["document"];
    },
    async apply(req) {
      await save(req.payloadProposed as T);
      try {
        revalidate();
      } catch {
        // Ignore when revalidation is unavailable.
      }
    },
  };
}

async function buildApplier(changeType: ChangeTypeId): Promise<Applier | null> {
  switch (changeType) {
    case "marketplace.price":
      return {
        async detectConflicts(req) {
          const payload = req.payloadProposed as ProductPricePayload;
          const current = await currentProduct(payload.productId);
          if (!current) return ["product_missing"];
          return deepEqual(extractProductPrices(current), req.snapshotBefore)
            ? []
            : ["prices"];
        },
        async apply(req) {
          const payload = req.payloadProposed as ProductPricePayload;
          const current = await currentProduct(payload.productId);
          if (!current) throw new Error("Product not found");
          await writeProduct(applyPricePatch(current, payload.patch), current);
        },
      };

    case "marketplace.product_edit":
      return {
        async detectConflicts(req) {
          const payload = req.payloadProposed as ProductEditPayload;
          const current = await currentProduct(payload.product.id);
          if (!current) return ["product_missing"];
          const snapshot = req.snapshotBefore as CmsProduct | null;
          const same = payload.preserveCurrentPrices
            ? deepEqual(
                withoutPrices(withoutLegacyBrand(current)),
                withoutPrices(withoutLegacyBrand(snapshot))
              )
            : deepEqual(withoutLegacyBrand(current), withoutLegacyBrand(snapshot));
          return same ? [] : ["product"];
        },
        async apply(req) {
          const payload = req.payloadProposed as ProductEditPayload;
          const current = await currentProduct(payload.product.id);
          const next = payload.preserveCurrentPrices
            ? withPricesFrom(payload.product, current)
            : payload.product;
          // Stored data may have changed since the request was made: re-check before writing.
          await assertVariantChangesValid([{ incoming: next, previous: current }]);
          await writeProduct(next, current);
        },
      };

    case "marketplace.product_create":
      return {
        async detectConflicts(req) {
          const product = req.payloadProposed as CmsProduct;
          return (await currentProduct(product.id)) ? ["already_exists"] : [];
        },
        async apply(req) {
          const product = req.payloadProposed as CmsProduct;
          await assertVariantChangesValid([{ incoming: product, previous: null }]);
          await createProductWrite(product);
        },
      };

    case "marketplace.countries":
      return {
        async detectConflicts(req) {
          const { readMarketplaceCurrenciesStrict } = await import(
            "@/lib/cms/server/marketplace-config.server"
          );
          const { detectCountryConflicts, parseCountryChanges } = await import(
            "@/lib/cms/marketplace-countries"
          );
          const changes = parseCountryChanges(req.payloadProposed);
          const current = await readMarketplaceCurrenciesStrict({ includeInactive: true });
          const snapshot = Array.isArray(req.snapshotBefore)
            ? (req.snapshotBefore as StoreCountry[])
            : [];
          return detectCountryConflicts(current.countries, snapshot, changes);
        },
        async apply(req) {
          const { readMarketplaceCurrenciesStrict, saveMarketplaceCurrencies } = await import(
            "@/lib/cms/server/marketplace-config.server"
          );
          const { applyRestrictiveCountryChanges, parseCountryChanges } = await import(
            "@/lib/cms/marketplace-countries"
          );
          const changes = parseCountryChanges(req.payloadProposed);
          const current = await readMarketplaceCurrenciesStrict({ includeInactive: true });
          await saveMarketplaceCurrencies({
            countries: applyRestrictiveCountryChanges(current.countries, changes),
            currencies: current.currencies,
          });
        },
      };

    case "marketplace.product_delete":
      return {
        async detectConflicts(req) {
          const payload = req.payloadProposed as ProductDeletePayload;
          return (await currentProduct(payload.productId)) ? [] : ["product_missing"];
        },
        async apply(req) {
          const payload = req.payloadProposed as ProductDeletePayload;
          await deleteProductWrite(payload.productId, payload.hard);
        },
      };

    case "marketplace.bulk_update":
      return {
        async detectConflicts(req) {
          const payload = req.payloadProposed as BulkUpdatePayload;
          const snapshots = (req.snapshotBefore ?? {}) as Record<string, CmsProduct | null>;
          const conflicts: string[] = [];
          for (const product of payload.products) {
            const current = await currentProduct(product.id);
            if (
              !deepEqual(
                withoutLegacyBrand(current),
                withoutLegacyBrand(snapshots[product.id] ?? null)
              )
            ) {
              conflicts.push(product.sku || product.id);
            }
          }
          return conflicts;
        },
        async apply(req) {
          const payload = req.payloadProposed as BulkUpdatePayload;
          const items = [...(req.diff.items ?? [])];
          let failed = 0;
          // Read every baseline before the first write: a read failure aborts
          // with nothing applied and the request stays open.
          const currents = new Map<string, CmsProduct | null>();
          for (const product of payload.products) {
            currents.set(product.id, await currentProduct(product.id));
          }
          // Re-check against today's catalog; a failure applies nothing and fails the request.
          await assertVariantChangesValid(
            payload.products.map((product) => {
              const previous = currents.get(product.id) ?? null;
              return { incoming: mergeProductUpdate(product, previous), previous };
            })
          );
          for (const product of payload.products) {
            const item = items.find((i) => i.productId === product.id);
            try {
              const current = currents.get(product.id) ?? null;
              await writeProduct(mergeProductUpdate(product, current), current, {
                deferRevalidate: true,
                skipFileSync: true,
              });
              if (item) item.result = "SUCCESS";
            } catch (error) {
              failed += 1;
              if (item) {
                item.result = "FAILED";
                item.error = error instanceof Error ? error.message : "Failed";
              }
            }
          }
          await syncProductsFile();
          invalidateCatalog();
          if (failed === payload.products.length && failed > 0) {
            throw new Error("All products in the batch failed to apply");
          }
          return { ...req.diff, items };
        },
      };

    case "website.homepage": {
      const { readHomepageSettingsStrict, saveHomepageSettingsDurable } = await import(
        "@/lib/cms/server/homepage.server"
      );
      const { revalidateHomePages } = await import("@/lib/cms/revalidate-site");
      return settingsDoc<HomepageSettings>(
        readHomepageSettingsStrict,
        saveHomepageSettingsDurable,
        revalidateHomePages
      );
    }

    case "website.about": {
      const { readAboutPageSettingsStrict, saveAboutPageSettingsDurable } = await import(
        "@/lib/cms/server/about-page.server"
      );
      const { revalidateAboutPages } = await import("@/lib/cms/revalidate-site");
      return settingsDoc<AboutPageSettings>(
        readAboutPageSettingsStrict,
        saveAboutPageSettingsDurable,
        revalidateAboutPages
      );
    }

    case "website.solutions": {
      const { readSolutionsPageSettingsStrict, saveSolutionsPageSettingsDurable } =
        await import("@/lib/cms/server/solutions-page.server");
      const { revalidateSolutionsPages } = await import("@/lib/cms/revalidate-site");
      return settingsDoc<SolutionsPageSettings>(
        readSolutionsPageSettingsStrict,
        saveSolutionsPageSettingsDurable,
        revalidateSolutionsPages
      );
    }

    case "website.news_page": {
      const { readNewsPageSettingsStrict, saveNewsPageSettingsDurable } = await import(
        "@/lib/cms/server/news-page.server"
      );
      const { revalidateNewsPages } = await import("@/lib/cms/revalidate-site");
      return settingsDoc<NewsPageSettings>(
        readNewsPageSettingsStrict,
        saveNewsPageSettingsDurable,
        revalidateNewsPages
      );
    }

    case "website.faqs": {
      const faqs = await import("@/lib/cms/server/faqs.server");
      const { revalidateFaqPages } = await import("@/lib/cms/revalidate-site");
      const findCurrent = async (type: "category" | "faq", id: string) => {
        const doc = await faqs.readFaqsStrict();
        const list: Array<{ id: string }> = type === "category" ? doc.categories : doc.faqs;
        return list.find((x) => x.id === id) ?? null;
      };
      return {
        async detectConflicts(req) {
          const payload = req.payloadProposed as FaqPayload;
          const id = payload.op === "delete" ? payload.id : payload.data.id;
          const current = await findCurrent(payload.type, id);
          return deepEqual(current, req.snapshotBefore ?? null) ? [] : ["faq"];
        },
        async apply(req) {
          const payload = req.payloadProposed as FaqPayload;
          if (payload.op === "delete") {
            if (payload.type === "category") await faqs.deleteFaqCategoryDurable(payload.id);
            else await faqs.deleteFaqItemDurable(payload.id);
          } else if (payload.type === "category") {
            await faqs.saveFaqCategoryDurable(payload.data);
          } else {
            await faqs.saveFaqItemDurable(payload.data);
          }
          revalidateFaqPages();
        },
      };
    }

    case "blog.upsert":
    case "blog.delete": {
      const blog = await import("@/lib/cms/server/blog-posts.server");
      const { revalidateBlogPages } = await import("@/lib/cms/revalidate-site");
      const find = async (id: string) =>
        (await blog.readBlogPostsStrict()).find((p) => p.id === id) ?? null;
      return {
        async detectConflicts(req) {
          return deepEqual(await find(req.entityId), req.snapshotBefore ?? null) ? [] : ["post"];
        },
        async apply(req) {
          if (changeType === "blog.delete") {
            const existing = await find(req.entityId);
            await blog.deleteBlogPostDurable(req.entityId);
            revalidateBlogPages(existing?.slug);
            return;
          }
          const saved = await blog.saveBlogPostDurable(req.payloadProposed as CmsBlogPost);
          revalidateBlogPages(saved.slug);
        },
      };
    }

    case "case_studies.upsert":
    case "case_studies.delete": {
      const studies = await import("@/lib/cms/server/case-studies.server");
      const { revalidateCaseStudyPages } = await import("@/lib/cms/revalidate-site");
      const find = async (id: string) =>
        (await studies.readCaseStudiesStrict()).find((s) => s.id === id) ?? null;
      return {
        async detectConflicts(req) {
          return deepEqual(await find(req.entityId), req.snapshotBefore ?? null)
            ? []
            : ["case_study"];
        },
        async apply(req) {
          if (changeType === "case_studies.delete") {
            const existing = await find(req.entityId);
            await studies.deleteCaseStudyDurable(req.entityId);
            revalidateCaseStudyPages(existing?.slug);
            return;
          }
          const saved = await studies.saveCaseStudyDurable(
            req.payloadProposed as CmsCaseStudy
          );
          revalidateCaseStudyPages(saved.slug);
        },
      };
    }

    case "careers.upsert":
    case "careers.delete": {
      const careers = await import("@/lib/cms/server/careers-openings.server");
      return {
        async detectConflicts(req) {
          return deepEqual(await careers.getOpening(req.entityId), req.snapshotBefore ?? null)
            ? []
            : ["job_opening"];
        },
        async apply(req) {
          if (changeType === "careers.delete") {
            await careers.deleteOpening(req.entityId);
            return;
          }
          await careers.saveOpening(req.payloadProposed, { id: req.requestedBy });
        },
      };
    }

    default:
      return null;
  }
}

export async function getApplier(changeType: ChangeTypeId): Promise<Applier | null> {
  return buildApplier(changeType);
}

/** Diff between the live entity and the proposal (shown on conflicts). */
export async function currentVsProposed(req: ChangeRequest): Promise<ChangeDiffEntry[]> {
  switch (req.changeType) {
    case "marketplace.price": {
      const payload = req.payloadProposed as ProductPricePayload;
      const current = await currentProduct(payload.productId);
      return diffJson(extractProductPrices(current), payload.patch);
    }
    case "marketplace.product_edit": {
      const payload = req.payloadProposed as ProductEditPayload;
      return diffJson(
        withoutLegacyBrand(await currentProduct(payload.product.id)),
        withoutLegacyBrand(payload.product)
      );
    }
    case "website.homepage": {
      const { readHomepageSettingsStrict } = await import("@/lib/cms/server/homepage.server");
      return diffJson(await readHomepageSettingsStrict(), req.payloadProposed);
    }
    case "website.about": {
      const { readAboutPageSettingsStrict } = await import("@/lib/cms/server/about-page.server");
      return diffJson(await readAboutPageSettingsStrict(), req.payloadProposed);
    }
    case "website.solutions": {
      const { readSolutionsPageSettingsStrict } = await import(
        "@/lib/cms/server/solutions-page.server"
      );
      return diffJson(await readSolutionsPageSettingsStrict(), req.payloadProposed);
    }
    case "website.news_page": {
      const { readNewsPageSettingsStrict } = await import("@/lib/cms/server/news-page.server");
      return diffJson(await readNewsPageSettingsStrict(), req.payloadProposed);
    }
    case "blog.upsert": {
      const blog = await import("@/lib/cms/server/blog-posts.server");
      const current =
        (await blog.readBlogPostsStrict()).find((p) => p.id === req.entityId) ??
        null;
      return diffJson(current, req.payloadProposed);
    }
    case "case_studies.upsert": {
      const studies = await import("@/lib/cms/server/case-studies.server");
      const current =
        (await studies.readCaseStudiesStrict()).find((s) => s.id === req.entityId) ?? null;
      return diffJson(current, req.payloadProposed);
    }
    case "careers.upsert": {
      const careers = await import("@/lib/cms/server/careers-openings.server");
      return diffJson(await careers.getOpening(req.entityId), req.payloadProposed);
    }
    default:
      return [];
  }
}
