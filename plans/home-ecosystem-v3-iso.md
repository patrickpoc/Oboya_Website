# Redesign da seção Ecossistema da home — ilustração técnica premium

## Contexto
A seção conta a cadeia em 6 etapas, mas o visual atual (`ecosystem-scenes/kit.tsx`: gradientes, bokeh, blur, vasos cartunescos, card arredondado, título solto + barra segmentada) parece cartunesco e sem vida. O dono quer manter a narrativa, com visual profissional, estruturado e envolvente, em **ilustração premium (SVG, sem fotos)**.

## Modelos / agentes
- **Opus (sessão principal)**: orquestra, roda checks, faz o checkpoint visual com o usuário.
- **Fable**: já fez direção de arte + plano (abaixo). Executa como `builder-site` e `builder-admin` (`model: fable`).
- **`reviewer` / `i18n`**: modelo padrão (olhar independente sobre o trabalho do Fable).
- Primeiro passo da execução: salvar este plano em `plans/home-ecosystem-v3-iso.md`, trabalhar em worktree a partir de `staging`.

## Direção de arte
- **"Prancha técnica" isométrica (30°) em linha sobre `--oboya-blue-dark`**: uma projeção `iso()` comum, mesmo plano de chão e um **trilho de fluxo** contínuo em todas as cenas.
- 3 pesos de traço via `--eco-ink` (≈1px mobile / 1.2px desktop), cantos arredondados; zero gradientes/blur/sombra/bokeh; faces planas translúcidas (tint por `color-mix` de soft-white).
- Acentos (máx. 3 por cena, só tokens): green (planta), green-light (estado ativo), blue-light (água, trilho, hotspots, sensores), orange (produto), yellow-light (flores).
- **Layout em grid 12 colunas**: cabeçalho (h2 + texto) acima; linha principal com coluna de texto (índice "02 / 06", título da etapa, descrição, até 3 proof points de produtos Oboya) + painel 2:1 com marcas de canto técnicas; **rail de etapas** clicável abaixo (botões numerados, progresso `eco-fill`, Pause/Play). Mobile: painel → texto → rail com scroll-snap.
- **Motion**: draw-on (`pathLength`) em camadas, sem loops; uma "unidade" de produto viaja pelo trilho de cena em cena (bandeja → vaso → caixa → embalagem → carrinho → prateleira); hotspots no painel ligados aos proof points (hover acende ambos). Etapa 6s, hover do mouse pausa, clique no rail navega. Reduced-motion/animações off do CMS: estático, rail funcional.

## Cenas (ids atuais mantidos)
1 propagation — bancada com bandeja de células, pórtico de semeadura, sacos de substrato
2 growing — nave de estufa, fileiras de vasos com plantas crescendo, irrigação, vaso em corte
3 harvest — carrinho em trilho com caixas, fileiras de cultivo
4 packaging — esteira, flow-wrap, clamshell/saco/sleeve, aplicador de etiqueta
5 logistics — AGV puxando carrinho CC com baldes de flores, doca
6 retail — gôndola isométrica com embalagens, display de chão
7 overview (fechamento) — cadeia inteira num trilho, nós acendendo

Sem `<text>` no SVG, sem números inventados (proof points = linhas de produto; métricas reais podem vir depois via CMS). ≤350 elementos/cena, `<use>` para repetições, sem dependências novas (framer-motion já existe).

## Arquivos
**Site (`src/components/sections/`)**: `HomeEcosystemSection.tsx` (reordenar), novos `HomeEcosystemStage.tsx`, `HomeEcosystemRail.tsx`, `useEcosystemSequence.ts` (extrai lógica de `HomeEcosystemIntro.tsx`, que é removido); `ecosystem-scenes/`: novos `iso-kit.tsx`, `backdrop.tsx`, `hotspots.ts`, `overview.tsx`, reescrever as 6 cenas, atualizar `index.tsx`, remover `kit.tsx`; `messages/en/homeEcosystem.json` (stepOf, goToStage, pause, play).
**CMS/admin**: `src/lib/cms/repositories/homepage-repository.ts` (stage ganha `description` + `points[]` ≤3, migração com defaults, merge de locales; legado `items` segue descartado), `homepage-i18n.ts` (textos default), `homepage-sections.ts`, `src/components/admin/homepage/sections/HomeEcosystemSectionEditor.tsx` (campos descrição + proof points), `messages/en/admin.json`, testes em `src/lib/cms/__tests__/homepage-ecosystem.test.ts`.
Sem mudança em Supabase/API → sem security-reviewer.

## Tarefas
| # | Tarefa | Agente | Paralelo |
|---|---|---|---|
| T1 | Contrato CMS (tipos, defaults, migração, testes) | builder-admin (Fable) | não, primeiro |
| T2 | Campos no editor admin + admin.json | builder-admin (Fable) | sim, com T3 |
| T3 | Kit iso, backdrop, sequência, Stage, Rail, layout + cenas piloto propagation, retail, overview | builder-site (Fable) | sim, com T2 |
| T4 | **Checkpoint visual**: screenshots desktop/mobile + URL dev para aprovação do usuário | Opus | bloqueia T5 |
| T5 | Cenas growing, harvest, packaging, logistics; remover kit.tsx e HomeEcosystemIntro | builder-site (Fable) | não |
| T6 | Traduções pt-BR/es/zh-CN | i18n | após T2/T5 |
| T7 | Revisão do diff (tokens, sem filtros/loops/hex, acessibilidade, testes) | reviewer | — |
| T8 | Fix loop (máx. 2) + fechamento, commit/push no staging | Opus | — |

## Verificação
`npm run lint && npm run i18n:check && npm test && npm run build && npm run test:e2e`. Visual via dev server + Playwright (script temporário): cada cena e o fechamento em 1280×800 e 390×844, alinhamento do trilho entre cenas, sem scroll horizontal em 320–1280, hover proof point → hotspot, clique no rail, Pause/Play, emulação reduced-motion, sem warnings de hidratação.

## Decisões padrão (ajustáveis no checkpoint)
- Mantém "Harvest" como 3ª etapa (o brief citava POS, removido antes); rótulo editável no CMS.
- Sem CTA por etapa por enquanto; tempos 6s/etapa e 12s de hold ajustados no T4.
