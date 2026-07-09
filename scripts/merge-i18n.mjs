import fs from "node:fs";
import path from "node:path";

const messagesDir = path.join(process.cwd(), "messages");

const shared = {
  en: {
    nav: {
      caseStudies: "Case Studies",
      blog: "Blog",
      shop: "Shop",
    },
    footer: {
      resources: "Resources",
      shopSection: "Shop",
      caseStudies: "Case Studies",
      workWithUs: "Work with us",
      catalogue: "Catalogue",
      blog: "Blog",
      faqs: "FAQs",
      shop: "Shop",
      askForQuotation: "Ask for Quotation",
    },
    globalPresence: {
      panelSegments: "Segments served",
      panelContactOffice: "Contact this Office",
    },
    pages: {
      about: { description: "Our history, mission, and global horticulture footprint." },
      faqs: {
        title: "FAQs",
        eyebrow: "Support",
        description: "Answers to common questions about products, shipping, and quotations.",
      },
      workWithUs: {
        title: "Work with us",
        eyebrow: "Careers",
        description: "Join a global team building integrated horticulture solutions.",
      },
      terms: { description: "Terms and conditions governing use of the Oboya website and services." },
    },
    contact: {
      field1: "First name",
      field1Placeholder: "Jane",
      field2: "Last name",
      field2Placeholder: "Doe",
      country: "Country",
      countryPlaceholder: "Your country",
      subject: "Subject",
      subjectPlaceholder: "How can we help?",
      submit: "Send message",
      success: "Thank you. Our team will contact you shortly.",
    },
    hero: {
      ctaPrimary: "Explore our Shop",
      ctaSecondary: "About Oboya",
    },
    cta: {
      secondary: "View Case Studies",
    },
  },
  "pt-BR": {
    nav: { caseStudies: "Cases", blog: "Blog", shop: "Loja" },
    footer: {
      resources: "Recursos",
      shopSection: "Loja",
      caseStudies: "Cases",
      workWithUs: "Trabalhe conosco",
      catalogue: "Catálogo",
      blog: "Blog",
      faqs: "FAQs",
      shop: "Loja",
      askForQuotation: "Solicitar cotação",
    },
    globalPresence: {
      panelSegments: "Segmentos atendidos",
      panelContactOffice: "Contatar este escritório",
    },
    pages: {
      about: { description: "Nossa história, missão e presença global em horticultura." },
      faqs: {
        title: "Perguntas frequentes",
        eyebrow: "Suporte",
        description: "Respostas sobre produtos, envio e cotações.",
      },
      workWithUs: {
        title: "Trabalhe conosco",
        eyebrow: "Carreiras",
        description: "Junte-se a uma equipe global de soluções hortícolas integradas.",
      },
      terms: { description: "Termos e condições de uso do site e serviços Oboya." },
    },
    contact: {
      field1: "Nome",
      field1Placeholder: "Maria",
      field2: "Sobrenome",
      field2Placeholder: "Silva",
      country: "País",
      countryPlaceholder: "Seu país",
      subject: "Assunto",
      subjectPlaceholder: "Como podemos ajudar?",
      submit: "Enviar mensagem",
      success: "Obrigado. Nossa equipe entrará em contato em breve.",
    },
    hero: { ctaPrimary: "Explorar a Loja", ctaSecondary: "Sobre a Oboya" },
    cta: { secondary: "Ver Cases" },
  },
  es: {
    nav: { caseStudies: "Casos de éxito", blog: "Blog", shop: "Tienda" },
    footer: {
      resources: "Recursos",
      shopSection: "Tienda",
      caseStudies: "Casos de éxito",
      workWithUs: "Trabaja con nosotros",
      catalogue: "Catálogo",
      blog: "Blog",
      faqs: "FAQs",
      shop: "Tienda",
      askForQuotation: "Solicitar cotización",
    },
    globalPresence: {
      panelSegments: "Segmentos atendidos",
      panelContactOffice: "Contactar esta oficina",
    },
    pages: {
      about: { description: "Nuestra historia, misión y presencia global en horticultura." },
      faqs: {
        title: "Preguntas frecuentes",
        eyebrow: "Soporte",
        description: "Respuestas sobre productos, envíos y cotizaciones.",
      },
      workWithUs: {
        title: "Trabaja con nosotros",
        eyebrow: "Carreras",
        description: "Únete a un equipo global de soluciones hortícolas integradas.",
      },
      terms: { description: "Términos y condiciones de uso del sitio y servicios Oboya." },
    },
    contact: {
      field1: "Nombre",
      field1Placeholder: "Ana",
      field2: "Apellido",
      field2Placeholder: "García",
      country: "País",
      countryPlaceholder: "Su país",
      subject: "Asunto",
      subjectPlaceholder: "¿Cómo podemos ayudar?",
      submit: "Enviar mensaje",
      success: "Gracias. Nuestro equipo se pondrá en contacto pronto.",
    },
    hero: { ctaPrimary: "Explorar la Tienda", ctaSecondary: "Sobre Oboya" },
    cta: { secondary: "Ver casos de éxito" },
  },
  "zh-CN": {
    nav: { caseStudies: "案例研究", blog: "博客", shop: "商店" },
    footer: {
      resources: "资源",
      shopSection: "商店",
      caseStudies: "案例研究",
      workWithUs: "加入我们",
      catalogue: "产品目录",
      blog: "博客",
      faqs: "常见问题",
      shop: "商店",
      askForQuotation: "申请报价",
    },
    globalPresence: {
      panelSegments: "服务领域",
      panelContactOffice: "联系该办事处",
    },
    pages: {
      about: { description: "我们的历史、使命和全球园艺布局。" },
      faqs: {
        title: "常见问题",
        eyebrow: "支持",
        description: "关于产品、运输和报价的常见问题解答。",
      },
      workWithUs: {
        title: "加入我们",
        eyebrow: "招聘",
        description: "加入构建综合园艺解决方案的全球团队。",
      },
      terms: { description: "Oboya 网站和服务的使用条款与条件。" },
    },
    contact: {
      field1: "名",
      field1Placeholder: "明",
      field2: "姓",
      field2Placeholder: "李",
      country: "国家",
      countryPlaceholder: "您的国家",
      subject: "主题",
      subjectPlaceholder: "我们能如何帮助您？",
      submit: "发送消息",
      success: "谢谢。我们的团队将尽快与您联系。",
    },
    hero: { ctaPrimary: "探索商店", ctaSecondary: "关于 Oboya" },
    cta: { secondary: "查看案例研究" },
  },
};

const aboutPage = {
  en: {
    nav: {
      history: "History",
      mission: "Mission & Values",
      timeline: "Timeline",
      presence: "Global Presence",
      certifications: "Certifications",
      leadership: "Leadership",
      partners: "Partners",
    },
    history: {
      title: "Our history",
      p1: "Founded as a regional horticulture supplier, Oboya has grown into a global partner supporting propagation, growing, packaging, and retail display.",
      p2: "Today we operate across 25 countries with local teams, production hubs, and strategic partners serving growers worldwide.",
      imageAlt: "Oboya greenhouse operations",
    },
    mission: {
      title: "Mission, vision & values",
      description: "We help growers deliver quality, efficiency, and sustainability across the supply chain.",
    },
    vision: {
      title: "Vision",
      description: "To be the most trusted integrated horticulture partner worldwide.",
    },
    values: {
      title: "Values",
      description: "Integrity, innovation, and sustainability guide every decision we make.",
    },
    valuesList: {
      integrity: "Integrity in every partnership",
      innovation: "Innovation for growers",
      sustainability: "Sustainability by design",
    },
    timeline: {
      title: "Milestones",
      m1: { year: "1998", title: "Company founded", description: "Oboya begins as a regional horticulture supplier." },
      m2: { year: "2005", title: "European expansion", description: "First distribution hubs open across Northern Europe." },
      m3: { year: "2012", title: "Packaging innovation", description: "Retail-ready packaging line launched for berries and vegetables." },
      m4: { year: "2017", title: "Asia-Pacific growth", description: "Production and sales offices established in key APAC markets." },
      m5: { year: "2021", title: "Sustainability program", description: "Circular packaging and waste-reduction initiatives scaled globally." },
      m6: { year: "2025", title: "Digital B2B shop", description: "International quotation platform launched for commercial buyers." },
    },
    presence: {
      title: "Global presence",
      description: "With offices, warehouses, and partners across continents, we support growers close to their operations.",
      cta: "Explore the interactive map",
    },
    leadership: {
      title: "Leadership team",
      l1: { name: "Elena Nordström", role: "Chief Executive Officer" },
      l2: { name: "James Whitfield", role: "Chief Operating Officer" },
      l3: { name: "Ana Ribeiro", role: "Chief Commercial Officer" },
      l4: { name: "Li Wei", role: "Head of Asia-Pacific" },
    },
    partners: {
      title: "Strategic partners",
      p1: "GreenHouse Pro",
      p2: "AgriPack",
      p3: "FloraLogix",
      p4: "BerryChain",
      p5: "Nordic Grow",
      p6: "Sunbelt Supply",
    },
  },
};

const shop = {
  en: {
    eyebrow: "B2B Shop",
    title: "International product showcase",
    description: "Select your country and currency to browse available products and request a commercial quotation.",
    selectCountry: "Country",
    chooseCountry: "Select a country",
    selectCurrency: "Currency",
    chooseCurrency: "Select a currency",
    gateHint: "Products below are filtered for your selected market.",
    selectToBrowse: "Select a country and currency to browse products.",
    noProducts: "No products are currently available for this market.",
    addToCart: "Add to cart",
    emptyCart: "Your cart is empty.",
    backToShop: "Back to shop",
    remove: "Remove",
    estimatedTotal: "Estimated total",
    estimateDisclaimer: "Final pricing is confirmed by your local sales team.",
    continueToCheckout: "Continue to checkout",
    cartTitle: "Your cart",
    cartDescription: "Review quantities and estimated value before requesting a quotation.",
    checkoutTitle: "Request a quotation",
    checkoutDescription: "No payment is collected online. Submit your request to the local commercial team.",
    orderSummary: "Order summary",
    company: "Company",
    country: "Country",
    phone: "Phone",
    email: "Email",
    notes: "Additional notes",
    askForQuotation: "Ask for Quotation",
    contactSales: "Contact Local Sales Team",
    quoteConfirmed: "Quotation request received",
    quoteNumber: "Reference: {id}",
    products: {
      "growing-media-premium": "Premium Growing Media",
      "strawberry-packaging": "Strawberry Retail Packaging",
      "flower-display-trolley": "Flower Display Trolley",
      "propagation-tray": "Propagation Tray System",
      "retail-clamshell": "Retail Clamshell Pack",
      "irrigation-kit": "Greenhouse Irrigation Kit",
    },
  },
};

const blog = {
  en: {
    eyebrow: "Blog",
    title: "Insights & news",
    description: "Trends, innovation, and stories from across the horticulture supply chain.",
    readMore: "Read article",
    posts: {
      post1: {
        title: "Sustainable packaging trends in fresh produce",
        excerpt: "How retailers and growers are aligning packaging with circular economy goals.",
        p1: "Retailers are demanding packaging that protects product quality while reducing environmental impact.",
        p2: "Oboya partners with growers to pilot recyclable formats and optimize shelf presentation.",
        p3: "Early pilots show improved waste recovery without compromising freshness.",
      },
      post2: {
        title: "Greenhouse innovation in 2026",
        excerpt: "Climate control, substrates, and logistics are converging in modern greenhouse design.",
        p1: "Integrated systems help growers manage humidity, irrigation, and crop cycles with greater precision.",
        p2: "Digital monitoring and modular equipment reduce downtime across large facilities.",
        p3: "The next wave of investment focuses on energy efficiency and automation.",
      },
      post3: {
        title: "Berry category growth in retail",
        excerpt: "Packaging and display solutions supporting premium berry programs.",
        p1: "Berry sales continue to outperform broader produce categories in many markets.",
        p2: "Retail-ready packs and display trolleys improve visibility and reduce handling damage.",
        p3: "Localized assortments help chains tailor pack sizes to regional demand.",
      },
    },
  },
};

const caseStudies = {
  en: {
    eyebrow: "Case Studies",
    title: "Proven results worldwide",
    description: "Selected projects demonstrating Oboya solutions across markets and crop types.",
    readMore: "View case study",
    challengeLabel: "Challenge",
    solutionLabel: "Solution",
    resultLabel: "Result",
    items: {
      case1: {
        title: "Scaling greenhouse logistics in the Netherlands",
        excerpt: "A commercial greenhouse group needed consistent tray and trolley flows across sites.",
        challenge: "Inconsistent logistics hardware slowed transplanting and dispatch cycles.",
        solution: "Oboya standardized trolley formats and propagation trays across three facilities.",
        result: "Handling time dropped 18% and dispatch accuracy improved across peak season.",
      },
      case2: {
        title: "Berry packaging program in Brazil",
        excerpt: "A berry exporter required retail-ready packs for multiple supermarket chains.",
        challenge: "Existing packs failed shelf-life targets for export programs.",
        solution: "Custom clamshell formats and palletization support were deployed with local partners.",
        result: "Waste claims fell 22% while maintaining premium shelf presentation.",
      },
      case3: {
        title: "Distribution hub modernization in Mexico",
        excerpt: "A regional distributor needed faster replenishment for greenhouse clients.",
        challenge: "Fragmented inventory and long lead times affected grower planning.",
        solution: "Oboya implemented a hub-and-spoke model with localized SKU assortments.",
        result: "Average replenishment lead time improved from 11 to 6 days.",
      },
      case4: {
        title: "Growing media supply in China",
        excerpt: "A nursery network sought consistent substrate quality across provinces.",
        challenge: "Variable substrate batches affected rooting uniformity.",
        solution: "Premium growing media blends were qualified and supplied through regional partners.",
        result: "Rooting consistency improved and rework rates declined across propagation lines.",
      },
    },
  },
};

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] = target[key] ?? {};
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
}

for (const locale of ["en", "pt-BR", "es", "zh-CN"]) {
  const file = path.join(messagesDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  deepMerge(data, shared[locale]);
  if (locale === "en") {
    data.aboutPage = aboutPage.en;
    data.shop = shop.en;
    data.blog = blog.en;
    data.caseStudies = caseStudies.en;
    data.faqsPage = {
      intro: "Find quick answers about products, logistics, quotations, and support.",
      categories: {
        products: "Products",
        shipping: "Shipping",
        quotations: "Quotations",
        support: "Support",
      },
      products: {
        q1: { question: "How do I know which products are available in my country?", answer: "Use the B2B shop to select your country and currency. Only available SKUs will be shown." },
        q2: { question: "Are catalogue products the same as shop products?", answer: "The PDF catalogue shows the full range. The shop filters items available in your market." },
        q3: { question: "Can I request samples?", answer: "Yes. Contact your local office or submit a quotation request with sample notes." },
      },
      shipping: {
        q1: { question: "Do you ship internationally?", answer: "Yes. Availability and lead times vary by product and destination." },
        q2: { question: "How are lead times estimated?", answer: "Your local sales team confirms lead times after quotation review." },
      },
      quotations: {
        q1: { question: "Does checkout process payment?", answer: "No. Checkout creates a quotation request for the local commercial team." },
        q2: { question: "What information should I include?", answer: "Company, country, contact details, quantities, and any project notes." },
        q3: { question: "How fast will I receive a response?", answer: "Most requests receive a response within two business days." },
      },
      support: {
        q1: { question: "How do I contact a specific office?", answer: "Use the interactive map on the homepage or the contact form with an office reference." },
        q2: { question: "Which languages are supported?", answer: "Our site is available in English, Portuguese, Spanish, and Chinese." },
      },
    };
    data.workWithUsPage = {
      intro: "Build your career with a global horticulture company focused on innovation, sustainability, and local impact.",
      benefits: {
        b1: { title: "Global reach", description: "Work with teams and growers across 25 countries." },
        b2: { title: "Learning culture", description: "Continuous development in products, operations, and sustainability." },
        b3: { title: "Local impact", description: "Support growers in your region with integrated solutions." },
        b4: { title: "Inclusive teams", description: "Collaborative teams across disciplines and markets." },
      },
      openings: {
        title: "Open positions",
        o1: { title: "Regional Sales Manager", location: "São Paulo, Brazil", type: "Full-time" },
        o2: { title: "Packaging Product Specialist", location: "Malmö, Sweden", type: "Full-time" },
        o3: { title: "Greenhouse Solutions Engineer", location: "Shanghai, China", type: "Full-time" },
      },
      application: {
        title: "Spontaneous application",
        description: "Don't see a matching role? Send your profile and we'll keep it on file.",
        name: "Full name",
        email: "Email",
        message: "Tell us about your experience",
        submit: "Submit application",
        success: "Thank you. Our HR team has received your application.",
      },
    };
    data.legalPage = {
      updated: "Last updated: March 2026",
      s1: { title: "1. Acceptance of terms", body: "By accessing this website you agree to these terms and conditions. If you do not agree, please discontinue use of the site." },
      s2: { title: "2. Use of content", body: "All content is provided for informational purposes. Product specifications, availability, and pricing may change without notice." },
      s3: { title: "3. Intellectual property", body: "Trademarks, logos, text, images, and catalogue materials are owned by Oboya or its licensors and may not be reused without permission." },
      s4: { title: "4. Limitation of liability", body: "Oboya is not liable for indirect damages arising from use of the website or reliance on estimated pricing shown in the B2B shop." },
      s5: { title: "5. Contact", body: "For legal inquiries contact legal@oboya.example or your local Oboya office listed on the contact page." },
    };
  } else {
    data.aboutPage = aboutPage.en;
    data.shop = { ...shop.en, eyebrow: shared[locale].footer.shopSection, title: shared[locale].nav.shop };
    data.blog = { ...blog.en, eyebrow: shared[locale].nav.blog };
    data.caseStudies = { ...caseStudies.en, eyebrow: shared[locale].nav.caseStudies };
    data.faqsPage = { intro: shared[locale].pages.faqs.description, categories: { products: "Products", shipping: "Shipping", quotations: "Quotations", support: "Support" }, products: { q1: { question: "FAQ", answer: "Answer placeholder." } } };
    data.workWithUsPage = { intro: shared[locale].pages.workWithUs.description, benefits: { b1: { title: "Global", description: "..." } }, openings: { title: "Openings", o1: { title: "Role", location: "City", type: "Full-time" } }, application: { title: "Apply", description: "...", name: "Name", email: "Email", message: "Message", submit: "Submit", success: "..." } };
    data.legalPage = { updated: "2026", s1: { title: "Terms", body: shared[locale].pages.terms.description } };
  }
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

console.log("Merged i18n content");
