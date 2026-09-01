"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandLabel } from "@/components/shop/BrandLabel";
import { ProductDescriptionContent } from "@/components/shop/product/ProductDescriptionContent";
import { ProductGallery } from "@/components/shop/drawers/ProductGallery";
import { SpecificationTable } from "@/components/shop/drawers/SpecificationTable";
import { DownloadsList } from "@/components/shop/drawers/DownloadsList";
import { RelatedProducts } from "@/components/shop/drawers/RelatedProducts";
import { useShop } from "@/contexts/ShopContext";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { useProductDescription } from "@/lib/shop/use-product-description";
import { useProductName } from "@/lib/shop/use-product-name";
import { formatShopPrice } from "@/lib/shop/format-price";
import { buttonVariants } from "@/components/ui/button";

interface ProductDetailViewProps {
  product: CmsProduct;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const t = useTranslations("shop");
  const { currency, brands, categories, openAddToQuoteDialog, setQuickViewProductId } =
    useShop();
  const getProductName = useProductName();
  const { getDescriptionHtml, getExcerpt, locale } = useProductDescription();

  const name = getProductName(product);
  const brand = brands.find((item) => item.id === product.brandId);
  const category = categories.find((item) => item.id === product.categoryId);
  const price = currency ? (product.prices[currency] ?? 0) : 0;
  const descriptionHtml = getDescriptionHtml(product.description);
  const excerpt = getExcerpt({
    shortDescription: product.shortDescription,
    description: product.description,
  });

  return (
    <div className="mx-auto max-w-6xl px-[var(--container-padding)] py-8 md:py-12">
      <div className="mb-6">
        <Link href="/shop" className="text-sm text-oboya-green hover:underline">
          ← {t("continueBrowsing")}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} alt={name} />

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-oboya-green">
            {category?.name}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-oboya-blue-dark">
            {name}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
            <span>{product.sku}</span>
            {brand ? (
              <>
                <span aria-hidden>·</span>
                <BrandLabel brand={brand} locale={locale} />
              </>
            ) : null}
          </p>

          {currency ? (
            <>
              <p className="mt-4 text-2xl font-semibold text-oboya-blue-dark">
                {formatShopPrice(price, currency)}
              </p>
              <p className="text-xs text-muted-foreground">{t("estimatedPrice")}</p>
            </>
          ) : null}

          <p className="mt-2 text-sm font-medium text-oboya-green">
            {t("moq", { count: product.moq })}
          </p>

          {excerpt ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
          ) : null}

          <button
            type="button"
            onClick={() => openAddToQuoteDialog(product.id)}
            className={buttonVariants({
              className:
                "mt-6 w-full rounded-full bg-oboya-green text-white hover:bg-oboya-green/90 sm:w-auto sm:px-8",
            })}
          >
            {t("addToQuote")}
          </button>
        </div>
      </div>

      {descriptionHtml ? (
        <div className="mt-12 border-t border-border/60 pt-10">
          <ProductDescriptionContent
            html={descriptionHtml}
            fallbackHtml={product.description.en}
            title={t("productInformation")}
          />
        </div>
      ) : null}

      {product.specs.length > 0 ? (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-oboya-blue-dark">
            {t("specifications")}
          </h2>
          <SpecificationTable specs={product.specs} />
        </div>
      ) : null}

      {product.documents.length > 0 ? (
        <div className="mt-8">
          <DownloadsList documents={product.documents} />
        </div>
      ) : null}

      {product.relatedProductIds.length > 0 ? (
        <div className="mt-10">
          <RelatedProducts
            ids={product.relatedProductIds}
            onSelect={setQuickViewProductId}
          />
        </div>
      ) : null}
    </div>
  );
}
