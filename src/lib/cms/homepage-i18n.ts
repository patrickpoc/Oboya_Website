import type { LocalizedString } from "@/lib/cms/types";

export function homeLoc(
  en: string,
  ptBR: string,
  es: string,
  zhCN: string
): LocalizedString {
  return { en, "pt-BR": ptBR, es, "zh-CN": zhCN };
}

export const HOME_I18N = {
  hero: {
    eyebrow: homeLoc(
      "Solutions that work, value that grows.",
      "Soluções que funcionam, valor que cresce.",
      "Soluciones que funcionan, valor que crece.",
      "行之有效的解决方案，持续增长的价值。"
    ),
    title: homeLoc(
      "Your one-stop partner for horticulture",
      "Seu parceiro completo em horticultura",
      "Su socio integral en horticultura",
      "您的一站式园艺合作伙伴"
    ),
    description: homeLoc(
      "Helping Horticulture Perform Better.\nFrom propagation to point of sale, Oboya helps growers and partners improve performance, protect quality, and strengthen supply chains — with global capability and local support.",
      "Ajudando a horticultura a ir mais longe.\nDa propagação ao ponto de venda, a Oboya ajuda produtores e parceiros a melhorar o desempenho, proteger a qualidade e fortalecer as cadeias de suprimento — com capacidade global e suporte local.",
      "Impulsando un mejor rendimiento en horticultura.\nDesde la propagación hasta el punto de venta, Oboya ayuda a productores y socios a mejorar el rendimiento, proteger la calidad y fortalecer las cadenas de suministro — con capacidad global y soporte local.",
      "助力园艺行业卓越发展。\n从育苗到零售终端，Oboya 帮助种植者与合作伙伴提升绩效、保障品质并强化供应链——兼具全球实力与本地支持。"
    ),
    ctaPrimary: homeLoc(
      "Request a quote",
      "Solicitar orçamento",
      "Solicitar presupuesto",
      "索取报价"
    ),
    ctaSecondary: homeLoc(
      "Explore solutions",
      "Explorar soluções",
      "Explorar soluciones",
      "探索解决方案"
    ),
  },
  companyOverview: {
    headlineGreen: homeLoc(
      "Delivering solutions to horticultural businesses",
      "Entregando soluções para empresas hortícolas",
      "Ofreciendo soluciones a empresas hortícolas",
      "为园艺企业提供解决方案"
    ),
    headlineWhite: homeLoc(
      "around the world through a combination of global capabilities and local expertise.",
      "em todo o mundo por meio da combinação de capacidades globais e expertise local.",
      "en todo el mundo mediante una combinación de capacidades globales y experiencia local.",
      "凭借全球实力与本地专业经验的结合，服务世界各地。"
    ),
    segmentGreen: homeLoc(
      "Delivering solutions to horticultural businesses",
      "Entregando soluções para empresas hortícolas",
      "Ofreciendo soluciones a empresas hortícolas",
      "为园艺企业提供解决方案"
    ),
    segmentWhite: homeLoc(
      " around the world through a combination of global capabilities and local expertise.",
      " em todo o mundo por meio da combinação de capacidades globais e expertise local.",
      " en todo el mundo mediante una combinación de capacidades globales y experiencia local.",
      " 凭借全球实力与本地专业经验的结合，服务世界各地。"
    ),
    imageAlt: homeLoc(
      "Workers in a modern greenhouse facility",
      "Trabalhadores em uma estufa moderna",
      "Trabajadores en un invernadero moderno",
      "现代化温室设施中的工作人员"
    ),
    statEmployees: homeLoc(
      "Employees Across Global Operations",
      "Colaboradores em operações globais",
      "Empleados en operaciones globales",
      "全球运营员工"
    ),
    statCountries: homeLoc(
      "Countries Served Worldwide",
      "Países atendidos no mundo",
      "Países atendidos en todo el mundo",
      "服务国家"
    ),
    statExperience: homeLoc(
      "Years Supporting Horticulture",
      "Anos apoiando a horticultura",
      "Años apoyando la horticultura",
      "服务园艺行业年限"
    ),
  },
  capabilities: {
    eyebrow: homeLoc(
      "Why Oboya Horticulture?",
      "Por que a Oboya Horticulture?",
      "¿Por qué Oboya Horticulture?",
      "为什么选择 Oboya Horticulture？"
    ),
    title: homeLoc(
      "Stories and strengths that define how we partner with growers worldwide.",
      "Histórias e fortalezas que definem como nos associamos a produtores no mundo todo.",
      "Historias y fortalezas que definen cómo colaboramos con productores en todo el mundo.",
      "彰显我们如何与全球种植者合作的实力与故事。"
    ),
    ctaLabel: homeLoc("Learn more", "Saiba mais", "Saber más", "了解更多"),
    item1Title: homeLoc(
      "One Partner Across the Entire Value Chain",
      "Um parceiro em toda a cadeia de valor",
      "Un socio en toda la cadena de valor",
      "覆盖全价值链的单一合作伙伴"
    ),
    item1Desc: homeLoc(
      "From cultivation to commercialization, we help businesses improve performance, protect quality, and stay competitive across every stage of their operation.",
      "Do cultivo à comercialização, ajudamos empresas a melhorar o desempenho, proteger a qualidade e manter a competitividade em cada etapa da operação.",
      "Desde el cultivo hasta la comercialización, ayudamos a las empresas a mejorar el rendimiento, proteger la calidad y mantener la competitividad en cada etapa de su operación.",
      "从种植到销售，我们帮助企业在运营的每个阶段提升绩效、保障品质并保持竞争力。"
    ),
    item2Title: homeLoc(
      "Global Capabilities. Local Understanding.",
      "Capacidade global. Entendimento local.",
      "Capacidades globales. Comprensión local.",
      "全球实力，本地洞察"
    ),
    item2Desc: homeLoc(
      "A global network backed by international manufacturing, product development, and sourcing capabilities — with local responsiveness and deep horticulture expertise.",
      "Uma rede global respaldada por manufatura internacional, desenvolvimento de produtos e capacidades de sourcing — com resposta local e profunda expertise em horticultura.",
      "Una red global respaldada por fabricación internacional, desarrollo de productos y capacidades de abastecimiento — con respuesta local y profunda experiencia en horticultura.",
      "依托国际制造、产品开发与采购能力的全球网络——兼具本地响应速度与深厚的园艺专业经验。"
    ),
    item3Title: homeLoc(
      "Partnerships Built for the Long Term",
      "Parcerias construídas para o longo prazo",
      "Alianzas construidas a largo plazo",
      "着眼长远的合作伙伴关系"
    ),
    item3Desc: homeLoc(
      "Working alongside customers over time to support growth, adaptation, and lasting business performance.",
      "Trabalhando ao lado dos clientes ao longo do tempo para apoiar crescimento, adaptação e desempenho duradouro.",
      "Trabajando junto a los clientes a lo largo del tiempo para apoyar el crecimiento, la adaptación y un rendimiento empresarial duradero.",
      "长期与客户并肩同行，支持成长、适应与可持续的业务表现。"
    ),
  },
  businessSolutions: {
    eyebrow: homeLoc(
      "Solutions Built Around Your Business",
      "Soluções pensadas para o seu negócio",
      "Soluciones diseñadas para su negocio",
      "围绕您的业务打造的解决方案"
    ),
    title: homeLoc(
      "Every crop, operation, and supply chain has unique requirements — explore the solutions, expertise, and support designed for your sector.",
      "Cada cultura, operação e cadeia de suprimentos tem requisitos únicos — explore as soluções, expertise e suporte pensados para o seu setor.",
      "Cada cultivo, operación y cadena de suministro tiene requisitos únicos — explore las soluciones, la experiencia y el soporte diseñados para su sector.",
      "每种作物、运营和供应链都有独特需求——探索为您的领域量身打造的解决方案、专业实力与支持。"
    ),
    cta: homeLoc(
      "Explore Solutions",
      "Explorar soluções",
      "Explorar soluciones",
      "探索解决方案"
    ),
    flowersTitle: homeLoc("Flowers", "Flores", "Flores", "花卉"),
    flowersDesc: homeLoc(
      "End-to-end solutions for floriculture operations — from propagation and packaging through to retail.",
      "Soluções completas para floricultura — da propagação e embalagem até o varejo.",
      "Soluciones integrales para floricultura — desde la propagación y el empaque hasta el retail.",
      "花卉种植端到端解决方案——从育苗、包装到零售。"
    ),
    vegetablesTitle: homeLoc(
      "Vegetables & Herbs",
      "Vegetais e Ervas",
      "Vegetales y Hierbas",
      "蔬菜与香草"
    ),
    vegetablesDesc: homeLoc(
      "Integrated solutions that support efficient production, handling, packaging, and commercialization.",
      "Soluções integradas que apoiam produção, manuseio, embalagem e comercialização eficientes.",
      "Soluciones integradas que apoyan una producción, manipulación, empaque y comercialización eficientes.",
      "支持高效生产、搬运、包装与销售的一体化解决方案。"
    ),
    fruitsTitle: homeLoc("Fruits", "Frutas", "Frutas", "水果"),
    fruitsDesc: homeLoc(
      "Solutions that optimize cultivation, handling, packaging, and distribution across the fruit supply chain.",
      "Soluções que otimizam cultivo, manuseio, embalagem e distribuição em toda a cadeia de frutas.",
      "Soluciones que optimizan el cultivo, manipulación, empaque y distribución en toda la cadena de frutas.",
      "优化水果供应链种植、搬运、包装与配送的解决方案。"
    ),
    logisticsTitle: homeLoc(
      "Logistics & Display",
      "Logística e Exposição",
      "Logística y Exhibición",
      "物流与陈列"
    ),
    logisticsDesc: homeLoc(
      "Systems that improve product movement, merchandising, and point-of-sale presentation.",
      "Sistemas que melhoram o movimento do produto, o merchandising e a apresentação no ponto de venda.",
      "Sistemas que mejoran el movimiento del producto, el merchandising y la presentación en el punto de venta.",
      "改善产品流转、陈列营销与终端展示的系统。"
    ),
    machineryTitle: homeLoc(
      "Machinery & Automation",
      "Maquinário e Automação",
      "Maquinaria y Automatización",
      "机械与自动化"
    ),
    machineryDesc: homeLoc(
      "Technology that increases efficiency, consistency, and scalability as operations grow.",
      "Tecnologia que aumenta eficiência, consistência e escalabilidade conforme as operações crescem.",
      "Tecnología que aumenta la eficiencia, la consistencia y la escalabilidad a medida que crecen las operaciones.",
      "随运营规模增长提升效率、一致性与可扩展性的技术。"
    ),
  },
  globalPresence: {
    title: homeLoc(
      "We operate in 25 countries, with production hubs in Asia, South America and Europe, as well as support teams worldwide.",
      "Atuamos em 25 países, com centros de produção na Ásia, América do Sul e Europa, além de equipes de suporte em todo o mundo.",
      "Operamos en 25 países, con centros de producción en Asia, América del Sur y Europa, además de equipos de soporte en todo el mundo.",
      "我们在 25 个国家开展业务，在亚洲、南美洲和欧洲设有生产中心，并在全球配备支持团队。"
    ),
  },
  testimonials: {
    eyebrow: homeLoc(
      "Testimonials",
      "Depoimentos",
      "Testimonios",
      "客户评价"
    ),
    t1Quote: homeLoc(
      "Oboya helped us unify packaging and logistics across our greenhouse network. Delivery reliability improved within the first season.",
      "A Oboya nos ajudou a unificar embalagem e logística em nossa rede de estufas. A confiabilidade das entregas melhorou já na primeira safra.",
      "Oboya nos ayudó a unificar el empaque y la logística en nuestra red de invernaderos. La confiabilidad de las entregas mejoró en la primera temporada.",
      "Oboya 帮助我们统一了温室网络的包装与物流，交付可靠性在首个产季就得到提升。"
    ),
    t1Author: homeLoc("Maria Jensen", "Maria Jensen", "Maria Jensen", "Maria Jensen"),
    t1Role: homeLoc("Nordic Growers", "Nordic Growers", "Nordic Growers", "Nordic Growers"),
    t2Quote: homeLoc(
      "Their local teams understood our retail requirements and delivered display solutions that lifted shelf presence without slowing operations.",
      "As equipes locais entenderam nossas exigências de varejo e entregaram soluções de exposição que elevaram a presença na gôndola sem desacelerar as operações.",
      "Sus equipos locales comprendieron nuestros requisitos de retail y entregaron soluciones de exhibición que mejoraron la presencia en góndola sin frenar las operaciones.",
      "本地团队理解我们的零售需求，提供的陈列解决方案提升了货架表现力，同时不影响运营效率。"
    ),
    t2Author: homeLoc("Carlos Mendes", "Carlos Mendes", "Carlos Mendes", "Carlos Mendes"),
    t2Role: homeLoc("Fresh Retail Group", "Fresh Retail Group", "Fresh Retail Group", "Fresh Retail Group"),
    t3Quote: homeLoc(
      "From substrates to retail-ready packaging, Oboya has become a long-term partner for our berry programs across Asia Pacific.",
      "De substratos a embalagens prontas para o varejo, a Oboya tornou-se parceira de longo prazo dos nossos programas de frutas vermelhas na Ásia-Pacífico.",
      "Desde sustratos hasta empaques listos para retail, Oboya se ha convertido en un socio a largo plazo para nuestros programas de berries en Asia-Pacífico.",
      "从基质到零售级包装，Oboya 已成为我们在亚太浆果项目的长期合作伙伴。"
    ),
    t3Author: homeLoc("Li Wei", "Li Wei", "Li Wei", "李伟"),
    t3Role: homeLoc(
      "Asia Pacific Berries",
      "Asia Pacific Berries",
      "Asia Pacific Berries",
      "亚太浆果"
    ),
    t4Quote: homeLoc(
      "We needed one partner for cultivation support and outbound logistics. Oboya connected both ends of the chain with clear accountability.",
      "Precisávamos de um parceiro para apoio ao cultivo e logística de saída. A Oboya conectou as duas pontas da cadeia com responsabilidade clara.",
      "Necesitábamos un socio para el apoyo al cultivo y la logística de salida. Oboya conectó ambos extremos de la cadena con una responsabilidad clara.",
      "我们需要一个合作伙伴同时支持种植与 outbound 物流。Oboya 以清晰的责任衔接了链条两端。"
    ),
    t4Author: homeLoc("Elena Rossi", "Elena Rossi", "Elena Rossi", "Elena Rossi"),
    t4Role: homeLoc(
      "MediFlora Cooperative",
      "Cooperativa MediFlora",
      "Cooperativa MediFlora",
      "MediFlora 合作社"
    ),
    t5Quote: homeLoc(
      "Scale and local expertise rarely come together. With Oboya, we get global manufacturing strength and on-the-ground support where we grow.",
      "Escala e expertise local raramente se encontram. Com a Oboya, temos força de manufatura global e suporte no campo onde cultivamos.",
      "La escala y la experiencia local rara vez se combinan. Con Oboya, obtenemos fuerza de fabricación global y soporte en el terreno donde cultivamos.",
      "规模与本地经验难得兼备。与 Oboya 合作，我们既有全球制造实力，也有种植所在地的现场支持。"
    ),
    t5Author: homeLoc("James Okonkwo", "James Okonkwo", "James Okonkwo", "James Okonkwo"),
    t5Role: homeLoc(
      "GreenHorizon Farms",
      "GreenHorizon Farms",
      "GreenHorizon Farms",
      "GreenHorizon Farms"
    ),
    t6Quote: homeLoc(
      "Switching to Oboya's integrated solutions cut complexity for our growers and gave our buyers a more consistent product experience.",
      "A mudança para as soluções integradas da Oboya reduziu a complexidade para nossos produtores e deu aos compradores uma experiência de produto mais consistente.",
      "El cambio a las soluciones integradas de Oboya redujo la complejidad para nuestros productores y ofreció a los compradores una experiencia de producto más consistente.",
      "转向 Oboya 一体化解决方案降低了种植者的复杂度，并为采购方带来更一致的产品体验。"
    ),
    t6Author: homeLoc("Sophie Dubois", "Sophie Dubois", "Sophie Dubois", "Sophie Dubois"),
    t6Role: homeLoc(
      "EuroFresh Alliance",
      "EuroFresh Alliance",
      "EuroFresh Alliance",
      "EuroFresh Alliance"
    ),
  },
  latestNews: {
    eyebrow: homeLoc("Latest News", "Últimas Notícias", "Últimas Noticias", "最新资讯"),
    headline: homeLoc(
      "Learn more about our latest developments and stories from the field in our Latest News section.",
      "Saiba mais sobre nossos últimos desenvolvimentos e histórias do campo na seção Últimas Notícias.",
      "Conozca más sobre nuestros últimos desarrollos e historias del campo en la sección Últimas Noticias.",
      "在我们的最新资讯栏目中，了解更多最新动态与一线故事。"
    ),
  },
  partners: {
    title: homeLoc(
      "Our collaborations",
      "Nossas colaborações",
      "Nuestras colaboraciones",
      "我们的合作伙伴"
    ),
  },
} as const;
