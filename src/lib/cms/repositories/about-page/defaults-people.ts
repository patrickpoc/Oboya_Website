import type { AboutPageSettings } from "@/lib/cms/repositories/about-page/types";
import { loc } from "@/lib/cms/repositories/about-page/locale";

export function defaultPeople(): AboutPageSettings["people"] {
  return {
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
          "Diretor-executivo",
          "Director ejecutivo",
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
          "Diretor de operações",
          "Director de operaciones",
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
          "Diretor comercial",
          "Director comercial",
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
          "Diretor da Ásia-Pacífico",
          "Director de Asia-Pacífico",
          "亚太区负责人"
        ),
        image:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800&auto=format&fit=crop",
      },
    ],
  };
}
