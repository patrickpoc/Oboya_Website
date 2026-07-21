import Image from "next/image";
import { Container } from "@/components/ui/container";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import type { BlogCategory } from "@/lib/cms/repositories/blog-categories-repository";

interface BlogPostContentProps {
  post: CmsBlogPost;
  title: string;
  excerpt: string;
  body: string;
  categoryLabel: string;
  formattedDate: string;
  detailPlaceholder: string;
}

export function BlogPostContent({
  post,
  title,
  excerpt,
  body,
  categoryLabel,
  formattedDate,
  detailPlaceholder,
}: BlogPostContentProps) {
  return (
    <>
      <section className="bg-oboya-blue-dark text-white">
        <Container className="py-12 md:py-16 lg:py-20">
          <p className="text-xs font-semibold tracking-[0.14em] text-oboya-blue uppercase">
            {categoryLabel}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-3xl leading-tight font-black tracking-tight text-balance md:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-6 text-sm text-white/70">
            {formattedDate}
            {post.author ? ` · ${post.author}` : ""}
          </p>
        </Container>
      </section>

      {post.featuredImage && (
        <div className="relative aspect-[21/9] w-full bg-oboya-blue-dark/10">
          <Image
            src={post.featuredImage}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
      )}

      <section className="bg-oboya-soft-white py-12 md:py-16">
        <Container size="narrow">
          {excerpt && (
            <p className="text-lg leading-relaxed text-oboya-blue-dark/80">{excerpt}</p>
          )}
          {body ? (
            <div
              className="prose prose-neutral mt-8 max-w-none"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <div className="mt-8 space-y-4 text-muted-foreground">
              {excerpt ? <p>{excerpt}</p> : null}
              <p>{detailPlaceholder}</p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}