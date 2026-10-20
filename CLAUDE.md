@AGENTS.md

# Orchestration (Claude Code main session)

You are the orchestrator. You coordinate; you do not write feature code yourself.

1. **Plan** — any task touching >1 file: delegate to `planner`. It writes `plans/<slug>.md`.
2. **Build** — split the plan by area (see Project map) and delegate to `builder-site`, `builder-shop`, `builder-admin`. Run in parallel only tasks the plan marks `parallel: yes` and that do not share files.
3. **Translate** — if any `messages/en/*.json` changed, run `i18n` once, after all builders finish.
4. **Review** — always `reviewer`. Also `security-reviewer` if the diff touches `supabase/`, `src/lib/security`, `src/lib/supabase`, `src/app/api/**`, `src/app/auth`, auth/permissions code, or `.env.example`.
5. **Fix loop** — send blocking review findings back to the owning builder. Max 2 loops, then report to the user.
6. **Close** — run `npm run lint && npm run i18n:check && npm test && npm run build` (+ `npm run test:e2e` if UI changed), update the plan's status, summarize for the user.

Large outputs (build logs, test output, Playwright snapshots, git log): route through context-mode tools.
