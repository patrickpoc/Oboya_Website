import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  PRODUCT_LIST_COLUMNS,
  disableMissingOptionalColumn,
  productToRow,
  resetOptionalColumnsForTests,
  withoutDisabledColumns,
} from "@/lib/cms/server/products/row.server";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

describe("optional product columns fallback", () => {
  beforeEach(() => resetOptionalColumnsForTests());

  it("ignores unrelated errors", () => {
    expect(disableMissingOptionalColumn(null)).toBe(false);
    expect(disableMissingOptionalColumn({ code: "42703", message: "column foo" })).toBe(false);
    expect(disableMissingOptionalColumn({ code: "23505", message: "sale_mode" })).toBe(false);
  });

  it("drops sale_mode from reads and writes once missing, only once", () => {
    const err = { code: "42703", message: "column cms_products.sale_mode does not exist" };
    expect(disableMissingOptionalColumn(err)).toBe(true);
    expect(disableMissingOptionalColumn(err)).toBe(false);
    expect(withoutDisabledColumns(PRODUCT_LIST_COLUMNS).split(",")).not.toContain("sale_mode");
    expect(productToRow({ id: "a", saleMode: "stock" } as unknown as CmsProduct)).not.toHaveProperty(
      "sale_mode"
    );
  });

  it("fails closed for quote products when sale_mode is unavailable", () => {
    disableMissingOptionalColumn({ code: "42703", message: "column cms_products.sale_mode does not exist" });
    expect(() => productToRow({ id: "a", saleMode: "quote" } as unknown as CmsProduct)).toThrow(
      /20261021_product_sale_mode/
    );
    expect(() => productToRow({ id: "a", saleMode: "stock" } as unknown as CmsProduct)).not.toThrow();
  });
});
