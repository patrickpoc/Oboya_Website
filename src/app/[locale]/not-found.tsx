import { getTranslations } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { Container } from "@/components/ui/container";
import { NotFoundPage } from "@/components/ui/not-found-page";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <SiteLayout>
      <Container className="flex min-h-[60vh] items-center justify-center py-20">
        <NotFoundPage
          title={t("notFoundTitle")}
          description={t("notFoundDesc")}
          backHomeLabel={t("backHome")}
        />
      </Container>
    </SiteLayout>
  );
}
