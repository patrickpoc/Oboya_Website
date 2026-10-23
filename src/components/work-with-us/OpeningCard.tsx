import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PublicJobOpening } from "@/lib/cms/careers/public";
import { OpeningMetaChips } from "./OpeningMetaChips";
import { PostedDate } from "./PostedDate";

export function OpeningCard({ opening }: { opening: PublicJobOpening }) {
  const t = useTranslations("workWithUsPage.card");
  return (
    <li>
      <Link
        href={`/work/${opening.slug}`}
        className="group flex flex-col gap-4 rounded-sm border border-border/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-[var(--shadow-card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-blue md:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-lg font-semibold text-oboya-blue-dark group-hover:text-oboya-blue md:text-xl">
            {opening.title}
          </h3>
          <ArrowUpRight
            className="mt-1 size-5 shrink-0 text-oboya-blue-dark/40 transition-colors group-hover:text-oboya-green"
            aria-hidden
          />
        </div>
        {opening.summary ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-oboya-blue-dark/70">{opening.summary}</p>
        ) : null}
        <OpeningMetaChips opening={opening} />
        <div className="flex items-center justify-between gap-3 text-xs text-oboya-blue-dark/60">
          <PostedDate iso={opening.postedAt} />
          <span className="sr-only">{t("viewOpening")}</span>
          {opening.positions > 1 ? <span>{t("positions", { count: opening.positions })}</span> : null}
        </div>
      </Link>
    </li>
  );
}
