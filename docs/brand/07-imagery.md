# 07 — Imagem e fotografia

## Objetivo

Documentar diretrizes oficiais de fotografia, moodboards, shapes e tratamento sobre imagem.

## Contexto

O Brandbook dedica páginas a **Imagery and Moodboards**, **Photography** (silhueta e contextual), **Color usage for images**, e **Shapes** (Leaf, Circle, Tag).

## Moodboards

**Oficial.** Existe seção “Imagery and Moodboards”. Conteúdo detalhado é visual.

**Não informado (texto):** lista de keywords de mood, referências nomeadas, ou regras de grade de moodboard.

## Fotografia — produto em silhueta (oficial)

> Silhouette product photography should stand out against the background and use subtle shadows if necessary to create depth.

| Diretriz | Detalhe |
|----------|---------|
| Destaque | Produto deve destacar-se do fundo |
| Sombra | Sutil, se necessária, para profundidade |

## Fotografia — produto contextual (oficial)

> Contextual product photography should be presented in a setting that is consistent with and relevant to the product. It should showcase appropriate, realistic shapes and textures. Fruits and vegetables should always look fresh, and packaging should be in perfect brand new condition.

| Diretriz | Detalhe |
|----------|---------|
| Cenário | Consistente e relevante ao produto |
| Formas / texturas | Realistas e apropriadas |
| Hortifrúti | Sempre com aparência **fresca** |
| Embalagem | Condição **nova / impecável** |

## Ângulo, escala e contexto (oficial)

| Tema | Regra |
|------|--------|
| Ângulo / perspectiva | Em fotos frontais de produto, linhas horizontais e verticais devem ser consistentes |
| Escala | Colocar objeto familiar ao lado para ajudar a entender o tamanho real |
| Contexto | Em cena “real life”, o setting deve ser aspiracional |

## Cor sobre imagens (oficial)

- Em fundo de foto ou vídeo, adicionar **camada de opacidade** quando necessário para o texto ficar totalmente legível.
- Demais decisões: critério do designer, respeitando restrições de cor ([04-colors.md](./04-colors.md)).

## Shapes (oficial)

| Shape | Uso oficial |
|-------|-------------|
| **Leaf Shape** | Fundo para destacar imagem, ou a própria imagem |
| **Circle** | Fundo para destacar imagem, ou a própria imagem |
| **Tag Shape** | Fundo para contrastar ou destacar texto sobre imagem |

## Ilustrações e texturas

**Não informado** como sistema (além de shapes e fotografia).

## Implementação no produto

O site usa fotografia de produto/horticultura em heroes, news, timeline, etc., frequentemente com overlays navy (`oboya-blue-dark` com opacidade) — alinhado à regra de overlay para legibilidade (**inferido** + implementação).

Shapes Leaf / Tag como componentes reutilizáveis: **não implementados** como primitivos oficiais no design system — ver [brand-audit.md](./brand-audit.md).

## Boas práticas

- Preferir frescor e embalagens impecáveis.
- Manter perspectiva ortogonal em packshots frontais.
- Sempre testar contraste do texto sobre foto com overlay.
- Usar Leaf / Circle / Tag conforme a função (destaque de imagem vs. destaque de texto).

## Restrições

- Não usar imagens de produtos murchos, sujos ou embalagens danificadas.
- Não omitir overlay quando o texto ficar ilegível sobre a foto.

## Checklist

- [ ] Tipo de foto (silhueta vs contextual) adequado ao brief
- [ ] Frescor / qualidade de embalagem
- [ ] Perspectiva e escala quando aplicável
- [ ] Overlay se houver texto sobre imagem
- [ ] Shape (Leaf/Circle/Tag) usado com a função correta

## Referências

- [04-colors.md](./04-colors.md)
- [06-iconography.md](./06-iconography.md)
- [08-layout.md](./08-layout.md)
- [13-accessibility.md](./13-accessibility.md)
