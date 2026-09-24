"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useShop } from "@/contexts/ShopContext";
import { useProductName } from "@/lib/shop/use-product-name";

const FALLBACK_IMAGE = "/assets/homepage/greenhouse-technology.webp";

interface RelatedProductsProps {
  ids: string[];
  /** Optional override for drawer context; defaults to PDP links. */
  onSelect?: (productId: string) => void;
}

export function RelatedProducts({ ids, onSelect }: RelatedProductsProps) {
  const t = useTranslations("shop");
  const getProductName = useProductName();
  const { getProductById } = useShop();
  const products = ids
    .map((id) => getProductById(id))
    .filter(Boolean)
    .slice(0, 3) as NonNullable<ReturnType<typeof getProductById>>[];

  if (products.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-oboya-blue-dark">
        {t("relatedProducts")}
      </h3>
      <div className="grid gap-3">
        {products.map((product) => {
          const content = (
            <>
              <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-oboya-soft-white">
                <Image
                  src={product.images[0] || FALLBACK_IMAGE}
                  alt={getProductName(product)}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <span className="text-sm font-medium text-oboya-blue-dark">
                {getProductName(product)}
              </span>
            </>
          );

          if (onSelect) {
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelect(product.id)}
                className="flex items-center gap-3 rounded-lg border border-border/60 p-2 text-left transition-colors hover:border-oboya-green/40 hover:bg-oboya-soft-white"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={product.id}
              href={`/shop/products/${product.sku || product.id}`}
              className="flex items-center gap-3 rounded-lg border border-border/60 p-2 text-left transition-colors hover:border-oboya-green/40 hover:bg-oboya-soft-white"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
