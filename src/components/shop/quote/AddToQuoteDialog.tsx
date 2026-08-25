"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { useProductName } from "@/lib/shop/use-product-name";
import { getProductMoq } from "@/lib/shop/quantity";
import { formatShopPrice } from "@/lib/shop/format-price";
import { QuantityInput } from "@/components/shop/QuantityInput";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function AddToQuoteDialog() {
  const t = useTranslations("shop");
  const {
    addToQuoteProductId,
    closeAddToQuoteDialog,
    addItem,
    currency,
    getProductById,
  } = useShop();
  const getProductName = useProductName();
  const [quantity, setQuantity] = useState(1);

  const product = addToQuoteProductId
    ? getProductById(addToQuoteProductId)
    : null;
  const moq = getProductMoq(product);

  useEffect(() => {
    if (!addToQuoteProductId) return;
    const nextProduct = getProductById(addToQuoteProductId);
    queueMicrotask(() => {
      setQuantity(getProductMoq(nextProduct));
    });
  }, [addToQuoteProductId, getProductById]);

  if (!product) {
    return (
      <Dialog
        open={Boolean(addToQuoteProductId)}
        onOpenChange={(open) => !open && closeAddToQuoteDialog()}
      />
    );
  }

  const name = getProductName(product as Parameters<typeof getProductName>[0]);
  const unitPrice = currency ? (product.prices[currency] ?? 0) : 0;

  const handleConfirm = () => {
    addItem(product.id, quantity);
    closeAddToQuoteDialog();
  };

  return (
    <Dialog
      open={Boolean(addToQuoteProductId)}
      onOpenChange={(open) => !open && closeAddToQuoteDialog()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addToQuoteDialogTitle")}</DialogTitle>
          <DialogDescription>{t("addToQuoteDialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-oboya-soft-white">
            <Image
              src={product.images[0]}
              alt={name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-oboya-blue-dark">{name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{product.sku}</p>
            <p className="mt-2 text-xs font-medium text-oboya-green">
              {t("moq", { count: moq })}
            </p>
            {currency && (
              <p className="mt-1 text-sm font-medium text-oboya-blue-dark">
                {formatShopPrice(unitPrice, currency)}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quote-quantity">{t("quantity")}</Label>
          <QuantityInput
            id="quote-quantity"
            value={quantity}
            onChange={setQuantity}
            moq={moq}
            showQuickIncrements
          />
          {currency && quantity > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("lineTotal")}: {formatShopPrice(unitPrice * quantity, currency)}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={closeAddToQuoteDialog}
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={buttonVariants({
              className:
                "rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            {t("confirmAddToQuote")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
