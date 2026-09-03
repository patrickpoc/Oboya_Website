import { Footer } from "@/components/layouts/Footer";
import { Navbar } from "@/components/layouts/Navbar";
import { GlobalPresence } from "@/components/sections/GlobalPresence";
import { routing, type Locale } from "@/i18n/routing";
import { resolveMapLocationsForLocale } from "@/lib/map-locations";
import { readMapLocations } from "@/lib/map-locations.server";
import { readHomepageSettings } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "globalPresence" });

  return {
    title: t("title"),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}/map`])
      ),
    },
  };
}

export default async function MapPage({ params }: Props) {
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

  return (
    <>
      <Navbar />
      <main>
        <GlobalPresence
          locations={locations}
          connections={mapData.connections}
          mapAlt={t("mapAlt")}
          title={pickLocalized(homepage.globalPresence.title, locale)}
        />
      </main>
      <Footer />
    </>
  );
}
