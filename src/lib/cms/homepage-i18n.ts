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
      "A global network backed by international manufacturing, product development, and sourcing capabilities. With local responsiveness and deep horticulture expertise.",
      "Uma rede global sustentada por capacidades internacionais de fabricação, desenvolvimento de produtos e sourcing. Com agilidade local e profunda expertise em horticultura.",
      "Una red global respaldada por capacidades internacionales de fabricación, desarrollo de productos y abastecimiento. Con capacidad de respuesta local y profunda experiencia en horticultura.",
      "依托国际化制造、产品研发与采购能力的全球网络，兼具本地快速响应与深厚的园艺专业经验。"
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
    title: homeLoc("", "", "", ""),
    cta: homeLoc(
      "Explore Solutions",
      "Explorar soluções",
      "Explorar soluciones",
      "探索解决方案"
    ),
    flowersTitle: homeLoc("Flowers", "Flores", "Flores", "花卉"),
    flowersDesc: homeLoc(
      "Solutions for floriculture operations from propagation to retail.",
      "Soluções para operações de floricultura, da propagação ao varejo.",
      "Soluciones para operaciones de floricultura, desde la propagación hasta el retail.",
      "面向花卉种植业务的解决方案，覆盖从育苗繁殖到零售的全流程。"
    ),
    vegetablesTitle: homeLoc(
      "Vegetables & Herbs",
      "Vegetais e Ervas",
      "Vegetales y Hierbas",
      "蔬菜与香草"
    ),
    vegetablesDesc: homeLoc(
      "Solutions that support efficient production, handling, packaging, and commercialization.",
      "Soluções que apoiam produção, manuseio, embalagem e comercialização eficientes.",
      "Soluciones que respaldan una producción, manipulación, envasado y comercialización eficientes.",
      "助力高效生产、搬运、包装与销售的解决方案。"
    ),
    fruitsTitle: homeLoc("Fruits", "Frutas", "Frutas", "水果"),
    fruitsDesc: homeLoc(
      "Solutions that optimize efficient cultivation, management, packaging and distribution.",
      "Soluções que otimizam o cultivo, a gestão, a embalagem e a distribuição.",
      "Soluciones que optimizan el cultivo, la gestión, el envasado y la distribución.",
      "优化种植、管理、包装与分销效率的解决方案。"
    ),
    logisticsTitle: homeLoc(
      "Logistics & Display",
      "Logística e Exposição",
      "Logística y Exhibición",
      "物流与陈列"
    ),
    logisticsDesc: homeLoc(
      "Systems that improve movement, merchandising, and point-of-sale presentation.",
      "Sistemas que melhoram a movimentação, o merchandising e a apresentação no ponto de venda.",
      "Sistemas que mejoran el movimiento, el merchandising y la presentación en el punto de venta.",
      "改善物流周转、商品陈列与销售终端展示的系统。"
    ),
    machineryTitle: homeLoc(
      "Machinery & Automation",
      "Maquinário e Automação",
      "Maquinaria y Automatización",
      "机械与自动化"
    ),
    machineryDesc: homeLoc(
      "Technology solutions that increase efficiency, consistency and expandability.",
      "Soluções tecnológicas que aumentam a eficiência, a consistência e a capacidade de expansão.",
      "Soluciones tecnológicas que aumentan la eficiencia, la consistencia y la capacidad de ampliación.",
      "提升效率、一致性与可扩展性的技术解决方案。"
    ),
  },
  challenges: {
    title: homeLoc(
      "Built Around the Challenges Facing Horticulture Today",
      "Construído em torno dos desafios da horticultura hoje",
      "Creado en torno a los desafíos de la horticultura actual",
      "围绕当今园艺业面临的挑战而打造"
    ),
    p1: homeLoc(
      "Increasing labor pressures.",
      "Pressão crescente sobre a mão de obra.",
      "Presión creciente sobre la mano de obra.",
      "劳动力压力日益增大。"
    ),
    p2: homeLoc(
      "Growing quality expectations.",
      "Expectativas de qualidade cada vez maiores.",
      "Expectativas de calidad cada vez mayores.",
      "品质期望不断提高。"
    ),
    p3: homeLoc(
      "More complex supply chains.",
      "Cadeias de suprimento cada vez mais complexas.",
      "Cadenas de suministro cada vez más complejas.",
      "供应链日趋复杂。"
    ),
    p4: homeLoc(
      "Greater demands for operational efficiency.",
      "Maior exigência de eficiência operacional.",
      "Mayores exigencias de eficiencia operativa.",
      "对运营效率的要求更高。"
    ),
    closingText: homeLoc(
      "Oboya Horticulture helps horticultural businesses navigate these realities with practical solutions designed to deliver measurable results.",
      "A Oboya Horticulture ajuda empresas hortícolas a enfrentar essas realidades com soluções práticas, pensadas para gerar resultados mensuráveis.",
      "Oboya Horticulture ayuda a las empresas hortícolas a afrontar estas realidades con soluciones prácticas diseñadas para ofrecer resultados medibles.",
      "Oboya Horticulture 以切实可行的解决方案，帮助园艺企业应对这些现实挑战，创造可衡量的成果。"
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
      "Real Results. Real Partnerships.",
      "Resultados Reais. Parcerias Reais.",
      "Resultados Reales. Alianzas Reales.",
      "真实成果，真诚合作"
    ),
    t1Quote: homeLoc("The machine has helped me tremendously. Before, we used rubber bands and tape, which could cause discomfort and even hand injuries. Today, the process is faster, more comfortable, and much safer. For me, this machine is a blessing.", "A máquina me ajudou imensamente. Antes, usávamos elásticos e fita, que podiam causar desconforto e até lesões nas mãos. Hoje, o processo é mais rápido, mais confortável e muito mais seguro. Para mim, essa máquina é uma bênção.", "La máquina me ha ayudado enormemente. Antes usábamos gomas elásticas y cinta, que podían causar molestias e incluso lesiones en las manos. Hoy el proceso es más rápido, más cómodo y mucho más seguro. Para mí, esta máquina es una bendición.", "这台机器给了我极大的帮助。以前我们使用橡皮筋和胶带，可能造成不适，甚至手部受伤。如今，整个流程更快、更舒适，也更安全。对我来说，这台机器是一份恩赐。"),
    t1Author: homeLoc("Betty Mesa", "Betty Mesa", "Betty Mesa", "Betty Mesa"),
    t1Role: homeLoc("Flor de Azama Farm – Falcon Farms", "Flor de Azama Farm – Falcon Farms", "Flor de Azama Farm – Falcon Farms", "Flor de Azama Farm – Falcon Farms"),
    t2Quote: homeLoc("Thank you, Oboya Horticulture, for your hard work and your quick responses, consistent follow-up, and commitment to finding the right solution.", "Obrigado, Oboya Horticulture, pelo seu empenho, pelas respostas rápidas, pelo acompanhamento constante e pelo compromisso em encontrar a solução certa.", "Gracias, Oboya Horticulture, por su arduo trabajo, sus respuestas rápidas, su seguimiento constante y su compromiso para encontrar la solución adecuada.", "感谢 Oboya Horticulture 的辛勤付出、快速响应、持续跟进，以及为找到合适方案所做出的努力。"),
    t2Author: homeLoc("Mariette Barnard", "Mariette Barnard", "Mariette Barnard", "Mariette Barnard"),
    t2Role: homeLoc("Procurement Manager, LVG Plants", "Gerente de Compras, LVG Plants", "Gerente de Compras, LVG Plants", "采购经理，LVG Plants"),
    t3Quote: homeLoc("The APV demonstrates how integrated logistics solutions can help flower growers improve productivity while strengthening operational performance across post-harvest activities.", "O APV demonstra como soluções logísticas integradas podem ajudar os produtores de flores a aumentar a produtividade, fortalecendo o desempenho operacional em todas as atividades de pós-colheita.", "El APV demuestra cómo las soluciones logísticas integradas pueden ayudar a los productores de flores a mejorar la productividad y, al mismo tiempo, fortalecer el desempeño operativo en las actividades de poscosecha.", "APV 展示了集成式物流解决方案如何帮助花卉种植者提高生产效率，同时增强采后各环节的运营表现。"),
    t3Author: homeLoc("José Vicente Duque", "José Vicente Duque", "José Vicente Duque", "José Vicente Duque"),
    t3Role: homeLoc("Elite Flowers Colombia", "Elite Flowers Colombia", "Elite Flowers Colombia", "Elite Flowers Colombia"),
    t4Quote: homeLoc("The pilot with Oboya Horticulture RFID and AGV systems is giving us valuable insights. We can already see the potential for better traceability and more efficient pallet movement once fully implemented.", "O piloto com os sistemas RFID e AGV da Oboya Horticulture está nos trazendo insights valiosos. Já enxergamos o potencial de melhor rastreabilidade e movimentação de paletes mais eficiente quando for totalmente implementado.", "El piloto con los sistemas RFID y AGV de Oboya Horticulture nos está aportando información valiosa. Ya vemos el potencial de una mejor trazabilidad y de un movimiento de palets más eficiente una vez implementado por completo.", "与 Oboya Horticulture 的 RFID 和 AGV 系统开展的试点为我们带来了宝贵的洞察。我们已经看到，全面实施后将带来更好的可追溯性和更高效的托盘搬运。"),
    t4Author: homeLoc("Procurement Manager", "Gerente de Compras", "Gerente de Compras", "采购经理"),
    t4Role: homeLoc("LVG Plants", "LVG Plants", "LVG Plants", "LVG Plants"),
    t5Quote: homeLoc("The Oboya Terra transparent Pot helped us create better growing conditions for our plants. The increased substrate volume, improved aeration, and enhanced drainage support healthier root development and have delivered the performance we were looking for. We are very satisfied with the results.", "O vaso transparente Oboya Terra nos ajudou a criar melhores condições de cultivo para nossas plantas. O maior volume de substrato, a melhor aeração e a drenagem aprimorada favorecem um desenvolvimento radicular mais saudável e entregaram o desempenho que buscávamos. Estamos muito satisfeitos com os resultados.", "La maceta transparente Oboya Terra nos ayudó a crear mejores condiciones de cultivo para nuestras plantas. El mayor volumen de sustrato, la mejor aireación y el drenaje mejorado favorecen un desarrollo radicular más sano y han ofrecido el rendimiento que buscábamos. Estamos muy satisfechos con los resultados.", "Oboya Terra 透明花盆帮助我们为植物创造了更好的生长条件。更大的基质容量、更好的透气性和更优的排水性，促进了根系更健康的发育，达到了我们期望的效果。我们对结果非常满意。"),
    t5Author: homeLoc("Geraldo Barendse", "Geraldo Barendse", "Geraldo Barendse", "Geraldo Barendse"),
    t5Role: homeLoc("Brazil", "Brasil", "Brasil", "巴西"),
    t6Quote: homeLoc("The Oboya Ecovaso Tall Pot allowed us to improve transportation efficiency while maintaining an attractive presentation for our products. Being able to transport approximately 20% more pots per trolley represents a significant logistical advantage for our operation.", "O Oboya Ecovaso Tall Pot nos permitiu melhorar a eficiência do transporte mantendo uma apresentação atraente dos nossos produtos. Poder transportar cerca de 20% mais vasos por carrinho representa uma vantagem logística significativa para a nossa operação.", "El Oboya Ecovaso Tall Pot nos permitió mejorar la eficiencia del transporte sin perder una presentación atractiva de nuestros productos. Poder transportar aproximadamente un 20% más de macetas por carro representa una ventaja logística significativa para nuestra operación.", "Oboya Ecovaso Tall Pot 让我们在保持产品陈列美观的同时提高了运输效率。每辆推车可多运约 20% 的花盆，对我们的运营而言是显著的物流优势。"),
    t6Author: homeLoc("Terra Viva", "Terra Viva", "Terra Viva", "Terra Viva"),
    t6Role: homeLoc("Brazil", "Brasil", "Brasil", "巴西"),
    t7Quote: homeLoc("The custom pot holder developed by Oboya helped improve the flow of our production process and made handling mini pots much more efficient. The solution integrated well with our conveyor system and contributed to a smoother operation.", "O suporte de vasos personalizado desenvolvido pela Oboya ajudou a melhorar o fluxo do nosso processo produtivo e tornou o manuseio de minivasos muito mais eficiente. A solução se integrou bem ao nosso sistema de esteiras e contribuiu para uma operação mais fluida.", "El soporte de macetas personalizado desarrollado por Oboya ayudó a mejorar el flujo de nuestro proceso de producción y hizo mucho más eficiente el manejo de minimacetas. La solución se integró bien con nuestro sistema de cintas transportadoras y contribuyó a una operación más fluida.", "Oboya 定制开发的花盆托架改善了我们的生产流程，使迷你花盆的搬运效率大幅提升。该方案与我们的输送系统衔接良好，让运营更加顺畅。"),
    t7Author: homeLoc("Joost Kalanchoe", "Joost Kalanchoe", "Joost Kalanchoe", "Joost Kalanchoe"),
    t7Role: homeLoc("Brazil", "Brasil", "Brasil", "巴西"),
  },
  latestNews: {
    eyebrow: homeLoc("Latest News", "Blog", "Blog", "博客"),
    headline: homeLoc(
      "Learn more about our latest developments and stories from the field in our Latest News section.",
      "Saiba mais sobre nossos últimos desenvolvimentos e histórias do campo no nosso Blog.",
      "Conozca más sobre nuestros últimos desarrollos e historias del campo en nuestro Blog.",
      "在我们的博客中，了解更多最新动态与一线故事。"
    ),
  },
  partners: {
    title: homeLoc(
      "Certifications & Standards",
      "Certificações e Normas",
      "Certificaciones y Normas",
      "认证与标准"
    ),
  },
  homeEcosystem: {
    title: homeLoc("From Propagation to\nRetail Display", "Da Propagação à\nExposição no Varejo", "De la Propagación a la\nExhibición en Retail", "从育苗繁殖到\n零售陈列"),
    bodyP1: homeLoc(
        "Success in horticulture depends on more than individual products.",
        "O sucesso na horticultura depende de mais do que produtos isolados.",
        "El éxito en la horticultura depende de algo más que productos individuales.",
        "园艺行业的成功，不仅仅取决于单一产品。"
      ),
    bodyP2: homeLoc(
        "It depends on how growing, packaging, logistics, transport, retail presentation, and operational processes work together.",
        "Depende de como cultivo, embalagem, logística, transporte, apresentação no varejo e processos operacionais funcionam em conjunto.",
        "Depende de cómo funcionan en conjunto el cultivo, el envasado, la logística, el transporte, la presentación en retail y los procesos operativos.",
        "取决于种植、包装、物流、运输、零售陈列与运营流程如何协同运作。"
      ),
    bodyP3: homeLoc(
        "Oboya Horticulture offers solutions across multiple stages of the horticultural journey, helping customers access the products and expertise they need through a single trusted partner.",
        "A Oboya Horticulture oferece soluções em múltiplas etapas da jornada hortícola, ajudando os clientes a acessar os produtos e a expertise de que precisam por meio de um único parceiro de confiança.",
        "Oboya Horticulture ofrece soluciones en múltiples etapas del recorrido hortícola, ayudando a los clientes a acceder a los productos y la expertise que necesitan a través de un solo socio de confianza.",
        "Oboya Horticulture 在园艺旅程的多个阶段提供解决方案，帮助客户通过同一可信赖的伙伴获得所需的产品与专业支持。"
      ),
    openingLine: homeLoc("Oboya, your one-stop partner for horticulture.", "Oboya, seu parceiro completo em horticultura.", "Oboya, su socio integral en horticultura.", "Oboya，您的园艺一站式合作伙伴。"),
    closingLine1: homeLoc("One Partner, One Ecosystem,", "Um Parceiro, Um Ecossistema,", "Un Socio, Un Ecosistema,", "一个伙伴，一个生态，"),
    closingLine2: homeLoc("Endless Opportunities to Perform Better.", "Oportunidades Infinitas para Render Mais.", "Oportunidades Infinitas para Rendir Mejor.", "无限机遇，成就更佳表现。"),
    slogan: homeLoc("Oboya, your one-stop partner for horticulture.", "Oboya, seu parceiro completo em horticultura.", "Oboya, su socio integral en horticultura.", "Oboya，您的园艺一站式合作伙伴。"),
    stages: {
      propagation: homeLoc("Propagation", "Propagação", "Propagación", "育苗繁殖"),
      growing: homeLoc("Growing", "Cultivo", "Cultivo", "种植"),
      harvest: homeLoc("Harvest", "Colheita", "Cosecha", "采收"),
      packaging: homeLoc("Packaging", "Embalagem", "Empaque", "包装"),
      logistics: homeLoc("Logistics & Transport", "Logística e Transporte", "Logística y Transporte", "物流与运输"),
      retail: homeLoc("Retail Display", "Exposição no Varejo", "Exhibición en Retail", "零售陈列"),
      pos: homeLoc("Point of Sale", "Ponto de Venda", "Punto de Venta", "销售终端"),
    },
    descriptions: {
      propagation: homeLoc("From seed to young plant, with uniform starts that set up every crop.", "Da semente à muda, com um início uniforme que prepara cada cultura.", "De la semilla a la planta joven, con arranques uniformes que sientan las bases de cada cultivo.", "从种子到幼苗，均匀一致的起步为每一茬作物打好基础。"),
      growing: homeLoc("Containers, substrates and irrigation that keep crops healthy in the greenhouse.", "Recipientes, substratos e irrigação que mantêm as culturas saudáveis na estufa.", "Contenedores, sustratos y riego que mantienen los cultivos sanos en el invernadero.", "容器、基质与灌溉系统，让温室作物保持健康。"),
      harvest: homeLoc("Gentle handling that moves produce from the crop to the packhouse.", "Manuseio cuidadoso que leva o produto da cultura até a casa de embalagem.", "Manipulación cuidadosa que lleva el producto del cultivo a la central de empaque.", "轻柔搬运，将农产品从田间送至包装车间。"),
      packaging: homeLoc("Packaging that protects freshness and gives each product shelf presence.", "Embalagens que protegem a frescura e dão presença a cada produto na gôndola.", "Envases que protegen la frescura y dan presencia a cada producto en el lineal.", "守护新鲜度并让每件产品在货架上脱颖而出的包装。"),
      logistics: homeLoc("Trolleys, buckets and automation that keep the cold chain moving.", "Carrinhos, baldes e automação que mantêm a cadeia do frio em movimento.", "Carros, cubos y automatización que mantienen en marcha la cadena de frío.", "推车、水桶与自动化设备，保障冷链顺畅运转。"),
      retail: homeLoc("Displays and shelf-ready formats that put fresh products in front of shoppers.", "Displays e formatos prontos para a gôndola que põem os produtos frescos diante do consumidor.", "Expositores y formatos listos para el lineal que ponen los productos frescos frente al comprador.", "陈列架与货架即用型包装，让新鲜产品直达消费者眼前。"),
      pos: homeLoc("Checkout-ready formats that turn the last step into one more sale.", "Formatos prontos para o caixa que transformam a última etapa em mais uma venda.", "Formatos listos para caja que convierten el último paso en una venta más.", "结账区即用型产品，让最后一步多成交一单。"),
    },
    points: {
      propagation: {
        trays: homeLoc("Propagation trays", "Bandejas de propagação", "Bandejas de propagación", "育苗托盘"),
        substrates: homeLoc("Substrates & plugs", "Substratos e plugs", "Sustratos y plugs", "基质与穴盘苗"),
        seeding: homeLoc("Seeding machines", "Máquinas de semeadura", "Máquinas sembradoras", "播种机"),
      },
      growing: {
        pots: homeLoc("Pots & containers", "Vasos e recipientes", "Macetas y contenedores", "花盆与容器"),
        substrates: homeLoc("Growing substrates", "Substratos de cultivo", "Sustratos de cultivo", "栽培基质"),
        irrigation: homeLoc("Irrigation systems", "Sistemas de irrigação", "Sistemas de riego", "灌溉系统"),
      },
      harvest: {
        crates: homeLoc("Harvest crates", "Caixas de colheita", "Cajas de cosecha", "采收箱"),
        trolleys: homeLoc("Harvest trolleys", "Carrinhos de colheita", "Carros de cosecha", "采收推车"),
        handling: homeLoc("Crop handling", "Manuseio da cultura", "Manejo del cultivo", "作物搬运"),
      },
      packaging: {
        clamshells: homeLoc("Clamshells & punnets", "Clamshells e cestas", "Clamshells y cubetas", "翻盖盒与小果盒"),
        bags: homeLoc("Bags & sleeves", "Sacos e mangas", "Bolsas y fundas", "袋与套袋"),
        labels: homeLoc("Labels", "Etiquetas", "Etiquetas", "标签"),
      },
      logistics: {
        trolleys: homeLoc("Logistic trolleys", "Carrinhos logísticos", "Carros logísticos", "物流推车"),
        buckets: homeLoc("Flower buckets", "Baldes para flores", "Cubos para flores", "鲜花水桶"),
        agv: homeLoc("AGV robotics", "Robótica AGV", "Robótica AGV", "AGV 机器人"),
      },
      retail: {
        displays: homeLoc("Display systems", "Sistemas de exposição", "Sistemas de exhibición", "陈列系统"),
        shelfReady: homeLoc("Shelf-ready packaging", "Embalagens shelf-ready", "Envases listos para lineal", "货架即用型包装"),
        potted: homeLoc("Potted plant displays", "Displays de plantas em vaso", "Expositores de plantas en maceta", "盆栽陈列架"),
      },
      pos: {
        checkout: homeLoc("Checkout displays", "Displays de caixa", "Expositores de caja", "收银台陈列"),
        impulse: homeLoc("Impulse-buy formats", "Formatos para compra por impulso", "Formatos para compra por impulso", "冲动消费型包装"),
        labels: homeLoc("Price & product labels", "Etiquetas de preço e produto", "Etiquetas de precio y producto", "价格与产品标签"),
      },
    },
  },
} as const;
