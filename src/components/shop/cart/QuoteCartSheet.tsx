"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

function useIsLgUp() {
  const [isLgUp, setIsLgUp] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLgUp(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isLgUp;
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
  const isLgUp = useIsLgUp();
  // Desktop uses the floating QuoteCart panel (`lg:flex`); only lock scroll for the mobile sheet.
  // Wait until breakpoint is known so desktop never inherits the mobile scroll lock.
  const sheetActive = isCartOpen && isLgUp === false;

  useOverlayA11y({
    open: sheetActive,
    onClose: handleClose,
    containerRef: panelRef,
    lockScroll: true,
    trapFocus: true,
  });

  const lineItems = getLineItems();

  return (
    <AnimatePresence>
      {sheetActive && (
        <motion.div
          key="quote-cart-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-[60] lg:hidden"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("close")}
            onClick={handleClose}
            tabIndex={-1}
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
            className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl border border-border/60 bg-white shadow-2xl"
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-oboya-blue-dark">{t("quoteList")}</h2>
                <p className="text-sm text-muted-foreground">
                  {itemCount} {t("items")}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white text-oboya-blue-dark shadow-sm"
                aria-label={t("close")}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              {lineItems.length === 0 ? (
                <EmptyQuote compact />
              ) : (
                lineItems.map((item) => (
                  <CartItemRow
                    key={`${item.productId}-${item.variantId ?? "base"}`}
                    productId={item.productId}
                    variantId={item.variantId}
                    variantName={item.variantName}
                    quantity={item.quantity}
                    unitPrice={item.unitPrice}
                    currency={currency ?? "USD"}
                    image={item.image}
                    sku={item.sku}
                    onUpdateQuantity={(qty) =>
                      updateQuantity(item.productId, qty, item.variantId)
                    }
                    onRemove={() => removeItem(item.productId, item.variantId)}
                  />
                ))
              )}
            </div>
            <div className="shrink-0 space-y-2 border-t border-border/50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {lineItems.length > 0 && currency ? (
                <>
                  <div className="flex justify-between text-sm font-semibold text-oboya-blue-dark">
                    <span>{t("estimatedTotal")}</span>
                    <span>{formatShopPrice(estimatedTotal, currency)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      setQuoteModalOpen(true);
                    }}
                    className={buttonVariants({
                      className:
                        "min-h-11 w-full rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
                    })}
                  >
                    {t("requestQuotation")}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={handleClose}
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "w-full rounded-full border-oboya-blue-dark/30 bg-white text-oboya-blue-dark hover:bg-oboya-soft-white hover:text-oboya-blue-dark",
                })}
              >
                {t("close")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
