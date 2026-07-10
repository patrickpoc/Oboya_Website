# Oboya Horticulture — Identidade Visual (SSOT)

Documentação oficial da identidade visual da **Oboya Horticulture**, derivada do **Brandbook 2026** e cruzada com a implementação atual da plataforma web.

Esta pasta é a **Single Source of Truth (SSOT)** para designers, desenvolvedores e parceiros que aplicam a marca em canais digitais e físicos.

## Fonte oficial

| Fonte | Papel |
|-------|--------|
| *Oboya Horticulture Brandbook 2026* (PDF) | Identidade visual oficial |
| Código do repositório (`src/styles/tokens.css`, componentes) | Implementação atual — ver [brand-audit.md](./brand-audit.md) |

> Em caso de conflito entre Brandbook e código, **prevalece o Brandbook**. A divergência deve ser registrada no audit e corrigida no produto.

## Como ler esta documentação

Cada afirmação deve ser lida com uma destas etiquetas:

| Etiqueta | Significado |
|----------|-------------|
| **Oficial** | Extraído explicitamente do Brandbook 2026 |
| **Inferido** | Derivado de exemplos, diagramas ou aplicação consistente no Brandbook / código alinhado ao PDF |
| **Recomendação** | Proposta técnica (design system / web) — **não** é regra oficial da marca |
| **Não informado** | Lacuna no Brandbook; não inventar |

## Índice

| # | Documento | Conteúdo |
|---|-----------|----------|
| 01 | [Visão geral](./01-brand-overview.md) | Propósito do Brandbook, escopo, pilares citados |
| 02 | [Estratégia](./02-brand-strategy.md) | Posicionamento disponível; lacunas de missão/voz |
| 03 | [Logo](./03-logo.md) | Clear space, versões Light/Dark, assets |
| 04 | [Cores](./04-colors.md) | Paleta completa, hierarquia, golden rules |
| 05 | [Tipografia](./05-typography.md) | Famílias, pesos, escala de referência |
| 06 | [Iconografia](./06-iconography.md) | Estilo de ícones e outlines |
| 07 | [Imagem](./07-imagery.md) | Fotografia, moodboards, shapes |
| 08 | [Layout](./08-layout.md) | Exemplos, social, feiras, email |
| 09 | [Espaçamento](./09-spacing.md) | Clear space, ópticos, booth |
| 10 | [Design tokens](./10-design-tokens.md) | Mapeamento Brandbook → CSS/Tailwind |
| 11 | [Componentes](./11-components.md) | Elementos oficiais + UI do produto |
| 12 | [Motion](./12-motion.md) | Lacuna oficial + implementação atual |
| 13 | [Acessibilidade](./13-accessibility.md) | Contraste e overlays |
| 14 | [Redação](./14-writing-guidelines.md) | Nome da marca; lacunas de tom |
| 15 | [Princípios de UI](./15-ui-principles.md) | Princípios inferidos das golden rules |
| 16 | [Boas práticas](./16-best-practices.md) | Síntese operacional por canal |
| 17 | [Do & Don't](./17-do-and-dont.md) | Restrições explícitas do Brandbook |
| 18 | [Implementação](./18-implementation.md) | Como aplicar no repositório |
| 19 | [Checklist](./19-checklist.md) | Validação por tipo de entrega |
| 20 | [Changelog](./20-changelog.md) | Histórico desta documentação |
| — | [Brand audit](./brand-audit.md) | Conformidades e divergências código × marca |

## Público-alvo

- **Designers** — regras de aplicação, restrições, exemplos
- **Desenvolvedores** — tokens, classes, componentes, checklist de PR
- **Marketing / parceiros** — social, merchandising, feiras, assinatura de email

## Contribuição

1. Alterações de identidade partem de atualização do Brandbook (ou adendo oficial).
2. Atualize o(s) arquivo(s) Markdown correspondentes e o [20-changelog.md](./20-changelog.md).
3. Se o código divergir, atualize [brand-audit.md](./brand-audit.md) e abra correção no produto.

## Checklist rápido (antes de publicar qualquer peça)

- [ ] Cores estruturais = Main Blue + Main Green (e neutros White / Soft White)
- [ ] No máximo **um** accent por peça (Light Yellow **ou** Orange Red), ≤ 25% da área
- [ ] Dark Blue não usado como fundo primário em grandes formatos
- [ ] Nunca texto amarelo sobre fundo branco
- [ ] Clear space do logo respeitado (altura do “O”)
- [ ] Tipografia: Neue Haas Grotesk Display (títulos) + Plus Jakarta (corpo)

---

*Documentação v1.0 — Brandbook 2026*
