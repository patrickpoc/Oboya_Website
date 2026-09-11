"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADMIN_LOCALE_OPTIONS,
  ADMIN_LOCALE_SHORT,
} from "@/contexts/AdminLocaleContext";
import type { CmsLocale } from "@/lib/cms/types";
import type { ShopLocalizedText } from "@/lib/shop/types";
import { cn } from "@/lib/utils";

interface ShopLocalizedNameFieldsProps {
  name: string;
  nameI18n: ShopLocalizedText | undefined;
  onNameChange: (name: string) => void;
  onI18nChange: (locale: CmsLocale, value: string) => void;
  className?: string;
  /** When true, omit the default/canonical name field (caller shows it elsewhere). */
  hideDefaultName?: boolean;
}

/**
 * Flat multilingual name editor for shop taxonomy (categories, brands, filter options).
 * Shows default + all locale fields at once — no language tabs.
 */
export function ShopLocalizedNameFields({
  name,
  nameI18n,
  onNameChange,
  onI18nChange,
  className,
  hideDefaultName = false,
}: ShopLocalizedNameFieldsProps) {
  const t = useTranslations("admin.localizedFields");

  return (
    <div className={cn("space-y-2", className)}>
      {!hideDefaultName ? (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("defaultName")}
          </Label>
          <Input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={t("defaultNamePlaceholder")}
          />
        </div>
      ) : null}

      {ADMIN_LOCALE_OPTIONS.map((loc) => {
        const short = ADMIN_LOCALE_SHORT[loc.value];
        return (
          <div key={loc.value} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("nameLocale", { code: short })}
            </Label>
            <Input
              value={nameI18n?.[loc.value] ?? ""}
              onChange={(event) => onI18nChange(loc.value, event.target.value)}
              placeholder={
                loc.value === "en"
                  ? t("requiredPlaceholder")
                  : t("optionalPlaceholder")
              }
            />
          </div>
        );
      })}
    </div>
  );
}
