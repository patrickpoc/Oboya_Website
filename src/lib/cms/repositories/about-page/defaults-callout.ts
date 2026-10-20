import type { AboutPageSettings } from "@/lib/cms/repositories/about-page/types";
import { loc } from "@/lib/cms/repositories/about-page/locale";

export function defaultCallout(): AboutPageSettings["callout"] {
  return {
    segments: [
      {
        text: loc(
          "More Than a Supplier",
          "Mais que um Fornecedor",
          "Más que un Proveedor",
          "不止是供应商"
        ),
        tone: "white",
        breakBefore: false,
      },
    ],
    body: loc(
      "Many suppliers focus on individual categories. Oboya Horticulture takes a wider perspective. By offering solutions across multiple stages of the horticultural journey, we help customers improve efficiency, protect quality, optimize resources, and create long-term value throughout their operations.",
      "Muitos fornecedores focam em categorias individuais. A Oboya Horticulture tem uma perspectiva mais ampla. Ao oferecer soluções em múltiplas etapas da jornada hortícola, ajudamos os clientes a melhorar a eficiência, proteger a qualidade, otimizar recursos e criar valor de longo prazo em todas as suas operações.",
      "Muchos proveedores se centran en categorías individuales. Oboya Horticulture adopta una perspectiva más amplia. Al ofrecer soluciones en múltiples etapas del recorrido hortícola, ayudamos a los clientes a mejorar la eficiencia, proteger la calidad, optimizar recursos y crear valor a largo plazo en todas sus operaciones.",
      "许多供应商专注于单一品类。Oboya Horticulture 拥有更广阔的视角。通过在园艺旅程的多个阶段提供解决方案，我们帮助客户提升效率、保障品质、优化资源，并在整个运营中创造长期价值。"
    ),
  };
}
