"use client";

import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";
import { LanguageSwitcherMobile } from "@/components/layouts/navbar/NavLanguage";

export function MobileNavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  return (
    <div className="border-b border-border/60 py-4">
      <Link
        href={item.href}
        onClick={onNavigate}
        className="block text-lg leading-snug font-semibold text-oboya-blue-dark"
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

export function MobileNavSheetContent({
  side = "right",
  mainNavigation,
  contactLabel,
  contactClassName,
  onNavigate,
  menuTitle,
}: {
  side?: "left" | "right";
  mainNavigation: NavItem[];
  contactLabel: string;
  contactClassName: string;
  onNavigate: () => void;
  menuTitle: string;
}) {
  return (
    <SheetContent
      side={side}
      className="w-full max-w-sm gap-0 overflow-hidden p-0"
    >
      <SheetTitle className="sr-only">{menuTitle}</SheetTitle>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-14 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
          <nav className="flex flex-col" aria-label={menuTitle}>
            {mainNavigation.map((item) => (
              <MobileNavLink
                key={item.href}
                item={item}
                onNavigate={onNavigate}
              />
            ))}
            <LanguageSwitcherMobile onNavigate={onNavigate} />
            <Link
              href="/contact"
              onClick={onNavigate}
              className={buttonVariants({
                size: "cta",
                className: cn("mt-6 w-full", contactClassName),
              })}
            >
              {contactLabel}
            </Link>
          </nav>
        </div>
      </div>
    </SheetContent>
  );
}

export function HeroMenuButton({
  open,
  onOpenChange,
  mainNavigation,
  contactLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mainNavigation: NavItem[];
  contactLabel: string;
}) {
  const t = useTranslations();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        className="inline-flex size-10 items-center justify-center rounded-md border border-white/80 text-white transition-colors hover:bg-white/10"
        aria-label={t("nav.openMenu")}
      >
        <span className="flex w-4 flex-col gap-1.5" aria-hidden>
          <span className="h-px w-full bg-white" />
          <span className="h-px w-full bg-white" />
        </span>
      </SheetTrigger>
      <MobileNavSheetContent
        side="left"
        mainNavigation={mainNavigation}
        contactLabel={contactLabel}
        contactClassName="bg-oboya-blue-dark text-white hover:bg-oboya-blue"
        onNavigate={() => onOpenChange(false)}
        menuTitle={t("nav.menuTitle")}
      />
    </Sheet>
  );
}
