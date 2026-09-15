import { Suspense } from "react";
import { SolutionsHero } from "@/components/solutions/SolutionsHero";
import { SolutionsExplorer } from "@/components/solutions/SolutionsExplorer";
import { SolutionsCta } from "@/components/solutions/SolutionsCta";
import { pickLocalized } from "@/lib/cms/utils";
import { readSolutionsPageSettingsDurable } from "@/lib/cms/server/solutions-page.server";
import { getLocale } from "next-intl/server";

export async function SolutionsPageContent() {
  const locale = await getLocale();
  const settings = await readSolutionsPageSettingsDurable();

  return (
    <>
      <SolutionsHero
        headline={pickLocalized(settings.hero.headline, locale)}
        body={pickLocalized(settings.hero.body, locale)}
      />
      <Suspense fallback={null}>
        <SolutionsExplorer settings={settings} />
      </Suspense>
      <SolutionsCta
        title={pickLocalized(settings.cta.title, locale)}
        description={pickLocalized(settings.cta.description, locale)}
        buttonLabel={pickLocalized(settings.cta.buttonLabel, locale)}
        href={settings.cta.href}
      />
    </>
  );
}
