"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { CartItemRow } from "@/components/shop/cart/CartItem";
import { QuoteCartMinimizedButton } from "@/components/shop/cart/QuoteCartMinimizedButton";
import {
  desktopExpandTransition,
  desktopPanelMotion,
} from "@/components/shop/cart/quote-cart-transitions";
import { buttonVariants } from "@/components/ui/button";
import { EmptyQuote } from "@/components/shop/states/ShopStateViews";

export function QuoteCart() {
  const t = useTranslations("shop");
  const {
    countryCode,
    currency,
    itemCount,
    estimatedTotal,
    isCartOpen,
    setCartOpen,
    getLineItems,
    updateQuantity,
    removeItem,
    setQuoteModalOpen,
  } = useShop();

  if (!countryCode || !currency) return null;

  const lineItems = getLineItems();

  return (
    <AnimatePresence>
      {!isCartOpen ? (
        <QuoteCartMinimizedButton
          key="quote-cart-minimized"
          itemCount={itemCount}
          onClick={() => setCartOpen(true)}
          variant="desktop"
        />
      ) : (
        <motion.aside
          key="quote-cart-expanded"
          {...desktopPanelMotion}
          transition={desktopExpandTransition}
          className="fixed right-4 bottom-4 z-40 hidden w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border/60 bg-white shadow-[0_8px_40px_rgb(1_32_63/18%)] lg:flex"
        >
          <div className="shrink-0 border-b border-border/50 bg-oboya-soft-white px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-oboya-green" aria-hidden />
              <h2 className="text-sm font-semibold text-oboya-blue-dark">
                {t("quoteList")}
              </h2>
              {itemCount > 0 && (
                <span className="rounded-full bg-oboya-green/10 px-2 py-0.5 text-xs font-medium text-oboya-green">
                  {itemCount}
                </span>
              )}
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="ml-auto rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                aria-label={t("minimizeQuoteList")}
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto px-4">
            {lineItems.length === 0 ? (
              <EmptyQuote compact />
            ) : (
              lineItems.map((item) => (
                <CartItemRow
                  key={item.productId}
                  productId={item.productId}
                  quantity={item.quantity}
                  unitPrice={item.unitPrice}
                  currency={currency}
                  image={item.image}
                  sku={item.sku}
                  onUpdateQuantity={(qty) => updateQuantity(item.productId, qty)}
                  onRemove={() => removeItem(item.productId)}
                />
              ))
            )}
          </div>

          {lineItems.length > 0 && (
            <div className="shrink-0 border-t border-border/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("estimatedTotal")}</span>
                <span className="font-semibold text-oboya-blue-dark">
                  {currency} {estimatedTotal.toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("estimateDisclaimer")}
              </p>
              <button
                type="button"
                onClick={() => setQuoteModalOpen(true)}
                className={buttonVariants({
                  className:
                    "mt-4 w-full rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
                })}
              >
                {t("requestQuotation")}
              </button>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
