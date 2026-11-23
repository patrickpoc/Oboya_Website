import { sanitizeSiteImageUrl } from "@/lib/cms/media-url";
import { isValidEmail } from "@/lib/security/email";

export const CONTACT_REGION_IDS = [
  "north-america",
  "latin-america",
  "europe",
  "africa",
  "asia",
] as const;

export type ContactRegionId = (typeof CONTACT_REGION_IDS)[number];

export interface ContactPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** ISO-3166 alpha-2, used for the flag. */
  countryCode: string;
  region: ContactRegionId;
  photo?: string;
  enabled: boolean;
  sortOrder: number;
}

export const DEFAULT_CONTACT_TEAM: ContactPerson[] = [
  { id: "tatiana-lochowicz", name: "Tatiana Łochowicz", email: "tatiana@oboya.cc", phone: "+48 781 526 431", countryCode: "PL", region: "europe", photo: "/assets/contact-team/tatiana-lochowicz.png", enabled: true, sortOrder: 0 },
  { id: "robert-wu", name: "Robert Wu", email: "robert.wu@oboya.cc", phone: "+86 186 6972 8621", countryCode: "SE", region: "europe", photo: "/assets/contact-team/robert-wu.png", enabled: true, sortOrder: 1 },
  { id: "chadi-gebrael", name: "Chadi Gebrael", email: "chadi@oboya.cc", phone: "+51 960 815 046", countryCode: "EC", region: "latin-america", photo: "/assets/contact-team/chadi-gebrael.png", enabled: true, sortOrder: 0 },
  { id: "lorena-paulos", name: "Lorena Paulos", email: "lorena@oboya.cc", phone: "+569 9158 0496", countryCode: "CL", region: "latin-america", photo: "/assets/contact-team/lorena-paulos.png", enabled: true, sortOrder: 1 },
  { id: "rafael-aguilar", name: "Rafael Aguilar", email: "rafael.aguilar@oboya.cc", phone: "+52 444 142 8229", countryCode: "MX", region: "latin-america", photo: "/assets/contact-team/rafael-aguilar.png", enabled: true, sortOrder: 2 },
];

const MAX_PEOPLE = 100;
const MAX_TEXT = 120;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * Drops invalid entries (max 100), sanitizes email/phone/country/photo, defaults
 * `enabled` to true, sorts by region then sortOrder.
 */
export function normalizeContactTeam(raw: unknown): ContactPerson[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const people: ContactPerson[] = [];
  for (const [index, item] of raw.entries()) {
    if (people.length >= MAX_PEOPLE) break;
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const id = str(r.id);
    const name = str(r.name);
    const region = r.region as ContactRegionId;
    if (!id || !name || id.length > MAX_TEXT || name.length > MAX_TEXT || seen.has(id)) continue;
    if (!CONTACT_REGION_IDS.includes(region)) continue;
    seen.add(id);
    const email = str(r.email);
    const phone = str(r.phone);
    const country = str(r.countryCode).toUpperCase();
    // A stored default person without a photo gets the default photo.
    const photo =
      sanitizeSiteImageUrl(r.photo) ||
      DEFAULT_CONTACT_TEAM.find((d) => d.id === id)?.photo ||
      "";
    const order = typeof r.sortOrder === "number" && Number.isFinite(r.sortOrder) ? r.sortOrder : index;
    people.push({
      id,
      name,
      email: isValidEmail(email) ? email : "",
      phone: /^[+\d\s().-]{0,32}$/.test(phone) ? phone : "",
      countryCode: /^[A-Z]{2}$/.test(country) ? country : "",
      region,
      ...(photo ? { photo } : {}),
      enabled: r.enabled !== false,
      sortOrder: Math.min(10000, Math.max(0, Math.trunc(order))),
    });
  }
  return people.sort(
    (a, b) =>
      CONTACT_REGION_IDS.indexOf(a.region) - CONTACT_REGION_IDS.indexOf(b.region) ||
      a.sortOrder - b.sortOrder
  );
}
