export const COOKIE_CONSENT_COOKIE = "oboya_cookie_consent";
export const COOKIE_CONSENT_EVENT = "oboya-cookie-consent";
export const COOKIE_CONSENT_OPEN_EVENT = "oboya-cookie-consent-open";
export const COOKIE_CONSENT_VERSION = 1;

/** Legacy analytics-only banner cookie (migrated on read). */
const LEGACY_ANALYTICS_COOKIE = "oboya_analytics_consent";

export type CookieConsent = {
  v: number;
  necessary: true;
  analytics: boolean;
  updatedAt: string;
};

function cookieMaxAgeSeconds() {
  return 60 * 60 * 24 * 365;
}

function cookieSecureSuffix() {
  return window.location.protocol === "https:" ? "; Secure" : "";
}

function writeRawCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${cookieSecureSuffix()}`;
}

function readRawCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

export function isValidCookieConsent(value: unknown): value is CookieConsent {
  if (!value || typeof value !== "object") return false;
  const consent = value as CookieConsent;
  return (
    consent.v === COOKIE_CONSENT_VERSION &&
    consent.necessary === true &&
    typeof consent.analytics === "boolean" &&
    typeof consent.updatedAt === "string"
  );
}

function parseConsent(raw: string | null): CookieConsent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isValidCookieConsent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function fromLegacyAnalyticsPreference(): boolean | null {
  const legacy = readRawCookie(LEGACY_ANALYTICS_COOKIE);
  if (legacy === "accepted") return true;
  if (legacy === "declined") return false;
  return null;
}

export function readCookieConsent(): CookieConsent | null {
  return parseConsent(readRawCookie(COOKIE_CONSENT_COOKIE));
}

/** Prefill the analytics toggle from the previous analytics-only banner. */
export function readLegacyAnalyticsPreference(): boolean | null {
  return fromLegacyAnalyticsPreference();
}

export function writeCookieConsent(consent: CookieConsent) {
  writeRawCookie(
    COOKIE_CONSENT_COOKIE,
    encodeURIComponent(JSON.stringify(consent)),
    cookieMaxAgeSeconds()
  );
  writeRawCookie(LEGACY_ANALYTICS_COOKIE, "", 0);
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

export function acceptAllCookies() {
  writeCookieConsent({
    v: COOKIE_CONSENT_VERSION,
    necessary: true,
    analytics: true,
    updatedAt: new Date().toISOString(),
  });
}

export function rejectOptionalCookies() {
  writeCookieConsent({
    v: COOKIE_CONSENT_VERSION,
    necessary: true,
    analytics: false,
    updatedAt: new Date().toISOString(),
  });
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT));
}

export function hasAnalyticsConsent(consent: CookieConsent | null): boolean {
  return consent?.analytics === true;
}
