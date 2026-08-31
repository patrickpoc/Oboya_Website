import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { AppProviders } from "@/components/providers/AppProviders";
import { Container } from "@/components/ui/container";
import { NotFoundPage } from "@/components/ui/not-found-page";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export default async function GlobalNotFound() {
  const locale = routing.defaultLocale;
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <html lang={locale} className={cn(fontVariables, "h-full scroll-smooth")}>
      <body className="flex min-h-full flex-col font-body antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>
            <SiteLayout>
              <Container className="flex min-h-[60vh] items-center justify-center py-20">
                <NotFoundPage
                  title={t("notFoundTitle")}
                  description={t("notFoundDesc")}
                  backHomeLabel={t("backHome")}
                  homeHref={`/${locale}`}
                />
              </Container>
            </SiteLayout>
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
