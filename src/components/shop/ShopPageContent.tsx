"use client";

import { Container } from "@/components/ui/container";
import { useShop } from "@/contexts/ShopContext";
import { ShopToolbar } from "@/components/shop/toolbar/ShopToolbar";
import { FilterSidebar, FilterDrawer } from "@/components/shop/catalog/FilterSidebar";
import { ProductCatalog } from "@/components/shop/catalog/ProductCatalog";
import { ShopOverlays } from "@/components/shop/ShopOverlays";
import {
  ErrorState,
  OfflineBanner,
} from "@/components/shop/states/ShopStateViews";

export function ShopPageContent() {
  const { status, countryCode } = useShop();

  return (
    <>
      {status === "offline" && <OfflineBanner />}

      <ShopToolbar />

      <section className="py-8 md:py-12">
        <Container size="wide">
          {status === "error" ? (
            <ErrorState />
          ) : (
            <div className="flex gap-5 lg:gap-6">
              <div className="hidden w-56 shrink-0 xl:w-60 lg:block">
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
      <ShopOverlays />
    </>
  );
}
