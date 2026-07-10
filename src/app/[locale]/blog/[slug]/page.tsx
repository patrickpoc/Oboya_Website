import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { InnerPageHero } from "@/components/sections/InnerPageHero";
import { Container } from "@/components/ui/container";
import { readBlogPostBySlug, readBlogPosts } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  const posts = readBlogPosts();
  return routing.locales.flatMap((locale) =>
    posts.map((post) => ({ locale, slug: post.slug }))
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = readBlogPostBySlug(slug);
  if (!post) notFound();

  const t = await getTranslations("blog");
  const title = pickLocalized(post.title, locale);
  const excerpt = pickLocalized(post.excerpt, locale);
  const body = pickLocalized(post.body, locale);

  return (
    <SiteLayout>
      <InnerPageHero
        eyebrow={t("eyebrow")}
        title={title}
        description={post.publishedAt?.slice(0, 10) ?? ""}
      />
      <section className="py-12 md:py-16">
        <Container size="narrow">
          <p className="text-sm text-muted-foreground">{post.author}</p>
          {excerpt && <p className="mt-4 text-muted-foreground">{excerpt}</p>}
          {body ? (
            <div
              className="prose prose-neutral mt-8 max-w-none"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <p className="mt-8 text-muted-foreground">{excerpt}</p>
          )}
        </Container>
      </section>
    </SiteLayout>
  );
}
