"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface AdminLoadingOverlayProps {
  active: boolean;
  /** Full viewport (account bootstrap) vs content area — both pin to the visible screen */
  variant?: "content" | "fullscreen";
  label?: string;
  className?: string;
}

export function AdminLoadingOverlay({
  active,
  variant = "content",
  label,
  className,
}: AdminLoadingOverlayProps) {
  const t = useTranslations("admin.common");
  const text = label ?? t("loading");

  return (
    <div
      className={cn(
        // Fixed to the user's viewport so the spinner stays centered where they are looking
        "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ease-out",
        variant === "fullscreen" ? "lg:pl-0" : "lg:pl-64",
        active
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
        className
      )}
      aria-hidden={!active}
      aria-busy={active}
      role="status"
    >
      {/* Minimal liquid-glass wash */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-oboya-soft-white/35 backdrop-blur-[2px] backdrop-saturate-125",
          "supports-[backdrop-filter]:bg-white/20"
        )}
      />
      <div
        className={cn(
          "relative flex flex-col items-center gap-2.5 rounded-2xl px-6 py-5",
          "border border-white/45 bg-white/50 shadow-[0_8px_32px_rgb(1_32_63/10%)]",
          "backdrop-blur-md backdrop-saturate-150",
          "ring-1 ring-oboya-blue-dark/5"
        )}
      >
        <span
          className="size-8 animate-spin rounded-full border-2 border-oboya-blue/15 border-t-oboya-green"
          aria-hidden
        />
        <p className="text-xs font-medium tracking-wide text-oboya-blue-dark/65">{text}</p>
        <span className="sr-only">{text}</span>
      </div>
    </div>
  );
}
