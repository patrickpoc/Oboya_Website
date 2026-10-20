"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { getMainNavigation } from "@/constants/navigation";
import { Link } from "@/i18n/navigation";
import { useScrollPosition } from "@/hooks/use-scroll-position";
import { cn } from "@/lib/utils";
import {
  LanguageSwitcher,
} from "@/components/layouts/navbar/NavLanguage";
import {
  usePastTransitionMarker,
  useStoryExitHandoff,
} from "@/components/layouts/navbar/useNavChrome";
import { NavDropdown } from "@/components/layouts/navbar/DesktopNav";
import {
  HeroMenuButton,
  MobileNavSheetContent,
} from "@/components/layouts/navbar/MobileNav";

interface NavbarProps {
  transparent?: boolean;
  persistTransparent?: boolean;
  /**
   * Homepage: transparent hero chrome → light full nav after the
   * hero category pill marker (scroll guide only).
   * Storytelling: dark bar over timeline → light home-style bar after exit.
   */
  variant?: "default" | "minimal" | "storytelling";
  /** Solid header palette when not in overlay mode. */
  solidTone?: "light" | "dark";
  /** Element id that ends storytelling (default: about-continue). */
  storyExitId?: string;
}

export function Navbar({
  transparent = true,
  persistTransparent = false,
  variant = "default",
  solidTone = "light",
  storyExitId = "about-continue",
}: NavbarProps) {
  const t = useTranslations();
  const isScrolled = useScrollPosition(40);
  const pastMarker = usePastTransitionMarker("hero");
  const pastStoryExit = useStoryExitHandoff(storyExitId);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isMinimal = variant === "minimal";
  const isStorytelling = variant === "storytelling";
  /** Image 2: light full nav after leaving the hero pill guide */
  const showSolidHome = isMinimal && pastMarker;
  /** Light home-style bar after leaving the storytelling pin */
  const showLightAfterStory = isStorytelling && pastStoryExit;

  const isSolid = isMinimal
    ? showSolidHome
    : isStorytelling
      ? true
      : persistTransparent
        ? false
        : !transparent || isScrolled;
  const isOverlay = !isSolid && (transparent || isMinimal);
  const isDarkSolid = isSolid && solidTone === "dark" && !showLightAfterStory;
  const useLightChrome = isOverlay || isDarkSolid;

  const mainNavigation = getMainNavigation((key) => t(key));
  const leftNav = mainNavigation.slice(0, 3);
  const rightNav = mainNavigation.slice(3);
  const contactLabel = t("nav.contact");

  const lightSolidNav = (
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
              <MobileNavSheetContent
                side="right"
                mainNavigation={mainNavigation}
                contactLabel={contactLabel}
                contactClassName="bg-oboya-blue-dark text-white hover:bg-oboya-blue"
                onNavigate={() => setMobileOpen(false)}
                menuTitle={t("nav.menuTitle")}
              />
            </Sheet>
          </div>
        </div>
      </nav>
    </motion.header>
  );

  /* ——— About storytelling: dark bar → light home-style bar on exit ——— */
  if (isStorytelling) {
    return (
      <>
        <AnimatePresence>
          {!showLightAfterStory && (
            <motion.header
              key="story-dark-nav"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-oboya-blue-dark"
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
                      light
                      align="start"
                    />
                  ))}
                </div>

                <Logo
                  variant="light"
                  priority
                  className="col-start-2 justify-self-center"
                />

                <div className="flex items-center justify-end gap-2 justify-self-end sm:gap-3">
                  <div className="hidden items-center gap-5 lg:flex xl:gap-8">
                    {rightNav.map((item) => (
                      <NavDropdown
                        key={item.href}
                        item={item}
                        light
                        align="end"
                      />
                    ))}
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
                    <LanguageSwitcher light />
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 lg:hidden">
                    <LanguageSwitcher light />
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                      <SheetTrigger
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon",
                          className: "text-white hover:bg-white/10",
                        })}
                        aria-label={t("nav.openMenu")}
                      >
                        <Menu className="size-5" />
                      </SheetTrigger>
                      <MobileNavSheetContent
                        side="right"
                        mainNavigation={mainNavigation}
                        contactLabel={contactLabel}
                        contactClassName="bg-oboya-blue-dark text-white hover:bg-oboya-blue"
                        onNavigate={() => setMobileOpen(false)}
                        menuTitle={t("nav.menuTitle")}
                      />
                    </Sheet>
                  </div>
                </div>
              </nav>
            </motion.header>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLightAfterStory && lightSolidNav}
        </AnimatePresence>
      </>
    );
  }

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
                className="pointer-events-auto grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center px-[var(--nav-padding-x)] md:h-[4.5rem] md:px-8 lg:px-10"
                aria-label={t("nav.mainNav")}
              >
                <div className="min-w-0 justify-self-start">
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
                <div className="min-w-0 justify-self-end">
                  <Link
                    href="/contact"
                    className={buttonVariants({
                      size: "cta",
                      variant: "outline",
                      className:
                        "max-sm:h-8 max-sm:min-h-8 max-sm:px-2.5 max-sm:text-[0.625rem] max-sm:tracking-[0.08em] border-white bg-transparent text-white hover:bg-white/10 hover:text-white",
                    })}
                  >
                    <span className="sm:hidden">{t("footer.contact")}</span>
                    <span className="hidden sm:inline">{contactLabel}</span>
                  </Link>
                </div>
              </nav>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Image 2 — light bar; exits upward when returning to hero */}
        <AnimatePresence>
          {showSolidHome && lightSolidNav}
        </AnimatePresence>
      </>
    );
  }

  /* ——— Default site navbar ——— */
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[100] transition-[background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isSolid
          ? isDarkSolid
            ? "border-b border-white/10 bg-oboya-blue-dark"
            : "border-b border-border/60 bg-white/95 shadow-[var(--shadow-nav)] backdrop-blur-md"
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
              light={useLightChrome}
              align="start"
            />
          ))}
        </div>

        <Logo
          variant={useLightChrome ? "light" : "default"}
          priority
          className="col-start-2 justify-self-center"
        />

        <div className="hidden items-center gap-5 justify-self-end lg:flex xl:gap-8">
          {rightNav.map((item) => (
            <NavDropdown
              key={item.href}
              item={item}
              light={useLightChrome}
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
          <LanguageSwitcher light={useLightChrome} />
        </div>

        <div className="col-start-3 flex items-center justify-end gap-1 sm:gap-2 lg:hidden">
          <LanguageSwitcher light={useLightChrome} />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className={buttonVariants({
                variant: "ghost",
                size: "icon",
                className: cn(
                  useLightChrome && "text-white hover:bg-white/10 hover:text-white"
                ),
              })}
              aria-label={t("nav.openMenu")}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <MobileNavSheetContent
              side="right"
              mainNavigation={mainNavigation}
              contactLabel={contactLabel}
              contactClassName="bg-oboya-green text-white hover:bg-oboya-green/90"
              onNavigate={() => setMobileOpen(false)}
              menuTitle={t("nav.menuTitle")}
            />
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

