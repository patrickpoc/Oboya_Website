import { readAboutPageSettings } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutPageBackdrop } from "@/components/about/AboutPageBackdrop";
import { AboutTimeline } from "@/components/about/AboutTimeline";
import { AboutImpact } from "@/components/about/AboutImpact";
import { AboutCallout } from "@/components/about/AboutCallout";
import { AboutCorporateCulture } from "@/components/about/AboutCorporateCulture";
import { AboutMission } from "@/components/about/AboutMission";
import { AboutVision } from "@/components/about/AboutVision";
import { AboutValues } from "@/components/about/AboutValues";
import { AboutHonors } from "@/components/about/AboutHonors";

interface AboutPageContentProps {
  locale: string;
}

export async function AboutPageContent({
  locale,
}: AboutPageContentProps) {
  const about = await readAboutPageSettings();
  const showHero =
    about.sections.hero.enabled ||
    about.sections.institutionalImage.enabled;
  const imageSrc = about.sections.institutionalImage.enabled
    ? about.institutionalImage.src
    : null;
  const imageAlt = pickLocalized(about.institutionalImage.alt, locale);
  const showTimeline = about.sections.timeline.enabled;
  const overBackdrop = showHero;

  const afterBackdrop = (
    <>
      {about.sections.impact.enabled && (
        <AboutImpact data={about.impact} locale={locale} />
      )}
      {about.sections.callout.enabled && (
        <AboutCallout
          data={about.callout}
          locale={locale}
          imageSrc={about.institutionalImage.src}
        />
      )}
      {about.sections.culture.enabled && (
        <AboutCorporateCulture data={about.culture} locale={locale} />
      )}
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

  if (!showHero) {
    return (
      <>
        {showTimeline ? (
          <AboutTimeline data={about.timeline} locale={locale} />
        ) : null}
        {afterBackdrop}
      </>
    );
  }

  return (
    <AboutPageBackdrop
      imageSrc={imageSrc}
      alt={imageAlt}
      afterBackdrop={afterBackdrop}
    >
      {about.sections.hero.enabled ? (
        <AboutHero data={about.hero} locale={locale} />
      ) : (
        <div
          className="min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)]"
          aria-hidden
        />
      )}
      {showTimeline ? (
        <AboutTimeline
          data={about.timeline}
          locale={locale}
          overBackdrop={overBackdrop}
        />
      ) : null}
    </AboutPageBackdrop>
  );
}
