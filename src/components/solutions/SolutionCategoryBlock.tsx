import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type SolutionImagePosition = "left" | "right";

export interface SolutionStageLink {
  id: string;
  title: string;
  href: string;
}

export interface SolutionActionLink {
  label: string;
  href: string;
}

const linkFocusClass =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2";

interface SolutionCategoryBlockProps {
  title: string;
  description: string;
  challengesLabel: string;
  challenges: string[];
  stagesLabel: string;
  stages: SolutionStageLink[];
  primaryCta: SolutionActionLink;
  secondaryLinks: SolutionActionLink[];
  imageSrc: string;
  imageAlt: string;
  imagePosition?: SolutionImagePosition;
  showTitle?: boolean;
}

export function SolutionCategoryBlock({
  title,
  description,
  challengesLabel,
  challenges,
  stagesLabel,
  stages,
  primaryCta,
  secondaryLinks,
  imageSrc,
  imageAlt,
  imagePosition = "left",
  showTitle = true,
}: SolutionCategoryBlockProps) {
  const imageLeft = imagePosition === "left";

  return (
  <>
      {showTitle ? (
      <header className="max-w-3xl">
        <h3 className="font-display text-[clamp(1.5rem,2.6vw,2.125rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-oboya-blue-dark">
          {title}
        </h3>
      </header>
      ) : null}

      <div className={cn("max-w-3xl", showTitle ? "mt-6 md:mt-8" : "")}>
        <p className="font-body text-[0.9375rem] leading-[1.7] text-oboya-blue-dark/55 md:text-base">
          {description}
        </p>

        {challenges.length > 0 ? (
          <div className="mt-6 md:mt-7">
            <h4 className="font-display text-base font-semibold tracking-[-0.01em] text-oboya-blue-dark md:text-[1.0625rem]">
              {challengesLabel}
            </h4>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 font-body text-[0.9375rem] leading-[1.65] text-oboya-blue-dark/55 md:text-base">
              {challenges.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-10 grid items-start gap-9 md:mt-12 lg:grid-cols-12 lg:gap-[3.15rem] xl:gap-[3.6rem]">
        <div
          className={cn(
            "flex flex-col lg:col-span-5",
            imageLeft ? "order-2 lg:order-2 lg:col-start-8" : "order-2 lg:order-1 lg:col-start-1"
          )}
        >
          {stages.length > 0 ? (
            <div className="max-w-[25.2rem]">
              <h4 className="font-display text-base font-semibold tracking-[-0.01em] text-oboya-blue-dark md:text-[1.0625rem]">
                {stagesLabel}
              </h4>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 font-body text-[0.9375rem] leading-[1.65] text-oboya-blue-dark/55 md:text-base">
                {stages.map((stage) => (
                  <li key={stage.id}>
                    <Link
                      href={stage.href}
                      className={cn(
                        "font-medium text-oboya-blue-dark underline-offset-2 transition-colors hover:text-oboya-green hover:underline",
                        linkFocusClass
                      )}
                    >
                      {stage.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Link
            href={primaryCta.href}
            className={cn(
              "group mt-6 inline-flex items-center gap-2.5 self-start pt-1.5 text-sm font-semibold tracking-[0.08em] text-oboya-blue-dark uppercase transition-colors hover:text-oboya-blue md:mt-7",
              linkFocusClass
            )}
          >
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-oboya-blue-dark/35 text-oboya-blue-dark transition-colors group-hover:border-oboya-green group-hover:bg-oboya-green group-hover:text-white"
            >
              <ArrowRight className="size-3.5" />
            </span>
            {primaryCta.label}
          </Link>

          {secondaryLinks.length > 0 ? (
            <ul className="mt-4 max-w-[25.2rem] list-disc space-y-1.5 pl-5 font-body text-[0.9375rem] leading-[1.65] text-oboya-blue-dark/55 md:mt-5 md:text-base">
              {secondaryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "font-medium text-oboya-blue-dark underline-offset-2 transition-colors hover:text-oboya-green hover:underline",
                      linkFocusClass
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div
          className={cn(
            "group relative w-full max-w-full lg:col-span-6",
            imageLeft
              ? "order-1 lg:order-1 lg:col-start-1"
              : "order-1 lg:order-2 lg:col-start-7"
          )}
        >
          <div
            className={cn(
              "absolute inset-0 bg-[#e8ebe9]",
              imageLeft
                ? "-translate-x-2.5 translate-y-2.5 sm:-translate-x-[1.125rem] sm:translate-y-[1.125rem] md:-translate-x-[1.35rem] md:translate-y-[1.35rem]"
                : "translate-x-2.5 translate-y-2.5 sm:translate-x-[1.125rem] sm:translate-y-[1.125rem] md:translate-x-[1.35rem] md:translate-y-[1.35rem]"
            )}
            aria-hidden
          />
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-oboya-soft-white">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 90vw, 43vw"
            />
          </div>
        </div>
      </div>
  </>
  );
}
