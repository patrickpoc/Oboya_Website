"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface BlogFeaturedHeroProps {
  slug: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  date: string;
  author: string;
  featuredLabel: string;
  readMoreLabel: string;
  image?: string;
  className?: string;
}

export function BlogFeaturedHero({
  slug,
  title,
  excerpt,
  categoryLabel,
  date,
  author,
  featuredLabel,
  readMoreLabel,
  image,
  className,
}: BlogFeaturedHeroProps) {
  return (
    <article
      className={cn(
        "group grid overflow-hidden bg-white shadow-[var(--shadow-card)] md:grid-cols-2",
        className
      )}
    >
      <div className="relative aspect-[16/10] bg-oboya-blue-dark/10 md:aspect-auto md:min-h-[22rem]">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 50vw"
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
        <p className="mt-3 text-xs font-semibold tracking-[0.14em] text-oboya-blue uppercase">
          {categoryLabel}
        </p>
        <h2 className="mt-4 font-display text-2xl leading-tight font-black tracking-tight text-oboya-blue-dark text-balance md:text-3xl lg:text-4xl">
          {title}
        </h2>
        {excerpt && (
          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            {excerpt}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {author && <span>{author}</span>}
          {author && date && <span aria-hidden>·</span>}
          {date && <time>{date}</time>}
        </div>
        <Link
          href={`/blog/${slug}`}
          className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-oboya-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-oboya-green/90"
        >
          {readMoreLabel}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
