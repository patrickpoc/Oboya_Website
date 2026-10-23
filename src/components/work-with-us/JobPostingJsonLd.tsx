import { buildJobPostingJsonLd, type PublicJobOpening } from "@/lib/cms/careers/public";
import { getWorldCountryByCode } from "@/lib/contact/world-countries";
import { siteConfig } from "@/constants/site";

export function JobPostingJsonLd({ opening, locale }: { opening: PublicJobOpening; locale: string }) {
  const ld = buildJobPostingJsonLd(opening, {
    url: `${siteConfig.url}/${locale}/work/${opening.slug}`,
    orgName: siteConfig.name,
    orgUrl: siteConfig.url,
    logoUrl: `${siteConfig.url}/icon.png`,
  }, (code) => getWorldCountryByCode(code)?.name);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }}
    />
  );
}
