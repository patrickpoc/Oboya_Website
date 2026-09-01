"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { useOverlayA11y } from "@/hooks/use-overlay-a11y";
import { CartItemRow } from "@/components/shop/cart/CartItem";
import { QuoteCartMinimizedButton } from "@/components/shop/cart/QuoteCartMinimizedButton";
import { mobileSheetTransition } from "@/components/shop/cart/quote-cart-transitions";
import { buttonVariants } from "@/components/ui/button";
import { EmptyQuote } from "@/components/shop/states/ShopStateViews";
import { formatShopPrice } from "@/lib/shop/format-price";

export function QuoteCartFab() {
  const { itemCount, isCartOpen, setCartOpen } = useShop();

  return (
    <AnimatePresence>
      {!isCartOpen && (
        <QuoteCartMinimizedButton
          key="quote-cart-fab"
          itemCount={itemCount}
          onClick={() => setCartOpen(true)}
          variant="mobile"
        />
      )}
    </AnimatePresence>
  );
}

export function QuoteCartSheet() {
  const t = useTranslations("shop");
  const {
    isCartOpen,
    setCartOpen,
    currency,
    itemCount,
    estimatedTotal,
    getLineItems,
    updateQuantity,
    removeItem,
    setQuoteModalOpen,
  } = useShop();
  const panelRef = useRef<HTMLDivElement>(null);
  const handleClose = useCallback(() => setCartOpen(false), [setCartOpen]);

  useOverlayA11y({
    open: isCartOpen,
    onClose: handleClose,
    containerRef: panelRef,
    lockScroll: true,
    trapFocus: true,
  });

  const lineItems = getLineItems();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          key="quote-cart-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-50 lg:hidden"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("minimizeQuoteList")}
            onClick={handleClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("quoteList")}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={mobileSheetTransition}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-2xl border border-border/60 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" aria-hidden />
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <h2 className="font-semibold text-oboya-blue-dark">{t("quoteList")}</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {itemCount} {t("items")}
                </span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-muted"
                  aria-label={t("minimizeQuoteList")}
                >
                  <ChevronDown className="size-4" aria-hidden />
                </button>
              </div>
            </div>
            <div className="max-h-[50vh] overflow-y-auto px-4">
              {lineItems.length === 0 ? (
                <EmptyQuote compact />
              ) : (
                lineItems.map((item) => (
                  <CartItemRow
                    key={item.productId}
                    productId={item.productId}
                    quantity={item.quantity}
                    unitPrice={item.unitPrice}
                    currency={currency ?? "USD"}
                    image={item.image}
                    sku={item.sku}
                    onUpdateQuantity={(qty) => updateQuantity(item.productId, qty)}
                    onRemove={() => removeItem(item.productId)}
                  />
                ))
              )}
            </div>
            {lineItems.length > 0 && currency && (
              <div className="border-t border-border/50 p-4">
                <div className="flex justify-between text-sm font-semibold text-oboya-blue-dark">
                  <span>{t("estimatedTotal")}</span>
                  <span>
                    {formatShopPrice(estimatedTotal, currency)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    setQuoteModalOpen(true);
                  }}
                  className={buttonVariants({
                    className:
                      "mt-4 min-h-11 w-full rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
                  })}
                >
                  {t("requestQuotation")}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
