import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  slug: string;
  title: string;
  categoryLabel: string;
  date: string;
  image?: string;
  /** Detail route prefix; defaults to the blog. */
  basePath?: string;
  className?: string;
}

export function BlogCard({ slug, title, categoryLabel, date, image, basePath = "/blog", className }: BlogCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden bg-white shadow-[var(--shadow-subtle)] transition-shadow hover:shadow-[var(--shadow-card)]",
        className
      )}
    >
      <Link
        href={`${basePath}/${slug}`}
        className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-oboya-green"
      >
        <div className="relative aspect-[4/3] bg-oboya-blue-dark/10">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-oboya-blue-dark/20 to-oboya-green/20" />
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="text-sm text-oboya-blue-light">{categoryLabel}</p>
          <h2 className="mt-2 line-clamp-3 text-base leading-snug font-medium text-oboya-blue-dark md:text-lg">
            {title}
          </h2>
          <div className="mt-auto flex items-center justify-between gap-4 pt-5">
            <time className="text-xs font-medium tracking-wide text-oboya-blue-dark uppercase">
              {date}
            </time>
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-oboya-green text-oboya-green transition-colors group-hover:bg-oboya-green group-hover:text-white"
            >
              <ChevronRight className="size-4" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
