import type { AboutPageSettings } from "@/lib/cms/repositories/about-page/types";
import { defaultIntro } from "@/lib/cms/repositories/about-page/defaults-intro";
import { defaultImpact } from "@/lib/cms/repositories/about-page/defaults-impact";
import { defaultPeople } from "@/lib/cms/repositories/about-page/defaults-people";
import { defaultCallout } from "@/lib/cms/repositories/about-page/defaults-callout";
import { defaultCulture } from "@/lib/cms/repositories/about-page/defaults-culture";
import {
  defaultHonors,
  defaultMission,
  defaultValues,
  defaultVision,
} from "@/lib/cms/repositories/about-page/defaults-mission";

export function defaultSettings(): AboutPageSettings {
  return {
    ...defaultIntro(),
    impact: defaultImpact(),
    people: defaultPeople(),
    callout: defaultCallout(),
    culture: defaultCulture(),
    mission: defaultMission(),
    vision: defaultVision(),
    values: defaultValues(),
    honors: defaultHonors(),
    updatedAt: new Date().toISOString(),
  };
}
