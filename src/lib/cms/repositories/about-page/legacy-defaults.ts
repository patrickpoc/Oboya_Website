import type { LocalizedString } from "@/lib/cms/types";
import { loc } from "@/lib/cms/repositories/about-page/locale";

/** Previous default institutional photo; stored docs still pointing at it get the new one. */
export const LEGACY_INSTITUTIONAL_IMAGE_SRC = "/assets/about/institutional.png";

/** Previous default About copy; stored docs matching it exactly are upgraded. */
export const LEGACY_MISSION_BODY = loc(
  "Oboya Horticulture is committed to delivering integrated one-stop solutions that help growers, packers, and wholesalers achieve quality, efficiency, and sustainable growth across the horticultural supply chain.",
  "A Oboya Horticulture se compromete a entregar soluções one-stop integradas que ajudam produtores, embaladores e atacadistas a alcançar qualidade, eficiência e crescimento sustentável em toda a cadeia hortícola.",
  "Oboya Horticulture se compromete a entregar soluciones one-stop integradas que ayudan a productores, empaquetadores y mayoristas a lograr calidad, eficiencia y crecimiento sostenible en toda la cadena hortícola.",
  "Oboya Horticulture 致力于提供一体化一站式解决方案，帮助种植者、包装商与批发商在整个园艺供应链中实现质量、效率与可持续增长。"
);

export const LEGACY_VISION_BODY = loc(
  "To be the most trusted integrated horticulture partner worldwide — connecting global manufacturing strength with local expertise so every customer can grow with confidence.",
  "Ser o parceiro integrado de horticultura mais confiável do mundo — unindo força de manufatura global à expertise local para que cada cliente cresça com confiança.",
  "Ser el socio hortícola integrado más confiable del mundo — uniendo la fuerza manufacturera global con la experiencia local para que cada cliente crezca con confianza.",
  "成为全球最受信赖的一体化园艺合作伙伴——将全球制造实力与本地专长相结合，让每位客户都能自信成长。"
);

export const LEGACY_VALUES: {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
}[] = [
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
    title: loc("Responsibility", "Responsabilidade", "Responsabilidad", "责任"),
    description: loc(
      "We act with respect for people, communities, and the environment across every market we serve.",
      "Agimos com respeito às pessoas, comunidades e ao meio ambiente em cada mercado que atendemos.",
      "Actuamos con respeto por las personas, las comunidades y el medio ambiente en cada mercado que servimos.",
      "我们在所服务的每个市场中尊重人、社区与环境。"
    ),
  },
];

const LOCALES = ["en", "pt-BR", "es", "zh-CN"] as const;

export function sameLocalized(
  a: Partial<LocalizedString> | undefined,
  b: LocalizedString
): boolean {
  return !!a && LOCALES.every((l) => a[l] === b[l]);
}

/** The removed "Clients Served" stat is dropped only while still at its old default. */
export function isLegacyClientsStat(stat: { id?: string; value?: unknown; suffix?: string }): boolean {
  return stat?.id === "clients" && stat.value === 1 && stat.suffix === "m+";
}
