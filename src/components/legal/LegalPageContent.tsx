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
        headquarters: TERMS_CONTACT.headquarters,
        website: TERMS_CONTACT.website,
        legalEntity: TERMS_CONTACT.legalEntity,
        registeredAddress: TERMS_CONTACT.registeredAddress,
        privacyEmail: TERMS_CONTACT.privacyEmail,
      }}
      footerNote={TERMS_CONTACT.privacyNote}
    />
  );
}
