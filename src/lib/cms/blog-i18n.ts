import type { LocalizedString } from "@/lib/cms/types";
import { homeLoc } from "@/lib/cms/homepage-i18n";

export type BlogSeedCopy = {
  title: LocalizedString;
  excerpt: LocalizedString;
};

export const BLOG_SEED_I18N: Record<string, BlogSeedCopy> = {
  post1: {
    title: homeLoc(
      "2025 Exhibition Overview: OBOYA Invites You to Join Us at Major Industry Events",
      "Visão Geral das Exposições 2025: A OBOYA Convida Você a Nos Encontrar nos Principais Eventos do Setor",
      "Panorama de Exposiciones 2025: OBOYA le invita a acompañarnos en los principales eventos del sector",
      "2025 展会概览：OBOYA 诚邀您参加行业重要活动"
    ),
    excerpt: homeLoc(
      "Discover where to meet the Oboya team at leading horticulture exhibitions worldwide.",
      "Descubra onde encontrar a equipe Oboya nas principais feiras de horticultura do mundo.",
      "Descubra dónde encontrar al equipo de Oboya en las principales ferias de horticultura del mundo.",
      "了解在全球领先园艺展会上与 Oboya 团队会面的地点。"
    ),
  },
  post2: {
    title: homeLoc(
      "Sustainable packaging trends in fresh produce",
      "Tendências de embalagem sustentável em produtos frescos",
      "Tendencias de empaque sostenible en productos frescos",
      "生鲜产品可持续包装趋势"
    ),
    excerpt: homeLoc(
      "How retailers and growers are aligning packaging with circular economy goals.",
      "Como varejistas e produtores alinham embalagens aos objetivos da economia circular.",
      "Cómo minoristas y productores alinean el empaque con los objetivos de la economía circular.",
      "零售商与种植者如何将包装与循环经济目标相结合。"
    ),
  },
  post3: {
    title: homeLoc(
      "Greenhouse innovation in 2026",
      "Inovação em estufas em 2026",
      "Innovación en invernaderos en 2026",
      "2026 温室创新"
    ),
    excerpt: homeLoc(
      "Climate control, substrates, and logistics are converging in modern greenhouse design.",
      "Controle climático, substratos e logística convergem no design moderno de estufas.",
      "El control climático, los sustratos y la logística convergen en el diseño moderno de invernaderos.",
      "气候控制、基质与物流在现代温室设计中日益融合。"
    ),
  },
  post4: {
    title: homeLoc(
      "Berry category growth in retail",
      "Crescimento da categoria de frutas vermelhas no varejo",
      "Crecimiento de la categoría de berries en retail",
      "零售浆果品类增长"
    ),
    excerpt: homeLoc(
      "Packaging and display solutions supporting premium berry programs.",
      "Soluções de embalagem e exposição que apoiam programas premium de frutas vermelhas.",
      "Soluciones de empaque y exhibición que respaldan programas premium de berries.",
      "支持高端浆果项目的包装与陈列解决方案。"
    ),
  },
  post5: {
    title: homeLoc(
      "Expanding our footprint in Asia-Pacific markets",
      "Expandindo nossa presença nos mercados da Ásia-Pacífico",
      "Ampliando nuestra presencia en los mercados de Asia-Pacífico",
      "拓展亚太市场布局"
    ),
    excerpt: homeLoc(
      "New distribution partnerships strengthen local support across the region.",
      "Novas parcerias de distribuição fortalecem o suporte local em toda a região.",
      "Nuevas alianzas de distribución fortalecen el soporte local en toda la región.",
      "新的分销合作伙伴关系加强整个区域的本地支持。"
    ),
  },
  post6: {
    title: homeLoc(
      "Next-generation greenhouse technology for sustainable production",
      "Tecnologia de estufa de nova geração para produção sustentável",
      "Tecnología de invernadero de nueva generación para una producción sostenible",
      "新一代温室技术实现可持续生产"
    ),
    excerpt: homeLoc(
      "Integrated systems helping growers optimize yield and resource efficiency.",
      "Sistemas integrados que ajudam produtores a otimizar rendimento e eficiência de recursos.",
      "Sistemas integrados que ayudan a los productores a optimizar el rendimiento y la eficiencia de recursos.",
      "帮助种植者优化产量与资源效率的一体化系统。"
    ),
  },
  post7: {
    title: homeLoc(
      "Circular packaging program launches in Europe",
      "Programa de embalagem circular é lançado na Europa",
      "Se lanza en Europa un programa de empaque circular",
      "循环包装计划在欧洲启动"
    ),
    excerpt: homeLoc(
      "Recyclable formats piloted with retail partners across key markets.",
      "Formatos recicláveis testados com parceiros de varejo em mercados-chave.",
      "Formatos reciclables probados con socios minoristas en mercados clave.",
      "在关键市场与零售合作伙伴试点可回收包装形式。"
    ),
  },
  post8: {
    title: homeLoc(
      "Retail display innovation for premium produce",
      "Inovação em exposição no varejo para produtos premium",
      "Innovación en exhibición retail para productos premium",
      "高端农产品零售陈列创新"
    ),
    excerpt: homeLoc(
      "New trolley and packaging concepts improve shelf visibility and handling.",
      "Novos conceitos de carrinhos e embalagens melhoram visibilidade na gôndola e manuseio.",
      "Nuevos conceptos de carros y empaques mejoran la visibilidad en góndola y la manipulación.",
      "新型推车与包装概念提升货架可见度与搬运效率。"
    ),
  },
  post9: {
    title: homeLoc(
      "Global partner summit highlights integrated solutions",
      "Cúpula global de parceiros destaca soluções integradas",
      "La cumbre global de socios destaca soluciones integradas",
      "全球合作伙伴峰会聚焦一体化解决方案"
    ),
    excerpt: homeLoc(
      "Growers and distributors explore end-to-end horticulture systems.",
      "Produtores e distribuidores exploram sistemas hortícolas de ponta a ponta.",
      "Productores y distribuidores exploran sistemas hortícolas integrales.",
      "种植者与分销商探索端到端园艺系统。"
    ),
  },
};
