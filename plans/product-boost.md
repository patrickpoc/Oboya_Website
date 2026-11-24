# Produtos: campo "boost" (score forçado) para subir na listagem da loja

- status: implemented 2026-11-24
- requested: 2026-11-24 · by: Patrick Oliveira

## Goal
Pedido do usuário: "criar um campo de 'boost' dos produtos, para subir eles na listagem, como se fosse um score forçado do produto, pois os produtos cadastrados, quando filtramos pelo brasil, por exemplo, estão mostrando produtos da china primeiro e não do brasil".
Objetivo: novo campo inteiro `boost` por produto (padrão 0, maior = aparece antes), editável no editor de produto, no Bulk Update e na planilha de Bulk Import, e usado pela loja como critério principal da ordenação padrão ("relevance"). Sem boost configurado, o comportamento atual fica idêntico.

## Causa raiz (por que o mercado Brasil mostra produtos da China primeiro)
1. A ordenação padrão da loja é `relevance` (`src/lib/cms/shop-config/defaults.ts:45`, `src/contexts/shop/model.ts:193`), e `sortProducts` em `src/lib/shop/filters.ts:198-200` **não ordena nada** nesse caso: devolve a lista na ordem em que chegou.
2. A lista chega de `GET /api/shop/catalog` (`src/app/api/shop/catalog/route.ts:23`) → `readProducts({ fields: "list" })` em `src/lib/cms/server/products/reads.server.ts:140-143`, que ordena por **`updated_at desc`** (modo local JSON: ordem do arquivo `data/shop/products.json`).
3. Escolher "Brasil" no seletor de mercado só **filtra** por `enabledCountries.BR` (`src/contexts/ShopContext.tsx:135-144` e `isVisibleByBusinessRules`, `filters.ts:99-109`); não mexe na ordem e não olha `countryOfOrigin`. Produtos de origem China habilitados para BR que foram criados/editados/importados por último (bulk import, bulk update e qualquer save tocam `updated_at` via trigger `touch_cms_products_updated_at`) ficam no topo.
Ou seja: a ordem atual é "editado mais recentemente primeiro", sem nenhum critério de negócio. O boost cria esse critério.

## Decisões para o usuário
- **D1 — escopo do boost** (recomendado: **A**)
  - **A. Boost global** (um inteiro por produto, vale em todos os mercados). Mais simples: 1 coluna, 1 campo no editor, 1 coluna no Bulk Update/planilha. Resolve o caso: dar boost aos produtos brasileiros os coloca à frente no mercado BR. Efeito colateral: também sobem nos outros mercados onde estiverem habilitados.
  - B. Boost por país (`boost_by_country jsonb`, ex. `{ "BR": 50 }`). Mais preciso, mas exige UI de mapa por país no editor, no Bulk Update e na planilha (N colunas ou formato `BR:50;MX:10`), e mais validação. Pode ser adicionado depois sem quebrar A (A vira o fallback).
  - C. Regra automática "origem = mercado selecionado primeiro" (sem campo novo). Zero cadastro, mas não é o "score forçado" pedido e não permite priorizar produto específico. Pode virar um tiebreaker futuro.
- **D2 — faixa do boost** (recomendado): inteiro **0–100**, padrão 0, maior aparece antes. Valores fora da faixa são bloqueados no admin/planilha e normalizados (clamp + truncar) no servidor; constraint `check` no banco. Sem valores negativos (para "afundar" produto, basta dar boost aos outros).
- **D3 — ordenações explícitas** (recomendado): em `relevance` o boost é o critério **principal**; em preço / nome / disponibilidade o critério escolhido pelo usuário manda e o boost é só **desempate** (ex.: dentro do grupo "sem preço" e "sob consulta" do `comparePrice`, e entre produtos com o mesmo `stockStatus`).

O plano abaixo assume A + D2 + D3 recomendados.

## Design
- **Helper compartilhado** `src/lib/shop/boost.ts`: `PRODUCT_BOOST_MIN = 0`, `PRODUCT_BOOST_MAX = 100`, `normalizeBoost(value: unknown): number` (número finito → trunc + clamp 0–100; qualquer outra coisa → 0), `parseBoostInput(raw: string): number | null` (string vazia → null; inteiro válido na faixa → número; senão `NaN`/erro sinalizado) para planilhas e inputs.
- **Tipo**: `ShopProduct.boost?: number` em `src/lib/shop/types.ts` (opcional para não quebrar fixtures; `CmsProduct` herda).
- **Ordenação** (`src/lib/shop/filters.ts`):
  - `relevance`/default: `list.sort((a, b) => normalizeBoost(b.boost) - normalizeBoost(a.boost))`. `Array.prototype.sort` é estável, então dentro do mesmo boost a ordem atual (updated_at desc) é preservada.
  - `price_asc` / `price_desc`: `comparePrice(...) || boostDesc(a, b)` — mantém intactos os grupos rank 0 (com preço) / 1 (sem preço na moeda) / 2 (sob consulta) e a direção do preço.
  - `name_asc` / `name_desc` / `availability`: critério atual `|| boostDesc(a, b)`.
- **Persistência Supabase**: nova migration `supabase/migrations/20261124_cms_products_boost.sql`:
  `alter table public.cms_products add column if not exists boost integer not null default 0;` + constraint idempotente `cms_products_boost_check check (boost between 0 and 100)` (mesmo padrão `do $$ ... pg_constraint` de `20261021_product_sale_mode.sql`). Sem índice (ordenação é no cliente). RLS e policies inalteradas (coluna herda as policies da tabela; não há grants por coluna em `cms_products`).
- **Mapeamento** (`src/lib/cms/server/products/row.server.ts`):
  - `ProductRow.boost?: unknown`; `rowToProduct` → `boost: normalizeBoost(row.boost)`; `productToRowWithFeatured` → `boost: normalizeBoost(product.boost)`.
  - `BOOST_COLUMN = "boost"` entra em `OPTIONAL_COLUMNS` (o `OPTIONAL_COLUMN_RETRIES` cresce sozinho para 3). Antes da SQL rodar em prod, leituras e escritas tentam de novo sem a coluna (catálogo continua funcionando com boost 0).
  - **Fail closed** em `productToRow`: se `boost` estiver desabilitado e `normalizeBoost(product.boost) > 0`, lançar erro `status: 503` "Apply migration 20261124_cms_products_boost first" (não descartar em silêncio uma edição do usuário). Com boost 0 o save segue normal sem a coluna.
  - Adicionar `BOOST_COLUMN` a `PRODUCT_LIST_COLUMNS` **e** `PRODUCT_TABLE_COLUMNS` (int barato). Obrigatório em LIST: o Bulk Update e as approvals montam o documento a partir de leitura `list`; se a coluna faltasse ali, o produto chegaria com boost 0 e o upsert completo zeraria o boost salvo (pitfall conhecido de perda de dados).
  - Atenção ao match por substring em `missingOptionalColumn` (`message.includes(column)`): "boost" não colide com nenhum outro nome de coluna atual; manter assim.
- **Modo local JSON**: `withDefaults` em `src/lib/cms/repositories/product-repository.ts` → `boost: normalizeBoost(p.boost)`. Não é preciso editar `data/shop/products.json` (ausente = 0); saves locais passam a gravar o campo.
- **Caminhos de escrita existentes já cobrem o campo**: editor → `mergeProductUpdate` sobre o produto completo + `saveProduct` (upsert); Bulk Update / approvals → documento completo vindo da leitura `list` (com boost após a mudança acima). Não criar upsert novo a partir de leitura parcial; `updateProductColumns` não precisa mudar.
- **Cache**: o catálogo é `force-static` com invalidação por tag nos writes de CMS; editar boost já invalida. Nada a mudar.
- **Exposição pública**: `toPublicProduct` passa o boost adiante no JSON do catálogo (inteiro não sensível; necessário para ordenar no cliente).
- Fora do escopo: outras listagens (home/destaques, soluções, relacionados via `src/lib/cms/readers/index.ts`), tabela de produtos do admin (sem coluna nova), boost por país (D1-B).

## Tasks
| # | Task | Agent | Files | parallel |
|---|------|-------|-------|----------|
| 1 | Helper `boost.ts` + `ShopProduct.boost?` + ordenação em `sortProducts` (relevance = boost desc estável; demais = desempate por boost) + testes: relevance ordena por boost mantendo ordem original nos empates; boost ausente/inválido = 0; price_asc/desc mantém grupos com preço / sem preço / sob consulta e só desempata por boost; availability desempata por boost; `normalizeBoost`/`parseBoostInput` (faixa, trunc, string, NaN, negativo, >100). | builder-shop | `src/lib/shop/boost.ts` (novo), `src/lib/shop/types.ts`, `src/lib/shop/filters.ts`, `src/lib/shop/__tests__/boost.test.ts` (novo), `src/lib/shop/__tests__/filters.test.ts` | no (primeiro; 2 e 3 importam o helper e o tipo) |
| 2 | Migration + mapeamento DB + defaults: criar `supabase/migrations/20261124_cms_products_boost.sql` (coluna `integer not null default 0` + check 0–100 idempotente, RLS intacto); em `row.server.ts` mapear nos dois sentidos, `BOOST_COLUMN` em `OPTIONAL_COLUMNS`, `PRODUCT_LIST_COLUMNS` e `PRODUCT_TABLE_COLUMNS`, fail closed com boost > 0 e coluna ausente; `withDefaults` com `boost`. Testes em `optional-columns.test.ts`: erro 42703/PGRST204 citando `boost` desabilita a coluna uma vez, some do select e do row; `productToRow` com boost 0 não lança, com boost > 0 lança `/20261124_cms_products_boost/`; `rowToProduct` sem coluna → 0, com 150 → 100. | builder-admin (**security-reviewer**) | `supabase/migrations/20261124_cms_products_boost.sql` (novo), `src/lib/cms/server/products/row.server.ts`, `src/lib/cms/repositories/product-repository.ts`, `src/lib/cms/server/__tests__/optional-columns.test.ts` | yes (com 3, após 1) |
| 3 | Admin UI + bulk: (a) editor: campo numérico "Listing boost" (min 0, max 100, step 1, hint) em `ProductRegistrationCard.tsx`, default `boost: 0` no produto vazio de `ProductEditorForm.tsx`; (b) Bulk Update: `boost` em `BULK_PARENT_TAXONOMY_FIELDS` e `BulkProductPatch` (`types.ts`), igualdade/aplicação/patch/valor em `diff.ts`, `display-labels.ts`, header "Boost" + aliases (`boost`, `listing boost`) em `field-labels.ts`, parse da coluna em `spreadsheet.ts` (vazio = mantém; inválido = issue bloqueada) + valor no template de exemplo, faixa em `validate.ts`, coluna editável (input numérico) em `BulkProductTable.tsx` só em linhas parent; (c) Bulk Import: coluna `boost` (+aliases) em `parse-spreadsheet.ts` (vazio = 0; inválido = 0 + erro, mesmo padrão de `moq`), template, `boost: 0` em `empty-product.ts`, checagem em `bulk-import/validate.ts`; (d) copy em `messages/en/admin.json` (keys abaixo). Testes em `bulk-update.test.ts` / `bulk-update-variants.test.ts` (parse "Boost" válido/vazio/inválido, diff detecta mudança só de boost, template contém header) e no teste de parse do bulk import. | builder-admin | `src/components/admin/marketplace/{ProductRegistrationCard,ProductEditorForm}.tsx`, `src/components/admin/marketplace/bulk-update/BulkProductTable.tsx` (arquivo grande compartilhado, regra 7: só esta task), `src/lib/cms/bulk-update/{types,diff,display-labels,field-labels,spreadsheet,validate}.ts`, `src/lib/cms/bulk-import/{parse-spreadsheet,empty-product,validate}.ts`, testes em `src/lib/cms/bulk-update/__tests__/` e `src/lib/cms/bulk-import/__tests__/`, `messages/en/admin.json` | yes (com 2, após 1) |
| 4 | Espelhar as keys novas de `admin` em pt-BR, es, zh-CN | i18n | `messages/{pt-BR,es,zh-CN}/admin.json` | no (após 2 e 3) |

Shared UI: nenhum arquivo de `src/components/ui`, `src/hooks` ou `src/types` é alterado. `src/lib/shop/boost.ts` é da área shop (task 1); o admin só importa.

## i18n
Novas keys em `messages/en/admin.json` (namespace `admin`):
- `admin.products.editor.boost` — "Listing boost"
- `admin.products.editor.boostHint` — "0 to 100. Higher values show the product earlier in the shop's default order. 0 keeps the normal order."
- `admin.products.editor.boostInvalid` — "Use a whole number from 0 to 100."
- `admin.products.bulk.boostHint` — tooltip do header da coluna Boost no Bulk Update (o header em si vem de `BULK_FIELD_LABELS`, hard-coded, como "Sale mode")
- `admin.products.bulk.instructions.columns.boost.meaning`
- `admin.products.bulk.instructions.columns.boost.example` — "50"
- `admin.products.bulkImport.instructions.columns.boost.meaning`
- `admin.products.bulkImport.instructions.columns.boost.example` — "0"
Sem placeholders ICU. Nenhuma key em `shop`/`checkout`.
(Builder confirma o caminho exato dos blocos `instructions.columns` em `admin.json`: `products.bulkImport` ~linha 311 e `products.bulk` ~linha 795.)

## Acceptance criteria
- [ ] Sem nenhum boost configurado (todos 0), a ordem em `relevance` segue só as regras de relevância extras aprovadas pelo usuário (produto de país único primeiro, com preço antes de "On Demand"), preservando a ordem do catálogo nos empates; testes existentes de `filters`/`market` seguem verdes sem alteração de expectativa.
- [ ] Mercado BR, sort `relevance`: produto com `boost: 50` aparece antes de qualquer produto com boost 0, independente de `updated_at`/origem; dois produtos com o mesmo boost mantêm a ordem relativa original (teste unitário).
- [ ] `price_asc`/`price_desc`: a ordem por preço e os grupos (com preço → sem preço na moeda → sob consulta) não mudam; boost só desempata (teste com preços iguais e com dois produtos sob consulta).
- [ ] `boost` ausente, `null`, string, negativo ou > 100 vira 0 / clamp 0–100 em `normalizeBoost`, `rowToProduct` e `withDefaults` (teste).
- [ ] Editor de produto: salvar boost 30, recarregar → 30; valor fora de 0–100 ou não inteiro mostra `boostInvalid` e não salva.
- [ ] Bulk Update: editar só o boost de um produto salva o boost e não altera `description`, preços, variantes nem outros campos (verificar leitura completa antes/depois); planilha com coluna "Boost" vazia mantém o valor; "abc"/"150" gera issue bloqueada.
- [ ] Bulk Import: coluna `boost` opcional; vazio → 0; "20" → 20; inválido → 0 + erro na preview; instruções listam a coluna.
- [ ] Antes da migration (coluna ausente): `GET /api/shop/catalog` responde 200 com produtos (boost 0); salvar produto com boost 0 funciona; salvar com boost > 0 retorna 503 com mensagem pedindo a migration 20261124 (teste em `optional-columns.test.ts`).
- [ ] Após a migration: `select boost from cms_products` → todos 0; `update ... set boost = 101` falha pela constraint; RLS de `cms_products` inalterada (anon não consegue update).
- [ ] `npm run i18n:check` passa (keys nas 4 línguas).
- [ ] lint + i18n:check + test + build passam; `npm run test:e2e` (UI do admin e da loja mudaram).

## Risks / notes
- **Migration / segurança**: `supabase/migrations/20261124_cms_products_boost.sql` → `security-reviewer` obrigatório. Só adiciona coluna + check; sem mudança de policies, grants ou funções. Idempotente (`if not exists`). Não editar migrations antigas.
- **Deploy prod**: adicionar a SQL à lista de "prod pending SQL" a entregar ao usuário. Até rodar, o fallback de coluna opcional mantém leitura/escrita funcionando; edição de boost > 0 é recusada com 503 (fail closed) em vez de perder o valor em silêncio.
- **Perda de dados (bulk/approvals)**: o boost tem de estar em `PRODUCT_LIST_COLUMNS`; caso contrário, Bulk Update e approvals (que salvam o documento inteiro vindo da leitura `list`) zerariam o boost salvo. Reviewer deve conferir isso e que nenhum caminho novo faz upsert de linha montada a partir de leitura parcial.
- **API routes**: nenhuma rota é alterada; `/api/cms/products`, `bulk-validate`, `bulk-submit` e `/api/shop/catalog` passam a carregar o campo pelo mapeamento. A validação server-side é o `normalizeBoost` no `productToRow` + constraint no banco.
- **`updated_at`**: editar o boost atualiza `updated_at` (trigger), então dentro do mesmo boost o produto editado sobe. Esperado; se incomodar, um tiebreaker estável (nome/SKU) é follow-up.
- **Shop config**: se em Admin > Shop config o `defaultSort` estiver diferente de `relevance`, o boost vira só desempate. Confirmar em prod que o padrão é `relevance`.
- **D1 global**: dar boost a produtos BR também os sobe em outros mercados onde estiverem habilitados. Se isso não for aceitável, aprovar D1-B (boost por país) antes do build.
- `BulkProductTable.tsx` e `messages/en/admin.json` são arquivos compartilhados: só a task 3 edita; task 2 não toca `admin.json`.
- Sem dependências novas.

## Ordenação relevance
Comparador único em `sortProducts` (`src/lib/shop/filters.ts`), chaves em ordem de prioridade:
1. `boost` desc;
2. produtos habilitados em apenas UM país (contagem de entradas verdadeiras de `enabledCountries ?? availability`) antes dos habilitados em vários;
3. produtos com preço exibido (não quote e preço > 0 na moeda ativa; mesmo `priceRank` do `comparePrice`) antes de On Demand/quote e sem preço;
4. ordem atual (sort estável).
Demais ordenações (preço, nome, disponibilidade) inalteradas, exceto o desempate por boost.
