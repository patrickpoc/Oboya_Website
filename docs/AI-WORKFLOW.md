# Workflow multiagente — Oboya Website

Orca (painel) → Claude Code (orquestrador Opus) → subagentes (Sonnet) → revisão (Opus) · Codex como 2ª opinião · Cursor para ajuste fino.

## 1. Instalação (uma vez por máquina)

```bash
brew install --cask stablyai/orca/orca          # Windows/Linux: releases em github.com/stablyai/orca
npm i -g @anthropic-ai/claude-code @openai/codex
claude          # login com a conta Claude
codex           # login com a conta ChatGPT
```

Dentro do `claude`, um comando por vez:

```
/plugin marketplace add mksglu/context-mode
/plugin install context-mode@context-mode
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
/reload-plugins
/context-mode:ctx-doctor
```

Ponytail: deixe em `lite` (`/ponytail lite`). Esse projeto tem admin, RLS e validação — o modo padrão agressivo tende a cortar o que não deve.

## 2. Aplicar a estrutura no repo

Arquivos deste setup: `AGENTS.md` (seção `oboya-agent-workflow`), `CLAUDE.md`, `.claude/agents/*`, `.claude/settings.json`, `plans/TEMPLATE.md`, este doc.

```bash
git checkout staging && git pull
git checkout -b chore/ai-workflow
git apply oboya-ai-workflow-v2.patch
git add -A && git commit -m "chore: multi-agent workflow (Claude Code + Orca)"
git push -u origin chore/ai-workflow     # PR → staging
```

Teste: `claude` na raiz → `/agents` deve listar os 7 agentes.

## 3. Configurar o Orca

1. Add project → pasta do repo.
2. Agentes: Claude Code e Codex (Orca detecta os CLIs instalados).
3. Worktree principal **"orchestrator"**: Claude Code com `/model` → Opus 5.5, effort medium.
4. Cada worktree novo precisa de `.env.local` (não é versionado): copie manualmente ou use um script de setup de worktree no Orca: `cp ../oboya_website/.env.local .env.local && npm ci`.

## 4. Ciclo de uma tarefa

1. **Pedido** no worktree do orquestrador, ex.: *"Adicionar seção de certificações na página About com 4 selos, editável pelo admin."*
2. Orquestrador chama `planner` → `plans/certificacoes-about.md`. **Você lê e aprova** (é o único passo manual obrigatório).
3. Orquestrador dispara builders por área (`builder-site` + `builder-admin` em paralelo, se o plano permitir).
4. `i18n` propaga chaves novas de `messages/en/*` para pt-BR/es/zh-CN.
5. `reviewer` (+ `security-reviewer` se mexeu em API/Supabase) → até 2 ciclos de correção.
6. Lint + i18n:check + test + build (+ e2e) → commit → PR para `staging` → Preview → PR `staging` → `main`.
7. Opcional: abra um 2º worktree no Orca com **Codex** e peça `revise o diff da branch X contra plans/<slug>.md` — compara com o review do Opus.
8. Ajuste visual: Design Mode do Orca (clica no elemento) ou abra o worktree no Cursor.

## 5. Paralelismo — o que pode e o que não pode

- Pode: site + admin + shop ao mesmo tempo, em tarefas diferentes.
- Não pode em paralelo: duas tarefas no mesmo namespace de `messages`, nos arquivos grandes do admin (filters, media, BulkProductTable, MapLocationEditor, RichTextEditor), em `useShopCommands.ts` ou em `src/components/ui`.
- Teto prático: 2 worktrees de feature + 1 de review.

## 6. Primeiras tarefas sugeridas para validar o fluxo

1. Pequena: ajuste de copy numa seção pública (planner → builder-site → i18n → reviewer).
2. Média: campo novo editável no admin refletido no site (paralelo site + admin).
3. Segurança: revisão das rotas `src/app/api/shop/rfq` e `api/cms/forms` (security-reviewer).
4. Limpeza: zerar os warnings de lint, por área, em paralelo.
