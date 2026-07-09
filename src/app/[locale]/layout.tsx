import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { fontVariables, notoSansSC } from "@/lib/fonts";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/AppProviders";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL("https://oboya.cc"),
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
        <NextIntlClientProvider messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
