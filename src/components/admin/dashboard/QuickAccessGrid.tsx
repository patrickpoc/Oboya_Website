"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Settings2, Star, X } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { adminNavigation, type AdminNavItem } from "@/lib/cms/navigation";
import type { CmsModule } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "oboya-admin-quick-access";

function getTopLevelNav(items: AdminNavItem[]): (AdminNavItem & { module: CmsModule; resolvedHref: string })[] {
  return items
    .filter((item): item is AdminNavItem & { module: CmsModule } => !!item.module && item.module !== "dashboard")
    .map((item) => ({
      ...item,
      resolvedHref: item.href ?? item.children?.[0]?.href ?? `/admin/${item.module.replace(/_/g, "-")}`,
    }));
}

function loadPinned(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${userId}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function savePinned(userId: string, hrefs: string[]) {
  localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(hrefs));
}

export function QuickAccessGrid() {
  const { user, can } = useAdmin();
  const [pinnedHrefs, setPinnedHrefs] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = loadPinned(user.id);
    setPinnedHrefs(new Set(stored));
    setMounted(true);
  }, [user.id]);

  const allItems = getTopLevelNav(adminNavigation).filter(
    (item) => can(item.module, "view")
  );

  const togglePin = useCallback(
    (href: string) => {
      setPinnedHrefs((prev) => {
        const next = new Set(prev);
        if (next.has(href)) next.delete(href);
        else next.add(href);
        savePinned(user.id, Array.from(next));
        return next;
      });
    },
    [user.id]
  );

  const visibleItems = pinnedHrefs.size > 0
    ? allItems.filter((item) => pinnedHrefs.has(item.resolvedHref))
    : allItems;

  if (!mounted) return null;

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-oboya-blue-dark">Quick Access</h2>
          <p className="text-xs text-muted-foreground">
            {pinnedHrefs.size > 0
              ? `${pinnedHrefs.size} pinned shortcut${pinnedHrefs.size !== 1 ? "s" : ""}`
              : "All available sections"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80"
        >
          <Settings2 className="size-3.5" />
          Customize
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isPinned = pinnedHrefs.has(item.resolvedHref);
          const childCount = item.children?.length ?? 0;

          return (
            <Link
              key={item.resolvedHref}
              href={item.resolvedHref}
              className="group relative flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-white px-4 text-center shadow-[var(--shadow-card)] transition-all hover:border-oboya-green/30 hover:shadow-lg"
            >
              {Icon && (
                <div className="flex size-14 items-center justify-center rounded-xl bg-oboya-green/10 text-oboya-green transition-colors group-hover:bg-oboya-green group-hover:text-white">
                  <Icon className="size-7" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-oboya-blue-dark">
                  {item.label}
                </p>
                {childCount > 0 && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {childCount} section{childCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              {isPinned && (
                <Star className="absolute top-3 right-3 size-3.5 fill-oboya-green/60 text-oboya-green/60" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Customize drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-oboya-blue-dark/30"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-white shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-white px-5 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-oboya-blue-dark">
                    Customize Quick Access
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Toggle sections on or off
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              <ul className="divide-y divide-border/50 px-5">
                {allItems.map((item) => {
                  const Icon = item.icon;
                  const isPinned = pinnedHrefs.has(item.resolvedHref);
                  const childCount = item.children?.length ?? 0;

                  return (
                    <li key={item.resolvedHref} className="py-3">
                      <label className="flex cursor-pointer items-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isPinned}
                          onClick={() => togglePin(item.resolvedHref)}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                            isPinned ? "bg-oboya-green" : "bg-gray-200"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform",
                              isPinned ? "translate-x-[18px]" : "translate-x-[3px]"
                            )}
                          />
                        </button>
                        {Icon && (
                          <div className={cn(
                            "flex size-8 items-center justify-center rounded-lg",
                            isPinned ? "bg-oboya-green/10 text-oboya-green" : "bg-muted text-muted-foreground"
                          )}>
                            <Icon className="size-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            "text-sm font-medium",
                            isPinned ? "text-oboya-blue-dark" : "text-muted-foreground"
                          )}>
                            {item.label}
                          </p>
                          {childCount > 0 && (
                            <p className="text-[11px] text-muted-foreground">
                              {childCount} section{childCount !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-border/50 px-5 py-4">
                <p className="text-[11px] text-muted-foreground">
                  When no shortcuts are pinned, all sections are shown by default.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
