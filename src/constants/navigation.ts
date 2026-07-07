import type { NavItem } from "@/types";

type Translator = (key: string) => string;

export function getMainNavigation(t: Translator): NavItem[] {
  return [
    {
      label: t("nav.solutions"),
      href: "/solutions",
      children: [
        {
          label: t("nav.solutionsVegetables"),
          href: "/solutions/vegetables",
          description: t("nav.solutionsVegetablesDesc"),
        },
        {
          label: t("nav.solutionsFlowers"),
          href: "/solutions/flowers",
          description: t("nav.solutionsFlowersDesc"),
        },
        {
          label: t("nav.solutionsFruits"),
          href: "/solutions/fruits",
          description: t("nav.solutionsFruitsDesc"),
        },
      ],
    },
    {
      label: t("nav.products"),
      href: "/products",
      children: [
        {
          label: t("nav.productsGrowingMedia"),
          href: "/products/growing-media",
          description: t("nav.productsGrowingMediaDesc"),
        },
        {
          label: t("nav.productsPackaging"),
          href: "/products/packaging",
          description: t("nav.productsPackagingDesc"),
        },
        {
          label: t("nav.productsEquipment"),
          href: "/products/equipment",
          description: t("nav.productsEquipmentDesc"),
        },
      ],
    },
    { label: t("nav.catalogue"), href: "/catalogue" },
    { label: t("nav.about"), href: "/about" },
  ];
}

export function getFooterNavigation(t: Translator) {
  return {
    company: [
      { label: t("footer.aboutUs"), href: "/about" },
      { label: t("footer.careers"), href: "/careers" },
      { label: t("footer.contact"), href: "/contact" },
    ],
    solutions: [
      { label: t("footer.vegetables"), href: "/solutions/vegetables" },
      { label: t("footer.flowers"), href: "/solutions/flowers" },
      { label: t("footer.fruits"), href: "/solutions/fruits" },
    ],
    legal: [
      { label: t("footer.privacy"), href: "/privacy" },
      { label: t("footer.terms"), href: "/terms" },
    ],
  };
}
