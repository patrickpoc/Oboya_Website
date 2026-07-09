"use client";

import { ShopHeroBanner } from "@/components/shop/ShopHeroBanner";
import { Container } from "@/components/ui/container";
import { useShop } from "@/contexts/ShopContext";
import { ShopToolbar } from "@/components/shop/toolbar/ShopToolbar";
import { OfficeCard } from "@/components/shop/OfficeCard";
import { FilterSidebar, FilterDrawer } from "@/components/shop/catalog/FilterSidebar";
import { ProductCatalog } from "@/components/shop/catalog/ProductCatalog";
import { ProductDrawer } from "@/components/shop/drawers/ProductDrawer";
import { QuoteCart } from "@/components/shop/cart/QuoteCart";
import { QuoteCartFab, QuoteCartSheet } from "@/components/shop/cart/QuoteCartSheet";
import { QuoteModal } from "@/components/shop/quote/QuoteModal";
import { AddToQuoteDialog } from "@/components/shop/quote/AddToQuoteDialog";
import {
  ErrorState,
  OfflineBanner,
} from "@/components/shop/states/ShopStateViews";

export function ShopPageContent() {
  const { status, countryCode } = useShop();

  return (
    <>
      <ShopHeroBanner />

      {status === "offline" && <OfflineBanner />}

      <ShopToolbar />
      <OfficeCard />

      <section className="py-8 md:py-12">
        <Container size="wide">
          {status === "error" ? (
            <ErrorState />
          ) : (
            <div className="flex gap-6 lg:gap-8">
              <div className="hidden w-64 shrink-0 lg:block">
                {countryCode && <FilterSidebar />}
              </div>

              <div className="min-w-0 flex-1">
                <ProductCatalog />
              </div>
            </div>
          )}
        </Container>
      </section>

      <FilterDrawer />
      <ProductDrawer />
      <QuoteCart />
      <QuoteCartFab />
      <QuoteCartSheet />
      <QuoteModal />
      <AddToQuoteDialog />
    </>
  );
}
