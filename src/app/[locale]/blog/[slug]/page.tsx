import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { InnerPageHero } from "@/components/sections/InnerPageHero";
import { Container } from "@/components/ui/container";
import { blogPosts } from "@/constants/content-data";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    blogPosts.map((post) => ({ locale, slug: post.slug }))
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) notFound();

  const t = await getTranslations("blog");
  const key = post.messageKey;

  return (
    <SiteLayout>
      <InnerPageHero
        eyebrow={t("eyebrow")}
        title={t(`posts.${key}.title`)}
        description={post.date}
      />
      <section className="py-12 md:py-16">
        <Container size="narrow">
          <p className="text-sm text-muted-foreground">{post.author}</p>
          <div className="mt-8 space-y-4 text-muted-foreground">
            <p>{t(`posts.${key}.p1`)}</p>
            <p>{t(`posts.${key}.p2`)}</p>
            <p>{t(`posts.${key}.p3`)}</p>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}
