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
}

export interface AboutHonorItem {
  id: string;
  name: string;
  image: string;
  href?: string;
}

export interface AboutImpactStat {
  id: string;
  value: number;
  suffix: string;
  label: LocalizedString;
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
    eyebrow: LocalizedString;
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
    impact: { enabled: false },
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
      "Oboya Horticulture is a leading One-Stop Shopping supplier for Flowers, Vegetables Growers, Packaging Companies, and Wholesalers in more than 60 countries around the world.",
      "A Oboya Horticulture é um fornecedor One-Stop Shopping líder para produtores de flores e vegetais, empresas de embalagem e atacadistas em mais de 60 países.",
      "Oboya Horticulture es un proveedor One-Stop Shopping líder para productores de flores y vegetales, empresas de packaging y mayoristas en más de 60 países.",
      "Oboya Horticulture 是面向花卉与蔬菜种植者、包装企业及批发商的领先一站式采购供应商，业务覆盖全球 60 多个国家。"
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
        id: "1998",
        year: "1998",
        description: loc(
          "Oboya Horticulture was founded in 1998. The company has grown from a small family business to a large-scale international group.",
          "A Oboya Horticulture foi fundada em 1998. A empresa cresceu de um pequeno negócio familiar a um grupo internacional de grande escala.",
          "Oboya Horticulture fue fundada en 1998. La empresa ha crecido de un pequeño negocio familiar a un grupo internacional a gran escala.",
          "Oboya Horticulture 成立于 1998 年。公司已从小家庭企业成长为大型国际集团。"
        ),
      },
      {
        id: "2006",
        year: "2006",
        description: loc(
          "Oboya expands manufacturing and sales capabilities focused on horticulture packaging and grower supplies.",
          "A Oboya amplia capacidade de manufatura e vendas focada em embalagens e suprimentos para horticultura.",
          "Oboya amplía capacidad de manufactura y ventas enfocada en packaging y suministros hortícolas.",
          "Oboya 扩展以园艺包装与种植者供应为核心的制造与销售能力。"
        ),
      },
      {
        id: "2011",
        year: "2011",
        description: loc(
          "International growth accelerates as Oboya deepens presence across key horticulture markets.",
          "O crescimento internacional acelera à medida que a Oboya aprofunda a presença em mercados-chave de horticultura.",
          "El crecimiento internacional se acelera a medida que Oboya profundiza su presencia en mercados clave de horticultura.",
          "随着 Oboya 深耕重点园艺市场，国际扩张加速。"
        ),
      },
      {
        id: "2016",
        year: "2016",
        description: loc(
          "Own companies and regional offices expand across Europe, Africa and Latin America.",
          "Empresas próprias e escritórios regionais se expandem na Europa, África e América Latina.",
          "Empresas propias y oficinas regionales se expanden en Europa, África y América Latina.",
          "自有公司与区域办事处扩展至欧洲、非洲与拉丁美洲。"
        ),
      },
      {
        id: "2021",
        year: "2021",
        description: loc(
          "Certification programs and sustainable packaging initiatives scale across facilities.",
          "Programas de certificação e iniciativas de embalagem sustentável se expandem nas unidades.",
          "Programas de certificación e iniciativas de packaging sostenible se escalan en las plantas.",
          "认证项目与可持续包装举措在各工厂扩展。"
        ),
      },
      {
        id: "2025",
        year: "2025",
        description: loc(
          "Digital channels connect buyers to local Oboya teams for faster quotation and market-ready support.",
          "Canais digitais conectam compradores às equipes locais Oboya para cotação mais rápida e suporte no mercado.",
          "Canales digitales conectan compradores con equipos locales Oboya para cotización más rápida y soporte en mercado.",
          "数字渠道连接买家与本地 Oboya 团队，实现更快询价与市场支持。"
        ),
      },
    ],
  },
  impact: {
    eyebrow: loc("Impact", "Impacto", "Impacto", "影响力"),
    title: loc(
      "Growing with purpose worldwide",
      "Crescendo com propósito no mundo",
      "Creciendo con propósito en el mundo",
      "以使命推动全球增长"
    ),
    description: loc(
      "Decades of partnership with growers, measured in reach, trust, and sustainable progress.",
      "Décadas de parceria com produtores, medidas em alcance, confiança e progresso sustentável.",
      "Décadas de partnership con productores, medidas en alcance, confianza y progreso sostenible.",
      "与种植者数十年的合作，体现在覆盖、信任与可持续进步。"
    ),
    stats: [
      {
        id: "countries",
        value: 80,
        suffix: "+",
        label: loc(
          "Countries served",
          "Países atendidos",
          "Países atendidos",
          "服务国家"
        ),
      },
      {
        id: "years",
        value: 20,
        suffix: "+",
        label: loc(
          "Years of industry experience",
          "Anos de experiência",
          "Años de experiencia",
          "行业经验年数"
        ),
      },
      {
        id: "facilities",
        value: 12,
        suffix: "",
        label: loc(
          "Production & sales hubs",
          "Hubs de produção e vendas",
          "Hubs de producción y ventas",
          "生产与销售中心"
        ),
      },
      {
        id: "team",
        value: 1400,
        suffix: "+",
        label: loc(
          "People behind Oboya",
          "Pessoas por trás da Oboya",
          "Personas detrás de Oboya",
          "Oboya 团队成员"
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
        text: loc(
          "Founded in 1998, Oboya maintains a strategy with its general headquarters based in ",
          "Fundada em 1998, a Oboya mantém uma estratégia com sede geral na ",
          "Fundada en 1998, Oboya mantiene una estrategia con sede general en ",
          "Oboya 成立于 1998 年，总部战略立足"
        ),
        tone: "white",
        breakBefore: false,
      },
      {
        text: loc("China", "China", "China", "中国"),
        tone: "green",
        breakBefore: false,
      },
      {
        text: loc(
          ". In the recent decades, we have our own companies in ",
          ". Nas últimas décadas, temos empresas próprias em ",
          ". En las últimas décadas, tenemos empresas propias en ",
          "。近几十年来，我们在"
        ),
        tone: "white",
        breakBefore: false,
      },
      {
        text: loc(
          "Kenya, Poland, Sweden, Norway, Ecuador, Israel, Arab, Colombia, Brazil, Peru, Chile, Mexico",
          "Quênia, Polônia, Suécia, Noruega, Equador, Israel, países árabes, Colômbia, Brasil, Peru, Chile, México",
          "Kenia, Polonia, Suecia, Noruega, Ecuador, Israel, países árabes, Colombia, Brasil, Perú, Chile, México",
          "肯尼亚、波兰、瑞典、挪威、厄瓜多尔、以色列、阿拉伯地区、哥伦比亚、巴西、秘鲁、智利、墨西哥"
        ),
        tone: "green",
        breakBefore: false,
      },
      {
        text: loc(
          " and have sales organizations.",
          " e organizações comerciais.",
          " y organizaciones de ventas.",
          "设有自有公司及销售机构。"
        ),
        tone: "white",
        breakBefore: false,
      },
    ],
  },
  culture: {
    eyebrow: loc(""),
    items: [
      {
        id: "integrated",
        title: loc(
          "Integrated Solutions",
          "Soluções integradas",
          "Soluciones integradas",
          "一体化解决方案"
        ),
        description: loc(
          "From propagation and growing systems to packaging, logistics, and retail display — Oboya connects every stage so growers work with one trusted partner.",
          "Da propagação e sistemas de cultivo à embalagem, logística e display no varejo — a Oboya conecta cada etapa para que produtores trabalhem com um parceiro de confiança.",
          "Desde propagación y sistemas de cultivo hasta packaging, logística y display retail — Oboya conecta cada etapa para que los productores trabajen con un socio de confianza.",
          "从育苗与栽培系统到包装、物流与零售陈列——Oboya 串联每一环节，让种植者与值得信赖的伙伴合作。"
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
        ctaLabel: loc("Learn More", "Saiba mais", "Saber más", "了解更多"),
        ctaHref: "/solutions",
      },
      {
        id: "performance",
        title: loc(
          "Performance Driven Approach",
          "Abordagem orientada a desempenho",
          "Enfoque orientado al rendimiento",
          "以绩效为导向的方法"
        ),
        description: loc(
          "We design products and processes around measurable grower outcomes — quality, efficiency, and reliability from greenhouse floor to market.",
          "Projetamos produtos e processos em torno de resultados mensuráveis para o produtor — qualidade, eficiência e confiabilidade da estufa ao mercado.",
          "Diseñamos productos y procesos en torno a resultados medibles para el productor — calidad, eficiencia y fiabilidad del invernadero al mercado.",
          "我们围绕可衡量的种植者成果设计产品与流程——从温室到市场的质量、效率与可靠性。"
        ),
        image:
          "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1200&auto=format&fit=crop",
        imageAlt: loc(
          "Growers working in a horticulture greenhouse",
          "Produtores trabalhando em estufa de horticultura",
          "Productores trabajando en un invernadero de horticultura",
          "种植者在园艺温室作业"
        ),
        imageSide: "left",
        ctaLabel: loc("Learn More", "Saiba mais", "Saber más", "了解更多"),
        ctaHref: "/solutions",
      },
      {
        id: "global-local",
        title: loc(
          "Global Capabilities, Local Support",
          "Capacidade global, suporte local",
          "Capacidad global, soporte local",
          "全球能力，本地支持"
        ),
        description: loc(
          "Worldwide manufacturing and supply are backed by regional teams who understand local crops, seasons, and commercial realities.",
          "Manufatura e supply chain globais são sustentadas por equipes regionais que entendem culturas, safras e realidades comerciais locais.",
          "La manufactura y la cadena de suministro globales se respaldan con equipos regionales que entienden cultivos, temporadas y realidades comerciales locales.",
          "全球制造与供应由了解本地作物、季节与商业现实的区域团队支持。"
        ),
        image:
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
        imageAlt: loc(
          "Team joining hands in collaboration",
          "Equipe unindo as mãos em colaboração",
          "Equipo uniendo las manos en colaboración",
          "团队携手协作"
        ),
        imageSide: "right",
        ctaLabel: loc("Learn More", "Saiba mais", "Saber más", "了解更多"),
        ctaHref: "/about",
      },
      {
        id: "partnership",
        title: loc(
          "Long-Term Partnership",
          "Parceria de longo prazo",
          "Alianza a largo plazo",
          "长期合作伙伴关系"
        ),
        description: loc(
          "We invest in lasting relationships — aligning production, service, and innovation with the growers and wholesalers who grow with us.",
          "Investimos em relações duradouras — alinhando produção, serviço e inovação com os produtores e atacadistas que crescem conosco.",
          "Invertimos en relaciones duraderas — alineando producción, servicio e innovación con los productores y mayoristas que crecen con nosotros.",
          "我们投资于长久关系——与共同成长的种植者与批发商对齐生产、服务与创新。"
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
        ctaLabel: loc("Learn More", "Saiba mais", "Saber más", "了解更多"),
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
const CONTENT_REVISION = 10;
let cacheRevision = 0;

export function getAboutPageSettings(): AboutPageSettings {
  if (!cache) {
    cache = defaultSettings();
  }
  return cache;
}

export function replaceAboutPageSettingsCache(
  settings: AboutPageSettings
): AboutPageSettings {
  cache = { ...settings };
  cacheRevision = CONTENT_REVISION;
  return cache;
}

export function saveAboutPageSettings(
  settings: AboutPageSettings
): AboutPageSettings {
  const updated = { ...settings, updatedAt: new Date().toISOString() };
  cache = updated;
  cacheRevision = CONTENT_REVISION;
  return updated;
}

export function resetAboutPageSettings(): AboutPageSettings {
  cache = defaultSettings();
  cacheRevision = CONTENT_REVISION;
  return cache;
}
