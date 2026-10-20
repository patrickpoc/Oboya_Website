import type { AboutPageSettings } from "@/lib/cms/repositories/about-page/types";
import { loc } from "@/lib/cms/repositories/about-page/locale";

export function defaultIntro(): Pick<AboutPageSettings, "sections" | "meta" | "hero" | "institutionalImage" | "timeline"> {
  return {
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
  };
}
