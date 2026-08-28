import { countryFlagOptions, getCountryCode } from "@/constants/country-flags";
import type { MapLocationsData } from "@/lib/map-locations";

export type MapFlagOption = {
  code: string;
  label: string;
};

const flagLabelByCode = new Map(
  countryFlagOptions.map((option) => [option.code, option.label])
);

/** Country flags available on the interactive Global Presence map. */
export function getMapFlagOptions(
  data: MapLocationsData | null | undefined
): MapFlagOption[] {
  if (!data?.locations?.length) return [];

  const byCode = new Map<string, string>();

  for (const location of data.locations) {
    const code = getCountryCode(location.flag);
    if (!code || byCode.has(code)) continue;

    const mapLabel = location.translations?.en?.country?.trim();
    byCode.set(code, mapLabel || flagLabelByCode.get(code) || code);
  }

  return Array.from(byCode.entries())
    .map(([code, label]) => ({ code, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
