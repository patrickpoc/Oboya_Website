# 04 — Cores

## Objetivo

Documentar a paleta oficial Oboya Horticulture, hierarquia, golden rules e uso em texto/imagem.

## Contexto

**Oficial.** A paleta reflete natureza, produção e tecnologia na horticultura moderna. Greens = crescimento; Blues = água/tecnologia/precisão; Yellows = sol/colheita; Orange = inovação/dinamismo; Soft White = frescor e clareza.

## Paleta oficial

Valores **HEX, RGB, HSB e CMYK** conforme Brandbook 2026. **HSL** calculado a partir do HEX e marcado como **inferido**.

### Main Green

| Campo | Valor | Origem |
|-------|--------|--------|
| Nome oficial | Main Green | Oficial |
| HEX | `#4DAF4E` | Oficial |
| RGB | 77, 175, 78 | Oficial |
| HSB | 121, 56%, 69% | Oficial |
| CMYK | 70, 0, 87, 0 | Oficial |
| HSL | ≈ 121°, 39%, 49% | Inferido |
| Função | Primary brand color | Oficial |
| Token CSS | `--oboya-green` | Implementação |

### Light Green

| Campo | Valor | Origem |
|-------|--------|--------|
| Nome oficial | Light Green | Oficial |
| HEX | `#75C566` | Oficial |
| RGB | 117, 197, 102 | Oficial |
| HSB | 111, 48%, 77% | Oficial |
| CMYK | 58, 0, 74, 0 | Oficial |
| HSL | ≈ 111°, 44%, 59% | Inferido |
| Função | Primary / suporte de crescimento | Oficial / inferido |
| Token CSS | `--oboya-green-light` | Implementação |

### Main Blue

| Campo | Valor | Origem |
|-------|--------|--------|
| Nome oficial | Main Blue | Oficial |
| HEX | `#004F7C` | Oficial |
| RGB | 0, 79, 124 | Oficial |
| HSB | 202, 100%, 49% | Oficial |
| CMYK | 97, 65, 27, 12 | Oficial |
| HSL | ≈ 202°, 100%, 24% | Inferido |
| Função | Primary brand color (estrutural) | Oficial |
| Token CSS | `--oboya-blue` | Implementação |

### Light Blue

| Campo | Valor | Origem |
|-------|--------|--------|
| Nome oficial | Light Blue | Oficial |
| HEX | `#009CD4` | Oficial |
| RGB | 0, 156, 212 | Oficial |
| HSB | 196, 100%, 83% | Oficial |
| CMYK | 77, 21, 3, 0 | Oficial |
| HSL | ≈ 196°, 100%, 42% | Inferido |
| Função | Presente na paleta / hierarquia visual | Oficial |
| Token CSS | `--oboya-blue-light` | Implementação |

### Dark Blue

| Campo | Valor | Origem |
|-------|--------|--------|
| Nome oficial | Dark Blue | Oficial |
| HEX | `#01203F` | Oficial — **usar este** |
| RGB (PDF) | 0, 79, 124 | **Errata:** no PDF está igual ao Main Blue |
| RGB (corrigido) | 1, 32, 63 | Inferido a partir do HEX `#01203F` |
| HSB (PDF) | 202, 100%, 49% | **Errata:** copia do Main Blue |
| CMYK (PDF) | 97, 65, 27, 12 | **Errata:** copia do Main Blue |
| HSL | ≈ 210°, 97%, 13% | Inferido do HEX |
| Função | Conteúdo institucional; profundidade/contraste; textos corporativos | Oficial |
| Restrição | Nunca como fundo primário em grandes formatos | Oficial |
| Token CSS | `--oboya-blue-dark` | Implementação |

### Soft White

| Campo | Valor | Origem |
|-------|--------|--------|
| Nome oficial | Soft White | Oficial |
| HEX | `#F1F5F1` | Oficial |
| RGB | 241, 245, 241 | Oficial |
| HSB | 120, 2%, 96% | Oficial |
| CMYK | 7, 2, 7, 0 | Oficial |
| HSL | ≈ 120°, 17%, 95% | Inferido |
| Função | Neutro; equilíbrio e clareza | Oficial |
| Token CSS | `--oboya-soft-white` | Implementação |

### Light Yellow

| Campo | Valor | Origem |
|-------|--------|--------|
| Nome oficial | Light Yellow | Oficial |
| HEX | `#DBE64C` | Oficial |
| RGB | 219, 230, 76 | Oficial |
| HSB | 64, 67%, 90% | Oficial |
| CMYK | 22, 0, 78, 0 | Oficial |
| HSL | ≈ 64°, 76%, 60% | Inferido |
| Função | Accent | Oficial |
| Token CSS | `--oboya-yellow-light` | Implementação |

### Dark Yellow

| Campo | Valor | Origem |
|-------|--------|--------|
| Nome oficial | Dark Yellow | Oficial |
| HEX | `#909B03` | Oficial |
| RGB | 144, 155, 3 | Oficial |
| HSB | 64, 98%, 61% | Oficial |
| CMYK | 49, 23, 100, 7 | Oficial |
| HSL | ≈ 64°, 96%, 31% | Inferido |
| Função | Texto que precisa destacar-se sobre fundo claro | Oficial |
| Token CSS | `--oboya-yellow-dark` | Implementação |

### Orange Red

| Campo | Valor | Origem |
|-------|--------|--------|
| Nome oficial | Orange Red | Oficial |
| HEX | `#EA5744` | Oficial |
| RGB | 234, 87, 68 | Oficial |
| HSB | 7, 71%, 92% | Oficial |
| CMYK | 0, 77, 71, 0 | Oficial |
| HSL | ≈ 7°, 80%, 59% | Inferido |
| Função | Accent (inovação / dinamismo) | Oficial |
| Token CSS | `--oboya-orange` | Implementação |

### Neutro adicional (oficial no Color System)

| Nome | HEX | Nota |
|------|-----|------|
| White | `#FFFFFF` | **Oficial** como superfície neutra permitida (junto com Soft White) — listado nas golden rules; também em `brandColors.white` no código |

## Hierarquia de cor (oficial)

### Primary Brand Colors (sempre presentes)

Definem a identidade. Aparecem em **toda** peça, sem exceção. São as cores “reconhecíveis” da marca.

**Inferido a partir do diagrama + texto:** Main Blue e Main Green (e variantes light associadas na composição).

### Accent — elementos secundários (uso deliberado)

Criam ênfase, CTA e diferenciação sazonal. **Não devem exceder 25%** da área visual da peça.

### Institutional content (técnico / B2B)

Somente para conteúdo técnico, fichas de produto, distribuidores e certificações. **Não** aparece em packaging nem em social media.

## Golden rules (oficial)

1. **Main Blue e Main Green** são as cores estruturais. Toda composição começa com elas. **White** e **Soft White** são as únicas superfícies neutras permitidas.
2. **Dark Blue** é exclusivo para textos de comunicação corporativa e para profundidade/contraste — **nunca** como fundo primário em grandes formatos.
3. **Light Yellow** e **Orange Red** são accents. **Um de cada vez**, nunca ambos na mesma composição, nunca em grandes superfícies, nunca como fundo. Um único accent por peça, com intenção.
4. **Dark Yellow** só quando o texto precisa destacar-se sobre fundo claro.

## Uso de cor em textos (oficial)

- Apenas as restrições especificadas são estritas; o restante fica a critério do designer.
- **Nunca** usar amarelo sobre fundo branco — contraste insuficiente para legibilidade.

## Uso de cor em imagens e shapes (oficial)

- Em foto ou vídeo de fundo, pode ser necessário **overlay de opacidade** para o texto ficar totalmente legível.
- Demais combinações: julgamento do designer, respeitando as restrições.

## Escalas (50–900)

**Não informado.** O Brandbook não define escalas tonais tipo 50/100/…/900.

**Recomendação.** Não inventar escala oficial; usar opacidade ou as variantes light/dark já oficiais.

## Boas práticas

- Começar layouts com Blue + Green + Soft White/White.
- Accent ≤ 25% e apenas um (Yellow **ou** Orange).
- Conteúdo social/packaging: evitar Dark Blue institucional como protagonista.
- No código, preferir tokens `--oboya-*` / classes `oboya-*` — ver [10-design-tokens.md](./10-design-tokens.md).

## Restrições (resumo)

| Não fazer | Motivo |
|-----------|--------|
| Yellow em branco (texto) | Contraste |
| Light Yellow + Orange Red juntos | Golden rule |
| Accent > 25% ou como fundo | Golden rule |
| Dark Blue como fundo large-format | Golden rule |
| Neutros fora de White / Soft White como “superfície neutra de marca” | Golden rule |

## Checklist

- [ ] Primaries presentes
- [ ] Um accent ou nenhum; ≤ 25%
- [ ] Dark Blue só em papel institucional / contraste
- [ ] Sem amarelo sobre branco
- [ ] Tokens oficiais no código (sem hex inventados)

## Referências

- [10-design-tokens.md](./10-design-tokens.md)
- [13-accessibility.md](./13-accessibility.md)
- [17-do-and-dont.md](./17-do-and-dont.md)
- [brand-audit.md](./brand-audit.md)
