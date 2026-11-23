import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface BlogFeaturedHeroProps {
  slug: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  featuredLabel: string;
  readMoreLabel: string;
  image?: string;
  /** Detail route prefix; defaults to the blog. */
  basePath?: string;
  className?: string;
}

export function BlogFeaturedHero({
  slug,
  title,
  excerpt,
  categoryLabel,
  featuredLabel,
  readMoreLabel,
  image,
  basePath = "/blog",
  className,
}: BlogFeaturedHeroProps) {
  return (
    <article
      className={cn(
        "group grid overflow-hidden bg-white shadow-[var(--shadow-subtle)] md:grid-cols-[45fr_55fr]",
        className
      )}
    >
      <div className="relative aspect-[16/10] bg-oboya-blue-dark/10 md:aspect-auto md:min-h-[20rem]">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 45vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-oboya-blue-dark/30 to-oboya-green/30" />
        )}
      </div>

      <div className="flex flex-col justify-center p-6 md:p-10 lg:p-12">
        <p className="text-xs font-semibold tracking-[0.14em] text-oboya-green uppercase">
          {featuredLabel}
        </p>
        <p className="mt-3 text-sm text-oboya-blue-light">{categoryLabel}</p>
        <h2 className="mt-2 font-display text-xl leading-snug font-semibold text-oboya-blue-dark text-balance md:text-2xl lg:text-[1.75rem]">
          {title}
        </h2>
        {excerpt && (
          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-oboya-blue-dark/70 md:text-base">
            {excerpt}
          </p>
        )}
        <Link
          href={`${basePath}/${slug}`}
          className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-oboya-green hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oboya-green"
        >
          {readMoreLabel}
          <span className="sr-only">: {title}</span>
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
