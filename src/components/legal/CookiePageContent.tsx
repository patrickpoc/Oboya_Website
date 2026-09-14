import { getTranslations } from "next-intl/server";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { CookieSettingsButton } from "@/components/privacy/CookieSettingsButton";
import { Container } from "@/components/ui/container";
import { getCookieDocument } from "@/content/cookie-policy";

export async function CookiePageContent({ locale }: { locale: string }) {
  const doc = getCookieDocument(locale);
  const t = await getTranslations("cookies");

  return (
    <>
      <LegalDocument
        heroTitle={doc.heroTitle}
        heroBody={doc.heroBody}
        updated={doc.updated}
        intro={doc.intro}
        sections={doc.sections}
        contact={doc.contact}
        footerNote={doc.footerNote}
      />
      <section className="bg-white pb-[clamp(2.5rem,6vw,4.5rem)]">
        <Container size="narrow">
          <CookieSettingsButton
            label={t("manage")}
            className="rounded-full bg-oboya-blue-dark px-5 py-2.5 text-sm font-medium text-white"
          />
        </Container>
      </section>
    </>
  );
}
