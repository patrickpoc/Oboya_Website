# Save data-loss hardening

- status: implementado, sem commit; e2e, teste manual e revisão do último loop pendentes
- requested: 2026-11-05 · by: Patrick

## Goal
No editor or save path may write seed, fallback, cached or partially-read data over real data. On a read failure the system fails closed: the strict read throws, the API returns an error (503 for reads), and the client blocks Save until a load succeeds. This builds on the uncommitted work from `plans/filters-safe-delete.md`. Those changes stay in the tree: do not revert or stash them. No migrations.

## Decisions

**Edit-read mechanism: guarded `?forEdit=1` on the existing route.** It follows the `includeInactive=1` precedent in `currencies/route.ts:34`. One helper module serves every route.

| Route GET | Today | After |
|---|---|---|
| `marketplace/filters`, `marketplace/currencies`, `marketplace/shop-config`, `marketplace/checkout`, `about`, `news-page`, `solutions`, `faqs`, `/api/map-locations` | Unguarded | Tolerant without the param. With it: `cmsGuard(module, "view")`, then strict read |
| `access-control` | Session guard, also read by `AdminContext` | Tolerant without the param. With it: strict read |
| `homepage`, `blog-posts`, `blog-categories`, `blog-authors`, `case-studies`, `approvals/policies` | Guarded, admin consumers only | Always strict, no param, so no tolerant branch can be called by mistake |
| `products/[id]` | Mixed | Admin branch strict, public branch unchanged |
| `products` (`includeDeleted=1`, no `page`) | Admin, seed fallback | `forEdit=1` uses `readProductsStrict` |

- These keep calling the tolerant filters and currencies GETs, with no behaviour change: `solutions/page.tsx:74` and `use-admin-marketplace-catalog.ts:38`. They use the data for dropdowns only.
- On currencies, `forEdit=1` replaces `includeInactive=1` on the page. The route treats either param as the guarded strict branch.
- An unauthenticated `forEdit=1` request gets 401/403. It must never fall through to the tolerant read.

**Strict read contract (`readCmsDocumentStrict(docId)`).**
- Uses the cookie client, uncached, and selects `data, status`.
- Throws `CmsReadError` on a query error, a row that is not published, or a row with null `data`.
- Returns null only for a confirmed-absent row. Without Supabase, it returns null only on `ENOENT`, and invalid JSON throws.
- Callers validate shape and throw on malformed data.
- On null (confirmed-absent row), callers use code defaults, except shop config, which also reads its seed file as before. `readCmsDocumentSeedFile` is not re-exported from `strict-read.ts`.

**Errors.**
- `CmsReadError` carries a generic message and logs the detail, so database text is not returned to clients.
- `readFailureResponse(error)` maps it to 503 with no-store headers.
- `approvalErrorResponse` also maps it to 503. `withApprovalErrors` maps `ApprovalError` and `CmsReadError` and sends everything else through `publicApiError(error, fallback)`.

## Tasks
Order: 1 → 2 → (3, 4) → 5 → (6, 7). Task 8 is independent. Task 9 runs after all builders.

| # | Task | Agent | Files | parallel |
|---|------|-------|-------|----------|
| 1 | **Foundation (item 2).** Add `CmsReadError`, `isEditRead`, `readFailureResponse`, `readCmsDocumentStrict`, `readCmsDocumentChecked`; `readCmsDocumentSeedFile` stays in `cms-document.server.ts`. In `reviewChangeRequest`, rethrow `CmsReadError` from the apply catch so a read failure leaves the request open and not `failed`. | builder-admin | new `src/lib/cms/server/strict-read.ts`; `cms-document.server.ts`; `approvals.server.ts`; new `__tests__/cms-document-strict.test.ts` | no |
| 2 | **Product reads and writes (items 5, 6, 7, part of 11).** See "Task 2 details". | builder-admin | `products/{reads,writes,page}.server.ts`; `products.server.ts`; `repositories/product-repository.ts`; `product-writes.server.ts`; `product-content.server.ts`; `product-description-images.ts`; `bulk-approval.server.ts`; `api/cms/products/{route,[id]/route,bulk/route}.ts`; `BulkUpdateWorkspace.tsx`; `BulkImportWorkspace.tsx`; tests including `update-product-references.test.ts` and `product-writes-invalidation.test.ts` | no |
| 3 | **Marketplace config and map (items 1, 2, 3, 8).** See "Task 3 details". | builder-admin | `marketplace-config.server.ts`; `api/cms/marketplace/{currencies,shop-config,filters,filters/usage,filters/usage/products}/route.ts`; `src/lib/map-locations.server.ts`; `src/app/api/map-locations/route.ts`; `MapLocationEditor.tsx` (fetch URL only); new tests | yes (with 4) |
| 4 | **Document strict reads (item 3).** See "Task 4 details". | builder-admin | `{about-page,news-page,solutions-page,checkout-page,homepage,faqs,blog-posts,blog-categories,blog-authors,case-studies,media-folders,media-library,access-control,approval-policies}.server.ts`; `api/cms/{about,news-page,solutions,homepage,faqs,blog-posts,blog-categories,blog-authors,case-studies,media,access-control,approvals/policies,marketplace/checkout}/route.ts`; new tests | yes (with 3) |
| 5 | **Approval appliers (items 3, 5).** Use strict readers in `currentProduct`, the `marketplace.countries` branch, every `settingsDoc` reader, FAQ `findCurrent`, blog `find`, case-study `find`, and `currentVsProposed`. | builder-admin | `approval-appliers.server.ts`; new `__tests__/approval-appliers-strict.test.ts` | no |
| 6 | **Client blocking and dialog (items 4, 11).** See "Task 6 details". | builder-admin | `marketplace/filters/page.tsx`; `FilterRemovalDialog.tsx`; `HomepageSectionShell.tsx`; `marketplace/{checkout,shop-config,currencies}/page.tsx`; `marketplace/products/[id]/page.tsx`; `website/{about,news,solutions,faqs}/page.tsx`; `access-control/page.tsx`; `messages/en/admin.json`; component tests | yes (with 7, 8) |
| 7 | **Filter removal route and audit preview (item 11).** Hoist the audit helpers. In the "already removed" branch, call `invalidateCatalog()` and record `status: "already_removed"`. Before saving, re-read the strict document, re-validate the replacement against it (409 if it is gone), and apply `removeFromDocument` to that fresh copy. If the re-read fails, audit `document_save_failed` and return 503. Audit list: cap the preview at 200 characters in the cell, with the full JSON left in the database and API. | builder-admin | `filters/remove/route.ts`; `filters/remove/__tests__/route.test.ts`; `audit-logs/page.tsx` | yes (with 6, 8) |
| 8 | **Destructive deletes (items 9, 10).** Users: call `auth.admin.deleteUser` first; an auth "user not found" counts as success. On any other auth error, set the profile `inactive` with the service client, check that error, and throw `UserDeleteError` (`revoked` or `revocation_failed`) so the route can tell the operator. Then delete the profile (normally a no-op through the FK cascade) and check that error. Careers: call `removeAllCvObjects` first, as `anonymizeApplication` does, then delete the row. A CV removal failure throws and keeps the row, so the purge retries. | builder-admin | `users.server.ts`; `careers-applications.server.ts`; new tests | yes |
| 9 | Mirror the new key to the other locales. | i18n | `messages/{pt-BR,es,zh-CN}/admin.json` | no |

Then run `reviewer` and `security-reviewer`, since the diff touches `src/app/api/**` and service-role user deletion.

### Task 2 details
- **`readProductByIdStrict`:** same id-then-SKU lookup and purge-due rule as `readProductById`, but it throws instead of using seed. Use it in `products/[id]` PUT, DELETE and the admin GET branch, plus `bulk/route.ts` and `bulk-approval.server.ts`.
- **Bulk update:** read every `previous` before the first write, so a read failure returns 503 with nothing written. The batch is capped at 30, so this is cheap.
- **`GET products?includeDeleted=1&forEdit=1`:** strict. `BulkUpdateWorkspace` and `BulkImportWorkspace` use it.
- **`readProductsStrict` (item 11):** use `from += rows.length`, and stop on an empty page.
- **`updateProductReferences` (item 11):** catch per row, wrap `createClient` and the local persist, and always return `{updated, failed}`.
- **New helpers for task 3:** `readProductPricesStrict()` selects `id, sku, prices, purge_at`, is paged, and includes trash. `updateProductPrices(updates)` updates only `prices`, in batches of 10, using `.select("id")` so an RLS zero-row update counts as failed, and returns `{updated, failed}`.
- **Trash (item 7):**
  - `saveCmsProduct` keeps `product.deletedAt ?? null` and `product.purgeAt ?? null`.
  - Stale client payloads carry `deletedAt: null`, so lifecycle fields are pinned from `previous` in `mergeProductUpdate` and in `writeProduct`. The appliers pass `payload.product` directly to `writeProduct`.
  - Creates force null.
  - Checked: restore only goes through `POST ?action=restore`, and `BulkUpdateWorkspace` filters out trash. `bulkUpdateBySkus`, `upsertCmsProducts` and `duplicateCmsProduct` have no callers outside the repository. The browser calls to `saveCmsProduct` only touch client memory.
- **Images (item 6):**
  - `persistProductWithContent` only sanitizes.
  - After a successful upsert, `writeProduct` and `bulk/route.ts` call a best-effort reconcile that never fails the save.
  - It reads other products' descriptions strictly (`id, description`, paged, trash included) and skips URLs still referenced.
  - If that read fails, it deletes nothing and logs.

### Task 3 details
- **Filters (item 2):** `readMarketplaceFiltersStrict` delegates to `readCmsDocumentStrict`. This fixes the non-published row being treated as absent at `marketplace-config.server.ts:166`.
- **New readers:** `readMarketplaceCurrenciesStrict`, `readMarketplaceShopConfigStrict`, `readMapLocationsStrict`. The map reader uses the cookie client, is uncached, throws on error or malformed data, and uses the file seed only when the row is confirmed absent.
- **`saveMarketplaceCurrencies` (item 1):**
  - Read `readProductPricesStrict` before writing the document, so a failed read changes nothing.
  - Never call `saveProduct`. Use `updateProductPrices`, invalidate the updated ids and SKUs, and throw if any row failed.
  - `sku` is read in addition to the requested `id + prices`, because invalidation needs it.
  - Replace the `products` return value with `productsTouched`. The route uses it only for logging and the page never reads it, and this removes the product list from the PUT response.
- **`currencies/route.ts`:**
  - Strict `current`.
  - The guard at lines 93-105 uses `readProductPricesStrict`, so trash counts.
  - The edit GET's `productCounts` use strict data, excluding trash as today.
  - The offices read at line 72 uses `readMapLocationsStrict`. Today `readMapLocations` falls back to the seed file instead of throwing, so the `.catch` that keeps previous offices never runs and real `primaryOfficeId` values are removed as "unknown".
- **Shop config (item 8):** `saveMarketplaceShopConfig` validates against the strict `includeInactive` list. If that list is unreadable, it omits `countries` from `normalizeShopConfig`, so nothing is cleared. The edit GET uses the same logic. The public reader is unchanged.
- **Status codes:** map `CmsReadError` to 503 in the filters PUT, usage and usage/products routes.

### Task 4 details
- Add a `read*Strict` next to each tolerant reader: strict document, shape check, replace the memory cache only on success, keep the existing seed on absent. Public readers are unchanged.
- Use strict reads before every read-modify-write in `save*` and `delete*`, and in the `gateSettingsDocument` `read`.
- **Homepage:** `readHomepageFromSupabase` returns null for a malformed document, and the strict version must throw. Add a strict read before save too.
- **Access control and policies:** a strict read never hydrates or memoizes defaults on failure. Tolerant behaviour stays for `AdminContext`, `ensureAccessControlHydrated` and the approval gate.
- **Media folders:** strict at `media/route.ts:186,202,218`. Also strict at `media-library.server.ts:185`, because `?sync=1` writes the folder list right after a tolerant read and can persist defaults over real folders. Do not touch `media/page.tsx`.
- **Route error handling:** the POST and DELETE handlers in `blog-categories`, `blog-authors`, `case-studies`, `blog-posts` and `faqs`, plus `homepage` GET, have no surrounding try/catch. Add one so a failure returns 503 JSON, not an HTML 500.
- `faqs-repository.ts` is not edited.

### Task 6 details
- **Pattern for all pages:** track load state, render `ErrorState` with `onRetry` in place of the form, and disable Save until a load succeeds. Never set defaults on a failed fetch.
- **Filters:** use `?forEdit=1`, and treat a usage fetch failure as a load failure, because zero counts would be misleading.
- **`HomepageSectionShell`:** remove the seed initial state and show a skeleton until loaded. Children must not render, because they receive `persistSettings`.
- **Checkout:** use `?forEdit=1`.
- **Shop config:** use `?forEdit=1` on both fetches. Both must succeed. Normalize with the full list and show only active countries in the form dropdown.
- **Currencies (not in the brief):** use `?forEdit=1`. A failed load currently leaves Save enabled on empty state. The server's "at least one currency" check is the only thing stopping it.
- **About, news, solutions, FAQs, access control:** add `forEdit=1`. Save is already blocked on failed load for about, news, solutions and access control. FAQ saves are per item and protected server-side.
- **Product editor:** on a non-404 failure show `ErrorState` with retry, not "not found".
- **Dialog (item 11):** extract `loadProducts`, refetch after a failed confirm, and use `t("failed")` for network errors. The page's `onClose` also calls `refreshUsage()`.

## i18n
New/changed keys in `messages/en/`:
- `admin.common.editorLoadFailed`: "Could not load the current data. Saving is disabled to protect it."

Retry reuses the existing `admin.common.retry` through `ErrorState`.

## Verification per task
1. Unit tests for `readCmsDocumentStrict`: absent → null; read error → throws; non-published → throws; null data → throws; local `ENOENT` → null; local bad JSON → throws. Test that a rejected apply with `CmsReadError` leaves the change request status unchanged.
2. Test cases:
   - Pagination with a page smaller than `pageSize` loses no rows.
   - `updateProductReferences` returns `{updated, failed}` when a row or the client throws.
   - PUT, GET and bulk return 503 on a read error, and bulk writes nothing.
   - PUT or bulk on a trashed product, with a payload carrying `deletedAt: null`, keeps `deletedAt` and `purgeAt`. Restore clears them.
   - Upsert failure leaves images untouched. A URL shared with another or a trashed product is kept. A failed reference read deletes nothing.
3. Test cases:
   - Filters and currencies strict readers: absent, read error, malformed, non-published, first save.
   - Currency save updates only `prices`, with description untouched and no `saveProduct` call.
   - Product read failure leaves the document unwritten.
   - Trashed prices block removal.
   - Shop config keeps an inactive default, and skips clearing when the list is unreadable.
   - Map read failure keeps `primaryOfficeId`.
   - `forEdit=1` returns 401/403 unauthenticated and 503 on read error. The tolerant GET still returns data.
4. For each document: strict reader tests for absent, error, malformed and first save. A save or delete with a failing read makes no `writeCmsDocumentData` call. Failed access-control and policy reads do not hydrate or memoize. Sync does not write folders after a failed read.
5. With failing reads, `detectConflicts` throws (503, request stays open) and writes nothing. Check `marketplace.countries`, `product_edit`, `bulk_update` and one `settingsDoc` case.
6. Component tests where the harness allows, otherwise manual: a failed fetch shows `ErrorState`, Save is disabled or absent, and Retry enables it after success. Homepage does not render seed before load. Dialog refetches after failure and shows `t("failed")` on a network error.
7. Route tests: "already removed" invalidates and audits; save uses the fresh document, so a concurrent unrelated edit survives; re-read failure audits and returns 503; a replacement that has gone returns 409.
8. Tests: auth delete failure leaves the profile and memory cache intact and throws; profile delete error is surfaced. CV removal failure keeps the application row; the row is deleted only after the CVs. Auth delete failure sets the profile inactive and throws `revoked`; if that also fails, `revocation_failed`. Auth "user not found" continues to the profile and memory delete.

## Acceptance criteria
- [ ] With Supabase reads forced to fail, no CMS document or `cms_products` row changes through any path listed in tasks 2-5, and each returns an error (503 for edit reads).
- [ ] A row that exists but is not published, or has null data, is never treated as absent.
- [ ] A confirmed-absent row still allows a first save from the seed.
- [ ] Public site, `/api/shop/*`, and the tolerant filters and currencies GETs behave as before during a read failure.
- [ ] Filters, homepage sections, checkout, shop config and currencies block Save and offer Retry after a failed load.
- [ ] A currency change leaves `description` and all non-price columns unchanged on every product, trash included.
- [ ] Removing a currency with a non-zero price on a trashed product is rejected.
- [ ] Only `restoreProductWrite` clears `deletedAt` and `purgeAt`.
- [ ] Description images are removed only after a successful upsert, and never while another product references them.
- [ ] A shop config market default for an inactive country survives load and save.
- [ ] A failed auth delete keeps the user's profile but makes it inactive, and the operator is told which case applied. A failed CV removal keeps the application row, so the purge retries.
- [ ] Filter removal: item 11 behaviours pass their route and component tests, and audit details in the database stay complete.
- [ ] lint + i18n:check + test + build + test:e2e pass

## Risks / notes
- **API routes and RLS (security-reviewer):**
  - `forEdit=1` must run the guard before any strict read, including on routes that are public today.
  - Strict readers must only run after a guard. Anon RLS sees published rows only, so an anonymous cookie client would report a draft document as absent and see only published products.
  - `CmsReadError` responses must not expose database text.
- **Auth, service role (security-reviewer):** task 8 changes the service-role delete order.
- **User decision needed, user deletion:** `cms_audit_logs.user_id` references `auth.users(id)` with no `on delete` action (`supabase/cms-schema.sql:55`), and no migration changes it. If production matches, deleting a user with audit history fails at the auth step. After this plan that failure is clean, with the profile kept, but those users still cannot be deleted. A real fix needs a migration or a change to the audit rows, and migrations are excluded here. Check production before closing item 9.
- **User decision needed, approval gate fails open:** `requiresApprovalFor` uses the tolerant policy read, and the default is `requiresApproval: false`, memoized for 30 seconds. A failed policy read therefore lets changes skip approval. This is not a save-baseline path, so the plan leaves it unchanged. `ensureAccessControlHydrated` has a similar fallback to default permissions. Recommend a follow-up.
- **PII:** CVs are removed before the row, so a storage failure keeps the row and the purge retries on the next run. A crash between the two steps leaves a row whose CV is gone, which the retry then finishes.
- **Partial writes remain possible:** in a currency save, prices are written first and the document last, so an approval "failed" means the document did not change. If the document write fails after prices, only zero-price keys were added or pruned, and a retry finishes it. A filter removal can still race (#8).
- **Stale PUT:** `products/[id]` PUT still upserts when no row exists, so an editor left open can recreate a hard-deleted or purge-due product. New products use POST, so this could become a 404 in a follow-up.
- **Residual tolerant admin views:** the paged product list (`readProductsPage`) still falls back to seed for display. Its rows are not used as save baselines, except duplicate at `products/page.tsx:234`, which creates a new product and is protected by `assertProductIsNew`.
- **Blog and case-study editors:** a 503 on load shows "not found" or an endless skeleton. Save stays unreachable, so this is safe, and it is left as is.
- **Ownership:** `src/lib/map-locations.server.ts` and `src/app/api/map-locations/route.ts` are not in the Project map. They are assigned to builder-admin. No task needs another area.
- **One agent at a time (rule 7):** `filters/page.tsx` and `messages/en/admin.json` are task 6 only, `MapLocationEditor.tsx` is task 3 only. `faqs-repository.ts`, `media/page.tsx` and `BulkProductTable.tsx` are not edited.
- **Existing tests:** filter route tests that expect 500 on read failure change to 503.

## Out of scope
- Per-editor version tokens and concurrency (#8)
- `customFilters` persistence migration (#11)
- Product GET public projection downgrade (suspected)
- `marketplace:edit` vs `delete` permission (awaiting user)
- FAQ seed resurrection (`mergeMissingSeeds`)
- Operator scripts
