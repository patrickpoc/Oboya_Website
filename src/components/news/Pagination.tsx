"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  prevLabel?: string;
  nextLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  prevLabel = "Previous page",
  nextLabel = "Next page",
}: PaginationProps) {
  const t = useTranslations("common");
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label={t("a11y.pagination")}
      className={cn("flex items-center justify-center gap-2", className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label={prevLabel}
        className="flex size-9 items-center justify-center rounded-full border border-oboya-green bg-white text-oboya-green transition-colors hover:bg-oboya-green hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-green disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          aria-label={t("a11y.pageNumber", { page })}
          aria-current={page === currentPage ? "page" : undefined}
          className={cn(
            "flex size-9 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-green",
            page === currentPage
              ? "bg-oboya-green text-white"
              : "bg-white text-oboya-green hover:bg-oboya-green/15"
          )}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label={nextLabel}
        className="flex size-9 items-center justify-center rounded-full border border-oboya-green bg-white text-oboya-green transition-colors hover:bg-oboya-green hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-green disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
