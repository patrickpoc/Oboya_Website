import type { LocalizedString } from "@/lib/cms/types";

export type AboutSectionId =
  | "hero"
  | "institutionalImage"
  | "timeline"
  | "impact"
  | "people"
  | "callout"
  | "culture"
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
    eyebrow: loc(
      "Company Profile",
      "Perfil da empresa",
      "Perfil de la empresa",
      "公司简介"
    ),
    title: loc(
      "Oboya Horticulture industries provides One-Stop Shopping supplies for Flowers, Vegetables Growers, Packaging Companies, and Wholesalers in more than 80 countries around the world.",
      "A Oboya Horticulture Industries oferece soluções One-Stop Shopping para produtores de flores e vegetais, empresas de embalagem e atacadistas em mais de 80 países.",
      "Oboya Horticulture Industries ofrece soluciones One-Stop Shopping para productores de flores y vegetales, empresas de packaging y mayoristas en más de 80 países.",
      "Oboya Horticulture Industries 为花卉与蔬菜种植者、包装企业及批发商提供一站式采购供应，业务覆盖全球 80 多个国家。"
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
        id: "2006",
        year: "2006",
        description: loc(
          "Oboya Horticulture Industries is founded, establishing manufacturing and sales capabilities focused on horticulture packaging and grower supplies.",
          "A Oboya Horticulture Industries é fundada, estabelecendo capacidade de manufatura e vendas focada em embalagens e suprimentos para horticultura.",
          "Se funda Oboya Horticulture Industries, estableciendo capacidad de manufactura y ventas enfocada en packaging y suministros hortícolas.",
          "Oboya Horticulture Industries 成立，建立以园艺包装与种植者供应为核心的制造与销售能力。"
        ),
      },
      {
        id: "2009",
        year: "2009",
        description: loc(
          "Expansion of production lines and quality systems strengthens Oboya’s role as a reliable one-stop partner for growers and wholesalers.",
          "A expansão das linhas de produção e dos sistemas de qualidade reforça o papel da Oboya como parceira one-stop para produtores e atacadistas.",
          "La expansión de líneas de producción y sistemas de calidad refuerza el rol de Oboya como socio one-stop para productores y mayoristas.",
          "产线与质量体系扩展，巩固 Oboya 作为种植者与批发商一站式伙伴的地位。"
        ),
      },
      {
        id: "2012",
        year: "2012",
        description: loc(
          "Oboya accelerates international growth, deepening presence across key horticulture markets and reinforcing local service capabilities.",
          "A Oboya acelera o crescimento internacional, aprofundando a presença em mercados-chave de horticultura e reforçando o atendimento local.",
          "Oboya acelera el crecimiento internacional, profundizando su presencia en mercados clave de horticultura y reforzando el servicio local.",
          "Oboya 加快国际扩张，深耕重点园艺市场并强化本地服务能力。"
        ),
      },
      {
        id: "2016",
        year: "2016",
        description: loc(
          "Own companies and regional offices expand across Europe, Africa and Latin America, bringing Oboya closer to growers worldwide.",
          "Empresas próprias e escritórios regionais se expandem na Europa, África e América Latina, aproximando a Oboya dos produtores.",
          "Empresas propias y oficinas regionales se expanden en Europa, África y América Latina, acercando Oboya a los productores.",
          "自有公司与区域办事处扩展至欧洲、非洲与拉丁美洲，使 Oboya 更贴近全球种植者。"
        ),
      },
      {
        id: "2021",
        year: "2021",
        description: loc(
          "Certification programs and sustainable packaging initiatives scale across facilities, reinforcing trust with global customers.",
          "Programas de certificação e iniciativas de embalagem sustentável se expandem nas unidades, reforçando a confiança dos clientes globais.",
          "Programas de certificación e iniciativas de packaging sostenible se escalan en las plantas, reforzando la confianza de clientes globales.",
          "认证项目与可持续包装举措在各工厂扩展，增强全球客户信任。"
        ),
      },
      {
        id: "2025",
        year: "2025",
        description: loc(
          "Digital channels and commercial platforms connect buyers to local Oboya teams for faster quotation and market-ready support.",
          "Canais digitais e plataformas comerciais conectam compradores às equipes locais Oboya para cotação mais rápida e suporte no mercado.",
          "Canales digitales y plataformas comerciales conectan compradores con equipos locales Oboya para cotización más rápida y soporte en mercado.",
          "数字渠道与商业平台连接买家与本地 Oboya 团队，实现更快询价与市场支持。"
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
          "Founded in 2006, Oboya has manufacturing facilities ",
          "Fundada em 2006, a Oboya possui unidades de manufatura ",
          "Fundada en 2006, Oboya tiene instalaciones de manufactura ",
          "Oboya 成立于 2006 年，拥有制造设施，"
        ),
        tone: "white",
        breakBefore: false,
      },
      {
        text: loc(
          "as well as sales organizations in China",
          "bem como organizações comerciais na China",
          "así como organizaciones de ventas en China",
          "并在中国拥有销售机构"
        ),
        tone: "green",
        breakBefore: false,
      },
      {
        text: loc(
          ". In overseas market, we have our own companies in Kenya, Poland, Sweden, Norway, Ecuador ect. And in Colombia, Brazil, Peru, Chile, Mexico, we have sales organizations.",
          ". Nos mercados internacionais, temos empresas próprias no Quênia, Polônia, Suécia, Noruega, Equador etc. E na Colômbia, Brasil, Peru, Chile e México, temos organizações comerciais.",
          ". En mercados internacionales, tenemos empresas propias en Kenia, Polonia, Suecia, Noruega, Ecuador etc. Y en Colombia, Brasil, Perú, Chile y México, tenemos organizaciones de ventas.",
          "。在海外市场，我们在肯尼亚、波兰、瑞典、挪威、厄瓜多尔等地设有自有公司；在哥伦比亚、巴西、秘鲁、智利、墨西哥设有销售机构。"
        ),
        tone: "white",
        breakBefore: false,
      },
    ],
  },
  culture: {
    eyebrow: loc(
      "Corporate Culture",
      "Cultura corporativa",
      "Cultura corporativa",
      "企业文化"
    ),
    items: [
      {
        id: "internal",
        title: loc(
          "Internal responsibility of enterprise",
          "Responsabilidade interna da empresa",
          "Responsabilidad interna de la empresa",
          "企业的内部责任"
        ),
        description: loc(
          "We cultivate a workplace rooted in integrity, continuous learning, and care for every colleague across our global network.",
          "Cultivamos um ambiente de trabalho baseado em integridade, aprendizado contínuo e cuidado com cada colaborador na nossa rede global.",
          "Cultivamos un entorno laboral basado en integridad, aprendizaje continuo y cuidado de cada colega en nuestra red global.",
          "我们营造以诚信、持续学习与关怀每位同事为基础的工作环境，贯穿全球网络。"
        ),
        image:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop",
        imageAlt: loc(
          "Oboya team collaborating in a modern workspace",
          "Equipe Oboya colaborando em um espaço moderno",
          "Equipo Oboya colaborando en un espacio moderno",
          "Oboya 团队在现代办公空间协作"
        ),
        imageSide: "right",
      },
      {
        id: "external",
        title: loc(
          "External responsibility of enterprise",
          "Responsabilidade externa da empresa",
          "Responsabilidad externa de la empresa",
          "企业的外部责任"
        ),
        description: loc(
          "We partner closely with growers and wholesalers — delivering reliable products, local support, and long-term value in every market.",
          "Trabalhamos lado a lado com produtores e atacadistas — entregando produtos confiáveis, suporte local e valor de longo prazo em cada mercado.",
          "Colaboramos de cerca con productores y mayoristas — entregando productos fiables, soporte local y valor a largo plazo en cada mercado.",
          "我们与种植者及批发商紧密合作——在每个市场提供可靠产品、本地支持与长期价值。"
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
      },
      {
        id: "social",
        title: loc(
          "Social responsibility",
          "Responsabilidade social",
          "Responsabilidad social",
          "社会责任"
        ),
        description: loc(
          "We act with respect for communities and the environment — advancing sustainable practices and shared progress wherever we operate.",
          "Agimos com respeito às comunidades e ao meio ambiente — promovendo práticas sustentáveis e progresso compartilhado onde atuamos.",
          "Actuamos con respeto por las comunidades y el medio ambiente — impulsando prácticas sostenibles y progreso compartido donde operamos.",
          "我们尊重社区与环境——在业务所在地推进可持续实践与共同进步。"
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
      },
    ],
  },
  honors: {
    title: loc(
      "Honor & certification",
      "Honor & certification",
      "Honor & certification",
      "荣誉与认证"
    ),
    items: [
      { id: "brcgs", name: "BRCGS", image: "/assets/homepage/cert-brcgs.png" },
      { id: "sedex", name: "Sedex", image: "/assets/homepage/cert-sedex.png" },
      { id: "smeta", name: "SMETA", image: "/assets/homepage/cert-smeta.png" },
      {
        id: "grs",
        name: "Global Recycled Standard",
        image: "/assets/homepage/cert-grs.png",
      },
      { id: "iso", name: "ISO", image: "/assets/homepage/cert-iso.png" },
    ],
  },
  updatedAt: new Date().toISOString(),
});

let cache: AboutPageSettings | null = null;
const CONTENT_REVISION = 5;
let cacheRevision = 0;

export function getAboutPageSettings(): AboutPageSettings {
  if (!cache || cacheRevision !== CONTENT_REVISION) {
    cache = defaultSettings();
    cacheRevision = CONTENT_REVISION;
  }
  return cache;
}

export function saveAboutPageSettings(
  settings: AboutPageSettings
): AboutPageSettings {
  const updated = { ...settings, updatedAt: new Date().toISOString() };
  cache = updated;
  return updated;
}

export function resetAboutPageSettings(): AboutPageSettings {
  cache = defaultSettings();
  return cache;
}
