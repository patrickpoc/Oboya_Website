# 09 — Espaçamento

## Objetivo

Consolidar regras de espaço oficiais do Brandbook e a escala de espaçamento da implementação web.

## Contexto

O Brandbook define clear space do logo, tolerância óptica tipográfica e um valor físico de booth. Não define uma escala tipográfica de spacing 4/8/12 para UI.

## Regras oficiais

| Regra | Valor | Contexto |
|-------|--------|----------|
| Clear space do logo | = altura do “O” maiúsculo | Toda aplicação do logo |
| Ajuste óptico de tipo | ±8px | Layout examples |
| Zona livre no booth | 80 cm de altura | Feiras / stands |

## Não informado

| Item | Status |
|------|--------|
| Escala de spacing UI (4, 8, 12, 16…) | Não informado |
| Gutters / margens de página impressa | Não informado |
| Densidade de componentes | Não informado |

## Implementação atual (produto)

Arquivo: `src/styles/tokens.css`.

| Token | Valor | Uso |
|-------|--------|-----|
| `--section-y` | `clamp(4rem, 8vw, 9rem)` | Padding vertical de seções |
| `--section-y-sm` | `clamp(3rem, 5vw, 6rem)` | Seções menores |
| `--container-max` | `80rem` | Largura máxima do conteúdo |
| `--container-padding` | `clamp(1.25rem, 4vw, 2.5rem)` | Padding horizontal do container |
| `--nav-padding-x` | `clamp(1rem, 2.5vw, 1.5rem)` | Navbar |

Além disso, o projeto usa a escala padrão do **Tailwind** (spacing utilities).

**Classificação:** implementação / extensão de produto — **não** é escala oficial do Brandbook.

## Recomendações

**Recomendação.** Adotar escala base 4px (Tailwind) como padrão de engenharia e documentar pares semânticos (`section`, `stack`, `inline`) sem apresentá-los como regra do Brandbook.

Para o logo em UI, traduzir clear space do “O” em px medindo o asset em cada tamanho (`h-8`, `h-9`, etc.).

## Boas práticas

- Nunca invadir o clear space do logo.
- Em peças gráficas, usar ±8px só com intenção.
- Em stands, preservar 80 cm na base.

## Checklist

- [ ] Clear space do logo OK
- [ ] ±8px justificado (se usado)
- [ ] Booth: 80 cm livres quando aplicável
- [ ] Web: tokens de seção/container consistentes

## Referências

- [03-logo.md](./03-logo.md)
- [08-layout.md](./08-layout.md)
- [10-design-tokens.md](./10-design-tokens.md)
