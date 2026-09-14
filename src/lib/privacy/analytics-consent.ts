export const ANALYTICS_CONSENT_COOKIE = "oboya_analytics_consent";
export const ANALYTICS_CONSENT_EVENT = "oboya-analytics-consent";

export type AnalyticsConsent = "accepted" | "declined";

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`));
  const value = match?.split("=")[1];
  if (value === "accepted" || value === "declined") return value;
  return null;
}

export function writeAnalyticsConsent(value: AnalyticsConsent) {
  const maxAge = 60 * 60 * 24 * 365;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
}
