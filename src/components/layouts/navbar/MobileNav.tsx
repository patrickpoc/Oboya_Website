"use client";

import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
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
  onNavigate,
  menuTitle,
}: {
  side?: "left" | "right";
  mainNavigation: NavItem[];
  onNavigate: () => void;
  menuTitle: string;
}) {
  const t = useTranslations();
  const byHref = (href: string) =>
    mainNavigation.find((item) => item.href === href);
  const drawerItems: NavItem[] = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.aboutUs"), href: "/about", children: byHref("/about")?.children },
    { label: t("nav.solutions"), href: "/solutions", children: byHref("/solutions")?.children },
    { label: t("nav.caseStudies"), href: "/case-studies", children: byHref("/case-studies")?.children },
    { label: t("nav.blog"), href: "/blog", children: byHref("/blog")?.children },
    { label: t("nav.newsroom"), href: "/news" },
    { label: t("nav.joinUs"), href: "/work" },
    { label: t("nav.contactUs"), href: "/contact" },
  ];

  return (
    <SheetContent
      side={side}
      className="z-[110] w-full max-w-sm gap-0 overflow-hidden p-0"
      overlayClassName="z-[110]"
    >
      <SheetTitle className="sr-only">{menuTitle}</SheetTitle>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-14 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
          <nav className="flex flex-col" aria-label={menuTitle}>
            {drawerItems.map((item) => (
              <MobileNavLink
                key={item.href}
                item={item}
                onNavigate={onNavigate}
              />
            ))}
            <LanguageSwitcherMobile onNavigate={onNavigate} />
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
  tone = "light",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mainNavigation: NavItem[];
  /** "light" = white outline (dark/transparent chrome); "dark" = blue-dark outline (light chrome). */
  tone?: "light" | "dark";
}) {
  const t = useTranslations();
  const onLight = tone === "dark";
  const bar = onLight ? "bg-oboya-blue-dark" : "bg-white";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
          onLight
            ? "border-oboya-blue-dark/70 text-oboya-blue-dark hover:bg-oboya-blue-dark/5 focus-visible:outline-oboya-blue-dark"
            : "border-white/80 text-white hover:bg-white/10 focus-visible:outline-white"
        )}
        aria-label={t("nav.openMenu")}
      >
        <span className="flex w-4 flex-col gap-1.5" aria-hidden>
          <span className={cn("h-px w-full", bar)} />
          <span className={cn("h-px w-full", bar)} />
        </span>
      </SheetTrigger>
      <MobileNavSheetContent
        side="left"
        mainNavigation={mainNavigation}
        onNavigate={() => onOpenChange(false)}
        menuTitle={t("nav.menuTitle")}
      />
    </Sheet>
  );
}
