import { BusinessSolutions } from "@/components/sections/BusinessSolutions";
import { HomeChallenges } from "@/components/sections/HomeChallenges";
import { Capabilities } from "@/components/sections/Capabilities";
import { Hero } from "@/components/sections/Hero";
import { HomeLatestNews } from "@/components/sections/HomeLatestNews";
import { Testimonials } from "@/components/sections/Testimonials";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
interface HomePageContentProps {
  locale: string;
  homepage: HomepageSettings;
  posts: CmsBlogPost[];
}

export function HomePageContent({
  locale,
  homepage,
  posts,
}: HomePageContentProps) {
  const animationsEnabled = homepage.animations?.enabled !== false;

  return (
    <>
      {homepage.sections.hero.enabled && (
        <Hero data={homepage.hero} locale={locale} animationsEnabled={animationsEnabled} />
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
      <HomeChallenges />
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
