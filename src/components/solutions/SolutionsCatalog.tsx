"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export type SolutionsCategoryId = "all" | "flowers" | "vegetables" | "fruits";

export interface SolutionsCardData {
  id: string;
  title: string;
  tags: string;
  image: string;
  href: string;
  categories: SolutionsCategoryId[];
}

export interface SolutionsCategoryData {
  id: SolutionsCategoryId;
  label: string;
  title: string;
  description: string;
}

interface SolutionsCatalogProps {
  categories: SolutionsCategoryData[];
  cards: SolutionsCardData[];
}

const linkFocusClass =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2";

function isCategoryId(value: string | null): value is SolutionsCategoryId {
  return (
    value === "all" ||
    value === "flowers" ||
    value === "vegetables" ||
    value === "fruits"
  );
}

export function SolutionsCatalog({ categories, cards }: SolutionsCatalogProps) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [active, setActive] = useState<SolutionsCategoryId>(() =>
    isCategoryId(categoryParam) ? categoryParam : "flowers"
  );

  useEffect(() => {
    if (isCategoryId(categoryParam)) {
      setActive(categoryParam);
    }
  }, [categoryParam]);

  const category = useMemo(
    () => categories.find((item) => item.id === active) ?? categories[0],
    [active, categories]
  );

  const visibleCards = useMemo(() => {
    if (active === "all") return cards;
    return cards.filter(
      (card) =>
        card.categories.includes("all") || card.categories.includes(active)
    );
  }, [active, cards]);

  const sectorHref =
    active !== "all" ? `/solutions/${active}` : null;

  return (
    <section className="bg-white py-[var(--section-y)]">
      <Container>
        <div
          className="flex flex-wrap gap-3"
          role="tablist"
          aria-label="Crop filters"
        >
          {categories.map((item) => {
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(item.id)}
                className={cn(
                  "rounded-full px-7 py-3.5 font-body text-base leading-6 transition-colors md:text-lg",
                  linkFocusClass,
                  isActive
                    ? "bg-oboya-green text-white"
                    : "bg-oboya-soft-white text-oboya-green hover:bg-oboya-green/10"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-12 grid gap-8 lg:mt-14 lg:grid-cols-12 lg:items-start lg:gap-12">
          <h2 className="font-display text-[clamp(1.875rem,4vw,3rem)] font-medium leading-[1.15] tracking-[-0.02em] text-oboya-blue-dark text-pretty lg:col-span-5">
            {category.title}
          </h2>
          <div className="lg:col-span-5 lg:col-start-8 lg:justify-self-end lg:pt-2">
            <p className="max-w-sm font-body text-[0.9375rem] leading-[1.75] text-oboya-blue-dark/55 md:text-base lg:max-w-none">
              {category.description}
            </p>
            {sectorHref ? (
              <Link
                href={sectorHref}
                className={cn(
                  "mt-4 inline-flex text-sm font-semibold text-oboya-blue-dark underline-offset-2 transition-colors hover:text-oboya-green hover:underline",
                  linkFocusClass
                )}
              >
                {category.label} →
              </Link>
            ) : null}
          </div>
        </div>

        <ul className="mt-12 grid list-none gap-x-8 gap-y-10 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
          {visibleCards.map((card) => (
            <li key={card.id}>
              <Link
                href={card.href}
                className={cn(
                  "group flex flex-col gap-3.5 focus-visible:outline-none",
                  linkFocusClass
                )}
              >
                <div className="relative aspect-[391/378] w-full overflow-hidden bg-oboya-soft-white">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-body text-lg font-semibold leading-6 text-oboya-blue-dark transition-colors group-hover:text-oboya-green">
                    {card.title}
                  </h3>
                  <p className="font-body text-xs leading-[19px] text-oboya-blue-dark/55">
                    {card.tags}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
