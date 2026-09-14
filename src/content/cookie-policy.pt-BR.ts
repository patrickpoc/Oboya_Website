import type { LegalSection } from "@/components/legal/LegalDocument";

export const COOKIE_HERO_TITLE_PT = "Política de Cookies";
export const COOKIE_HERO_BODY_PT =
  "Esta Política explica quais cookies e tecnologias semelhantes a Oboya Horticulture utiliza neste site, para quais finalidades, e como você pode gerenciar o seu consentimento.";
export const COOKIE_UPDATED_PT = "14 de setembro de 2026";

export const COOKIE_SECTIONS_PT: LegalSection[] = [
  {
    title: "1. O que esta Política cobre",
    blocks: [
      {
        type: "p",
        text: "Esta Política de Cookies descreve o uso de cookies e tecnologias semelhantes nos sites e serviços digitais da Oboya Horticulture, incluindo o catálogo de produtos.",
      },
      {
        type: "p",
        text: "Ela complementa a Política de Privacidade. As versões de controle são o inglês e o português (Brasil). Para o Brasil, esta versão em português é a referência da LGPD quanto a cookies e consentimento.",
      },
      { type: "contact" },
    ],
  },
  {
    title: "2. O que são cookies",
    blocks: [
      {
        type: "p",
        text: "Cookies são pequenos arquivos armazenados no seu dispositivo quando você visita um site. Tecnologias semelhantes incluem armazenamento local (localStorage) e identificadores de sessão.",
      },
      {
        type: "p",
        text: "Usamos cookies para (i) o funcionamento essencial do site, (ii) lembrar o seu idioma e (iii), apenas com o seu consentimento, medir o uso do site de forma agregada.",
      },
    ],
  },
  {
    title: "3. Como coletamos o seu consentimento",
    blocks: [
      {
        type: "p",
        text: "Na primeira visita, exibimos um aviso de cookies. Cookies estritamente necessários são aplicados automaticamente porque são indispensáveis à operação do site (LGPD, art. 7º, IX — legítimo interesse / execução do serviço solicitado).",
      },
      {
        type: "p",
        text: "Cookies opcionais (analytics de primeira parte) só são ativados se você aceitar todos os cookies, marcar a categoria Analytics e salvar, ou equivalente. Recusar os opcionais não impede a navegação.",
      },
      {
        type: "p",
        text: "A sua escolha é gravada no cookie de primeira parte oboya_cookie_consent (necessário, duração de até 12 meses), com as categorias aceitas, a versão da política e a data. Você pode alterar a escolha a qualquer momento em “Configurações de cookies” no rodapé ou neste aviso.",
      },
    ],
  },
  {
    title: "4. Cookies estritamente necessários",
    blocks: [
      {
        type: "p",
        text: "Estes cookies não exigem consentimento. Sem eles o site não funciona de forma confiável.",
      },
      {
        type: "ul",
        items: [
          "NEXT_LOCALE — idioma selecionado (next-intl); duração de sessão/preferência; primeira parte.",
          "oboya_cookie_consent — registro da sua escolha de cookies; até 12 meses; primeira parte.",
          "Cookies de autenticação Supabase (por exemplo sb-*-auth-token) — somente nas áreas /admin e /auth, para sessão segura do CMS; não são usados no site público.",
        ],
      },
    ],
  },
  {
    title: "5. Cookies e tecnologias de analytics (opcionais)",
    blocks: [
      {
        type: "p",
        text: "Somente após o consentimento carregamos o Vercel Analytics de primeira parte. Ele pode registrar caminho da página, referenciador e país inferido do endereço IP, de forma agregada, para entender o uso do site.",
      },
      {
        type: "ul",
        items: [
          "Vercel Analytics — cookies ou armazenamento local de primeira parte definidos pelo provedor após o aceite; finalidade: estatísticas de audiência; base legal: consentimento (LGPD, art. 7º, I).",
        ],
      },
      {
        type: "p",
        text: "Google Analytics, Google Tag Manager, pixels de redes sociais e cookies de publicidade não estão ativados neste site na data desta Política.",
      },
    ],
  },
  {
    title: "6. Armazenamento local (não é cookie)",
    blocks: [
      {
        type: "p",
        text: "O catálogo (Shop) pode guardar no localStorage do navegador o país, a moeda e os itens da cotação, para manter o seu rascunho de pedido neste dispositivo. Isso não é um cookie de rastreamento e não é compartilhado com anunciantes.",
      },
      {
        type: "p",
        text: "O painel administrativo pode guardar o idioma da interface no localStorage. Isso vale apenas para usuários do CMS.",
      },
    ],
  },
  {
    title: "7. Como gerenciar ou retirar o consentimento",
    blocks: [
      {
        type: "p",
        text: "Use “Configurações de cookies” no rodapé, o aviso de cookies, ou apague os cookies deste site nas configurações do navegador. Apagar cookies fará o aviso reaparecer.",
      },
      {
        type: "p",
        text: "Você também pode bloquear cookies nas configurações do navegador. Bloquear cookies necessários pode impedir o funcionamento de idioma, sessão administrativa ou o próprio registro de consentimento.",
      },
    ],
  },
  {
    title: "8. Atualizações",
    blocks: [
      {
        type: "p",
        text: "Podemos atualizar esta Política quando mudarmos as tecnologias utilizadas. A data no topo da página indica a última revisão. Se a versão do consentimento mudar, o aviso poderá ser exibido novamente.",
      },
    ],
  },
  {
    title: "9. Contato",
    blocks: [
      {
        type: "p",
        text: "Dúvidas sobre cookies ou privacidade: use os dados abaixo ou consulte a Política de Privacidade.",
      },
      { type: "contact" },
    ],
  },
];
