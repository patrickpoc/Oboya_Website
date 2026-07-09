"use client";

import { LayoutGrid, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { cn } from "@/lib/utils";

export function ViewSwitcher({ className }: { className?: string }) {
  const t = useTranslations("shop");
  const { viewMode, setViewMode, countryCode } = useShop();

  return (
    <div className={cn("flex flex-col", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {t("viewMode")}
      </span>
      <div className="flex h-10 rounded-lg border border-border bg-white p-1 shadow-sm">
        <button
          type="button"
          disabled={!countryCode}
          onClick={() => setViewMode("grid")}
          className={cn(
            "flex flex-1 items-center justify-center rounded-md transition-colors",
            viewMode === "grid"
              ? "bg-oboya-green/10 text-oboya-blue-dark"
              : "text-muted-foreground hover:text-oboya-blue-dark",
            !countryCode && "opacity-50"
          )}
          aria-label={t("viewGrid")}
          aria-pressed={viewMode === "grid"}
        >
          <LayoutGrid className="size-4" />
        </button>
        <button
          type="button"
          disabled={!countryCode}
          onClick={() => setViewMode("list")}
          className={cn(
            "flex flex-1 items-center justify-center rounded-md transition-colors",
            viewMode === "list"
              ? "bg-oboya-green/10 text-oboya-blue-dark"
              : "text-muted-foreground hover:text-oboya-blue-dark",
            !countryCode && "opacity-50"
          )}
          aria-label={t("viewList")}
          aria-pressed={viewMode === "list"}
        >
          <List className="size-4" />
        </button>
      </div>
    </div>
  );
}
