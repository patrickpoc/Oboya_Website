# 13 — Acessibilidade

## Objetivo

Registrar requisitos de legibilidade/contraste presentes no Brandbook e recomendações WCAG para o produto digital.

## Contexto

O Brandbook aborda acessibilidade sobretudo via **contraste de cor em texto** e **overlays sobre imagem**. Não é um manual WCAG.

## Oficial (Brandbook)

| Regra | Detalhe |
|-------|---------|
| Amarelo sobre branco | **Nunca** — contraste insuficiente |
| Foto / vídeo de fundo | Adicionar **opacidade/overlay** quando necessário para texto totalmente legível |
| Dark Yellow | Usar quando texto precisa destacar-se em fundo claro |

## Inferido

- Soft White / White como superfícies de leitura limpas.
- Dark Blue para texto corporativo implica contraste alto sobre fundos claros.
- Texto branco sobre Main Blue / Dark Blue / foto com véu escuro (comum nas peças e no site).

## Não informado

| Tema | Status |
|------|--------|
| Razão de contraste mínima (WCAG AA/AAA) | Não informado |
| Tamanho mínimo de toque | Não informado |
| Foco de teclado / ARIA | Não informado |
| Alt text / legendas | Não informado |

## Recomendações (WCAG — não Brandbook)

**Recomendação.**

1. Mirar WCAG 2.2 AA em texto de UI (contraste ≥ 4.5:1 corpo; ≥ 3:1 texto grande).
2. Validar Light Yellow e Light Green como texto — frequentemente falham em branco; preferir Dark Yellow / Main Blue / Dark Blue para copy.
3. Manter overlay em heroes fotográficos até o texto passar em contraste.
4. Não depender só de cor para estado (erro, sucesso).
5. Respeitar `prefers-reduced-motion` ([12-motion.md](./12-motion.md)).

## Boas práticas

- Testar pares de cor oficiais antes de publicar.
- Em social, garantir título dentro da safe zone **e** com contraste.

## Checklist

- [ ] Sem amarelo claro sobre branco
- [ ] Overlay em texto sobre foto
- [ ] Contraste AA verificado nos pares críticos
- [ ] Foco visível em controles interativos (produto)

## Referências

- [04-colors.md](./04-colors.md)
- [07-imagery.md](./07-imagery.md)
- [17-do-and-dont.md](./17-do-and-dont.md)
