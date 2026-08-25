"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { useProductName } from "@/lib/shop/use-product-name";
import { getProductMoq } from "@/lib/shop/quantity";
import { formatShopPrice } from "@/lib/shop/format-price";
import { QuantityInput } from "@/components/shop/QuantityInput";

const FALLBACK_IMAGE = "/assets/homepage/greenhouse-technology.webp";

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
  const { getProductById } = useShop();
  const product = getProductById(productId);
  const moq = getProductMoq(product);
  const imageSrc = image || product?.images[0] || FALLBACK_IMAGE;

  return (
    <article className="flex gap-3 border-b border-border/40 py-3 last:border-0">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-oboya-soft-white">
        <Image
          src={imageSrc}
          alt={getProductName(product ?? productId)}
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-oboya-blue-dark">
          {getProductName(product ?? productId)}
        </h4>
        <p className="text-[11px] text-muted-foreground">{sku}</p>
        <p className="text-[10px] text-oboya-green">{t("moq", { count: moq })}</p>
        <p className="mt-1 text-xs font-medium text-oboya-blue-dark">
          {formatShopPrice(unitPrice * quantity, currency)}
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
