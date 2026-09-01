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
    <article className="grid items-center gap-9 lg:grid-cols-12 lg:gap-[3.15rem] xl:gap-[3.6rem]">
      <div
        className={cn(
          "flex flex-col lg:col-span-5",
          imageLeft ? "order-2 lg:order-2 lg:col-start-8" : "order-2 lg:order-1 lg:col-start-1"
        )}
      >
        <h3 className="max-w-[25.2rem] font-display text-[clamp(1.35rem,2.35vw,1.9rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-oboya-blue-dark">
          {title}
        </h3>
        <div className="mt-[1.35rem] flex max-w-[25.2rem] flex-col gap-3.5 font-body text-[0.84375rem] leading-[1.7] text-oboya-blue-dark/55 md:text-[0.9rem]">
          {paragraphs.filter(Boolean).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <Link
          href={href}
          className="group mt-7 inline-flex items-center gap-2.5 self-start pt-1.5 text-sm font-semibold tracking-[0.08em] text-oboya-blue-dark uppercase transition-colors hover:text-oboya-blue"
        >
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-oboya-blue-dark/35 text-oboya-blue-dark transition-colors group-hover:border-oboya-green group-hover:bg-oboya-green group-hover:text-white"
          >
            <ArrowRight className="size-3.5" />
          </span>
          {ctaLabel}
        </Link>
      </div>

      <div
        className={cn(
          "relative w-full max-w-full lg:col-span-6",
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
            className="object-cover"
            sizes="(max-width: 1024px) 90vw, 43vw"
          />
        </div>
      </div>
    </article>
  );
}
