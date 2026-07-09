"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg";
}

export function FormDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "md",
}: FormDrawerProps) {
  if (!open) return null;

  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-oboya-blue-dark/30"
        onClick={onClose}
        aria-label="Close"
      />
      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl",
          widths[width]
        )}
      >
        <div className="flex items-start justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-oboya-blue-dark">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-border/60 px-5 py-4">{footer}</div>
        )}
      </aside>
    </div>
  );
}
