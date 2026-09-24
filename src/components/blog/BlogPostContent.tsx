"use client";

import Image from "next/image";
import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { sanitizeRichHtml } from "@/lib/cms/sanitize-rich-html.client";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";

interface BlogPostContentProps {
  post: CmsBlogPost;
  title: string;
  excerpt: string;
  body: string;
  categoryLabel: string;
  formattedDate: string;
  detailPlaceholder: string;
  backLabel?: string;
}

export function BlogPostContent({
  post,
  title,
  excerpt,
  body,
  categoryLabel,
  formattedDate,
  detailPlaceholder,
  backLabel = "Back to blog",
}: BlogPostContentProps) {
  const safeBody = useMemo(() => sanitizeRichHtml(body), [body]);

  return (
    <article>
      <section className="relative overflow-hidden bg-oboya-blue-dark text-white">
        {post.featuredImage ? (
          <div className="absolute inset-0">
            <Image
              src={post.featuredImage}
              alt=""
              fill
              priority
              className="object-cover opacity-35"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-oboya-blue-dark via-oboya-blue-dark/85 to-oboya-blue-dark/55" />
          </div>
        ) : null}
        <Container className="relative py-12 md:py-16 lg:py-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
          <p className="mt-8 text-xs font-semibold tracking-[0.14em] text-oboya-green uppercase">
            {categoryLabel}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-3xl leading-tight font-black tracking-tight text-balance md:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-6 text-sm text-white/75">
            {formattedDate}
            {post.author ? ` · ${post.author}` : ""}
          </p>
        </Container>
      </section>

      <section className="bg-oboya-soft-white py-12 md:py-16">
        <Container size="narrow">
          {excerpt ? (
            <p className="border-l-4 border-oboya-green pl-5 text-lg leading-relaxed font-medium text-oboya-blue-dark md:text-xl">
              {excerpt}
            </p>
          ) : null}

          {post.featuredImage ? (
            <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl bg-oboya-blue-dark/10 shadow-[var(--shadow-card)]">
              <Image
                src={post.featuredImage}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 720px"
              />
            </div>
          ) : null}

          {safeBody ? (
            <div
              className="rich-text-content prose prose-neutral prose-headings:font-display prose-headings:text-oboya-blue-dark prose-a:text-oboya-blue-light mt-10 max-w-none prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: safeBody }}
            />
          ) : (
            <div className="mt-10 space-y-4 text-muted-foreground">
              {excerpt ? <p>{excerpt}</p> : null}
              <p>{detailPlaceholder}</p>
            </div>
          )}
        </Container>
      </section>
    </article>
  );
}
