"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { QuantityInput } from "@/components/shop/QuantityInput";
import { useShop } from "@/contexts/ShopContext";
import { formatShopPrice } from "@/lib/shop/format-price";
import { getProductMoq } from "@/lib/shop/quantity";
import { useProductName } from "@/lib/shop/use-product-name";

const FALLBACK_IMAGE = "/assets/homepage/greenhouse-technology.webp";

export function CheckoutLineItem({
  productId,
  variantId,
  variantName,
  quantity,
  unitPrice,
  currency,
  image,
  sku,
  onUpdateQuantity,
  onRemove,
}: {
  productId: string;
  variantId?: string | null;
  variantName?: string | null;
  quantity: number;
  unitPrice: number;
  currency: string;
  image: string;
  sku: string;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("checkout");
  const getProductName = useProductName();
  const { getProductById } = useShop();
  const product = getProductById(productId);
  const moq = getProductMoq(product, variantId);
  const imageSrc = image || product?.images[0] || FALLBACK_IMAGE;

  return (
    <article className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-b border-border/50 py-4 last:border-b-0 md:grid-cols-[9.5rem_minmax(0,1fr)_auto_auto]">
      <div className="relative h-24 w-[7.5rem] md:h-32 md:w-[9.5rem]">
        <Image
          src={imageSrc}
          alt={getProductName(product ?? productId)}
          fill
          unoptimized
          className="object-contain p-1"
          sizes="152px"
        />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-oboya-blue-dark">
          {getProductName(product ?? productId)}
        </h3>
        <p className="text-xs text-oboya-blue-dark/60">{sku}</p>
        {variantName ? (
          <p className="text-xs text-oboya-blue-dark/80">
            {t("color")}: {variantName}
          </p>
        ) : null}
        <p className="text-xs text-oboya-green">{t("moq", { count: moq })}</p>
        <p className="mt-1 text-sm text-oboya-blue-dark">
          <span className="font-semibold">{formatShopPrice(unitPrice, currency)}</span>{" "}
          <span className="text-[11px] text-oboya-blue-dark/50">{t("unitPrice")}</span>
        </p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-4 md:contents">
        <QuantityInput
          value={quantity}
          onChange={onUpdateQuantity}
          moq={moq}
          size="md"
          className="md:justify-self-end"
        />
        <div className="flex items-center gap-2 md:justify-self-end">
          <p className="text-right">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-oboya-blue-dark/45">
              {t("lineSubtotal")}
            </span>
            <span className="text-xl font-semibold leading-tight tabular-nums text-oboya-blue-dark">
              {formatShopPrice(unitPrice * quantity, currency)}
            </span>
          </p>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex size-9 items-center justify-center rounded-full text-oboya-blue-dark/50 hover:bg-oboya-soft-white hover:text-oboya-orange"
            aria-label={t("remove")}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
