import type { AboutPageSettings } from "@/lib/cms/repositories/about-page/types";
import { loc } from "@/lib/cms/repositories/about-page/locale";

export function defaultMission(): AboutPageSettings["mission"] {
  return {
    title: loc("Mission", "Missão", "Misión", "使命"),
    body: loc(
      "Deliver innovative, practical and efficient solutions across the horticultural supply chain. Empowering our customers, partners and the community.",
      "Oferecer soluções inovadoras, práticas e eficientes em toda a cadeia de suprimentos da horticultura, fortalecendo nossos clientes, parceiros e a comunidade.",
      "Ofrecer soluciones innovadoras, prácticas y eficientes en toda la cadena de suministro hortícola, impulsando a nuestros clientes, socios y a la comunidad.",
      "为园艺供应链各环节提供创新、实用、高效的解决方案，赋能客户、合作伙伴与社区。"
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
      "To be the most trusted global partner across the horticultural value chain, and contribute to the global transition toward a greener, more resilient horticultural future.",
      "Ser o parceiro global mais confiável da cadeia de valor da horticultura e contribuir para a transição global rumo a um futuro hortícola mais verde e resiliente.",
      "Ser el socio global más confiable de la cadena de valor hortícola y contribuir a la transición global hacia un futuro hortícola más verde y resiliente.",
      "成为园艺价值链中最值得信赖的全球合作伙伴，并推动全球园艺向更绿色、更具韧性的未来转型。"
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

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?q=80&w=1400&auto=format&fit=crop`;

export function defaultValues(): AboutPageSettings["values"] {
  return {
    title: loc("Values", "Valores", "Valores", "价值观"),
    items: [
      {
        id: "innovation",
        title: loc("Innovation", "Inovação", "Innovación", "创新"),
        description: loc("Practical solutions for real challenges.", "Soluções práticas para desafios reais.", "Soluciones prácticas para desafíos reales.", "以实用方案应对真实挑战。"),
        image: {
          src: UNSPLASH("photo-1581578731548-c64695cc6952"),
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
        id: "glocal",
        title: loc("“Glocal” Approach", "Abordagem “Glocal”", "Enfoque “Glocal”", "“Glocal”理念"),
        description: loc("Worldwide expertise with local support.", "Expertise global com suporte local.", "Experiencia global con apoyo local.", "全球专业经验，本地化支持。"),
        image: {
          src: "/assets/homepage/capabilities-global-local.jpg",
          alt: loc(
            "Global horticulture network connecting partners across regions",
            "Rede global de horticultura conectando parceiros entre regiões",
            "Red hortícola global que conecta socios entre regiones",
            "连接各地区合作伙伴的全球园艺网络"
          ),
        },
        objectPosition: "center center",
      },
      {
        id: "quality",
        title: loc("Quality", "Qualidade", "Calidad", "品质"),
        description: loc("Reliable, certified excellence.", "Excelência confiável e certificada.", "Excelencia confiable y certificada.", "可靠、经认证的卓越品质。"),
        image: {
          src: "/assets/homepage/solutions-integrated.jpg",
          alt: loc(
            "Integrated horticulture solutions and quality processes",
            "Soluções integradas de horticultura e processos de qualidade",
            "Soluciones hortícolas integradas y procesos de calidad",
            "一体化园艺解决方案与质量流程"
          ),
        },
        objectPosition: "center center",
      },
      {
        id: "sustainability",
        title: loc("Sustainability", "Sustentabilidade", "Sostenibilidad", "可持续发展"),
        description: loc(
          "Environmentally oriented solutions that protect resources and people.",
          "Soluções com foco ambiental que protegem recursos e pessoas.",
          "Soluciones con enfoque ambiental que protegen los recursos y a las personas.",
          "注重环保的解决方案，保护资源与人。"
        ),
        image: {
          src: UNSPLASH("photo-1470058869958-2a77ade41c02"),
          alt: loc(
            "Lush green plants growing in a sustainable environment",
            "Plantas verdes exuberantes crescendo em ambiente sustentável",
            "Plantas verdes exuberantes creciendo en un entorno sostenible",
            "可持续环境中茂盛生长的绿色植物"
          ),
        },
        objectPosition: "center 40%",
      },
      {
        id: "integrity",
        title: loc("Integrity", "Integridade", "Integridad", "诚信"),
        description: loc("Honest, respectful and accountable.", "Honestidade, respeito e responsabilidade.", "Honestidad, respeto y responsabilidad.", "诚实、尊重、负责。"),
        image: {
          src: UNSPLASH("photo-1521791136064-7986c2920216"),
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
        id: "collaboration",
        title: loc("Collaboration", "Colaboração", "Colaboración", "协作"),
        description: loc("Growing together with people and partners.", "Crescendo juntos com pessoas e parceiros.", "Creciendo juntos con personas y socios.", "与员工和伙伴共同成长。"),
        image: {
          src: "/assets/homepage/capabilities-partnerships.jpg",
          alt: loc(
            "Partners collaborating across the horticultural supply chain",
            "Parceiros colaborando em toda a cadeia hortícola",
            "Socios colaborando en toda la cadena hortícola",
            "合作伙伴在整个园艺供应链中协作"
          ),
        },
        objectPosition: "center center",
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
