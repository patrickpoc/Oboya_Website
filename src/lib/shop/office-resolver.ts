import type { Locale } from "@/i18n/routing";
import {
  normalizeMapLocations,
  resolveMapLocationsForLocale,
  type MapLocationsData,
  type ResolvedMapLocation,
  type ResolvedMapOffice,
} from "@/lib/map-locations";
import { getCountryByCode } from "@/lib/shop/catalog";
import type { ResolvedOffice } from "@/lib/shop/types";
import staticMapData from "../../../data/map-locations.json";

function pickPrimaryOffice(
  location: ResolvedMapLocation,
  primaryOfficeId?: string
): ResolvedMapOffice {
  if (primaryOfficeId) {
    const match = location.offices.find((office) => office.id === primaryOfficeId);
    if (match) return match;
  }
  return (
    location.offices.find((office) => office.id.endsWith("-office")) ??
    location.offices[0]
  );
}

function toResolvedOffice(
  location: ResolvedMapLocation,
  office: ResolvedMapOffice
): ResolvedOffice {
  const extended = office as ResolvedMapOffice & { businessHours?: string };
  return {
    locationId: location.id,
    officeId: office.id,
    country: location.country,
    flag: location.flag,
    company: office.company,
    partner: office.partner,
    operationType: office.operationType,
    city: office.city,
    facility: office.facility,
    segments: office.segments,
    phone: office.phone,
    email: office.email,
    businessHours: extended.businessHours ?? "",
  };
}

export function getMapLocationsForLocale(
  locale: Locale,
  mapData?: MapLocationsData
) {
  const normalized = normalizeMapLocations(mapData ?? staticMapData);
  return resolveMapLocationsForLocale(normalized.locations, locale);
}

export function getPrimaryOfficeByCountryCode(
  countryCode: string,
  locale: Locale,
  mapData?: MapLocationsData
): ResolvedOffice | null {
  const locations = getMapLocationsForLocale(locale, mapData);
  const location = locations.find(
    (item) => item.flag.toUpperCase() === countryCode.toUpperCase()
  );
  if (!location || location.offices.length === 0) return null;

  const shopCountry = getCountryByCode(countryCode);
  const office = pickPrimaryOffice(location, shopCountry?.primaryOfficeId);
  return toResolvedOffice(location, office);
}
