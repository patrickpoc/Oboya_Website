import { LegalDocument } from "@/components/legal/LegalDocument";
import {
  TERMS_CONTACT,
  TERMS_HERO_BODY,
  TERMS_HERO_TITLE,
  TERMS_INTRO,
  TERMS_SECTIONS,
  TERMS_UPDATED,
} from "@/content/terms-of-use";

export function LegalPageContent() {
  return (
    <LegalDocument
      heroTitle={TERMS_HERO_TITLE}
      heroBody={TERMS_HERO_BODY}
      updated={TERMS_UPDATED}
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
      contact={{
        company: TERMS_CONTACT.company,
        website: TERMS_CONTACT.website,
      }}
      footerNote={TERMS_CONTACT.privacyNote}
    />
  );
}
