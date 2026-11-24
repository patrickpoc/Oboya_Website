import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  PRODUCT_LIST_COLUMNS,
  disableMissingOptionalColumn,
  productToRow,
  rowToProduct,
  resetOptionalColumnsForTests,
  withoutDisabledColumns,
} from "@/lib/cms/server/products/row.server";
import type { ProductRow } from "@/lib/cms/server/products/row.server";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

describe("optional product columns fallback", () => {
  beforeEach(() => resetOptionalColumnsForTests());

  it("ignores unrelated errors", () => {
    expect(disableMissingOptionalColumn(null)).toBe(false);
    expect(disableMissingOptionalColumn({ code: "42703", message: "column foo" })).toBe(false);
    expect(disableMissingOptionalColumn({ code: "23505", message: "sale_mode" })).toBe(false);
  });

  it("matches the column name as a whole word, not a substring", () => {
    expect(
      disableMissingOptionalColumn({ code: "42703", message: 'column "boosted_rank" does not exist' })
    ).toBe(false);
    expect(
      disableMissingOptionalColumn({ code: "42703", message: 'column "boost" of relation "cms_products" does not exist' })
    ).toBe(true);
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

  it("drops boost once missing, only once, from select and row", () => {
    const err = { code: "PGRST204", message: "Could not find the 'boost' column" };
    expect(PRODUCT_LIST_COLUMNS.split(",")).toContain("boost");
    expect(disableMissingOptionalColumn(err)).toBe(true);
    expect(disableMissingOptionalColumn(err)).toBe(false);
    expect(withoutDisabledColumns(PRODUCT_LIST_COLUMNS).split(",")).not.toContain("boost");
    expect(productToRow({ id: "a", boost: 0 } as unknown as CmsProduct)).not.toHaveProperty("boost");
  });

  it("fails closed for boost > 0 when the boost column is unavailable", () => {
    disableMissingOptionalColumn({ code: "42703", message: "column cms_products.boost does not exist" });
    expect(() => productToRow({ id: "a", boost: 5 } as unknown as CmsProduct)).toThrow(
      /20261124_cms_products_boost/
    );
    expect(() => productToRow({ id: "a", boost: 0 } as unknown as CmsProduct)).not.toThrow();
  });

  it("maps boost from rows with normalization", () => {
    expect(rowToProduct({ id: "a" } as unknown as ProductRow).boost).toBe(0);
    expect(rowToProduct({ id: "a", boost: 150 } as unknown as ProductRow).boost).toBe(100);
  });
});
