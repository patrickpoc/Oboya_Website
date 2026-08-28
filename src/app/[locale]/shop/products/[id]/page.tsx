import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { ProductDetailView } from "@/components/shop/product/ProductDetailView";
import { readPublishedProductById } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
import { stripHtmlToPlainText } from "@/lib/cms/sanitize-rich-html";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateStaticParams() {
  const { readProducts: readProductsFromStore } = await import(
    "@/lib/cms/server/products.server"
  );
  const products = await readProductsFromStore();
  return routing.locales.flatMap((locale) =>
    products
      .filter((product) => product.status === "published" && !product.deletedAt)
      .map((product) => ({ locale, id: product.id }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const product = await readPublishedProductById(id);
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

  const product = await readPublishedProductById(id);
  if (!product) notFound();

  return (
    <SiteLayout>
      <Suspense>
        <ProductDetailView product={product} />
      </Suspense>
    </SiteLayout>
  );
}
