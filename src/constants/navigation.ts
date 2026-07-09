import type { NavItem } from "@/types";

type Translator = (key: string) => string;

export function getMainNavigation(t: Translator): NavItem[] {
  return [
    {
      label: t("nav.about"),
      href: "/about",
    },
    {
      label: t("nav.caseStudies"),
      href: "/case-studies",
    },
    { label: t("nav.blog"), href: "/blog" },
    { label: t("nav.catalogue"), href: "/catalogue" },
    { label: t("nav.shop"), href: "/shop" },
  ];
}

export function getFooterNavigation(t: Translator) {
  return {
    company: [
      { label: t("footer.aboutUs"), href: "/about" },
      { label: t("footer.caseStudies"), href: "/case-studies" },
      { label: t("footer.workWithUs"), href: "/work-with-us" },
      { label: t("footer.contact"), href: "/contact" },
    ],
    resources: [
      { label: t("footer.catalogue"), href: "/catalogue" },
      { label: t("footer.blog"), href: "/blog" },
      { label: t("footer.faqs"), href: "/faqs" },
    ],
    shop: [
      { label: t("footer.shop"), href: "/shop" },
      { label: t("footer.askForQuotation"), href: "/shop?quote=open" },
    ],
    legal: [
      { label: t("footer.privacy"), href: "/privacy" },
      { label: t("footer.terms"), href: "/terms" },
    ],
  };
}
