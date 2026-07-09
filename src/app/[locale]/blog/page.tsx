import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { InnerPageHero } from "@/components/sections/InnerPageHero";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { blogPosts } from "@/constants/content-data";

type Props = { params: Promise<{ locale: string }> };

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");

  return (
    <SiteLayout>
      <InnerPageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <section className="py-12 md:py-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="rounded-xl border border-border/60 bg-white p-6 shadow-[var(--shadow-card)]"
              >
                <p className="text-xs text-muted-foreground">{post.date}</p>
                <h2 className="mt-2 text-lg font-semibold text-oboya-blue-dark">
                  {t(`posts.${post.messageKey}.title`)}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t(`posts.${post.messageKey}.excerpt`)}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-block text-sm font-medium text-oboya-green hover:underline"
                >
                  {t("readMore")}
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}
