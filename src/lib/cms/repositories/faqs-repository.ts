import type { LocalizedString } from "@/lib/cms/types";

export interface CmsFaqCategory {
  id: string;
  slug: string;
  title: LocalizedString;
  order: number;
}

export interface CmsFaqItem {
  id: string;
  categoryId: string;
  question: LocalizedString;
  answer: LocalizedString;
  keywords: string[];
  order: number;
  status: "published" | "draft";
}

function loc(
  en: string,
  pt?: string,
  es?: string,
  zh?: string
): LocalizedString {
  return {
    en,
    "pt-BR": pt ?? en,
    es: es ?? en,
    "zh-CN": zh ?? en,
  };
}

const defaultCategories = (): CmsFaqCategory[] => [
  {
    id: "products",
    slug: "products",
    title: loc("Products", "Produtos", "Productos", "产品"),
    order: 1,
  },
  {
    id: "shipping",
    slug: "shipping",
    title: loc("Shipping & Logistics", "Envio e logística", "Envío y logística", "运输与物流"),
    order: 2,
  },
  {
    id: "quotations",
    slug: "quotations",
    title: loc("Quotations & RFQ", "Cotações e RFQ", "Cotizaciones y RFQ", "报价与询价"),
    order: 3,
  },
  {
    id: "shop",
    slug: "shop",
    title: loc("B2B Shop", "Loja B2B", "Tienda B2B", "B2B 商店"),
    order: 4,
  },
  {
    id: "support",
    slug: "support",
    title: loc("Support & Contact", "Suporte e contato", "Soporte y contacto", "支持与联系"),
    order: 5,
  },
  {
    id: "about",
    slug: "about",
    title: loc("About Oboya", "Sobre a Oboya", "Sobre Oboya", "关于 Oboya"),
    order: 6,
  },
  {
    id: "sustainability",
    slug: "sustainability",
    title: loc("Sustainability", "Sustentabilidade", "Sostenibilidad", "可持续发展"),
    order: 7,
  },
  {
    id: "careers",
    slug: "careers",
    title: loc("Careers", "Carreiras", "Carreras", "职业发展"),
    order: 8,
  },
];

const defaultFaqs = (): CmsFaqItem[] => [
  {
    id: "products-1",
    categoryId: "products",
    question: loc(
      "How do I know which products are available in my country?",
      "Como sei quais produtos estão disponíveis no meu país?",
      "¿Cómo sé qué productos están disponibles en mi país?",
      "如何知道哪些产品在我的国家/地区有售？"
    ),
    answer: loc(
      "Use the B2B shop to select your country and currency. Only available SKUs will be shown.",
      "Use a loja B2B para selecionar seu país e moeda. Apenas SKUs disponíveis serão exibidos.",
      "Use la tienda B2B para seleccionar su país y moneda. Solo se mostrarán los SKU disponibles.",
      "在 B2B 商店中选择您的国家和货币，仅显示可售 SKU。"
    ),
    keywords: ["availability", "country", "shop", "sku"],
    order: 1,
    status: "published",
  },
  {
    id: "products-2",
    categoryId: "products",
    question: loc(
      "Are catalogue products the same as shop products?",
      "Os produtos do catálogo são os mesmos da loja?",
      "¿Los productos del catálogo son los mismos que los de la tienda?",
      "目录中的产品与商店产品相同吗？"
    ),
    answer: loc(
      "The PDF catalogue shows the full range. The shop filters items available in your market.",
      "O catálogo PDF mostra a gama completa. A loja filtra itens disponíveis no seu mercado.",
      "El catálogo PDF muestra la gama completa. La tienda filtra los artículos disponibles en su mercado.",
      "PDF 目录展示完整产品线，商店则按您所在市场筛选可售商品。"
    ),
    keywords: ["catalogue", "pdf", "shop", "range"],
    order: 2,
    status: "published",
  },
  {
    id: "products-3",
    categoryId: "products",
    question: loc(
      "Can I request samples?",
      "Posso solicitar amostras?",
      "¿Puedo solicitar muestras?",
      "可以申请样品吗？"
    ),
    answer: loc(
      "Yes. Contact your local office or submit a quotation request with sample notes.",
      "Sim. Entre em contato com seu escritório local ou envie uma cotação com observações sobre amostras.",
      "Sí. Contacte su oficina local o envíe una solicitud de cotización con notas sobre muestras.",
      "可以。请联系当地办事处，或在报价请求中注明样品需求。"
    ),
    keywords: ["samples", "trial", "quotation"],
    order: 3,
    status: "published",
  },
  {
    id: "products-4",
    categoryId: "products",
    question: loc(
      "What growing media and substrate options do you offer?",
      "Quais opções de substratos e meios de cultivo vocês oferecem?",
      "¿Qué opciones de sustratos y medios de cultivo ofrecen?",
      "你们提供哪些基质和培养基选项？"
    ),
    answer: loc(
      "We supply peat-based, coir, and custom-blended substrates for propagation, bedding, and container production.",
      "Fornecemos substratos à base de turfa, fibra de coco e misturas personalizadas para propagação, mudas e produção em vasos.",
      "Suministramos sustratos a base de turba, fibra de coco y mezclas personalizadas para propagación, plantines y producción en contenedores.",
      "我们提供泥炭、椰糠及定制混合基质，适用于繁殖、育苗和容器生产。"
    ),
    keywords: ["substrate", "growing media", "propagation", "coir", "peat"],
    order: 4,
    status: "published",
  },
  {
    id: "shipping-1",
    categoryId: "shipping",
    question: loc(
      "Do you ship internationally?",
      "Vocês fazem envios internacionais?",
      "¿Realizan envíos internacionales?",
      "是否提供国际运输？"
    ),
    answer: loc(
      "Yes. Availability and lead times vary by product and destination.",
      "Sim. Disponibilidade e prazos variam conforme produto e destino.",
      "Sí. La disponibilidad y los plazos varían según el producto y el destino.",
      "是的。供应情况和交期因产品和目的地而异。"
    ),
    keywords: ["international", "export", "delivery"],
    order: 1,
    status: "published",
  },
  {
    id: "shipping-2",
    categoryId: "shipping",
    question: loc(
      "How are lead times estimated?",
      "Como os prazos de entrega são estimados?",
      "¿Cómo se estiman los plazos de entrega?",
      "交期如何估算？"
    ),
    answer: loc(
      "Your local sales team confirms lead times after quotation review.",
      "Sua equipe comercial local confirma os prazos após revisar a cotação.",
      "Su equipo comercial local confirma los plazos tras revisar la cotización.",
      "当地销售团队在审核报价后会确认交期。"
    ),
    keywords: ["lead time", "delivery", "quotation"],
    order: 2,
    status: "published",
  },
  {
    id: "shipping-3",
    categoryId: "shipping",
    question: loc(
      "How is horticulture packaging handled for long-distance transport?",
      "Como o empacotamento hortícola é tratado para transporte de longa distância?",
      "¿Cómo se gestiona el empaquetado hortícola para transporte de larga distancia?",
      "长途运输如何处理园艺包装？"
    ),
    answer: loc(
      "Products are palletized and labelled according to regional regulations. Your account manager can advise on moisture retention and stacking for your crop type.",
      "Os produtos são paletizados e rotulados conforme regulamentações regionais. Seu gerente de conta pode orientar sobre retenção de umidade e empilhamento para seu tipo de cultivo.",
      "Los productos se paletizan y etiquetan según las normativas regionales. Su gestor de cuenta puede asesorar sobre retención de humedad y apilamiento para su tipo de cultivo.",
      "产品按地区法规打托并贴标。客户经理可针对您的作物类型提供保湿与堆码建议。"
    ),
    keywords: ["packaging", "pallet", "transport", "logistics"],
    order: 3,
    status: "published",
  },
  {
    id: "quotations-1",
    categoryId: "quotations",
    question: loc(
      "Does checkout process payment?",
      "O checkout processa pagamento?",
      "¿El checkout procesa el pago?",
      "结账时会直接扣款吗？"
    ),
    answer: loc(
      "No. Checkout creates a quotation request for the local commercial team.",
      "Não. O checkout cria uma solicitação de cotação para a equipe comercial local.",
      "No. El checkout crea una solicitud de cotización para el equipo comercial local.",
      "不会。结账会生成报价请求，由当地商务团队跟进。"
    ),
    keywords: ["checkout", "payment", "rfq"],
    order: 1,
    status: "published",
  },
  {
    id: "quotations-2",
    categoryId: "quotations",
    question: loc(
      "What information should I include in a quotation request?",
      "Quais informações devo incluir em uma solicitação de cotação?",
      "¿Qué información debo incluir en una solicitud de cotización?",
      "报价请求应包含哪些信息？"
    ),
    answer: loc(
      "Company, country, contact details, quantities, and any project notes.",
      "Empresa, país, dados de contato, quantidades e observações do projeto.",
      "Empresa, país, datos de contacto, cantidades y notas del proyecto.",
      "公司名称、国家/地区、联系方式、数量及项目说明。"
    ),
    keywords: ["rfq", "quote", "information", "form"],
    order: 2,
    status: "published",
  },
  {
    id: "quotations-3",
    categoryId: "quotations",
    question: loc(
      "How fast will I receive a response?",
      "Em quanto tempo receberei uma resposta?",
      "¿En cuánto tiempo recibiré una respuesta?",
      "多久能收到回复？"
    ),
    answer: loc(
      "Most requests receive a response within two business days.",
      "A maioria das solicitações recebe resposta em até dois dias úteis.",
      "La mayoría de las solicitudes reciben respuesta en dos días hábiles.",
      "大多数请求会在两个工作日内收到回复。"
    ),
    keywords: ["response time", "sla", "quote"],
    order: 3,
    status: "published",
  },
  {
    id: "shop-1",
    categoryId: "shop",
    question: loc(
      "Who can access the B2B shop?",
      "Quem pode acessar a loja B2B?",
      "¿Quién puede acceder a la tienda B2B?",
      "谁可以使用 B2B 商店？"
    ),
    answer: loc(
      "The shop is designed for professional growers, distributors, and horticulture businesses. Registration may be required for certain markets.",
      "A loja é destinada a produtores profissionais, distribuidores e empresas de horticultura. Alguns mercados podem exigir registro.",
      "La tienda está pensada para productores profesionales, distribuidores y empresas hortícolas. Algunos mercados pueden requerir registro.",
      "商店面向专业种植者、经销商和园艺企业，部分市场可能需要注册。"
    ),
    keywords: ["b2b", "registration", "access"],
    order: 1,
    status: "published",
  },
  {
    id: "shop-2",
    categoryId: "shop",
    question: loc(
      "Can I save a cart and return later?",
      "Posso salvar um carrinho e voltar depois?",
      "¿Puedo guardar un carrito y volver más tarde?",
      "可以保存购物车稍后继续吗？"
    ),
    answer: loc(
      "Your cart persists during the session. For large recurring orders, contact your account manager to set up a saved list.",
      "Seu carrinho persiste durante a sessão. Para pedidos recorrentes grandes, fale com seu gerente de conta para configurar uma lista salva.",
      "Su carrito persiste durante la sesión. Para pedidos recurrentes grandes, contacte a su gestor de cuenta para configurar una lista guardada.",
      "购物车会在当前会话中保留。如需大型重复订单，请联系客户经理设置保存清单。"
    ),
    keywords: ["cart", "session", "recurring"],
    order: 2,
    status: "published",
  },
  {
    id: "support-1",
    categoryId: "support",
    question: loc(
      "How do I contact a specific office?",
      "Como entro em contato com um escritório específico?",
      "¿Cómo contacto una oficina específica?",
      "如何联系特定办事处？"
    ),
    answer: loc(
      "Use the interactive map on the homepage or the contact form with an office reference.",
      "Use o mapa interativo na página inicial ou o formulário de contato com referência ao escritório.",
      "Use el mapa interactivo en la página de inicio o el formulario de contacto con referencia a la oficina.",
      "请使用首页互动地图，或在联系表单中注明办事处。"
    ),
    keywords: ["contact", "office", "map", "global"],
    order: 1,
    status: "published",
  },
  {
    id: "support-2",
    categoryId: "support",
    question: loc(
      "Which languages are supported?",
      "Quais idiomas são suportados?",
      "¿Qué idiomas están disponibles?",
      "网站支持哪些语言？"
    ),
    answer: loc(
      "Our site is available in English, Portuguese, Spanish, and Chinese.",
      "Nosso site está disponível em inglês, português, espanhol e chinês.",
      "Nuestro sitio está disponible en inglés, portugués, español y chino.",
      "网站提供英语、葡萄牙语、西班牙语和中文。"
    ),
    keywords: ["languages", "locale", "translation"],
    order: 2,
    status: "published",
  },
  {
    id: "support-3",
    categoryId: "support",
    question: loc(
      "Where can I find technical documentation or certifications?",
      "Onde encontro documentação técnica ou certificações?",
      "¿Dónde encuentro documentación técnica o certificaciones?",
      "在哪里可以找到技术文档或认证？"
    ),
    answer: loc(
      "Product datasheets and certification summaries are available on request through your local office or via the contact form.",
      "Fichas técnicas e resumos de certificação estão disponíveis mediante solicitação ao escritório local ou pelo formulário de contato.",
      "Las fichas técnicas y resúmenes de certificación están disponibles bajo solicitud a través de la oficina local o el formulario de contacto.",
      "产品数据表和认证摘要可通过当地办事处或联系表单申请获取。"
    ),
    keywords: ["certification", "datasheet", "technical"],
    order: 3,
    status: "published",
  },
  {
    id: "about-1",
    categoryId: "about",
    question: loc(
      "Where is Oboya headquartered?",
      "Onde fica a sede da Oboya?",
      "¿Dónde tiene su sede Oboya?",
      "Oboya 总部在哪里？"
    ),
    answer: loc(
      "Oboya is a global horticulture company with roots in Sweden and operations across Europe, the Americas, and Asia.",
      "A Oboya é uma empresa global de horticultura com origem na Suécia e operações na Europa, Américas e Ásia.",
      "Oboya es una empresa hortícola global con raíces en Suecia y operaciones en Europa, las Américas y Asia.",
      "Oboya 是一家全球园艺公司，起源于瑞典，业务遍及欧洲、美洲和亚洲。"
    ),
    keywords: ["headquarters", "sweden", "global", "offices"],
    order: 1,
    status: "published",
  },
  {
    id: "about-2",
    categoryId: "about",
    question: loc(
      "Do you publish case studies from growers?",
      "Vocês publicam cases de produtores?",
      "¿Publican casos de éxito de productores?",
      "会发布种植者案例研究吗？"
    ),
    answer: loc(
      "Yes. Visit the Case Studies section for propagation, packaging, and retail display projects from our global network.",
      "Sim. Visite a seção Cases para projetos de propagação, embalagem e exposição em varejo da nossa rede global.",
      "Sí. Visite la sección de Casos de éxito para proyectos de propagación, empaquetado y exhibición retail de nuestra red global.",
      "是的。请访问案例研究栏目，了解全球网络中的繁殖、包装和零售展示项目。"
    ),
    keywords: ["case studies", "growers", "projects"],
    order: 2,
    status: "published",
  },
  {
    id: "sustainability-1",
    categoryId: "sustainability",
    question: loc(
      "How does Oboya approach sustainable packaging?",
      "Como a Oboya aborda embalagens sustentáveis?",
      "¿Cómo aborda Oboya el empaquetado sostenible?",
      "Oboya 如何实现可持续包装？"
    ),
    answer: loc(
      "We prioritize recyclable materials, reduced plastic weight, and regional sourcing where feasible for trays, pots, and retail packs.",
      "Priorizamos materiais recicláveis, redução de peso plástico e fornecimento regional quando viável para bandejas, vasos e embalagens de varejo.",
      "Priorizamos materiales reciclables, reducción de peso plástico y abastecimiento regional cuando es viable para bandejas, macetas y empaques retail.",
      "我们在托盘、花盆和零售包装中优先采用可回收材料、减塑和可行的区域采购。"
    ),
    keywords: ["packaging", "recyclable", "plastic", "sustainable"],
    order: 1,
    status: "published",
  },
  {
    id: "sustainability-2",
    categoryId: "sustainability",
    question: loc(
      "Are your substrates responsibly sourced?",
      "Seus substratos são de origem responsável?",
      "¿Sus sustratos provienen de fuentes responsables?",
      "你们的基质是否来自负责任的来源？"
    ),
    answer: loc(
      "We work with certified peat and coir suppliers and offer alternatives aligned with regional environmental guidelines.",
      "Trabalhamos com fornecedores certificados de turfa e fibra de coco e oferecemos alternativas alinhadas às diretrizes ambientais regionais.",
      "Trabajamos con proveedores certificados de turba y fibra de coco y ofrecemos alternativas alineadas con las directrices ambientales regionales.",
      "我们与认证的泥炭和椰糠供应商合作，并提供符合地区环保指南的替代方案。"
    ),
    keywords: ["substrate", "peat", "coir", "certified", "environment"],
    order: 2,
    status: "published",
  },
  {
    id: "careers-1",
    categoryId: "careers",
    question: loc(
      "How do I apply for an open position?",
      "Como me candidato a uma vaga aberta?",
      "¿Cómo postulo a una vacante abierta?",
      "如何申请开放职位？"
    ),
    answer: loc(
      "Browse roles on the Work with us page and submit your application online. You can also send a spontaneous application.",
      "Veja as vagas na página Trabalhe conosco e envie sua candidatura online. Também é possível enviar candidatura espontânea.",
      "Consulte las vacantes en la página Trabaja con nosotros y envíe su solicitud en línea. También puede enviar una candidatura espontánea.",
      "请在工作机会页面浏览职位并在线提交申请，也可发送主动申请。"
    ),
    keywords: ["jobs", "apply", "work with us", "careers"],
    order: 1,
    status: "published",
  },
  {
    id: "careers-2",
    categoryId: "careers",
    question: loc(
      "Do you hire internationally?",
      "Vocês contratam internacionalmente?",
      "¿Contratan internacionalmente?",
      "是否进行国际招聘？"
    ),
    answer: loc(
      "Yes. Oboya hires across our global offices in sales, operations, product development, and sustainability.",
      "Sim. A Oboya contrata em nossos escritórios globais em vendas, operações, desenvolvimento de produtos e sustentabilidade.",
      "Sí. Oboya contrata en nuestras oficinas globales en ventas, operaciones, desarrollo de productos y sostenibilidad.",
      "是的。Oboya 在全球办事处的销售、运营、产品开发和可持续发展等部门招聘。"
    ),
    keywords: ["international", "hiring", "offices", "roles"],
    order: 2,
    status: "published",
  },
];

let categoriesCache: CmsFaqCategory[] | null = null;
let faqsCache: CmsFaqItem[] | null = null;

export function getCategories(): CmsFaqCategory[] {
  if (!categoriesCache) categoriesCache = defaultCategories();
  return [...categoriesCache].sort((a, b) => a.order - b.order);
}

export function getCategoryById(id: string): CmsFaqCategory | undefined {
  return getCategories().find((c) => c.id === id);
}

export function saveCategory(category: CmsFaqCategory): CmsFaqCategory {
  const categories = getCategories();
  const idx = categories.findIndex((c) => c.id === category.id);
  if (idx >= 0) categories[idx] = category;
  else categories.push(category);
  categoriesCache = categories;
  return category;
}

export function deleteCategory(id: string): boolean {
  const categories = getCategories();
  const idx = categories.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  categories.splice(idx, 1);
  categoriesCache = categories;
  getFaqs().forEach((faq) => {
    if (faq.categoryId === id) deleteFaq(faq.id);
  });
  return true;
}

export function getFaqs(): CmsFaqItem[] {
  if (!faqsCache) faqsCache = defaultFaqs();
  return [...faqsCache].sort((a, b) => a.order - b.order);
}

export function getFaqById(id: string): CmsFaqItem | undefined {
  return getFaqs().find((f) => f.id === id);
}

export function saveFaq(faq: CmsFaqItem): CmsFaqItem {
  const faqs = getFaqs();
  const idx = faqs.findIndex((f) => f.id === faq.id);
  if (idx >= 0) faqs[idx] = faq;
  else faqs.push(faq);
  faqsCache = faqs;
  return faq;
}

export function deleteFaq(id: string): boolean {
  const faqs = getFaqs();
  const idx = faqs.findIndex((f) => f.id === id);
  if (idx < 0) return false;
  faqs.splice(idx, 1);
  faqsCache = faqs;
  return true;
}
