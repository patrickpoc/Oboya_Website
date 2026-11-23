import { getTranslations } from "next-intl/server";
import { readAboutPageSettings, readHomepageSettings } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
import { AboutInstitutionalImage } from "@/components/about/AboutInstitutionalImage";
import { AboutImpact } from "@/components/about/AboutImpact";
import { AboutCallout } from "@/components/about/AboutCallout";
import { AboutCorporateCulture } from "@/components/about/AboutCorporateCulture";
import { AboutMission } from "@/components/about/AboutMission";
import { AboutVision } from "@/components/about/AboutVision";
import { AboutValues } from "@/components/about/AboutValues";
import { AboutHonors } from "@/components/about/AboutHonors";
import { GlobalPresence } from "@/components/sections/GlobalPresence";
import type { Locale } from "@/i18n/routing";
import { resolveMapLocationsForLocale } from "@/lib/map-locations";
import { readMapLocations } from "@/lib/map-locations.server";

interface AboutPageContentProps {
  locale: string;
}

export async function AboutPageContent({
  locale,
}: AboutPageContentProps) {
  const [about, mapData, homepage, tPresence] = await Promise.all([
    readAboutPageSettings(),
    readMapLocations(),
    readHomepageSettings(),
    getTranslations({ locale, namespace: "globalPresence" }),
  ]);

  const mapLocations = resolveMapLocationsForLocale(
    mapData.locations,
    locale as Locale
  );

  return (
    <>
      {/* The visual hero block was removed; keep the page's h1 for screen readers and SEO. */}
      <h1 className="sr-only">{pickLocalized(about.hero.title, locale)}</h1>

      {about.sections.institutionalImage.enabled ? (
        <AboutInstitutionalImage
          data={about.institutionalImage}
          locale={locale}
        />
      ) : null}

      {about.sections.callout.enabled && (
        <AboutCallout data={about.callout} locale={locale} />
      )}

      {about.sections.culture.enabled && (
        <AboutCorporateCulture data={about.culture} locale={locale} />
      )}

      {about.sections.impact.enabled && (
        <AboutImpact data={about.impact} locale={locale} />
      )}
      <GlobalPresence
        locations={mapLocations}
        connections={mapData.connections}
        mapAlt={tPresence("mapAlt")}
        showConnections={homepage.globalPresence.showConnections !== false}
        title={pickLocalized(homepage.globalPresence.title, locale)}
      />
      {about.sections.mission.enabled && (
        <AboutMission data={about.mission} locale={locale} />
      )}
      {about.sections.vision.enabled && (
        <AboutVision data={about.vision} locale={locale} />
      )}
      {about.sections.values.enabled && (
        <AboutValues data={about.values} locale={locale} />
      )}
      {about.sections.honors.enabled && (
        <AboutHonors data={about.honors} locale={locale} />
      )}
    </>
  );
}
