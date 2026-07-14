"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";
import {
  getCategoryById,
  getShopCatalog,
} from "@/lib/shop/catalog";

interface FeaturedProductsProps {
  data: HomepageSettings["featuredProducts"];
  locale: string;
}

function shopCategoryHref(categoryId: string) {
  const params = new URLSearchParams();
  params.set("currency", "USD");
  params.set("category", categoryId);
  return `/shop?${params.toString()}`;
}

function categoryCoverImage(categoryId: string, override?: string) {
  if (override) return override;
  const product = getShopCatalog().products.find(
    (p) => p.categoryId === categoryId && p.images[0]
  );
  return (
    product?.images[0] ??
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800&auto=format&fit=crop"
  );
}

export function FeaturedProducts({ data, locale }: FeaturedProductsProps) {
  const cards = data.items
    .map((item) => {
      const category = getCategoryById(item.categoryId);
      if (!category) return null;
      const title =
        item.title != null
          ? pickLocalized(item.title, locale)
          : category.name;
      const description =
        item.description != null
          ? pickLocalized(item.description, locale)
          : null;
      return {
        item,
        category,
        title,
        description,
        image: categoryCoverImage(item.categoryId, item.image),
        href: shopCategoryHref(item.categoryId),
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
          {cards.map(({ item, title, description, image, href }) => (
            <motion.article
              key={item.id}
              variants={fadeInUp}
              className="flex flex-col bg-white shadow-[var(--shadow-subtle)]"
            >
              <Link
                href={href}
                className="relative aspect-[4/3] overflow-hidden bg-oboya-soft-white"
              >
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </Link>

              <div className="flex flex-1 flex-col items-center px-5 pb-6 pt-5 text-center">
                <h3 className="text-lg font-bold text-oboya-blue-dark md:text-xl">
                  {title}
                </h3>
                {description ? (
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-oboya-blue-dark/55">
                    {description}
                  </p>
                ) : null}

                <Link
                  href={href}
                  className={buttonVariants({
                    size: "cta",
                    variant: "outline",
                    className:
                      "mt-5 border-oboya-green bg-transparent text-oboya-blue-dark hover:bg-oboya-green hover:text-white",
                  })}
                >
                  View category
                  <ArrowRight className="size-3.5" aria-hidden />
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
