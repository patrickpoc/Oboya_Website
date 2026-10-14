import type { CmsStatus, LocalizedString, SeoFields } from "@/lib/cms/types";
import { caseStudies } from "@/constants/content-data";

export type CaseStudyRegion = "europe" | "americas" | "asia" | "other";

export interface CmsCaseStudyTestimonial {
  quote: LocalizedString;
  author: string;
  company: string;
}

export interface CmsCaseStudy {
  id: string;
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  /** Short outcome metric shown on cards, e.g. "−18% handling time" */
  metric: LocalizedString;
  challenge: LocalizedString;
  solution: LocalizedString;
  implementation: LocalizedString;
  results: LocalizedString;
  client: string;
  timeline: LocalizedString;
  industry: string;
  country: string;
  region: CaseStudyRegion;
  segment: string;
  coverImage: string;
  images: string[];
  gallery: string[];
  downloads: { title: string; url: string }[];
  testimonial: CmsCaseStudyTestimonial;
  status: CmsStatus;
  seo: SeoFields;
  createdAt: string;
  updatedAt: string;
}

const emptyLoc = (): LocalizedString => ({
  en: "",
  "pt-BR": "",
  es: "",
  "zh-CN": "",
});

const loc = (en: string, pt = en, es = en, zh = en): LocalizedString => ({
  en,
  "pt-BR": pt,
  es,
  "zh-CN": zh,
});

const emptyTestimonial = (): CmsCaseStudyTestimonial => ({
  quote: emptyLoc(),
  author: "",
  company: "",
});

type SeedEntry = {
  title: LocalizedString;
  excerpt: LocalizedString;
  metric: LocalizedString;
  challenge: LocalizedString;
  solution: LocalizedString;
  implementation: LocalizedString;
  results: LocalizedString;
  client: string;
  timeline: LocalizedString;
  coverImage: string;
  images: string[];
  region: CaseStudyRegion;
  testimonial: CmsCaseStudyTestimonial;
};

const seedContent: Record<string, SeedEntry> = {
  case1: {
    title: loc(
      "Automating Efficiency in Ornamental Horticulture",
      "Automação da eficiência na horticultura ornamental",
      "Automatización de la eficiencia en la horticultura ornamental",
      "用自动化提升观赏园艺效率"
    ),
    excerpt: loc(
      "LVG Plants relied on a manual pot plant wrapping process that was labor-intensive and limited how many plants could be prepared for dispatch each day.\n\nOboya Horticulture South Africa proposed an automatic wrapping solution with four machines, phased installation, and staff training through 2026.\n\nExpected outcomes include higher wrapping capacity, greater consistency, reduced labor dependency, and faster dispatch preparation.",
      "A LVG Plants dependia de um processo manual de envelopamento de vasos, intensivo em mão de obra e que limitava quantas plantas podiam ser preparadas para despacho por dia.\n\nA Oboya Horticulture África do Sul propôs uma solução automática com quatro máquinas, instalação em etapas e treinamento da equipe até 2026.\n\nOs resultados esperados incluem maior capacidade de envelopamento, mais consistência, menos dependência de mão de obra e preparação mais rápida para o despacho.",
      "LVG Plants dependía de un proceso manual de envoltura de plantas en maceta, intensivo en mano de obra y que limitaba cuántas plantas podían prepararse para despacho cada día.\n\nOboya Horticulture Sudáfrica propuso una solución automática con cuatro máquinas, instalación por etapas y capacitación del equipo hasta 2026.\n\nLos resultados esperados incluyen mayor capacidad de envoltura, más consistencia, menor dependencia de mano de obra y una preparación más rápida para el despacho.",
      "LVG Plants 依赖人工套盆流程，耗工大，限制了每天可备货发运的植株数量。\n\nOboya Horticulture 南非公司提出四台自动套袋设备的方案，分阶段安装，并在 2026 年前完成员工培训。\n\n预期成果包括更高的套袋产能、更稳定的一致性、更低的人工依赖，以及更快的发运准备。"
    ),
    metric: loc(
      "Higher wrapping capacity",
      "Maior capacidade de envelopamento",
      "Mayor capacidad de envoltura",
      "更高的套袋产能"
    ),
    challenge: loc(
      "LVG Plants relied on a manual wrapping process for pot plants. The process was labor-intensive, time-consuming, and limited how many plants could be prepared for dispatch each day.",
      "A LVG Plants dependia de um processo manual de envelopamento de vasos. O trabalho era intensivo, demorado e limitava quantas plantas podiam ser preparadas para despacho por dia.",
      "LVG Plants dependía de un proceso manual de envoltura de plantas en maceta. El trabajo era intensivo, lento y limitaba cuántas plantas podían prepararse para despacho cada día.",
      "LVG Plants 的盆栽套袋依赖人工。流程耗工、耗时，并限制了每天可备货发运的数量。"
    ),
    solution: loc(
      "Oboya Horticulture's South African branch proposed an automatic pot plant wrapping solution to improve speed, consistency, and operational efficiency. The project includes installing four wrapping machines, scheduled for completion by the end of 2026.",
      "A filial sul-africana da Oboya Horticulture propôs uma solução automática de envelopamento de vasos para ganhar velocidade, consistência e eficiência. O projeto inclui a instalação de quatro máquinas, com conclusão prevista até o fim de 2026.",
      "La filial sudafricana de Oboya Horticulture propuso una solución automática de envoltura de plantas en maceta para ganar velocidad, consistencia y eficiencia. El proyecto incluye instalar cuatro máquinas, con finalización prevista para fines de 2026.",
      "Oboya Horticulture 南非分公司提出自动盆栽套袋方案，以提升速度、一致性和运营效率。项目包括安装四台设备，计划于 2026 年底前完成。"
    ),
    implementation: loc(
      "The implementation plan includes phased installation, operational integration, and staff training to ensure seamless adoption.",
      "O plano de implementação inclui instalação em etapas, integração operacional e treinamento da equipe para uma adoção sem atrito.",
      "El plan de implementación incluye instalación por etapas, integración operativa y capacitación del equipo para una adopción sin fricciones.",
      "实施计划包括分阶段安装、运营整合和员工培训，以确保顺利采用。"
    ),
    results: loc(
      "Expected benefits include higher wrapping capacity, greater consistency, reduced labor dependency, lower packing costs, faster dispatch preparation, and increased operational efficiency.",
      "Os benefícios esperados incluem maior capacidade de envelopamento, mais consistência, menos dependência de mão de obra, menor custo de embalagem, preparação mais rápida para o despacho e mais eficiência operacional.",
      "Los beneficios esperados incluyen mayor capacidad de envoltura, más consistencia, menor dependencia de mano de obra, menor costo de empaque, preparación más rápida para el despacho y mayor eficiencia operativa.",
      "预期收益包括更高的套袋产能、更好的一致性、更低的人工依赖、更低的包装成本、更快的发运准备，以及更高的运营效率。"
    ),
    client: "LVG Plants",
    timeline: loc("Through 2026", "Até 2026", "Hasta 2026", "至 2026 年"),
    coverImage:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1600&h=700&q=75",
    images: [
      "https://images.unsplash.com/photo-1466692476867-a0881dfc0648?auto=format&fit=crop&w=1000&h=1200&q=75",
      "/assets/homepage/capabilities-value-chain.jpg",
    ],
    region: "other",
    testimonial: {
      quote: loc(
        "Thank you, Oboya Horticulture, for your hard work and your quick responses, consistent follow-up, and commitment to finding the right solution.",
        "Obrigado, Oboya Horticulture, pelo empenho, pelas respostas rápidas, pelo acompanhamento constante e pelo compromisso em encontrar a solução certa.",
        "Gracias, Oboya Horticulture, por el esfuerzo, las respuestas rápidas, el seguimiento constante y el compromiso de encontrar la solución adecuada.",
        "感谢 Oboya Horticulture 的投入、快速响应、持续跟进，以及找到合适方案的承诺。"
      ),
      author: "Procurement Manager",
      company: "LVG Plants",
    },
  },
  case2: {
    title: loc(
      "Improving Post-Harvest Efficiency Through Integrated Logistics",
      "Mais eficiência na pós-colheita com logística integrada",
      "Más eficiencia en poscosecha con logística integrada",
      "用一体化物流提升采后效率"
    ),
    excerpt: loc(
      "Elite Flowers sought to improve post-harvest productivity and reduce handling time across its operations in Colombia.\n\nSince 2020, the grower has deployed Oboya Horticulture trolleys and buckets, adding tractors in 2025 to move equipment between operational areas.\n\nThe rollout strengthened internal transportation, reduced worker fatigue, and delivered smoother workflow performance across post-harvest.",
      "A Elite Flowers queria aumentar a produtividade na pós-colheita e reduzir o tempo de manuseio em suas operações na Colômbia.\n\nDesde 2020, o produtor adotou carrinhos e baldes da Oboya Horticulture e, em 2025, acrescentou tratores para mover equipamentos entre as áreas.\n\nA implantação fortaleceu o transporte interno, reduziu a fadiga dos trabalhadores e deixou o fluxo da pós-colheita mais fluido.",
      "Elite Flowers buscaba mejorar la productividad en poscosecha y reducir el tiempo de manipulación en sus operaciones en Colombia.\n\nDesde 2020, el productor desplegó carros y baldes de Oboya Horticulture y, en 2025, sumó tractores para mover equipos entre áreas.\n\nLa implementación fortaleció el transporte interno, redujo la fatiga de los trabajadores y hizo más fluido el flujo de poscosecha.",
      "Elite Flowers 希望提高哥伦比亚业务的采后生产率并缩短搬运时间。\n\n自 2020 年起，该种植者部署了 Oboya Horticulture 的推车和水桶，并在 2025 年增加拖拉机，在作业区之间转运设备。\n\n推广加强了内部运输，减轻了工人疲劳，并让采后流程更加顺畅。"
    ),
    metric: loc(
      "Faster internal transportation",
      "Transporte interno mais rápido",
      "Transporte interno más rápido",
      "更快的内部运输"
    ),
    challenge: loc(
      "Elite Flowers sought to improve post-harvest productivity and reduce handling time. Existing processes required excessive manual movement of stems and materials, increasing labor requirements and slowing operations.",
      "A Elite Flowers queria aumentar a produtividade na pós-colheita e reduzir o tempo de manuseio. Os processos exigiam movimento manual excessivo de hastes e materiais, o que aumentava a necessidade de mão de obra e atrasava a operação.",
      "Elite Flowers buscaba mejorar la productividad en poscosecha y reducir el tiempo de manipulación. Los procesos exigían un movimiento manual excesivo de tallos y materiales, lo que aumentaba la mano de obra y ralentizaba la operación.",
      "Elite Flowers 希望提高采后生产率并缩短搬运时间。原有流程需要大量人工搬运花枝和物料，增加了用工并拖慢了作业。"
    ),
    solution: loc(
      "Beginning in 2020, Elite Flowers implemented Oboya Horticulture trolleys and buckets to optimize internal logistics. In 2025, tractors were incorporated to transport equipment between operational areas, further improving mobility and reducing transport times.",
      "A partir de 2020, a Elite Flowers adotou carrinhos e baldes da Oboya Horticulture para otimizar a logística interna. Em 2025, tratores passaram a transportar equipamentos entre as áreas, melhorando a mobilidade e reduzindo os tempos de transporte.",
      "Desde 2020, Elite Flowers implementó carros y baldes de Oboya Horticulture para optimizar la logística interna. En 2025, se incorporaron tractores para transportar equipos entre áreas, mejorando la movilidad y reduciendo los tiempos de transporte.",
      "从 2020 年起，Elite Flowers 采用 Oboya Horticulture 的推车和水桶优化内部物流。2025 年又加入拖拉机，在作业区之间转运设备，进一步提高机动性并缩短运输时间。"
    ),
    implementation: loc(
      "The new equipment was introduced progressively across post-harvest operations. Teams were trained to standardize workflows while maintaining uninterrupted daily production.",
      "Os novos equipamentos foram introduzidos de forma progressiva na pós-colheita. As equipes foram treinadas para padronizar os fluxos sem interromper a produção diária.",
      "Los nuevos equipos se introdujeron de forma progresiva en poscosecha. Los equipos fueron capacitados para estandarizar los flujos sin interrumpir la producción diaria.",
      "新设备在采后环节逐步引入。团队接受培训以标准化流程，同时保持日常生产不中断。"
    ),
    results: loc(
      "Increased post-harvest productivity.\n\nFaster internal transportation.\n\nReduced workers' fatigue.\n\nImproved handling consistency.\n\nEnhanced operational efficiency.\n\nSmoother workflow performance.",
      "Maior produtividade na pós-colheita.\n\nTransporte interno mais rápido.\n\nMenos fadiga dos trabalhadores.\n\nManuseio mais consistente.\n\nMais eficiência operacional.\n\nFluxo de trabalho mais fluido.",
      "Mayor productividad en poscosecha.\n\nTransporte interno más rápido.\n\nMenor fatiga de los trabajadores.\n\nManipulación más consistente.\n\nMayor eficiencia operativa.\n\nFlujo de trabajo más fluido.",
      "采后生产率提高。\n\n内部运输更快。\n\n工人疲劳减轻。\n\n搬运更加一致。\n\n运营效率提升。\n\n工作流程更加顺畅。"
    ),
    client: "Elite Flowers Colombia",
    timeline: loc("2020–2025", "2020–2025", "2020–2025", "2020–2025"),
    coverImage:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1600&h=700&q=75",
    images: [
      "/assets/homepage/capabilities-global-local.jpg",
      "/assets/homepage/capabilities-partnerships.jpg",
    ],
    region: "americas",
    testimonial: {
      quote: loc(
        "The project demonstrates how integrated logistics solutions can help flower growers improve productivity while strengthening operational performance across post-harvest activities.",
        "O projeto mostra como soluções de logística integrada ajudam produtores de flores a aumentar a produtividade e o desempenho operacional na pós-colheita.",
        "El proyecto muestra cómo las soluciones de logística integrada ayudan a los floricultores a mejorar la productividad y el desempeño operativo en poscosecha.",
        "该项目表明，一体化物流方案可以帮助花卉种植者提高采后生产率，并加强运营表现。"
      ),
      author: "Operations Team",
      company: "Elite Flowers Colombia",
    },
  },
  case3: {
    title: loc(
      "Advancing Traceability with RFID and AGV Automation",
      "Rastreabilidade com RFID e automação AGV",
      "Trazabilidad con RFID y automatización AGV",
      "用 RFID 与 AGV 自动化提升可追溯性"
    ),
    excerpt: loc(
      "Elite Flowers is exploring better traceability, automation, and material flow across its Colombian operations.\n\nOboya Horticulture partnered on a pilot evaluating RFID tracking systems and AGV pallet systems for workflow integration and scalability.\n\nEarly results point to faster identification, reduced manual registration, and stronger data for future deployment decisions.",
      "A Elite Flowers busca mais rastreabilidade, automação e fluxo de materiais em suas operações na Colômbia.\n\nA Oboya Horticulture participou de um piloto para avaliar sistemas de rastreamento RFID e paletes AGV quanto à integração e à escalabilidade.\n\nOs primeiros resultados apontam identificação mais rápida, menos registro manual e dados melhores para decisões de implantação.",
      "Elite Flowers busca más trazabilidad, automatización y flujo de materiales en sus operaciones en Colombia.\n\nOboya Horticulture participó en un piloto para evaluar sistemas de rastreo RFID y palés AGV en cuanto a integración y escalabilidad.\n\nLos primeros resultados apuntan a una identificación más rápida, menos registro manual y mejores datos para decisiones de implementación.",
      "Elite Flowers 正在探索如何提升哥伦比亚业务的可追溯性、自动化和物料流转。\n\nOboya Horticulture 参与试点，评估 RFID 追踪系统和 AGV 托盘系统的流程整合与可扩展性。\n\n早期结果表明识别更快、人工登记更少，并为后续部署决策提供了更有力的数据。"
    ),
    metric: loc(
      "Improved traceability",
      "Rastreabilidade melhor",
      "Mejor trazabilidad",
      "可追溯性提升"
    ),
    challenge: loc(
      "Elite Flowers is exploring new ways to improve traceability, automation, and material flow across its operations. Manual registration and pallet handling processes created opportunities for greater efficiency and visibility.",
      "A Elite Flowers busca novas formas de melhorar rastreabilidade, automação e fluxo de materiais. O registro manual e a movimentação de paletes abriam espaço para mais eficiência e visibilidade.",
      "Elite Flowers busca nuevas formas de mejorar la trazabilidad, la automatización y el flujo de materiales. El registro manual y el movimiento de palés abrían espacio para más eficiencia y visibilidad.",
      "Elite Flowers 正在寻找提升可追溯性、自动化和物料流转的方法。人工登记和托盘搬运仍有提高效率和可见性的空间。"
    ),
    solution: loc(
      "Oboya Horticulture partnered with Elite Flowers in a pilot program evaluating RFID Tracking Systems and AGV Pallet Systems. The objective is to assess operational feasibility, workflow integration, and future scalability.",
      "A Oboya Horticulture fez parceria com a Elite Flowers em um piloto de sistemas de rastreamento RFID e paletes AGV. O objetivo é avaliar a viabilidade operacional, a integração ao fluxo e a escalabilidade futura.",
      "Oboya Horticulture se asoció con Elite Flowers en un piloto de sistemas de rastreo RFID y palés AGV. El objetivo es evaluar la viabilidad operativa, la integración al flujo y la escalabilidad futura.",
      "Oboya Horticulture 与 Elite Flowers 合作试点 RFID 追踪系统和 AGV 托盘系统，以评估运营可行性、流程整合和未来可扩展性。"
    ),
    implementation: loc(
      "Pilot activities include RFID identification testing, route simulations, AGV trials, user training, and operational performance evaluations.",
      "As atividades do piloto incluem testes de identificação RFID, simulações de rota, ensaios com AGV, treinamento de usuários e avaliação de desempenho operacional.",
      "Las actividades del piloto incluyen pruebas de identificación RFID, simulaciones de ruta, ensayos con AGV, capacitación de usuarios y evaluación del desempeño operativo.",
      "试点包括 RFID 识别测试、路线模拟、AGV 试验、用户培训和运营绩效评估。"
    ),
    results: loc(
      "Initial observations indicate faster identification and tracking, reduced manual registration, improved traceability, potential for more efficient pallet movement, and valuable data for future deployment decisions.",
      "As observações iniciais indicam identificação e rastreamento mais rápidos, menos registro manual, melhor rastreabilidade, potencial de movimentação de paletes mais eficiente e dados valiosos para decisões futuras de implantação.",
      "Las observaciones iniciales indican identificación y seguimiento más rápidos, menos registro manual, mejor trazabilidad, potencial de movimiento de palés más eficiente y datos valiosos para decisiones futuras de implementación.",
      "初步观察显示识别和追踪更快、人工登记减少、可追溯性提高、托盘搬运更高效的潜力，以及为后续部署决策提供的有价值数据。"
    ),
    client: "Elite Flowers Colombia",
    timeline: loc("Pilot program", "Programa piloto", "Programa piloto", "试点项目"),
    coverImage:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&h=700&q=75",
    images: [
      "/assets/homepage/capabilities-value-chain.jpg",
      "/assets/homepage/capabilities-global-local.jpg",
    ],
    region: "americas",
    testimonial: {
      quote: loc(
        "The pilot with Oboya Horticulture RFID and AGV systems is giving us valuable insights. We can already see the potential for better traceability and more efficient pallet movement once fully implemented.",
        "O piloto com os sistemas RFID e AGV da Oboya Horticulture está nos dando informações valiosas. Já vemos o potencial de mais rastreabilidade e de uma movimentação de paletes mais eficiente quando estiver totalmente implantado.",
        "El piloto con los sistemas RFID y AGV de Oboya Horticulture nos está dando información valiosa. Ya vemos el potencial de más trazabilidad y de un movimiento de palés más eficiente cuando esté totalmente implementado.",
        "与 Oboya Horticulture 的 RFID 和 AGV 系统试点带来了宝贵洞察。我们已经看到，全面实施后可追溯性会更好，托盘搬运也会更高效。"
      ),
      author: "Operations Team",
      company: "Elite Flowers Colombia",
    },
  },
  case4: {
    title: loc(
      "Improving Productivity Through Inclusive Automation",
      "Mais produtividade com automação inclusiva",
      "Más productividad con automatización inclusiva",
      "用包容性自动化提高生产率"
    ),
    excerpt: loc(
      "Flor de Azama Farm needed safer, more ergonomic post-harvest operations while supporting employees with disabilities and medical restrictions.\n\nOboya Horticulture supplied an automatic bouquet-tying machine to attach nutritional sachets, with technical support and implementation follow-up.\n\nProductivity rose roughly 70%, from 180–200 bouquets per operator to 330–340, with improved ergonomics and workplace inclusion.",
      "A Flor de Azama Farm precisava de uma pós-colheita mais segura e ergonômica, inclusive para colaboradores com deficiência e restrições médicas.\n\nA Oboya Horticulture forneceu uma máquina automática de amarração de buquês para fixar sachês nutricionais, com suporte técnico e acompanhamento da implantação.\n\nA produtividade subiu cerca de 70%, de 180–200 buquês por operador para 330–340, com melhor ergonomia e inclusão.",
      "Flor de Azama Farm necesitaba una poscosecha más segura y ergonómica, también para colaboradores con discapacidad y restricciones médicas.\n\nOboya Horticulture suministró una máquina automática de atado de ramos para fijar sobres nutricionales, con soporte técnico y seguimiento de la implementación.\n\nLa productividad subió cerca de un 70%, de 180–200 ramos por operador a 330–340, con mejor ergonomía e inclusión.",
      "Flor de Azama Farm 需要更安全、更符合人体工学的采后作业，并支持有残疾和医疗限制的员工。\n\nOboya Horticulture 提供了自动花束捆扎机，用于附加营养小包，并提供技术支持和实施跟进。\n\n生产率提高约 70%，从每位操作员 180–200 束增至 330–340 束，人体工学和工作场所包容性也得到改善。"
    ),
    metric: loc(
      "70% higher productivity",
      "70% mais produtividade",
      "70% más productividad",
      "生产率提高 70%"
    ),
    challenge: loc(
      "The farm aimed to improve productivity in post-harvest operations while creating a safer, more ergonomic work environment. The manual process of attaching nutritional sachets involved repetitive hand movements, leading to employee discomfort and limited efficiency. They also needed a solution that supported employees with disabilities and medical restrictions.",
      "A fazenda queria aumentar a produtividade na pós-colheita e criar um ambiente mais seguro e ergonômico. Fixar sachês nutricionais à mão exigia movimentos repetitivos, causava desconforto e limitava a eficiência. Também era preciso uma solução para colaboradores com deficiência e restrições médicas.",
      "La finca quería aumentar la productividad en poscosecha y crear un entorno más seguro y ergonómico. Fijar sobres nutricionales a mano exigía movimientos repetitivos, causaba molestias y limitaba la eficiencia. También hacía falta una solución para colaboradores con discapacidad y restricciones médicas.",
      "农场希望提高采后生产率，并营造更安全、更符合人体工学的环境。手工附加营养小包需要重复的手部动作，导致不适并限制效率。他们还需要一套方案来支持有残疾和医疗限制的员工。"
    ),
    solution: loc(
      "Oboya Horticulture provided an automatic bouquet-tying machine to automate the attachment of nutritional sachets. This solution aimed to reduce manual labor, improve ergonomics, increase speed, and create a safer workstation. Oboya also provided technical support and implementation follow-up.",
      "A Oboya Horticulture forneceu uma máquina automática de amarração de buquês para automatizar a fixação dos sachês nutricionais. A solução reduz o trabalho manual, melhora a ergonomia, aumenta a velocidade e cria um posto mais seguro. A Oboya também deu suporte técnico e acompanhamento da implantação.",
      "Oboya Horticulture suministró una máquina automática de atado de ramos para automatizar la fijación de los sobres nutricionales. La solución reduce el trabajo manual, mejora la ergonomía, aumenta la velocidad y crea un puesto más seguro. Oboya también dio soporte técnico y seguimiento de la implementación.",
      "Oboya Horticulture 提供自动花束捆扎机，使营养小包的附加自动化。方案旨在减少人工、改善人体工学、提高速度并打造更安全的工位。Oboya 还提供了技术支持和实施跟进。"
    ),
    implementation: loc(
      "The machine was integrated into post-harvest lines with operator training and ongoing technical support to ensure smooth adoption across shifts.",
      "A máquina foi integrada às linhas de pós-colheita, com treinamento dos operadores e suporte técnico contínuo para uma adoção tranquila em todos os turnos.",
      "La máquina se integró a las líneas de poscosecha, con capacitación de operadores y soporte técnico continuo para una adopción fluida en todos los turnos.",
      "设备被整合进采后产线，并配合操作员培训和持续技术支持，以确保各班次顺利采用。"
    ),
    results: loc(
      "70% higher productivity — output increased from approximately 180–200 bouquets per operator to 330–340 bouquets per operator.\n\nImproved ergonomics through reduction in repetitive hand movements and physical strain.\n\nGreater workplace inclusion with a safer environment suitable for employees with disabilities and medical restrictions.\n\nIncreased efficiency with faster, more consistent operations and less reliance on manual repetitive tasks.",
      "70% mais produtividade — a produção passou de cerca de 180–200 buquês por operador para 330–340.\n\nMelhor ergonomia, com menos movimentos repetitivos das mãos e menos esforço físico.\n\nMais inclusão, com um ambiente mais seguro para colaboradores com deficiência e restrições médicas.\n\nMais eficiência, com operações mais rápidas e consistentes e menos dependência de tarefas manuais repetitivas.",
      "70% más productividad — la producción pasó de unos 180–200 ramos por operador a 330–340.\n\nMejor ergonomía, con menos movimientos repetitivos de las manos y menos esfuerzo físico.\n\nMás inclusión, con un entorno más seguro para colaboradores con discapacidad y restricciones médicas.\n\nMás eficiencia, con operaciones más rápidas y consistentes y menos dependencia de tareas manuales repetitivas.",
      "生产率提高 70%——每位操作员的产量从约 180–200 束增至 330–340 束。\n\n人体工学改善，重复的手部动作和身体负担减少。\n\n工作场所更包容，环境更适合有残疾和医疗限制的员工。\n\n效率提高，作业更快、更稳定，对重复人工任务的依赖降低。"
    ),
    client: "Flor de Azama Farm – Falcon Farms",
    timeline: loc(
      "Post-harvest operations",
      "Operações de pós-colheita",
      "Operaciones de poscosecha",
      "采后作业"
    ),
    coverImage:
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1600&h=700&q=75",
    images: [
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1000&h=1200&q=75",
      "/assets/homepage/capabilities-partnerships.jpg",
    ],
    region: "americas",
    testimonial: {
      quote: loc(
        "The machine has helped me tremendously. Before, we used rubber bands and tape, which could cause discomfort and even injuries to our hands. Today, the process is faster, more comfortable, and much safer. For me, this machine is a blessing.",
        "A máquina me ajudou muito. Antes usávamos elásticos e fita, que podiam causar desconforto e até lesões nas mãos. Hoje o processo é mais rápido, mais confortável e muito mais seguro. Para mim, esta máquina é uma bênção.",
        "La máquina me ha ayudado muchísimo. Antes usábamos ligas y cinta, que podían causar molestias e incluso lesiones en las manos. Hoy el proceso es más rápido, más cómodo y mucho más seguro. Para mí, esta máquina es una bendición.",
        "这台机器帮了我很大的忙。以前我们用橡皮筋和胶带，手会不舒服，甚至受伤。现在流程更快、更舒服，也安全得多。对我来说，这台机器是一件幸事。"
      ),
      author: "Betty Mesa",
      company: "Flor de Azama Farm – Falcon Farms",
    },
  },
};

function seed(): CmsCaseStudy[] {
  return caseStudies.map((c) => {
    const copy = seedContent[c.messageKey];
    return {
      id: c.slug,
      slug: c.slug,
      title: copy?.title ?? loc(c.slug.replace(/-/g, " ")),
      excerpt: copy?.excerpt ?? emptyLoc(),
      metric: copy?.metric ?? emptyLoc(),
      challenge: copy?.challenge ?? emptyLoc(),
      solution: copy?.solution ?? emptyLoc(),
      implementation: copy?.implementation ?? emptyLoc(),
      results: copy?.results ?? emptyLoc(),
      client: copy?.client ?? "",
      timeline: copy?.timeline ?? emptyLoc(),
      industry: c.industry,
      country: c.country,
      region: copy?.region ?? "other",
      segment: c.industry,
      coverImage: copy?.coverImage ?? "",
      images: copy?.images ?? [],
      gallery: [],
      downloads: [],
      testimonial: copy?.testimonial ?? emptyTestimonial(),
      status: "published" as CmsStatus,
      seo: { title: emptyLoc(), description: emptyLoc() },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
  });
}

let cache: CmsCaseStudy[] | null = null;

export function getCaseStudies(): CmsCaseStudy[] {
  if (!cache) cache = seed();
  return cache;
}

export function replaceCaseStudiesCache(studies: CmsCaseStudy[]) {
  cache = studies.map((s) => ({ ...s }));
}

export function getCaseStudyById(id: string): CmsCaseStudy | undefined {
  return getCaseStudies().find((c) => c.id === id);
}

export function saveCaseStudy(study: CmsCaseStudy): CmsCaseStudy {
  const items = getCaseStudies();
  const idx = items.findIndex((c) => c.id === study.id);
  const updated = { ...study, updatedAt: new Date().toISOString() };
  if (idx >= 0) items[idx] = updated;
  else items.push(updated);
  cache = items;
  return updated;
}

export function deleteCaseStudy(id: string): boolean {
  const items = getCaseStudies();
  const idx = items.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  items.splice(idx, 1);
  cache = items;
  return true;
}
