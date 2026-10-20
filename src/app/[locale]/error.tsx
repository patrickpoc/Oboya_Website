"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/layouts/Navbar";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { NotFoundPage } from "@/components/ui/not-found-page";

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  return (
    <>
      <Navbar transparent={false} solidTone="light" />
      <main className="min-h-screen pt-16 md:pt-20">
      <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20">
        <NotFoundPage
          title={t("errorTitle")}
          description={t("errorDesc")}
          backHomeLabel={t("backHome")}
        />
        <button
          type="button"
          onClick={() => reset()}
          className={buttonVariants({
            variant: "outline",
            className: "border-oboya-blue-dark text-oboya-blue-dark",
          })}
        >
          {t("tryAgain")}
        </button>
      </Container>
      </main>
    </>
  );
}
