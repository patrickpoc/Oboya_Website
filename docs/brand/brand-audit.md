# Brand audit — código × Brandbook 2026

## Objetivo

Comparar a implementação atual da plataforma Oboya com o Brandbook oficial. Em divergência, **prevalece o Brandbook**; o código deve ser alinhado depois.

## Escopo auditado

- `src/styles/tokens.css`
- `src/app/globals.css`
- `src/constants/colors.ts`
- `src/lib/fonts.ts`
- `src/components/brand/Logo.tsx`
- Uso de cores em layouts/seções (amostra: Navbar, FeaturedProducts, timeline)
- Assets em `public/assets/logo.svg`

## Legenda de prioridade

| Prioridade | Significado |
|------------|-------------|
| **P0** | Quebra identidade ou regra explícita — corrigir primeiro |
| **P1** | Inconsistência sistêmica — padronizar no próximo ciclo |
| **P2** | Gap de asset / documentação visual |
| **P3** | Melhoria / higiene |

---

## Conformidades

| Item | Evidência |
|------|-----------|
| HEX da paleta oficial no CSS | `--oboya-green` … `--oboya-orange` = Brandbook |
| Soft White / Main Blue / Main Green / etc. | Alinhados a `#F1F5F1`, `#004F7C`, `#4DAF4E`, … |
| Comentários citando Brand Guidelines 2026 | `tokens.css`, `colors.ts` |
| Type scale web referencia 64/72, 48/56, 32/40 e ±8px | Comentário em `tokens.css` |
| White como neutro | `brandColors.white`, `--background: #ffffff` |
| Orange Red como destructive | `--destructive: #ea5744` |
| Logo SVG com Main Blue + Main Green | `public/assets/logo.svg` |
| Overlay em heroes/timeline para legibilidade | Padrão de `oboya-blue-dark` com opacidade |
| CTAs verdes usam Main Green oficial | Navbar Contact, etc. |

---

## Inconsistências

### 1. Neue Haas Grotesk Display não carregada — P0

| | |
|--|--|
| **Brandbook** | Títulos em Neue Haas Grotesk Display |
| **Código** | `--font-display` declara a família, mas `fonts.ts` só carrega Plus Jakarta Sans + Noto Sans SC → fallback `system-ui` |
| **Ação** | Licenciar e carregar a fonte (local/`next/font`) ou documentar fallback temporário aprovado |

### 2. Plus Jakarta Display vs Plus Jakarta Sans — P1

| | |
|--|--|
| **Brandbook** | “Plus Jakarta **Display**” para subtítulo/corpo |
| **Código** | `Plus_Jakarta_Sans` (Google Fonts) |
| **Ação** | Confirmar com brand se Sans é aceitável no digital; se não, obter Display |

### 3. CTA Green vs Button primary Blue — P1

| | |
|--|--|
| **Brandbook** | Ambos Blue e Green são primary; sem regra de botão |
| **Código** | shadcn `primary` = Main Blue; marketing CTAs = Main Green |
| **Ação** | Formalizar regra de CTA no DS ([15-ui-principles.md](./15-ui-principles.md) tem recomendação) |

### 4. Neutros extras fora da paleta — P1

| Token / valor | Nota |
|---------------|------|
| `--muted-foreground: #4a6278` | Não está no Brandbook |
| `--border` / `--input: #e2e8e2` | Não está no Brandbook |

**Ação:** derivar de Soft White / Dark Blue com opacidade, ou registrar como extensão aprovada.

### 5. Cor hardcoded fora da paleta — P0

| Local | Valor |
|-------|--------|
| `FeaturedProducts.tsx` (relatado) | `bg-[#dceee0]` |

**Ação:** substituir por Soft White, Light Green com opacidade, ou token oficial.

### 6. Hex duplicados / `brandColors` subutilizado — P2

- Semânticos em `globals.css` repetem HEX em vez de `var(--oboya-*)`.
- `brandColors` em TS quase sem imports; timeline e outros podem hardcodar hex.

**Ação:** single source via CSS variables; TS só quando necessário.

### 7. Shadows / glass ad hoc — P3

Tokens `--shadow-*` e `--glass-*` existem, mas Navbar/timeline usam `shadow-[…]` e `rgba` soltos.

**Ação:** consolidar em tokens.

### 8. Logo Light/Dark sem arte separada — P2

| Brandbook | Light e Dark oficiais |
| Código | Um SVG + `brightness-0 invert` |

**Ação:** exportar SVGs oficiais Light/Dark (e símbolo, se houver).

### 9. Dark Blue como fundo large-format no web — P1 (tensão)

| Brandbook | Dark Blue nunca como primary background em large formats |
| Código | Heroes / timeline full-bleed `bg-oboya-blue-dark` |

**Interpretação:** regra escrita no contexto de peças de marca; o site trata dark hero como padrão de produto.  

**Ação:** obter validação de brand (exceção digital documentada) ou reduzir uso a overlays sobre foto, não fill sólido institucional em marketing social/packaging.

### 10. Escala tipográfica web ≠ 48/56 print — OK com nota

Esperado. Adaptação via `clamp` + ±8px. Manter comentário de rastreabilidade.

### 11. Errata do PDF (Dark Blue RGB) — P2 (documentação)

HEX `#01203F` vs RGB impresso `0,79,124`. Código usa HEX corretamente. Ver [04-colors.md](./04-colors.md).

---

## Itens ausentes

### No Brandbook (lacunas)

- Missão, visão, valores formais, tom de voz, storytelling
- Redução mínima do logo, favicon, grid de construção, galeria textual de usos incorretos
- Specs de componentes UI (Button, Input, …)
- Motion system
- Escala de spacing UI
- Prints anexados para enriquecer páginas visuais

### No repositório

- Arquivo de fonte Neue Haas
- Assets logo Light/Dark separados
- Primitivos Leaf / Tag shape
- Favicon alinhado ao isotype (confirmar estado atual do app icon)
- Uso consistente de `brandColors`

---

## Oportunidades de padronização

1. **P0** — Carregar Neue Haas; remover `#dceee0` e quaisquer hex fora da paleta.
2. **P1** — Unificar CTA (green/blue); ligar semânticos a `var(--oboya-*)`; decidir Dark Blue full-bleed.
3. **P2** — Arte logo Light/Dark; shapes oficiais; limpar duplicação de tokens.
4. **P3** — Motion guidelines internas; glass/shadow únicos; adendo de writing.

---

## Sugestões de padronização (recomendação)

| Tema | Sugestão |
|------|----------|
| Import de cor | Sempre `oboya-*` ou token semântico documentado |
| PR template | Checkbox do [19-checklist.md](./19-checklist.md) |
| Storybook / preview | Swatch da paleta oficial |
| CI (opcional) | Lint de hex não permitidos em `src/components` |

---

## Resumo executivo

A base cromática do produto **está majoritariamente alinhada** ao Brandbook. Os maiores gaps são **tipografia Display não carregada**, **algumas cores/neutros de engenharia fora da paleta**, **tensão Dark Blue full-bleed**, e **ausência de verbal identity** no PDF (não é falha do código).

Próximo passo de produto: fechar P0 tipografia + hex fora da paleta; em seguida P1 CTA/tokens.

---

## Referências

- [README.md](./README.md)
- [04-colors.md](./04-colors.md)
- [05-typography.md](./05-typography.md)
- [10-design-tokens.md](./10-design-tokens.md)
- [18-implementation.md](./18-implementation.md)
