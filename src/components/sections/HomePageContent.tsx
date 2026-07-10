import { Capabilities } from "@/components/sections/Capabilities";
import { CompanyOverview } from "@/components/sections/CompanyOverview";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { GlobalPresence } from "@/components/sections/GlobalPresence";
import { Hero } from "@/components/sections/Hero";
import { HomeLatestNews } from "@/components/sections/HomeLatestNews";
import { Partners } from "@/components/sections/Partners";
import { Testimonials } from "@/components/sections/Testimonials";
import { readBlogPosts, readHomepageSettings } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
import type { ResolvedMapLocation } from "@/lib/map-locations";

interface HomePageContentProps {
  locale: string;
  locations: ResolvedMapLocation[];
  mapAlt: string;
}

export function HomePageContent({ locale, locations, mapAlt }: HomePageContentProps) {
  const homepage = readHomepageSettings();
  const posts = readBlogPosts();

  return (
    <>
      {homepage.sections.hero.enabled && (
        <Hero data={homepage.hero} locale={locale} />
      )}
      {homepage.sections.companyOverview.enabled && (
        <CompanyOverview data={homepage.companyOverview} locale={locale} />
      )}
      {homepage.sections.capabilities.enabled && (
        <Capabilities data={homepage.capabilities} locale={locale} />
      )}
      {homepage.sections.globalPresence.enabled && (
        <GlobalPresence
          locations={locations}
          mapAlt={mapAlt}
          title={pickLocalized(homepage.globalPresence.title, locale)}
        />
      )}
      {homepage.sections.testimonials.enabled && (
        <Testimonials data={homepage.testimonials} locale={locale} />
      )}
      {homepage.sections.featuredProducts.enabled && (
        <FeaturedProducts data={homepage.featuredProducts} locale={locale} />
      )}
      {homepage.sections.latestNews.enabled && (
        <HomeLatestNews data={homepage.latestNews} posts={posts} locale={locale} />
      )}
      {homepage.sections.partners.enabled && (
        <Partners data={homepage.partners} locale={locale} />
      )}
    </>
  );
}
