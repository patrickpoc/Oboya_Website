# Shop: products "Com estoque" vs "Sob consulta" + store countries

- status: done
- requested: 2026-10-20 · by: Patrick Oliveira


## Context
Hoje toda a loja é um RFQ com preço estimado: produto sem preço some do catálogo e o servidor (`src/app/api/shop/rfq/route.ts:206-222`) recusa itens sem preço/sem estoque. O usuário quer duas modalidades no catálogo:
- **Com estoque**: tem preço, disponível só nos países marcados no admin, mostra preço normalmente.
- **Sob consulta** (sem estoque): sem preço, mostra o selo **"Request for quotation"**.
O fluxo RFQ continua (sem pagamento). Carrinho misto vira **uma única solicitação** com total parcial estimado + aviso de que o time comercial valida os preços. Também: gestão de países da loja no admin (adicionar/remover/ativar).

### Decisões do usuário
- Disponibilidade por país vale para **as duas** modalidades (card Markets atual, com "Enable all / Disable all").
- Carrinho misto: **uma solicitação**; linhas sob consulta = "Preço a definir"; total = "Total parcial estimado" + "+ N itens com preço a definir" + aviso comercial.
- Sob consulta **nunca** mostra preço.
- Com estoque e quantidade 0 (não ilimitado) → **vira sob consulta automaticamente** (continua visível).
- Carrinho só com sob consulta: **esconde total** + aviso "Os preços serão enviados pelo time comercial".
- Países: evoluir a página Currencies para **"Países e moedas"** com adicionar/remover/ativar, moedas, moeda padrão, escritório principal.
- Catálogo: novo filtro **"Com preço / Sob consulta"**.
- Admin extra: coluna **Modalidade** no editor em massa. (Selo/precificação na caixa de cotações: fora do escopo — só garantir que linhas sem preço apareçam como "Sob consulta", não "US$ 0,00".)

## Modelo
- Novo campo `saleMode: "stock" | "quote"` em `ShopProduct` (`src/lib/shop/types.ts`), coluna `sale_mode text not null default 'stock' check (sale_mode in ('stock','quote'))` via nova migration `supabase/migrations/2026MMDD_product_sale_mode.sql` (idempotente; produtos existentes ficam `stock` → comportamento atual preservado). Seed local `data/shop/products.json`.
- Novo helper `src/lib/shop/sale-mode.ts`:
  - `getEffectiveSaleMode(product)` → `"quote"` se `saleMode === "quote"` **ou** (`!unlimitedStock && (stockQuantity ?? 0) <= 0`); senão `"stock"`.
  - `isPricedLine(product, variant, currency)` → `effective === "stock" && resolveVariantPrice(...) > 0`.
- Regra de visibilidade (`isVisibleByBusinessRules`, `src/lib/shop/filters.ts:95-107`): país habilitado é exigido sempre; preço > 0 exigido **só** para efetivo `stock` (stock sem preço na moeda continua oculto); estoque zerado não oculta mais (vira quote). `matchesAvailability` passa a filtrar por `priced | quote`.
- `stockStatus` (enum existente) continua só informativo/ordenação.

## Tarefas
| # | Tarefa | Agente | Arquivos principais | paralelo |
|---|---|---|---|---|
| 0 | Salvar este plano em `plans/shop-sale-modes.md` (status in-progress) | orquestrador | `plans/` | — |
| 1 | Tipos + helper + filtros + testes | builder-shop | `src/lib/shop/{types,sale-mode,filters,catalog}.ts`, `src/lib/shop/__tests__/sale-mode.test.ts` | não (primeiro) |
| 2 | Migration + mapeamento DB + defaults | builder-admin (**security-reviewer**) | nova migration, `src/lib/cms/server/products/row.server.ts` (tipo, 2 mappers, `PRODUCT_TABLE_COLUMNS`, `PRODUCT_LIST_COLUMNS`), `src/lib/cms/repositories/product-repository.ts` (`withDefaults`), `data/shop/products.json` | não (após 1) |
| 3 | Admin produto: seletor **Modalidade** no topo de `ProductRegistrationCard.tsx` (segmented: Com estoque / Sob consulta); em "sob consulta" esconder preço, estoque e preços de variantes (`ProductColorVariantsCard.tsx`) com nota explicativa; `createEmptyCmsProduct` default `stock`; validação: `stock` exige ≥1 preço antes de publicar com país habilitado (reusar hint do Markets card). Coluna **Modalidade** no `BulkProductTable.tsx` + `src/lib/cms/bulk-update/{field-labels,display-labels,diff/validation}`. `LeadDetail.tsx`/`LeadsInbox.tsx`: linhas com `unitPrice: null` mostram "Sob consulta"; total mostra "parcial" quando houver pendentes. | builder-admin | `src/components/admin/marketplace/{ProductEditorForm,ProductRegistrationCard,ProductColorVariantsCard}.tsx`, `bulk-update/BulkProductTable.tsx`, `src/lib/cms/bulk-update/*`, `src/components/admin/leads/{LeadDetail,LeadsInbox}.tsx`, `messages/en/admin.json` | sim (com 5) |
| 4 | Admin países: página `marketplace/currencies` → **"Países e moedas"**: listar, **adicionar** país (lista mundial com bandeira, reusar `getWorldCountryByCode`/world-countries usado em `CountrySelect`), **remover** (confirmação; avisa nº de produtos que referenciam), toggle **ativo na loja**, moedas permitidas, moeda padrão, **escritório principal** (select de offices do `MapLocationEditor`/`/api/map-locations`). Persistir em `marketplace-currencies` (`src/lib/cms/server/marketplace-config.server.ts`) com campo `active` (default true, compatível com doc atual); API `src/app/api/cms/marketplace/currencies/route.ts` valida códigos ISO e moedas. Leitores (catalog/country selector/RFQ server/Markets card/bulk) usam só países ativos. | builder-admin (**security-reviewer**: `src/app/api/**`) | página currencies, rota currencies, `marketplace-config.server.ts`, nav label em `messages/en/admin.json` | não (após 3: compartilha `admin.json`) |
| 5 | Loja: selo e preço. Componente `RfqBadge` (ícone + "Request for quotation", tokens `oboya-*`) em `ProductCard.tsx` (grid/list), `ProductDetailView.tsx`, `ProductDrawer.tsx`, `AddToQuoteDialog.tsx`, swatches/thumbnail picker (sem preço). Botão continua "Adicionar à cotação". Filtro "Com preço / Sob consulta" na toolbar (`src/lib/shop/filter-groups.ts`). | builder-shop | `src/components/shop/**`, `messages/en/shop.json` | sim (com 3) |
| 6 | Carrinho/checkout/RFQ: `getLineItems` (`src/contexts/ShopContext.tsx:154-203`) retorna `saleMode`, `unitPrice: number \| null`, `lineTotal: number \| null`, `pricedTotal`, `pendingCount`, `pricing: "estimated" \| "mixed" \| "quote_only"`. `CartItem`, `QuoteCart`, `QuoteCartSheet`, `QuoteModal`, `CheckoutLineItem`, `CheckoutPage` resumo: regras de exibição das decisões (parcial + aviso / só aviso). `RfqPayload` (`types.ts`) e `useRfq.ts`: `unitPrice` nullable. **Servidor** `api/shop/rfq/route.ts`: decide modo efetivo no servidor; linhas quote pulam checagem de preço/estoque (MOQ/MAX continuam), salvam `unitPrice/lineTotal: null`, `saleMode: "quote"`; submission ganha `pricing`, `pendingItemCount`, `total` = soma das linhas com preço (ou null em quote_only). `CheckoutSuccessDialog` copy por modo. Testes do route. | builder-shop (**security-reviewer**: `src/app/api/**`) | `src/contexts/ShopContext.tsx`, `src/contexts/shop/{model,useRfq}.ts`, `src/components/shop/{cart,quote}/**`, `src/components/checkout/*`, `src/app/api/shop/rfq/route.ts`, `messages/en/{shop,checkout}.json` | não (após 5: compartilha `shop.json`) |
| 7 | Traduções pt-BR/es/zh-CN (`admin`, `shop`, `checkout`) | i18n | `messages/*` | não (após 3–6) |
| 8 | Review + security review | reviewer, security-reviewer | — | não |

Arquivos compartilhados (uma tarefa por vez): `BulkProductTable.tsx` (só T3), `useShopCommands.ts` (não deve precisar mudar; se precisar, só T6), `messages/en/admin.json` (T3 → T4), `messages/en/shop.json` (T5 → T6).

## Copy (en; i18n espelha)
- Selo: "Request for quotation" · pt-BR "Sob consulta".
- Linha: "Price to be confirmed" · "Preço a definir".
- Total misto: "Estimated partial total" + "+ {count, plural, one {# item} other {# items}} with price to be confirmed".
- Aviso misto: "Items on request will have their price validated by our sales team, who will contact you."
- Só consulta: "Prices will be sent by our sales team." (sem total).
- Admin: "Sale mode: In stock / On request (RFQ)"; nota: "Products on request never show a price."

## Fora do escopo
Pagamento online, e-mails, precificação de itens dentro da cotação no admin, selo/filtro por tipo na caixa de cotações, detecção de país por IP.

## Banco de dados (entregar SQL pronto ao usuário)
Uma migration idempotente: `alter table public.cms_products add column if not exists sale_mode text not null default 'stock'` + check constraint (`do $$ ... if not exists ... $$`). Países ficam no documento CMS existente (sem SQL). Relatório final traz o SQL e os passos para staging/produção.

## Verificação
- `npm run lint && npm run i18n:check && npm test && npm run build`; `npm run test:e2e` se o browser do Playwright estiver instalado (senão avisar).
- Testes vitest: `sale-mode` (efetivo, estoque zero → quote, visibilidade com/sem preço), filtros, route RFQ (só stock, misto, só quote; quote sem preço aceito; stock sem preço recusado; país inativo recusado), bulk validation da coluna nova, config de países (add/remove/active).
- Manual no dev server com Supabase de staging (após rodar a migration): criar 1 produto stock com preço + 1 sob consulta; ver selo no card/PDP; filtro; carrinho só stock (total normal), misto (parcial + aviso), só consulta (sem total); enviar e conferir a cotação no admin com linhas "Sob consulta"; zerar estoque de um produto stock → aparece como sob consulta; adicionar/desativar/remover país e ver o seletor da loja e o card Markets refletirem.
