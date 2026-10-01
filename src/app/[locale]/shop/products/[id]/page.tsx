import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { ProductDetailView } from "@/components/shop/product/ProductDetailView";
import { ShopOverlays } from "@/components/shop/ShopOverlays";
import { readPublishedProductByParam } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
import { stripHtmlToPlainText } from "@/lib/cms/sanitize-rich-html.shared";
import { remapProductId } from "@/lib/shop/product-id-remap";

type Props = { params: Promise<{ locale: string; id: string }> };

/** Nothing prebuilt: each PDP renders on first visit and is cached until its product changes. */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const product = await readPublishedProductByParam(remapProductId(id));
  if (!product) return { title: "Not Found" };

  const seoTitle = pickLocalized(product.seo.title, locale);
  const name = pickLocalized(product.name, locale);
  const seoDescription = pickLocalized(product.seo.description, locale);
  const shortDescription = pickLocalized(product.shortDescription, locale);
  const descriptionText =
    seoDescription ||
    shortDescription ||
    stripHtmlToPlainText(pickLocalized(product.description, locale));

  return {
    title: seoTitle || name,
    description: descriptionText || undefined,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const remapped = remapProductId(id);
  const product = await readPublishedProductByParam(remapped);
  if (!product) notFound();

  const canonical = product.sku?.trim() || product.id;
  if (id !== canonical) {
    permanentRedirect(`/${locale}/shop/products/${canonical}`);
  }

  return (
    <SiteLayout>
      <Suspense>
        <ProductDetailView product={product} />
        <ShopOverlays />
      </Suspense>
    </SiteLayout>
  );
}
