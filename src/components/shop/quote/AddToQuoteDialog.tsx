"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { useProductName } from "@/lib/shop/use-product-name";
import { isGlobalMarket } from "@/lib/shop/global-market";
import { getProductMoq } from "@/lib/shop/quantity";
import {
  getActiveVariant,
  getVariantDisplayName,
  hasColorVariants,
  resolveVariantImage,
  resolveVariantPrice,
  resolveVariantSku,
  toCartVariantId,
} from "@/lib/shop/color-variants";
import { RfqBadge } from "@/components/shop/product/RfqBadge";
import { getEffectiveSaleMode } from "@/lib/shop/sale-mode";
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
  const locale = useLocale();
  const {
    addToQuoteProductId,
    addToQuoteVariantId,
    closeAddToQuoteDialog,
    addItem,
    setCountry,
    currency,
    isAllCountries,
    countries,
    getProductById,
    shopConfig,
  } = useShop();
  const getProductName = useProductName();
  const [quantity, setQuantity] = useState(1);
  const [pickedCode, setPickedCode] = useState("");

  const product = addToQuoteProductId
    ? getProductById(addToQuoteProductId)
    : null;
  const moq = getProductMoq(product, addToQuoteVariantId);
  const activeVariant =
    product && hasColorVariants(product)
      ? getActiveVariant(product, addToQuoteVariantId)
      : null;

  useEffect(() => {
    if (!addToQuoteProductId) return;
    const nextProduct = getProductById(addToQuoteProductId);
    queueMicrotask(() => {
      setQuantity(getProductMoq(nextProduct, addToQuoteVariantId));
      setPickedCode("");
    });
  }, [addToQuoteProductId, addToQuoteVariantId, getProductById]);

  if (!addToQuoteProductId || !product) {
    return null;
  }

  const name = getProductName(product as Parameters<typeof getProductName>[0]);
  const isQuote = getEffectiveSaleMode(product) === "quote";
  // Under All countries the quote needs a market: only the ones this product is sold in.
  const marketOptions = isAllCountries
    ? countries.filter((country) => {
        const enabledMap = product.enabledCountries ?? product.availability;
        return (
          Boolean(enabledMap[country.code]) &&
          (isQuote || resolveVariantPrice(product, activeVariant, country.defaultCurrency) > 0)
        );
      })
    : [];
  const picked = marketOptions.find((country) => country.code === pickedCode);
  const quoteCurrency = isAllCountries ? (picked?.defaultCurrency ?? null) : currency;
  const unitPrice = quoteCurrency
    ? resolveVariantPrice(product, activeVariant, quoteCurrency)
    : 0;
  const imageSrc = resolveVariantImage(product, activeVariant);
  const displaySku = resolveVariantSku(product, activeVariant);

  const handleConfirm = () => {
    const productId = product.id;
    const variantId = toCartVariantId(addToQuoteVariantId);
    const qty = quantity;
    if (isAllCountries) {
      if (!picked) return;
      // Keep filters and search; the quote list was empty under All countries.
      setCountry(picked.code, { keepListing: true });
    }
    closeAddToQuoteDialog();
    // Let Base UI release scroll lock before cart sheet acquires it.
    window.setTimeout(() => {
      addItem(productId, qty, variantId);
    }, 0);
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
              src={imageSrc}
              alt={name}
              fill
              unoptimized
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-oboya-blue-dark">{name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{displaySku}</p>
            {activeVariant ? (
              <p className="mt-1 text-xs text-oboya-blue-dark">
                {t("colorLabel")}: {getVariantDisplayName(activeVariant, locale)}
              </p>
            ) : null}
            <p className="mt-2 text-xs font-medium text-oboya-green">
              {t("moq", { count: moq })}
            </p>
            {isQuote ? (
              <RfqBadge size="compact" className="mt-2" />
            ) : quoteCurrency && (
              <p className="mt-1 text-sm font-medium text-oboya-blue-dark">
                {formatShopPrice(unitPrice, quoteCurrency)}
              </p>
            )}
          </div>
        </div>

        {isAllCountries ? (
          <div className="space-y-2">
            <Label htmlFor="quote-country">{t("quoteCountryLabel")}</Label>
            {marketOptions.length > 0 ? (
              <>
                <select
                  id="quote-country"
                  value={pickedCode}
                  onChange={(event) => setPickedCode(event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-oboya-blue-dark shadow-sm"
                >
                  <option value="" disabled>
                    {t("chooseCountry")}
                  </option>
                  {marketOptions.map((country) => (
                    <option key={country.code} value={country.code}>
                      {isGlobalMarket(country.code, shopConfig.market.globalCountryCode)
                        ? t("globalMarket")
                        : country.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{t("quoteCountryHint")}</p>
              </>
            ) : (
              <p className="text-xs text-destructive">{t("quoteCountryUnavailable")}</p>
            )}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="quote-quantity">{t("quantity")}</Label>
          <QuantityInput
            id="quote-quantity"
            value={quantity}
            onChange={setQuantity}
            moq={moq}
            showQuickIncrements
          />
          {quoteCurrency && !isQuote && quantity > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("lineTotal")}: {formatShopPrice(unitPrice * quantity, quoteCurrency)}
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
            disabled={isAllCountries && !picked}
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
