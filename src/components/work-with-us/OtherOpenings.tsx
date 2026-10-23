import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import type { PublicJobOpening } from "@/lib/cms/careers/public";
import { OpeningsList } from "./OpeningsBoard";

/** Up to 3 other roles, same country first. */
export function OtherOpenings({ current, all }: { current: PublicJobOpening; all: PublicJobOpening[] }) {
  const t = useTranslations("workWithUsPage.detail.other");
  const others = all
    .filter((o) => o.slug !== current.slug)
    .sort((a, b) => Number(b.countryCode === current.countryCode) - Number(a.countryCode === current.countryCode))
    .slice(0, 3);
  if (!others.length) return null;
  return (
    <section className="pb-16 md:pb-24" aria-labelledby="other-openings">
      <Container size="wide">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="other-openings" className="font-display text-2xl font-semibold text-oboya-blue-dark">
            {t("title")}
          </h2>
          <Link href="/work" className="text-sm font-medium text-oboya-blue underline-offset-2 hover:underline">
            {t("viewAll")}
          </Link>
        </div>
        <OpeningsList openings={others} />
      </Container>
    </section>
  );
}
