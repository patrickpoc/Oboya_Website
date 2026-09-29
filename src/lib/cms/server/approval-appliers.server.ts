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
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import type { SolutionsPageSettings } from "@/lib/cms/repositories/solutions-page-repository";
import type { NewsPageSettings } from "@/lib/cms/repositories/news-page-repository";
import type { CmsFaqCategory, CmsFaqItem } from "@/lib/cms/repositories/faqs-repository";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import type { CmsCaseStudy } from "@/lib/cms/repositories/case-studies-repository";
import { readProductById } from "@/lib/cms/server/products.server";
import {
  createProductWrite,
  deleteProductWrite,
  revalidateShop,
  syncProductsFile,
  writeProduct,
} from "@/lib/cms/server/product-writes.server";

export type ProductEditPayload = { product: CmsProduct; preserveCurrentPrices: boolean };
export type ProductPricePayload = { productId: string; patch: ProductPricePatch };
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
  return (await readProductById(id, { asAdmin: true })) ?? null;
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
            ? deepEqual(withoutPrices(current), withoutPrices(snapshot))
            : deepEqual(current, snapshot);
          return same ? [] : ["product"];
        },
        async apply(req) {
          const payload = req.payloadProposed as ProductEditPayload;
          const current = await currentProduct(payload.product.id);
          const next = payload.preserveCurrentPrices
            ? withPricesFrom(payload.product, current)
            : payload.product;
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
          await createProductWrite(req.payloadProposed as CmsProduct);
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
            if (!deepEqual(current, snapshots[product.id] ?? null)) {
              conflicts.push(product.sku || product.id);
            }
          }
          return conflicts;
        },
        async apply(req) {
          const payload = req.payloadProposed as BulkUpdatePayload;
          const items = [...(req.diff.items ?? [])];
          let failed = 0;
          for (const product of payload.products) {
            const item = items.find((i) => i.productId === product.id);
            try {
              const current = await currentProduct(product.id);
              await writeProduct(product, current, {
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
          await revalidateShop();
          if (failed === payload.products.length && failed > 0) {
            throw new Error("All products in the batch failed to apply");
          }
          return { ...req.diff, items };
        },
      };

    case "website.homepage": {
      const { readHomepageSettingsDurable, saveHomepageSettingsDurable } = await import(
        "@/lib/cms/server/homepage.server"
      );
      const { revalidateHomePages } = await import("@/lib/cms/revalidate-site");
      return settingsDoc<HomepageSettings>(
        readHomepageSettingsDurable,
        saveHomepageSettingsDurable,
        revalidateHomePages
      );
    }

    case "website.about": {
      const { readAboutPageSettingsDurable, saveAboutPageSettingsDurable } = await import(
        "@/lib/cms/server/about-page.server"
      );
      const { revalidateAboutPages } = await import("@/lib/cms/revalidate-site");
      return settingsDoc<AboutPageSettings>(
        readAboutPageSettingsDurable,
        saveAboutPageSettingsDurable,
        revalidateAboutPages
      );
    }

    case "website.solutions": {
      const { readSolutionsPageSettingsDurable, saveSolutionsPageSettingsDurable } =
        await import("@/lib/cms/server/solutions-page.server");
      const { revalidateSolutionsPages } = await import("@/lib/cms/revalidate-site");
      return settingsDoc<SolutionsPageSettings>(
        readSolutionsPageSettingsDurable,
        saveSolutionsPageSettingsDurable,
        revalidateSolutionsPages
      );
    }

    case "website.news_page": {
      const { readNewsPageSettingsDurable, saveNewsPageSettingsDurable } = await import(
        "@/lib/cms/server/news-page.server"
      );
      const { revalidateNewsPages } = await import("@/lib/cms/revalidate-site");
      return settingsDoc<NewsPageSettings>(
        readNewsPageSettingsDurable,
        saveNewsPageSettingsDurable,
        revalidateNewsPages
      );
    }

    case "website.faqs": {
      const faqs = await import("@/lib/cms/server/faqs.server");
      const { revalidateFaqPages } = await import("@/lib/cms/revalidate-site");
      const findCurrent = async (type: "category" | "faq", id: string) => {
        const doc = await faqs.readFaqsDurable();
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
        (await blog.readBlogPostsDurable({ fresh: true })).find((p) => p.id === id) ?? null;
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
        (await studies.readCaseStudiesDurable()).find((s) => s.id === id) ?? null;
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
      return diffJson(await currentProduct(payload.product.id), payload.product);
    }
    case "website.homepage": {
      const { readHomepageSettingsDurable } = await import("@/lib/cms/server/homepage.server");
      return diffJson(await readHomepageSettingsDurable(), req.payloadProposed);
    }
    case "website.about": {
      const { readAboutPageSettingsDurable } = await import("@/lib/cms/server/about-page.server");
      return diffJson(await readAboutPageSettingsDurable(), req.payloadProposed);
    }
    case "website.solutions": {
      const { readSolutionsPageSettingsDurable } = await import(
        "@/lib/cms/server/solutions-page.server"
      );
      return diffJson(await readSolutionsPageSettingsDurable(), req.payloadProposed);
    }
    case "website.news_page": {
      const { readNewsPageSettingsDurable } = await import("@/lib/cms/server/news-page.server");
      return diffJson(await readNewsPageSettingsDurable(), req.payloadProposed);
    }
    case "blog.upsert": {
      const blog = await import("@/lib/cms/server/blog-posts.server");
      const current =
        (await blog.readBlogPostsDurable({ fresh: true })).find((p) => p.id === req.entityId) ??
        null;
      return diffJson(current, req.payloadProposed);
    }
    case "case_studies.upsert": {
      const studies = await import("@/lib/cms/server/case-studies.server");
      const current =
        (await studies.readCaseStudiesDurable()).find((s) => s.id === req.entityId) ?? null;
      return diffJson(current, req.payloadProposed);
    }
    default:
      return [];
  }
}
