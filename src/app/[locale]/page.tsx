import { Footer } from "@/components/layouts/Footer";
import { Navbar } from "@/components/layouts/Navbar";
import { HomeIntroGate } from "@/components/layout/HomeIntroGate";
import { HomePageBackdrop } from "@/components/sections/HomePageBackdrop";
import { HomePageContent } from "@/components/sections/HomePageContent";
import { Partners } from "@/components/sections/Partners";
import { routing, type Locale } from "@/i18n/routing";
import { resolveMapLocationsForLocale } from "@/lib/map-locations";
import { readMapLocations } from "@/lib/map-locations.server";
import { readBlogPosts, readHomepageSettings } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
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

  const [mapData, t, homepage, posts] = await Promise.all([
    readMapLocations(),
    getTranslations({ locale, namespace: "globalPresence" }),
    readHomepageSettings(),
    readBlogPosts(),
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

  const heroAlt = pickLocalized(homepage.hero.title, locale)
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/!$/, "");

  const animationsEnabled = homepage.animations?.enabled !== false;

  return (
    <HomeIntroGate waitForHero={waitForHero}>
      <Navbar transparent variant="minimal" />
      <main>
        <HomePageBackdrop
          enabled={homepage.sections.hero.enabled}
          mediaType={homepage.hero.mediaType ?? "image"}
          imageSrc={homepage.hero.backgroundImage}
          videoSrc={homepage.hero.backgroundVideo}
          alt={heroAlt}
          afterBackdrop={
            homepage.sections.partners.enabled ? (
              <Partners
                data={homepage.partners}
                locale={locale}
                animationsEnabled={animationsEnabled}
              />
            ) : null
          }
        >
          <HomePageContent
            locale={locale}
            locations={locations}
            connections={mapData.connections}
            mapAlt={t("mapAlt")}
            homepage={homepage}
            posts={posts}
          />
        </HomePageBackdrop>
      </main>
      <Footer />
    </HomeIntroGate>
  );
}
