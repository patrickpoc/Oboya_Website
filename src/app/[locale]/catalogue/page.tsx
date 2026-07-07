import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { CatalogueSection } from "@/components/catalogue/CatalogueSection";
import { Container } from "@/components/ui/container";
import { routing } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalogue" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}/catalogue`])
      ),
    },
  };
}

export default async function CataloguePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("catalogue");

  return (
    <SiteLayout>
      <section className="overflow-x-hidden bg-white py-[var(--section-y-sm)]">
        <Container className="min-w-0">
          <div className="mb-8 md:mb-10">
            <p className="mb-2 text-sm font-semibold tracking-wider text-oboya-green uppercase">
              {t("eyebrow")}
            </p>
            <h1 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight text-oboya-blue-dark">
              {t("title")}
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">{t("description")}</p>
          </div>

          <CatalogueSection
            labels={{
              prev: t("prev"),
              next: t("next"),
              navLabel: t("navLabel"),
              pageInputLabel: t("pageInputLabel"),
              loading: t("loading"),
              error: t("error"),
            }}
          />
        </Container>
      </section>
    </SiteLayout>
  );
}
