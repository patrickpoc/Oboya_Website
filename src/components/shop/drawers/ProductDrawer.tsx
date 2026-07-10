"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { getBrandById, getCategoryById, getProductById } from "@/lib/shop/catalog";
import { useProductName } from "@/lib/shop/use-product-name";
import { ProductGallery } from "@/components/shop/drawers/ProductGallery";
import { SpecificationTable } from "@/components/shop/drawers/SpecificationTable";
import { DownloadsList } from "@/components/shop/drawers/DownloadsList";
import { RelatedProducts } from "@/components/shop/drawers/RelatedProducts";
import { buttonVariants } from "@/components/ui/button";

const panelEase = [0.22, 1, 0.36, 1] as const;

export function ProductDrawer() {
  const t = useTranslations("shop");
  const {
    quickViewProductId,
    setQuickViewProductId,
    currency,
    openAddToQuoteDialog,
  } = useShop();
  const getProductName = useProductName();

  const product = quickViewProductId
    ? getProductById(quickViewProductId)
    : null;
  const isOpen = Boolean(product && currency);

  const name = product ? getProductName(product.id) : "";
  const brand = product ? getBrandById(product.brandId) : null;
  const category = product ? getCategoryById(product.categoryId) : null;
  const price =
    product && currency ? (product.prices[currency] ?? 0) : 0;

  const handleClose = () => setQuickViewProductId(null);

  const handleAdd = () => {
    if (!product) return;
    openAddToQuoteDialog(product.id);
  };

  return (
    <AnimatePresence>
      {isOpen && product && currency && (
        <motion.div
          key="product-quick-view"
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-oboya-blue-dark/40"
            onClick={handleClose}
            aria-label={t("close")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          />
          <motion.aside
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.42, ease: panelEase }}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-oboya-blue-dark">
                {t("quickView")}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <ProductGallery images={product.images} alt={name} />

              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-oboya-green">
                  {category?.name}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-oboya-blue-dark">
                  {name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {product.sku} · {brand?.name}
                </p>
                <p className="mt-3 text-lg font-semibold text-oboya-blue-dark">
                  {currency} {price.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("estimatedPrice")}
                </p>
                <p className="mt-1 text-xs font-medium text-oboya-green">
                  {t("moq", { count: product.moq })}
                </p>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {t("productDescriptionFallback")}
              </p>

              <div className="mt-6">
                <h3 className="mb-2 text-sm font-semibold text-oboya-blue-dark">
                  {t("specifications")}
                </h3>
                <SpecificationTable specs={product.specs} />
              </div>

              <div className="mt-6">
                <DownloadsList documents={product.documents} />
              </div>

              <div className="mt-6">
                <RelatedProducts
                  ids={product.relatedProductIds}
                  onSelect={setQuickViewProductId}
                />
              </div>
            </div>

            <div className="border-t border-border/60 px-5 py-4">
              <button
                type="button"
                onClick={handleAdd}
                className={buttonVariants({
                  className:
                    "w-full rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
                })}
              >
                {t("addToQuote")}
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
