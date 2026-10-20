"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

export function NavDropdown({
  item,
  light,
  align = "start",
}: {
  item: NavItem;
  light?: boolean;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);

  const linkClass = cn(
    "text-sm font-medium transition-colors",
    light
      ? "text-white/90 hover:text-white"
      : "text-oboya-blue-dark hover:text-oboya-green"
  );

  if (!item.children?.length) {
    return (
      <Link href={item.href} className={linkClass}>
        {item.label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={cn("flex items-center gap-1", linkClass)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {item.label}
        <ChevronDown
          className={cn(
            "size-4 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute top-full z-50 mt-3 w-[22rem] max-w-[min(22rem,calc(100vw-2.5rem))] rounded-xl border border-border bg-white p-2 shadow-[var(--shadow-card)]",
              align === "end" ? "right-0" : "left-0"
            )}
          >
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className="block rounded-lg px-4 py-3 transition-colors hover:bg-oboya-soft-white"
              >
                <span className="block text-sm font-semibold text-oboya-blue-dark">
                  {child.label}
                </span>
                {child.description && (
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {child.description}
                  </span>
                )}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
