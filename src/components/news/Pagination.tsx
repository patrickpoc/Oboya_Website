"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-2", className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label={prevLabel}
        className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-white text-muted-foreground transition-colors hover:border-oboya-blue/40 hover:text-oboya-blue disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          aria-label={`Page ${page}`}
          aria-current={page === currentPage ? "page" : undefined}
          className={cn(
            "flex size-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
            page === currentPage
              ? "border border-oboya-blue bg-white text-oboya-blue-dark"
              : "text-muted-foreground hover:text-oboya-blue-dark"
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
        className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-white text-muted-foreground transition-colors hover:border-oboya-blue/40 hover:text-oboya-blue disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
