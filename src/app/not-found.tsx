import { Link } from "@/i18n/navigation";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <SiteLayout>
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 text-sm font-medium tracking-[0.2em] text-oboya-green uppercase">
          404
        </p>
        <h1 className="mb-4 font-display text-4xl font-semibold text-oboya-blue-dark">
          {t("notFoundTitle")}
        </h1>
        <p className="mb-8 max-w-md text-muted-foreground">{t("notFoundDesc")}</p>
        <Link
          href="/"
          className={buttonVariants({
            size: "cta",
            className: "bg-oboya-green text-white hover:bg-oboya-green/90",
          })}
        >
          {t("backHome")}
        </Link>
      </Container>
    </SiteLayout>
  );
}
