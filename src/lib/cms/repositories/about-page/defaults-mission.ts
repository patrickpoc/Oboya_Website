import type { AboutPageSettings } from "@/lib/cms/repositories/about-page/types";
import { loc } from "@/lib/cms/repositories/about-page/locale";

export function defaultMission(): AboutPageSettings["mission"] {
  return {
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
  };
}

export function defaultVision(): AboutPageSettings["vision"] {
  return {
    title: loc("Vision", "Visão", "Visión", "愿景"),
    body: loc(
      "To be the most trusted integrated horticulture partner worldwide — connecting global manufacturing strength with local expertise so every customer can grow with confidence.",
      "Ser o parceiro integrado de horticultura mais confiável do mundo — unindo força de manufatura global à expertise local para que cada cliente cresça com confiança.",
      "Ser el socio hortícola integrado más confiable del mundo — uniendo la fuerza manufacturera global con la experiencia local para que cada cliente crezca con confianza.",
      "成为全球最受信赖的一体化园艺合作伙伴——将全球制造实力与本地专长相结合，让每位客户都能自信成长。"
    ),
    images: [
      {
        src: "/assets/homepage/capabilities-global-local.jpg",
        alt: loc(
          "Global horticulture network connecting partners across regions",
          "Rede global de horticultura conectando parceiros entre regiões",
          "Red hortícola global que conecta socios entre regiones",
          "连接各地区合作伙伴的全球园艺网络"
        ),
      },
      {
        src: "/assets/homepage/greenhouse-technology.webp",
        alt: loc(
          "Young plants growing in a modern greenhouse",
          "Plantas jovens crescendo em estufa moderna",
          "Plantas jóvenes creciendo en un invernadero moderno",
          "现代化温室中生长的幼苗"
        ),
      },
    ],
  };
}

export function defaultValues(): AboutPageSettings["values"] {
  return {
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
  };
}

export function defaultHonors(): AboutPageSettings["honors"] {
  return {
    title: loc(
      "Honor & Certification",
      "Honrarias e certificações",
      "Honores y certificaciones",
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
  };
}
