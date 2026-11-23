import { homeLoc } from "@/lib/cms/homepage-i18n";

/**
 * Previous default homepage copy. Stored docs whose value still equals one of these
 * (every locale) get the new default; edited content is never touched.
 */
export const LEGACY_HOME_COPY = {
  ecoBodyP1: homeLoc(
    "Success in horticulture depends on more than individual products. It depends on how growing, packaging, logistics, transport, retail presentation, and operational processes work together.",
    "O sucesso na horticultura depende de mais do que produtos individuais. Depende de como cultivo, embalagem, logística, transporte, apresentação no varejo e processos operacionais trabalham juntos.",
    "El éxito en la horticultura depende de más que productos individuales. Depende de cómo el cultivo, el embalaje, la logística, el transporte, la presentación en retail y los procesos operativos trabajan juntos.",
    "园艺成功不只取决于单一产品，而取决于种植、包装、物流、运输、零售陈列与日常运营如何协同运作。"
  ),
  ecoBodyP2: homeLoc(
    "Oboya Horticulture offers solutions across multiple stages of the horticultural journey, helping customers access the products and expertise they need through a single trusted partner.",
    "A Oboya Horticulture oferece soluções em múltiplas etapas da jornada hortícola, ajudando os clientes a acessar os produtos e a expertise de que precisam por meio de um único parceiro de confiança.",
    "Oboya Horticulture ofrece soluciones en múltiples etapas del recorrido hortícola, ayudando a los clientes a acceder a los productos y la expertise que necesitan a través de un solo socio de confianza.",
    "Oboya Horticulture 在园艺旅程的多个阶段提供解决方案，帮助客户通过同一可信赖的伙伴获得所需的产品与专业支持。"
  ),
  capItem2Desc: homeLoc(
    "A global network backed by international manufacturing, product development, and sourcing capabilities — with local responsiveness and deep horticulture expertise.",
    "Uma rede global respaldada por manufatura internacional, desenvolvimento de produtos e capacidades de sourcing — com resposta local e profunda expertise em horticultura.",
    "Una red global respaldada por fabricación internacional, desarrollo de productos y capacidades de abastecimiento — con respuesta local y profunda experiencia en horticultura.",
    "依托国际制造、产品开发与采购能力的全球网络——兼具本地响应速度与深厚的园艺专业经验。"
  ),
  solutionsTitle: homeLoc(
    "Every crop, operation, and supply chain has unique requirements — explore the solutions, expertise, and support designed for your sector.",
    "Cada cultura, operação e cadeia de suprimentos tem requisitos únicos — explore as soluções, expertise e suporte pensados para o seu setor.",
    "Cada cultivo, operación y cadena de suministro tiene requisitos únicos — explore las soluciones, la experiencia y el soporte diseñados para su sector.",
    "每种作物、运营和供应链都有独特需求——探索为您的领域量身打造的解决方案、专业实力与支持。"
  ),
  solutionDesc: {
    flowers: homeLoc(
      "End-to-end solutions for floriculture operations — from propagation and packaging through to retail.",
      "Soluções completas para floricultura — da propagação e embalagem até o varejo.",
      "Soluciones integrales para floricultura — desde la propagación y el empaque hasta el retail.",
      "花卉种植端到端解决方案——从育苗、包装到零售。"
    ),
    vegetables: homeLoc(
      "Integrated solutions that support efficient production, handling, packaging, and commercialization.",
      "Soluções integradas que apoiam produção, manuseio, embalagem e comercialização eficientes.",
      "Soluciones integradas que apoyan una producción, manipulación, empaque y comercialización eficientes.",
      "支持高效生产、搬运、包装与销售的一体化解决方案。"
    ),
    fruits: homeLoc(
      "Solutions that optimize cultivation, handling, packaging, and distribution across the fruit supply chain.",
      "Soluções que otimizam cultivo, manuseio, embalagem e distribuição em toda a cadeia de frutas.",
      "Soluciones que optimizan el cultivo, manipulación, empaque y distribución en toda la cadena de frutas.",
      "优化水果供应链种植、搬运、包装与配送的解决方案。"
    ),
    "logistics-display": homeLoc(
      "Systems that improve product movement, merchandising, and point-of-sale presentation.",
      "Sistemas que melhoram o movimento do produto, o merchandising e a apresentação no ponto de venda.",
      "Sistemas que mejoran el movimiento del producto, el merchandising y la presentación en el punto de venta.",
      "改善产品流转、陈列营销与终端展示的系统。"
    ),
    "machinery-automation": homeLoc(
      "Technology that increases efficiency, consistency, and scalability as operations grow.",
      "Tecnologia que aumenta eficiência, consistência e escalabilidade conforme as operações crescem.",
      "Tecnología que aumenta la eficiencia, la consistencia y la escalabilidad a medida que crecen las operaciones.",
      "随运营规模增长提升效率、一致性与可扩展性的技术。"
    ),
  },
  challengePoints: [
    homeLoc(
      "Growing quality expectations. More complex supply chains.",
      "Expectativas de qualidade crescentes. Cadeias de suprimento mais complexas.",
      "Expectativas de calidad crecientes. Cadenas de suministro más complejas.",
      "质量期望不断提高，供应链日益复杂。"
    ),
    homeLoc(
      "Greater demands for operational efficiency.",
      "Maior exigência de eficiência operacional.",
      "Mayores exigencias de eficiencia operativa.",
      "对运营效率的要求更高。"
    ),
    homeLoc(
      "Rising pressure on sustainability and labour.",
      "Pressão crescente por sustentabilidade e mão de obra.",
      "Creciente presión en sostenibilidad y mano de obra.",
      "可持续发展与劳动力方面的压力不断上升。"
    ),
  ],
  partnersTitle: homeLoc(
    "Our collaborations",
    "Nossas colaborações",
    "Nuestras colaboraciones",
    "我们的合作伙伴"
  ),
  testimonialsEyebrow: homeLoc("Testimonials", "Depoimentos", "Testimonios", "客户评价"),
  /** [quote, author, role] of the six former testimonials, in order. */
  testimonials: [
    [
      homeLoc(
        "Oboya helped us unify packaging and logistics across our greenhouse network. Delivery reliability improved within the first season.",
        "A Oboya nos ajudou a unificar embalagem e logística em nossa rede de estufas. A confiabilidade das entregas melhorou já na primeira safra.",
        "Oboya nos ayudó a unificar el empaque y la logística en nuestra red de invernaderos. La confiabilidad de las entregas mejoró en la primera temporada.",
        "Oboya 帮助我们统一了温室网络的包装与物流，交付可靠性在首个产季就得到提升。"
      ),
      homeLoc("Maria Jensen", "Maria Jensen", "Maria Jensen", "Maria Jensen"),
      homeLoc("Nordic Growers", "Nordic Growers", "Nordic Growers", "Nordic Growers"),
    ],
    [
      homeLoc(
        "Their local teams understood our retail requirements and delivered display solutions that lifted shelf presence without slowing operations.",
        "As equipes locais entenderam nossas exigências de varejo e entregaram soluções de exposição que elevaram a presença na gôndola sem desacelerar as operações.",
        "Sus equipos locales comprendieron nuestros requisitos de retail y entregaron soluciones de exhibición que mejoraron la presencia en góndola sin frenar las operaciones.",
        "本地团队理解我们的零售需求，提供的陈列解决方案提升了货架表现力，同时不影响运营效率。"
      ),
      homeLoc("Carlos Mendes", "Carlos Mendes", "Carlos Mendes", "Carlos Mendes"),
      homeLoc("Fresh Retail Group", "Fresh Retail Group", "Fresh Retail Group", "Fresh Retail Group"),
    ],
    [
      homeLoc(
        "From substrates to retail-ready packaging, Oboya has become a long-term partner for our berry programs across Asia Pacific.",
        "De substratos a embalagens prontas para o varejo, a Oboya tornou-se parceira de longo prazo dos nossos programas de frutas vermelhas na Ásia-Pacífico.",
        "Desde sustratos hasta empaques listos para retail, Oboya se ha convertido en un socio a largo plazo para nuestros programas de berries en Asia-Pacífico.",
        "从基质到零售级包装，Oboya 已成为我们在亚太浆果项目的长期合作伙伴。"
      ),
      homeLoc("Li Wei", "Li Wei", "Li Wei", "李伟"),
      homeLoc("Asia Pacific Berries", "Asia Pacific Berries", "Asia Pacific Berries", "亚太浆果"),
    ],
    [
      homeLoc(
        "We needed one partner for cultivation support and outbound logistics. Oboya connected both ends of the chain with clear accountability.",
        "Precisávamos de um parceiro para apoio ao cultivo e logística de saída. A Oboya conectou as duas pontas da cadeia com responsabilidade clara.",
        "Necesitábamos un socio para el apoyo al cultivo y la logística de salida. Oboya conectó ambos extremos de la cadena con una responsabilidad clara.",
        "我们需要一个合作伙伴同时支持种植与出货物流。Oboya 以清晰的责任衔接了链条两端。"
      ),
      homeLoc("Elena Rossi", "Elena Rossi", "Elena Rossi", "Elena Rossi"),
      homeLoc("MediFlora Cooperative", "Cooperativa MediFlora", "Cooperativa MediFlora", "MediFlora 合作社"),
    ],
    [
      homeLoc(
        "Scale and local expertise rarely come together. With Oboya, we get global manufacturing strength and on-the-ground support where we grow.",
        "Escala e expertise local raramente se encontram. Com a Oboya, temos força de manufatura global e suporte no campo onde cultivamos.",
        "La escala y la experiencia local rara vez se combinan. Con Oboya, obtenemos fuerza de fabricación global y soporte en el terreno donde cultivamos.",
        "规模与本地经验难得兼备。与 Oboya 合作，我们既有全球制造实力，也有种植所在地的现场支持。"
      ),
      homeLoc("James Okonkwo", "James Okonkwo", "James Okonkwo", "James Okonkwo"),
      homeLoc("GreenHorizon Farms", "GreenHorizon Farms", "GreenHorizon Farms", "GreenHorizon Farms"),
    ],
    [
      homeLoc(
        "Switching to Oboya's integrated solutions cut complexity for our growers and gave our buyers a more consistent product experience.",
        "A mudança para as soluções integradas da Oboya reduziu a complexidade para nossos produtores e deu aos compradores uma experiência de produto mais consistente.",
        "El cambio a las soluciones integradas de Oboya redujo la complejidad para nuestros productores y ofreció a los compradores una experiencia de producto más consistente.",
        "转向 Oboya 一体化解决方案降低了种植者的复杂度，并为采购方带来更一致的产品体验。"
      ),
      homeLoc("Sophie Dubois", "Sophie Dubois", "Sophie Dubois", "Sophie Dubois"),
      homeLoc("EuroFresh Alliance", "EuroFresh Alliance", "EuroFresh Alliance", "EuroFresh Alliance"),
    ],
  ],
  /** Interim five-item default set (same shape). */
  testimonials5: [
    [homeLoc("Thank you, Oboya Horticulture, for your hard work and your quick responses, consistent follow-up, and commitment to finding the right solution.", "Obrigado, Oboya Horticulture, pelo empenho, pelas respostas rápidas, pelo acompanhamento constante e pelo compromisso em encontrar a solução certa.", "Gracias, Oboya Horticulture, por su esfuerzo, sus respuestas rápidas, su seguimiento constante y su compromiso de encontrar la solución adecuada.", "感谢 Oboya Horticulture 的辛勤付出、快速响应、持续跟进，以及为找到合适方案所做的努力。"), homeLoc("Procurement Manager", "Gerente de Compras", "Gerente de Compras", "采购经理"), homeLoc("LVG Plants", "LVG Plants", "LVG Plants", "LVG Plants")],
    [homeLoc("The machine has helped me tremendously. Before, we used rubber bands and tape, which could cause discomfort and even injuries to our hands. Today, the process is faster, more comfortable, and much safer. For me, this machine is a blessing.", "A máquina me ajudou enormemente. Antes, usávamos elásticos e fita, o que podia causar desconforto e até lesões nas mãos. Hoje, o processo é mais rápido, mais confortável e muito mais seguro. Para mim, essa máquina é uma bênção.", "La máquina me ha ayudado enormemente. Antes usábamos gomas elásticas y cinta, lo que podía causar molestias e incluso lesiones en las manos. Hoy el proceso es más rápido, más cómodo y mucho más seguro. Para mí, esta máquina es una bendición.", "这台机器给了我极大的帮助。以前我们使用橡皮筋和胶带，容易造成手部不适甚至受伤。如今流程更快、更舒适，也安全得多。对我来说，这台机器是一份恩赐。"), homeLoc("Betty Mesa", "Betty Mesa", "Betty Mesa", "Betty Mesa"), homeLoc("Flor de Azama Farm – Falcon Farms", "Flor de Azama Farm – Falcon Farms", "Flor de Azama Farm – Falcon Farms", "Flor de Azama Farm – Falcon Farms")],
    [homeLoc("The Oboya Terra transparent Pot helped us create better growing conditions for our plants. The increased substrate volume, improved aeration, and enhanced drainage support healthier root development and have delivered the performance we were looking for. We are very satisfied with the results.", "O vaso transparente Oboya Terra nos ajudou a criar melhores condições de cultivo para as plantas. O maior volume de substrato, a melhor aeração e a drenagem aprimorada favorecem um desenvolvimento radicular mais saudável e entregaram o desempenho que buscávamos. Estamos muito satisfeitos com os resultados.", "La maceta transparente Oboya Terra nos ayudó a crear mejores condiciones de cultivo para nuestras plantas. El mayor volumen de sustrato, la mejor aireación y el drenaje optimizado favorecen un desarrollo radicular más sano y han ofrecido el rendimiento que buscábamos. Estamos muy satisfechos con los resultados.", "Oboya Terra 透明花盆帮助我们为植物创造了更好的生长条件。更大的基质容量、更好的透气性和更优的排水性能，促进根系更健康地发育，达到了我们期望的效果。我们对结果非常满意。"), homeLoc("Geraldo Barendse", "Geraldo Barendse", "Geraldo Barendse", "Geraldo Barendse"), homeLoc("Brazil", "Brasil", "Brasil", "巴西")],
    [homeLoc("The custom pot holder developed by Oboya helped improve the flow of our production process and made handling mini pots much more efficient. The solution integrated well with our conveyor system and contributed to a smoother operation.", "O porta-vasos personalizado desenvolvido pela Oboya ajudou a melhorar o fluxo do nosso processo produtivo e tornou o manuseio de minivasos muito mais eficiente. A solução se integrou bem ao nosso sistema de esteiras e contribuiu para uma operação mais fluida.", "El portamacetas personalizado desarrollado por Oboya ayudó a mejorar el flujo de nuestro proceso de producción y hizo mucho más eficiente la manipulación de minimacetas. La solución se integró bien con nuestro sistema de transporte y contribuyó a una operación más fluida.", "Oboya 开发的定制花盆托架改善了我们的生产流程，使迷你花盆的搬运效率大幅提升。该方案与我们的输送系统衔接顺畅，让整体运作更加流畅。"), homeLoc("Joost", "Joost", "Joost", "Joost"), homeLoc("Kalanchoe", "Kalanchoe", "Kalanchoe", "Kalanchoe")],
    [homeLoc("The Oboya Ecovaso Tall Pot allowed us to improve transportation efficiency while maintaining an attractive presentation for our products. Being able to transport approximately 20% more pots per trolley represents a significant logistical advantage for our operation.", "O vaso alto Oboya Ecovaso nos permitiu melhorar a eficiência do transporte sem abrir mão de uma apresentação atraente dos produtos. Transportar cerca de 20% mais vasos por carrinho representa uma vantagem logística significativa para a nossa operação.", "La maceta alta Oboya Ecovaso nos permitió mejorar la eficiencia del transporte manteniendo una presentación atractiva de nuestros productos. Poder transportar aproximadamente un 20% más de macetas por carro supone una ventaja logística significativa para nuestra operación.", "Oboya Ecovaso 高款花盆让我们在保持产品美观陈列的同时提升了运输效率。每辆推车可多运约 20% 的花盆，对我们的运营而言是显著的物流优势。"), homeLoc("Terra Viva", "Terra Viva", "Terra Viva", "Terra Viva"), homeLoc("Brazil", "Brasil", "Brasil", "巴西")],
  ],
};
