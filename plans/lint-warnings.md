# Zero `npm run lint` warnings (no behavior change)

- status: done
- requested: 2026-10-20 · by: patrickoliveira

## Goal
`npm run lint` currently reports 51 warnings, 0 errors: 24 `react-hooks/exhaustive-deps`, 20 `@typescript-eslint/no-unused-vars`, 6 `@next/next/no-location-assign-relative-destination` and 1 `jsx-a11y/role-supports-aria-props`. Bring that to 0 without changing runtime behavior. No effect may run at a new time, no memo may recompute at a new time, navigation semantics stay the same, and nothing changes visually. Every fix below was checked against the source. Where a code fix could change behavior, the plan uses a targeted `eslint-disable-next-line` with a reason instead.

## Decisions that apply to many warnings

**D1 – `_` / omit-from-rest convention (eslint config).** `eslint.config.mjs` has no ignore pattern today, so `_`-prefixed bindings are flagged. The code already uses a `_` prefix consistently in two cases: destructures that omit a prop from a `...rest` spread, and placeholder params that call sites still pass. Do **not** delete those bindings. Dropping an omit-destructure would leak the field into `rest`, and dropping a param breaks callers and types. Instead, write the convention into the config by adding this block after `...nextTs`:
```js
{
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", ignoreRestSiblings: true },
    ],
  },
},
```
`warn` keeps the current severity. Other options keep their typescript-eslint v8.62 defaults (`vars: all`, `args: after-used`, `caughtErrors: all`). This only changes lint and does not affect runtime. It clears 13 warnings (9 rest-siblings + 4 `_` params), listed per file below as "resolved by D1, no code edit".

**D2 – `t` / `tCommon` / `tProducts` in admin hook deps are stable.** Admin is wrapped by `AdminIntlProvider` (`src/contexts/AdminLocaleContext.tsx`). It renders `<NextIntlClientProvider key={activeLocale} messages={MESSAGE_CATALOG[activeLocale]} timeZone="UTC">`, where the messages are module constants and there are no `formats`, `now` or `onError` props. use-intl's `IntlProvider` memoizes its context value, and `useTranslations` memoizes `translate` on that context (`node_modules/use-intl/dist/esm/development/react.js`). A locale switch changes the `key`, which remounts the whole subtree, so effects re-run on a locale switch anyway. So for the life of a mounted admin component, every admin translator keeps the same identity. Adding them to deps cannot change when an effect or callback runs. The repo already does this, e.g. `users/page.tsx` `loadUsers` has `[t]` and `media/page.tsx` has `[refresh, t]`.

**D3 – `no-location-assign-relative-destination` (6 warnings).** The rule (`node_modules/@next/eslint-plugin-next/dist/rules/no-location-assign-relative-destination.js`) flags `location.href = X` and `location.assign(X)` only when X resolves statically to a relative string. Identifiers whose definition is a function **parameter** resolve to `null` and are not reported. That is why `AdminLoginForm.tsx:40,74` (`safeAdminNext(...)`) are not flagged today. Every flagged site is a deliberate full-page navigation in an admin auth flow: after login, password change or reset, or logout, the JWT/session cookie must be re-read and all client state (AdminProvider, `oboya-admin-user`, media caches) dropped. Next's own docs endorse this: `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md` L257, "For logout flows, using `window.location.href` instead of `router.push` triggers a full page reload, clearing all client-side state." `router.push` (soft navigation) would change behavior, and `location.replace` would change history. **Fix:** add one helper, `src/lib/cms/hard-navigate.ts`:
```ts
/**
 * Full-page navigation (intentionally NOT router.push). Used by admin auth flows so the
 * refreshed session cookie is read by the proxy and all client-side state is discarded.
 * See next/dist/docs/01-app/02-guides/preserving-ui-state.md ("logout flows").
 */
export function hardNavigate(path: string): void {
  window.location.href = path;
}
```
and replace each flagged `window.location.href = "<literal>"` with `hardNavigate("<literal>")`. It is the same statement with the same string, so the behavior is identical: a full document load with a pushed history entry, and the relative URL resolves against the document the same way. There is no `<base>` tag in `src`. The file has no `"server-only"` import, so client components can use it. *Fallback if the reviewer rejects the helper:* keep the original lines and put `// eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reload after auth change` above each one.

**D4 – unused `useTranslations(...)` calls.** Deleting an unused `const tX = useTranslations(...)` is safe. The hook only reads context, and removing it consistently on every render does not break hook order.

## Tasks
| # | Task | Agent | Files | parallel |
|---|------|-------|-------|----------|
| 1 | Add D1 rule override to the eslint config. The file is unmapped, so it is declared here and owned by builder-admin for this plan. | builder-admin | `eslint.config.mjs` | yes |
| 2 | Admin CMS warnings: admin app, admin components, `src/app/api/cms/**`, `src/lib/cms/**`. Add the D3 helper. | builder-admin | listed in §Task 2 | yes (no shared files with 1/3/4; one agent holds rule-7 files `media/page.tsx`, `MapLocationEditor.tsx`, `RichTextEditor.tsx`) |
| 3 | Public site warnings, plus `src/lib/map-locations.ts`. That file is unmapped and consumed mostly by `src/components/sections/*`, so it is assigned to builder-site and declared here. | builder-site | listed in §Task 3 | yes |
| 4 | Shop/checkout warnings | builder-shop | listed in §Task 4 | yes |

Tasks 1 to 4 share no files. Tasks 1 and 2 are both builder-admin, so they run sequentially in one session (Task 1 first). The lint acceptance for D1-resolved lines in Tasks 2 and 4 depends on Task 1 being merged. Shared UI (`src/components/ui`, `src/hooks`, `src/types`) and `src/contexts/**` are **not** touched.

### Task 2 – builder-admin (41 warnings)

`src/app/admin/(auth)/change-password/page.tsx`
- 40:9 and 62:7, no-location-assign: `window.location.href = "/admin/dashboard";` becomes `hardNavigate("/admin/dashboard");` (D3). Import `{ hardNavigate } from "@/lib/cms/hard-navigate"`.

`src/app/admin/(auth)/reset-password/page.tsx`
- 34:7 and 47:5, no-location-assign: `window.location.href = "/admin/login";` becomes `hardNavigate("/admin/login");` (D3).

`src/components/admin/auth/AdminLoginForm.tsx`
- 69:7, no-location-assign: `window.location.href = "/admin/change-password";` becomes `hardNavigate("/admin/change-password");` (D3). Leave lines 40 and 74 unchanged; they are not flagged.

`src/components/admin/MapLocationEditor.tsx` (rule-7 file)
- 78:6, exhaustive-deps: the effect deps `[]` become `[t, tCommon]`. Stable per D2, so it still runs once per mount.
- 269:6, exhaustive-deps: `handleSave` deps `[data]` become `[data, tCommon]`. Stable per D2.
- 275:5, no-location-assign: `window.location.href = "/admin/login";` becomes `hardNavigate("/admin/login");` (D3).

`src/app/admin/(dashboard)/case-studies/[id]/page.tsx`
- 110:6, exhaustive-deps: `[id, isNew, router]` becomes `[id, isNew, router, t, tCommon]` (D2).

`src/app/admin/(dashboard)/case-studies/page.tsx`
- 121:5, exhaustive-deps (missing `handleDelete`): **eslint-disable**. `handleDelete` is a plain function recreated every render. Adding it would rebuild `columns` on every render and hand `DataTable` a new array each time, which risks resetting table state and is a behavior change. Its closure only uses `load`, `notifyPending`, `t`, `tCommon` and state setters, so the memoized one is equivalent. Add above `[t, tCommon]`:
  `// eslint-disable-next-line react-hooks/exhaustive-deps -- columns memoized on translators only; handleDelete closes over stable setters/translators`

`src/app/admin/(dashboard)/users/page.tsx`
- 295:5, exhaustive-deps (missing `handleDelete`, `handleResetPassword`): **eslint-disable** for the same reason. Both handlers close over `loadUsers` (a `useCallback` on `[t]`) and `t`, both stable per D2. Add above `[t, tCommon, tRoles, roleDefs, isSuperAdmin]`:
  `// eslint-disable-next-line react-hooks/exhaustive-deps -- row action handlers only close over stable loadUsers/t; adding them would rebuild columns every render`

`src/app/admin/(dashboard)/media/page.tsx` (rule-7 file)
- 361:9, no-unused-vars: delete `const tCommon = useTranslations("admin.common");` in `MediaLibraryPage` (D4). The other `tCommon` declarations at 82, 231, 275 and 325 are in other components and are used.
- 464:47, 465:74, 466:72, exhaustive-deps (unnecessary `refreshKey`): **eslint-disable** on each line. `getAllTags`, `getFolderBreadcrumb` and `getChildFolders` read a module-level media cache, and `refreshKey` is the deliberate cache-bust trigger. Removing it would serve stale tags and folders. Put this above each of the three lines:
  `// eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey busts the module-level media cache`
- 481:6, exhaustive-deps (unnecessary `libraryVersion`, `refreshKey`): **eslint-disable** for the same reason (`getMediaAssets` and `searchMediaAssets` read the module cache). Put this directly above the deps line `}, [currentFolderId, …, libraryVersion]);`:
  `// eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey/libraryVersion bust the module-level media cache`

`src/app/admin/(dashboard)/website/about/page.tsx`
- 42:6, exhaustive-deps: `[]` becomes `[t, tCommon]` (D2).
- 70:6, exhaustive-deps: `[settings, notifyPending]` becomes `[settings, notifyPending, t, tCommon]` (D2).

`src/app/admin/(dashboard)/website/faqs/page.tsx`
- 100:6, exhaustive-deps (missing `refresh`, `t`): **eslint-disable**. `refresh` is a plain `async` function recreated every render. Adding it would re-run the effect on every render, and since the effect calls `setLoading(false)` and `refresh()` sets state, that is a refetch loop. Follow the existing repo convention from `case-studies/page.tsx:39` and add above `}, []);`:
  `// eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only; refresh is recreated every render`

`src/app/admin/(dashboard)/website/news/page.tsx`
- 40:6, exhaustive-deps: `[]` becomes `[t, tCommon]` (D2).

`src/app/admin/(dashboard)/website/solutions/page.tsx`
- 102:6, exhaustive-deps: `[]` becomes `[t, tCommon]` (D2). `updateShopCatalog` is an import and is not flagged.
- 126:6, exhaustive-deps: `[settings, notifyPending]` becomes `[settings, notifyPending, t, tCommon]` (D2).

`src/components/admin/editors/RichTextEditor.tsx` (rule-7 file)
- 182:5, exhaustive-deps (unnecessary `libraryTick`): **eslint-disable**. `getMediaAssets()` reads the module cache, and `libraryTick` is bumped after `replaceMediaAssetsCache` to recompute. Removing it would leave the picker stale. Put this above `[folderNameById, libraryTick]`:
  `// eslint-disable-next-line react-hooks/exhaustive-deps -- libraryTick busts the module-level media cache`

`src/components/admin/marketplace/ProductColorVariantsCard.tsx`
- 123:5: same as RichTextEditor, **eslint-disable** with the same comment.

`src/components/admin/marketplace/ProductImagesCard.tsx`
- 125:5: same, **eslint-disable** with the same comment.

`src/components/admin/marketplace/ProductRichTextEditor.tsx`
- 117:5: same, **eslint-disable** with the same comment.
- 206:5, exhaustive-deps (missing `tProducts`): `[openImageDialog, refreshLibrary]` becomes `[openImageDialog, refreshLibrary, tProducts]`. `tProducts = useTranslations("admin.products")` at L88 is stable per D2.

`src/components/admin/homepage/sections/GlobalPresenceSectionEditor.tsx`
- 17:9, no-unused-vars: delete `const tCommon = useTranslations("admin.common");` (D4).

`src/app/api/cms/marketplace/currencies/route.ts`
- 21:12, no-unused-vars (`error`): `} catch (error) {` becomes `} catch {` (optional catch binding, already used across the repo). The response is the same.

`src/app/api/cms/marketplace/filters/route.ts`
- 65:19 `_removed`: resolved by D1, no code edit. This omit-from-rest strips `flag`.

`src/lib/cms/approvals/client.ts`
- 18:22 `_a` and 19:23 `_b`: resolved by D1, no code edit (omit-from-rest).

`src/lib/cms/repositories/homepage-repository.ts`
- 515:29 `_legacyFeatured`: resolved by D1, no code edit (omit-from-rest that strips legacy `featuredProducts`).

`src/lib/cms/sanitize-rich-html.core.ts`
- 24:20 and 77:25 `_removed`: resolved by D1, no code edit. These omit-from-rest bindings strip `style` and `href`. **They must not be deleted**: they are the sanitizer's removal step.

`src/lib/cms/server/approvals.server.ts`
- 74:39 `_request` (param of a no-op hook that is called at L118): resolved by D1, no code edit.
- 200:30 `_omit`: resolved by D1, no code edit (omit-from-rest).

`src/lib/cms/server/public-product.ts`
- 4:22 `_deletedAt` and 4:43 `_purgeAt`: resolved by D1, no code edit. The omit-from-rest keeps soft-delete fields out of the public payload. **Must not be deleted.**

`src/lib/cms/server/site-media.server.ts`
- 35:32 `_publicPath` (param; caller passes an argument at L138): resolved by D1, no code edit.

`src/lib/cms/site-media-urls.ts`
- 36:23 `_url` (param; caller passes an argument at L84): resolved by D1, no code edit.

New file: `src/lib/cms/hard-navigate.ts` (D3).

### Task 3 – builder-site (5 warnings)

`src/components/about/AboutTimeline.tsx`
- 367:36, exhaustive-deps (ref in cleanup): add `const proxy = focusProxy.current;` as the first line inside the `useLayoutEffect` (L326) and use `proxy` in the cleanup: `gsap.killTweensOf(proxy);`. Using it for the other in-effect reads is optional. `focusProxy` is `useRef({ angle: 0 })` (L263) and `.current` is never reassigned (only `.angle` is mutated), so `proxy` is the same object, which makes this identical.

`src/components/about/ValuesSqueezeCarousel.tsx`
- 21:7, no-unused-vars: delete `const BANNER_TRANSITION_S = SQUEEZE_BANNER_S;` **and** remove `SQUEEZE_BANNER_S,` from the import list at L9. It has no other use in this file, so leaving the import would create a new warning. The module stays imported for its other named exports.

`src/components/contact/ContactFieldControls.tsx`
- 255:7, jsx-a11y/role-supports-aria-props: remove `aria-required={required || undefined}` (L262) from the trigger `<button>`. ARIA does not support `aria-required` on role `button`, so conforming AT ignores it. No CSS selector, test or e2e references `aria-required`, which was checked with a grep of `src` and the e2e and tests folders. There is no visual change. The `required` prop is still applied to the hidden input (L284). Do **not** switch the role to `combobox`, because that changes semantics.

`src/components/sections/Testimonials.tsx`
- 149:6, exhaustive-deps (missing `carousel`): before the effect, add `const carouselGo = carousel.go;`. Inside the effect call `carouselGo(-1)` and `carouselGo(1)`, and use deps `[carouselGo]`. The effect still re-subscribes exactly when `carousel.go`'s identity changes. `go` is a `useCallback` closure in `src/hooks/useHorizontalCarousel.ts:102` and does not depend on `this`, so calling it detached is the same. `src/hooks` itself is not edited.

`src/lib/map-locations.ts` (unmapped, assigned to builder-site)
- 183:10, no-unused-vars: delete the private `isLegacyTranslation` function (L183–187) **and** `const LEGACY_OFFICE_KEYS = …` (L118). L186 is its only use, so it would otherwise become a new unused-var warning. It is a pure `.map`, and `MAP_OFFICE_FIELDS` stays used elsewhere. `MapLocationTranslation` is an exported type and stays.

### Task 4 – builder-shop (5 warnings)

`src/components/checkout/CheckoutPage.tsx`
- 51:9, no-unused-vars: delete `const tShop = useTranslations("shop");` (D4). The grep hits at L195 and L206 are `formatShopPrice`, not `tShop`.

`src/components/checkout/CheckoutUpsell.tsx`
- 96:6, exhaustive-deps (unnecessary `lineKey`): **eslint-disable**. `getLineItems` may keep the same identity while the cart contents change, and `lineKey` (L48) is the deliberate trigger that recomputes upsells when the cart changes. Removing it could leave upsells stale. Put this directly above the deps array `}, [`:
  `// eslint-disable-next-line react-hooks/exhaustive-deps -- lineKey recomputes when cart contents change`

`src/components/shop/catalog/FilterSidebar.tsx`
- 10:15, no-unused-vars: delete `import type { ShopLocalizedText } from "@/lib/shop/types";`. It is type-only, so the runtime is unaffected.

`src/components/shop/toolbar/ShopToolbarSelect.tsx`
- 92:6, exhaustive-deps (missing `updateMenuBox`): **eslint-disable**. `updateMenuBox` is recreated every render and calls `setMenuBox({...})` with a new object. If it were a dep, while the menu is open each run would set state, re-render, produce a new function, and run the effect again: an infinite loop with listener churn. Put this above `}, [listId, open]);`:
  `// eslint-disable-next-line react-hooks/exhaustive-deps -- updateMenuBox is recreated each render and sets state; effect must only re-run on open/listId`

`src/lib/shop/checkout/freight.ts`
- 4:3 `_input` (public API param, used by `src/lib/shop/__tests__/checkout.test.ts`): resolved by D1, no code edit.

### Count check
The tasks cover 41 (Task 2) + 5 (Task 3) + 5 (Task 4) = 51 warnings. By fix type: 25 code fixes, 13 targeted `eslint-disable-next-line react-hooks/exhaustive-deps` comments, and 13 resolved by the D1 config with no code edit (12 in Task 2, plus `freight.ts` in Task 4).

## i18n
New or changed keys in `messages/en/`: **none**. No `messages/*` changes are expected and builders must not touch them. Removing unused `useTranslations` calls removes no keys from the catalogs.

## Acceptance criteria
- [ ] `npm run lint` reports `0 problems` (0 errors, 0 warnings).
- [ ] The only new `eslint-disable` comments are the 13 listed above. Each is `-next-line react-hooks/exhaustive-deps` with a `-- reason`. There are no file-level disables and no rule turned off globally.
- [ ] `eslint.config.mjs` diff is limited to the D1 override.
- [ ] `git diff` shows no behavior change. Specifically: no route, URL or navigation-method change (`hardNavigate` is still `window.location.href`), no dependency removed from any hook, no omit-from-rest destructure removed, and no change to JSX output besides the removed `aria-required`.
- [ ] `npm run i18n:check`, `npm test` and `npm run build` pass.
- [ ] Manual smoke (`npm run test:e2e` is optional; UI behavior is unchanged): admin login, logout from Map editor, change-password and reset-password still do a full-page load. The media library refreshes after upload. The shop toolbar select opens and repositions on scroll without a render loop.

## Risks / notes
- **Security-reviewer required.** These are auth/API surfaces, even though only lint-level edits are made:
  - `src/app/admin/(auth)/change-password/page.tsx`, `src/app/admin/(auth)/reset-password/page.tsx` and `src/components/admin/auth/AdminLoginForm.tsx`: post-auth navigation through the new `src/lib/cms/hard-navigate.ts`. Confirm it is still a full reload and that `safeAdminNext` call sites are untouched.
  - `src/components/admin/MapLocationEditor.tsx`: logout navigation.
  - `src/app/api/cms/marketplace/currencies/route.ts`: API route, catch binding only. `src/app/api/cms/marketplace/filters/route.ts`: no edit.
  - `src/lib/cms/sanitize-rich-html.core.ts` (XSS sanitizer) and `src/lib/cms/server/public-product.ts` (public payload filtering): the omit-from-rest bindings must stay. D1 silences them through config. Reviewer: confirm there is no code diff in these files.
  - None of the warnings are under the map's Database/security paths (`supabase/**`, `src/lib/supabase`, `src/lib/security`, `src/app/auth`, `src/app/api/cron`).
- **Unmapped files:** `eslint.config.mjs` is assigned to builder-admin and `src/lib/map-locations.ts` to builder-site. Both are declared above. `src/lib/shop/checkout/freight.ts` maps to builder-shop and `src/lib/cms/**` to builder-admin.
- D1 makes lint ignore `^_` params and rest-siblings repo-wide from now on. This writes down the existing convention; it does not loosen any other check.
- Pre-existing bug found, **not fixed here** because fixing it would change behavior: `MapLocationEditor.tsx:272` has `if (!isSupabaseConfigured) return;`, which tests the function reference and is always truthy, so it is never called. Follow up separately.
- If `npm run lint` shows new warnings after the edits (e.g. a newly unused import after removing a `useTranslations` line), fix them with the same rules. Do not add new disables without updating this plan.
