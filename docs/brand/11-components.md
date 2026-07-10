# 11 — Componentes

## Objetivo

Separar elementos visuais **oficiais do Brandbook** dos **componentes de produto** já implementados no site — sem inventar specs oficiais inexistentes.

## Contexto

O Brandbook não é um design system de UI completo (não especifica Button, Input, Modal, etc.). Ele define shapes, tags tipográficas, outlines, shadows e aplicações (email, booth, social).

## Elementos oficiais do Brandbook

| Elemento | Documento | Notas |
|----------|-----------|--------|
| Logo (Light/Dark) | [03-logo.md](./03-logo.md) | Clear space = altura do O |
| Paleta / accents | [04-colors.md](./04-colors.md) | Golden rules |
| Tipografia / tags | [05-typography.md](./05-typography.md) | Title / Subtitle / Tags |
| Leaf / Circle / Tag shapes | [07-imagery.md](./07-imagery.md) | Destaque de imagem ou texto |
| Outlines & shadows | [06-iconography.md](./06-iconography.md) | Traço coerente; sombra suave |
| Safe zones social | [08-layout.md](./08-layout.md) | Formatos Reels/grid |
| Email signature | [08-layout.md](./08-layout.md) | Exemplo |
| Booth | [08-layout.md](./08-layout.md) | 80 cm |

### Componentes oficiais ausentes como spec

Button, Input, Card, Badge, Modal, Table, Navbar, Footer, Alert, Chart — **não informados** como componentes oficiais no Brandbook.

**Recomendação futura:** especificar esses padrões de UI em adendo de Design System, sempre ancorados nos tokens oficiais.

## Componentes de produto (implementação)

Localização típica: `src/components/ui/*`, `src/components/layouts/*`, `src/components/sections/*`, `src/components/brand/*`.

| Área | Exemplos | Relação com marca |
|------|----------|-------------------|
| Brand | `Logo.tsx` | Asset + variantes |
| Primitivos shadcn | Button, Badge, Card, Input, Select, Dialog, Sheet, Tabs, Table, Checkbox, Switch, Accordion… | Cores semânticas → ver tokens |
| Layout | Navbar, Footer, LanguageSwitcher, Container, SectionTitle | Uso intensivo de `oboya-*` |
| Marketing | Hero, CTA, Featured Products, Map, News… | CTAs frequentemente `bg-oboya-green` |
| Shop / Admin | Padrões próprios sobre a mesma base | Extensão de produto |

### Observação de CTA (implementação)

- `Button` default (shadcn) → `--primary` = **Main Blue**
- CTAs de marketing (Navbar Contact, etc.) → frequentemente **Main Green**

Ambos são primary oficiais no Brandbook; **não há regra oficial** de qual usar em botões. Ver [brand-audit.md](./brand-audit.md) e recomendação em [15-ui-principles.md](./15-ui-principles.md).

## Gradientes, bordas, raios

| Item | Brandbook | Produto |
|------|-----------|---------|
| Gradientes | Não informado como sistema | Usados pontualmente (heroes, overlays) |
| Border radius | Não informado | `--radius` shadcn (extensão) |
| Bordas | Não informado | `--border` `#e2e8e2` (extensão) |

## Boas práticas

- Novos componentes de UI devem consumir tokens `oboya-*` / semânticos documentados.
- Shapes Leaf/Circle/Tag: implementar só com arte aprovada e função correta.
- Não apresentar componentes shadcn como “oficiais do Brandbook”.

## Restrições

- Não inventar estados/variantes “oficiais” sem base no PDF ou adendo.
- Não usar cores fora da paleta em componentes de marca.

## Checklist

- [ ] Componente usa tokens oficiais ou extensão documentada
- [ ] Se for shape de marca, função Leaf/Circle/Tag respeitada
- [ ] CTA consciente (green vs blue) e consistente no fluxo

## Referências

- [10-design-tokens.md](./10-design-tokens.md)
- [15-ui-principles.md](./15-ui-principles.md)
- [18-implementation.md](./18-implementation.md)
- [brand-audit.md](./brand-audit.md)
