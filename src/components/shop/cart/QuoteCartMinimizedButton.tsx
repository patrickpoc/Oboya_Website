"use client";

import { motion } from "framer-motion";
import { ChevronUp, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  desktopChipMotion,
  desktopChipTransition,
  mobileFabMotion,
  mobileFadeTransition,
} from "@/components/shop/cart/quote-cart-transitions";
import { cn } from "@/lib/utils";

interface QuoteCartMinimizedButtonProps {
  itemCount: number;
  onClick: () => void;
  variant?: "desktop" | "mobile";
  className?: string;
}

export function QuoteCartMinimizedButton({
  itemCount,
  onClick,
  variant = "desktop",
  className,
}: QuoteCartMinimizedButtonProps) {
  const t = useTranslations("shop");
  const isMobile = variant === "mobile";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...(isMobile ? mobileFabMotion : desktopChipMotion)}
      transition={isMobile ? mobileFadeTransition : desktopChipTransition}
      aria-label={t("expandQuoteList")}
      className={cn(
        "fixed right-4 bottom-4 z-40 shadow-[0_8px_32px_rgb(1_32_63/22%)]",
        isMobile
          ? "flex size-14 items-center justify-center rounded-full bg-oboya-green text-white lg:hidden"
          : "hidden items-center gap-2 rounded-full border border-oboya-green/20 bg-white px-4 py-2.5 lg:flex",
        className
      )}
    >
      <ShoppingBag
        className={cn(isMobile ? "size-5 text-white" : "size-4 text-oboya-green")}
        aria-hidden
      />

      {!isMobile && (
        <>
          <span className="text-sm font-semibold text-oboya-blue-dark">
            {t("quoteList")}
          </span>
          <ChevronUp className="size-4 text-oboya-green" aria-hidden />
        </>
      )}

      {itemCount > 0 && (
        <span
          className={cn(
            "font-bold text-oboya-green",
            isMobile
              ? "absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-white text-[10px]"
              : "rounded-full bg-oboya-green/10 px-2 py-0.5 text-xs font-medium"
          )}
        >
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </motion.button>
  );
}
