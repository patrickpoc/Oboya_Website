import { Container } from "@/components/ui/container";
import { PageIntroBanner } from "@/components/ui/PageIntroBanner";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "letters"; items: string[] }
  | { type: "contact" };

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

export interface LegalContact {
  company: string;
  headquarters?: string;
  website?: string;
  legalEntity?: string;
  registeredAddress?: string;
  registrationNumber?: string;
  privacyEmail?: string;
}

interface LegalDocumentProps {
  heroTitle: string;
  heroBody: string;
  updated: string;
  intro?: string[];
  sections: LegalSection[];
  contact: LegalContact;
  footerNote?: string;
}

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

function ContactBlock({ contact }: { contact: LegalContact }) {
  const rows: { label: string; value: string }[] = [];
  if (contact.headquarters) {
    rows.push({ label: "Headquarters", value: contact.headquarters });
  }
  if (contact.legalEntity) {
    rows.push({ label: "Legal Entity", value: contact.legalEntity });
  }
  if (contact.registeredAddress) {
    rows.push({ label: "Registered Address", value: contact.registeredAddress });
  }
  if (contact.registrationNumber) {
    rows.push({
      label: "Company Registration Number",
      value: contact.registrationNumber,
    });
  }
  rows.push({
    label: "Legal Contact",
    value: contact.privacyEmail || "Robert@shopquip.se",
  });
  if (contact.website) {
    rows.push({ label: "Website", value: contact.website });
  }

  return (
    <address className="mt-4 not-italic font-body text-[0.975rem] leading-[1.7] text-oboya-blue-dark/75">
      <p className="font-medium text-oboya-blue-dark">{contact.company}</p>
      {rows.map((row) => (
        <p key={row.label} className="mt-1">
          {row.label}:{" "}
          {row.label === "Website" ? (
            <a
              href={row.value}
              className="text-oboya-blue-light underline-offset-2 hover:underline"
            >
              {row.value.replace(/^https?:\/\//, "")}
            </a>
          ) : row.label === "Legal Contact" ? (
            <a
              href={`mailto:${row.value}`}
              className="text-oboya-blue-light underline-offset-2 hover:underline"
            >
              {row.value}
            </a>
          ) : (
            row.value
          )}
        </p>
      ))}
    </address>
  );
}

function Block({
  block,
  contact,
}: {
  block: LegalBlock;
  contact: LegalContact;
}) {
  if (block.type === "p") {
    return (
      <p className="mt-3 font-body text-[0.975rem] leading-[1.7] text-oboya-blue-dark/75">
        {block.text}
      </p>
    );
  }

  if (block.type === "h3") {
    return (
      <h3 className="mt-8 font-display text-base font-medium tracking-[-0.01em] text-oboya-blue-dark md:text-lg">
        {block.text}
      </h3>
    );
  }

  if (block.type === "ul") {
    return (
      <ul className="mt-3 list-disc space-y-1.5 pl-5 font-body text-[0.975rem] leading-[1.7] text-oboya-blue-dark/75">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "letters") {
    return (
      <ol className="mt-3 list-none space-y-1.5 pl-0 font-body text-[0.975rem] leading-[1.7] text-oboya-blue-dark/75">
        {block.items.map((item, index) => (
          <li key={item} className="flex gap-2">
            <span className="shrink-0 font-medium text-oboya-blue-dark">
              {LETTERS[index]}.
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  return <ContactBlock contact={contact} />;
}

export function LegalDocument({
  heroTitle,
  heroBody,
  updated,
  intro,
  sections,
  contact,
  footerNote,
}: LegalDocumentProps) {
  return (
    <>
      <PageIntroBanner title={heroTitle} body={heroBody} />

      <section className="bg-white py-[clamp(2.5rem,6vw,4.5rem)]">
        <Container size="narrow">
          <p className="mb-8 font-body text-sm text-oboya-blue-dark/55">
            Last Updated: {updated}
          </p>

          {intro && intro.length > 0 ? (
            <div className="space-y-4">
              {intro.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="font-body text-[0.975rem] leading-[1.7] text-oboya-blue-dark/75"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          <div className={intro && intro.length > 0 ? "mt-12 space-y-12" : "space-y-12"}>
            {sections.map((section) => (
              <article key={section.title}>
                <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-oboya-blue-dark md:text-xl">
                  {section.title}
                </h2>
                {section.blocks.map((block, index) => (
                  <Block
                    key={`${section.title}-${index}`}
                    block={block}
                    contact={contact}
                  />
                ))}
              </article>
            ))}
          </div>

          {footerNote ? (
            <p className="mt-12 font-body text-[0.975rem] leading-[1.7] text-oboya-blue-dark/75">
              {footerNote}
            </p>
          ) : null}

          <p className="mt-8 font-body text-sm text-oboya-blue-dark/55">
            Last Updated: {updated}
          </p>
        </Container>
      </section>
    </>
  );
}
