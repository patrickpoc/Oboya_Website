# 10 — Design tokens

## Objetivo

Mapear a identidade oficial para tokens técnicos do repositório Oboya (CSS / Tailwind / TypeScript).

## Contexto

Tokens vivem principalmente em:

- `src/styles/tokens.css` — paleta, tipo, spacing, shadows, glass
- `src/app/globals.css` — `@theme inline` (Tailwind) + tokens semânticos shadcn
- `src/constants/colors.ts` — espelho TS da paleta (pouco usado no app)

## Legenda

| Tipo | Significado |
|------|-------------|
| Oficial | Valor do Brandbook |
| Extensão | Necessário ao produto; não está no Brandbook |
| Divergente | Conflita ou extrapola o Brandbook — ver [brand-audit.md](./brand-audit.md) |

## Cores de marca → CSS

| Brandbook | HEX | CSS variable | Tailwind |
|-----------|-----|--------------|----------|
| Main Green | `#4DAF4E` | `--oboya-green` | `oboya-green` |
| Light Green | `#75C566` | `--oboya-green-light` | `oboya-green-light` |
| Main Blue | `#004F7C` | `--oboya-blue` | `oboya-blue` |
| Light Blue | `#009CD4` | `--oboya-blue-light` | `oboya-blue-light` |
| Dark Blue | `#01203F` | `--oboya-blue-dark` | `oboya-blue-dark` |
| Soft White | `#F1F5F1` | `--oboya-soft-white` | `oboya-soft-white` |
| Light Yellow | `#DBE64C` | `--oboya-yellow-light` | `oboya-yellow-light` |
| Dark Yellow | `#909B03` | `--oboya-yellow-dark` | `oboya-yellow-dark` |
| Orange Red | `#EA5744` | `--oboya-orange` | `oboya-orange` |

**Oficial** nos HEX. Nomes de token = convenção de engenharia (**extensão**).

## Tokens semânticos (shadcn) — extensão

Definidos em `globals.css` `:root` (valores hex duplicados, não `var(--oboya-*)`):

| Token | Valor | Relação com marca |
|-------|--------|-------------------|
| `--primary` | `#004f7c` | Main Blue |
| `--ring` | `#4daf4e` | Main Green |
| `--destructive` | `#ea5744` | Orange Red |
| `--secondary` / `--muted` / `--accent` | `#f1f5f1` | Soft White |
| `--foreground` | `#01203f` | Dark Blue |
| `--muted-foreground` | `#4a6278` | **Extensão / fora da paleta oficial** |
| `--border` / `--input` | `#e2e8e2` | **Extensão / fora da paleta oficial** |
| `--background` | `#ffffff` | White (permitido) |

## Tipografia → tokens

| Token | Valor atual | Nota |
|-------|-------------|------|
| `--font-display` | `"Neue Haas Grotesk Display", system-ui` | Oficial no nome; arquivo não carregado |
| `--font-body` | Plus Jakarta Sans (next/font) | Divergente do nome “Display” do Brandbook |
| `--text-display` | `clamp(2.5rem, 5vw + 1rem, 4rem)` | Adaptação web da ref. 64px |
| `--text-heading` | `clamp(2rem, 3vw + 0.5rem, 3rem)` | Extensão |
| `--text-subtitle` | `clamp(1.25rem, 1.5vw + 0.5rem, 1.5rem)` | Extensão |
| `--text-body` | `1.0625rem` | Extensão |
| `--text-small` | `0.875rem` | Extensão |
| `--text-tag` | `clamp(1rem, 1vw + 0.5rem, 2rem)` | Ref. tags 32px |

Comentário no código cita Brand Guidelines 2026 e ±8px — alinhado à intenção oficial.

## Spacing / elevation / glass

| Token | Classificação |
|-------|----------------|
| `--section-y`, `--container-*`, `--nav-padding-x` | Extensão produto |
| `--shadow-subtle`, `--shadow-card`, `--shadow-nav` | Extensão (sombra “subtle” ecoa Brandbook) |
| `--glass-bg`, `--glass-border`, `--glass-blur` | Extensão; pouco usados |
| `--radius` (globals) | Extensão shadcn |

## TypeScript `brandColors`

```ts
// src/constants/colors.ts — espelho oficial dos HEX
mainGreen, lightGreen, mainBlue, lightBlue, darkBlue,
softWhite, lightYellow, darkYellow, orangeRed, white
```

**Recomendação.** Preferir CSS variables na UI; usar `brandColors` só onde JS precisar de hex (charts, canvas). Evitar hex soltos em componentes.

## Boas práticas

- UI de marca: classes `bg-oboya-*`, `text-oboya-*`, ou `var(--oboya-*)`.
- Não introduzir cores fora da tabela oficial sem registrar no audit.
- Ao adicionar token, documentar se é Oficial ou Extensão neste arquivo e no changelog.

## Checklist

- [ ] Novas cores = só paleta oficial (ou extensão justificada + audit)
- [ ] Sem hex mágicos em componentes de marketing
- [ ] Display font carregada quando a licença permitir

## Referências

- [04-colors.md](./04-colors.md)
- [05-typography.md](./05-typography.md)
- [18-implementation.md](./18-implementation.md)
- [brand-audit.md](./brand-audit.md)
