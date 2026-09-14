import type { LegalContact, LegalSection } from "@/components/legal/LegalDocument";
import { PRIVACY_CONTACT } from "@/content/privacy-policy";
import {
  COOKIE_HERO_BODY_PT,
  COOKIE_HERO_TITLE_PT,
  COOKIE_SECTIONS_PT,
  COOKIE_UPDATED_PT,
} from "@/content/cookie-policy.pt-BR";

export const COOKIE_UPDATED = "September 14, 2026";
export const COOKIE_HERO_TITLE = "Cookie Policy";
export const COOKIE_HERO_BODY =
  "This Cookie Policy explains which cookies and similar technologies Oboya Horticulture uses on this website, why we use them, and how you can manage your consent.";

export const COOKIE_CONTACT: LegalContact = PRIVACY_CONTACT;

export const COOKIE_SECTIONS: LegalSection[] = [
  {
    title: "1. What this Policy covers",
    blocks: [
      {
        type: "p",
        text: "This Cookie Policy describes how Oboya Horticulture uses cookies and similar technologies on our websites and digital services, including the online product catalogue.",
      },
      {
        type: "p",
        text: "It supplements our Privacy Policy. The controlling versions are English and Portuguese (Brazil).",
      },
      { type: "contact" },
    ],
  },
  {
    title: "2. What cookies are",
    blocks: [
      {
        type: "p",
        text: "Cookies are small files stored on your device when you visit a website. Similar technologies include local storage (localStorage) and session identifiers.",
      },
      {
        type: "p",
        text: "We use them to (i) operate the website, (ii) remember your language, and (iii), only with your consent, measure site usage in aggregate.",
      },
    ],
  },
  {
    title: "3. How we collect your consent",
    blocks: [
      {
        type: "p",
        text: "On your first visit we show a cookie notice. Strictly necessary cookies are applied automatically because the site cannot function reliably without them.",
      },
      {
        type: "p",
        text: "Optional cookies (first-party analytics) are enabled only if you accept all cookies, or enable the Analytics category and save. Refusing optional cookies does not block browsing.",
      },
      {
        type: "p",
        text: "Your choice is stored in the first-party cookie oboya_cookie_consent (necessary, up to 12 months), including accepted categories, policy version, and date. You can change it at any time via “Cookie settings” in the footer or the notice.",
      },
    ],
  },
  {
    title: "4. Strictly necessary cookies",
    blocks: [
      {
        type: "p",
        text: "These cookies do not require consent. Without them the website cannot operate reliably.",
      },
      {
        type: "ul",
        items: [
          "NEXT_LOCALE — selected language (next-intl); session/preference duration; first-party.",
          "oboya_cookie_consent — record of your cookie choice; up to 12 months; first-party.",
          "Supabase authentication cookies (for example sb-*-auth-token) — only on /admin and /auth for a secure CMS session; they are not used on the public site.",
        ],
      },
    ],
  },
  {
    title: "5. Analytics cookies and similar technologies (optional)",
    blocks: [
      {
        type: "p",
        text: "Only after consent do we load first-party Vercel Analytics. It may record page path, referrer, and country inferred from IP address, in aggregate, to understand site usage.",
      },
      {
        type: "ul",
        items: [
          "Vercel Analytics — first-party cookies or local storage set by the provider after you accept; purpose: audience statistics; legal basis: consent.",
        ],
      },
      {
        type: "p",
        text: "Google Analytics, Google Tag Manager, social pixels, and advertising cookies are not enabled on this website as of the date of this Policy.",
      },
    ],
  },
  {
    title: "6. Local storage (not a cookie)",
    blocks: [
      {
        type: "p",
        text: "The Shop may store country, currency, and quotation items in the browser’s localStorage so your draft request stays on this device. This is not an advertising tracker and is not shared with advertisers.",
      },
      {
        type: "p",
        text: "The administrative console may store interface language in localStorage. That applies only to CMS users.",
      },
    ],
  },
  {
    title: "7. How to manage or withdraw consent",
    blocks: [
      {
        type: "p",
        text: "Use “Cookie settings” in the footer, the cookie notice, or delete this site’s cookies in your browser. Deleting cookies will show the notice again.",
      },
      {
        type: "p",
        text: "You may also block cookies in browser settings. Blocking necessary cookies can break language, administrative session, or the consent record itself.",
      },
    ],
  },
  {
    title: "8. Updates",
    blocks: [
      {
        type: "p",
        text: "We may update this Policy when the technologies we use change. The date at the top of the page is the latest revision. If the consent version changes, the notice may appear again.",
      },
    ],
  },
  {
    title: "9. Contact",
    blocks: [
      {
        type: "p",
        text: "Questions about cookies or privacy: use the details below or see the Privacy Policy.",
      },
      { type: "contact" },
    ],
  },
];

export function getCookieDocument(locale: string) {
  const isPt = locale === "pt-BR";
  return {
    heroTitle: isPt ? COOKIE_HERO_TITLE_PT : COOKIE_HERO_TITLE,
    heroBody: isPt ? COOKIE_HERO_BODY_PT : COOKIE_HERO_BODY,
    updated: isPt ? COOKIE_UPDATED_PT : COOKIE_UPDATED,
    sections: isPt ? COOKIE_SECTIONS_PT : COOKIE_SECTIONS,
    contact: COOKIE_CONTACT,
    footerNote: isPt ? "Fim da Política de Cookies" : "End of Cookie Policy",
    intro:
      locale === "es" || locale === "zh-CN"
        ? [
            "The controlling versions of this Cookie Policy are English and Portuguese (Brazil). This page is shown in English; contact info@oboya.cc if you need assistance.",
          ]
        : undefined,
  };
}
