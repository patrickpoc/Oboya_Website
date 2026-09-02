import { readAboutPageSettings } from "@/lib/cms/readers";
import { AboutHero } from "@/components/about/AboutHero";
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

  return (
    <>
      {(about.sections.hero.enabled ||
        about.sections.institutionalImage.enabled) && (
        <AboutHero
          data={about.hero}
          image={about.institutionalImage}
          locale={locale}
          showImage={about.sections.institutionalImage.enabled}
        />
      )}
      {about.sections.timeline.enabled && (
        <AboutTimeline data={about.timeline} locale={locale} />
      )}
      {about.sections.impact.enabled && (
        <AboutImpact data={about.impact} locale={locale} />
      )}
      {about.sections.callout.enabled && (
        <AboutCallout data={about.callout} locale={locale} />
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
}
