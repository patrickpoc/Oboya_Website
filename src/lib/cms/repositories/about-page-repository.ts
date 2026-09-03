import type { LocalizedString } from "@/lib/cms/types";

export type AboutSectionId =
  | "hero"
  | "institutionalImage"
  | "timeline"
  | "impact"
  | "people"
  | "callout"
  | "culture"
  | "mission"
  | "vision"
  | "values"
  | "honors";

export interface AboutSectionToggle {
  enabled: boolean;
}

export interface AboutHeadlineSegment {
  text: LocalizedString;
  tone: "green" | "white";
  breakBefore?: boolean;
}

export interface AboutTimelineEvent {
  id: string;
  year: string;
  description: LocalizedString;
}

export interface AboutCultureItem {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  image: string;
  imageAlt: LocalizedString;
  /** Image on the right (default) or left — creates the zig-zag */
  imageSide: "left" | "right";
  ctaLabel?: LocalizedString;
  ctaHref?: string;
}

export interface AboutMediaImage {
  src: string;
  alt: LocalizedString;
}

export interface AboutMissionVisionBlock {
  title: LocalizedString;
  body: LocalizedString;
  eyebrow?: LocalizedString;
  images: AboutMediaImage[];
}

export interface AboutValueItem {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  image: AboutMediaImage;
  /** CSS object-position for the value image, e.g. "center 40%". */
  objectPosition?: string;
}

export interface AboutHonorItem {
  id: string;
  name: string;
  image: string;
  href?: string;
}

export type AboutImpactStatIcon =
  | "globe"
  | "factory"
  | "building"
  | "users"
  | "handshake"
  | "package"
  | "calendar";

export interface AboutImpactStat {
  id: string;
  value: number;
  suffix: string;
  label: LocalizedString;
  icon: AboutImpactStatIcon;
  /** When true, show placeholder instead of counting (unverified). */
  pending?: boolean;
  /** Photography for the Numbers squeeze panel. */
  image: AboutMediaImage;
  /** CSS object-position for the panel image. */
  objectPosition?: string;
  /** Collapsed-panel brand fill (HEX from Oboya palette). */
  accentColor: string;
}

export interface AboutPerson {
  id: string;
  name: string;
  role: LocalizedString;
  image: string;
  bio?: LocalizedString;
}

export interface AboutPageSettings {
  sections: Record<AboutSectionId, AboutSectionToggle>;
  meta: {
    title: LocalizedString;
    description: LocalizedString;
  };
  hero: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    /** Supporting paragraph under the hero title. */
    body?: LocalizedString;
  };
  institutionalImage: {
    src: string;
    alt: LocalizedString;
  };
  timeline: {
    events: AboutTimelineEvent[];
    prevLabel: LocalizedString;
    nextLabel: LocalizedString;
  };
  impact: {
    /** Optional small label above the title. */
    eyebrow?: LocalizedString;
    title: LocalizedString;
    description: LocalizedString;
    stats: AboutImpactStat[];
  };
  people: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    description: LocalizedString;
    /** Checklist under the intro (feature-style left column). */
    highlights: Array<{ id: string; text: LocalizedString }>;
    items: AboutPerson[];
  };
  callout: {
    segments: AboutHeadlineSegment[];
    /** Optional secondary line under the statement */
    body?: LocalizedString;
  };
  culture: {
    /** Section heading (e.g. What Makes Oboya Different) */
    title?: LocalizedString;
    eyebrow: LocalizedString;
    items: AboutCultureItem[];
  };
  mission: AboutMissionVisionBlock;
  vision: AboutMissionVisionBlock;
  values: {
    title: LocalizedString;
    image?: AboutMediaImage;
    items: AboutValueItem[];
  };
  honors: {
    title: LocalizedString;
    items: AboutHonorItem[];
  };
  updatedAt: string;
}

function loc(en: string, pt?: string, es?: string, zh?: string): LocalizedString {
  return {
    en,
    "pt-BR": pt ?? en,
    es: es ?? en,
    "zh-CN": zh ?? en,
  };
}

const defaultSettings = (): AboutPageSettings => ({
  sections: {
    hero: { enabled: true },
    institutionalImage: { enabled: true },
    timeline: { enabled: true },
    impact: { enabled: true },
    people: { enabled: false },
    callout: { enabled: true },
    culture: { enabled: true },
    mission: { enabled: true },
    vision: { enabled: true },
    values: { enabled: true },
    honors: { enabled: true },
  },
  meta: {
    title: loc("About Us", "Sobre nós", "Sobre nosotros", "关于我们"),
    description: loc(
      "Oboya Horticulture Industries — company profile, history, and culture.",
      "Oboya Horticulture Industries — perfil da empresa, história e cultura.",
      "Oboya Horticulture Industries — perfil de la empresa, historia y cultura.",
      "Oboya Horticulture Industries — 公司简介、历史与文化。"
    ),
  },
  hero: {
    eyebrow: loc("Who We Are", "Quem somos", "Quiénes somos", "我们是谁"),
    title: loc(
      "Helping Horticulture Perform Better",
      "Ajudando a horticultura a performar melhor",
      "Ayudando a la horticultura a rendir mejor",
      "助力园艺卓越表现"
    ),
    body: loc(
      "Oboya Horticulture supports growers, exporters, distributors, retailers, research centers, and industry partners through solutions designed for every stage of the horticultural journey, backed by global manufacturing, sourcing, and product development capabilities. Helping strengthen performance across the value chain.",
      "A Oboya Horticulture apoia produtores, exportadores, distribuidores, varejistas, centros de pesquisa e parceiros do setor com soluções para cada etapa da jornada hortícola, com manufatura global, sourcing e desenvolvimento de produtos. Fortalecendo o desempenho em toda a cadeia de valor.",
      "Oboya Horticulture apoya a productores, exportadores, distribuidores, minoristas, centros de investigación y socios del sector con soluciones para cada etapa del recorrido hortícola, respaldadas por manufactura global, sourcing y desarrollo de productos. Fortaleciendo el rendimiento en toda la cadena de valor.",
      "Oboya Horticulture 为种植者、出口商、分销商、零售商、研究中心及行业伙伴提供覆盖园艺全旅程的解决方案，依托全球制造、采购与产品开发能力，助力提升整条价值链表现。"
    ),
  },
  institutionalImage: {
    src: "/assets/about/institutional.png",
    alt: loc(
      "Oboya Horticulture production facility",
      "Instalação de produção Oboya Horticulture",
      "Instalación de producción Oboya Horticulture",
      "Oboya Horticulture 生产设施"
    ),
  },
  timeline: {
    prevLabel: loc(
      "Previous year",
      "Ano anterior",
      "Año anterior",
      "上一年"
    ),
    nextLabel: loc("Next year", "Próximo ano", "Próximo año", "下一年"),
    events: [
      {
        id: "2005",
        year: "2005",
        description: loc(
          "Founded in 2005, we manufacture harvest carts, trolleys, and support equipment exported to more than 80 countries.",
          "Fundada em 2005, fabricamos carrinhos de colheita, trolleys e equipamentos de apoio exportados para mais de 80 países.",
          "Fundada en 2005, fabricamos carros de cosecha, trolleys y equipos de apoyo exportados a más de 80 países.",
          "成立于 2005 年，生产采收推车、运输车及配套设备，产品出口 80 多个国家。"
        ),
      },
      {
        id: "2011",
        year: "2011",
        description: loc(
          "QXAuto is founded, combining R&D, production, and sales of electric steps, lifters, and welfare products.",
          "A QXAuto é fundada, reunindo P&D, produção e vendas de degraus elétricos, elevadores e produtos de bem-estar.",
          "Se funda QXAuto, integrando I+D, producción y ventas de peldaños eléctricos, elevadores y productos de bienestar.",
          "QXAuto 成立，集研发、生产与销售于一体，主营电动踏步、升降机及福祉产品。"
        ),
      },
      {
        id: "2012",
        year: "2012",
        description: loc(
          "Qingdao OBOYA Metal Product Co. Ltd. launches turnkey solutions for retailers, warehouses, and unmanned stores — from design to export.",
          "A Qingdao OBOYA Metal Product Co. Ltd. lança soluções turnkey para varejo, armazéns e lojas autônomas — do design à exportação.",
          "Qingdao OBOYA Metal Product Co. Ltd. lanza soluciones llave en mano para retail, almacenes y tiendas autónomas — del diseño a la exportación.",
          "青岛欧博雅金属制品有限公司成立，为零售、仓储及无人店提供从设计到出口的交钥匙方案。"
        ),
      },
      {
        id: "2013",
        year: "2013",
        description: loc(
          "We open in Kenya, one of the world’s top cut-flower markets, offering African customers one-stop support from substrate to transport.",
          "Abrimos no Quênia, um dos principais mercados de flores de corte do mundo, com suporte completo da África — do substrato ao transporte.",
          "Abrimos en Kenia, uno de los principales mercados de flor cortada del mundo, con servicio integral en África — del sustrato al transporte.",
          "在肯尼亚设立业务，服务全球四大切花市场之一，为非洲客户提供从基质到包装与运输的一站式支持。"
        ),
      },
      {
        id: "2014",
        year: "2014",
        description: loc(
          "In China, we provide one-stop agricultural service from substrate to transport, with regional offices for timely after-sales support.",
          "Na China, oferecemos serviço agrícola completo do substrato ao transporte, com escritórios regionais para pós-venda ágil.",
          "En China, ofrecemos servicio agrícola integral del sustrato al transporte, con oficinas regionales para un posventa ágil.",
          "面向中国农业客户提供从基质到包装与运输的一站式服务，并在各地设立销售网点以及时售后。"
        ),
      },
      {
        id: "2019",
        year: "2019",
        description: loc(
          "A base in Yunnan — the world’s cut-flower capital — supplies packaging to local markets, nearby cities, and Southeast Asia.",
          "Uma base em Yunnan — capital mundial das flores de corte — fornece embalagens ao mercado local, cidades vizinhas e o Sudeste Asiático.",
          "Una base en Yunnan — capital mundial de la flor cortada — abastece packaging al mercado local, ciudades vecinas y el Sudeste Asiático.",
          "落户世界著名鲜切花之都云南，向本地、周边城市及东南亚供应包装材料。"
        ),
      },
      {
        id: "2020",
        year: "2020",
        description: loc(
          "A new sales company is formed, covering metal goods, machinery, healthcare, horticulture, furniture, and software.",
          "Uma nova empresa de vendas é criada, abrangendo metais, maquinário, saúde, horticultura, mobiliário e software.",
          "Se crea una nueva empresa comercial que cubre metales, maquinaria, salud, horticultura, mobiliario y software.",
          "新销售公司成立，经营金属制品、机械、医疗与健康、园艺、家具及软件产品。"
        ),
      },
      {
        id: "2023",
        year: "2023",
        description: loc(
          "High-speed injection molding in Yunnan supplies pots, buckets, and related products to local and Southeast Asian markets.",
          "A injeção de alta velocidade em Yunnan fornece vasos, baldes e produtos correlatos aos mercados local e do Sudeste Asiático.",
          "La inyección de alta velocidad en Yunnan abastece macetas, cubos y productos afines a los mercados local y del Sudeste Asiático.",
          "云南高速注塑产线投产，向本地、周边及东南亚供应注塑花盆、水桶等产品。"
        ),
      },
    ],
  },
  impact: {
    title: loc(
      "Oboya Horticulture in Numbers",
      "Oboya Horticulture em Números",
      "Oboya Horticulture en Números",
      "Oboya Horticulture 数据一览"
    ),
    description: loc(
      "Our combination of global manufacturing, strategic sourcing, and local support lets us respond quickly to customer needs while maintaining high-quality standards across multiple markets.",
      "Nossa combinação de manufatura global, sourcing estratégico e suporte local nos permite responder rapidamente às necessidades dos clientes, mantendo altos padrões de qualidade em múltiplos mercados.",
      "Nuestra combinación de manufactura global, sourcing estratégico y soporte local nos permite responder con rapidez a las necesidades de los clientes, manteniendo altos estándares de calidad en múltiples mercados.",
      "凭借全球制造、战略采购与本地支持的结合，我们能快速响应客户需求，并在多个市场保持高品质标准。"
    ),
    stats: [
      {
        id: "countries",
        value: 80,
        suffix: "+",
        icon: "globe",
        accentColor: "#004F7C",
        objectPosition: "center 40%",
        image: {
          src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Earth from space representing global markets",
            "Terra vista do espaço representando mercados globais",
            "Tierra vista desde el espacio representando mercados globales",
            "从太空看地球，象征全球市场"
          ),
        },
        label: loc(
          "Countries Served",
          "Países Atendidos",
          "Países Atendidos",
          "服务国家"
        ),
      },
      {
        id: "manufacturing",
        value: 0,
        suffix: "",
        icon: "factory",
        pending: true,
        accentColor: "#4DAF4E",
        objectPosition: "center 35%",
        image: {
          src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Technician in a manufacturing and production environment",
            "Técnico em ambiente de manufatura e produção",
            "Técnico en un entorno de manufactura y producción",
            "技术人员在制造与生产环境中工作"
          ),
        },
        label: loc(
          "Manufacturing Facilities",
          "Unidades de Manufatura",
          "Instalaciones de Manufactura",
          "制造工厂"
        ),
      },
      {
        id: "offices",
        value: 0,
        suffix: "",
        icon: "building",
        pending: true,
        accentColor: "#009CD4",
        objectPosition: "center 30%",
        image: {
          src: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Modern regional office interior with workstations",
            "Interior de escritório regional moderno com estações de trabalho",
            "Interior de oficina regional moderna con estaciones de trabajo",
            "现代化区域办公室内的工位"
          ),
        },
        label: loc(
          "Regional Offices",
          "Escritórios Regionais",
          "Oficinas Regionales",
          "区域办事处"
        ),
      },
      {
        id: "employees",
        value: 1400,
        suffix: "+",
        icon: "users",
        accentColor: "#01203F",
        objectPosition: "center 30%",
        image: {
          src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Diverse team collaborating around a shared workspace",
            "Equipe diversa colaborando em um espaço de trabalho compartilhado",
            "Equipo diverso colaborando en un espacio de trabajo compartido",
            "多元化团队在共享工作空间中协作"
          ),
        },
        label: loc(
          "Employees Worldwide",
          "Colaboradores no Mundo",
          "Empleados en el Mundo",
          "全球员工"
        ),
      },
      {
        id: "clients",
        value: 0,
        suffix: "",
        icon: "handshake",
        pending: true,
        accentColor: "#ea5744",
        objectPosition: "center 30%",
        image: {
          src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Partners shaking hands after a successful agreement",
            "Parceiros apertando as mãos após um acordo bem-sucedido",
            "Socios estrechándose la mano tras un acuerdo exitoso",
            "合作伙伴在达成协议后握手"
          ),
        },
        label: loc(
          "Clients Served",
          "Clientes Atendidos",
          "Clientes Atendidos",
          "服务客户"
        ),
      },
      {
        id: "products",
        value: 0,
        suffix: "",
        icon: "package",
        pending: true,
        accentColor: "#75C566",
        objectPosition: "center 45%",
        image: {
          src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Horticulture products and plants arranged in a greenhouse",
            "Produtos de horticultura e plantas organizados em uma estufa",
            "Productos de horticultura y plantas organizados en un invernadero",
            "温室中排列的园艺产品与植物"
          ),
        },
        label: loc(
          "Product Categories",
          "Categorias de Produto",
          "Categorías de Producto",
          "产品类别"
        ),
      },
      {
        id: "years",
        value: 20,
        suffix: "+",
        icon: "calendar",
        accentColor: "#909B03",
        objectPosition: "center 40%",
        image: {
          src: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Cultivated field reflecting decades of horticulture experience",
            "Campo cultivado refletindo décadas de experiência em horticultura",
            "Campo cultivado que refleja décadas de experiencia en horticultura",
            "农田景象，象征数十年园艺经验"
          ),
        },
        label: loc(
          "Years Supporting Horticulture",
          "Anos Apoiando a Horticultura",
          "Años Apoyando la Horticultura",
          "服务园艺行业年数"
        ),
      },
    ],
  },
  people: {
    eyebrow: loc(
      "Leadership",
      "Liderança",
      "Liderazgo",
      "领导团队"
    ),
    title: loc(
      "The people behind the company",
      "As pessoas por trás da empresa",
      "Las personas detrás de la empresa",
      "公司背后的人"
    ),
    description: loc(
      "A leadership team that pairs local grower expertise with global manufacturing — aligning markets, operations, and commercial priorities across regions.",
      "Uma liderança que une expertise local em horticultura à manufatura global — alinhando mercados, operações e prioridades comerciais entre regiões.",
      "Un liderazgo que une experiencia local en horticultura con manufactura global — alineando mercados, operaciones y prioridades comerciales entre regiones.",
      "一支兼具本地种植专业能力与全球制造视野的领导团队，统筹各区域市场、运营与商业重点。"
    ),
    highlights: [
      {
        id: "h1",
        text: loc(
          "Regional leaders close to growers and local market needs",
          "Líderes regionais próximos aos produtores e às demandas locais",
          "Líderes regionales cerca de los productores y las necesidades locales",
          "贴近种植者与本地市场需求的区域负责人"
        ),
      },
      {
        id: "h2",
        text: loc(
          "Shared standards for quality, logistics, and sustainability",
          "Padrões compartilhados de qualidade, logística e sustentabilidade",
          "Estándares compartidos de calidad, logística y sostenibilidad",
          "质量、物流与可持续性的统一标准"
        ),
      },
      {
        id: "h3",
        text: loc(
          "Cross-site coordination from production through delivery",
          "Coordenação entre unidades — da produção à entrega",
          "Coordinación entre plantas — de la producción a la entrega",
          "跨工厂协同——从生产到交付"
        ),
      },
      {
        id: "h4",
        text: loc(
          "Commercial focus on lasting partnerships, not one-off deals",
          "Foco comercial em parcerias duradouras, não em negócios pontuais",
          "Enfoque comercial en alianzas duraderas, no en negocios puntuales",
          "以长期合作伙伴关系为核心，而非一次性交易"
        ),
      },
    ],
    items: [
      {
        id: "l1",
        name: "Elena Nordström",
        role: loc(
          "Chief Executive Officer",
          "Chief Executive Officer",
          "Chief Executive Officer",
          "首席执行官"
        ),
        image:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: "l2",
        name: "James Whitfield",
        role: loc(
          "Chief Operating Officer",
          "Chief Operating Officer",
          "Chief Operating Officer",
          "首席运营官"
        ),
        image:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: "l3",
        name: "Ana Ribeiro",
        role: loc(
          "Chief Commercial Officer",
          "Chief Commercial Officer",
          "Chief Commercial Officer",
          "首席商务官"
        ),
        image:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: "l4",
        name: "Li Wei",
        role: loc(
          "Head of Asia-Pacific",
          "Head of Asia-Pacific",
          "Head of Asia-Pacific",
          "亚太区负责人"
        ),
        image:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800&auto=format&fit=crop",
      },
    ],
  },
  callout: {
    segments: [
      {
        text: loc("More Than a Supplier"),
        tone: "white",
        breakBefore: false,
      },
    ],
    body: loc(
      "Many suppliers focus on individual categories. Oboya Horticulture takes a wider perspective.\n\nBy offering solutions across multiple stages of the horticultural journey, we help customers improve efficiency, protect\nquality, optimize resources, and create long-term value throughout their operations.",
      "Muitos fornecedores focam em categorias individuais. A Oboya Horticulture tem uma perspectiva mais ampla.\n\nAo oferecer soluções em múltiplas etapas da jornada hortícola, ajudamos os clientes a melhorar a eficiência, proteger\na qualidade, otimizar recursos e criar valor de longo prazo em suas operações.",
      "Muchos proveedores se centran en categorías individuales. Oboya Horticulture adopta una perspectiva más amplia.\n\nAl ofrecer soluciones en múltiples etapas del recorrido hortícola, ayudamos a los clientes a mejorar la eficiencia, proteger\nla calidad, optimizar recursos y crear valor a largo plazo en sus operaciones.",
      "许多供应商专注于单一品类。Oboya Horticulture 拥有更广阔的视角。\n\n通过在园艺旅程的多个阶段提供解决方案，我们帮助客户提升效率、保障\n品质、优化资源，并在运营中创造长期价值。"
    ),
  },
  culture: {
    title: loc(
      "What Makes Oboya Horticulture Different",
      "O que torna a Oboya Horticulture diferente",
      "Qué hace diferente a Oboya Horticulture",
      "Oboya Horticulture 的与众不同之处"
    ),
    eyebrow: loc(""),
    items: [
      {
        id: "one-stop",
        title: loc(
          "Your one-stop partner for horticulture",
          "Seu parceiro one-stop para horticultura",
          "Tu socio one-stop para horticultura",
          "您的一站式园艺合作伙伴"
        ),
        description: loc(
          "From propagation to point of sale, customers can access solutions for multiple stages of their operation through a single trusted partner.",
          "Da propagação ao ponto de venda, os clientes acessam soluções para várias etapas da operação por meio de um único parceiro de confiança.",
          "Desde la propagación hasta el punto de venta, los clientes acceden a soluciones para múltiples etapas de su operación a través de un solo socio de confianza.",
          "从育苗到销售终端，客户可通过单一可信伙伴获得覆盖运营多阶段的解决方案。"
        ),
        image:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop",
        imageAlt: loc(
          "Oboya team collaborating on integrated horticulture solutions",
          "Equipe Oboya colaborando em soluções integradas de horticultura",
          "Equipo Oboya colaborando en soluciones hortícolas integradas",
          "Oboya 团队协作推进一体化园艺方案"
        ),
        imageSide: "right",
        ctaLabel: loc("Learn more", "Saiba mais", "Saber más", "了解更多"),
        ctaHref: "/solutions",
      },
      {
        id: "global-local",
        title: loc(
          "Global Reach. Local Understanding.",
          "Alcance global. Entendimento local.",
          "Alcance global. Comprensión local.",
          "全球覆盖。本地洞察。"
        ),
        description: loc(
          "International manufacturing, sourcing, and product development capabilities combined with local expertise and support.",
          "Capacidades internacionais de manufatura, sourcing e desenvolvimento de produtos combinadas com expertise e suporte locais.",
          "Capacidades internacionales de manufactura, sourcing y desarrollo de productos combinadas con expertise y soporte locales.",
          "国际制造、采购与产品开发能力，结合本地专长与支持。"
        ),
        image:
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
        imageAlt: loc(
          "Team joining hands in collaboration",
          "Equipe unindo as mãos em colaboração",
          "Equipo uniendo las manos en colaboración",
          "团队携手协作"
        ),
        imageSide: "left",
        ctaLabel: loc(
          "See results",
          "Ver resultados",
          "Ver resultados",
          "查看成果"
        ),
        ctaHref: "/case-studies",
      },
      {
        id: "practical",
        title: loc(
          "Practical Solutions",
          "Soluções práticas",
          "Soluciones prácticas",
          "务实方案"
        ),
        description: loc(
          "Focused on solving real operational challenges and creating measurable value.",
          "Focadas em resolver desafios operacionais reais e criar valor mensurável.",
          "Enfocadas en resolver desafíos operativos reales y crear valor medible.",
          "专注解决真实运营挑战并创造可衡量的价值。"
        ),
        image:
          "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1200&auto=format&fit=crop",
        imageAlt: loc(
          "Growers working in a horticulture greenhouse",
          "Produtores trabalhando em estufa de horticultura",
          "Productores trabajando en un invernadero de horticultura",
          "种植者在园艺温室作业"
        ),
        imageSide: "right",
        ctaLabel: loc(
          "See our solutions",
          "Ver nossas soluções",
          "Ver nuestras soluciones",
          "查看我们的方案"
        ),
        ctaHref: "/solutions",
      },
      {
        id: "partnership",
        title: loc(
          "Long-term Partnerships",
          "Parcerias de longo prazo",
          "Alianzas a largo plazo",
          "长期合作伙伴关系"
        ),
        description: loc(
          "Relationships built on trust, collaboration and reliability.",
          "Relações construídas sobre confiança, colaboração e confiabilidade.",
          "Relaciones construidas sobre confianza, colaboración y fiabilidad.",
          "建立在信任、协作与可靠之上的关系。"
        ),
        image:
          "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1200&auto=format&fit=crop",
        imageAlt: loc(
          "Business partners in a strategy meeting",
          "Parceiros de negócio em reunião estratégica",
          "Socios de negocio en una reunión estratégica",
          "商业伙伴在战略会议中"
        ),
        imageSide: "left",
        ctaLabel: loc(
          "Contact us",
          "Fale conosco",
          "Contáctanos",
          "联系我们"
        ),
        ctaHref: "/contact",
      },
    ],
  },
  mission: {
    title: loc("Mission", "Missão", "Misión", "使命"),
    body: loc(
      "Oboya Horticulture is committed to delivering integrated one-stop solutions that help growers, packers, and wholesalers achieve quality, efficiency, and sustainable growth across the horticultural supply chain.",
      "A Oboya Horticulture se compromete a entregar soluções one-stop integradas que ajudam produtores, embaladores e atacadistas a alcançar qualidade, eficiência e crescimento sustentável em toda a cadeia hortícola.",
      "Oboya Horticulture se compromete a entregar soluciones one-stop integradas que ayudan a productores, empaquetadores y mayoristas a lograr calidad, eficiencia y crecimiento sostenible en toda la cadena hortícola.",
      "Oboya Horticulture 致力于提供一体化一站式解决方案，帮助种植者、包装商与批发商在整个园艺供应链中实现质量、效率与可持续增长。"
    ),
    images: [
      {
        src: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?q=80&w=1200&auto=format&fit=crop",
        alt: loc(
          "Shipping port with containers at sunset",
          "Porto com contêineres ao pôr do sol",
          "Puerto con contenedores al atardecer",
          "日落时分的集装箱港口"
        ),
      },
      {
        src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800&auto=format&fit=crop",
        alt: loc(
          "Worker tending plants in a greenhouse",
          "Trabalhador cuidando de plantas em estufa",
          "Trabajador cuidando plantas en un invernadero",
          "工作人员在温室照料植物"
        ),
      },
    ],
  },
  vision: {
    title: loc("Vision", "Visão", "Visión", "愿景"),
    body: loc(
      "To be the most trusted integrated horticulture partner worldwide — connecting global manufacturing strength with local expertise so every customer can grow with confidence.",
      "Ser o parceiro integrado de horticultura mais confiável do mundo — unindo força de manufatura global à expertise local para que cada cliente cresça com confiança.",
      "Ser el socio hortícola integrado más confiable del mundo — uniendo la fuerza manufacturera global con la experiencia local para que cada cliente crezca con confianza.",
      "成为全球最受信赖的一体化园艺合作伙伴——将全球制造实力与本地专长相结合，让每位客户都能自信成长。"
    ),
    images: [
      {
        src: "https://images.unsplash.com/photo-1573497019940-1cfe6d4b9f07?q=80&w=1200&auto=format&fit=crop",
        alt: loc(
          "Team collaborating with technology in a modern workspace",
          "Equipe colaborando com tecnologia em espaço moderno",
          "Equipo colaborando con tecnología en un espacio moderno",
          "团队在现代空间中借助技术协作"
        ),
      },
      {
        src: "https://images.unsplash.com/photo-1466692476867-a0881dfc0648?q=80&w=800&auto=format&fit=crop",
        alt: loc(
          "Hands holding a young plant sprout",
          "Mãos segurando um broto jovem",
          "Manos sosteniendo un brote joven",
          "双手托起幼苗"
        ),
      },
    ],
  },
  values: {
    title: loc("Values", "Valores", "Valores", "价值观"),
    items: [
      {
        id: "innovation",
        title: loc("Innovation", "Inovação", "Innovación", "创新"),
        description: loc(
          "We continuously improve materials, systems, and services so horticulture businesses stay ahead of change.",
          "Melhoramos continuamente materiais, sistemas e serviços para que negócios de horticultura liderem a mudança.",
          "Mejoramos continuamente materiales, sistemas y servicios para que los negocios hortícolas se mantengan a la vanguardia.",
          "我们持续改进材料、系统与服务，使园艺企业走在变化前列。"
        ),
        image: {
          src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Modern greenhouse with rows of growing plants",
            "Estufa moderna com fileiras de plantas em crescimento",
            "Invernadero moderno con filas de plantas en crecimiento",
            "现代化温室中成排生长的植物"
          ),
        },
        objectPosition: "center 45%",
      },
      {
        id: "integrity",
        title: loc("Integrity", "Integridade", "Integridad", "诚信"),
        description: loc(
          "Honest partnerships and transparent commitments guide how we manufacture, sell, and support every customer.",
          "Parcerias honestas e compromissos transparentes guiam como fabricamos, vendemos e apoiamos cada cliente.",
          "Alianzas honestas y compromisos transparentes guían cómo fabricamos, vendemos y apoyamos a cada cliente.",
          "诚实的伙伴关系与透明的承诺指引我们如何制造、销售并支持每位客户。"
        ),
        image: {
          src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Business partners shaking hands in agreement",
            "Parceiros de negócios apertando as mãos em acordo",
            "Socios comerciales estrechandose la mano en acuerdo",
            "商业伙伴握手达成协议"
          ),
        },
        objectPosition: "center 30%",
      },
      {
        id: "customer-oriented",
        title: loc(
          "Customer oriented",
          "Orientação ao cliente",
          "Orientado al cliente",
          "以客户为中心"
        ),
        description: loc(
          "We listen closely to growers and partners, shaping solutions around real market needs and long-term success.",
          "Ouvimos de perto produtores e parceiros, moldando soluções em torno de necessidades reais do mercado e sucesso de longo prazo.",
          "Escuchamos de cerca a productores y socios, moldeando soluciones en torno a necesidades reales del mercado y el éxito a largo plazo.",
          "我们密切倾听种植者与合作伙伴，围绕真实市场需求与长期成功打造方案。"
        ),
        image: {
          src: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Grower inspecting crops in a cultivated field",
            "Produtor inspecionando cultivos em um campo cultivado",
            "Productor inspeccionando cultivos en un campo cultivado",
            "种植者在农田中检查作物"
          ),
        },
        objectPosition: "center 40%",
      },
      {
        id: "professional",
        title: loc("Professional", "Profissional", "Profesional", "专业"),
        description: loc(
          "Expertise, discipline, and care in every product, process, and conversation — from plant floor to store shelf.",
          "Expertise, disciplina e cuidado em cada produto, processo e conversa — do chão de fábrica à prateleira.",
          "Experiencia, disciplina y cuidado en cada producto, proceso y conversación — de la planta al estante.",
          "每一件产品、每一道流程、每一次沟通都体现专业、纪律与用心——从工厂到货架。"
        ),
        image: {
          src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Technician working carefully in a production environment",
            "Técnico trabalhando com cuidado em ambiente de produção",
            "Técnico trabajando con cuidado en un entorno de producción",
            "技术人员在生产环境中细致工作"
          ),
        },
        objectPosition: "center 35%",
      },
      {
        id: "responsibility",
        title: loc(
          "Responsibility",
          "Responsabilidade",
          "Responsabilidad",
          "责任"
        ),
        description: loc(
          "We act with respect for people, communities, and the environment across every market we serve.",
          "Agimos com respeito às pessoas, comunidades e ao meio ambiente em cada mercado que atendemos.",
          "Actuamos con respeto por las personas, las comunidades y el medio ambiente en cada mercado que servimos.",
          "我们在所服务的每个市场中尊重人、社区与环境。"
        ),
        image: {
          src: "https://images.unsplash.com/photo-1470058869958-2a77ade41c02?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Lush green plants growing in a sustainable environment",
            "Plantas verdes exuberantes crescendo em ambiente sustentável",
            "Plantas verdes exuberantes creciendo en un entorno sostenible",
            "可持续环境中茂盛生长的绿色植物"
          ),
        },
        objectPosition: "center 40%",
      },
    ],
  },
  honors: {
    title: loc(
      "Honor & Certification",
      "Honor & Certification",
      "Honor & Certification",
      "荣誉与认证"
    ),
    items: [
      { id: "brcgs", name: "BRCGS", image: "/assets/homepage/cert-brcgs.png" },
      { id: "sedex", name: "Sedex", image: "/assets/homepage/cert-sedex.png" },
      {
        id: "amfori",
        name: "amfori BSCI",
        image: "/assets/homepage/cert-smeta.png",
      },
      {
        id: "fsc",
        name: "FSC",
        image: "/assets/homepage/cert-grs.png",
      },
      {
        id: "iso",
        name: "ISO 9001",
        image: "/assets/homepage/cert-iso.png",
      },
    ],
  },
  updatedAt: new Date().toISOString(),
});

let cache: AboutPageSettings | null = null;
const CONTENT_REVISION = 22;
let cacheRevision = 0;

const VALUE_IMAGE_FALLBACKS: Record<
  string,
  { image: AboutMediaImage; objectPosition?: string }
> = {
  innovation: {
    image: {
      src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1400&auto=format&fit=crop",
      alt: loc(
        "Modern greenhouse with rows of growing plants",
        "Estufa moderna com fileiras de plantas em crescimento",
        "Invernadero moderno con filas de plantas en crecimiento",
        "现代化温室中成排生长的植物"
      ),
    },
    objectPosition: "center 45%",
  },
  integrity: {
    image: {
      src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1400&auto=format&fit=crop",
      alt: loc(
        "Business partners shaking hands in agreement",
        "Parceiros de negócios apertando as mãos em acordo",
        "Socios comerciales estrechandose la mano en acuerdo",
        "商业伙伴握手达成协议"
      ),
    },
    objectPosition: "center 30%",
  },
  "customer-oriented": {
    image: {
      src: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1400&auto=format&fit=crop",
      alt: loc(
        "Grower inspecting crops in a cultivated field",
        "Produtor inspecionando cultivos em um campo cultivado",
        "Productor inspeccionando cultivos en un campo cultivado",
        "种植者在农田中检查作物"
      ),
    },
    objectPosition: "center 40%",
  },
  professional: {
    image: {
      src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1400&auto=format&fit=crop",
      alt: loc(
        "Technician working carefully in a production environment",
        "Técnico trabalhando com cuidado em ambiente de produção",
        "Técnico trabajando con cuidado en un entorno de producción",
        "技术人员在生产环境中细致工作"
      ),
    },
    objectPosition: "center 35%",
  },
  responsibility: {
    image: {
      src: "https://images.unsplash.com/photo-1470058869958-2a77ade41c02?q=80&w=1400&auto=format&fit=crop",
      alt: loc(
        "Lush green plants growing in a sustainable environment",
        "Plantas verdes exuberantes crescendo em ambiente sustentável",
        "Plantas verdes exuberantes creciendo en un entorno sostenible",
        "可持续环境中茂盛生长的绿色植物"
      ),
    },
    objectPosition: "center 40%",
  },
};

function fallbackValueImage(id: string): {
  image: AboutMediaImage;
  objectPosition?: string;
} {
  return (
    VALUE_IMAGE_FALLBACKS[id] ?? {
      image: {
        src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=1400&auto=format&fit=crop",
        alt: loc(
          "Horticulture greenhouse interior",
          "Interior de estufa de horticultura",
          "Interior de invernadero de horticultura",
          "园艺温室内部"
        ),
      },
      objectPosition: "center center",
    }
  );
}

const IMPACT_STAT_DEFAULTS: AboutImpactStat[] = defaultSettings().impact.stats;

const IMPACT_ICON_BY_ID: Record<string, AboutImpactStatIcon> = {
  countries: "globe",
  manufacturing: "factory",
  offices: "building",
  employees: "users",
  team: "users",
  clients: "handshake",
  products: "package",
  years: "calendar",
  facilities: "factory",
};

const IMPACT_ACCENT_BY_ID: Record<string, string> = {
  countries: "#004F7C",
  manufacturing: "#4DAF4E",
  offices: "#009CD4",
  employees: "#01203F",
  team: "#01203F",
  clients: "#ea5744",
  products: "#75C566",
  years: "#909B03",
  facilities: "#4DAF4E",
};

function fallbackImpactMedia(id: string): Pick<
  AboutImpactStat,
  "image" | "objectPosition" | "accentColor"
> {
  const fromDefaults = IMPACT_STAT_DEFAULTS.find((stat) => stat.id === id);
  if (fromDefaults) {
    return {
      image: fromDefaults.image,
      objectPosition: fromDefaults.objectPosition,
      accentColor: fromDefaults.accentColor,
    };
  }
  return {
    accentColor: IMPACT_ACCENT_BY_ID[id] ?? "#4DAF4E",
    objectPosition: "center center",
    image: {
      src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=1400&auto=format&fit=crop",
      alt: loc(
        "Horticulture greenhouse interior",
        "Interior de estufa de horticultura",
        "Interior de invernadero de horticultura",
        "园艺温室内部"
      ),
    },
  };
}

function normalizeImpactStats(stats: AboutImpactStat[]): AboutImpactStat[] {
  if (!Array.isArray(stats) || stats.length === 0) {
    return IMPACT_STAT_DEFAULTS;
  }

  const byId = new Map(stats.map((stat) => [stat.id, stat]));
  const required = [
    "countries",
    "manufacturing",
    "offices",
    "employees",
    "clients",
    "products",
    "years",
  ];

  // Preserve incoming order; append any missing required stats from defaults
  // (do not wipe custom values when a legacy doc is incomplete).
  const orderedIds: string[] = [];
  const seen = new Set<string>();
  for (const stat of stats) {
    if (!stat?.id || seen.has(stat.id)) continue;
    seen.add(stat.id);
    orderedIds.push(stat.id);
  }
  for (const id of required) {
    if (seen.has(id)) continue;
    seen.add(id);
    orderedIds.push(id);
  }

  return orderedIds.map((id) => {
    const fromDefaults = IMPACT_STAT_DEFAULTS.find((stat) => stat.id === id);
    const stat = byId.get(id) ?? fromDefaults;
    if (!stat) {
      return IMPACT_STAT_DEFAULTS[0];
    }
    const media = fallbackImpactMedia(id);
    const src = stat.image?.src ?? "";
    return {
      ...fromDefaults,
      ...stat,
      id,
      icon: stat.icon ?? IMPACT_ICON_BY_ID[id] ?? fromDefaults?.icon ?? "globe",
      pending: stat.pending === true,
      accentColor:
        stat.accentColor ??
        IMPACT_ACCENT_BY_ID[id] ??
        media.accentColor,
      objectPosition: stat.objectPosition ?? media.objectPosition,
      image: src
        ? {
            src,
            alt: stat.image?.alt ?? media.image.alt,
          }
        : media.image,
    };
  });
}

/** Ensure durable / legacy CMS docs have value images and Numbers stats. */
export function normalizeAboutPageSettings(
  settings: AboutPageSettings
): AboutPageSettings {
  const defaults = defaultSettings();

  const currentEvents = settings.timeline?.events ?? [];
  const years = new Set(currentEvents.map((event) => event.year));
  const isLegacyTimeline =
    currentEvents.length === 0 ||
    years.has("1998") ||
    years.has("2006") ||
    years.has("2016") ||
    years.has("2021") ||
    years.has("2025") ||
    !years.has("2005") ||
    !years.has("2013") ||
    !years.has("2023");

  const currentCalloutBody = settings.callout?.body?.en ?? "";
  const isLegacyCallout =
    !currentCalloutBody ||
    currentCalloutBody.includes("Most suppliers specialize") ||
    !currentCalloutBody.includes("protect\nquality");

  const currentHeroTitle = settings.hero?.title?.en ?? "";
  const isLegacyHero =
    !currentHeroTitle ||
    currentHeroTitle.includes("Oboya Horticulture supports growers") ||
    !settings.hero?.body?.en;

  const cultureItems = settings.culture?.items ?? [];
  const cultureFirstTitle = cultureItems[0]?.title?.en ?? "";
  const isLegacyCulture =
    cultureItems.length === 0 ||
    cultureFirstTitle === "Integrated Solutions" ||
    cultureItems.some((item) => item.id === "integrated" || item.id === "performance") ||
    !settings.culture?.title?.en;

  return {
    ...settings,
    sections: {
      ...defaults.sections,
      ...settings.sections,
      impact: {
        enabled: settings.sections?.impact?.enabled ?? true,
      },
    },
    hero: isLegacyHero
      ? defaults.hero
      : {
          ...defaults.hero,
          ...settings.hero,
          body: settings.hero?.body ?? defaults.hero.body,
        },
    timeline: {
      ...defaults.timeline,
      ...settings.timeline,
      prevLabel: settings.timeline?.prevLabel ?? defaults.timeline.prevLabel,
      nextLabel: settings.timeline?.nextLabel ?? defaults.timeline.nextLabel,
      events: isLegacyTimeline ? defaults.timeline.events : currentEvents,
    },
    callout: {
      ...defaults.callout,
      ...settings.callout,
      segments:
        settings.callout?.segments?.length
          ? settings.callout.segments
          : defaults.callout.segments,
      body: isLegacyCallout
        ? defaults.callout.body
        : (settings.callout?.body ?? defaults.callout.body),
    },
    culture: isLegacyCulture
      ? defaults.culture
      : {
          ...defaults.culture,
          ...settings.culture,
          title: settings.culture?.title ?? defaults.culture.title,
          eyebrow: settings.culture?.eyebrow ?? defaults.culture.eyebrow,
          items: cultureItems.length ? cultureItems : defaults.culture.items,
        },
    impact: {
      title: settings.impact?.title ?? defaults.impact.title,
      description: settings.impact?.description ?? defaults.impact.description,
      eyebrow: settings.impact?.eyebrow,
      stats: normalizeImpactStats(settings.impact?.stats ?? []),
    },
    values: {
      ...settings.values,
      items: (settings.values?.items ?? []).map((item) => {
        const fallback = fallbackValueImage(item.id);
        const src = item.image?.src ?? "";
        const needsImage =
          !src ||
          (item.id === "responsibility" &&
            src.includes("photo-1466692476867-a0881dfc0648"));

        if (!needsImage) {
          return {
            ...item,
            objectPosition: item.objectPosition ?? "center center",
          };
        }

        return {
          ...item,
          image: fallback.image,
          objectPosition: item.objectPosition ?? fallback.objectPosition,
        };
      }),
    },
  };
}

export function getAboutPageSettings(): AboutPageSettings {
  if (!cache || cacheRevision !== CONTENT_REVISION) {
    cache = defaultSettings();
    cacheRevision = CONTENT_REVISION;
  }
  return cache;
}

export function replaceAboutPageSettingsCache(settings: AboutPageSettings) {
  cache = normalizeAboutPageSettings(settings);
  cacheRevision = CONTENT_REVISION;
}

export function saveAboutPageSettings(
  settings: AboutPageSettings
): AboutPageSettings {
  const updated = normalizeAboutPageSettings({
    ...settings,
    updatedAt: new Date().toISOString(),
  });
  cache = updated;
  return updated;
}

export function resetAboutPageSettings(): AboutPageSettings {
  cache = defaultSettings();
  return cache;
}
