import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  PRODUCT_LIST_COLUMNS,
  PRODUCT_TABLE_COLUMNS,
  productToRow,
  rowToProduct,
  type ProductRow,
} from "@/lib/cms/server/products/row.server";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

const product = {
  id: "P",
  sku: "P",
  moq: 1,
  categoryId: "c",
  subcategoryId: "s",
  images: ["/a.jpg"],
  imageColorIds: [[]],
  name: { en: "P", "pt-BR": "", es: "", "zh-CN": "" },
  shortDescription: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
  description: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
  status: "draft",
} as unknown as CmsProduct;

describe("brand columns", () => {
  it("never writes brand_id, even when a stale payload still carries brandId", () => {
    expect(productToRow(product)).not.toHaveProperty("brand_id");
    expect(productToRow({ ...product, brandId: "old" } as CmsProduct)).not.toHaveProperty("brand_id");
  });

  it("does not select brand_id", () => {
    expect(PRODUCT_LIST_COLUMNS.split(",")).not.toContain("brand_id");
    expect(PRODUCT_TABLE_COLUMNS.split(",")).not.toContain("brand_id");
  });

  it("reads a row that still has brand_id without exposing it", () => {
    const row = { ...productToRow(product), brand_id: "legacy" } as unknown as ProductRow;
    expect(rowToProduct(row)).not.toHaveProperty("brandId");
  });
});
