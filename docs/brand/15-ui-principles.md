# 15 — Princípios de UI

## Objetivo

Traduzir as golden rules do Brandbook em princípios objetivos para interfaces — marcados como **inferidos**, não como capítulo oficial de UI.

## Contexto

O Brandbook não define “UI principles”. Os itens abaixo são **inferidos** a partir de Color System, tipografia, shapes e fotografia.

## Princípios (inferidos do Brandbook)

### 1. Estrutura primeiro (Blue + Green)

Toda composição começa com **Main Blue** e **Main Green**. Neutros de superfície: **White** ou **Soft White**.

**Na UI:** fundos de página claros em Soft White/White; acentos estruturais em blue/green; evitar “tema roxo” ou neutros inventados.

### 2. Um accent, com intenção

Light Yellow **ou** Orange Red — nunca ambos; ≤ 25% da área; nunca como fundo grande.

**Na UI:** um accent por view/hero; CTAs sazonais com um único highlight.

### 3. Dark Blue com disciplina

Para profundidade, contraste e texto corporativo — não como wash de fundo em large format.

**Na UI:** hero dark full-bleed é comum no produto; tratar como **exceção de produto** a reconciliar com a golden rule (ver audit). Preferir Dark Blue em tipografia/contraste e overlays, não como “cor de marca de preenchimento” em peças sociais/packaging.

### 4. Legibilidade acima de estética

Nunca amarelo sobre branco; overlay em foto quando preciso.

### 5. Hierarquia tipográfica clara

Display (Neue Haas) para títulos; Plus Jakarta para corpo; tags menores.

### 6. Formas com função

Leaf / Circle = destacar imagem; Tag shape = destacar texto sobre imagem. Não usar shapes como decoração vazia.

### 7. Sombra e traço contidos

Outlines coerentes; sombras suaves e só quando necessárias.

### 8. Flexibilidade com restrições estritas

O Brandbook autoriza julgamento do designer **exceto** onde há restrição explícita — essas restrições não são negociáveis.

## Recomendação de CTA (não oficial)

| Contexto | Sugestão |
|----------|----------|
| Ação comercial / contato / shop | Main Green (vitalidade, CTA) |
| Ação institucional / navegação primária de sistema | Main Blue |
| Destrutivo / alerta forte | Orange Red (já mapeado a `--destructive`) |

Documentar a escolha no DS interno quando formalizada.

## Boas práticas

- Revisar cada tela contra as golden rules de cor.
- Preferir tokens a hex soltos.
- Manter um “job” visual por seção (hierarquia limpa).

## Checklist

- [ ] Blue + Green estruturam a tela
- [ ] Accent único e contido
- [ ] Contraste de texto OK
- [ ] Tipo com hierarquia Display / Body
- [ ] Shapes só com função

## Referências

- [04-colors.md](./04-colors.md)
- [05-typography.md](./05-typography.md)
- [11-components.md](./11-components.md)
- [17-do-and-dont.md](./17-do-and-dont.md)
