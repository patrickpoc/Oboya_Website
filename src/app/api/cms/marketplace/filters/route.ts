import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";
import {
  readMarketplaceFilters,
  saveMarketplaceFilters,
} from "@/lib/cms/server/marketplace-config.server";
import { readProducts } from "@/lib/cms/server/products.server";
import { getCountryCode } from "@/constants/country-flags";
import type { ShopBrand, ShopCategory, ShopFilterOptions } from "@/lib/shop/types";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

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

function countUsageForOption(group: keyof ShopFilterOptions, optionId: string, products: CmsProduct[]) {
  if (group === "applications") {
    return products.filter((product) => product.application.includes(optionId)).length;
  }
  if (group === "cultures") {
    return products.filter((product) => product.cultures.includes(optionId)).length;
  }
  if (group === "certifications") {
    return products.filter((product) => product.certifications.includes(optionId)).length;
  }
  return products.filter((product) => product.countryOfOrigin === optionId).length;
}

export async function GET() {
  try {
    const data = await readMarketplaceFilters();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load filters" },
      { status: 500 }
    );
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
    if (isSupabaseConfigured()) {
      const user = await requireAdminUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = (await request.json()) as {
      categories: ShopCategory[];
      brands: ShopBrand[];
      filterOptions: ShopFilterOptions;
    };
    payload.brands = normalizeBrands(payload.brands);
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
    (Object.keys(payload.filterOptions) as Array<keyof ShopFilterOptions>).forEach((group) => {
      assertNoDuplicateNames(
        payload.filterOptions[group].map((option) => option.name),
        `${group} option`
      );
    });

    const nextCategoryIds = new Set(payload.categories.map((category) => category.id));
    const nextSubcategoryIds = new Set(
      payload.categories.flatMap((category) => category.subcategories.map((subcategory) => subcategory.id))
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

    (Object.keys(current.filterOptions) as Array<keyof ShopFilterOptions>).forEach((group) => {
      const next = new Set(payload.filterOptions[group].map((option) => option.id));
      const removed = current.filterOptions[group]
        .map((option) => option.id)
        .filter((id) => !next.has(id));
      removed.forEach((optionId) => {
        const usedBy = countUsageForOption(group, optionId, products);
        if (usedBy > 0) {
          throw new ValidationError(`Filter option is used by ${usedBy} product(s) in ${group}.`);
        }
      });
    });

    const saved = await saveMarketplaceFilters(payload);
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

