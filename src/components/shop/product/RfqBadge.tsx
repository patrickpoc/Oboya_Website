import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface RfqBadgeProps {
  size?: "compact" | "regular";
  className?: string;
}

/** Replaces the price for products sold on request (never show a price for them). */
export function RfqBadge({ size = "regular", className }: RfqBadgeProps) {
  const t = useTranslations("shop");
  const compact = size === "compact";
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-oboya-blue/25 bg-oboya-blue/10 font-semibold text-oboya-blue",
        compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-sm",
        className
      )}
    >
      <FileText aria-hidden className={compact ? "size-3" : "size-4"} />
      {t("rfqBadge")}
    </span>
  );
}
