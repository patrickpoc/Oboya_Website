import { NextResponse } from "next/server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { publicApiError } from "@/lib/security/public-error";
import {
  readMarketplaceFilters,
  saveMarketplaceFilters,
} from "@/lib/cms/server/marketplace-config.server";
import { readProducts } from "@/lib/cms/server/products.server";
import { getCountryCode } from "@/constants/country-flags";
import {
  countGroupUsage,
  countOptionUsage,
  normalizeFilterGroups,
  normalizeFilterOptions,
} from "@/lib/shop/filter-groups";
import type {
  ShopBrand,
  ShopCategory,
  ShopFilterGroup,
  ShopFilterOptions,
} from "@/lib/shop/types";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

class ValidationError extends Error {}

function normalized(value: string) {
  return value.trim().toLowerCase();
}

function assertNoDuplicateNames(values: string[], entityLabel: string) {
  const seen = new Set<string>();
  for (const value of values) {
    const key = normalized(value);
    if (!key) {
      throw new ValidationError(`${entityLabel} name cannot be empty.`);
    }
    if (seen.has(key)) {
      throw new ValidationError(`${entityLabel} "${value}" is duplicated.`);
    }
    seen.add(key);
  }
}

export async function GET() {
  try {
    const data = await readMarketplaceFilters();
    return NextResponse.json(data, { headers: noStoreHeaders });
  } catch (error) {
    return publicApiError(error, "Failed to load filters");
  }
}

function normalizeBrandFlag(flag?: string) {
  const code = flag?.trim() ? getCountryCode(flag.trim()) : null;
  return code ?? undefined;
}

function normalizeBrands(brands: ShopBrand[]): ShopBrand[] {
  return brands.map((brand) => {
    const flag = normalizeBrandFlag(brand.flag);
    if (flag) return { ...brand, flag };
    const { flag: _removed, ...rest } = brand;
    return rest;
  });
}

export async function PUT(request: Request) {
  try {
    const auth = await cmsGuard("marketplace", "edit");
    if ("response" in auth) return auth.response;
    const body = (await request.json()) as {
      categories: ShopCategory[];
      brands: ShopBrand[];
      filterGroups?: ShopFilterGroup[];
      filterOptions: ShopFilterOptions;
    };
    body.brands = normalizeBrands(body.brands);
    const filterOptions = normalizeFilterOptions(
      body.filterOptions,
      body.filterGroups
    );
    const filterGroups = normalizeFilterGroups(body.filterGroups, filterOptions);
    const payload = {
      categories: body.categories,
      brands: body.brands,
      filterGroups,
      filterOptions: normalizeFilterOptions(filterOptions, filterGroups),
    };

    const current = await readMarketplaceFilters();
    const products = (await readProducts({ includeDeleted: false })).filter(
      (product) => !product.deletedAt
    );

    assertNoDuplicateNames(
      payload.categories.map((category) => category.name),
      "Category"
    );
    payload.categories.forEach((category) => {
      assertNoDuplicateNames(
        category.subcategories.map((subcategory) => subcategory.name),
        `Subcategory in ${category.name || "category"}`
      );
    });
    assertNoDuplicateNames(
      payload.brands.map((brand) => brand.name),
      "Brand"
    );
    assertNoDuplicateNames(
      payload.filterGroups.map((group) => group.name),
      "Filter group"
    );
    const groupIds = new Set<string>();
    for (const group of payload.filterGroups) {
      const id = group.id.trim();
      if (!id) throw new ValidationError("Filter group id cannot be empty.");
      if (groupIds.has(id)) {
        throw new ValidationError(`Filter group id "${id}" is duplicated.`);
      }
      groupIds.add(id);
    }
    payload.filterGroups.forEach((group) => {
      assertNoDuplicateNames(
        (payload.filterOptions[group.id] ?? []).map((option) => option.name),
        `${group.name || group.id} option`
      );
    });

    const nextCategoryIds = new Set(payload.categories.map((category) => category.id));
    const nextSubcategoryIds = new Set(
      payload.categories.flatMap((category) =>
        category.subcategories.map((subcategory) => subcategory.id)
      )
    );
    const nextBrandIds = new Set(payload.brands.map((brand) => brand.id));
    const removedCategories = current.categories
      .map((category) => category.id)
      .filter((id) => !nextCategoryIds.has(id));
    const removedSubcategories = current.categories
      .flatMap((category) => category.subcategories.map((subcategory) => subcategory.id))
      .filter((id) => !nextSubcategoryIds.has(id));
    const removedBrands = current.brands
      .map((brand) => brand.id)
      .filter((id) => !nextBrandIds.has(id));

    for (const categoryId of removedCategories) {
      const usedBy = products.filter((product) => product.categoryId === categoryId).length;
      if (usedBy > 0) {
        throw new ValidationError(`Category is used by ${usedBy} product(s).`);
      }
    }
    for (const subcategoryId of removedSubcategories) {
      const usedBy = products.filter((product) => product.subcategoryId === subcategoryId).length;
      if (usedBy > 0) {
        throw new ValidationError(`Subcategory is used by ${usedBy} product(s).`);
      }
    }
    for (const brandId of removedBrands) {
      const usedBy = products.filter((product) => product.brandId === brandId).length;
      if (usedBy > 0) {
        throw new ValidationError(`Brand is used by ${usedBy} product(s).`);
      }
    }

    const nextGroupIds = new Set(payload.filterGroups.map((group) => group.id));
    for (const group of current.filterGroups) {
      if (nextGroupIds.has(group.id)) continue;
      const usedBy = countGroupUsage(group.id, products);
      if (usedBy > 0) {
        throw new ValidationError(
          `Filter group "${group.name}" is used by ${usedBy} product(s).`
        );
      }
    }

    for (const group of payload.filterGroups) {
      const previousOptions = current.filterOptions[group.id] ?? [];
      const nextOptionIds = new Set(
        (payload.filterOptions[group.id] ?? []).map((option) => option.id)
      );
      for (const option of previousOptions) {
        if (nextOptionIds.has(option.id)) continue;
        const usedBy = countOptionUsage(group.id, option.id, products);
        if (usedBy > 0) {
          throw new ValidationError(
            `Filter option is used by ${usedBy} product(s) in ${group.name}.`
          );
        }
      }
    }

    const saved = await saveMarketplaceFilters(payload);
    try {
      const { revalidateShopPages } = await import("@/lib/cms/revalidate-site");
      revalidateShopPages();
    } catch {
      // Ignore when revalidation is unavailable.
    }
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save filters" },
      { status: 500 }
    );
  }
}
