import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { shopBadgeClass } from "@/components/shop/product/RfqBadge";

interface LocalPriceBadgeProps {
  size?: "compact" | "regular";
  className?: string;
}

/** Replaces the price under All countries when a product has no USD price. */
export function LocalPriceBadge({ size = "regular", className }: LocalPriceBadgeProps) {
  const t = useTranslations("shop");
  const compact = size === "compact";
  return (
    <span className={shopBadgeClass(compact, className)}>
      <Globe aria-hidden className={compact ? "size-3" : "size-4"} />
      {t("localPriceOnly")}
    </span>
  );
}
