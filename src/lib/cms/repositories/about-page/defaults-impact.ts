import type { AboutPageSettings } from "@/lib/cms/repositories/about-page/types";
import { loc } from "@/lib/cms/repositories/about-page/locale";

export function defaultImpact(): AboutPageSettings["impact"] {
  return {
    title: loc(
      "Oboya Horticulture in Numbers",
      "Oboya Horticulture em Números",
      "Oboya Horticulture en Números",
      "Oboya Horticulture 数据一览"
    ),
    description: loc(
      "Our combination of global manufacturing, strategic sourcing, and local support lets us respond quickly to customer needs while maintaining high-quality standards across multiple markets.",
      "Nossa combinação de manufatura global, sourcing estratégico e suporte local nos permite responder rapidamente às necessidades dos clientes, mantendo altos padrões de qualidade em múltiplos mercados.",
      "Nuestra combinación de manufactura global, sourcing estratégico y soporte local nos permite responder con rapidez a las necesidades de los clientes, manteniendo altos estándares de calidad en múltiples mercados.",
      "凭借全球制造、战略采购与本地支持的结合，我们能快速响应客户需求，并在多个市场保持高品质标准。"
    ),
    stats: [
      {
        id: "countries",
        value: 80,
        suffix: "+",
        icon: "globe",
        accentColor: "#004F7C",
        objectPosition: "center 40%",
        image: {
          src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Earth from space representing global markets",
            "Terra vista do espaço representando mercados globais",
            "Tierra vista desde el espacio representando mercados globales",
            "从太空看地球，象征全球市场"
          ),
        },
        label: loc(
          "Countries Served",
          "Países Atendidos",
          "Países Atendidos",
          "服务国家"
        ),
      },
      {
        id: "manufacturing",
        value: 20,
        suffix: "+",
        icon: "factory",
        accentColor: "#4DAF4E",
        objectPosition: "center 35%",
        image: {
          src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Technician in a manufacturing and production environment",
            "Técnico em ambiente de manufatura e produção",
            "Técnico en un entorno de manufactura y producción",
            "技术人员在制造与生产环境中工作"
          ),
        },
        label: loc(
          "Manufacturing Facilities",
          "Unidades de Manufatura",
          "Instalaciones de Manufactura",
          "制造工厂"
        ),
      },
      {
        id: "offices",
        value: 30,
        suffix: "+",
        icon: "building",
        accentColor: "#009CD4",
        objectPosition: "center 30%",
        image: {
          src: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Modern regional office interior with workstations",
            "Interior de escritório regional moderno com estações de trabalho",
            "Interior de oficina regional moderna con estaciones de trabajo",
            "现代化区域办公室内的工位"
          ),
        },
        label: loc(
          "Regional Offices",
          "Escritórios Regionais",
          "Oficinas Regionales",
          "区域办事处"
        ),
      },
      {
        id: "employees",
        value: 1400,
        suffix: "+",
        icon: "users",
        accentColor: "#01203F",
        objectPosition: "center 30%",
        image: {
          src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Diverse team collaborating around a shared workspace",
            "Equipe diversa colaborando em um espaço de trabalho compartilhado",
            "Equipo diverso colaborando en un espacio de trabajo compartido",
            "多元化团队在共享工作空间中协作"
          ),
        },
        label: loc(
          "Employees Worldwide",
          "Colaboradores no Mundo",
          "Empleados en el Mundo",
          "全球员工"
        ),
      },
      {
        id: "clients",
        value: 1,
        suffix: "m+",
        icon: "handshake",
        accentColor: "#ea5744",
        objectPosition: "center 30%",
        image: {
          src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Partners shaking hands after a successful agreement",
            "Parceiros apertando as mãos após um acordo bem-sucedido",
            "Socios estrechándose la mano tras un acuerdo exitoso",
            "合作伙伴在达成协议后握手"
          ),
        },
        label: loc(
          "Clients Served",
          "Clientes Atendidos",
          "Clientes Atendidos",
          "服务客户"
        ),
      },
      {
        id: "products",
        value: 20,
        suffix: "+",
        icon: "package",
        accentColor: "#75C566",
        objectPosition: "center 45%",
        image: {
          src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Horticulture products and plants arranged in a greenhouse",
            "Produtos de horticultura e plantas organizados em uma estufa",
            "Productos de horticultura y plantas organizados en un invernadero",
            "温室中排列的园艺产品与植物"
          ),
        },
        label: loc(
          "Product Categories",
          "Categorias de Produto",
          "Categorías de Producto",
          "产品类别"
        ),
      },
      {
        id: "years",
        value: 20,
        suffix: "+",
        icon: "calendar",
        accentColor: "#909B03",
        objectPosition: "center 40%",
        image: {
          src: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1400&auto=format&fit=crop",
          alt: loc(
            "Cultivated field reflecting decades of horticulture experience",
            "Campo cultivado refletindo décadas de experiência em horticultura",
            "Campo cultivado que refleja décadas de experiencia en horticultura",
            "农田景象，象征数十年园艺经验"
          ),
        },
        label: loc(
          "Years Supporting Horticulture",
          "Anos Apoiando a Horticultura",
          "Años Apoyando la Horticultura",
          "服务园艺行业年数"
        ),
      },
    ],
  };
}
