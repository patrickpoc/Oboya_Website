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
      {/* Same structure as the "More Than a Supplier" callout (AboutCallout). */}
      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-[var(--container-max)] gap-6 px-[var(--container-padding)] pt-[clamp(4rem,9vw,7rem)] pb-[clamp(1rem,3vw,2rem)] lg:grid-cols-12 lg:gap-12">
          <h1 className="font-display text-[clamp(1.85rem,3.6vw,3.15rem)] font-light leading-[1.08] tracking-[-0.02em] text-oboya-blue-dark text-balance lg:col-span-5">
            {pickLocalized(about.hero.title, locale)}
          </h1>
          {heroBody ? (
            <div className="font-body text-[0.9375rem] leading-[1.6] text-oboya-blue-dark/80 text-pretty lg:col-span-7 lg:col-start-6">
              <p>{heroBody}</p>
            </div>
          ) : null}
        </div>
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
