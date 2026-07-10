"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  slug: string;
  title: string;
  categoryLabel: string;
  date: string;
  image?: string;
  className?: string;
}

export function NewsCard({
  slug,
  title,
  categoryLabel,
  date,
  image,
  className,
}: NewsCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-none bg-white shadow-[var(--shadow-subtle)] transition-shadow hover:shadow-[var(--shadow-card)]",
        className
      )}
    >
      <Link href={`/news/${slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/10] bg-oboya-blue-dark/10">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-oboya-blue-dark/20 to-oboya-green/20" />
          )}
        </div>

        <div className="flex flex-1 flex-col p-5 md:p-6">
          <p className="text-xs font-semibold tracking-[0.14em] text-oboya-blue uppercase">
            {categoryLabel}
          </p>
          <h2 className="mt-3 flex-1 text-base font-semibold leading-snug text-oboya-blue-dark md:text-lg">
            {title}
          </h2>
          <div className="mt-5 flex items-center justify-between gap-4">
            <time className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {date}
            </time>
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-oboya-blue/30 text-oboya-blue transition-colors group-hover:border-oboya-green group-hover:bg-oboya-green group-hover:text-white"
            >
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
