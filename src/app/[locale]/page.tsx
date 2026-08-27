import { Footer } from "@/components/layouts/Footer";
import { Navbar } from "@/components/layouts/Navbar";
import { HomeIntroGate } from "@/components/layout/HomeIntroGate";
import { HomePageContent } from "@/components/sections/HomePageContent";
import { routing, type Locale } from "@/i18n/routing";
import { resolveMapLocationsForLocale } from "@/lib/map-locations";
import { readMapLocations } from "@/lib/map-locations.server";
import { readHomepageSettings } from "@/lib/cms/readers";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}`])
      ),
    },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [mapData, t, homepage] = await Promise.all([
    readMapLocations(),
    getTranslations({ locale, namespace: "globalPresence" }),
    readHomepageSettings(),
  ]);

  const locations = resolveMapLocationsForLocale(
    mapData.locations,
    locale as Locale
  );

  const waitForHero =
    homepage.sections.hero.enabled &&
    (homepage.hero.mediaType === "video"
      ? Boolean(homepage.hero.backgroundVideo)
      : Boolean(homepage.hero.backgroundImage));

  return (
    <HomeIntroGate waitForHero={waitForHero}>
      <Navbar transparent variant="minimal" />
      <main>
        <HomePageContent
          locale={locale}
          locations={locations}
          mapAlt={t("mapAlt")}
          homepage={homepage}
        />
      </main>
      <Footer />
    </HomeIntroGate>
  );
}
