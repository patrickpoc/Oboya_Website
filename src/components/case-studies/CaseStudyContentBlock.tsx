import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type CaseStudyImagePosition = "left" | "right";

interface CaseStudyContentBlockProps {
  title: string;
  paragraphs: string[];
  imageSrc: string;
  imageAlt: string;
  href: string;
  ctaLabel: string;
  imagePosition?: CaseStudyImagePosition;
}

export function CaseStudyContentBlock({
  title,
  paragraphs,
  imageSrc,
  imageAlt,
  href,
  ctaLabel,
  imagePosition = "left",
}: CaseStudyContentBlockProps) {
  const imageLeft = imagePosition === "left";

  return (
    <article className="grid grid-cols-12 items-center gap-x-4 gap-y-0 sm:gap-x-6 md:gap-x-9 lg:gap-x-[3.15rem] xl:gap-x-[3.6rem]">
      <div
        className={cn(
          "relative col-span-7 min-w-0 col-start-1 lg:col-span-6",
          !imageLeft && "lg:col-start-7"
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-[#e8ebe9]",
            imageLeft
              ? "translate-x-[-0.4rem] translate-y-[0.4rem] sm:translate-x-[-0.75rem] sm:translate-y-[0.75rem] md:translate-x-[-1.1rem] md:translate-y-[1.1rem]"
              : "translate-x-[-0.4rem] translate-y-[0.4rem] sm:translate-x-[-0.75rem] sm:translate-y-[0.75rem] md:translate-x-[-1.1rem] md:translate-y-[1.1rem] lg:translate-x-[1.1rem] lg:translate-y-[1.1rem]"
          )}
          aria-hidden
        />
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-oboya-soft-white">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 55vw, 43vw"
          />
        </div>
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-col col-span-5 col-start-8 lg:col-span-6",
          imageLeft ? "lg:col-start-7" : "lg:col-start-1 lg:row-start-1"
        )}
      >
        <h3 className="max-w-[25.2rem] font-display text-[clamp(0.875rem,2.5vw,1.9rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-oboya-blue-dark lg:text-[clamp(1.35rem,2.35vw,1.9rem)]">
          {title}
        </h3>
        <div className="mt-2 flex max-w-[25.2rem] flex-col gap-1.5 font-body text-[0.65rem] leading-[1.5] text-oboya-blue-dark/55 sm:mt-2.5 sm:gap-2.5 sm:text-[0.75rem] sm:leading-[1.55] md:mt-[1.35rem] md:gap-3.5 md:text-[0.84375rem] md:leading-[1.7] lg:text-[0.9rem]">
          {paragraphs.filter(Boolean).map((paragraph, index) => (
            <p key={index} className="line-clamp-4 sm:line-clamp-5">
              {paragraph}
            </p>
          ))}
        </div>
        <Link
          href={href}
          className="group mt-2.5 inline-flex items-center gap-1.5 self-start pt-0.5 text-[0.6rem] font-semibold tracking-[0.08em] text-oboya-blue-dark uppercase transition-colors hover:text-oboya-blue sm:mt-3 sm:text-[0.65rem] md:mt-7 md:gap-2.5 md:pt-1.5 md:text-sm"
        >
          <span
            aria-hidden
            className="flex size-5 shrink-0 items-center justify-center rounded-full border border-oboya-blue-dark/35 text-oboya-blue-dark transition-colors group-hover:border-oboya-green group-hover:bg-oboya-green group-hover:text-white sm:size-7"
          >
            <ArrowRight className="size-2.5 sm:size-3.5" />
          </span>
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}
