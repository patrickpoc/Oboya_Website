# 08 — Layout

## Objetivo

Documentar referências de layout do Brandbook: tipografia em peça, social safe zones, merchandising, email e feiras.

## Contexto

O Brandbook combina exemplos de composição gráfica com formatos de canal (social, booth, email).

## Referências tipográficas em layout (oficial)

Ver também [05-typography.md](./05-typography.md).

| Nível | Size | Line height | Ajuste |
|-------|------|-------------|--------|
| Title | 64px | 72px | ±8px óptico permitido |
| Subtitle and Body | 48px | 56px | ±8px |
| Tags | 32px | 40px | ±8px |

Só as restrições especificadas são estritas; o restante é interpretação do designer.

## Social media — safe zones (oficial)

| Formato | Dimensão | Uso |
|---------|----------|-----|
| Full size | 1080×1920 | Preview full de Reels |
| In Feed (Regular) | 1080×1728 | Reels no feed regular |
| New Profile Grid | 1080×1440 | Grid de perfil (update 2025) |
| In Feed (Boosted) | 1080×1350 | Reels boosted no feed |
| Old Profile Grid | 1080×1080 | Grid antigo (pré-2025) |

Manter conteúdo crítico (logo, título, CTA) dentro das safe zones ilustradas no Brandbook.

**Nota:** Dark Blue institucional **não** deve aparecer em social media como cor de conteúdo institucional ([04-colors.md](./04-colors.md)).

## Merchandising

**Oficial.** Seção “Merchandising” presente (páginas majoritariamente visuais).

**Não informado (texto):** lista de SKUs, templates ou medidas de cada item.

## Assinatura de email (oficial — exemplo)

Exemplo no Brandbook:

- Nome: Woyn Tesfaye  
- Cargo: Global Sales Assistant  
- Email: woyn@oboya.cc  
- Telefone: +251 911 679 615  
- WeChat: woyn  

**Inferido:** estrutura = logo + nome + cargo + contato. Template HTML oficial: **não informado** além do exemplo visual.

## Feiras e eventos — booth (oficial)

| Regra | Detalhe |
|-------|---------|
| Espaço livre inferior | Deixar **80 cm** de altura livre para mesas/cadeiras quando necessário |
| Imagens de produto | Claras e em qualidade de impressão |
| QR codes | Posicionados de forma fácil de ver |
| Layout | Referência de stand padrão; sujeito a mudança conforme conteúdo, dimensões e painéis |

## Grid e layout web

**Não informado** no Brandbook (colunas, breakpoints, container).

**Implementação atual:** `--container-max: 80rem`, `--container-padding`, `--section-y` — ver [09-spacing.md](./09-spacing.md) e [10-design-tokens.md](./10-design-tokens.md).

## Boas práticas

- Peças gráficas: partir da escala 64 / 48 / 32 e ajustar ±8px com intenção.
- Social: exportar nos cinco formatos ou garantir safe zone no mais restritivo.
- Stands: reservar 80 cm na base; QR legível à distância.

## Restrições

- Não ignorar safe zones de Reels/grid.
- Não tratar o exemplo de booth como planta obrigatória única.

## Checklist

- [ ] Escala tipográfica de referência considerada
- [ ] Formato social correto + safe zone
- [ ] Booth: 80 cm + print quality + QR visível
- [ ] Email: dados e hierarquia claros com logo

## Referências

- [05-typography.md](./05-typography.md)
- [07-imagery.md](./07-imagery.md)
- [09-spacing.md](./09-spacing.md)
- [16-best-practices.md](./16-best-practices.md)
