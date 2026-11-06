# Remove brands; complete bulk import short descriptions and bulk update variant fields

- status: draft
- requested: 2026-11-05 · by: Patrick Oliveira

## Goal
Remove product brands from the admin and shop, as a phased change: code stops reading and writing brands first, while `cms_products.brand_id` and its data stay in place; dropping them is a separate migration that needs explicit user approval. Add the missing `es` and `zh-CN` short descriptions to bulk import. Make every variant field editable in bulk update without breaking the diff, validation, approval flow or description-preserving rules.

## Tasks
Run in order. T1 is the only task that can run in parallel, because T3, T5, T6 and T7 share `messages/en/admin.json` and bulk files, and T2 to T4 depend on each other to keep the build green. T1 to T4 ship as one release, never separately.

| # | Task | Agent | Files | parallel |
|---|------|-------|-------|----------|
| 0 | Gate: wait until the other builder's work is committed (see "Uncommitted work"). Do not revert or overwrite it. | orchestrator | none | no |
| 1 | Add a non-destructive migration: `alter table public.cms_products alter column brand_id set default '';`. No drop, no data update. | builder-admin | `supabase/migrations/20261106_cms_products_brand_id_default.sql` (new) | yes |
| 2 | Storefront stops using brands: remove the sidebar group, chips, card/PDP/drawer labels, filter logic and active count, the `brand` URL parse and build (keep `brand` in `RESERVED_QUERY_KEYS`), and the context field and quote line `brandId`. Make `ShopProduct.brandId` optional as a temporary step. | builder-shop | `src/components/shop/catalog/{FilterSidebar,FilterChips,ProductCard}.tsx`, `src/components/shop/drawers/ProductDrawer.tsx`, `src/components/shop/product/ProductDetailView.tsx`, `src/contexts/ShopContext.tsx`, `src/contexts/shop/{model,useCatalogLoader}.ts`, `src/lib/shop/{filters,url-state,types}.ts`, `src/lib/shop/__tests__/{filters,sale-mode}.test.ts`, new url-state test, `messages/en/shop.json` | no |
| 3 | Admin and CMS stop using brands (details under "Brand reference map"). | builder-admin | See "Brand reference map", T3 rows. Declared outside the area: `src/hooks/use-admin-marketplace-catalog.ts`, `scripts/{seed-products,migrate-product-ids-to-sku,generate-admin-pages}.mjs`. One agent at a time: `filters/page.tsx`, `BulkProductTable.tsx`. | no |
| 4 | Final shop cleanup once nothing else references brands: delete `ShopBrand`, `brandId`, `brands`, `brandIds`, `normalizeBrands`, `getBrandById`, `BrandLabel`, the seed file and seed keys. Delete `map-flag-options` only if it has no remaining consumer. | builder-shop | `src/lib/shop/{types,filter-groups,catalog}.ts`, `src/lib/shop/map-flag-options*`, `src/components/shop/BrandLabel.tsx` (delete), `data/shop/brands.json` (delete), `data/shop/products.json`, declared outside the area: `src/lib/solutions/{types,solutions-shop-linking}.ts` | no |
| 5 | Bulk import: add `short_es` and `short_zhCN`, plus a short description field in all four locales in the table, patch, diff and validation. | builder-admin | `src/lib/cms/bulk-import/{parse-spreadsheet,types,diff,validate}.ts`, `src/lib/cms/bulk-import/__tests__/parse-spreadsheet.test.ts`, `src/components/admin/marketplace/bulk-import/BulkImportTable.tsx`, `messages/en/admin.json` | no |
| 6 | Bulk update logic: new variant and default color fields, spreadsheet parsing, variant-scoped issues, SKU uniqueness, server guard. | builder-admin | `src/lib/cms/bulk-update/{types,diff,validate,display-labels,field-labels,spreadsheet}.ts`, `src/lib/cms/bulk-update/__tests__/bulk-update.test.ts`, `src/lib/cms/server/{product-writes,bulk-approval}.server.ts`, `src/app/api/cms/products/[id]/route.ts`, `src/app/api/cms/products/bulk/route.ts` | no |
| 7 | Bulk update UI: new columns, media picker, product-level issue display. | builder-admin | `src/components/admin/marketplace/bulk-update/{BulkProductTable,BulkUpdateWorkspace}.tsx`, `messages/en/admin.json` | no |
| 8 | Mirror `messages/en` changes to `pt-BR`, `es`, `zh-CN`. | i18n | `messages/{pt-BR,es,zh-CN}/{admin,shop}.json` | no |
| 9 | Review the diff. | reviewer | none | no |
| 10 | Security review: the diff touches `supabase/` and `src/app/api/**`. | security-reviewer | none | no |
| 11 | Run all checks and e2e. Add the T1 SQL to the prod pending handover, marked "apply before deploy". Update this plan's status. | orchestrator | this plan | no |

Not scheduled, needs explicit user approval: Phase 2 (see "Phases").

## i18n
New/changed keys in `messages/en/` (`namespace.path`):

- **Removed, `admin`:** `filters.brands`, `filters.addBrand`, `filters.searchBrand`, `filters.brandDetails`, `filters.brandDetailsDesc`, `filters.selectBrandFirst`, `filters.deleteBrand`, `filters.editBrand`, `filters.removeBrand`, `products.bulkImport.colBrand`, `products.bulkUpdate.selectBrand`, `products.bulk.selectBrand`, `products.stubs.brands.title`, `products.stubs.brands.description`, `products.stubs.brands.empty`, `taxonomy.brand`, `taxonomy.manufacturer`, `website.solutions.brands`
- **Removed if no other consumer (builder checks):** `admin.filters.countryFlag`, `admin.filters.countryFlagHint`, `admin.filters.noFlag`
- **Removed, `shop`:** `shop.filterBrands`
- **Changed:** `admin.filters.description` ("Centralize categories and filter options used by products."), `admin.taxonomy.description` ("Category and shop filter attributes.")
- **New, bulk import:** `admin.products.bulkImport.colShortEn`, `.colShortPtBr`, `.colShortEs`, `.colShortZhCn`
- **New, bulk update:** `admin.products.bulk.colColorHex`, `.colColorNameEn`, `.colColorNamePt`, `.colColorNameEs`, `.colColorNameZh`, `.colVariantImage`, `.colSortOrder`, `.imageUrlPlaceholder`, `.openMediaLibrary`, `.productIssue`

Do not touch `admin.settings.general.description`: "branding" there means visual identity. Validation messages in `bulk-update/validate.ts` and `BULK_FIELD_LABELS` are hard-coded English today; new ones follow that pattern, and localizing them is out of scope.

## Acceptance criteria
**Brands**
- [ ] `rg -i "brandId|brand_id|ShopBrand|brandIds|BrandLabel|brandOptions" src scripts data` matches only: `row.server.ts` or appliers code that strips the legacy key, the legacy `brands` passthrough, the ignored spreadsheet headers, and tests asserting that legacy input is ignored. Migrations are not edited.
- [ ] The filters admin has no Brands tab, preview or sheet. `POST filters/remove` and `GET filters/usage` with `kind=brand` return 400.
- [ ] `PUT filters` succeeds with no `brands` in the body and ignores `brands` from a stale tab.
- [ ] A filters document with or without `brands` reads without error (`readMarketplaceFiltersStrict` does not raise "malformed"). After a save, the stored `brands` array is unchanged.
- [ ] Saving a product, in both insert and update cases, leaves an existing `brand_id` unchanged and inserts `''` for a new one; `productToRow` output has no `brand_id` key.
- [ ] A product can be published and bulk imported with no brand (no "Brand is required" issue).
- [ ] `/shop?brand=oboya-qs-ecovaso&culture=flowers` loads, filters by culture only, shows no brand chip, and the URL drops `brand` after sync.
- [ ] A saved Solutions target with `brandIds` loads and saves without error, and its link has no `brand` param. A brand-only target links to `/shop`.
- [ ] An in-flight `marketplace.product_edit` or `marketplace.bulk_update` request whose snapshot contains `brandId` does not report a false conflict.
- [ ] Old spreadsheets with a `Brand` or `brandId` column import with no error in both bulk flows, and the value is ignored. New templates have no brand column.
- [ ] Unrelated uses stay intact: `@/components/brand/*`, `docs/brand/*`, `StatusPill tone="brand"`, `folder-brand`, palette tokens, `brandColors`.

**Bulk import**
- [ ] The template contains `short_en`, `short_ptBR`, `short_es`, `short_zhCN`, and the sample row stays aligned with the headers (test asserts equal length and that each sample value lands under its header).
- [ ] A sheet with all four values produces `shortDescription` with all four locales; aliases such as `short_zh` also work.
- [ ] Editing any of the four table cells updates `pending.shortDescription`, `changedFields` and the POST body.
- [ ] `productToRow` then `rowToProduct` returns all four locales (test). `es` and `zh-CN` reach the storefront (manual check on one product).
- [ ] Filling some short description locales but not others produces a warning, never a block.

**Bulk update**
- [ ] A variant row can edit SKU, hex, name in four locales, image and sort order. Existing MOQ and price editing still work. A parent row can edit default hex and default color name in four locales.
- [ ] Each new field shows the changed state and original-to-pending text, appears in `getChangedFields`, and round-trips through `applyPatchToProduct` and `formatFieldValue` (test per field).
- [ ] Editing a variant name updates `nameI18n` and, for EN, `name`.
- [ ] Editing a variant SKU leaves `variant.id`, `featuredColorId` and `imageColorIds` unchanged, and the input keeps focus while typing.
- [ ] Blocked: invalid hex, empty EN name, empty SKU, empty image, duplicate SKU in the product, SKU owned by another product (including in the same batch), image URL that is neither `https://` nor a relative `/` path, sort order that is not an integer of 0 or more.
- [ ] An issue on one variant highlights only that variant's cell, not its siblings. Issues on two variants with the same field and message both remain after the workspace merge.
- [ ] A `colorVariants` product-level block is visible in the table, not only in the review dialog that a blocked state cannot open.
- [ ] Sheet rows with `Color hex`, `Color name`, `Variant image` now apply: on a child SKU to that variant, on a parent SKU to the default color (hex and name only). Empty cells keep current values.
- [ ] Applying a change with a list-loaded row never overwrites `description`: both the direct PUT and the approval path keep the stored value (test).
- [ ] With approval required, `bulk-submit` holds the batch and the diff shows `colorVariants[<id>].<field>` paths. Approving writes those fields; a changed baseline reports a conflict.
- [ ] PUT, bulk update and `bulk-submit` return 400 for an invalid or colliding variant change, but a save that does not change `colorVariants` on a legacy invalid product still succeeds.

**Tests to update:** `src/lib/cms/__tests__/taxonomy-removal.test.ts`, `src/app/api/cms/marketplace/filters/__tests__/route.test.ts`, `filters/usage/__tests__/route.test.ts`, `filters/remove/__tests__/route.test.ts`, `src/lib/cms/server/__tests__/{marketplace-config-strict,update-product-references,approval-appliers-strict}.test.ts`, `src/lib/cms/bulk-update/__tests__/bulk-update.test.ts`, `src/lib/cms/bulk-import/__tests__/parse-spreadsheet.test.ts`, `src/lib/shop/__tests__/{filters,sale-mode}.test.ts`.

**Tests to add:** url-state with legacy `brand`, Solutions link with a legacy target, `productToRow` without `brand_id`, per-variant issue scoping, spreadsheet legacy columns.

- [ ] lint + i18n:check + test + build pass
- [ ] `npm run test:e2e` passes (routes and UI changed)

## Risks / notes

### Risks that touch database, API or auth (security-reviewer)
1. **Deploy order is mandatory.** T1 must be applied before the code deploys. `saveProduct` uses `upsert`, and Postgres checks NOT NULL on the proposed row before resolving the conflict. Without the default, every product save fails, not just new products. The old code keeps working with the default in place, so applying T1 first is safe.
2. **Rollback.** `isFiltersPayload` currently requires `brands` to be an array. If the code is rolled back after a save that dropped the array, the old strict read throws "malformed" and the old public read silently falls back to seed data. So T3 keeps the stored array: `saveMarketplaceFilters` copies raw `brands` from the current document on write (Supabase only), until Phase 2. `isFiltersPayload` stops requiring it.
3. **False approval conflicts.** `detectConflicts` deep-compares the current product to its snapshot. Pending requests hold `brandId`, the new read does not, so all would conflict. T3 strips `brandId` from both sides in `marketplace.product_edit` and `marketplace.bulk_update`. `website.solutions` has the same issue for targets with `brandIds`; it is left as a reviewable conflict, so resolve those pending requests before deploy.
4. **Variant data has no server validation today.** The PUT route, the `bulk-submit` path and the approval applier do not call `validateColorVariants`; only the bulk route does, and none check cross-product SKUs. Nothing in the DB enforces uniqueness of variant SKUs. T6 adds one guard, `assertVariantChangesValid(incoming, previous)`, in `product-writes.server.ts`, called from PUT, bulk update and `submitBulkUpdateRequest`, returning 400. It only runs when `colorVariants` changed. This also applies to the single-product editor, which is a deliberate behavior change. The builder must confirm the SKU source includes trashed products, matching `assertProductIsNew`.
5. **Image URLs.** Scheme is blocked as above. Hosts outside `next.config.ts` `remotePatterns` (Unsplash, Supabase) produce a warning, because the storefront `next/image` will not load them. The URL is admin-entered, so this is integrity rather than auth.
6. **RLS** is unchanged and no secrets are involved. The `bulk-validate` route loses only the `brands` catalog field.

### Uncommitted work
- **Overlaps with this plan:** `src/app/api/cms/marketplace/filters/remove/__tests__/route.test.ts` (uses `kind: "brand"` throughout, must be rewritten in T3) and `messages/{en,es,pt-BR,zh-CN}/admin.json`. T3 and T8 must not start until these are committed.
- **Dirty but needs no edit here:** `filters/remove/route.ts` and `FilterRemovalDialog.tsx` have no brand code; they are generic over the target kind and benefit automatically when `brand` leaves `isRemovalTarget`.
- **No overlap:** the `cms/users` and `cms/me` routes, `users.server.ts`, and the privilege migration with its test.
- **Migration prefix:** `20261105` is taken by the privilege guard, so T1 uses `20261106` to keep the version prefix unique.
- `.codex/` is untracked and is not part of this work.

### Phases
- **Phase 1 (this plan):** T1 to T7. Add the default; code stops reading and writing `brand_id`; rows, the index and the stored `brands` array stay.
- **Phase 2 (not scheduled, destructive, needs explicit user approval):** a new migration that drops `idx_cms_products_brand` and `brand_id`, and removes `brands` from the `marketplace-filters` document. Remove the T3 passthrough at the same time. Preconditions: Phase 1 stable in production, a backup export of `id, brand_id` and the `brands` array, and no running code selecting the column.

### Brand reference map
| Area | Files | Change | Task |
|------|-------|--------|------|
| Filters admin | `src/app/admin/(dashboard)/marketplace/filters/page.tsx` | Remove state, tab, previews, sheet, flag picker, `deleteBrand`, validation, `kind: "brand"` branches | T3 |
| Stub page | `src/app/admin/(dashboard)/marketplace/brands/page.tsx` | Delete | T3 |
| Removal and usage | `src/lib/cms/taxonomy-removal.ts`, `src/app/api/cms/marketplace/filters/usage/route.ts` | Remove kind, `brandUsage`, patch and replacement branches | T3 |
| Filters API and config | `src/app/api/cms/marketplace/filters/route.ts`, `src/lib/cms/server/marketplace-config.server.ts` | Remove normalizer, usage guard, duplicate check, seed read and local write; add passthrough | T3 |
| Product persistence | `src/lib/cms/server/products/{row,writes}.server.ts`, `src/lib/cms/repositories/product-repository.ts` | Remove from `ProductRow`, both mappers, both column lists and `REFERENCE_COLUMNS` | T3 |
| Approvals | `src/lib/cms/server/approval-appliers.server.ts` | Strip legacy `brandId` in comparisons | T3 |
| Product editor | `src/components/admin/marketplace/{ProductTaxonomyCard,ProductEditorForm}.tsx`, `marketplace/products/new/page.tsx` | Remove field, manufacturer line, seed | T3 |
| Bulk import | `src/lib/cms/bulk-import/{parse-spreadsheet,types,validate,diff,empty-product}.ts`, `bulk-import/{BulkImportTable,BulkImportWorkspace}.tsx` | Remove column, resolver, fallback, required check. Unknown headers are already ignored here | T3 |
| Bulk update | `src/lib/cms/bulk-update/{types,diff,validate,display-labels,field-labels,spreadsheet}.ts`, `bulk-update/{BulkProductTable,BulkColumnActions,BulkUpdateWorkspace}.tsx`, `api/cms/products/bulk-validate/route.ts` | Remove field, column, column action, publish requirement. Add an ignored-legacy set in `recordsFromSheet`, or `Brand` becomes a blocking `Unknown column` error | T3 |
| Solutions admin | `src/components/admin/solutions/ShopFilterTargetFields.tsx`, `website/solutions/page.tsx`, `src/lib/cms/repositories/solutions-page-repository.ts` | Remove picker and state; stop reading `brandIds` | T3 |
| Other | `src/hooks/use-admin-marketplace-catalog.ts`, `ShopLocalizedNameFields.tsx` (comment), `scripts/*.mjs` | Remove references | T3 |
| Storefront | See T2 files | Remove | T2 |
| Types and catalog | See T4 files | Remove | T4 |

**Checked, nothing to change:** structured data (the only JSON-LD is `JobPosting`; no Product schema or `brand`), `src/app/[locale]/**` and product metadata, `src/components/checkout`, `src/app/api/shop`, RFQ and quote payloads (`RfqPayload` and `quote-items.server.ts` have no brand), shop search (does not match on brand).

### User-visible effects to confirm
- Brand name and country flag disappear from product cards (grid and list), the product page and the quick-view drawer. Brands doubled as the manufacturer label, and this flag is lost with them.
- Old `?brand=` links now show a wider, unfiltered-by-brand result set instead of a narrowed one.
- A Solutions item whose target was only a brand now opens the whole shop; one that combined a brand with other filters gets broader. Audit before deploy with a read-only look at `brandIds` in the solutions document.
- `/admin/marketplace/brands` becomes a 404 (it was a stub with no navigation link found).
- Products can be published without a brand.
- Historical audit log entries mentioning brands remain as they are.

### Decisions made (no input requested)
1. No replacement field or storefront label for brand or manufacturer.
2. Migration sets a default of `''` and keeps NOT NULL. Existing values are kept, not cleared.
3. Old `?brand=` links are ignored rather than redirected. `brand` stays a reserved query key so it cannot become a custom filter group.
4. The stored `brandIds` in Solutions are dropped on the next save of that document. This is the only brand data removed in Phase 1, and it is not restored by rollback.
5. Bulk import scope is short descriptions only. `desc_es` and `desc_zhCN` have the same gap (`rowToProduct` hard-codes `""`) but were not requested; a one-line follow-up if wanted.
6. In bulk update, a variant SKU edit does not rename `variant.id`, unlike the product editor (which renames on blur). A stable id keeps carts, `featuredColorId`, `imageColorIds`, row keys and field-level approval diffs intact.
7. Default color and its names are included, because `validateColorVariants` blocks any edited product lacking them and the table had no way to fix that. `defaultColorNameEs` and `defaultColorNameZh` are added.
8. Not added: `featuredColorId` and `imageColorIds` (product-level, stay editor-only), add or remove variants (structural), parent SKU editing (it also renames the product id), new column actions for variant fields (values are per variant), prices beyond USD/BRL/EUR (preserved, not shown).

### Bulk import: short description gap
| Layer | `en`, `pt-BR` | `es`, `zh-CN` |
|-------|---------------|---------------|
| `IMPORT_SPREADSHEET_HEADERS`, `HEADER_ALIASES`, template sample | Yes | Missing |
| `rowToProduct` | Parsed | Hard-coded `""` |
| Table, `ImportProductPatch`, `applyImportPatch`, changed fields | Missing | Missing |
| Validation | None | None |
| POST payload (`row.pending`) | Sent whole | Sent, but always empty |
| `productToRow` and `rowToProduct` in `row.server.ts` | Persist whole JSONB | Already persist; no server change |

`applyImportPatch` must also copy `shortDescription` rather than share it by reference.

### Bulk update: variant field inventory
| `ProductColorVariant` field | Table today | Spreadsheet today | After |
|-----------------------------|-------------|-------------------|-------|
| `id` | Hidden | n/a | Hidden, stable |
| `sku` | Read-only | Lookup key only | Editable; new `New SKU` column |
| `moq` | Editable | Yes | Unchanged |
| `prices` USD/BRL/EUR | Editable | Yes | Unchanged |
| `image` | Thumbnail only, read-only | `Variant image` ignored | Editable (URL + `MediaLibraryDialog`) |
| `color` | Missing | `Color hex` ignored | Editable |
| `name`, `nameI18n` (4 locales) | Label only | `Color name` ignored | Editable; new PT, ES, ZH columns |
| `sortOrder` | Missing | Missing | Editable; new `Sort order` column |

**Existing defect fixed by T6:** the template notes promise `Color hex`, `Color name` and `Variant image` on child rows, but `parseRowToPatch` silently drops them ("MOQ + prices only").

**New patch keys:** `variantSku`, `variantColor`, `variantNameEn`, `variantNamePt`, `variantNameEs`, `variantNameZh`, `variantImage`, `variantSortOrder`, `defaultColorNameEs`, `defaultColorNameZh`.

**Implementation points for T6 and T7:**
- Adding keys to `BULK_VARIANT_FIELDS` flows through `fieldsForKind`, `hasVariantPatch` and `getChangedFields`. Each key still needs cases in `isBulkFieldEqual`, `applyVariantPatch`, `formatFieldValue`, `formatFieldDisplayValue` and `BULK_FIELD_LABELS`.
- `CellShell` filters issues by product and field only, so add optional `variantId` to `BulkValidationIssue`, to `issuesForProduct`, and to the merge key in `openReview`.
- `validateVariantRow` reports per-field issues; `validateColorVariants` stays as the final product-level check. Its `colorVariants` issue has no cell today while `blockedCount > 0` disables Apply, so T7 shows it in the parent Product cell.
- Cross-product SKU check: add optional `skuOwners` (lowercased SKU to product id) to `BulkUpdateCatalog`, built in the workspace. `products` state has trashed items filtered out, so build it before that filter or rely on the T6 server guard for them.
- `bulk-validate` rebuilds rows from parent patches only, so variant validation stays client side plus the server guard. Do not extend that route. Add the new default color keys to the `satisfies` patch in `openReview`.
- `toBulkWritePayload` and `mergeProductUpdate` keep `description` safe and need no change; add a regression test. The approval applier writes whole documents, and `diffJson` already diffs `colorVariants` by id.
- Replace the positional sample in `buildTemplateWorkbook`, which breaks when columns change, with values keyed by header.
- `BulkProductTable.tsx` is one-agent-at-a-time: T3 and T7 are sequential, and no other agent may hold it in between. The table's `min-w-[2100px]` needs widening.

## User decisions (2026-11-05)
1. Brand name and flag leave the storefront with no replacement label.
2. Include long descriptions `desc_es` and `desc_zhCN` in bulk import (reverses "Decisions made" item 5).
3. Bulk import images, added to scope:
   - per-row image upload or library pick in the review table, reusing the media library (`ImageField`/`MediaPicker`);
   - validate spreadsheet image URLs and show errors on the row before import;
   - copy external image URLs into the media library during import (server side, with SSRF protection: https only, no private addresses, content-type and size limits, redirect checks), reporting per-row failures;
   - verify `imageColorIds` length matches `images`, and the unoptimized gap in `ProductCard` for non-allowlisted hosts.
Acceptance includes an end-to-end import with an image against a non-production database.
