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
    <article className="grid grid-cols-12 items-center gap-x-3 gap-y-3 sm:gap-x-5 md:gap-x-7 lg:gap-x-10">
      <div
        className={cn(
          "relative col-span-12 min-w-0 sm:col-span-6",
          !imageLeft && "sm:col-start-7"
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-[#e8ebe9]",
            imageLeft
              ? "translate-x-[-0.3rem] translate-y-[0.3rem] sm:translate-x-[-0.5rem] sm:translate-y-[0.5rem] md:translate-x-[-0.7rem] md:translate-y-[0.7rem]"
              : "translate-x-[-0.3rem] translate-y-[0.3rem] sm:translate-x-[0.5rem] sm:translate-y-[0.5rem] md:translate-x-[0.7rem] md:translate-y-[0.7rem]"
          )}
          aria-hidden
        />
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-oboya-soft-white sm:aspect-[4/3]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 38vw"
          />
        </div>
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-col col-span-12 sm:col-span-6",
          imageLeft ? "sm:col-start-7" : "sm:col-start-1 sm:row-start-1"
        )}
      >
        <h3 className="max-w-[20rem] font-display text-[clamp(0.95rem,1.7vw,1.35rem)] font-semibold leading-[1.3] tracking-[-0.02em] text-oboya-blue-dark text-pretty">
          {title}
        </h3>
        <div
          className="mt-2.5 h-px w-10 bg-oboya-orange sm:mt-3 sm:w-12"
          aria-hidden
        />
        <div className="mt-2.5 flex max-w-[20rem] flex-col gap-1.5 font-display text-[0.7rem] font-normal leading-[1.55] tracking-normal text-oboya-blue-dark/55 sm:mt-3 sm:gap-2 sm:text-[0.75rem] sm:leading-[1.6] md:text-[0.8125rem] md:leading-[1.65]">
          {paragraphs.filter(Boolean).map((paragraph, index) => (
            <p key={index} className="line-clamp-3 sm:line-clamp-4">
              {paragraph}
            </p>
          ))}
        </div>
        <Link
          href={href}
          className="group mt-2.5 inline-flex items-center gap-1.5 self-start text-[0.6rem] font-semibold tracking-[0.08em] text-oboya-blue-dark uppercase transition-colors hover:text-oboya-blue sm:mt-3 sm:text-[0.65rem] md:mt-3.5 md:gap-2 md:text-[0.75rem]"
        >
          <span
            aria-hidden
            className="flex size-5 shrink-0 items-center justify-center rounded-full border border-oboya-blue-dark/35 text-oboya-blue-dark transition-colors group-hover:border-oboya-green group-hover:bg-oboya-green group-hover:text-white"
          >
            <ArrowRight className="size-2.5" />
          </span>
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}
