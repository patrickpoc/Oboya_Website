# 05 — Tipografia

## Objetivo

Documentar famílias, pesos e escala tipográfica oficiais do Brandbook 2026, e a adaptação web atual.

## Contexto

**Oficial.** Duas famílias estruturam a hierarquia:

| Papel | Família (Brandbook) |
|-------|---------------------|
| Main titles | **Neue Haas Grotesk Display** |
| Subtitles and body text | **Plus Jakarta Display** |

## Famílias e pesos

### Neue Haas Grotesk Display

**Oficial** — para títulos principais.

| Aspecto | Status |
|---------|--------|
| Pesos mostrados no Brandbook | Não listados explicitamente para esta família no texto (página focada em Plus Jakarta) |
| Letter-spacing | Não informado |
| Licenciamento / arquivo no repo | Ver implementação abaixo |

### Plus Jakarta Display

**Oficial** — subtítulos e corpo.

Pesos **mostrados** no Brandbook (amostras):

| Peso | Status |
|------|--------|
| Black | Oficial (amostra) |
| Bold | Oficial (amostra) |
| Regular | Oficial (amostra) |

Outros pesos (Medium, SemiBold, ExtraBold): **não informados** como regra; o projeto web carrega 400–800 — ver implementação.

## Escala de referência de layout (oficial)

**Oficial** (Layout Examples). Tamanhos de referência; ajustes ópticos de **±8px** permitidos quando hierarquia, legibilidade ou layout exigirem — sempre com critério intencional e consistência visual.

| Nível | Size | Line height |
|-------|------|-------------|
| Title | 64px | 72px |
| Subtitle and Body | 48px | 56px |
| Tags | 32px | 40px |

> Estes valores são referências de **layout impresso / peça gráfica** do Brandbook, não necessariamente tokens CSS 1:1.

## O que não está informado

| Item | Status |
|------|--------|
| Escala completa para UI (12–14–16–18…) | Não informado |
| Letter-spacing por nível | Não informado |
| Regras específicas para botões, menus, formulários | Não informado |
| Tipografia para CJK (chinês) | Não informado no Brandbook |

## Implementação no produto (não é Brandbook)

Arquivos: `src/lib/fonts.ts`, `src/styles/tokens.css`.

| Papel | Implementação | Divergência |
|-------|---------------|-------------|
| Body | **Plus Jakarta Sans** (next/font), pesos 400–800 | Brandbook diz **Plus Jakarta Display** |
| Display | CSS `--font-display: "Neue Haas Grotesk Display", system-ui` | Fonte **não carregada**; cai em system-ui |
| Chinês | Noto Sans SC | Extensão de produto |
| Escala web | `clamp()` em `--text-display`, `--text-heading`, etc. | Adaptação responsiva; comentário no código cita 64/72, 48/56, 32/40 e ±8px |

Detalhes dos tokens: [10-design-tokens.md](./10-design-tokens.md). Audit: [brand-audit.md](./brand-audit.md).

## Hierarquia recomendada para web (recomendação)

**Recomendação** (não oficial), alinhada à intenção do Brandbook:

| Nível | Família | Uso |
|-------|---------|-----|
| H1 / Display | Neue Haas Grotesk Display | Heros, títulos de seção |
| H2–H3 | Neue Haas ou Plus Jakarta Bold/Black | Subtítulos fortes |
| Body | Plus Jakarta Regular/Medium | Parágrafos, UI |
| Small / caption | Plus Jakarta Regular | Legendas |
| Tags / eyebrow | Plus Jakarta; tracking amplo é padrão de UI atual | Tags 32/40 como referência de peça |

## Boas práticas

- Títulos em Display; corpo em Plus Jakarta.
- Respeitar ±8px só com intenção documentada no layout.
- Não usar amarelo claro para texto longo sobre branco ([04-colors.md](./04-colors.md)).
- Dark Yellow para texto que precisa destacar-se em fundo claro, quando aplicável.

## Restrições

- Não substituir as famílias oficiais por Inter/Roboto/Arial como identidade (exceto fallback técnico temporário).
- Não tratar a escala 64/48/32 como obrigatória em mobile sem adaptação.

## Checklist

- [ ] Título = Neue Haas Grotesk Display (quando licenciada/carregada)
- [ ] Corpo = Plus Jakarta (Display conforme Brandbook; Sans no app até alinhamento)
- [ ] Referência 64/72, 48/56, 32/40 considerada em peças gráficas
- [ ] ±8px justificado se usado

## Referências

- [04-colors.md](./04-colors.md)
- [08-layout.md](./08-layout.md)
- [10-design-tokens.md](./10-design-tokens.md)
- [18-implementation.md](./18-implementation.md)
- [brand-audit.md](./brand-audit.md)
