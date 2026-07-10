# 03 — Logo

## Objetivo

Documentar as regras oficiais de uso do logotipo Oboya Horticulture e o estado dos assets no repositório.

## Contexto

O Brandbook apresenta construção tipográfica do logo, clear space e versões **Light** / **Dark**. Parte do detalhe é visual (páginas sem texto descritivo completo). Prints adicionais do Brandbook **não** foram anexados na geração desta documentação — lacunas visuais ficam marcadas como **não informado**.

## Nome da marca no logo

**Oficial / inferido dos exemplos:** “OBOYA” + “HORTICULTURE” (wordmark com isotype).

## Clear space (área de proteção)

**Oficial.**

> Clear space around the logo equals the **cap height of the main “O” letter**. Nothing should break the limit of this space.

| Regra | Valor |
|-------|--------|
| Clear space | = altura da caixa-alta do “O” principal |
| Invasão | Nada deve ultrapassar esse limite |

## Relação tipográfica / isotype

**Oficial.**

- A espessura da palavra **“horticulture”** corresponde à parte superior do isotype.
- A parte inferior do isotype (preenchida com cor) é consistente com o estilo mais orgânico da palavra **“oboya”**.

## Versões

**Oficial.** O Brandbook apresenta versões:

| Versão | Uso pretendido (inferido) |
|--------|---------------------------|
| **Light** | Sobre fundos escuros |
| **Dark** | Sobre fundos claros |

Detalhes de arquivo (SVG/PNG separados, monocromia, negativo puro): **não informado** no texto do PDF.

### Implementação no repositório (não é o Brandbook)

| Asset | Caminho | Notas |
|-------|---------|--------|
| Logo principal | `public/assets/logo.svg` | Wordmark + mark em Main Blue / Main Green |
| Componente | `src/components/brand/Logo.tsx` | `variant="default"` \| `"light"` (`brightness-0 invert`) |

**Recomendação.** Exportar arte oficial Light e Dark (e, se existir, símbolo isolado) como arquivos separados, em vez de depender só de filtro CSS.

## Símbolo isolado, favicon, redução mínima, grid

| Item | Status |
|------|--------|
| Símbolo / isotype isolado | Não informado (texto); presente visualmente no logo |
| Favicon | Não informado no Brandbook |
| Redução mínima (mm / px) | Não informado |
| Grid de construção | Não informado (texto) |
| Usos incorretos (lista Do/Don't do logo) | Não informado (texto) — páginas podem ser só visuais |
| Fundos permitidos / proibidos (logo) | Não informado além das regras gerais de cor |

## Fundos (ponte com cores)

**Oficial (Color System):** White e Soft White são as únicas superfícies neutras permitidas. Primary Blue e Green estruturam a marca. Ver [04-colors.md](./04-colors.md).

**Inferido:** logo Dark sobre Soft White / White; logo Light sobre Dark Blue / Main Blue / fotografia com overlay — desde que contraste e clear space sejam respeitados.

## Boas práticas

- Sempre reservar clear space = altura do “O”.
- Não distorcer, não recolorir fora da paleta oficial, não adicionar efeitos não previstos.
- Em UI, preferir o componente `Logo` para manter tamanho consistente (`h-8` / `md:h-9` na implementação atual).

## Restrições

- Não quebrar o clear space com outros elementos.
- Não inventar versões (outline, sombra, gradient no logo) sem arte oficial.
- Não tratar o invert CSS como substituto definitivo da arte Light oficial.

## Recomendações

1. Extrair do PDF/arte-final: símbolo só, monocromia, negativo, redução mínima e galeria de usos incorretos.
2. Adicionar favicon alinhado ao isotype.
3. Documentar tamanhos mínimos para web (ex.: largura mínima em px) após medição da arte oficial.

## Checklist

- [ ] Clear space = altura do “O”
- [ ] Versão Light/Dark adequada ao fundo
- [ ] Sem distorção / rotação / recoloração não autorizada
- [ ] Asset proveniente de fonte oficial (ou `logo.svg` aprovado)

## Referências

- [04-colors.md](./04-colors.md)
- [09-spacing.md](./09-spacing.md)
- [18-implementation.md](./18-implementation.md)
- [brand-audit.md](./brand-audit.md)
