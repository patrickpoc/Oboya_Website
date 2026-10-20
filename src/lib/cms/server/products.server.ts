import "server-only";

export type { ProductReadFields } from "@/lib/cms/server/products/reads.server";
export type { ProductPageResult } from "@/lib/cms/server/products/page.server";
export {
  readProducts,
  readProductSkuIndex,
  purgeExpiredProducts,
} from "@/lib/cms/server/products/reads.server";
export {
  readProductsPage,
  readProductById,
  findExistingProduct,
} from "@/lib/cms/server/products/page.server";
export {
  saveProduct,
  softDeleteProduct,
  restoreProduct,
  hardDeleteProduct,
  persistProductsToFile,
  persistProductsToFileSafe,
  readProductsFromFile,
} from "@/lib/cms/server/products/writes.server";
