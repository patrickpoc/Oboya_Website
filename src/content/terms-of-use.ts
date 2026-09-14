export type TermsBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "letters"; items: string[] }
  | { type: "contact" };

export interface TermsSection {
  title: string;
  blocks: TermsBlock[];
}

export const TERMS_UPDATED = "September 14, 2026";
export const TERMS_HERO_TITLE = "Terms of Use";
export const TERMS_HERO_BODY =
  "Please read these Terms of Use carefully before accessing or using the websites, digital platforms, online stores, applications, product catalogs, services, and other digital services operated by Oboya Horticulture Industries AB and/or its applicable subsidiaries, affiliates, or authorized entities (collectively, “Oboya”, “we”, “us”, or “our”).";

export const TERMS_INTRO: string[] = [
  "These Terms of Use (“Terms”) govern your access to and use of Oboya’s websites and digital services (collectively, the “Platform”).",
  "By accessing, browsing, registering an account, submitting information, requesting a quotation, placing an order, or otherwise using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and any applicable policies referenced herein.",
  "If you do not agree with these Terms, you must not access or use the Platform.",
  "These Terms apply to users accessing the Platform from North America, South America, Europe, Asia, Africa, and other jurisdictions where the Platform is made available. Certain services, products, features, payment methods, delivery options, and legal provisions may vary depending on the country or region in which you are located.",
];

export const TERMS_SECTIONS: TermsSection[] = [
  {
    title: "1. About Oboya",
    blocks: [
      {
        type: "p",
        text: "Oboya Horticulture is an international horticulture company providing products and solutions for professional growers, nurseries, retailers, distributors, wholesalers, florists, agricultural businesses, and other customers in the horticultural industry.",
      },
      {
        type: "p",
        text: "The Platform may provide information regarding Oboya’s products, solutions, services, projects, facilities, and business activities.",
      },
      {
        type: "p",
        text: "Depending on the user’s location and the applicable commercial structure, the Platform may also provide functionality for product inquiries, quotation requests, account registration, purchasing, marketplace activities, and communication between buyers and sellers.",
      },
      {
        type: "p",
        text: "The specific Oboya entity responsible for a particular transaction or service may vary depending on the customer’s country, product, delivery destination, and commercial arrangement.",
      },
    ],
  },
  {
    title: "2. Acceptance of these Terms",
    blocks: [
      { type: "p", text: "By using the Platform, you confirm that:" },
      {
        type: "letters",
        items: [
          "you have the legal capacity required to enter into these Terms under the laws applicable to you;",
          "if you are using the Platform on behalf of a company, organization, or other legal entity, you have authority to bind that entity;",
          "the information you provide to Oboya is accurate, complete, and current;",
          "you will comply with all applicable laws and regulations when using the Platform; and",
          "you will use the Platform only for lawful and legitimate purposes.",
        ],
      },
      {
        type: "p",
        text: "If local law requires a different minimum age or other eligibility requirement, that requirement will apply to the extent required by law.",
      },
    ],
  },
  {
    title: "3. International availability",
    blocks: [
      {
        type: "p",
        text: "Oboya operates internationally and the Platform may be accessible from multiple countries and regions.",
      },
      {
        type: "p",
        text: "However, the availability of products, services, prices, payment methods, delivery options, regulatory approvals, certifications, warranties, and other features may differ between jurisdictions.",
      },
      {
        type: "p",
        text: "Oboya does not represent that every product, service, or feature available through the Platform is suitable, authorized, certified, registered, or available for use in every country.",
      },
      {
        type: "p",
        text: "Users are responsible for complying with applicable local laws and regulations relating to the purchase, importation, distribution, resale, transportation, storage, or use of products.",
      },
      { type: "p", text: "Where applicable, additional country-specific terms may apply." },
    ],
  },
  {
    title: "4. User accounts",
    blocks: [
      {
        type: "p",
        text: "Certain areas or features of the Platform may require the creation of an account.",
      },
      { type: "p", text: "You are responsible for:" },
      {
        type: "ul",
        items: [
          "providing accurate registration information;",
          "maintaining the confidentiality of your login credentials;",
          "maintaining accurate company and contact information;",
          "restricting unauthorized access to your account;",
          "all activities conducted through your account; and",
          "promptly notifying Oboya if you suspect unauthorized access or use.",
        ],
      },
      {
        type: "p",
        text: "You may not create an account using false information, impersonate another person or company, or create an account for fraudulent or unlawful purposes.",
      },
      {
        type: "p",
        text: "Oboya may suspend or terminate an account where it reasonably believes that the account has been used in violation of these Terms, applicable law, or the interests or security of the Platform.",
      },
    ],
  },
  {
    title: "5. Business and B2B use",
    blocks: [
      {
        type: "p",
        text: "The Platform may be intended primarily for professional and business-to-business users.",
      },
      {
        type: "p",
        text: "Where you access or use the Platform on behalf of a business, you represent that you are authorized to act on behalf of that business.",
      },
      {
        type: "p",
        text: "Business customers may be required to provide information including, where applicable:",
      },
      {
        type: "ul",
        items: [
          "legal entity name;",
          "registration or tax identification number;",
          "billing information;",
          "delivery information;",
          "contact information;",
          "business sector;",
          "authorized representatives; and",
          "other information reasonably required to provide the requested services.",
        ],
      },
      {
        type: "p",
        text: "Oboya may verify business information before providing certain services or completing certain transactions.",
      },
    ],
  },
  {
    title: "6. Product information",
    blocks: [
      {
        type: "p",
        text: "Oboya seeks to provide accurate and useful information regarding its products and solutions.",
      },
      {
        type: "p",
        text: "However, product images, colors, dimensions, specifications, technical information, availability, packaging, and other information displayed on the Platform may be subject to change.",
      },
      {
        type: "p",
        text: "Colors displayed on digital screens may also differ from the actual appearance of physical products.",
      },
      {
        type: "p",
        text: "Unless expressly stated otherwise, information presented on the Platform does not constitute a guarantee that a particular product, specification, certification, quantity, or feature will be available at the time of purchase or delivery.",
      },
      {
        type: "p",
        text: "Technical specifications and product documentation supplied for a specific order or quotation may take precedence over general information presented on the Platform.",
      },
    ],
  },
  {
    title: "7. Quotations and commercial information",
    blocks: [
      {
        type: "p",
        text: "Certain products or services may be available only through quotation or commercial inquiry.",
      },
      {
        type: "p",
        text: "Submitting a quotation request does not necessarily constitute an order or create a binding obligation for Oboya to supply the requested products.",
      },
      { type: "p", text: "A quotation may be subject to:" },
      {
        type: "ul",
        items: [
          "product availability;",
          "minimum order quantities;",
          "geographic availability;",
          "transportation and logistics;",
          "applicable taxes and duties;",
          "payment conditions;",
          "currency exchange rates;",
          "regulatory requirements;",
          "credit approval; and",
          "other commercial conditions.",
        ],
      },
      {
        type: "p",
        text: "A quotation will become binding only where expressly confirmed by the applicable Oboya entity in accordance with the applicable commercial terms.",
      },
    ],
  },
  {
    title: "8. Orders and purchases",
    blocks: [
      {
        type: "p",
        text: "Where online purchasing functionality is available, additional commercial terms may apply to the transaction.",
      },
      {
        type: "p",
        text: "An order submitted through the Platform may be subject to acceptance and confirmation by Oboya or the applicable seller.",
      },
      {
        type: "p",
        text: "Oboya reserves the right, where permitted by applicable law, to decline, cancel, or modify an order where:",
      },
      {
        type: "ul",
        items: [
          "the requested product is unavailable;",
          "there is an obvious pricing or product information error;",
          "payment cannot be successfully processed;",
          "required customer information cannot be verified;",
          "delivery cannot reasonably be completed;",
          "regulatory or legal restrictions apply; or",
          "the transaction appears fraudulent or unauthorized.",
        ],
      },
      {
        type: "p",
        text: "The applicable price, taxes, delivery charges, payment conditions, and other commercial terms will be communicated during the relevant purchasing or quotation process.",
      },
    ],
  },
  {
    title: "9. Marketplace and third-party sellers",
    blocks: [
      {
        type: "p",
        text: "Where the Platform operates as a marketplace, products may be offered by Oboya, its subsidiaries, affiliates, partners, suppliers, distributors, or other authorized third-party sellers.",
      },
      {
        type: "p",
        text: "Where applicable, the identity of the seller will be communicated during the purchasing process.",
      },
      {
        type: "p",
        text: "Each seller is responsible for the accuracy of information it provides regarding its products, including applicable specifications, availability, pricing, documentation, and other commercial information.",
      },
      {
        type: "p",
        text: "Where a transaction is entered into directly between a buyer and a third-party seller, the applicable seller may be responsible for fulfilling the seller’s contractual obligations.",
      },
      {
        type: "p",
        text: "Oboya may provide the technological infrastructure through which buyers and sellers communicate, submit inquiries, request quotations, or conduct transactions.",
      },
      {
        type: "p",
        text: "The specific responsibilities of Oboya, the seller, and the buyer may be further established in applicable commercial or seller terms.",
      },
    ],
  },
  {
    title: "10. Payments",
    blocks: [
      {
        type: "p",
        text: "Where payment functionality is available, payments may be processed through third-party payment service providers.",
      },
      {
        type: "p",
        text: "Available payment methods and currencies may vary depending on the customer’s location and the applicable transaction.",
      },
      {
        type: "p",
        text: "By submitting payment information, you represent that you are authorized to use the applicable payment method.",
      },
      {
        type: "p",
        text: "Oboya may use third-party payment processors, financial institutions, fraud prevention services, and other service providers to process or facilitate transactions.",
      },
      {
        type: "p",
        text: "Oboya generally does not directly store complete payment card information where payment processing is handled by a specialized third-party payment provider.",
      },
      { type: "p", text: "Additional payment terms may apply to specific transactions." },
    ],
  },
  {
    title: "11. Taxes, duties, and import requirements",
    blocks: [
      {
        type: "p",
        text: "Customers are responsible for taxes, duties, customs charges, import fees, and other governmental charges applicable to their transactions, except where expressly stated otherwise.",
      },
      {
        type: "p",
        text: "For international transactions, the customer may be responsible for complying with import and customs requirements applicable in the destination country.",
      },
      {
        type: "p",
        text: "Products may be subject to different regulatory requirements depending on the country of destination.",
      },
      {
        type: "p",
        text: "Oboya does not guarantee that a product available in one jurisdiction may lawfully be imported, distributed, or used in another jurisdiction.",
      },
    ],
  },
  {
    title: "12. Shipping and delivery",
    blocks: [
      { type: "p", text: "Delivery terms may vary according to:" },
      {
        type: "ul",
        items: [
          "destination country;",
          "product;",
          "seller;",
          "shipping method;",
          "order quantity;",
          "availability;",
          "applicable Incoterms;",
          "customs procedures; and",
          "other commercial conditions.",
        ],
      },
      {
        type: "p",
        text: "Estimated delivery dates are provided for guidance unless expressly agreed as binding.",
      },
      {
        type: "p",
        text: "Delays caused by customs, carriers, governmental authorities, force majeure events, or circumstances outside Oboya’s reasonable control may affect delivery schedules.",
      },
      {
        type: "p",
        text: "Specific delivery responsibilities will be established in the applicable order, quotation, commercial agreement, or shipping terms.",
      },
    ],
  },
  {
    title: "13. Returns, cancellations, and refunds",
    blocks: [
      {
        type: "p",
        text: "Returns, cancellations, replacements, refunds, and claims relating to products will be governed by the applicable order terms and mandatory laws of the jurisdiction governing the relevant transaction.",
      },
      {
        type: "p",
        text: "Business-to-business transactions may be subject to commercial conditions different from those applicable to consumers.",
      },
      {
        type: "p",
        text: "Nothing in these Terms is intended to exclude or restrict any mandatory statutory rights that cannot lawfully be excluded or restricted.",
      },
      {
        type: "p",
        text: "Where a product is defective, damaged, incorrectly supplied, or otherwise subject to a valid claim, the customer should contact Oboya or the applicable seller using the contact information provided with the transaction.",
      },
    ],
  },
  {
    title: "14. Intellectual property",
    blocks: [
      {
        type: "p",
        text: "All content available through the Platform, including, without limitation:",
      },
      {
        type: "ul",
        items: [
          "Oboya trademarks;",
          "logos;",
          "trade names;",
          "product names;",
          "photographs;",
          "videos;",
          "illustrations;",
          "graphics;",
          "text;",
          "product descriptions;",
          "catalogs;",
          "technical documentation;",
          "software;",
          "interfaces;",
          "databases;",
          "designs;",
          "layouts; and",
          "other materials",
        ],
      },
      {
        type: "p",
        text: "is owned by Oboya, its affiliates, licensors, or other authorized rights holders and is protected by applicable intellectual property laws.",
      },
      {
        type: "p",
        text: "Except where expressly permitted by Oboya or applicable law, you may not:",
      },
      {
        type: "ul",
        items: [
          "reproduce;",
          "modify;",
          "distribute;",
          "publish;",
          "transmit;",
          "sell;",
          "license;",
          "create derivative works from;",
          "commercially exploit; or",
          "otherwise use",
        ],
      },
      {
        type: "p",
        text: "the Platform or its content without prior authorization.",
      },
      {
        type: "p",
        text: "You may access and use content from the Platform for legitimate internal business purposes related to evaluating or purchasing Oboya products, provided that such use does not infringe Oboya’s intellectual property rights.",
      },
    ],
  },
  {
    title: "15. User-submitted content",
    blocks: [
      {
        type: "p",
        text: "Users may have the opportunity to submit information, product reviews, comments, photographs, documents, inquiries, business information, or other materials (“User Content”).",
      },
      { type: "p", text: "By submitting User Content, you represent that:" },
      {
        type: "letters",
        items: [
          "you have the necessary rights and authority to submit the content;",
          "the content is accurate to the best of your knowledge;",
          "the content does not infringe the rights of any third party; and",
          "the content does not violate applicable law or these Terms.",
        ],
      },
      {
        type: "p",
        text: "You grant Oboya a non-exclusive, worldwide, royalty-free license to host, reproduce, display, adapt, format, and otherwise use User Content to the extent reasonably necessary to operate, provide, improve, communicate about, and promote the Platform and Oboya’s services.",
      },
      {
        type: "p",
        text: "Oboya may remove or restrict User Content that it reasonably believes violates these Terms, applicable law, or the rights of Oboya or third parties.",
      },
    ],
  },
  {
    title: "16. Prohibited conduct",
    blocks: [
      { type: "p", text: "You agree not to use the Platform to:" },
      {
        type: "ul",
        items: [
          "violate applicable laws or regulations;",
          "impersonate another person or organization;",
          "provide false or misleading information;",
          "gain unauthorized access to accounts or systems;",
          "interfere with the operation or security of the Platform;",
          "introduce malware, viruses, or other harmful code;",
          "conduct fraudulent transactions;",
          "manipulate prices, orders, reviews, rankings, or other Platform functionality;",
          "scrape, harvest, or systematically collect information from the Platform without authorization;",
          "use automated systems, bots, spiders, scripts, or similar tools except where expressly authorized;",
          "infringe intellectual property or other rights;",
          "upload unlawful, defamatory, discriminatory, hateful, threatening, or otherwise prohibited content;",
          "send spam, phishing messages, or unauthorized advertising;",
          "attempt to circumvent Platform security or access controls;",
          "use the Platform to compete unfairly with Oboya through unauthorized extraction or exploitation of Platform data;",
          "interfere with another user’s access to the Platform; or",
          "use the Platform for any unlawful or fraudulent purpose.",
        ],
      },
      {
        type: "p",
        text: "Oboya may take appropriate action, including suspension or termination of accounts, removal of content, cancellation of transactions, and reporting to competent authorities where required or appropriate.",
      },
    ],
  },
  {
    title: "17. Data protection and privacy",
    blocks: [
      {
        type: "p",
        text: "Your use of the Platform may involve the collection and processing of personal information.",
      },
      {
        type: "p",
        text: "Oboya’s collection, use, storage, disclosure, and other processing of personal data is governed by the applicable Privacy Policy and by mandatory data protection laws applicable to the relevant processing activity.",
      },
      {
        type: "p",
        text: "Because Oboya operates internationally, personal information may, where legally permitted and subject to appropriate safeguards, be processed or transferred across countries in which Oboya, its affiliates, service providers, or business partners operate.",
      },
      {
        type: "p",
        text: "Users should review the applicable Privacy Policy for information regarding:",
      },
      {
        type: "ul",
        items: [
          "categories of personal data collected;",
          "purposes of processing;",
          "legal bases;",
          "data retention;",
          "international transfers;",
          "third-party processors;",
          "user rights; and",
          "applicable contact information.",
        ],
      },
      {
        type: "p",
        text: "Where local law provides mandatory data protection rights, those rights will not be limited by these Terms.",
      },
    ],
  },
  {
    title: "18. Third-party services",
    blocks: [
      {
        type: "p",
        text: "The Platform may use or integrate third-party services, technologies, applications, payment processors, logistics providers, analytics services, communication services, hosting providers, or other third-party technologies.",
      },
      {
        type: "p",
        text: "Third-party services may be governed by their own terms and privacy policies.",
      },
      {
        type: "p",
        text: "Oboya is not responsible for the independent operation, availability, content, policies, or practices of third-party services, except to the extent required by applicable law.",
      },
    ],
  },
  {
    title: "19. External links",
    blocks: [
      {
        type: "p",
        text: "The Platform may contain links to websites or resources operated by third parties.",
      },
      {
        type: "p",
        text: "Such links are provided for convenience and do not necessarily constitute an endorsement by Oboya.",
      },
      {
        type: "p",
        text: "Oboya is not responsible for the availability, content, security, privacy practices, products, or services of third-party websites.",
      },
      {
        type: "p",
        text: "Users should review the applicable terms and privacy policies of third-party websites before using them.",
      },
    ],
  },
  {
    title: "20. Platform availability",
    blocks: [
      {
        type: "p",
        text: "Oboya seeks to maintain a reliable and secure Platform but does not guarantee that the Platform will always be:",
      },
      {
        type: "ul",
        items: [
          "available;",
          "uninterrupted;",
          "error-free;",
          "secure;",
          "timely; or",
          "free from defects.",
        ],
      },
      {
        type: "p",
        text: "The Platform may occasionally be unavailable due to maintenance, upgrades, technical issues, security events, telecommunications failures, or circumstances beyond Oboya’s reasonable control.",
      },
      {
        type: "p",
        text: "Oboya may modify, suspend, discontinue, or restrict any portion of the Platform where reasonably necessary, subject to applicable law.",
      },
    ],
  },
  {
    title: "21. Disclaimer of warranties",
    blocks: [
      {
        type: "p",
        text: "To the maximum extent permitted by applicable law, the Platform and its content are provided on an “AS IS” and “AS AVAILABLE” basis.",
      },
      {
        type: "p",
        text: "Oboya does not guarantee that the Platform will satisfy every user’s requirements or that all information available through the Platform will always be complete, accurate, current, or error-free.",
      },
      {
        type: "p",
        text: "Nothing in these Terms excludes or limits any warranty, guarantee, statutory right, or consumer protection that cannot legally be excluded or limited under applicable law.",
      },
      {
        type: "p",
        text: "Product-specific warranties, guarantees, or statutory protections will be governed by the applicable product terms, commercial agreement, or mandatory law.",
      },
    ],
  },
  {
    title: "22. Limitation of liability",
    blocks: [
      {
        type: "p",
        text: "To the maximum extent permitted by applicable law, Oboya will not be responsible for losses or damages arising from:",
      },
      {
        type: "ul",
        items: [
          "unauthorized use of the Platform by a user;",
          "inaccurate information supplied by a user;",
          "acts or omissions of third-party sellers;",
          "third-party websites or services;",
          "interruptions caused by circumstances outside Oboya’s reasonable control;",
          "telecommunications or internet failures;",
          "unauthorized access caused by the user’s failure to protect account credentials; or",
          "reliance on information that was not intended to constitute a binding commercial commitment.",
        ],
      },
      {
        type: "p",
        text: "Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited under applicable law, including liability arising from mandatory statutory protections.",
      },
      {
        type: "p",
        text: "Where a specific commercial agreement, order, warranty, or other contractual document establishes different liability provisions, those provisions may govern the relevant transaction.",
      },
    ],
  },
  {
    title: "23. Indemnification",
    blocks: [
      {
        type: "p",
        text: "To the extent permitted by applicable law, you agree to indemnify and hold harmless Oboya, its subsidiaries, affiliates, directors, officers, employees, agents, licensors, and service providers from claims, losses, liabilities, damages, costs, and reasonable expenses arising from:",
      },
      {
        type: "letters",
        items: [
          "your violation of these Terms;",
          "your unlawful or unauthorized use of the Platform;",
          "your infringement of third-party rights;",
          "User Content submitted by you; or",
          "your fraudulent, negligent, or unauthorized conduct.",
        ],
      },
      {
        type: "p",
        text: "This provision does not apply to the extent that the relevant claim results from Oboya’s own conduct for which Oboya is legally responsible.",
      },
    ],
  },
  {
    title: "24. Suspension and termination",
    blocks: [
      {
        type: "p",
        text: "Oboya may suspend or terminate access to the Platform or an account where reasonably necessary to:",
      },
      {
        type: "ul",
        items: [
          "protect the Platform;",
          "prevent fraud or abuse;",
          "investigate suspected violations;",
          "comply with legal requirements;",
          "protect users or third parties; or",
          "enforce these Terms.",
        ],
      },
      {
        type: "p",
        text: "Where required by applicable law, Oboya will provide appropriate notice or other procedural protections.",
      },
      {
        type: "p",
        text: "Termination does not affect rights or obligations that arose before termination or provisions that by their nature should survive termination.",
      },
    ],
  },
  {
    title: "25. Force majeure",
    blocks: [
      {
        type: "p",
        text: "Oboya will not be responsible for delays or failures caused by circumstances beyond its reasonable control, including, where applicable:",
      },
      {
        type: "ul",
        items: [
          "natural disasters;",
          "pandemics;",
          "war;",
          "terrorism;",
          "civil unrest;",
          "government action;",
          "sanctions;",
          "trade restrictions;",
          "labor disputes;",
          "transportation disruptions;",
          "supply chain disruptions;",
          "telecommunications failures;",
          "power failures;",
          "cyber incidents; or",
          "other events that could not reasonably have been prevented or overcome.",
        ],
      },
    ],
  },
  {
    title: "26. Export controls and sanctions",
    blocks: [
      {
        type: "p",
        text: "Users must comply with applicable export control, customs, trade sanctions, and import regulations.",
      },
      {
        type: "p",
        text: "Oboya may refuse, suspend, or cancel a transaction where necessary to comply with applicable sanctions, export controls, trade restrictions, or other legal requirements.",
      },
      {
        type: "p",
        text: "Users may not use the Platform or Oboya products in violation of applicable international trade restrictions.",
      },
    ],
  },
  {
    title: "27. Changes to these Terms",
    blocks: [
      { type: "p", text: "Oboya may update these Terms from time to time." },
      {
        type: "p",
        text: "When material changes are made, Oboya may provide notice through the Platform or other reasonable means where required by applicable law.",
      },
      {
        type: "p",
        text: "The updated Terms will indicate the date on which they were last revised.",
      },
      {
        type: "p",
        text: "Your continued use of the Platform following the effective date of updated Terms constitutes acceptance of the updated Terms to the extent permitted by applicable law.",
      },
    ],
  },
  {
    title: "28. Severability",
    blocks: [
      {
        type: "p",
        text: "If any provision of these Terms is determined to be invalid, illegal, or unenforceable by a competent authority, that provision will be interpreted or modified to the minimum extent necessary to make it enforceable where legally possible.",
      },
      {
        type: "p",
        text: "The remaining provisions will remain in full force and effect.",
      },
    ],
  },
  {
    title: "29. No waiver",
    blocks: [
      {
        type: "p",
        text: "Failure by Oboya to enforce any provision of these Terms does not constitute a waiver of its right to enforce that provision in the future.",
      },
    ],
  },
  {
    title: "30. Entire agreement",
    blocks: [
      {
        type: "p",
        text: "These Terms, together with any applicable Privacy Policy, Seller Terms, Terms of Sale, quotation, order confirmation, commercial agreement, or other applicable terms, constitute the agreement governing the relevant use of the Platform or transaction.",
      },
      {
        type: "p",
        text: "Where different documents apply to the same transaction, the applicable commercial agreement or order-specific terms may take precedence over these general Terms to the extent of any inconsistency.",
      },
    ],
  },
  {
    title: "31. Governing law and jurisdiction",
    blocks: [
      {
        type: "p",
        text: "These Terms shall be interpreted and applied in accordance with the laws applicable to the relevant Oboya entity and transaction, subject to mandatory provisions of the law applicable to the user.",
      },
      {
        type: "p",
        text: "For transactions conducted through a specific Oboya subsidiary or legal entity, the applicable commercial agreement may establish the governing law and competent jurisdiction.",
      },
      {
        type: "p",
        text: "Nothing in these Terms is intended to deprive consumers or other protected users of mandatory rights or protections granted under the laws of their country of residence.",
      },
    ],
  },
  {
    title: "32. Language",
    blocks: [
      {
        type: "p",
        text: "The Platform and these Terms may be made available in multiple languages.",
      },
      {
        type: "p",
        text: "Where translations are provided, they are intended to facilitate understanding.",
      },
      {
        type: "p",
        text: "In the event of a conflict between language versions, the applicable commercial agreement or the legally controlling version identified by Oboya will govern, subject always to mandatory local law.",
      },
    ],
  },
  {
    title: "33. Contact",
    blocks: [
      {
        type: "p",
        text: "For questions regarding these Terms, the Platform, or Oboya’s digital services, please contact:",
      },
      { type: "contact" },
    ],
  },
];

export const TERMS_CONTACT = {
  company: "Oboya Horticulture",
  website: "https://oboya.cc",
  privacyNote:
    "For questions concerning personal data and privacy, please refer to the applicable Privacy Policy and privacy contact information.",
};
