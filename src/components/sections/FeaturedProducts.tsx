"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";
import {
  getCategoryById,
  getProductById,
} from "@/lib/shop/catalog";
import { useProductName } from "@/lib/shop/use-product-name";

interface FeaturedProductsProps {
  data: HomepageSettings["featuredProducts"];
  locale: string;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function shopHref(productId: string, productName: string) {
  const params = new URLSearchParams();
  params.set("currency", "USD");
  params.set("q", productName);
  params.set("product", productId);
  return `/shop?${params.toString()}`;
}

export function FeaturedProducts({ data, locale }: FeaturedProductsProps) {
  const getProductName = useProductName();

  const cards = data.items
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;
      const name = getProductName(product.id);
      const category =
        item.categoryLabel != null
          ? pickLocalized(item.categoryLabel, locale)
          : (getCategoryById(product.categoryId)?.name ?? product.categoryId);
      const price = product.prices.USD ?? 0;
      return {
        item,
        product,
        name,
        category,
        price,
        href: shopHref(product.id, name),
      };
    })
    .filter((card): card is NonNullable<typeof card> => card != null);

  return (
    <section className="bg-oboya-soft-white py-[var(--section-y)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mb-10 md:mb-14"
        >
          <div className="mb-6 flex items-center gap-4">
            <p className="shrink-0 text-sm font-medium tracking-wide text-oboya-green">
              {pickLocalized(data.eyebrow, locale)}
            </p>
            <div className="h-px flex-1 bg-oboya-green/35" aria-hidden />
          </div>
          <h2 className="max-w-4xl font-display text-[clamp(1.45rem,2.6vw,2.15rem)] leading-[1.35] font-black tracking-tight text-oboya-green text-balance">
            {pickLocalized(data.title, locale)}
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8"
        >
          {cards.map(({ product, name, category, price, href }) => (
            <motion.article
              key={product.id}
              variants={fadeInUp}
              className="flex flex-col bg-white shadow-[var(--shadow-subtle)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-white">
                <Image
                  src={product.images[0]}
                  alt={name}
                  fill
                  className="object-contain p-6 transition-transform duration-500 hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              <div className="flex flex-1 flex-col items-center px-5 pb-6 text-center">
                <p className="text-xs font-bold tracking-[0.14em] text-oboya-blue uppercase">
                  {category}
                </p>
                <h3 className="mt-2 text-lg font-bold text-oboya-blue-dark md:text-xl">
                  {name}
                </h3>
                <p className="mt-2 text-base font-medium text-oboya-green">
                  {formatUsd(price)}
                </p>

                <Link
                  href={href}
                  className={buttonVariants({
                    size: "cta",
                    variant: "outline",
                    className:
                      "mt-5 border-oboya-green bg-transparent text-oboya-blue-dark hover:bg-oboya-green hover:text-white",
                  })}
                >
                  <ShoppingBag className="size-3.5" aria-hidden />
                  See on shop
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mt-12 flex justify-center md:mt-16"
        >
          <Link
            href={data.ctaHref || "/shop"}
            className={buttonVariants({
              size: "cta",
              variant: "outline",
              className:
                "border-oboya-green bg-transparent text-oboya-green hover:bg-oboya-green hover:text-white",
            })}
          >
            {pickLocalized(data.ctaLabel, locale)}
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
