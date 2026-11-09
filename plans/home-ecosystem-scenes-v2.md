# Home ecosystem: semi-realistic scenes, no arc, looping sequence

- status: T1 to T4 built; T2 checkpoint approved by the user (see the criteria box below); review fixes applied; T6 translations, T7 review and T8 close pending.
- requested: 2026-11-04 · by: Patrick Oliveira
- source: `/Users/patrickoliveira/.claude/plans/curried-drifting-raccoon.md` (approved by the user). Where this plan adds detail, the source decisions still win.
- supersedes these parts of `plans/home-ecosystem-opening-sequence.md`: the arc and its reveal, "plays once", "no loop path", "no timer after the sequence", the two-crop scene rule, and the pill label criteria. Its data contract, storage notes and image validation stay in force.

## Goal
Replace the simple SVG scenes with a cohesive semi-realistic set (front view, slight depth) that is never clipped, remove the arc from this flow, and make the sequence loop: after the closing phase, the slogan holds with a 20s timer and the cycle restarts. Stop after the kit and the Propagation and Retail pilot scenes, so the user can judge the style in the real sequence before the other four are built.

**State this limit to the user at the checkpoint and at close:** code-built SVG reads as detailed illustration, not photography. It cannot show real Oboya products or the APV System accurately. Real photos remain possible through the existing per-stage admin image field.

## User decisions (do not change)
- Style: semi-realistic, front view, slight depth.
- End of sequence: slogan plus a 20s timer, then the cycle restarts.
- The arc ("roleta") is removed from this flow.
- Pilot first (kit, Propagation, Retail), then a stop until the user approves.

## Root causes being fixed
- **Clipping:** a 400x200 canvas with `slice` inside a fixed-height card (`HomeEcosystemIntro.tsx:135`, `h-44/56/64`). On desktop the card is about 3.2:1, so about 37% of the canvas height is cropped. `Frame` also shifts content by -18 (`HomeEcosystemScenes.tsx:96`).
- **Incohesion:** each scene invents its own proportions, floor and shading. `Frame` provides only a background.

## Tasks
Run strictly in this order. `builder-site` is one agent throughout, for visual cohesion. Only T5 can run alongside another task.

| # | Task | Agent | Files | parallel |
|---|------|-------|-------|----------|
| 1 | Kit, Propagation and Retail pilot, card ratio, wired into the real sequence | builder-site | New: `src/components/sections/ecosystem-scenes/kit.tsx`, `.../propagation.tsx`, `.../retail.tsx`. Changed: `src/components/sections/HomeEcosystemScenes.tsx` (`SCENES` map only), `src/components/sections/HomeEcosystemIntro.tsx` | no |
| 2 | **Checkpoint:** capture frames, show the user, wait for approval | main session | Read-only; captures stay in the session scratchpad | no; blocks everything below |
| 3 | Growing, Harvest, Packaging, Logistics scenes | builder-site | New: `.../growing.tsx`, `.../harvest.tsx`, `.../packaging.tsx`, `.../logistics.tsx`. Changed: `.../kit.tsx` (additions only), `HomeEcosystemScenes.tsx` (`SCENES` map, delete replaced code) | no; after T2 approval |
| 4 | Arc removal, loop, Pause/Play, static grid, final move to the new folder | builder-site | Changed: `src/components/sections/HomeEcosystemSection.tsx`, `HomeEcosystemIntro.tsx`, `messages/en/homeEcosystem.json`. New: `.../ecosystem-scenes/index.tsx`. Deleted: `HomeEcosystemScenes.tsx`, `src/lib/geometry/arc.ts` | yes, with 5 only |
| 5 | Stage image hint recommends 2:1 | builder-admin | `messages/en/admin.json` (one key) | yes, with 4 only |
| 6 | Translations | i18n | `messages/{pt-BR,es,zh-CN}/homeEcosystem.json`, `messages/{pt-BR,es,zh-CN}/admin.json` | no; after 3 to 5 |
| 7 | Diff review; blocking findings go to the owning builder, max 2 loops | reviewer | Read-only | no |
| 8 | Close: full checks, final captures, behaviour run, update this plan's status | main session | This plan | no |

`HomePageContent.tsx` needs no change: the section keeps its props (`data`, `locale`, `animationsEnabled`). `security-reviewer` is not needed: no task touches a sensitive path. Run it if the diff reaches one.

**Next.js:** no new Next.js API is involved. `next/image` use stays as it is, including `loading="eager"` rather than the deprecated `priority`.

## How the pilot is seen before the other four exist
There is no flag, preview route or query parameter. The pilot runs on the normal home page (`/en`), in the real order, and the page keeps working.

1. `SCENES` in `HomeEcosystemScenes.tsx` stays the single lookup. T1 changes only two entries, `propagation` and `retail`, to import from `ecosystem-scenes/`. `growing`, `harvest`, `packaging` and `logistics` keep their old functions in that file.
2. `HomeEcosystemStageVisual` stays exported from `HomeEcosystemScenes.tsx`, so no consumer changes import. The scene contract `(props: { st: boolean }) => ReactNode` does not change, so new scenes also work with `static`.
3. The card moves to `aspect-[2/1]` in T1. The old 2:1 canvas then shows in full with `slice`, so old scenes still render, and they look larger and cruder next to the new ones. That is expected.
4. The arc and the play-once ending stay in place during the pilot. After the closing phase the arc reveals as it does today, and it shows the new scenes in its bowl crop. That crop is cropped by design and is not being judged, but it must not throw errors.
5. Timing on the real page: Propagation appears 2.5s after the sequence starts, and Retail at 15s. The current cycle is unchanged until T4.

T3 replaces each old scene as it lands, deleting its old function and any helper left unused. The page works after each replacement. T4 removes the last of the old file.

**Capture hook (T1, kept to the end):** the capture and behaviour runs need to time from the phase, not a fixed interval. Add two non-visual attributes in `HomeEcosystemIntro.tsx`:
- `data-eco-phase` on the stage root, with `idle`, `opening`, `stage` or `closing` (T4 adds `hold`).
- `data-eco-scene="<stage id>"` on the current scene's wrapper only.

## T1: kit and pilot (builder-site)

### `ecosystem-scenes/kit.tsx`
- **Geometry, as exported constants that scenes use instead of literals:** canvas `800x400`, horizon height, floor line, subject baseline, side margins.
- **`SceneFrame`:** `viewBox="0 0 800 400"`, `aria-hidden`, no content shift, shared set (greenhouse/backdrop depth, floor line, horizon, vignette, margins).
- **Blur cost:** render the blurred backdrop as its own `<svg>` beneath the animated one, with the same viewBox. Animating inside an SVG repaints that SVG, so a filter in the same one would be re-rasterised on every frame.
- **One light:** soft from top-left. One recipe each for highlight, shade and contact shadow, used everywhere.
- **Materials as reusable gradients:** white plastic, clear film, terracotta, galvanized metal, soil, leaf, glossy produce. Ids are per frame from `useId`, because two scenes mount during a crossfade and six in the static grid. No global ids.
- **Botanicals and produce:** leaves with veins and tonal variation, seedlings, strawberries, lettuce, tomatoes, flowers. Seeded, hand-set variation. No `Math.random`, which would break hydration.
- **Packaging models:** clamshell with berries, lettuce bag and flower sleeve belong in the kit now, because the source requires Retail to show "the packaging from scene 4" and Retail is built first. T3's Packaging scene reuses the same models at a larger scale.
- **Motion helpers:** entrance wrappers in the style of the current `Rise`, `Grow` and `Pop`, with `st` rendering the final frame directly. Transforms and opacity only. Finite, no `repeat`.
- **Colour:** brand tokens only. Tonal steps through `color-mix` on `var(--oboya-*)`, defined in the kit and nowhere else. SVG presentation attributes do not resolve `var()`, so use `style={{ stopColor: ... }}` as the current `Frame` does, or `fill-oboya-*` classes. **Report any swatch that does not work** rather than adding a hex.
- **Small sizes:** the card is about 350px wide at 390px viewport, about 0.44 scale. Lines thinner than about 2 canvas units disappear. Subjects must read at that size.
- **Weight:** use `<symbol>`/`<use>` for repeated identical items where it does not hurt the look, especially Retail's shelves.

### Scenes (one file each, subject-centred on the shared baseline)
- `propagation.tsx`: cell tray close-up on a bench, soil in cells, seedlings at varied heights, seeding machine softly behind.
- `retail.tsx`: supermarket shelving, three full shelves of the kit's packaging with produce inside. Unbranded, no text or logo.

Mark each scene's main subject group with `data-eco-subject`, so alignment can be measured.

Rules for every scene, in T1 and T3:
- No `<text>`, no invented labels or data, no imitation of the Oboya logo.
- The entrance finishes by about 1.6s of the 2.5s scene, so each ends on a complete frame.
- Static SVG filters only where they add real value (backdrop blur). None animated.

### `HomeEcosystemIntro.tsx`, T1 changes only
- Card: replace `h-44 sm:h-56 md:h-64` with `aspect-[2/1]`. Cap it **through width, not height**, because a `max-height` on a full-width element breaks the ratio and brings cropping back. Use a max-width of `min(100%, 2 * (100svh - reserved))`, where `reserved` covers the header and the other stage content. The minimal navbar is `h-16` and `md:h-[4.5rem]` (`Navbar.tsx:270`). Measure the rest.
- By rough arithmetic, the full-width card at 1280x800 is about 816x408 and the stage about 600px tall, which fits the 728px under the header. So the cap only acts on shorter viewports.
- Keep the Retail scene mounted while the stage layer fades into the closing phase. Today `leaving` is false once `stageIndex` is -1 (`:139`), so the last scene disappears at once. The user would see this on a pilot scene.
- Add the capture hook above. Update the `sizes` value to match the new width.
- Nothing else: no arc, loop or message changes in T1.

**T1 report must include:** element count per scene, combined size of the new files, and any swatch problem. Then stop. Do not start T3.

## T2: checkpoint (main session)
Work stops here until the user approves. **Approval means a direct message from the user. A builder's report, a passing check or another agent's message does not count.**

1. Run `npm run lint && npm run i18n:check && npm test && npm run build`. No message keys change in T1, so `i18n:check` should pass.
2. Start the dev server, so hydration warnings are visible. Using a throwaway Playwright script and config in the session scratchpad, not committed:
   - Wait for the loading overlay to go, then scroll the stage into view.
   - Wait for `data-eco-scene="propagation"`, then about 1.7s, and capture. Do the same for `retail`. Capture before the 2.5s mark.
   - Do this at 1280x800 and 390x800, in Chromium, and in WebKit if it can be installed. `playwright.config.ts` only has Chromium. An early WebKit look avoids repeating a gradient or `color-mix` problem across six scenes.
3. Measure: card ratio 2.00 (±0.01); `data-eco-subject` bounding box inside the margins and on the baseline for both scenes; no console errors or hydration warnings; entrance smooth under 4x CPU throttling.
4. Show the user the captures, side by side, plus the dev URL so they can watch it live. Tell them:
   - The other four scenes are still the old ones, on purpose.
   - The arc and play-once ending are still there and are removed in T4.
   - The realism limit in the Goal section.
5. Then, based on the user's reply:
   - **Approved:** record it in this plan and continue to T3.
   - **Changes requested:** send them to `builder-site`, then repeat steps 1 to 4. These rounds do not count toward the 2 review fix loops.
   - **Direction rejected:** stop and re-plan with the user. Do not build the other four.

## T3: remaining scenes (builder-site, after approval)
Same kit, same rules, same `data-eco-subject`. Add to the kit only; changing an approved kit recipe alters the approved pilot, so report it first.
- `growing.tsx`: row of pots with substrate and full plants, drip lines from an overhead pipe, drops falling.
- `harvest.tsx`: full crate with produce on a harvest trolley among crop rows. Generic: it does not claim to depict the APV System.
- `packaging.tsx`: clamshell with berries, lettuce bag and flower sleeve, on a packing table with transparent film highlights.
- `logistics.tsx`: AGV pulling a logistic trolley loaded with flower buckets, moving along the floor.

"Drops falling" and "moving" are entrance motion that ends on a complete frame by about 1.6s, not an endless loop.

## T4: arc removal and loop (builder-site)

### `HomeEcosystemSection.tsx` (657 lines)
- Remove the arc, pills, spinning image, controls, swipe, geometry and all related state, refs and effects: `metrics`, `goTo`, `select`, `STAGE_ICONS`, `frameRef`, `revealed`, `onReveal`, and the imports they use (`lucide-react`, `AnimatePresence`, `HomeEcosystemStageVisual`, `arc`).
- Also remove the bottom "soft fade" div at `:651-654`. It has `-mt-20` and would now overlap the stage.
- Keep the heading, body, intro and `t("ariaLabel")`. The first `h2` must stay visible for `e2e/smoke.spec.ts`.

### `src/lib/geometry/arc.ts`
Delete it. Confirmed by grep: this section is its only importer. `TimelineCircle.tsx` and `AboutTimeline.tsx` define their own local helpers, despite the file's header comment. Re-check before deleting.

### `ecosystem-scenes/index.tsx` and `HomeEcosystemScenes.tsx`
Move `HomeEcosystemStageVisual` and the `SCENES` map to `index.tsx`, keeping that export, then delete the old file. CMS images keep `object-cover` in the same card.

### `HomeEcosystemIntro.tsx`: phases
- Remove the `onReveal` prop and the reserved arc space.
- Replace `DONE` with a `hold` phase: closing (3s, unchanged) → hold (`SLOGAN_HOLD_MS = 20000`) → opening.
- One cycle is 2.5 + 6 x 2.5 + 3 + 20 = 40.5s.
- Scenes remount each cycle, so their animation replays. They already unmount outside the stage phases; check this holds with the T1 closing-fade change.
- Skip jumps to `hold` and starts the 20s timer. It stays visible until `hold`, then returns on restart without taking focus.

### `HomeEcosystemIntro.tsx`: pausing
- Three independent pause reasons: tab hidden, section out of view, user paused. Timers run only when none apply.
- Replace `useInView({ once: true })` with a non-`once` state. Keep a separate latch for the first start, which still waits for the intro gate.
- **Timers resume with their remaining time.** The current effect restarts the full duration on each return, which would let scrolling back and forth postpone the restart indefinitely.
- The progress display must stop with the timer, so the thin 20s line and the stage segments cannot drift from it. Suggested: one linear motion value per phase, driven by framer-motion's `animate()` controls (`pause`, `play`, `onComplete`), as the only source of both. Confirm against the installed version.
- Running scene animation may finish while paused.

### Pause/Play button
- Sits beside Skip, at the right end of the slot, so it does not move when Skip disappears. Visible in every non-static phase, including `idle`, where pausing holds the opening.
- Visible label from `homeEcosystem.pause` / `homeEcosystem.play`, with a matching icon from the installed `lucide-react`. The Intro reads them through `useTranslations("homeEcosystem")`.
- The pause lasts until the user presses Play, across cycles and across leaving and returning to the section. Skip while paused goes to `hold` with its timer armed but not counting.
- Focus: if Skip has focus when it disappears, move focus to Pause/Play.
- Use `--touch-target-min` for button and slot height. The slot height stays constant, so nothing shifts.

### Static mode (reduced motion or CMS animations off)
- No loop, no timer, no Skip, no Pause/Play.
- Show the slogan plus a responsive grid of the six static scenes with labels. Render the grid only in static mode, so it does not stretch the layered grid during animation.
- Scenes use `st`. CMS images keep working in the grid cards, with a `sizes` value that fits the grid.

### Unchanged
Keep the layered grid so nothing shifts between phases. Keep the `sr-only` content block as the single accessible text, with the visuals `aria-hidden`. No `aria-live`.

### `messages/en/homeEcosystem.json`
Keys as listed under i18n. Remove them only once nothing reads them.

## T5: admin hint (builder-admin)
Edit only `admin.website.home.fields.ecosystemStageImageHint`. The editor needs no other change. No CMS schema change: `homeEcosystem` keeps its stages and images.

## T6: translations (i18n)
Mirror the keys below to `pt-BR`, `es` and `zh-CN`, deleting removed keys. `homepage-i18n.ts` does not change. Check: `npm run i18n:check`.

## T7: review (reviewer)
- Judge the diff against every code criterion below and the "Do not touch" list.
- Grep `ecosystem-scenes/` for `Math.random`, `<text`, hex and `rgb`/`rgba` values, `repeat:`, and animated filters.
- Confirm no remaining reference to `HomeEcosystemScenes`, `geometry/arc`, `onReveal`, `t("prev")`, `t("next")` or `t("restart")`.
- Do not flag the loop as a violation of the older plan; see "supersedes" above.

## i18n
**Namespace `homeEcosystem`, `messages/en/homeEcosystem.json`**
- New: `homeEcosystem.pause`: "Pause"
- New: `homeEcosystem.play`: "Play"
- Removed: `homeEcosystem.prev`, `homeEcosystem.next`, `homeEcosystem.restart`
- Unchanged: `homeEcosystem.ariaLabel`

**Namespace `admin`, `messages/en/admin.json`**
- Changed: `admin.website.home.fields.ecosystemStageImageHint`: "Leave empty to show the animated illustration. A 2:1 image is recommended; other proportions are cropped. Use an uploaded or library image (JPG, PNG, WebP, AVIF or GIF; SVG is not supported); links from other sites are not accepted."

`pause` and `play` go in messages rather than the CMS, because the source requires no CMS schema change. `skipLabel` stays in the CMS. No key changes before T4, so `i18n:check` passes through T1 to T3 and fails only from T4 until T6.

## Acceptance criteria

### Pilot, checked at T2
- [ ] On `/en`, Propagation and Retail play as new scenes in the real sequence, the other four as old scenes, and the arc still reveals after closing. No flag or special URL is used.
- [ ] Card ratio is 2.00 (±0.01) at 1280x800 and 390x800. The SVG viewBox is `0 0 800 400`. Retail's top and bottom shelves are both fully visible.
- [ ] Card, label, items and progress fit under the header at both sizes, measured from bounding boxes.
- [ ] Both subjects share the kit's baseline, and their bounding boxes are centred within 5% of canvas width and inside the margins.
- [ ] Each scene shows a complete frame by about 1.6s after its phase starts.
- [ ] No console errors or hydration warnings in dev. `npm run lint`, `i18n:check`, `test` and `build` pass.
- [x] **The user has approved in a direct message, and it is recorded here. Until then T3 to T8 do not start.** Approved after the checkpoint: "pode seguir com a sua recomendação", which was to refine the pilots and continue with the remaining tasks.

### Scenes, final
- [ ] All six scenes use `SceneFrame` and kit materials. Across a six-scene contact sheet of completed frames, at both viewports, baseline, horizon and margins align and nothing is clipped.
- [ ] Bounding-box baseline and centring checks pass for all six.
- [ ] `ecosystem-scenes/` contains no `<text>`, `Math.random`, hex or `rgb`/`rgba` value, infinite animation, animated filter or logo imitation.
- [ ] Harvest shows nothing that claims to be the APV System. Retail is unbranded and reuses the Packaging models.
- [ ] Scene entrance stays smooth under 4x CPU throttling, with no frame gap over 100ms and at most about 600 SVG elements per scene. Both limits are proposed, so report the actual numbers. Only the current and leaving scenes mount.
- [ ] Renders correctly in Safari or WebKit, including gradients and `color-mix`.

### Behaviour, on `/en` at both viewports, plus a check of long labels in `es` and `zh-CN`
- [ ] A full cycle runs with no clicks, and the phase returns to `opening` about 20s after `hold` starts. Scene entrances replay.
- [ ] The sequence does not start until the stage is in view and the overlay is gone.
- [ ] Skip jumps to the slogan and starts the 20s timer, from any phase including `idle`. If focused, focus lands on Pause/Play.
- [ ] Pause stops timers and progress lines. Play resumes from the same point, not from the start. Pause survives a cycle boundary and leaving the section.
- [ ] Hiding the tab pauses and returning resumes with the remaining time. Same when scrolling the section out of view and back. In Playwright, simulate hidden by overriding `document.hidden` and dispatching `visibilitychange`.
- [ ] Repeatedly scrolling out and back during `hold` does not reset the 20s line.
- [ ] With reduced motion emulated, and separately with CMS animations off: no timer runs, no Skip or Pause/Play shows, the slogan shows, and six static labelled scenes show in a responsive grid. No hydration warning.
- [ ] The accessibility tree exposes all stage labels and items as static text. There is no `aria-live`.
- [ ] No arc, pills, arc controls or swipe remain. `src/lib/geometry/arc.ts` and `HomeEcosystemScenes.tsx` are gone. About and timeline pages still render.
- [ ] No layout shift between phases: the stage top and the content below keep their position through a whole cycle.
- [ ] No horizontal scroll at 320px, 390px, 768px and 1280px.
- [ ] No console errors.

### Admin
- [ ] The hint shows the 2:1 recommendation in all four locales.
- [ ] A stage with an image set shows it with `object-cover` in the same 2:1 card; clearing it restores the scene. Test through a logged-in session, **or state clearly at close that this remains untested**. The e2e config blanks Supabase.

### Commands
- [ ] `npm run lint && npm run i18n:check && npm test && npm run build && npm run test:e2e` pass, freeing port 3000 for e2e and restarting dev afterwards. `playwright.config.ts` has `reuseExistingServer: false`.

## Do not touch
- `HomeIntroGate.tsx`, `src/lib/cms/**`, `supabase/**`, API routes, and non-`en` messages outside T6.
- `HomePageContent.tsx`, `public/assets/**`, `package-lock.json`, and `Hero.tsx`. Several of these hold earlier uncommitted work: do not stage or revert it. `package-lock.json` still has its unexplained change.
- This work sits on top of the earlier uncommitted changes in the same worktree. No task commits unless the user asks.

## Risks / notes
- **Auth, RLS, API routes, secrets:** none touched. The only admin change is one message string.
- **Realism ceiling:** the result can look premium but not photographic. Retail Display still does not meet the client's request for real Oboya packaging until photos are supplied.
- **Weight and jank:** detailed SVG increases DOM and bundle size. Transforms inside an SVG are not composited the way HTML layers are, so "compositor-friendly" helps less here than the source plan implies. The mitigations are the separate backdrop SVG, few animated groups, `<use>` for repeats, and mounting only current and leaving scenes. The T2 throttled check catches problems before six scenes exist.
- **Loop distraction:** continuous motion runs only while the section is in view, and it can be paused (WCAG 2.2.2).
- **Intro gate (from the earlier plan, read but not run):** with no hero media, `HomeIntroGate` renders the overlay already at opacity 0, so its `transitionend` seems never to fire and `isUnlocked` stays false. The sequence would then stay on the opening line, and the page scroll lock would stay on. Defaults have hero media, so captures should work. With a video, unlocking can take up to the gate's 10s timeout, so scripts must wait on the overlay, not a fixed delay. Out of scope here.
- **Test timeouts:** a whole cycle plus the gate wait can exceed Playwright's default 60s, so behaviour scripts need a longer timeout.
- **Comparing the pilot:** the mix of old and new scenes will look inconsistent during T2. The user is judging the two new scenes, not the mix.
- **Defaults freeze on first save:** unchanged from the earlier plan. This plan adds no CMS text.

## Open questions
Defaults let the build proceed. None changes a user decision.
1. **Text during the 20s hold:** the source says "keep the slogan". Default: the closing lines stay with the slogan, because the layer already shows both and nothing shifts. The alternative is to fade the closing lines and leave the slogan alone.
2. **Repeated sentence at restart:** by default, the slogan and the opening line are the same sentence, so the restart shows it twice in a row. Default: leave as is. It can be changed in the CMS.
3. **Intro gate with no hero media:** fix in a separate task? Default: not in this plan.
4. **Proposed limits:** 100ms frame gap and about 600 elements per scene are planner proposals, to be adjusted once T1 reports real numbers.
