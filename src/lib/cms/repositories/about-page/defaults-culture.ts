import type { AboutPageSettings } from "@/lib/cms/repositories/about-page/types";
import { loc } from "@/lib/cms/repositories/about-page/locale";

export function defaultCulture(): AboutPageSettings["culture"] {
  return {
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
          "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1400&auto=format&fit=crop",
        imageAlt: loc(
          "Horticulture facility with fields and production buildings",
          "Instalação hortícola com campos e prédios de produção",
          "Instalación hortícola con campos y edificios de producción",
          "带田地与生产建筑的园艺设施"
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
  };
}
