import { cn } from "@/lib/utils";

export const PAGE_INTRO_HERO_SECTION_CLASS =
  "relative min-h-[calc((100svh-4rem)/2)] overflow-hidden bg-oboya-blue-dark md:min-h-[calc((100svh-5rem)/2)]";

/** Horizontal + vertical padding for half-viewport intro banners. */
export const PAGE_INTRO_INNER_CLASS =
  "relative z-10 flex min-h-[inherit] w-full flex-col items-center justify-center px-[clamp(2.75rem,11vw,6.5rem)] py-[clamp(1.5rem,3.5vw,2.25rem)] pt-16 md:pt-20";

/** Nudge content left to align with the extended hairline. */
export const PAGE_INTRO_OFFSET_X = "ml-[calc((100%-100vw)/4)]";

/** Stretch hairline / body to match the offset alignment. */
export const PAGE_INTRO_STRETCH_W = "w-[calc(100%+(100vw-100%)/2)]";

interface PageIntroBannerProps {
  title: string;
  body: string;
  /** Optional lead line above the title (kept for pages that already show it). */
  lead?: string;
  className?: string;
  titleAs?: "h1" | "h2";
}

/**
 * Shared dark intro banner — same layout language as the Solutions hero text block
 * (half-viewport, centered stack, extended hairline, stretched body).
 */
export function PageIntroBanner({
  title,
  body,
  lead,
  className,
  titleAs = "h1",
}: PageIntroBannerProps) {
  const TitleTag = titleAs;

  return (
    <section className={cn(PAGE_INTRO_HERO_SECTION_CLASS, className)}>
      <div className={PAGE_INTRO_INNER_CLASS}>
        <div className="w-full max-w-[var(--container-max)] text-left">
          {lead ? (
            <p
              className={cn(
                PAGE_INTRO_OFFSET_X,
                "mb-3 font-body text-[clamp(0.875rem,1.15vw,1rem)] font-normal leading-[1.55] text-white/85 md:mb-3.5"
              )}
            >
              {lead}
            </p>
          ) : null}

          <TitleTag
            className={cn(
              PAGE_INTRO_OFFSET_X,
              "font-display text-[clamp(1.375rem,2.4vw,1.875rem)] font-medium leading-[1.2] tracking-[-0.01em] text-white text-pretty"
            )}
          >
            {title}
          </TitleTag>

          <div
            className={cn(
              PAGE_INTRO_OFFSET_X,
              PAGE_INTRO_STRETCH_W,
              "mt-3 h-px bg-white md:mt-3.5"
            )}
            aria-hidden
          />

          <p
            className={cn(
              PAGE_INTRO_OFFSET_X,
              PAGE_INTRO_STRETCH_W,
              "mt-5 font-body text-[clamp(0.875rem,1.15vw,1rem)] font-normal leading-[1.55] text-white md:mt-6 md:leading-[1.6]"
            )}
          >
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}
