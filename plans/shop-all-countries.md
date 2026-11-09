# Shop: "All countries" market option (default when nothing valid is selected)

status: implemented 2026-11-09
- requested: 2026-11-09 · by: Patrick Oliveira

## Goal
Add an "All countries" option to the shop's market country selector (toolbar `CountrySelector`, the market that drives
`enabledCountries`, currency and the RFQ market. It is not the `countriesOfOrigin` sidebar filter). Make it the
effective selection whenever no valid country is selected (no saved choice, stale/inactive saved or URL country, no or
invalid admin default). Under "All countries" the catalog lists every published product regardless of market, so the shop
never shows the "select your market" prompt or a silently empty grid again. Keep current behaviour for a concrete country.

## Findings (current behaviour)
"Country" = market. State `ShopState.countryCode/currency` (`src/lib/shop/types.ts:196-197`), persisted in localStorage
`oboya-shop-quote` (`src/contexts/shop/model.ts:23,156-172`), mirrored to `?country=&currency=`
(`src/lib/shop/url-state.ts:122-123,166-167`), admin default `shopConfig.market.defaultCountryCode/defaultCurrencyCode`
(`src/lib/cms/shop-config/defaults.ts:61-64,127-160`). Gating is in `ShopContext.tsx:123-132` (enabledCountries) and
`src/lib/shop/filters.ts:99-109` (enabled and price > 0 in the currency unless the product is quote-only). Both already pass
everything through when `countryCode` is null. Only the UI blocks it.

Blank-shop scenarios:
1. **No admin default (the built-in default).** `DEFAULT_SHOP_CONFIG.market.defaultCountryCode = null` (`defaults.ts:62`)
   leads to `useMarketDefaults` returning early (`useCatalogLoader.ts:255-258`), so countryCode stays null. `ProductCatalog.tsx:50-52` then renders
   `SelectCountryPrompt`, the sidebar is hidden (`ShopPageContent.tsx:43`) and search, sort, view and filters are disabled (`SearchBar.tsx:71`,
   `SortDropdown.tsx:28`, `ViewSwitcher.tsx:20,36`, `ShopToolbar.tsx:61`). This is what every first-time visitor and crawler sees.
2. **Saved/URL country deactivated.** The catalog loader nulls the country and also wipes the quote list (`useCatalogLoader.ts:125-131`).
   `marketDefaultsApplied` is a ref inside the app-wide provider (`AppProviders.tsx:15`). Once it is set it never re-applies
   (`useCatalogLoader.ts:249,253,283`). So after the first shop visit in a session, a cleared country leads to the prompt even when an admin default exists.
3. **Country without currency.** `?country=BR` with no `currency` keeps `prev.currency` (null on a first visit) (`useListingUrl.ts:109-110`).
   `useMarketDefaults` skips because a country is set (`useCatalogLoader.ts:262-265`). The selector shows BR, but
   `ProductCatalog.tsx:50` shows the prompt. The same happens with persisted `{countryCode:"BR", currency:null}` (`model.ts:165-166`, `useCatalogLoader.ts:63-64`).
4. **Currency not valid for the country.** URL and persisted currency are never checked against `country.currencies` (`useListingUrl.ts:110`,
   `useCatalogLoader.ts:64`). Stock products with no price in that currency are dropped (`filters.ts:108`), which leaves a mostly or fully
   empty grid with a misleading "No products match your filters" (`ShopStateViews.tsx:25-45`). The currency select shows a value
   that is not in its options (`CurrencySelector.tsx:19-25`).
5. **Unknown code via `setCountry`.** It stores any code and keeps the old currency (`useShopCommands.ts:47-58`). A race also exists: before the catalog
   is ready, any URL country is accepted (`useListingUrl.ts:98-99`) and only cleared later (scenario 2).
6. **Country valid, but few or no products enabled or priced for it.** `ShopContext.tsx:125-131` and `filters.ts:104-108` lead to `EmptyResults`.
   This is correct data behaviour, not a bug. "All countries" now gives the user a way out.

## Design (recommended; items marked D need user confirmation, see Risks)
- **Representation:** internal `countryCode: null` means All countries, because the existing filters already treat null as "no gating". The sentinel `ALL_COUNTRIES = "all"`
  exists only at the edges: the selector option value, `?country=all` (accepted on read), and the localStorage `countryCode: "all"` (an explicit choice).
  `currency` is always `null` under All. `"all"` must never reach `getCountryByCode`, the office resolver, `enabledCountries`
  lookups or `/api/shop/rfq`.
- **Single pure resolver.** Add a new `src/lib/shop/market.ts` with `resolveMarketSelection({ urlCountry, urlCurrency, persisted, countries, marketDefaults, catalogReady })`
  that returns `{ countryCode: string|null, currency: string|null, explicit: boolean }`. Rules:
  - A valid explicit country is used, with its currency checked against `country.currencies`, falling back to `country.defaultCurrency`. This fixes 3 and 4.
  - An explicit `all` gives All.
  - When nothing valid is selected, the valid admin default is used if configured (D1), otherwise All.
  - An invalid or stale value counts as "nothing selected". It must not stay on screen as a blank state. This fixes 2 and 5.
  The resolver re-runs whenever the catalog/countries load, not just once per provider lifetime. This replaces the one-shot ref in scenario 2.
  `setCountry("all" | unknown)` gives `{countryCode:null, currency:null}`.
- **Listing UI under All:** `SelectCountryPrompt` is no longer rendered (remove the component and its keys). The sidebar, search, sort, view and filter drawer are
  enabled. `CurrencySelector` is hidden. Products show no price; a "Select a country to see prices" hint replaces the price line (D2).
  The price range is already hidden when `!currency` (`FilterSidebar.tsx:241`). Hide the `price_asc`/`price_desc` sort options and treat a URL price sort as `relevance`.
  This avoids the silent USD fallback at `filters.ts:123-124`. The `available=priced` filter keeps working (stock vs quote, `filters.ts:92-96`). The quick view
  `ProductDrawer.tsx:52` must open with `currency` null and show no price.
- **Quote list / RFQ under All (D3).** The quote list is always empty under All. Switching a country to All uses the same confirm and clears it, consistent with
  `setCountry`. "Add to quote" opens `AddToQuoteDialog` with a required country picker. The picker lists only active countries where
  `enabledCountries[code]` is true for that product. On confirm it sets that country (and its default currency), keeps the current filters and search, and adds the item.
  `addItem` must no-op when no country is set. No API change is needed, because `/api/shop/rfq` already rejects missing or unknown countries (`route.ts:108-122`). Checkout,
  `QuoteCart`, `OfficeCard` and `CheckoutUpsell` already render nothing when the country is null.
- **URL:** under All, write no `country`/`currency` params (`/shop` stays clean). Accept inbound `?country=all`.
- **SEO:** no metadata change (`src/app/[locale]/shop/page.tsx:10-23` has no query canonical). Crawlers now get the full grid instead of the prompt.
- **Analytics:** the codebase has no analytics events (grep for gtag/dataLayer/posthog finds nothing). No change.

## Tasks
| # | Task | Agent | Files | parallel |
|---|------|-------|-------|----------|
| 1 | Add `ALL_COUNTRIES` and the pure `resolveMarketSelection` + `isAllCountries` in a new `src/lib/shop/market.ts`. `url-state.ts`: parse `country=all`, omit country/currency when null. `model.ts`: `loadPersisted` keeps `"all"` as an explicit marker; persist `"all"` when the user chose All explicitly. | builder-shop | `src/lib/shop/market.ts` (new), `src/lib/shop/url-state.ts`, `src/contexts/shop/model.ts` | no (1 before 2-3) |
| 2 | Wire the resolver into state: replace the one-shot `useMarketDefaults` and the stale-country clearing with `resolveMarketSelection` (re-run on catalog load). Validate URL currency in `useListingUrl` hydration. `setCountry` handles `"all"`/unknown (null/null) and gets an option to keep filters/search for the add-to-quote picker. `addItem` is a no-op without a country. | builder-shop | `src/contexts/shop/useCatalogLoader.ts`, `src/contexts/shop/useListingUrl.ts`, `src/contexts/shop/useShopCommands.ts` (rule-7 file, builder-shop only), `src/contexts/ShopContext.tsx` | no |
| 3 | UI: add the "All countries" first option in `CountrySelector` (globe icon, confirm when the quote list is non-empty). Hide `CurrencySelector` under All. Remove the prompt branch and the `SelectCountryPrompt` component. Un-gate the sidebar and toolbar controls. Make `ProductCard`/`ProductDrawer`/`ColorSwatchGroup` accept `currency: string|null` with the price hint. Hide price sorts under All. Add the country picker in `AddToQuoteDialog`. | builder-shop | `src/components/shop/toolbar/{CountrySelector,CurrencySelector,ShopToolbar,SearchBar,SortDropdown,ViewSwitcher}.tsx`, `src/components/shop/ShopPageContent.tsx`, `src/components/shop/catalog/{ProductCatalog,ProductCard}.tsx`, `src/components/shop/states/ShopStateViews.tsx`, `src/components/shop/drawers/ProductDrawer.tsx`, `src/components/shop/ColorSwatchGroup.tsx`, `src/components/shop/quote/AddToQuoteDialog.tsx`, `messages/en/shop.json` | no |
| 4 | Tests (see Acceptance). Vitest is node-only, so cover logic through `market.ts`/`url-state.ts`/`filters.ts`. Extend the e2e smoke for `/en/shop` on a clean storage. | builder-shop | `src/lib/shop/__tests__/market.test.ts` (new), `src/lib/shop/__tests__/url-state.test.ts`, `src/lib/shop/__tests__/filters.test.ts`, `src/app/api/shop/rfq/__tests__/route.test.ts`, `e2e/smoke.spec.ts` | no |
| 5 | Admin (optional, only if D1 = keep admin default): relabel the "None" option of the Default country select as "All countries" and update `marketHint`. No schema or API change. | builder-admin | `src/components/admin/marketplace/shop-config/ShopConfigForm.tsx`, `messages/en/admin.json` | yes (no shared files with 1-4) |
| 6 | Mirror the shop and admin keys (including the deletions) to pt-BR, es, zh-CN after the builders finish. | i18n | `messages/{pt-BR,es,zh-CN}/{shop,admin}.json` | no (last) |

Shared UI: none. `src/components/ui/country-flag` is reused, not edited.

## i18n
New/changed keys in `messages/en/`:
- `shop.allCountries`: "All countries" (selector option)
- `shop.selectCountryForPrice`: "Select a country to see prices" (card, drawer and dialog price hint under All)
- `shop.quoteCountryLabel`: "Country for this quote" (AddToQuoteDialog picker label)
- `shop.quoteCountryHint`: "Prices and availability depend on the country. Your quote list will use this country." (picker helper)
- `shop.quoteCountryUnavailable`: "This product is not available in any active country." (no enabled market)
- `shop.confirmClearQuoteOnCountryChange`: unchanged copy, now also used when switching to All
- removed: `shop.selectCountryPromptTitle`, `shop.selectCountryPromptDesc` (only used by the removed `SelectCountryPrompt`)
- (task 5 only) `admin.shopConfig.defaultCountryAll`: "All countries (no default)"; changed `admin.shopConfig.marketHint`: "Applied on first visit when the visitor has no valid saved country or URL. Without a default, the shop opens on All countries."

## Acceptance criteria
- [ ] Clean storage, no admin default: `/en/shop` shows the selector value "All countries", the product grid (every published product, including those enabled for no country and quote-only ones), and an enabled sidebar, search, sort and view. The "Select your market" prompt never renders.
- [ ] Stale saved country (localStorage `countryCode` not in active countries): the shop resolves to the admin default if valid, otherwise All. The grid is not blank. This holds on a second shop visit in the same session (no one-shot ref).
- [ ] `?country=BR` without `currency` gives BR with BR's `defaultCurrency`, and products render. `?country=BR&currency=XYZ` (not in BR's currencies) gives BR's default currency.
- [ ] `?country=ZZ` (unknown) and `?country=all` give All. The URL under All has no `country`/`currency` params.
- [ ] An explicit All choice persists across reloads and is not overridden by the admin default (if D1 = keep admin default).
- [ ] Under All: no price is shown (hint instead), price sorts sort by USD with unpriced products last (D2), the price range is hidden, and `available=priced|quote` still filter by sale mode.
- [ ] Switching from a country with items to All asks the existing confirm; on accept the quote list is empty.
- [ ] Under All, "Add to quote" requires picking a country from that product's enabled markets. After confirm, the selector shows that country, filters and search are kept, and the item is in the quote list with the correct price/currency.
- [ ] `addItem` without a country adds nothing. `/api/shop/rfq` with `countryCode: "all"` returns 400 (test).
- [ ] Unit tests in `market.test.ts` cover scenarios 1-5 above plus the explicit-all and admin-default cases. `url-state.test.ts` covers the `all` round-trip. `filters.test.ts` asserts null country/currency returns every product.
- [ ] `/en/shop/products/SKU-001` still renders under All (no currency) without errors.
- [ ] lint + i18n:check + test + build + test:e2e pass

## Risks / notes
- **Decisions needed from the user (recommendation in bold):**
  - D1, admin default vs All: when the admin set `market.defaultCountryCode`, should first-time visitors still land on it? **Yes, keep the admin default. All is the fallback when it is unset or invalid, and an explicit All choice wins over it.** Alternative: always open on All and ignore the admin default (then task 5 instead removes or deprecates the setting).
  - D2, prices under All: prices are per currency (`product.prices[currency]`), not per country. **Show no prices under All, with a "select a country" hint.** Alternative: show prices in `defaultCurrencyCode` (or USD) with a "may vary by country" note. Risk of the alternative: prices shown for markets where the product is not sold, and stock items without that currency.
  - D3, quote list under All: **"Add to quote" opens a country picker limited to the product's enabled markets, then switches the shop to that country.** Alternative (smaller): disable add-to-quote under All with a "Select a country to request a quote" hint.
  - D4, switching to All clears the quote list (same confirm as today). **Yes.** Keeping items would require a country-less cart, which the RFQ API does not support.
- No auth, RLS, secrets or schema changes. `src/app/api/shop/rfq/route.ts` is not modified (test only). The existing country and currency validation (`route.ts:108-130,183-189`) is the guard that keeps "all" out of submissions. The reviewer should confirm that no client path posts `"all"`. Security-reviewer is not required unless the route changes.
- `useShopCommands.ts` is a rule-7 shared file: builder-shop only, tasks 2-3 run sequentially.
- Behaviour change: visitors with no saved country now see all products, including some that are not sold in their country. The country picker in the quote flow is the gate.
- Deleting `selectCountryPrompt*` keys: the i18n agent must delete them in all locales, or `i18n:check` parity fails.
- No new dependencies. Docs in `node_modules/next/dist/docs/` are not needed: no Next API changes (client state plus the existing `useSearchParams`).

## User decisions (2026-11-09)
- D1: admin default country for first-time visitors; All countries is the fallback when there is no valid default or saved choice.
- D2 (changed from the recommendation): under All countries, show USD prices. If a product has no USD price, show a badge in the same style as the "On Demand" badge instead of a price:
  - badge: "Local price only"
  - helper text (product page, drawer, tooltip on the card): "Select a country to see the price."
  - a one-line note above the grid under All countries: "Prices shown in USD. Select a country for local prices and availability."
  - "On Demand" (quote-only) products keep their existing badge; it takes precedence.
  - Price sorting under All countries sorts by USD; products without a USD price go last.
  - Rationale: the price exists, only not in USD, so "Not available" would read as out of stock; the copy says why and gives the next step.
- D3: "Add to quote" under All countries opens a country picker limited to that product's markets.
- D4: switching to All countries clears the quote list.
- Status: plan only; do not build until the user approves.
