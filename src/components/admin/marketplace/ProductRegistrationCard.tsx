"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LocalizedFieldGrid } from "@/components/admin/marketplace/LocalizedFieldGrid";
import { RegistrationSection } from "@/components/admin/marketplace/RegistrationSection";
import { PRODUCT_EDITOR_SELECT_CLASS } from "@/components/admin/marketplace/product-editor.constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsLocale } from "@/lib/cms/types";

interface ProductRegistrationCardProps {
  product: CmsProduct;
  currencies: string[];
  currenciesLoading?: boolean;
  onUpdate: (patch: Partial<CmsProduct>) => void;
}

export function ProductRegistrationCard({
  product,
  currencies,
  currenciesLoading = false,
  onUpdate,
}: ProductRegistrationCardProps) {
  const t = useTranslations("admin.products.editor");

  const setCurrencyPrice = (currency: string, value: string) => {
    const nextPrices = { ...product.prices };
    if (value.trim() === "") {
      delete nextPrices[currency];
    } else {
      nextPrices[currency] = Number(value);
    }
    onUpdate({ prices: nextPrices });
  };

  const updateName = (locale: CmsLocale, value: string) => {
    onUpdate({ name: { ...product.name, [locale]: value } });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>{t("registrationTitle")}</CardTitle>
        <CardDescription>{t("registrationDescription")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <RegistrationSection
          title={t("productName")}
          description={t("productNameHint")}
          isFirst
        >
          <LocalizedFieldGrid
            label={t("name")}
            value={product.name}
            onChange={updateName}
            placeholder={t("namePlaceholder")}
          />
        </RegistrationSection>

        <RegistrationSection title={t("skuMoq")} description={t("skuMoqHint")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="product-sku">{t("sku")}</Label>
              <Input
                id="product-sku"
                value={product.sku}
                onChange={(e) => onUpdate({ sku: e.target.value })}
                placeholder={t("skuPlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-moq">{t("moq")}</Label>
              <Input
                id="product-moq"
                type="number"
                min={1}
                value={product.moq}
                onChange={(e) => onUpdate({ moq: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
          </div>
        </RegistrationSection>

        <RegistrationSection title={t("price")} description={t("priceHint")}>
          {currenciesLoading ? (
            <p className="text-sm text-muted-foreground">{t("loadingCurrencies")}</p>
          ) : currencies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("noCurrencies")}{" "}
              <Link
                href="/admin/marketplace/currencies"
                className="text-oboya-green underline-offset-2 hover:underline"
              >
                {t("addCurrenciesLink")}
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-3 rounded-lg bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {currencies.map((currency) => (
                <div key={currency} className="space-y-1.5">
                  <Label htmlFor={`price-${currency}`}>{currency}</Label>
                  <Input
                    id={`price-${currency}`}
                    type="number"
                    min={0}
                    value={product.prices[currency] ?? ""}
                    onChange={(e) => setCurrencyPrice(currency, e.target.value)}
                    placeholder={t("priceHidden")}
                  />
                </div>
              ))}
            </div>
          )}
        </RegistrationSection>

        <RegistrationSection title={t("stock")} description={t("stockHint")}>
          <div className="grid gap-3 rounded-lg bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="product-stock-status">{t("stockStatus")}</Label>
              <select
                id="product-stock-status"
                value={product.stockStatus}
                onChange={(e) =>
                  onUpdate({ stockStatus: e.target.value as CmsProduct["stockStatus"] })
                }
                className={PRODUCT_EDITOR_SELECT_CLASS}
              >
                <option value="in_stock">{t("stockInStock")}</option>
                <option value="limited">{t("stockLimited")}</option>
                <option value="on_request">{t("stockOnRequest")}</option>
              </select>
            </div>

            <div className="flex items-end gap-2 pb-2">
              <input
                id="unlimited-stock"
                type="checkbox"
                className="size-4 rounded border-input"
                checked={product.unlimitedStock}
                onChange={(e) => onUpdate({ unlimitedStock: e.target.checked })}
              />
              <Label htmlFor="unlimited-stock">{t("unlimitedStock")}</Label>
            </div>

            {!product.unlimitedStock && (
              <div className="space-y-1.5">
                <Label htmlFor="product-stock-quantity">{t("stockQuantity")}</Label>
                <Input
                  id="product-stock-quantity"
                  type="number"
                  min={0}
                  value={product.stockQuantity ?? 0}
                  onChange={(e) =>
                    onUpdate({ stockQuantity: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </div>
            )}
          </div>
        </RegistrationSection>
      </CardContent>
    </Card>
  );
}
