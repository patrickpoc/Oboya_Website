import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { fontVariables, notoSansSC } from "@/lib/fonts";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/constants/site";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/AppProviders";
import { ConditionalAnalytics } from "@/components/privacy/ConditionalAnalytics";
import { CookieConsentBanner } from "@/components/privacy/CookieConsentBanner";
import "../globals.css";

/**
 * Safety ISR fallback (seconds); CMS writes still bust cache via revalidatePath.
 * Must be a literal — Next cannot statically analyze imported segment configs.
 * Keep in sync with SITE_REVALIDATE_SECONDS in src/lib/cms/revalidate-site.ts.
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
      { url: "/favicon.png?v=2", type: "image/png", sizes: "48x48" },
      { url: "/icon.png?v=2", type: "image/png", sizes: "192x192" },
    ],
    shortcut: ["/favicon.ico?v=2"],
    apple: [{ url: "/apple-icon.png?v=2", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#01203f",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={cn(
        fontVariables,
        locale === "zh-CN" && notoSansSC.variable,
        "h-full scroll-smooth"
      )}
    >
      <body
        className={cn(
          "min-h-full flex flex-col font-body antialiased",
          locale === "zh-CN" && "font-chinese"
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
          <AppProviders>
            {children}
            <CookieConsentBanner />
          </AppProviders>
        </NextIntlClientProvider>
        <ConditionalAnalytics />
      </body>
    </html>
  );
}
