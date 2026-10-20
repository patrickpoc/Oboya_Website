"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";

export default function WorkError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations();
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 pt-32 text-center">
      <h1 className="font-display text-2xl font-semibold text-oboya-blue-dark">{t("common.errorTitle")}</h1>
      <p className="max-w-md text-sm text-oboya-blue-dark/70" role="alert">
        {t("workWithUsPage.board.loadError")}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-11 rounded-full border border-oboya-blue-dark px-6 text-sm font-semibold tracking-wider text-oboya-blue-dark uppercase hover:bg-oboya-blue-dark hover:text-white"
        >
          {t("common.tryAgain")}
        </button>
        <Link href="/contact" className="inline-flex min-h-11 items-center px-4 text-sm text-oboya-blue underline-offset-2 hover:underline">
          {t("pages.contact.title")}
        </Link>
      </div>
    </Container>
  );
}
