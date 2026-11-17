import { BusinessSolutions } from "@/components/sections/BusinessSolutions";
import { Capabilities } from "@/components/sections/Capabilities";
import { Hero } from "@/components/sections/Hero";
import { HomeChallenges } from "@/components/sections/HomeChallenges";
import { HomeEcosystemSection } from "@/components/sections/HomeEcosystemSection";
import { Testimonials } from "@/components/sections/Testimonials";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
interface HomePageContentProps {
  locale: string;
  homepage: HomepageSettings;
}

export function HomePageContent({ locale, homepage }: HomePageContentProps) {
  const animationsEnabled = homepage.animations?.enabled !== false;

  const challenges =
    homepage.sections.challenges?.enabled !== false ? homepage.challenges : undefined;

  return (
    <>
      {homepage.sections.hero.enabled && (
        <Hero data={homepage.hero} locale={locale} animationsEnabled={animationsEnabled} />
      )}
      <HomeEcosystemSection
        data={homepage.homeEcosystem}
        locale={locale}
        animationsEnabled={animationsEnabled}
      />
      {homepage.sections.capabilities.enabled && (
        <Capabilities
          data={homepage.capabilities}
          locale={locale}
          animationsEnabled={animationsEnabled}
        />
      )}
      {homepage.sections.businessSolutions.enabled && (
        <BusinessSolutions
          data={homepage.businessSolutions}
          locale={locale}
          animationsEnabled={animationsEnabled}
        />
      )}
      {challenges && challenges.points?.length > 0 && challenges.image && (
        <HomeChallenges
          data={challenges}
          locale={locale}
          animationsEnabled={animationsEnabled}
        />
      )}
      {homepage.sections.testimonials.enabled && (
        <Testimonials
          data={homepage.testimonials}
          locale={locale}
          animationsEnabled={animationsEnabled}
        />
      )}
    </>
  );
}
