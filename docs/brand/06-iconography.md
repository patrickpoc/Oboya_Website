# 06 — Iconografia

## Objetivo

Registrar o que o Brandbook 2026 define sobre ícones e traços, e separar isso da biblioteca usada no produto web.

## Contexto

**Oficial** (Shapes / Icon Style). O Brandbook menciona **Icon Style** e regras de **Outlines** e **Shadows** na mesma seção de shapes.

## Outlines (oficial)

> The line weight should be consistent with the type of workpiece and the other elements that make it up.

| Regra | Detalhe |
|-------|---------|
| Peso de linha | Consistente com o tipo de peça e demais elementos |
| Medida exata (px/pt) | Não informado |
| Grid de ícones | Não informado |
| Cantos / caps / joins | Não informado |

## Shadows (oficial)

> The shadow should be subtle and soft, just enough to stand out from the background when necessary.

| Regra | Detalhe |
|-------|---------|
| Intensidade | Sutil e suave |
| Uso | Apenas o necessário para destacar do fundo |
| Valores (blur/opacity) | Não informado |

## Icon Style

**Oficial** — seção nomeada no Brandbook; o detalhe é predominantemente **visual**. Sem prints anexados nesta documentação, especificações de estilo (outline vs filled, canto arredondado, etc.) ficam como **não informado** no texto.

## Implementação no produto (não é Brandbook)

| Item | Situação |
|------|----------|
| Biblioteca | Lucide React (e ícones pontuais) em UI |
| Alinhamento ao Brandbook | Não há especificação oficial de set de ícones Oboya |
| Tokens de sombra | `--shadow-subtle`, `--shadow-card`, `--shadow-nav` — extensão de produto |

**Recomendação.** Definir um icon set Oboya (metáfora horticultura/tecnologia, stroke único, tamanhos 16/20/24) e documentar aqui quando aprovado.

## Boas práticas

- Manter peso de traço coerente dentro da mesma peça.
- Sombras discretas; evitar glow agressivo não previsto.
- Em UI, preferir um único set (ex.: Lucide) até existir set oficial.

## Restrições

- Não inventar “ícones oficiais Oboya” sem arte aprovada.
- Não misturar estilos radicalmente diferentes (outline fino + filled pesado) na mesma composição de marca.

## Checklist

- [ ] Stroke consistente na peça
- [ ] Sombra só se necessária e suave
- [ ] Set de ícones documentado no brief (oficial ou biblioteca de produto)

## Referências

- [07-imagery.md](./07-imagery.md)
- [11-components.md](./11-components.md)
- [10-design-tokens.md](./10-design-tokens.md)
