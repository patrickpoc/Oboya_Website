"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [displayPath, setDisplayPath] = useState(pathname);
  const [pending, startTransition] = useTransition();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (anchor.target === "_blank") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (!url.pathname.startsWith("/admin")) return;
        if (url.pathname === pathname) return;
      } catch {
        return;
      }

      setNavigating(true);
      setVisible(false);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  useEffect(() => {
    startTransition(() => {
      setDisplayPath(pathname);
      setNavigating(false);
      requestAnimationFrame(() => setVisible(true));
    });
  }, [pathname]);

  const showLoader = navigating || pending || !visible;

  return (
    <div className="relative min-h-[50vh]">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-20 flex items-start justify-center pt-24 transition-opacity duration-200",
          showLoader ? "opacity-100" : "opacity-0"
        )}
        aria-hidden={!showLoader}
        aria-busy={showLoader}
      >
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-white/90 px-6 py-5 shadow-[var(--shadow-card)] backdrop-blur-sm">
          <span
            className="size-8 animate-spin rounded-full border-2 border-oboya-green/25 border-t-oboya-green"
            role="status"
            aria-label="Loading"
          />
          <p className="text-xs font-medium text-muted-foreground">Loading…</p>
        </div>
      </div>

      <div
        key={displayPath}
        className={cn(
          "transition-opacity duration-300 ease-out",
          visible && !navigating ? "opacity-100" : "opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}
