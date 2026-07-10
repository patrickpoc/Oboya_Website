# 12 — Motion

## Objetivo

Declarar o status da motion no Brandbook e registrar o que o produto já implementa — sem promover animações atuais a regra oficial.

## Contexto

**Não informado.** O Brandbook 2026 **não** define duração, easing, princípios de motion nem microinterações.

## Implementação atual (produto — não oficial)

| Tecnologia | Onde aparece (exemplos) |
|------------|-------------------------|
| Framer Motion | Navbar dropdowns, transições de conteúdo, timeline description/background |
| GSAP + ScrollTrigger + Lenis | Timeline `/about-v2` (rotação do arco, pin/scrub) |
| CSS transitions | Hover states, navbar solid/transparent |

Valores típicos observados (extensão de engenharia, não Brandbook): easings cúbicos ~`[0.22, 1, 0.36, 1]`, durações ~0.2–0.9s.

## Recomendações (não oficiais)

**Recomendação.** Quando houver adendo de motion:

1. Respeitar `prefers-reduced-motion`
2. Motion a serviço da hierarquia (não decoração excessiva)
3. Durações curtas em UI (150–300ms); storytelling pode ser mais longo
4. Evitar motion que conflite com golden rules (ex.: accents piscando em excesso)

Até lá, motion no site = **decisão de produto**, não identidade oficial.

## Boas práticas

- Documentar novas animações no PR (por quê, duração, reduced motion).
- Não citar o Brandbook como justificativa de motion inexistente nele.

## Checklist

- [ ] `prefers-reduced-motion` considerado
- [ ] Animação não prejudica legibilidade/contraste
- [ ] Não apresentada como regra do Brandbook

## Referências

- [15-ui-principles.md](./15-ui-principles.md)
- [13-accessibility.md](./13-accessibility.md)
- [brand-audit.md](./brand-audit.md)
