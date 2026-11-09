# Home ecosystem section: opening sequence, then arc, editable in the CMS

- status: implemented, pending user visual review and commit
- requested: 2026-11-04 · by: Patrick Oliveira
- source: `/Users/patrickoliveira/.claude/plans/curried-drifting-raccoon.md`, amended by a user scope change on 2026-11-04. Where they differ, this plan wins: no AI photos, no `ecosystem-*.jpg` wiring, and section copy moves to the CMS.

## Goal
Client feedback on `HomeEcosystemSection`: keep the graphic concept, but add a catchy opening sequence that represents each supply chain stage and plays without clicks. It plays once and stops on the slogan, then the interactive arc appears below it. Stage order is Propagation, Growing, Harvest, Packaging, Logistics & Transport, Retail Display. Point of Sale is removed from this section, arc labels get larger, and the closing sentence and slogan are rendered.

Each stage shows a code-built animated SVG scene in brand tokens. An admin can later replace any scene with an image and edit the section's text per locale in the homepage CMS. The page works unchanged when nothing is stored.

## Tasks
Run in the order shown. Tasks 2 and 3 can run together, and so can 5 and 6.

| # | Task | Agent | Files | parallel |
|---|------|-------|-------|----------|
| 1 | CMS contract: types, defaults, merge, migration, image validation, tests | builder-admin | `src/lib/cms/repositories/homepage-repository.ts`, `src/lib/cms/homepage-i18n.ts`, `src/lib/cms/__tests__/homepage-ecosystem.test.ts` (new) | no; must finish first |
| 2 | Admin editor for the section | builder-admin | `src/lib/cms/homepage-sections.ts`, `src/components/admin/homepage/HomepageSectionPage.tsx`, `src/components/admin/homepage/sections/HomeEcosystemSectionEditor.tsx` (new), `messages/en/admin.json` | yes, with 3 |
| 3 | SVG scenes, intro, arc changes, CMS wiring, message cleanup, POS image removal | builder-site | `src/components/sections/HomeEcosystemScenes.tsx` (new), `src/components/sections/HomeEcosystemIntro.tsx` (new), `src/components/sections/HomeEcosystemSection.tsx`, `src/components/sections/HomePageContent.tsx`, `messages/en/homeEcosystem.json`, `public/assets/homepage/ecosystem-pos.jpg` (delete) | yes, with 2 |
| 4 | Translations | i18n | `messages/{pt-BR,es,zh-CN}/homeEcosystem.json`, `messages/{pt-BR,es,zh-CN}/admin.json`, `src/lib/cms/homepage-i18n.ts` (`homeEcosystem` block only) | no; after 1 to 3 |
| 5 | Diff review; blocking findings go to the owning builder (max 2 loops) | reviewer | Read-only: all files above | yes, with 6 |
| 6 | Security review (focus below) | security-reviewer | Read-only: all files above, plus `src/app/api/cms/homepage/route.ts` and `src/lib/cms/server/approvals.server.ts` | yes, with 5 |

**Storage: no migration needed.** The homepage is one JSON document in `cms_documents` (`id = "homepage"`), or `data/cms/homepage-settings.json` without Supabase. Reads, writes, `PUT /api/cms/homepage`, approvals (`website.homepage`), revalidation and in-use media tracking all treat the document generically, so a new nested key flows through. `CONTENT_REVISION` does not need a bump. No new SQL goes on the production handover list, and no route or RLS change is planned.

## Data contract (admin to site)
Task 1 defines this; tasks 2 and 3 only consume it. Any change goes back through the orchestrator.

Exported from `homepage-repository.ts`:
- `HOME_ECOSYSTEM_STAGE_IDS`: `propagation`, `growing`, `harvest`, `packaging`, `logistics`, `retail`, in this order.
- `HomeEcosystemStageId`: the union of those ids.
- `HomepageSettings["homeEcosystem"]`: the shape below.

| Field | Type | Default, from `HOME_I18N.homeEcosystem` |
|-------|------|---------------------|
| `title` | LocalizedString | "From Propagation to\nRetail Display" (the user can revise this) |
| `bodyP1`, `bodyP2` | LocalizedString | Current `body.p1`, `body.p2` |
| `openingLine` | LocalizedString | "Oboya, your one-stop partner for horticulture." |
| `closingLine1` | LocalizedString | "One Partner, One Ecosystem," |
| `closingLine2` | LocalizedString | "Endless Opportunities to Perform Better." |
| `slogan` | LocalizedString | "Oboya, your one-stop partner for horticulture." |
| `skipLabel` | LocalizedString | "Skip" |
| `stages` | array of stage | The six stages below |

Each stage has:
- `id`: `HomeEcosystemStageId`
- `label`: LocalizedString
- `items`: array of `{ id: string; text: LocalizedString }`
- `image`: string, where `""` means show the SVG scene

| Stage | Default label | Default item ids and text |
|-------|---------------|---------------------------|
| `propagation` | Propagation | `trays` Propagation trays; `substrates` Specialized substrates; `machines` Seedling machines |
| `growing` | Growing | `pots` Pots; `substrates` Substrates; `irrigation` Irrigation systems |
| `harvest` | Harvest | `apv` APV System |
| `packaging` | Packaging | `clamshells` Clamshells with berries; `lettuceBags` Lettuce bags; `flowerSleeves` Flower sleeves |
| `logistics` | Logistics & Transport | `agv` AGV; `trolleys` Logistic trolleys; `buckets` Flower auction buckets |
| `retail` | Retail Display | `shelves` Oboya packaging in use on supermarket shelves, with produce inside |

Guarantees after `migrateSettings` (the site may rely on these and must not re-check them):
1. `homeEcosystem` is always present, including on stored documents that predate it.
2. `stages` always has exactly six entries in canonical order. Build it by mapping over the default stages and matching stored entries by `id`. Unknown ids, duplicates and stored reordering are dropped; the `pos` id is never kept.
3. All text passes through `mergeLocalized` in `mergeHomepageLocales`. An empty locale falls back to the default, so clearing a default field restores it.
4. If a stage has stored `items`, they are kept in stored order and capped at 4. Otherwise it uses the defaults. Stored items merge with defaults by item `id`. Custom items have no default, so an item that is blank in every locale is dropped.
5. `image` is `""` or a URL `next/image` can render. Anything else becomes `""`, which shows the SVG:
   - Accepted: `/uploads/...` and `/assets/...`, or `https` on the same Supabase host `next.config.ts` derives for `remotePatterns`, under `/storage/v1/object/public/`.
   - Rejected: `.svg` files, other hosts, other schemes.
   - Do not rely on `isAllowedImageSrc` alone. It accepts `http` and any host with a `cms-media` path, and `next/image` throws at render on hosts outside `remotePatterns`, which would break the home page.

Site consumption:
- `HomePageContent` renders `<HomeEcosystemSection data={homepage.homeEcosystem} locale={locale} animationsEnabled={animationsEnabled} />`, matching `Partners` and the other sections.
- Text uses `pickLocalized(field, locale)`, rendered as plain React text, never as HTML.
- Site-only mappings live in site code, keyed by stage `id`: icon and SVG scene.
- `homeEcosystem` is not added to `HomepageSectionId`, so there is no visibility toggle. The section is always rendered today, and this was not requested.

Text that stays in `messages/*/homeEcosystem.json`: control and accessibility labels only (`ariaLabel`, `prev`, `next`, `restart`).

## Task details

### Task 1: CMS contract (builder-admin)
- Add types, `defaultSettings()` entry, `mergeHomepageLocales` entry and `migrateSettings` handling per the contract.
- Add `HOME_I18N.homeEcosystem`. Copy existing translations verbatim from `messages/{locale}/homeEcosystem.json` for `bodyP1`, `bodyP2`, `closingLine2` and the unchanged stage labels. For new or changed strings, pass the English text in all four `homeLoc` arguments; task 4 replaces them.
- Tests in `homepage-ecosystem.test.ts`, through `replaceHomepageSettingsCache` and `getHomepageSettings`:
  - stored document with no `homeEcosystem`
  - partial `homeEcosystem`
  - stored `pos` stage, unknown id, wrong order
  - empty locale falls back to the default
  - item merge, removal and cap
  - accepted and rejected image values, including `http`, a foreign host, `.svg`, `javascript:` and non-strings
- Checks: `npm run lint && npm run i18n:check && npm test && npm run build`.

### Task 2: admin editor (builder-admin)
- `homepage-sections.ts`: add slug `homeEcosystem` right after `hero` (matching page order) and its `HOMEPAGE_SECTION_META` entry. The hub and the `[section]` route pick it up with no other change.
- `HomepageSectionPage.tsx`: register the editor in `SECTION_EDITORS`.
- `HomeEcosystemSectionEditor.tsx`: follow `CapabilitiesSectionEditor.tsx`.
  - Use `LocalizedInput` for all text, `multiline` for `title` and the body fields.
  - One card per stage, in fixed order, with no add, remove or reorder of stages.
  - Items can be added and removed up to 4, reusing `fields.addItem` and `fields.removeItem`, with new ids from `newId()`.
  - Use `ImageField` with `optional`. **Do not use `MediaPicker.tsx`: its image list is mock data.** `ImageField`'s clear button sets `""`, which restores the SVG.
  - Show a hint that an empty image uses the animated illustration, and that pasted links from other sites are not accepted.
- Do not change `HomepageSectionShell`, the API route or permissions. They already provide `Can module="website" action="edit"`, the locale tabs, `PendingChangeBanner` and the approval flow.
- Checks: `npm run lint && npm test && npm run build`. `npm run i18n:check` fails until task 4 because of the new `admin` keys.

### Task 3: public section (builder-site)
Read `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` first.

**`HomeEcosystemScenes.tsx` (new)**
- One abstract, code-built SVG scene per stage id, plus a `HomeEcosystemStageVisual` component: if `stage.image` is set, render `next/image` with `fill`; otherwise render the scene.
- Brand tokens only, through `oboya-*` classes or `var(--oboya-*)`. No hex or `rgba` values, no new dependency and no external assets.
- **No `<text>` in any SVG, and no invented labels, numbers, data, logos or product claims.** Scenes evoke the stage generically; they must not look like a specific Oboya product. Harvest in particular must not imply what the APV System looks like.
- SVGs are `aria-hidden`. Gradient and filter ids come from `useId`, because the same scene can be mounted twice (intro and arc).
- Animation is finite and ends on its static frame, with no infinite loops. A `static` prop renders that final frame directly.
- Composition must survive two crops: the intro stage and the arc's semicircle bowl (2:1, with a bottom fade). Use `preserveAspectRatio="xMidYMid slice"` and keep the subject in the central area.

**`HomeEcosystemIntro.tsx` (new, framer-motion)**
- Sequence:
  1. Opening line.
  2. Six stage scenes of about 2.5s each: visual, large stage label, short item list, progress indicator.
  3. Closing lines plus slogan, which hold and stay on screen.
  4. Arc reveal below the slogan.
- Timing: use named constants. Defaults are 2.5s opening and 3s hold, about 20.5s in total. These two durations are not user decisions, so they can be tuned.
- Start condition: `useInView` with `once: true` (pattern in `CompanyOverview.tsx:45`) on the sequence stage, not the whole section, AND `useHomeIntro()?.isUnlocked`. A null context counts as unlocked.
- Before start: show the opening line as a static frame, with Skip available, so the section is never blank.
- Hidden tab: follow `SolutionsHeroCarousel.tsx:36-40` for the listener, without the touch exclusion at `:26-34,42-43`, so it plays on phones. Also read `document.hidden` at start, because that pattern only reacts to changes. On return, restarting the current scene is acceptable.
- Scroll: no scroll lock.
- Skip: a visible button jumps to the slogan and arc, then moves focus to a sensible target (slogan container or first arc control) so focus is not lost when the button disappears.
- Static mode = reduced motion OR `animationsEnabled === false`. No sequence plays, slogan and arc show directly, and scenes render their static frame. `useReducedMotion` can differ between server and first client render, so avoid a hydration mismatch.
- Screen readers: all sequence content is available as static text. Animated scenes are `aria-hidden`, with no `aria-live` and no per-scene announcements. The progress indicator is decorative.
- Page weight: mount only the current and next visual. For image overrides, do not use the deprecated `priority` prop; use `loading="eager"` on the next image, per the docs above.

**`HomeEcosystemSection.tsx`**
- Props: `data`, `locale`, `animationsEnabled`. Replace `STAGES` image paths with `data.stages`, and keep a local id-to-icon map. Remove `pos`, the `ShoppingCart` import and the local `StageId`. Choose a Harvest icon that exists in the installed `lucide-react`.
- Arc media: replace the `<Image>` with `HomeEcosystemStageVisual`, so the arc shows the same visual as the sequence (static or finite animation). Override images keep the stage label as `alt`. The spin and bowl mask are unchanged.
- `restart` becomes `t("restart", { stage })`, using the first stage's localized label, because labels are now editable.
- Layout: the title and body stay where they are, then the sequence stage, then the arc (see open question 1). Keep the `h2` visible at all times, because `e2e/smoke.spec.ts` asserts the first `h2` on the home page is visible.
- Arc while hidden: **keep `frameRef` mounted and laid out.** Its width effect runs once on mount with `[]` deps, so conditional rendering would leave `width` at 0 and the arc would never become ready. Avoid `display: none` too. Hide it with `invisible` and `inert`, so controls cannot be focused or clicked and height stays reserved.
- Arc at reveal: starts on Propagation, and existing click, swipe, keyboard and wrap behaviour is unchanged.
- Larger labels: update the font, icon box and padding values at `:210-216`, the mobile truncation at `:217-219`, and `estimatedPillHalfW` at `:221-225`. `pillScale` can currently take mobile text down to about 8px, so it needs a floor. Size `estimatedPillHalfW` for the longest default label across all four locales, and check that the bowl does not shrink too far as `maxOuterR` falls.

**`messages/en/homeEcosystem.json`**: the changes listed under i18n below. Remove keys only once the component no longer reads them.

**Do not touch**
- `HomeIntroGate.tsx`, or any file outside this task's list.
- "point-of-sale" copy in `solutionsPage.json`, `nav.json` and `homepage-i18n.ts:198`, which describes a logistics solution.
- Non-`en` message files.
- The other five `public/assets/homepage/ecosystem-*.jpg` files (see open question 5). No code references them after this change. Do not add images.
- Uncommitted worktree changes: `package-lock.json`, `public/assets/solutions/fruits/propagation.jpg`, `src/components/sections/Hero.tsx`. Do not stage or revert them.

**Checks**: `npm run lint && npm test && npm run build`. `npm run i18n:check` fails until task 4, reporting key differences in `homeEcosystem` and `admin` only.

### Task 4: translations (i18n)
This plan explicitly extends this agent's scope to one non-`messages` block, because `homepage-i18n.ts` holds all four locales in one place.
- Messages: mirror the key list below to `pt-BR`, `es` and `zh-CN`, deleting removed keys. Keep the `{stage}` placeholder in `restart`.
- `src/lib/cms/homepage-i18n.ts`, `homeEcosystem` block only: replace the English placeholders in the `pt-BR`, `es` and `zh-CN` arguments. Leave every other block alone.
- Reuse existing Harvest terms from `solutionsPage.json:208`: `Colheita`, `Cosecha`, `采收`. Keep "APV System" and "AGV" as untranslated product terms. The old titles say Point of Sale and the old `closingLine1` uses other punctuation, so write these fresh.
- `npm run i18n:check` does **not** cover `homepage-i18n.ts`. Report that block's strings explicitly so the reviewer can confirm no English placeholder remains.
- Checks: `npm run i18n:check && npm test`.

### Task 5: review (reviewer)
- Check the diff against every acceptance criterion that can be judged from code, the data contract guarantees, the "Do not touch" list, and brand tokens only.
- Confirm no non-`en` string in `HOME_I18N.homeEcosystem` is an English placeholder, except "APV System" and "AGV".
- Confirm no image other than `ecosystem-pos.jpg` changed, and no `ecosystem-pos`, `stages.pos` or `ecosystem-*.jpg` reference remains in code.

### Task 6: security review (security-reviewer)
- `PUT /api/cms/homepage` stays behind `cmsGuard("website", "edit")` and `gateSettingsDocument`. Edits to `homeEcosystem` do not bypass approval, and the route's lack of schema validation is covered for the new key by `migrateSettings`.
- `image` validation: confirm the rules in guarantee 5, on both direct save and the approval apply path (`settingsDoc` calls `saveHomepageSettingsDurable`). A crafted value must not break the public page.
- CMS text is rendered as plain text, with no `dangerouslySetInnerHTML` and no raw values in SVG attributes.
- RLS and migrations are unchanged. No new env var, and no server secret exposed to the client bundle.

## i18n
**Namespace `homeEcosystem`, `messages/en/homeEcosystem.json`**
- Changed: `homeEcosystem.restart`: "Restart from {stage}"
- Removed (moved to the CMS defaults): `homeEcosystem.title`, `homeEcosystem.body.p1`, `homeEcosystem.body.p2`, `homeEcosystem.closingLine1`, `homeEcosystem.closingLine2`, `homeEcosystem.stages.propagation`, `homeEcosystem.stages.growing`, `homeEcosystem.stages.packaging`, `homeEcosystem.stages.logistics`, `homeEcosystem.stages.retail`, `homeEcosystem.stages.pos`
- Unchanged: `homeEcosystem.ariaLabel`, `homeEcosystem.prev`, `homeEcosystem.next`

**Namespace `admin`, `messages/en/admin.json`** (all new)
- `admin.website.home.sections.homeEcosystem.title`: "Ecosystem Journey"
- `admin.website.home.sections.homeEcosystem.description`: "Opening sequence, stage visuals and text, closing lines, and slogan."
- `admin.website.home.fields.ecosystemBodyP1`: "Body, first paragraph"
- `admin.website.home.fields.ecosystemBodyP2`: "Body, second paragraph"
- `admin.website.home.fields.ecosystemOpeningLine`: "Opening line"
- `admin.website.home.fields.ecosystemClosingLine1`: "Closing line 1"
- `admin.website.home.fields.ecosystemClosingLine2`: "Closing line 2"
- `admin.website.home.fields.ecosystemSlogan`: "Slogan"
- `admin.website.home.fields.ecosystemSkipLabel`: "Skip button label"
- `admin.website.home.fields.ecosystemStageLabel`: "Stage label"
- `admin.website.home.fields.ecosystemStageItem`: "Item"
- `admin.website.home.fields.ecosystemStageImage`: "Stage image"
- `admin.website.home.fields.ecosystemStageImageHint`: "Leave empty to show the animated illustration. Use an uploaded or library image; links from other sites are not accepted."

**Not in `messages/`: `HOME_I18N.homeEcosystem` in `src/lib/cms/homepage-i18n.ts`**, holding the defaults in the data contract, in four locales (task 4).

## Acceptance criteria
Code checks:
- [ ] Stage order in both the sequence and the arc is Propagation, Growing, Harvest, Packaging, Logistics & Transport, Retail Display.
- [ ] No `pos` stage, `stages.pos` key or `ecosystem-pos` reference remains, and `ecosystem-pos.jpg` is deleted.
- [ ] No code references `ecosystem-*.jpg`, and no AI or placeholder image is added.
- [ ] SVG scenes contain no `<text>`, hex or `rgba` values, and no infinite animation.
- [ ] No loop path exists: the sequence ends on the slogan, and no timer runs after it.
- [ ] No body scroll lock, no `aria-live` in the sequence, and no `priority` prop in new code.
- [ ] Only brand tokens in new visuals; no new dependency; no file added to `supabase/`.
- [ ] Tests in `homepage-ecosystem.test.ts` cover every case listed in task 1 and pass.
- [ ] Each changed message key matches across all four locales, with `{stage}` preserved.

Public page, in the browser at `/en` and `/pt-BR`, desktop and about 390px width, with long labels also checked in `es` and `zh-CN`:
- [ ] With nothing stored, all text and all six SVG scenes render with no errors.
- [ ] Autoplay does not start until the sequence stage is scrolled into view, or while the loading overlay is up.
- [ ] It runs through all scenes with no clicks, on desktop and on a touch-emulated phone.
- [ ] It stops on the closing lines and slogan; the slogan stays on screen after the arc appears.
- [ ] The arc appears below the slogan on Propagation, and works by click, swipe and keyboard.
- [ ] Arc controls cannot be reached by Tab before the reveal.
- [ ] Skip jumps to the slogan and arc at any point, including before autoplay starts, and focus lands on a visible element.
- [ ] Hiding the tab pauses the sequence, and returning resumes it without skipping stages.
- [ ] With reduced motion emulated, no sequence plays, slogan and arc show directly, scenes show a static frame, and there is no hydration warning.
- [ ] With CMS animations off, behaviour matches reduced motion.
- [ ] A screen reader or accessibility tree exposes all stage labels and items as static text.
- [ ] No layout shift when the arc appears: the top of the stage and the arc, and the content below, keep their position from sequence start to reveal.
- [ ] No horizontal scroll at 320px, 390px, 768px and 1280px.
- [ ] Pill labels are at least 16px on desktop, 14px on tablet and 12px on mobile (proposed values; the approved plan only says "larger").
- [ ] Pill labels are not truncated and pills do not overlap, in all four locales, at 320px and 390px.
- [ ] Scenes read correctly in both the intro stage and the arc's bowl crop.

Admin, at `/admin/website/home/homeEcosystem`:
- [ ] The section appears in the homepage hub, and the editor loads current values for all four locale tabs.
- [ ] Editing text in one locale changes only that locale on the public page, after save.
- [ ] Clearing a default text field and saving restores the default.
- [ ] Setting a stage image replaces that stage's scene in both the sequence and the arc; clearing it restores the SVG.
- [ ] A pasted foreign URL does not break the public page: that stage shows the SVG.
- [ ] Saving an unrelated homepage section keeps ecosystem edits.
- [ ] A user without `website` edit permission gets `AccessDenied`, and `PUT` is refused.
- [ ] A user whose edits require approval sees the pending banner, and the public page does not change until approval. After approval, the edit is live.
- [ ] An override image in use is marked as in use in the media library.

Commands:
- [ ] `npm run lint && npm run i18n:check && npm test && npm run build && npm run test:e2e` pass. The smoke test fails on console errors at each locale's home page, so run it after task 4.

## Risks / notes
- **Auth, approvals, API, RLS:** the editor writes through the existing guarded route and approval flow, with no change to any of them. `PUT /api/cms/homepage` has no schema validation, so `migrateSettings` is the only gate for `image` (hence guarantee 5 and task 6). No secrets or new env vars; the Supabase host check uses the existing public URL.
- **Defaults freeze on first save:** the editor sends the whole document, so saving **any** homepage section stores the current `homeEcosystem` values. Later code changes to defaults then stop reaching production for fields that have been saved (`mergeLocalized` only fills blanks and untranslated copies). Settle the title and copy wording before admins start saving, or change them through the CMS afterwards.
- **Whole-document saves:** two admins editing different homepage sections can overwrite each other. This is pre-existing.
- **Honest visuals:** SVGs are illustrations, not product depictions. The client's references (APV System, AGV, packaging on shelves) are named in text only. Real photos can be added later through the override.
- **Stage image quality:** the override accepts whatever is uploaded, in both crops, with no aspect ratio check. The hint and preview are the only guidance.
- **Gate may never unlock without hero media (found while reading, not run):** `isUnlocked` only becomes true on the overlay's opacity `transitionend`. With `waitForHero={false}` (`src/app/[locale]/page.tsx:45-49`), the overlay renders at opacity 0 from the start, so that transition seems not to fire. The body scroll lock would also stay on. This looks pre-existing and affects the page beyond this feature. It is left out of scope; the static first frame and Skip keep the arc reachable (see open question 2).
- **Blank area during playback:** reserving arc height leaves empty navy space below the stage until the reveal. This is the accepted cost of no layout shift.
- **Existing shift:** the arc frame changes from `minHeight: 240` to its measured height on mount. This predates the feature, and the "no layout shift" criterion covers the reveal only.
- **Mobile pill fit:** by rough geometry at 390px, adjacent pills have little vertical clearance once "Logistics & Transport" is untruncated. Editors can also enter longer labels. Adjust the `PILL_STEP_MOBILE_DEG` angle or allow a two-line label if needed.
- **Before committing:** `package-lock.json` has an unexplained -557 line change. Do not include it without checking. The propagation image and `Hero.tsx` changes from earlier are also uncommitted.

## Open questions
Defaults below let the build proceed. None changes a user decision.
1. **Title and body position:** the approved plan does not place them. Default: they stay above the sequence, as now.
2. **Gate with no hero media:** fix it in a separate task? Default: not in this plan.
3. **Other "from propagation to point of sale" copy:** `homepage-i18n.ts:27`, `about-page/defaults-culture.ts:23`, `solutions-page-repository.ts:57,69` and `solutionsPage.json` (`:23,137,174,266`) use this phrase outside the section, and it is not covered by the approved "leave alone" reasoning. Default: unchanged, because the removal decision is about this section.
4. **Meaning of "plays once":** default is once per page load, with no stored state, so it replays on reload or a return visit.
5. **The five remaining `ecosystem-*.jpg` files:** they become unused. Default: leave them in place for the user to delete, or to upload as overrides if wanted.
