import { LegalDocument } from "@/components/legal/LegalDocument";
import { getPrivacyDocument } from "@/content/privacy-policy";

export function PrivacyPageContent({ locale }: { locale: string }) {
  const doc = getPrivacyDocument(locale);
  return (
    <LegalDocument
      heroTitle={doc.heroTitle}
      heroBody={doc.heroBody}
      updated={doc.updated}
      intro={doc.intro}
      sections={doc.sections}
      contact={doc.contact}
      footerNote={doc.footerNote}
    />
  );
}
