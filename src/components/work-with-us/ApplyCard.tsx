import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PublicJobOpening } from "@/lib/cms/careers/public";
import { OpeningMetaChips } from "./OpeningMetaChips";
import { ShareButtons } from "./ShareButtons";

const ctaClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-full bg-oboya-green px-6 text-sm font-semibold tracking-wider text-white uppercase transition-colors hover:bg-oboya-green/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-green";

export function ApplyCard({
  opening,
  salary,
  url,
}: {
  opening: PublicJobOpening;
  salary?: string;
  url: string;
}) {
  const t = useTranslations("workWithUsPage.detail");
  return (
    <aside className="rounded-sm bg-white p-6 shadow-[var(--shadow-card)] lg:sticky lg:top-28">
      <h2 className="font-display text-xl font-semibold text-oboya-blue-dark">{t("apply.title")}</h2>
      <p className="mt-2 text-sm text-oboya-blue-dark/70">{t("apply.description")}</p>
      {salary ? (
        <p className="mt-4 text-sm">
          <span className="font-semibold text-oboya-blue-dark">{t("salary")}: </span>
          <span className="text-oboya-blue-dark/80">{salary}</span>
        </p>
      ) : null}
      <OpeningMetaChips opening={opening} className="mt-4" />
      <Link href={`/work/${opening.slug}/apply`} className={`${ctaClass} mt-6`}>
        {t("apply.cta")}
      </Link>
      <div className="mt-6 border-t border-border/60 pt-5">
        <ShareButtons url={url} />
      </div>
    </aside>
  );
}

export function MobileApplyBar({ slug }: { slug: string }) {
  const t = useTranslations("workWithUsPage.detail.apply");
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <Link href={`/work/${slug}/apply`} className={ctaClass}>
        {t("mobileCta")}
      </Link>
    </div>
  );
}
