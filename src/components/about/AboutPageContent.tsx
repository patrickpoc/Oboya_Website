import { getTranslations } from "next-intl/server";
import { readAboutPageSettings, readHomepageSettings } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
import { Container } from "@/components/ui/container";
import { AboutInstitutionalImage } from "@/components/about/AboutInstitutionalImage";
import { AboutImpact } from "@/components/about/AboutImpact";
import { AboutCallout } from "@/components/about/AboutCallout";
import { AboutCorporateCulture } from "@/components/about/AboutCorporateCulture";
import { AboutMission } from "@/components/about/AboutMission";
import { AboutVision } from "@/components/about/AboutVision";
import { AboutValues } from "@/components/about/AboutValues";
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

  const heroBody = about.hero.body ? pickLocalized(about.hero.body, locale).trim() : "";

  return (
    <>
      {/* Intro above the hero image: title left, body right (stacked on mobile). */}
      <section className="bg-white pt-[clamp(3.5rem,9vw,8rem)] pb-[clamp(0.5rem,2vw,1.5rem)]">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 md:items-start md:gap-16 lg:gap-24">
            <h1 className="font-display text-[clamp(2.25rem,4.4vw,3.75rem)] font-light leading-[1.05] tracking-[-0.02em] text-oboya-blue-dark text-balance">
              {pickLocalized(about.hero.title, locale)}
            </h1>
            {heroBody ? (
              <p className="max-w-xl font-body text-base leading-[1.75] text-oboya-blue-dark md:pt-1 md:text-[1.0625rem]">
                {heroBody}
              </p>
            ) : null}
          </div>
        </Container>
      </section>

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
    </>
  );
}
