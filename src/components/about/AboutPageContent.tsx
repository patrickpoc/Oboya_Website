import { readAboutPageSettings } from "@/lib/cms/readers";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutTimeline } from "@/components/about/AboutTimeline";
import { AboutImpact } from "@/components/about/AboutImpact";
import { AboutPeople } from "@/components/about/AboutPeople";
import { AboutCallout } from "@/components/about/AboutCallout";
import { AboutCorporateCulture } from "@/components/about/AboutCorporateCulture";
import { AboutHonors } from "@/components/about/AboutHonors";

interface AboutPageContentProps {
  locale: string;
  /**
   * `full` — classic /about page
   * `afterTimeline` — rest of About after the about-v2 circle experience
   */
  mode?: "full" | "afterTimeline";
}

export function AboutPageContent({
  locale,
  mode = "full",
}: AboutPageContentProps) {
  const about = readAboutPageSettings();
  const afterTimeline = mode === "afterTimeline";

  return (
    <>
      {!afterTimeline &&
        (about.sections.hero.enabled ||
          about.sections.institutionalImage.enabled) && (
          <AboutHero
            data={about.hero}
            image={about.institutionalImage}
            locale={locale}
            showImage={about.sections.institutionalImage.enabled}
          />
        )}
      {!afterTimeline && about.sections.timeline.enabled && (
        <AboutTimeline data={about.timeline} locale={locale} />
      )}
      {about.sections.impact.enabled && (
        <AboutImpact data={about.impact} locale={locale} />
      )}
      {about.sections.people.enabled && (
        <AboutPeople
          data={about.people}
          locale={locale}
          scrollSpotlight={afterTimeline}
        />
      )}
      {about.sections.callout.enabled && (
        <AboutCallout data={about.callout} locale={locale} />
      )}
      {about.sections.culture.enabled && (
        <AboutCorporateCulture data={about.culture} locale={locale} />
      )}
      {about.sections.honors.enabled && (
        <AboutHonors data={about.honors} locale={locale} />
      )}
    </>
  );
}
