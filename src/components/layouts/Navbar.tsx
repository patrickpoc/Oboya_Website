"use client";

import { useEffect, useState } from "react";
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
  persistTransparent?: boolean;
  /**
   * Homepage: transparent hero chrome → light full nav after the
   * hero category pill marker (scroll guide only).
   */
  variant?: "default" | "minimal";
}

/**
 * Bidirectional: solid when the hero pill guide reaches the top band;
 * back to transparent when scrolling up into the hero again.
 */
function usePastTransitionMarker(elementId = "hero") {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const update = () => {
      const el = document.getElementById(elementId);
      if (!el) {
        setPast(false);
        return;
      }
      // Mid-hero: solid nav when the hero's vertical center crosses the top
      const rect = el.getBoundingClientRect();
      setPast(rect.top + rect.height * 0.5 < 0);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [elementId]);

  return past;
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

function MobileNavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
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

function HeroMenuButton({
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
      <SheetContent
        side="left"
        className="w-full max-w-sm overflow-y-auto px-6 pt-14 pb-8 sm:px-8"
      >
        <SheetTitle className="sr-only">{t("nav.menuTitle")}</SheetTitle>
        <div className="flex flex-col">
          {mainNavigation.map((item) => (
            <MobileNavLink
              key={item.href}
              item={item}
              onNavigate={() => onOpenChange(false)}
            />
          ))}
          <LanguageSwitcherMobile onNavigate={() => onOpenChange(false)} />
          <Link
            href="/contact"
            onClick={() => onOpenChange(false)}
            className={buttonVariants({
              size: "cta",
              className:
                "mt-6 w-full bg-oboya-blue-dark text-white hover:bg-oboya-blue",
            })}
          >
            {contactLabel}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Navbar({
  transparent = true,
  persistTransparent = false,
  variant = "default",
}: NavbarProps) {
  const t = useTranslations();
  const isScrolled = useScrollPosition(40);
  const pastMarker = usePastTransitionMarker("hero");
  const [mobileOpen, setMobileOpen] = useState(false);

  const isMinimal = variant === "minimal";
  /** Image 2: light full nav after leaving the hero pill guide */
  const showSolidHome = isMinimal && pastMarker;

  const isSolid = isMinimal
    ? showSolidHome
    : persistTransparent
      ? false
      : !transparent || isScrolled;
  const isOverlay = !isSolid && (transparent || isMinimal);

  const mainNavigation = getMainNavigation((key) => t(key));
  const leftNav = mainNavigation.slice(0, 3);
  const rightNav = mainNavigation.slice(3);
  const contactLabel = t("nav.contact");

  /* ——— Homepage: transparent (img 1) → light full nav (img 2) ——— */
  if (isMinimal) {
    return (
      <>
        {/* Image 1 — transparent over hero (returns when scrolling back up) */}
        <AnimatePresence>
          {!showSolidHome && (
            <motion.header
              key="hero-nav"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none fixed inset-x-0 top-0 z-50 bg-transparent"
            >
              <nav
                className="pointer-events-auto grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-5 md:h-[4.5rem] md:px-8 lg:px-10"
                aria-label={t("nav.mainNav")}
              >
                <div className="justify-self-start">
                  <HeroMenuButton
                    open={mobileOpen}
                    onOpenChange={setMobileOpen}
                    mainNavigation={mainNavigation}
                    contactLabel={contactLabel}
                  />
                </div>
                <Logo
                  variant="light"
                  priority
                  className="col-start-2 justify-self-center"
                />
                <div className="justify-self-end">
                  <Link
                    href="/contact"
                    className={buttonVariants({
                      size: "cta",
                      variant: "outline",
                      className:
                        "border-white bg-transparent text-white hover:bg-white/10 hover:text-white",
                    })}
                  >
                    {contactLabel}
                  </Link>
                </div>
              </nav>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Image 2 — light bar; exits upward when returning to hero */}
        <AnimatePresence>
          {showSolidHome && (
            <motion.header
              key="solid-nav"
              initial={{ y: "-110%" }}
              animate={{ y: 0 }}
              exit={{ y: "-110%" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-0 z-50 border-b border-oboya-blue-dark/8 bg-oboya-soft-white shadow-[var(--shadow-nav)]"
            >
              <nav
                className="grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center px-[var(--nav-padding-x)] md:h-20"
                aria-label={t("nav.mainNav")}
              >
                <div className="hidden items-center gap-5 justify-self-start lg:flex xl:gap-8">
                  {leftNav.map((item) => (
                    <NavDropdown
                      key={item.href}
                      item={item}
                      light={false}
                      align="start"
                    />
                  ))}
                </div>

                <Logo
                  variant="default"
                  priority
                  className="col-start-2 justify-self-center"
                />

                <div className="flex items-center justify-end gap-2 justify-self-end sm:gap-3">
                  <div className="hidden items-center gap-5 lg:flex xl:gap-8">
                    {rightNav.map((item) => (
                      <NavDropdown
                        key={item.href}
                        item={item}
                        light={false}
                        align="end"
                      />
                    ))}
                    <Link
                      href="/contact"
                      className={buttonVariants({
                        size: "cta",
                        className:
                          "bg-oboya-blue-dark text-white hover:bg-oboya-blue",
                      })}
                    >
                      {contactLabel}
                    </Link>
                    <LanguageSwitcher light={false} />
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 lg:hidden">
                    <LanguageSwitcher light={false} />
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                      <SheetTrigger
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon",
                          className: "text-oboya-blue-dark",
                        })}
                        aria-label={t("nav.openMenu")}
                      >
                        <Menu className="size-5" />
                      </SheetTrigger>
                      <SheetContent
                        side="right"
                        className="w-full max-w-sm overflow-y-auto px-6 pt-14 pb-8 sm:px-8"
                      >
                        <SheetTitle className="sr-only">
                          {t("nav.menuTitle")}
                        </SheetTitle>
                        <div className="flex flex-col">
                          {mainNavigation.map((item) => (
                            <MobileNavLink
                              key={item.href}
                              item={item}
                              onNavigate={() => setMobileOpen(false)}
                            />
                          ))}
                          <LanguageSwitcherMobile
                            onNavigate={() => setMobileOpen(false)}
                          />
                          <Link
                            href="/contact"
                            onClick={() => setMobileOpen(false)}
                            className={buttonVariants({
                              size: "cta",
                              className:
                                "mt-6 w-full bg-oboya-blue-dark text-white hover:bg-oboya-blue",
                            })}
                          >
                            {contactLabel}
                          </Link>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </nav>
            </motion.header>
          )}
        </AnimatePresence>
      </>
    );
  }

  /* ——— Default site navbar ——— */
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isSolid
          ? "border-b border-border/60 bg-white/95 shadow-[var(--shadow-nav)] backdrop-blur-md"
          : persistTransparent
            ? "border-b border-transparent bg-transparent"
            : "border-b border-white/12 bg-oboya-blue-dark/40 shadow-[0_4px_30px_rgb(1_32_63/20%)] backdrop-blur-2xl backdrop-saturate-150"
      )}
    >
      <nav
        className="grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center px-[var(--nav-padding-x)] md:h-20"
        aria-label={t("nav.mainNav")}
      >
        <div className="hidden items-center gap-5 justify-self-start lg:flex xl:gap-8">
          {leftNav.map((item) => (
            <NavDropdown
              key={item.href}
              item={item}
              light={isOverlay}
              align="start"
            />
          ))}
        </div>

        <Logo
          variant={isOverlay ? "light" : "default"}
          priority
          className="col-start-2 justify-self-center"
        />

        <div className="hidden items-center gap-5 justify-self-end lg:flex xl:gap-8">
          {rightNav.map((item) => (
            <NavDropdown
              key={item.href}
              item={item}
              light={isOverlay}
              align="end"
            />
          ))}
          <Link
            href="/contact"
            className={buttonVariants({
              size: "cta",
              className: "bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            {contactLabel}
          </Link>
          <LanguageSwitcher light={isOverlay} />
        </div>

        <div className="col-start-3 flex items-center justify-end gap-1 sm:gap-2 lg:hidden">
          <LanguageSwitcher light={isOverlay} />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className={buttonVariants({
                variant: "ghost",
                size: "icon",
                className: cn(
                  isOverlay && "text-white hover:bg-white/10 hover:text-white"
                ),
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
                <LanguageSwitcherMobile
                  onNavigate={() => setMobileOpen(false)}
                />
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className={buttonVariants({
                    size: "cta",
                    className:
                      "mt-6 w-full bg-oboya-green text-white hover:bg-oboya-green/90",
                  })}
                >
                  {contactLabel}
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
