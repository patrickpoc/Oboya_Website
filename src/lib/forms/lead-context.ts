/** Marketing/context metadata attached to public lead forms (contact, RFQ). */
export type LeadContext = {
  page?: string;
  locale?: string;
  referrer?: string;
  utm?: Partial<Record<(typeof UTM_KEYS)[number], string>>;
};

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const UTM_STORAGE_KEY = "oboya:utm";
const MAX_LEN = 200;

function clip(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, MAX_LEN) : undefined;
}

/**
 * Browser-only. UTM params are remembered for the session so a lead sent a
 * few pages after landing still keeps its campaign attribution.
 */
export function collectLeadContext(): LeadContext {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  let utm: LeadContext["utm"] = {};
  for (const key of UTM_KEYS) {
    const value = clip(params.get(key));
    if (value) utm[key] = value;
  }
  try {
    if (Object.keys(utm).length) {
      window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    } else {
      utm = JSON.parse(window.sessionStorage.getItem(UTM_STORAGE_KEY) ?? "{}") as LeadContext["utm"];
    }
  } catch {
    // Storage can be blocked (private mode); attribution is best effort.
  }
  const referrer = document.referrer && !document.referrer.startsWith(window.location.origin)
    ? document.referrer
    : undefined;
  return {
    page: window.location.pathname,
    locale: document.documentElement.lang || undefined,
    referrer,
    utm,
  };
}

/** Server-side: keeps only known keys with bounded string values. */
export function sanitizeLeadContext(raw: unknown): LeadContext {
  if (!raw || typeof raw !== "object") return {};
  const input = raw as Record<string, unknown>;
  const out: LeadContext = {};
  const page = clip(input.page);
  if (page?.startsWith("/")) out.page = page;
  const locale = clip(input.locale);
  if (locale && /^[a-zA-Z-]{2,10}$/.test(locale)) out.locale = locale;
  const referrer = clip(input.referrer);
  if (referrer && /^https?:\/\//.test(referrer)) out.referrer = referrer;
  if (input.utm && typeof input.utm === "object") {
    const utm: NonNullable<LeadContext["utm"]> = {};
    for (const key of UTM_KEYS) {
      const value = clip((input.utm as Record<string, unknown>)[key]);
      if (value) utm[key] = value;
    }
    if (Object.keys(utm).length) out.utm = utm;
  }
  return out;
}
