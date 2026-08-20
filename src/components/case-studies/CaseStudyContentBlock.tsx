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
    <article className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-16">
      <div
        className={cn(
          "flex flex-col lg:col-span-5",
          imageLeft ? "order-2 lg:order-2 lg:col-start-8" : "order-2 lg:order-1 lg:col-start-1"
        )}
      >
        <h3 className="max-w-md font-display text-[clamp(1.5rem,2.6vw,2.125rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-oboya-blue-dark">
          {title}
        </h3>
        <div className="mt-6 flex max-w-md flex-col gap-4 font-body text-[0.9375rem] leading-[1.7] text-oboya-blue-dark/55 md:text-base">
          {paragraphs.filter(Boolean).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <Link
          href={href}
          className="group mt-8 inline-flex items-center gap-3 self-start pt-2 text-sm font-semibold tracking-[0.08em] text-oboya-blue-dark uppercase transition-colors hover:text-oboya-blue"
        >
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-oboya-blue-dark/35 text-oboya-blue-dark transition-colors group-hover:border-oboya-green group-hover:bg-oboya-green group-hover:text-white"
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
              ? "-translate-x-3 translate-y-3 sm:-translate-x-5 sm:translate-y-5 md:-translate-x-6 md:translate-y-6"
              : "translate-x-3 translate-y-3 sm:translate-x-5 sm:translate-y-5 md:translate-x-6 md:translate-y-6"
          )}
          aria-hidden
        />
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-oboya-soft-white">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 48vw"
          />
        </div>
      </div>
    </article>
  );
}
