"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { getMainNavigation } from "@/constants/navigation";
import { Link } from "@/i18n/navigation";
import { useScrollPosition } from "@/hooks/use-scroll-position";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";
import {
  LanguageSwitcher,
  LanguageSwitcherMobile,
} from "@/components/layouts/LanguageSwitcher";

interface NavbarProps {
  transparent?: boolean;
}

function NavDropdown({
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
    light ? "text-white/90 hover:text-white" : "text-oboya-blue-dark hover:text-oboya-green"
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
          className={cn("size-4 transition-transform duration-200", open && "rotate-180")}
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

function MobileNavLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  return (
    <div className="border-b border-border/60 py-4 first:pt-0">
      <Link
        href={item.href}
        onClick={onNavigate}
        className="block text-lg font-semibold text-oboya-blue-dark"
      >
        {item.label}
      </Link>
      {item.children && (
        <div className="mt-3 flex flex-col gap-2 pl-3 sm:pl-4">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onNavigate}
              className="text-sm text-muted-foreground transition-colors hover:text-oboya-green"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navbar({ transparent = true }: NavbarProps) {
  const t = useTranslations();
  const isScrolled = useScrollPosition(40);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isSolid = !transparent || isScrolled;

  const mainNavigation = getMainNavigation((key) => t(key));
  const leftNav = mainNavigation.slice(0, 3);
  const rightNav = mainNavigation.slice(3);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isSolid
          ? "border-b border-border/60 bg-white/95 shadow-[var(--shadow-nav)] backdrop-blur-md"
          : "border-b border-white/15 bg-oboya-blue-dark/55 shadow-[0_4px_30px_rgb(1_32_63/25%)] backdrop-blur-xl"
      )}
    >
      <nav
        className="grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center px-[var(--nav-padding-x)] md:h-20"
        aria-label={t("nav.mainNav")}
      >
        <div className="hidden items-center gap-5 justify-self-start lg:flex xl:gap-8">
          {leftNav.map((item) => (
            <NavDropdown key={item.href} item={item} light={!isSolid} align="start" />
          ))}
        </div>

        <Logo
          variant={isSolid ? "default" : "light"}
          priority
          className="col-start-2 justify-self-center"
        />

        <div className="hidden items-center gap-5 justify-self-end lg:flex xl:gap-8">
          {rightNav.map((item) => (
            <NavDropdown key={item.href} item={item} light={!isSolid} align="end" />
          ))}
          <Link
            href="/contact"
            className={buttonVariants({
              className:
                "rounded-full bg-oboya-green px-6 text-white hover:bg-oboya-green/90",
            })}
          >
            {t("nav.contact")}
          </Link>
          <LanguageSwitcher light={!isSolid} />
        </div>

        <div className="col-start-3 flex items-center justify-end gap-1 sm:gap-2 lg:hidden">
          <LanguageSwitcher light={!isSolid} />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className={buttonVariants({
                  variant: "ghost",
                  size: "icon",
                  className: cn(!isSolid && "text-white hover:bg-white/10 hover:text-white"),
                })}
                aria-label={t("nav.openMenu")}
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full max-w-sm overflow-y-auto px-6 pt-14 pb-8 sm:px-8"
              >
                <SheetTitle className="sr-only">{t("nav.menuTitle")}</SheetTitle>
                <div className="flex flex-col">
                  {mainNavigation.map((item) => (
                    <MobileNavLink
                      key={item.href}
                      item={item}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
                  <LanguageSwitcherMobile onNavigate={() => setMobileOpen(false)} />
                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className={buttonVariants({
                      className:
                        "mt-6 w-full rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
                    })}
                  >
                    {t("nav.contact")}
                  </Link>
                </div>
              </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
