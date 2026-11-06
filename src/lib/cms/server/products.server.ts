import "server-only";

export type { ProductReadFields } from "@/lib/cms/server/products/reads.server";
export type { ProductPageResult } from "@/lib/cms/server/products/page.server";
export {
  readProducts,
  readProductsStrict,
  readProductPricesStrict,
  readProductDescriptionsStrict,
  readProductSkuIndex,
  purgeExpiredProducts,
} from "@/lib/cms/server/products/reads.server";
export {
  readProductsPage,
  readProductById,
  readProductByIdStrict,
  findExistingProduct,
} from "@/lib/cms/server/products/page.server";
export {
  saveProduct,
  updateProductReferences,
  updateProductPrices,
  softDeleteProduct,
  restoreProduct,
  hardDeleteProduct,
  persistProductsToFile,
  persistProductsToFileSafe,
  readProductsFromFile,
} from "@/lib/cms/server/products/writes.server";
