# Mobile UX Audit Report — Oboya Website

**Date:** September 2026  
**Scope:** Public routes (`/[locale]/*`), shop/marketplace, about-v2 timeline, admin (`/admin/*` + CMS)

---

## Pages audited

| Route | Status |
|-------|--------|
| `/` (Home) | Audited & updated |
| `/about-v2` | Audited & updated |
| `/solutions`, `/solutions/*` | Audited & updated |
| `/shop`, `/shop/products/*` | Audited & updated |
| `/case-studies`, `/case-studies/*` | Audited (padding tokens already in place) |
| `/blog`, `/blog/*`, `/news` | Covered via shared layout tokens |
| `/contact` | Audited & updated |
| `/faqs`, `/work-with-us`, `/privacy`, `/terms` | Covered via SiteLayout + tokens |
| `/admin/dashboard` + CMS editors | Audited & updated (shell, tables, forms) |

---

## Components audited

- **Navigation:** `Navbar`, `Footer`, `LanguageSwitcher`, `AdminShell`, `AdminSidebar`, `AdminTopbar`
- **Home sections:** `Hero`, `BusinessSolutions`, `Testimonials`, `Capabilities`, `InteractiveWorldMap`
- **About:** `NumbersSqueezeCarousel`, `ValuesSqueezeCarousel`, `Timeline`, `TimelineYearsRail`
- **Solutions:** `SolutionsHeroCarousel`
- **Shop:** `ShopToolbar`, `QuoteCartSheet`, `QuantityInput`, `ProductDetailView`
- **Admin:** `DataTable`, `LocaleFieldTabs`, `AdminPageFooterActions`
- **Shared hooks:** `useHorizontalCarousel`, `useScrollSnapCarousel`, `use-overlay-a11y`, `useScrollTimeline`

---

## Problems found (prioritized)

### P0 — Fixed

| ID | Issue | Resolution |
|----|-------|------------|
| P0-1 | `touch-none` on carousels blocked vertical page scroll | `useHorizontalCarousel` with `touch-action: pan-y` default, `pan-x` only during horizontal drag |
| P0-2 | Admin unusable on mobile (fixed `pl-64` sidebar) | Drawer sidebar `< lg`, hamburger in topbar, `lg:pl-64` content |
| P0-3 | Squeeze carousels `activeIndex` desync from native scroll | `useScrollSnapCarousel` with `IntersectionObserver` |
| P0-4 | `LanguageSwitcher` hover-only on touch | Tap toggle + outside dismiss on `(hover: none)` |

### P1 — Addressed

| ID | Issue | Resolution |
|----|-------|------------|
| P1-1 | Carousels without snap after drag | Snap-to-nearest on drag end in `useHorizontalCarousel` |
| P1-2 | Capabilities: buttons only | Horizontal swipe on slide container |
| P1-3 | Timeline scroll hijacking on tablet landscape | Pin disabled for `(max-width: 1024px) and (hover: none)` |
| P1-4 | Map hit targets ~28px | Invisible hit circles increased to r=20 (public) / r=22 (editable) |
| P1-5 | Shop toolbar hides filters on scroll | Collapse disabled below `md`; controls stay visible on mobile |
| P1-6 | Quote cart sheet: no scroll lock / focus trap | `useOverlayA11y` enabled; backdrop + `role="dialog"` |
| P1-7 | Admin DataTable table-only | `mobileLayout="cards"` default with stacked cards `< md` |

### P2 — Partially addressed

| ID | Issue | Status |
|----|-------|--------|
| P2-1 | Section padding inconsistency | Testimonials + key sections use `--section-y`; broader sweep deferred |
| P2-2 | Ad-hoc typography clamps | Hero eyebrow → token; incremental tokenization elsewhere |
| P2-3 | Hardcoded gutters | Contact, ProductDetailView → `--container-padding` |
| P2-4 | Solutions hero autoplay without touch guard | Autoplay off on touch; manual dots/arrows on mobile |
| P2-5 | Contact textarea `rows={2}` | `rows={4}`, `text-base` inputs |
| P2-6 | Timeline mobile rail narrow / 10px labels | Larger tap targets, `text-xs` minimum |
| P2-7 | Admin forms dense | Sticky `LocaleFieldTabs`, mobile footer actions bar |

---

## Changes implemented

### Foundation (PR1)

- **`src/hooks/useHorizontalCarousel.ts`** — shared drag/wheel/snap logic, vertical scroll preserved
- **`src/hooks/useScrollSnapCarousel.ts`** — mobile squeeze scroll ↔ index sync
- **`src/styles/tokens.css`** — `--touch-target-min`, `--container-max-wide`, `--container-max-narrow`
- Migrated `BusinessSolutions`, `Testimonials` to shared hook
- `LanguageSwitcher` tap support
- Squeeze carousels scroll sync

### Navigation & forms (PR2)

- Footer: touch targets, responsive grid, legal wrap
- Contact: iOS-friendly inputs, textarea, submit button
- Shop toolbar: mobile controls always visible
- Quote cart: backdrop, a11y, safe-area padding
- Map: larger marker hit areas
- `use-overlay-a11y`: iOS scroll lock via `position: fixed`

### Public pages (PR3)

- Capabilities: swipe, safe-area controls, mobile description alignment
- Hero: brand token color, `cta-lg`, typography balance
- Timeline: tablet touch pin policy, rail legibility
- Solutions hero: touch guard + mobile controls
- Shop PDP: container padding, quantity controls ≥44px on mobile

### Admin (PR4)

- `AdminShell` drawer pattern
- `DataTable` mobile card layout
- `LocaleFieldTabs` sticky + touch-friendly tabs
- `AdminPageFooterActions` full-width on mobile

---

## Mobile-specific adaptations

| Pattern | Desktop | Mobile |
|---------|---------|--------|
| Squeeze carousels | Flex expand + autoplay | Native horizontal snap scroll |
| Horizontal carousels | Wheel + drag, snap on arrows or drag-end | `pan-y` allows page scroll; horizontal drag when intent detected |
| Timeline | GSAP scroll pin | Rail buttons; no pin on touch tablet |
| Admin nav | Fixed sidebar | Slide-over drawer |
| Data tables | HTML table | Stacked definition-list cards |
| Quote cart | Sidebar (lg+) | Bottom sheet with focus trap |

---

## Shared components improved

- `useHorizontalCarousel` — reusable across homepage carousels
- `useScrollSnapCarousel` — reusable for any snap track
- `use-overlay-a11y` — improved scroll restoration
- `DataTable` — optional `mobileLayout="cards"`
- Design tokens documented for touch targets and container widths

---

## Desktop regression check

| Area | Expected behavior |
|------|-------------------|
| Home carousels | Wheel, drag, arrow snap unchanged |
| Admin | Sidebar fixed at `lg+`, `pl-64` preserved |
| Timeline | Scroll pin on desktop mouse/trackpad |
| Solutions hero | Autoplay on non-touch viewports |
| Shop toolbar | Collapse on scroll at `md+` only |

**Manual QA viewports:** 320, 360, 375, 390, 414, 430, iPad portrait/landscape, desktop 1280+

---

## Remaining issues

1. **P2-1 / P2-2:** Full section padding and typography token sweep across ~20 section files (low risk, cosmetic).
2. **P3 refinements:** Pinch-zoom on product gallery; hover-only card CTAs on case studies.
3. **Admin search:** Mobile search icon → sheet not implemented (desktop search unchanged).
4. **Keyboard map nav:** Roving tabindex on world map markers (enhancement).
5. **Automated visual regression:** No screenshot CI; manual matrix recommended per release.

---

## Test plan checklist

- [ ] Home: vertical scroll through BusinessSolutions and Testimonials at 375px
- [ ] About-v2: squeeze scroll sync; timeline rail on phone
- [ ] Solutions: hero manual controls on mobile; no autoplay on touch
- [ ] Shop: toolbar country/currency visible; quote sheet trap + backdrop
- [ ] Contact: form fields no iOS zoom; submit full-width on mobile
- [ ] Admin: hamburger opens drawer; DataTable cards on phone
- [ ] Desktop lg: admin sidebar, timeline pin, carousel autoplay unchanged
