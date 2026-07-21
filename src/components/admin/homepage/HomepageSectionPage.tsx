"use client";

import type { ComponentType } from "react";
import type { HomepageSectionSlug } from "@/lib/cms/homepage-sections";
import type { HomepageSectionEditorProps } from "./shared";
import { HomepageSectionShell } from "./HomepageSectionShell";
import { HeroSectionEditor } from "./sections/HeroSectionEditor";
import { CompanyOverviewSectionEditor } from "./sections/CompanyOverviewSectionEditor";
import { CapabilitiesSectionEditor } from "./sections/CapabilitiesSectionEditor";
import { GlobalPresenceSectionEditor } from "./sections/GlobalPresenceSectionEditor";
import { TestimonialsSectionEditor } from "./sections/TestimonialsSectionEditor";
import { FeaturedCategoriesSectionEditor } from "./sections/FeaturedCategoriesSectionEditor";
import { LatestNewsSectionEditor } from "./sections/LatestNewsSectionEditor";
import { PartnersSectionEditor } from "./sections/PartnersSectionEditor";
import { HomepageSettingsEditor } from "./sections/HomepageSettingsEditor";

const SECTION_EDITORS: Record<HomepageSectionSlug, ComponentType<HomepageSectionEditorProps>> = {
  hero: HeroSectionEditor,
  companyOverview: CompanyOverviewSectionEditor,
  capabilities: CapabilitiesSectionEditor,
  globalPresence: GlobalPresenceSectionEditor,
  testimonials: TestimonialsSectionEditor,
  featuredProducts: FeaturedCategoriesSectionEditor,
  latestNews: LatestNewsSectionEditor,
  partners: PartnersSectionEditor,
  settings: HomepageSettingsEditor,
};

export function HomepageSectionPage({ section }: { section: HomepageSectionSlug }) {
  const Editor = SECTION_EDITORS[section];

  return (
    <HomepageSectionShell section={section}>
      {(props) => <Editor {...props} />}
    </HomepageSectionShell>
  );
}
