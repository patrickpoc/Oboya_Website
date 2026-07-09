"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { getProductById } from "@/lib/shop/catalog";
import { useProductName } from "@/lib/shop/use-product-name";
import { getProductMoq } from "@/lib/shop/quantity";
import { QuantityInput } from "@/components/shop/QuantityInput";

interface CartItemProps {
  productId: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  image: string;
  sku: string;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItemRow({
  productId,
  quantity,
  unitPrice,
  currency,
  image,
  sku,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const t = useTranslations("shop");
  const getProductName = useProductName();
  const product = getProductById(productId);
  const moq = getProductMoq(product);

  return (
    <article className="flex gap-3 border-b border-border/40 py-3 last:border-0">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-oboya-soft-white">
        <Image
          src={image}
          alt={getProductName(productId)}
          fill
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-oboya-blue-dark">
          {getProductName(productId)}
        </h4>
        <p className="text-[11px] text-muted-foreground">{sku}</p>
        <p className="text-[10px] text-oboya-green">{t("moq", { count: moq })}</p>
        <p className="mt-1 text-xs font-medium text-oboya-blue-dark">
          {currency} {(unitPrice * quantity).toFixed(2)}
        </p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <QuantityInput
            value={quantity}
            onChange={onUpdateQuantity}
            moq={moq}
            size="sm"
          />
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 pb-1 text-[11px] text-muted-foreground hover:text-oboya-green"
          >
            {t("remove")}
          </button>
        </div>
      </div>
    </article>
  );
}
