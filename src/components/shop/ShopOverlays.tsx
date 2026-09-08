"use client";

import { ProductDrawer } from "@/components/shop/drawers/ProductDrawer";
import { QuoteCart } from "@/components/shop/cart/QuoteCart";
import { QuoteCartFab, QuoteCartSheet } from "@/components/shop/cart/QuoteCartSheet";
import { QuoteModal } from "@/components/shop/quote/QuoteModal";
import { AddToQuoteDialog } from "@/components/shop/quote/AddToQuoteDialog";

/** Shared shop overlays for catalog + product detail pages. */
export function ShopOverlays() {
  return (
    <>
      <ProductDrawer />
      <QuoteCart />
      <QuoteCartFab />
      <QuoteCartSheet />
      <QuoteModal />
      <AddToQuoteDialog />
    </>
  );
}
