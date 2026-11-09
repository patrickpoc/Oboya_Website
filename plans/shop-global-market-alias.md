# Shop: exibir um país do mercado como "Global" (alias temporário)

- status: implemented 2026-11-09
- requested: 2026-11-09 · by: Patrick Oliveira

## Goal
O admin escolhe em `/admin/marketplace/currencies` **um** país cadastrado e ativo na loja (ou "Nenhum"). Esse país passa a
ser exibido no shop como "Global" (traduzido), com um SVG do globo terrestre à esquerda, no lugar do nome e da bandeira.
Só a exibição muda. O código do país, os preços, a moeda, `?country=XX`, o localStorage, o envio de RFQ (`countryCode`),
o office resolver e os dados no admin continuam iguais. A feature é temporária e deve ficar pequena e fácil de remover:
um campo na config, um helper puro, uma rota e dois pontos de UI no shop.

## Findings (estado atual)
- **Página Currencies** (`src/app/admin/(dashboard)/marketplace/currencies/page.tsx`): carrega `GET /api/cms/marketplace/currencies?forEdit=1`
  (strict, `marketplace:view`) e salva `PUT` (`marketplace:edit`) com `{countries, currencies}` em `saveMarketplaceCurrencies`
  (`src/lib/cms/server/marketplace-config.server.ts:277-362`). Esse save percorre e reescreve os preços de todos os produtos e grava o
  doc `marketplace-currencies` só com `{countries, currencies}`. Um campo extra nesse doc seria apagado, e o caminho é caro e
  arriscado. Ele já teve o risco de apagar descrições, hoje mitigado por `updateProductPrices`. **A nova setting não pode passar por aí.**
- **Doc de config do shop** `marketplace-shop-config` (`MARKETPLACE_SHOP_CONFIG_DOC_ID`, `marketplace-config.server.ts:64,378-443`):
  já tem `market.defaultCountryCode/defaultCurrencyCode` e já chega ao shop pelo `GET /api/shop/catalog` (`shopConfig`,
  `src/app/api/shop/catalog/route.ts:22-48`). O client re-normaliza com `normalizeShopConfig` (`src/contexts/shop/useCatalogLoader.ts:143-154`)
  e expõe via `useShop().shopConfig`. `normalizeShopConfig` (`src/lib/cms/shop-config/defaults.ts:108-197`) **descarta campos desconhecidos**,
  então o novo campo precisa entrar no tipo e no normalizer, senão some no caminho.
- **Perigo de sobrescrita:** o `ShopConfigForm` monta `market` do zero ao trocar o país padrão
  (`src/components/admin/marketplace/shop-config/ShopConfigForm.tsx:347-361`, sem `...value.market`), e um form da página Shop Config carregado
  antes de uma mudança feita na página Currencies regravaria o valor antigo. Por isso o servidor deve preservar o campo (ver Design).
- **RLS:** `cms_documents` é gravável pelo staff para qualquer id que não seja `cms-access-control` ou `cms-approval-policies`
  (`supabase/migrations/20261105_cms_profile_privilege_guard.sql:145-176`). **Nenhuma migração é necessária.**
- **Cache:** `writeCmsDocumentData` chama `invalidateDocument(docId)` (`cms-document.server.ts:76`). A leitura pública usa a tag `docTag(docId)`
  (`:38`) e a rota `/api/shop/catalog` (force-static, revalidate 86400) revalida por essas tags. É o mesmo caminho que a página Shop Config já usa.
- **Onde o shop mostra o nome do país do mercado** (grep em `src/components/{shop,checkout}`, `src/contexts`, `src/lib/shop`, `src/app/[locale]/{shop,checkout}`):
  1. `src/components/shop/toolbar/CountrySelector.tsx:65-69`: opções e trigger (`ShopToolbarSelect` mostra `label` + `leading` da opção selecionada). Usa `FlagMark`.
  2. `src/components/shop/quote/AddToQuoteDialog.tsx:166-170`: picker de país em "All countries". É um `<select>` nativo, então só texto, sem SVG.
  - Não há label de país em card, drawer, página de produto, `QuoteCart`, `CheckoutPage` ou `QuoteModal`. Eles usam o `countryCode` só para lógica e office.
  - Fora de escopo (ver Risks): `OfficeCard` (bandeira do **escritório**, `office.flag`), o filtro `countriesOfOrigin` (origem do produto),
    o campo de país do cliente no RFQ (`RfqDetailsForm`/`QuoteModal`, lista mundial) e o fallback `country || market.name` gravado na submissão
    (`src/app/api/shop/rfq/route.ts:279`).
- **Ícone:** `lucide-react` já está no projeto. `Globe` já é usado para "All countries" (`CountrySelector.tsx:3,58`). `Earth` existe
  (`node_modules/lucide-react/dist/esm/icons/earth.mjs`). Nenhuma dependência nova.
- **Audit:** os vizinhos usam `addAuditLogDurable({userId, userName, action, module: "marketplace", resourceId, details})`, sem derrubar o save
  quando o audit falha (`src/app/api/cms/marketplace/filters/remove/route.ts:64-83`).

## Design (recomendado)
- **Persistência:** novo campo `market.globalCountryCode: string | null` no doc existente `marketplace-shop-config`. Sem migração e sem doc novo.
  - `ShopConfig.market` ganha `globalCountryCode: string | null` (obrigatório). `DEFAULT_SHOP_CONFIG.market.globalCountryCode = null`.
  - `normalizeShopConfig`: aceita só string `^[A-Z]{2}$` depois de trim e uppercase. Qualquer outra coisa vira `null`. **Não** valida contra
    `options.countries`, para que salvar a Shop Config com país inativo, ou a re-normalização no client, não apague o valor. O shop só
    aplica o alias quando o código bate com um país listado, então um código órfão é inofensivo.
  - `saveMarketplaceShopConfig` (PUT da Shop Config) **ignora** o `globalCountryCode` do payload e carrega o valor atual lido com
    `readCmsDocumentStrict` (null se o doc não existe). Assim o form da Shop Config nunca muda nem apaga o alias.
  - Nova função `saveMarketplaceGlobalCountry(code: string | null)` em `marketplace-config.server.ts`: faz `readCmsDocumentStrict(MARKETPLACE_SHOP_CONFIG_DOC_ID)`
    (lança `CmsReadError` em falha, aborta sem gravar), usa como base o doc remoto, o seed (`SHOP_CONFIG_FILE`) ou `DEFAULT_SHOP_CONFIG` como
    `readMarketplaceShopConfigStrict`, faz `normalizeShopConfig(base, { countries: strictCountriesForShopConfig() })`, define só `market.globalCountryCode`
    e grava com `writeCmsDocumentData`, ou com `writeLocalJsonFile(SHOP_CONFIG_FILE)` sem Supabase. **Não toca produtos nem o doc `marketplace-currencies`.**
- **API** nova `src/app/api/cms/marketplace/global-market/route.ts` (`dynamic = "force-dynamic"`, `revalidate = 0`):
  - `GET ?forEdit=1`: `cmsGuard("marketplace","view")` e depois `{ globalCountryCode }` de `readMarketplaceShopConfigStrict()`, com `noStoreHeaders`.
    `CmsReadError` vira `readFailureResponse`. Sem `forEdit` responde 400. O shop não usa esta rota, ele lê via `/api/shop/catalog`.
  - `PUT`: `cmsGuard("marketplace","edit")`. Body `{ globalCountryCode: string | null }`. Valida o tipo (string de 2 letras ou null) e retorna 400 se inválido.
    Se não for null, exige que o código esteja em `readMarketplaceCurrenciesStrict()` (só ativos), senão 400 `"Country is not active in the store."`.
    Depois chama `saveMarketplaceGlobalCountry`. Audit `addAuditLogDurable({ userId, userName, action: "update", module: "marketplace", resourceId: "global-market", details: JSON.stringify({ from, to }) })`
    em try/catch (só loga erro). Responde `{ globalCountryCode }`. Erros seguem `CmsReadError → readFailureResponse` e os demais `publicApiError`.
- **Admin UI (página Currencies):** novo card "Global display" no topo do `CardContent`, com Select de opções "None" mais os países do estado da
  página com `active !== false`, cada um com `CountryFlag` + `name (code)`, e um hint curto. O `load()` busca `/api/cms/marketplace/global-market?forEdit=1`
  em paralelo com a rota de currencies. Se uma das duas falhar, `loadFailed` bloqueia o Save. O estado é separado (`globalCode`, `globalDirty`).
  O botão Save do header e o `EditorGuard` (`dirty || globalDirty`) salvam na ordem: currencies (se `dirty`) e depois global (se `globalDirty` e o
  passo anterior não falhou). Se o país escolhido for desativado ou removido na tela, o Select volta para "None" e marca `globalDirty`.
  Toast próprio `globalSaved`. Nada disso entra no body do `PUT /currencies`.
- **Shop:**
  - Novo helper puro `src/lib/shop/global-market.ts`: `isGlobalMarket(code, globalCode)` (comparação case-insensitive, false se algum for vazio) e
    `marketDisplayName(country, globalCode, globalLabel)`. O arquivo é isolado para facilitar a remoção.
  - `CountrySelector`: para o país global, `label = t("globalMarket")` e `leading = <Earth className="text-oboya-blue" .../>` com o mesmo tamanho
    do `FlagMark`. `value` continua sendo o código. A ordem da lista não muda. Usar `Earth` (globo terrestre) e não `Globe`, para diferenciar da opção "All countries".
  - `AddToQuoteDialog`: o texto da `<option>` do país global vira `t("globalMarket")`. O `<select>` nativo não aceita SVG (ver Risks).
  - O `globalCode` vem de `useShop().shopConfig.market.globalCountryCode`. Nenhuma mudança em `ShopContext`, `useShopCommands`, URL, persistência ou RFQ.

## Tasks
| # | Task | Agent | Files | parallel |
|---|------|-------|-------|----------|
| 1 | Config e servidor: campo `market.globalCountryCode` no tipo, default e normalizer. `saveMarketplaceShopConfig` preserva o valor atual (strict read). Nova `saveMarketplaceGlobalCountry`. Nova rota `global-market` (GET forEdit, PUT, validação de ativos, audit). Testes. | builder-admin | `src/lib/cms/shop-config/types.ts`, `src/lib/cms/shop-config/defaults.ts`, `src/lib/cms/server/marketplace-config.server.ts`, `src/app/api/cms/marketplace/global-market/route.ts` (novo), `src/app/api/cms/marketplace/global-market/__tests__/route.test.ts` (novo), `src/lib/cms/server/__tests__/marketplace-config-strict.test.ts`, `src/app/api/cms/marketplace/shop-config/__tests__/route.test.ts` | no (1 antes de 2 e 3) |
| 2 | Admin UI: card "Global display" na página Currencies (load paralelo, Select com None + ativos, save sequencial, EditorGuard, reset ao desativar ou remover). `ShopConfigForm`: espalhar `...value.market` no patch do país padrão (o tipo passa a exigir o campo). Chaves em `messages/en/admin.json`. | builder-admin | `src/app/admin/(dashboard)/marketplace/currencies/page.tsx`, `src/components/admin/marketplace/shop-config/ShopConfigForm.tsx`, `messages/en/admin.json` | yes (com 3, depois de 1) |
| 3 | Shop: helper `global-market.ts` com teste. `CountrySelector` com label "Global" e ícone `Earth`. Texto da option no `AddToQuoteDialog`. Chave em `messages/en/shop.json`. Smoke e2e opcional (ver Acceptance). | builder-shop | `src/lib/shop/global-market.ts` (novo), `src/lib/shop/__tests__/global-market.test.ts` (novo), `src/components/shop/toolbar/CountrySelector.tsx`, `src/components/shop/quote/AddToQuoteDialog.tsx`, `messages/en/shop.json` | yes (com 2, depois de 1) |
| 4 | Espelhar as chaves novas de `admin` e `shop` em pt-BR, es e zh-CN. | i18n | `messages/{pt-BR,es,zh-CN}/{admin,shop}.json` | no (por último) |

Shared UI: nenhum (`src/components/ui/country-flag` e `select` são só reutilizados). Arquivos da regra 7: nenhum. As tasks 2 e 3 não
compartilham arquivos e editam namespaces diferentes (`admin` e `shop`).

## i18n
Chaves novas em `messages/en/`:
- `shop.globalMarket`: "Global"
- `admin.currencies.globalTitle`: "Global display"
- `admin.currencies.globalHint`: "Temporary: the selected country is shown to shop visitors as \"Global\" with a globe icon. Prices, currency, URL and quotes still use the real country."
- `admin.currencies.globalLabel`: "Country shown as Global"
- `admin.currencies.globalNone`: "None"
- `admin.currencies.globalSaved`: "Global display saved."
- `admin.currencies.globalSaveFailed`: "Could not save the Global display."
- `admin.currencies.globalResetNotice`: "The Global country was deactivated or removed, so Global display was set to None."

Sem mudança ou remoção de chaves existentes. Não há placeholders ICU.

## Acceptance criteria
- [ ] Na página Currencies, o Select "Country shown as Global" lista "None" e apenas os países com "Active in store" ligado. Países inativos não aparecem.
- [ ] Escolher CN e salvar grava `market.globalCountryCode = "CN"` no doc `marketplace-shop-config`. O doc `marketplace-currencies` e nenhum produto são gravados (teste: `updateProductPrices` e o write do doc de currencies não são chamados).
- [ ] Salvar só a mudança de Global não chama `PUT /api/cms/marketplace/currencies`. Salvar só países não chama `PUT /global-market`.
- [ ] `PUT /global-market` sem sessão retorna 401/403, e com usuário só `marketplace:view` retorna 403. Com código inativo, desconhecido ou malformado (`"china"`, `123`, `"all"`) retorna 400 e não grava. Com `null` grava None.
- [ ] Se o strict read do doc falhar, `PUT` retorna 503 e não grava. `GET ?forEdit=1` com falha retorna 503 e a página bloqueia o Save (ErrorState).
- [ ] Cada save bem-sucedido gera um audit `module: "marketplace"`, `resourceId: "global-market"`, com `{from, to}`. Uma falha no audit não derruba o save.
- [ ] Salvar a página Shop Config (inclusive trocando o país padrão, ou com payload de `globalCountryCode` diferente ou ausente) mantém o valor gravado (teste do route/server).
- [ ] `normalizeShopConfig`: valor ausente, inválido ou não-string vira `null`. `"cn"` vira `"CN"`. O valor é mantido mesmo quando não está em `options.countries`. Os testes existentes continuam passando.
- [ ] No `/en/shop` com Global = CN, o trigger e a opção do `CountrySelector` mostram "Global" com o ícone `Earth` à esquerda, sem bandeira nem "China". As outras opções continuam iguais e "All countries" mantém o ícone `Globe`.
- [ ] Ao selecionar "Global", a URL continua `?country=CN&currency=…`, os preços e a moeda são os de CN, e o RFQ envia `countryCode: "CN"`. A opção do picker no `AddToQuoteDialog` (em All countries) mostra "Global".
- [ ] Com Global = None, o shop mostra exatamente o que mostra hoje. Em pt-BR, es e zh-CN o label aparece traduzido.
- [ ] A mudança no admin aparece no shop após recarregar (o cache da rota `/api/shop/catalog` é invalidado pela tag do doc), sem redeploy.
- [ ] Teste unitário `global-market.test.ts`: case-insensitive, null/vazio nunca casa, e `marketDisplayName` devolve o label global só para o país configurado.
- [ ] lint + i18n:check + test + build + test:e2e passam.

## Risks / notes
- **Toca uma API route e escrita em `cms_documents`.** Disparar `security-reviewer` para a rota nova (`src/app/api/cms/**`) e para a mudança em
  `saveMarketplaceShopConfig`. Checar o guard `marketplace:edit` no PUT e `marketplace:view` no GET, a validação estrita do body, e que nenhum
  erro interno vaze (`publicApiError`). Sem auth nova, sem RLS nova, sem migração, sem segredos. O campo é público por design (vai no `/api/shop/catalog`).
- **Não usar `saveMarketplaceCurrencies`** nem gravar no doc `marketplace-currencies`: esse caminho reescreve preços de produtos e grava o doc
  só com `{countries, currencies}`, o que apagaria o campo.
- **Race de read-modify-write** entre a página Shop Config e a página Currencies no mesmo doc. Mitigada porque `saveMarketplaceShopConfig` sempre
  carrega o `globalCountryCode` atual do servidor e `saveMarketplaceGlobalCountry` só altera esse campo sobre um strict read. Ainda há uma
  janela pequena de last-write-wins para os demais campos, igual à de hoje.
- **Save combinado:** se o PUT de currencies ficar retido para aprovação (desativação), o Global ainda é validado contra os países ativos já
  salvos. Escolher como Global um país cuja desativação está pendente é permitido, e ele continua ativo até a aprovação.
- **`<select>` nativo** no `AddToQuoteDialog` não renderiza SVG: ali aparece só o texto "Global". Para ter o ícone seria preciso trocar por
  `ShopToolbarSelect` ou base-ui Select. Fora do escopo, a confirmar com o usuário.
- **Decisões a confirmar (recomendação em negrito):**
  - D1, ícone: **`Earth` (lucide)** para Global, mantendo `Globe` em "All countries". Alternativa: o mesmo `Globe` nos dois, o que pode confundir o usuário.
  - D2, `OfficeCard`: mostra a bandeira e os dados do **escritório** (ex.: o office na China). **Não alterar.** Isso é informação de contato, não o rótulo do mercado.
  - D3, filtro `countriesOfOrigin` (origem do produto, ex. "China"), campo de país do cliente no RFQ e e-mails ou lista de RFQ no admin: **não alterar**,
    porque não são o rótulo do mercado. A submissão grava `country || market.name` (`rfq/route.ts:279`) e continua com "China".
  - D4, posição na lista: **mantém a posição do país** (sem reordenar para o topo).
- **Remoção futura:** apagar `src/lib/shop/global-market.ts`, a rota `global-market`, o card na página Currencies, o campo no tipo, default e
  normalizer, a preservação em `saveMarketplaceShopConfig` e as chaves i18n. O campo extra no doc pode ficar, porque o normalizer o descarta depois da remoção.
- Sem dependências novas. Sem mudança de API do Next.js (os route handlers seguem o padrão dos vizinhos), então não foi preciso consultar `node_modules/next/dist/docs/`.
