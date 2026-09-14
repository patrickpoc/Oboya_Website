import type { LegalContact, LegalSection } from "@/components/legal/LegalDocument";
import {
  PRIVACY_HERO_BODY_PT,
  PRIVACY_HERO_TITLE_PT,
  PRIVACY_SECTIONS_PT,
  PRIVACY_UPDATED_PT,
} from "@/content/privacy-policy.pt-BR";

export const PRIVACY_UPDATED = "September 14, 2026";
export const PRIVACY_HERO_TITLE = "Privacy Policy";
export const PRIVACY_HERO_BODY =
  "Oboya Horticulture respects your privacy and is committed to protecting the personal data and information you provide when using our websites, online services, communication channels, and digital platforms.";

/** Fill these when the legal entity details are confirmed. Empty values are omitted from the page. */
export const PRIVACY_CONTACT: LegalContact = {
  company: "Oboya Horticulture",
  headquarters: "Dubai, United Arab Emirates",
  website: "https://www.oboya-horticulture.com",
  legalEntity: "",
  registeredAddress: "",
  registrationNumber: "",
  privacyEmail: "info@oboya.cc",
};

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "1. Important Information",
    blocks: [
      { type: "h3", text: "1.1 Purpose of this Privacy Policy" },
      {
        type: "p",
        text: "Oboya Horticulture respects your privacy and is committed to protecting the personal data and information you provide when using our websites, online services, communication channels, and digital platforms.",
      },
      {
        type: "p",
        text: "This Privacy Policy explains how Oboya Horticulture collects, uses, stores, discloses, transfers, and protects personal data obtained through our websites and digital services.",
      },
      {
        type: "p",
        text: "Our digital presence includes our institutional website and online product catalogue, through which users may explore Oboya Horticulture products and submit commercial inquiries or quotation requests.",
      },
      { type: "h3", text: "1.2 Scope" },
      {
        type: "p",
        text: "This Privacy Policy applies to the websites, subdomains, online product catalogue, forms, digital services, and other internet properties operated by or on behalf of Oboya Horticulture.",
      },
      {
        type: "p",
        text: "It may also apply to information collected when you communicate with Oboya Horticulture by email, telephone, messaging services, customer service channels, or other business communications.",
      },
      {
        type: "p",
        text: "Because Oboya Horticulture operates internationally, different privacy and data protection laws may apply depending on your location and the nature of the processing.",
      },
      { type: "h3", text: "1.3 Responsible Oboya Entity" },
      {
        type: "p",
        text: "Oboya Horticulture’s headquarters are located in Dubai, United Arab Emirates.",
      },
      {
        type: "p",
        text: "For purposes of applicable data protection legislation, the relevant Oboya Horticulture entity that determines the purposes and means of processing your Personal Data will generally act as the data controller or equivalent responsible entity.",
      },
      {
        type: "p",
        text: "For purposes of this Privacy Policy, “Oboya Horticulture,” “Oboya,” “we,” “us,” and “our” refer to the relevant Oboya Horticulture entity or entities responsible for the applicable website, service, commercial relationship, or processing activity.",
      },
      { type: "contact" },
      {
        type: "p",
        text: "If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us using the information above.",
      },
    ],
  },
  {
    title: "2. Data We Collect About You",
    blocks: [
      { type: "h3", text: "2.1 Personal Data" },
      {
        type: "p",
        text: "Depending on how you interact with Oboya Horticulture, we may collect the following categories of information.",
      },
      { type: "h3", text: "Identity Data" },
      { type: "p", text: "This may include:" },
      {
        type: "ul",
        items: [
          "first and last name;",
          "job title or professional role;",
          "company name;",
          "business identification information;",
          "country or region;",
          "and other information used to identify or distinguish you.",
        ],
      },
      { type: "h3", text: "Contact Data" },
      { type: "p", text: "This may include:" },
      {
        type: "ul",
        items: [
          "email address;",
          "telephone number;",
          "business address;",
          "company address;",
          "and other contact information.",
        ],
      },
      { type: "h3", text: "Business and Commercial Data" },
      {
        type: "p",
        text: "Because Oboya Horticulture primarily operates as a B2B horticultural business, we may collect information relating to your company and commercial requirements, including:",
      },
      {
        type: "ul",
        items: [
          "company name;",
          "company registration or tax identification number;",
          "industry or business sector;",
          "purchasing requirements;",
          "product interests;",
          "estimated quantities;",
          "destination or delivery information;",
          "quotation requests;",
          "communications with our sales team;",
          "and other information necessary to evaluate or manage a business relationship.",
        ],
      },
      { type: "h3", text: "Transaction and Inquiry Data" },
      {
        type: "p",
        text: "At the current stage, the Online Shop does not process payments or automatically complete sales transactions.",
      },
      {
        type: "p",
        text: "We may nevertheless collect information relating to commercial inquiries, including:",
      },
      {
        type: "ul",
        items: [
          "products requested;",
          "quantities;",
          "quotation requests;",
          "delivery requirements;",
          "destination information;",
          "commercial communications;",
          "and information necessary for our sales team to prepare and manage a commercial proposal.",
        ],
      },
      {
        type: "p",
        text: "If online payment or transaction functionality is introduced in the future, this Privacy Policy may be updated accordingly.",
      },
      { type: "h3", text: "Account Data" },
      { type: "p", text: "Where account functionality is available, we may collect:" },
      {
        type: "ul",
        items: [
          "username;",
          "login credentials;",
          "account preferences;",
          "account activity;",
          "saved products or inquiries;",
          "communication preferences;",
          "and other information associated with your account.",
        ],
      },
      { type: "h3", text: "Communication Data" },
      { type: "p", text: "This may include:" },
      {
        type: "ul",
        items: [
          "messages submitted through website forms;",
          "emails;",
          "commercial correspondence;",
          "customer support communications;",
          "feedback;",
          "survey responses;",
          "and other communications with Oboya.",
        ],
      },
      { type: "h3", text: "Technical Data" },
      {
        type: "p",
        text: "When you access our website, we may collect limited technical information necessary for the operation, security, and reliability of the website, such as:",
      },
      {
        type: "ul",
        items: [
          "IP address;",
          "browser type and version;",
          "operating system;",
          "device type;",
          "language preferences;",
          "pages requested;",
          "access dates and times;",
          "referring pages;",
          "and technical information transmitted by your browser or device.",
        ],
      },
      {
        type: "p",
        text: "The specific technical information collected may depend on the infrastructure and services used to operate the website.",
      },
    ],
  },
  {
    title: "3. How We Collect Data",
    blocks: [
      { type: "h3", text: "3.1 Direct Interactions" },
      {
        type: "p",
        text: "Most Personal Data currently collected through our website is provided voluntarily by users.",
      },
      { type: "p", text: "You may provide Personal Data when you:" },
      {
        type: "ul",
        items: [
          "complete a contact form;",
          "submit a quotation request;",
          "request product information;",
          "contact our commercial team;",
          "create an account, where available;",
          "submit feedback;",
          "communicate by email, telephone, or other communication channels; or",
          "otherwise communicate directly with Oboya.",
        ],
      },
      { type: "h3", text: "3.2 Automated Technologies" },
      {
        type: "p",
        text: "Our website may collect certain technical information automatically as part of normal website operation, including information required for security, reliability, hosting, and technical administration.",
      },
      {
        type: "p",
        text: "We use first-party Vercel Analytics after you accept the cookie banner. Analytics records page views, referrer, and approximate country derived from IP address. It does not use advertising cookies or cross-site tracking identifiers.",
      },
      {
        type: "p",
        text: "If you decline analytics, the site continues to work; only strictly necessary cookies (for example language preference) remain.",
      },
    ],
  },
  {
    title: "4. How We Use Your Data",
    blocks: [
      { type: "p", text: "We may process Personal Data for purposes including:" },
      {
        type: "ul",
        items: [
          "responding to inquiries;",
          "providing product information;",
          "preparing quotations;",
          "managing commercial relationships;",
          "managing quotation requests;",
          "coordinating potential orders;",
          "coordinating delivery and logistics where necessary;",
          "providing customer support;",
          "managing accounts;",
          "communicating with customers and business contacts;",
          "sending marketing communications where permitted;",
          "improving our website and digital services;",
          "maintaining website security and reliability;",
          "preventing fraud, abuse, and unauthorized access;",
          "complying with legal and regulatory obligations;",
          "establishing, exercising, or defending legal claims; and",
          "protecting our legitimate business interests.",
        ],
      },
      {
        type: "p",
        text: "At the current stage, payments are not processed directly through the Oboya website. Commercial and payment arrangements are handled separately through the applicable Oboya commercial process.",
      },
      {
        type: "p",
        text: "If payment functionality is introduced into the website in the future, additional information concerning payment processing and relevant third-party payment providers will be provided as required.",
      },
      { type: "h3", text: "4.1 Legal bases (LGPD Art. 7)" },
      {
        type: "p",
        text: "Depending on the activity, we rely on the following legal bases under Brazilian Law No. 13.709/2018 (LGPD):",
      },
      {
        type: "ul",
        items: [
          "Contact and quotation requests: performance of pre-contractual procedures at your request (Art. 7, V) and/or legitimate interest in responding to B2B inquiries (Art. 7, IX);",
          "Contract performance and order coordination: performance of a contract (Art. 7, V);",
          "Website security, fraud prevention, and hosting: legitimate interest (Art. 7, IX);",
          "Optional marketing emails: consent (Art. 7, I), collected through an unchecked checkbox;",
          "Legal, tax, and regulatory records: compliance with a legal or regulatory obligation (Art. 7, II).",
        ],
      },
    ],
  },
  {
    title: "5. How We Disclose Your Data",
    blocks: [
      {
        type: "p",
        text: "We may disclose Personal Data where necessary to operate our business, respond to inquiries, manage commercial relationships, or comply with legal obligations.",
      },
      {
        type: "p",
        text: "Depending on the circumstances, information may be shared with:",
      },
      {
        type: "ul",
        items: [
          "Oboya Horticulture group companies and affiliates;",
          "authorized employees and representatives;",
          "commercial and sales partners;",
          "website hosting and infrastructure providers;",
          "cloud service providers;",
          "website development and technical service providers;",
          "cybersecurity providers;",
          "customer relationship management providers;",
          "communications providers;",
          "logistics and transportation providers;",
          "professional advisers;",
          "government authorities and regulators;",
          "courts or law enforcement agencies where legally required; and",
          "parties involved in a merger, acquisition, restructuring, financing, or other corporate transaction.",
        ],
      },
      {
        type: "p",
        text: "We seek to ensure that third parties processing Personal Data on our behalf maintain appropriate confidentiality and security measures and process such information only for authorized purposes, subject to applicable law.",
      },
    ],
  },
  {
    title: "6. International Data Transfers and Data Hosting",
    blocks: [
      {
        type: "p",
        text: "Oboya Horticulture operates internationally and may process Personal Data in countries different from the country in which you reside.",
      },
      {
        type: "p",
        text: "The data supporting the Oboya website and its related digital infrastructure is currently hosted on servers located in the United States.",
      },
      {
        type: "p",
        text: "Accordingly, Personal Data submitted through our website may be transferred to, stored in, or processed in the United States.",
      },
      {
        type: "p",
        text: "Personal Data may also be accessed or processed by Oboya entities, employees, contractors, or service providers located in other countries where necessary to operate our business.",
      },
      {
        type: "p",
        text: "Where applicable law requires specific safeguards for international transfers, Oboya will implement appropriate mechanisms required by that law.",
      },
      {
        type: "p",
        text: "Depending on the applicable jurisdiction, these mechanisms may include:",
      },
      {
        type: "ul",
        items: [
          "adequacy decisions;",
          "standard contractual clauses;",
          "contractual safeguards;",
          "other approved transfer mechanisms; or",
          "another legally recognized transfer mechanism.",
        ],
      },
      {
        type: "p",
        text: "Named processors currently include Vercel, Inc. (website hosting, edge delivery, and optional first-party analytics) and Supabase, Inc. (database, authentication, and file storage). Both providers may process data in the United States.",
      },
      {
        type: "p",
        text: "International transfers, including to the United States, are supported where required by LGPD Art. 33 through the providers’ standard contractual clauses and equivalent contractual safeguards.",
      },
    ],
  },
  {
    title: "7. Marketing and Communications",
    blocks: [
      {
        type: "p",
        text: "We may use contact information to communicate with customers, prospective customers, business partners, and other business contacts regarding:",
      },
      {
        type: "ul",
        items: [
          "Oboya products;",
          "product information;",
          "horticultural solutions;",
          "commercial opportunities;",
          "company news;",
          "industry information;",
          "events;",
          "newsletters;",
          "and other communications relevant to your business relationship with Oboya.",
        ],
      },
      {
        type: "p",
        text: "Marketing communications will be sent only where permitted by applicable law and, where required, after obtaining appropriate consent.",
      },
      {
        type: "p",
        text: "You may opt out of marketing communications at any time by following the unsubscribe instructions provided in the relevant communication or contacting Oboya directly.",
      },
      {
        type: "p",
        text: "Opting out of marketing communications does not prevent us from sending necessary transactional, commercial, legal, security, or service-related communications.",
      },
    ],
  },
  {
    title: "8. Cookies and Tracking Technologies",
    blocks: [
      {
        type: "p",
        text: "Strictly necessary cookies may be used for language preference, security, and storing your cookie choice. They do not require consent.",
      },
      {
        type: "p",
        text: "Optional first-party Vercel Analytics is loaded only after you accept analytics cookies in the cookie notice. Analytics may process page path, referrer, and country inferred from IP address. Google Analytics and Google Tag Manager are not enabled.",
      },
      {
        type: "p",
        text: "Details of cookies we use, how we collect consent, and how to change your choice are in this Privacy Policy. You can also use Cookie settings in the website footer.",
      },
    ],
  },
  {
    title: "9. Third-Party Websites and Services",
    blocks: [
      {
        type: "p",
        text: "Our website may contain links to third-party websites or services.",
      },
      {
        type: "p",
        text: "If you access a third-party website or service, that third party may collect and process information according to its own privacy policy.",
      },
      {
        type: "p",
        text: "Oboya is not responsible for the privacy practices, security, content, or processing activities of independent third parties.",
      },
      {
        type: "p",
        text: "We recommend reviewing the privacy policy of any third-party website or service before providing Personal Data.",
      },
    ],
  },
  {
    title: "10. Data Security",
    blocks: [
      {
        type: "p",
        text: "Oboya takes reasonable and appropriate technical and organizational measures designed to protect Personal Data against unauthorized access, disclosure, accidental loss, destruction, alteration, misuse, and other unlawful or unauthorized processing.",
      },
      {
        type: "p",
        text: "Access to Personal Data is limited to individuals and service providers who have a legitimate business need to access such information.",
      },
      {
        type: "p",
        text: "However, no method of transmission or storage over the internet can be guaranteed to be completely secure.",
      },
      {
        type: "p",
        text: "Where required by applicable law, Oboya will maintain procedures for responding to suspected Personal Data breaches and will notify affected individuals and/or relevant authorities as required.",
      },
    ],
  },
  {
    title: "11. Data Retention",
    blocks: [
      {
        type: "p",
        text: "We retain Personal Data only for as long as reasonably necessary for the purposes for which it was collected, including where necessary to:",
      },
      {
        type: "ul",
        items: [
          "respond to inquiries;",
          "maintain commercial relationships;",
          "comply with legal, tax, accounting, or regulatory requirements;",
          "resolve disputes;",
          "enforce agreements;",
          "establish, exercise, or defend legal claims;",
          "maintain appropriate business records; or",
          "protect our legitimate business interests.",
        ],
      },
      {
        type: "p",
        text: "Inquiry and quotation records that do not result in a contract are retained for 12 months from the date of submission, after which they are deleted or anonymized.",
      },
      {
        type: "p",
        text: "When Personal Data is no longer required, we will delete, anonymize, or otherwise securely dispose of it where appropriate and permitted by applicable law.",
      },
    ],
  },
  {
    title: "12. Your Privacy Rights",
    blocks: [
      {
        type: "p",
        text: "Depending on your location and the applicable law, you may have rights regarding your Personal Data, including:",
      },
      {
        type: "ul",
        items: [
          "the right to information about how your Personal Data is processed;",
          "the right to access your Personal Data;",
          "the right to correct inaccurate or incomplete Personal Data;",
          "the right to request deletion of Personal Data where legally applicable;",
          "the right to request restriction of processing;",
          "the right to data portability where applicable;",
          "the right to object to certain processing activities;",
          "the right to withdraw consent where processing is based on consent;",
          "and other rights established by applicable local law.",
        ],
      },
      {
        type: "p",
        text: "These rights may be subject to legal conditions and exceptions.",
      },
    ],
  },
  {
    title: "13. Exercising Your Rights",
    blocks: [
      {
        type: "p",
        text: "To exercise applicable privacy rights or ask questions about our processing of Personal Data, contact:",
      },
      { type: "contact" },
      {
        type: "p",
        text: "We may request information necessary to verify your identity and protect Personal Data against unauthorized disclosure.",
      },
      {
        type: "p",
        text: "We will respond to legitimate requests within the timeframe required by applicable law.",
      },
    ],
  },
  {
    title: "14. Brazil – LGPD",
    blocks: [
      {
        type: "p",
        text: "Where the Brazilian General Data Protection Law (Lei Geral de Proteção de Dados Pessoais – LGPD) applies, Oboya will process Personal Data in accordance with applicable Brazilian data protection requirements.",
      },
      {
        type: "p",
        text: "Depending on the circumstances, individuals may have rights including:",
      },
      {
        type: "ul",
        items: [
          "confirmation of the existence of processing;",
          "access to Personal Data;",
          "correction of incomplete, inaccurate, or outdated information;",
          "anonymization, blocking, or deletion of unnecessary or unlawfully processed data;",
          "portability, where applicable;",
          "information regarding public and private entities with which Personal Data has been shared;",
          "information about the possibility of refusing consent and the consequences of such refusal;",
          "revocation of consent;",
          "and other rights established under applicable law.",
        ],
      },
      { type: "p", text: "Requests may be submitted through the Privacy Contact listed above." },
      {
        type: "p",
        text: "Where applicable, individuals may also contact the Autoridade Nacional de Proteção de Dados (ANPD) or another competent authority.",
      },
    ],
  },
  {
    title: "15. European Economic Area, United Kingdom and Other GDPR-Regulated Jurisdictions",
    blocks: [
      {
        type: "p",
        text: "Where the GDPR, UK GDPR, or equivalent data protection legislation applies, Oboya will process Personal Data in accordance with the applicable requirements.",
      },
      {
        type: "p",
        text: "Individuals in these jurisdictions may have rights including access, rectification, erasure, restriction, portability, objection, withdrawal of consent, and other rights provided by applicable law.",
      },
      {
        type: "p",
        text: "Individuals may also have the right to lodge a complaint with the competent data protection supervisory authority in their country or region.",
      },
    ],
  },
  {
    title: "16. United Arab Emirates",
    blocks: [
      {
        type: "p",
        text: "As Oboya Horticulture’s headquarters are located in Dubai, United Arab Emirates, Personal Data may also be processed in accordance with applicable UAE data protection legislation.",
      },
      {
        type: "p",
        text: "Where UAE data protection laws apply to our processing activities, Oboya will comply with the applicable requirements concerning the collection, processing, storage, disclosure, security, and rights relating to Personal Data.",
      },
    ],
  },
  {
    title: "17. Business Information and B2B Contacts",
    blocks: [
      {
        type: "p",
        text: "Because Oboya operates primarily in the B2B horticultural sector, we may process information relating to individuals acting on behalf of companies and organizations.",
      },
      { type: "p", text: "This may include:" },
      {
        type: "ul",
        items: [
          "purchasers;",
          "procurement professionals;",
          "distributors;",
          "wholesalers;",
          "retailers;",
          "producers;",
          "suppliers;",
          "commercial representatives;",
          "logistics contacts;",
          "and other business representatives.",
        ],
      },
      {
        type: "p",
        text: "Even when information is provided in a professional capacity, it may constitute Personal Data under applicable law.",
      },
      {
        type: "p",
        text: "We process such information for legitimate business purposes, commercial communication, quotation management, customer relationship management, contractual activities, compliance, and other purposes described in this Privacy Policy.",
      },
    ],
  },
  {
    title: "18. No Sale of Personal Data",
    blocks: [
      {
        type: "p",
        text: "Oboya does not sell Personal Data to third parties for their own unrelated commercial purposes.",
      },
      {
        type: "p",
        text: "Where applicable law defines certain activities such as selling, sharing, or targeted advertising more broadly, Oboya will comply with the applicable legal requirements.",
      },
    ],
  },
  {
    title: "19. Changes to this Privacy Policy",
    blocks: [
      {
        type: "p",
        text: "Oboya may periodically update this Privacy Policy to reflect:",
      },
      {
        type: "ul",
        items: [
          "changes in applicable laws;",
          "regulatory requirements;",
          "changes to our business;",
          "changes to our websites or digital services;",
          "changes to technology;",
          "or changes to our data processing practices.",
        ],
      },
      {
        type: "p",
        text: "When material changes are made, we may provide additional notice where required by applicable law.",
      },
      {
        type: "p",
        text: "The updated version will be published on the website and will include the applicable Last Updated date.",
      },
    ],
  },
  {
    title: "20. Contact Information",
    blocks: [
      {
        type: "p",
        text: "For questions, comments, privacy requests, or complaints concerning this Privacy Policy or the processing of your Personal Data, please contact:",
      },
      { type: "contact" },
    ],
  },
];

export function getPrivacyDocument(locale: string) {
  const isPt = locale === "pt-BR";
  return {
    heroTitle: isPt ? PRIVACY_HERO_TITLE_PT : PRIVACY_HERO_TITLE,
    heroBody: isPt ? PRIVACY_HERO_BODY_PT : PRIVACY_HERO_BODY,
    updated: isPt ? PRIVACY_UPDATED_PT : PRIVACY_UPDATED,
    sections: isPt ? PRIVACY_SECTIONS_PT : PRIVACY_SECTIONS,
    contact: PRIVACY_CONTACT,
    footerNote: isPt ? "Fim da Política de Privacidade" : "End of Privacy Policy",
    intro:
      locale === "es" || locale === "zh-CN"
        ? [
            "The controlling versions of this Privacy Policy are English and Portuguese (Brazil). This page is shown in English; contact info@oboya.cc if you need assistance.",
          ]
        : undefined,
  };
}
