# 18 — Implementação no repositório

## Objetivo

Guia prático para aplicar a identidade Oboya no código do projeto Next.js.

## Contexto

Stack relevante: Next.js App Router, Tailwind v4, tokens CSS, next/font, next-intl, componentes em `src/components`.

## Arquivos-chave

| Arquivo | Função |
|---------|--------|
| `src/styles/tokens.css` | Paleta, type scale, spacing, shadows, glass |
| `src/app/globals.css` | Theme Tailwind + tokens semânticos shadcn |
| `src/constants/colors.ts` | HEX em TypeScript |
| `src/lib/fonts.ts` | Plus Jakarta Sans + Noto Sans SC |
| `src/components/brand/Logo.tsx` | Logo default / light |
| `public/assets/logo.svg` | Asset do wordmark |
| `docs/brand/*` | Esta documentação (SSOT) |

## Cores na UI

```tsx
// Preferir utilities Tailwind mapeadas
<div className="bg-oboya-soft-white text-oboya-blue-dark" />
<button className="rounded-full bg-oboya-green text-white" />

// Ou CSS variables
style={{ color: "var(--oboya-green)" }}
```

Evitar hex literais (`bg-[#dceee0]`) em superfícies de marca.

## Tipografia

```tsx
<h1 className="font-display text-[length:var(--text-display)] leading-[var(--text-display-leading)]">
  Título
</h1>
<p className="font-body text-[length:var(--text-body)]">Corpo</p>
```

**Atenção:** Neue Haas Grotesk Display está nomeada em `--font-display` mas **ainda não é carregada** via `next/font` — ver [brand-audit.md](./brand-audit.md).

## Logo

```tsx
import { Logo } from "@/components/brand/Logo";

<Logo />                    // fundos claros
<Logo variant="light" />    // fundos escuros (invert CSS)
```

Respeitar clear space visualmente ao posicionar ao lado de outros elementos.

## Checklist de PR (engenharia)

- [ ] Sem novas cores fora da paleta oficial (ou justificativa + update no audit)
- [ ] Tokens/`oboya-*` em vez de hex mágicos
- [ ] Logo via componente
- [ ] Contraste de texto (sem amarelo em branco; overlay em foto)
- [ ] i18n não quebra hierarquia tipográfica
- [ ] `prefers-reduced-motion` se houver animação nova
- [ ] Se alterar tokens, atualizar [10-design-tokens.md](./10-design-tokens.md) e [20-changelog.md](./20-changelog.md)

## Ambientes e temas

- Site marketing: fundos Soft White / White / heroes dark com overlay
- Admin: sidebar Soft White + primary Main Blue (extensão de produto)

## Boas práticas

- Consultar [17-do-and-dont.md](./17-do-and-dont.md) no review visual.
- Tratar Brandbook como fonte oficial; código como implementação.

## Referências

- [10-design-tokens.md](./10-design-tokens.md)
- [11-components.md](./11-components.md)
- [19-checklist.md](./19-checklist.md)
- [brand-audit.md](./brand-audit.md)
