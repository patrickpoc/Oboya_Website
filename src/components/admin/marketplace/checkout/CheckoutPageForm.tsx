"use client";

import type { CheckoutPageSettings } from "@/lib/cms/checkout-page/types";
import type { ShopLocalizedText } from "@/lib/shop/types";

const LOCALES = ["en", "pt-BR", "es", "zh-CN"] as const;

const COPY_FIELDS: Array<{
  key: keyof CheckoutPageSettings["copy"];
  label: string;
}> = [
  { key: "greetingI18n", label: "Greeting ({country})" },
  { key: "freightTitleI18n", label: "Freight title" },
  { key: "freightHintI18n", label: "Freight hint" },
  { key: "freightUnavailableI18n", label: "Freight unavailable" },
  { key: "couponTitleI18n", label: "Coupon title" },
  { key: "couponUnavailableI18n", label: "Coupon unavailable" },
  { key: "trustI18n", label: "Trust line" },
  { key: "emptyTitleI18n", label: "Empty title" },
  { key: "emptyBodyI18n", label: "Empty body" },
];

function setLocalized(
  current: ShopLocalizedText,
  locale: (typeof LOCALES)[number],
  value: string
): ShopLocalizedText {
  return { ...current, [locale]: value };
}

export function CheckoutPageForm({
  value,
  onChange,
}: {
  value: CheckoutPageSettings;
  onChange: (next: CheckoutPageSettings) => void;
}) {
  const toggle = (key: keyof CheckoutPageSettings["sections"]) => {
    onChange({
      ...value,
      sections: { ...value.sections, [key]: !value.sections[key] },
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-oboya-blue-dark">Sections</h2>
        {(
          [
            ["greeting", "Greeting"],
            ["freight", "Freight card"],
            ["coupon", "Coupon card"],
            ["upsell", "Upsell"],
            ["trust", "Trust note"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.sections[key]}
              onChange={() => toggle(key)}
            />
            {label}
          </label>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-oboya-blue-dark">Upsell count</span>
          <input
            type="number"
            min={1}
            max={8}
            value={value.upsell.maxItems}
            onChange={(event) =>
              onChange({
                ...value,
                upsell: { ...value.upsell, maxItems: Number(event.target.value) },
              })
            }
            className="h-10 w-full rounded-lg border border-border px-3"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-oboya-blue-dark">Upsell category id</span>
          <input
            value={value.upsell.categoryId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                upsell: {
                  ...value.upsell,
                  categoryId: event.target.value.trim() ? event.target.value : null,
                },
              })
            }
            className="h-10 w-full rounded-lg border border-border px-3"
            placeholder="Optional"
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-oboya-blue-dark">SEO</h2>
        {LOCALES.map((locale) => (
          <div key={locale} className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>{locale} title</span>
              <input
                value={value.seo.titleI18n[locale] ?? ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    seo: {
                      ...value.seo,
                      titleI18n: setLocalized(value.seo.titleI18n, locale, event.target.value),
                    },
                  })
                }
                className="h-10 w-full rounded-lg border border-border px-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>{locale} description</span>
              <input
                value={value.seo.descriptionI18n[locale] ?? ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    seo: {
                      ...value.seo,
                      descriptionI18n: setLocalized(
                        value.seo.descriptionI18n,
                        locale,
                        event.target.value
                      ),
                    },
                  })
                }
                className="h-10 w-full rounded-lg border border-border px-3"
              />
            </label>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-oboya-blue-dark">Copy</h2>
        <p className="text-xs text-oboya-blue-dark/60">
          Leave a field blank to use the built-in translation.
        </p>
        {COPY_FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <h3 className="text-sm font-medium text-oboya-blue-dark">{field.label}</h3>
            {LOCALES.map((locale) => (
              <label key={locale} className="block space-y-1 text-sm">
                <span className="text-oboya-blue-dark/60">{locale}</span>
                <input
                  value={value.copy[field.key][locale] ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      copy: {
                        ...value.copy,
                        [field.key]: setLocalized(
                          value.copy[field.key],
                          locale,
                          event.target.value
                        ),
                      },
                    })
                  }
                  className="h-10 w-full rounded-lg border border-border px-3"
                />
              </label>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
