import { useLocale, useTranslations } from "next-intl";
import { Briefcase, Building2, Laptop, MapPin, Signal } from "lucide-react";
import { CountryFlag } from "@/components/ui/country-flag";
import type { PublicJobOpening } from "@/lib/cms/careers/public";
import { cn } from "@/lib/utils";
import { locationLabel } from "./opening-format";

type Props = {
  opening: PublicJobOpening;
  /** "dark" is for the blue hero, "light" for cards. */
  tone?: "light" | "dark";
  className?: string;
};

export function OpeningMetaChips({ opening, tone = "light", className }: Props) {
  const t = useTranslations("workWithUsPage");
  const locale = useLocale();
  const location = locationLabel(opening, locale);
  const chip = cn(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
    tone === "dark" ? "bg-white/10 text-white" : "bg-oboya-soft-white text-oboya-blue-dark"
  );
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {location ? (
        <li className={chip}>
          {opening.countryCode ? (
            <CountryFlag code={opening.countryCode} className="h-3 w-4 rounded-[2px]" />
          ) : (
            <MapPin className="size-3.5" aria-hidden />
          )}
          {location}
        </li>
      ) : null}
      {opening.department ? (
        <li className={chip}>
          <Building2 className="size-3.5" aria-hidden />
          {opening.department}
        </li>
      ) : null}
      {opening.workModel ? (
        <li className={chip}>
          <Laptop className="size-3.5" aria-hidden />
          {t(`labels.workModel.${opening.workModel}`)}
        </li>
      ) : null}
      {opening.employmentType ? (
        <li className={chip}>
          <Briefcase className="size-3.5" aria-hidden />
          {t(`labels.employmentType.${opening.employmentType}`)}
        </li>
      ) : null}
      {opening.seniority ? (
        <li className={chip}>
          <Signal className="size-3.5" aria-hidden />
          {t(`labels.seniority.${opening.seniority}`)}
        </li>
      ) : null}
    </ul>
  );
}
