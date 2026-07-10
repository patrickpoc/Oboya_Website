import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { Container } from "@/components/ui/container";
import { readBlogCategories, readBlogPostBySlug, readBlogPosts } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  const posts = readBlogPosts();
  return routing.locales.flatMap((locale) =>
    posts.map((post) => ({ locale, slug: post.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = readBlogPostBySlug(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: pickLocalized(post.title, locale),
    description: pickLocalized(post.excerpt, locale),
  };
}

function formatNewsDate(isoDate: string | undefined, locale: string): string {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date(isoDate))
    .toUpperCase();
}

export default async function NewsArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = readBlogPostBySlug(slug);
  if (!post) notFound();

  const t = await getTranslations("newsPage");
  const categories = readBlogCategories();
  const category = categories.find((c) => c.id === post.categoryId);
  const title = pickLocalized(post.title, locale);
  const excerpt = pickLocalized(post.excerpt, locale);
  const body = pickLocalized(post.body, locale);

  return (
    <SiteLayout>
      <section className="bg-oboya-blue-dark text-white">
        <Container className="py-12 md:py-16 lg:py-20">
          <p className="text-xs font-semibold tracking-[0.14em] text-oboya-blue uppercase">
            {category ? pickLocalized(category.name, locale) : t("articleLabel")}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-3xl leading-tight font-black tracking-tight text-balance md:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-6 text-sm text-white/70">
            {formatNewsDate(post.publishedAt, locale)}
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
              <p>{t("detailPlaceholder")}</p>
            </div>
          )}
        </Container>
      </section>
    </SiteLayout>
  );
}
