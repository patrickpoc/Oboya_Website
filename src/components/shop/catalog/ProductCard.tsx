"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getBrandById, getCategoryById } from "@/lib/shop/catalog";
import { useProductName } from "@/lib/shop/use-product-name";
import type { ShopProduct } from "@/lib/shop/types";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: ShopProduct;
  currency: string;
  viewMode?: "grid" | "list";
  onQuickView: () => void;
  onAddToQuote: () => void;
}

function StockBadge({ status }: { status: ShopProduct["stockStatus"] }) {
  const t = useTranslations("shop.stock");
  const variants = {
    in_stock: "bg-oboya-green/10 text-oboya-green border-oboya-green/20",
    limited: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    on_request: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        variants[status]
      )}
    >
      {t(status)}
    </span>
  );
}

export function ProductCard({
  product,
  currency,
  viewMode = "grid",
  onQuickView,
  onAddToQuote,
}: ProductCardProps) {
  const t = useTranslations("shop");
  const getProductName = useProductName();
  const name = getProductName(product.id);
  const brand = getBrandById(product.brandId);
  const category = getCategoryById(product.categoryId);
  const price = product.prices[currency as keyof typeof product.prices] ?? 0;

  if (viewMode === "list") {
    return (
      <motion.article
        layout
        className="flex gap-4 rounded-xl border border-border/60 bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
      >
        <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-oboya-soft-white">
          <Image src={product.images[0]} alt={name} fill className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-oboya-green">
              {category?.name}
            </p>
            <StockBadge status={product.stockStatus} />
          </div>
          <h3 className="mt-1 font-semibold text-oboya-blue-dark">{name}</h3>
          <p className="text-xs text-muted-foreground">
            {product.sku} · {brand?.name}
          </p>
          <p className="mt-2 text-sm font-semibold text-oboya-blue-dark">
            {t("estimatedPrice")}: {currency} {price.toFixed(2)}
          </p>
          <p className="text-[11px] text-oboya-green">{t("moq", { count: product.moq })}</p>
        </div>
        <div className="flex shrink-0 flex-col justify-center gap-2">
          <button
            type="button"
            onClick={onQuickView}
            className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" })}
          >
            {t("quickView")}
          </button>
          <button
            type="button"
            onClick={onAddToQuote}
            className={buttonVariants({
              size: "sm",
              className: "rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            {t("addToQuote")}
          </button>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group overflow-hidden rounded-xl border border-border/60 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-oboya-soft-white">
        <Image src={product.images[0]} alt={name} fill className="object-cover" />
        <div className="absolute top-3 left-3">
          <StockBadge status={product.stockStatus} />
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-oboya-green">
          {category?.name}
        </p>
        <h3 className="mt-1 line-clamp-2 font-semibold text-oboya-blue-dark">{name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {product.sku} · {brand?.name}
        </p>
        {product.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <p className="mt-3 text-sm font-semibold text-oboya-blue-dark">
          {currency} {price.toFixed(2)}
        </p>
        <p className="text-[11px] text-muted-foreground">{t("estimatedPrice")}</p>
        <p className="text-[11px] text-oboya-green">{t("moq", { count: product.moq })}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onQuickView}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "flex-1 rounded-full",
            })}
          >
            {t("quickView")}
          </button>
          <button
            type="button"
            onClick={onAddToQuote}
            className={buttonVariants({
              size: "sm",
              className:
                "flex-1 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            {t("addToQuote")}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
