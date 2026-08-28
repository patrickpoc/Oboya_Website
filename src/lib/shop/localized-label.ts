import type { ShopLocalizedText } from "@/lib/shop/types";

export function pickLocalizedLabel(
  locale: string,
  name: string,
  localized?: ShopLocalizedText
) {
  const key = locale as keyof ShopLocalizedText;
  const value = localized?.[key]?.trim();
  if (value) return value;
  const en = localized?.en?.trim();
  if (en) return en;
  return name;
}
