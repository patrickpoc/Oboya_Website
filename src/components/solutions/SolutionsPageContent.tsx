import { getTranslations } from "next-intl/server";
import { SolutionsHero } from "@/components/solutions/SolutionsHero";
import { SolutionsPageBackdrop } from "@/components/solutions/SolutionsPageBackdrop";
import {
  SolutionsCatalog,
  type SolutionsCardData,
  type SolutionsCategoryData,
  type SolutionsCategoryId,
} from "@/components/solutions/SolutionsCatalog";
import { SolutionsCta } from "@/components/solutions/SolutionsCta";
import {
  SOLUTIONS_HERO_IMAGES,
  uniqueSolutionImages,
} from "@/lib/solutions/hero-images";

const CARD_META: {
  id: string;
  href: string;
  image: string;
  categories: SolutionsCategoryId[];
}[] = [
  {
    id: "propagation",
    href: "/solutions/propagation",
    image: "/assets/homepage/capabilities-value-chain.jpg",
    categories: ["all", "flowers", "vegetables", "fruits"],
  },
  {
    id: "growing",
    href: "/solutions/propagation",
    image: "/assets/homepage/capabilities-global-local.jpg",
    categories: ["all", "flowers", "vegetables", "fruits"],
  },
  {
    id: "harvest",
    href: "/solutions/packaging",
    image: "/assets/homepage/solutions-integrated.jpg",
    categories: ["all", "flowers", "vegetables", "fruits"],
  },
  {
    id: "postharvest",
    href: "/solutions/packaging",
    image: "/assets/homepage/capabilities-global-local.jpg",
    categories: ["all", "flowers", "vegetables", "fruits"],
  },
  {
    id: "transport",
    href: "/solutions/distribution",
    image: "/assets/homepage/solutions-logistics.jpg",
    categories: ["all", "flowers", "vegetables", "fruits"],
  },
  {
    id: "retail",
    href: "/solutions/distribution",
    image: "/assets/homepage/solutions-global.jpg",
    categories: ["all", "flowers", "vegetables", "fruits"],
  },
  {
    id: "automation",
    href: "/solutions/machinery-automation",
    image: "/assets/homepage/greenhouse-technology.webp",
    categories: ["all", "flowers", "vegetables", "fruits"],
  },
];

const CATEGORY_IDS: SolutionsCategoryId[] = [
  "all",
  "flowers",
  "vegetables",
  "fruits",
];

export async function SolutionsPageContent() {
  const t = await getTranslations("solutionsPage");

  const categories: SolutionsCategoryData[] = CATEGORY_IDS.map((id) => ({
    id,
    label: t(`filters.${id}`),
    title: t(`categories.${id}.title`),
    description: t(`categories.${id}.description`),
  }));

  const cards: SolutionsCardData[] = CARD_META.map((card) => ({
    ...card,
    title: t(`cards.${card.id}.title`),
    tags: t(`cards.${card.id}.tags`),
  }));

  const heroImages = uniqueSolutionImages([
    ...SOLUTIONS_HERO_IMAGES,
    ...CARD_META.map((card) => card.image),
  ]);

  return (
    <SolutionsPageBackdrop images={heroImages} alt={t("heroHeadline")}>
      <SolutionsHero
        headline={t("heroHeadline")}
        tagline={t("heroTagline")}
        body={t("heroBody")}
        accent={t("heroAccent")}
        images={heroImages}
        usePageBackdrop
      />
      <SolutionsCatalog categories={categories} cards={cards} />
      <SolutionsCta
        title={t("ctaTitle")}
        description={t("ctaDescription")}
        buttonLabel={t("ctaButton")}
        sharedBackdrop
      />
    </SolutionsPageBackdrop>
  );
}
