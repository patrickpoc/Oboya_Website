import { BusinessSolutions } from "@/components/sections/BusinessSolutions";
import { Capabilities } from "@/components/sections/Capabilities";
import { CompanyOverview } from "@/components/sections/CompanyOverview";
import { GlobalPresence } from "@/components/sections/GlobalPresence";
import { Hero } from "@/components/sections/Hero";
import { HomeLatestNews } from "@/components/sections/HomeLatestNews";
import { Testimonials } from "@/components/sections/Testimonials";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import { pickLocalized } from "@/lib/cms/utils";
import type { MapConnection, ResolvedMapLocation } from "@/lib/map-locations";

interface HomePageContentProps {
  locale: string;
  locations: ResolvedMapLocation[];
  connections?: MapConnection[];
  mapAlt: string;
  homepage: HomepageSettings;
  posts: CmsBlogPost[];
}

export function HomePageContent({
  locale,
  locations,
  connections,
  mapAlt,
  homepage,
  posts,
}: HomePageContentProps) {
  const animationsEnabled = homepage.animations?.enabled !== false;

  return (
    <>
      {homepage.sections.hero.enabled && (
        <Hero data={homepage.hero} locale={locale} animationsEnabled={animationsEnabled} />
      )}
      {homepage.sections.companyOverview.enabled && (
        <CompanyOverview
          data={homepage.companyOverview}
          locale={locale}
          animationsEnabled={animationsEnabled}
        />
      )}
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
      {homepage.sections.globalPresence.enabled && (
        <GlobalPresence
          locations={locations}
          connections={connections}
          mapAlt={mapAlt}
          title={pickLocalized(homepage.globalPresence.title, locale)}
        />
      )}
      {homepage.sections.testimonials.enabled && (
        <Testimonials
          data={homepage.testimonials}
          locale={locale}
          animationsEnabled={animationsEnabled}
        />
      )}
      {homepage.sections.latestNews.enabled && (
        <HomeLatestNews
          data={homepage.latestNews}
          posts={posts}
          locale={locale}
          animationsEnabled={animationsEnabled}
        />
      )}
    </>
  );
}
