# Frontend completion and verification

Audit: **13 October 2026**, Windows, Node **22.13.0**, Chromium/Playwright. Initial tree clean at `b547986`. The frontend, Carbon-informed design and original role brief were preserved. No backend, database or migrations were created.

The initial audit below is retained as historical evidence. See the [public landing page addition](#public-landing-page-addition) for the latest routes, changed files, checks and totals.

## Fixes implemented

- Safe protected-route returns preserve path/query/hash through login; unsafe destinations are rejected. Session expiry clears protected state and private queries; startup network failures offer retry.
- Central HTTP adds 15-second timeout, safe CSRF decoding, distinct login errors, invalid-response handling and bounded pagination. Mock concurrent booking checks/commits are atomic within the adapter; business saves update session snapshots and fixtures avoid closed Fridays.
- Fractional AFN/PKR prices stay visible; translation interpolation and booking-step numbers use the locale. Working-hour validation checks structure/order and associates errors with both controls.
- Inline-created contacts stay visibly selected in booking while refreshed options arrive; the selected ID, review, history and calendar are verified across three industries.
- Dialogs restore opener focus. Lazy routes and hash targets receive focus while respecting menus/dialogs opened during loading; language switching preserves trigger focus. Calendar links have a 44px rail, compact summaries/full accessible names, preserved list ranges and available-time links on mobile/list views.
- PWA install capture starts before login and consumes prompts once. Updates reload after an accepted controller change, including first-session/external updates.
- Colors are centralized in semantic tokens; stronger control/focus boundaries, Vazirmatn/Inter fallback, reused date formatters, early-exit time conversion and lazy demo fixture initialization.
- Added regression, accessibility, industry workflow, PWA update and Lighthouse checks. Browser output directories are independent; artifacts/docs are ignored by development reload watching.

## Exact commands and final outcomes

PowerShell uses `npm.cmd` because this machine blocks `npm.ps1`. Sandbox escalation for build/browser subprocesses was approved.

| Command | Result |
| --- | --- |
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run check` | Passed: final combined typecheck, lint, translation, unit and live build |
| `npm.cmd run lint` | Passed, no warnings |
| `npm.cmd run i18n:check` | Passed: 246 keys, parity/interpolation/static JSX checks |
| `npm.cmd test` | Passed: 37 tests, 10 files |
| `npm.cmd run test:e2e` | Passed: 11 scenarios, including responsive and axe sweeps |
| `npm.cmd run test:e2e -- --grep "services, staff, settings"` | Passed: focused contact-selection/menu-focus and three-industry regression |
| `npm.cmd run build:demo` | Passed: explicit demo, lazy routes and PWA |
| `npm.cmd run test:pwa` | Passed: 4 production-demo scenarios |
| `npm.cmd run audit:lighthouse` | Passed: production-demo login, scope below |
| `npm.cmd run build` | Passed: live HTTP production bundle, no demo adapter chunk |
| `node scripts/check-contrast.mjs` | Passed: eight text pairs ≥4.83:1, control boundary 3.50:1 |
| `git -c core.autocrlf=false diff --check` | Passed |

Servers: `npm.cmd run dev -- --port 5174 --strictPort` and `npm.cmd run preview -- --port 4174 --strictPort`. QA dependencies: `npm.cmd install --save-dev @axe-core/playwright@^4.11.0 lighthouse@12.8.2 --no-audit --no-fund --cache .npm-cache`.

Two Zod Rollup comment-annotation warnings remain harmless; both builds succeed. Early failures were corrected and rerun. Infrastructure failures included shared trace outputs, measuring menu contrast during its animation, documentation-triggered demo reloads and a Node JSON import attribute. Assertions/rules were not disabled to obtain passes.

## Routes and workflows

Public: `/login`, `/signup`, `/forgot-password`, `/offline`, not-found. Protected: `/app/overview`, `/app/calendar`, `/app/appointments`, `/app/appointments/new`, `/app/appointments/:id`, `/app/customers`, `/app/customers/new`, `/app/customers/:id`, `/app/services`, `/app/staff`, `/app/settings`. Every page type is rendered in both languages. Workflow checks cover active navigation, direct protected entry, nested refresh, back/forward and invalid appointment/contact IDs.

Mock workflow coverage:

- Booking validation, inline contact creation, service/staff/date/time, review/submit, details, confirmation, rescheduling and explicit cancellation; conflicts/closures/assignments/tenant references also have unit tests.
- Contact search/pagination/no-results, details, invalid/valid edits and updated history.
- Service duration/price validation, create/edit/deactivate and fractional price; staff creation/profile, assignments and invalid/corrected hours.
- Business save/header update, retention after tenant switching, appointment filtering/clearing, auth validation and explicit unavailable demo signup/email. Offline writes reject without queueing.

Salon, clinic and education are tested through shared contact creation, complete booking, history and calendar workflows, plus English/Dari terminology after switching tenants. Consulting/other are configured but lack this full workflow matrix. Clinic support remains scheduling/basic contacts. See [industry configuration](INDUSTRY_CONFIGURATION.md).

## Language, responsive and accessibility evidence

Exactly English LTR and Dari RTL, 246 matching keys. Numeric interpolation tests verify Dari pagination/duration. Keyboard language tests cover immediate language/direction changes, Escape, outside-click and focus. Bundled Vazirmatn/Inter render in screenshots; natural wording needs native-speaker review.

Main/create pages pass no-document-overflow checks at **320, 360, 390, 430, 768, 1024, 1280, 1440px**, in both languages. Narrow tables stack; calendar has mobile list controls; navigation includes safe-area padding. Dialog/filter audits include 390/1440px. Sixteen [screenshots](screenshots/) were refreshed. Desktop English calendar, mobile English booking, mobile Dari overview/settings and the final compact calendar correction were visually inspected. Full-page captures show fixed navigation at capture viewport position; physical-device scrolling remains separate.

**68 settled route/overlay axe states, zero violations**, with WCAG 2 A/AA, 2.1 A/AA, 2.2 AA tags and no disabled rules. [JSON evidence](audits/axe.json). Keyboard checks cover dialog focus, reduced motion, hash navigation and calendar slots. Automated results do not establish complete WCAG conformance.

## Lighthouse measurement

Scope: public `/login` in the **production demo**, local port 4174, no concurrent browser suites. Lighthouse **12.8.2**, Chromium headless shell; mobile **412×823**, DPR **1.75**; simulated RTT **150ms**, throughput **1,638.4 Kbps**, CPU **4×**.

Measured **90 performance / 100 accessibility**, FCP **2.4s**, LCP **3.2s**, CLS **0**; targets 85/95 met. [HTML](audits/lighthouse-mobile.html), [JSON](audits/lighthouse-mobile.json). Formatter/fixture startup was reduced after an initial below-target run. This does not measure all authenticated routes, physical mobile hardware, large data or a Laravel deployment; scores vary between runs.

## PWA evidence

Four tests cover manifest/PNG dimensions/maskable purpose, install event received before login and consumed once, an actual waiting worker accepted through the update UI, and controlled offline reload/Dari. The update test modifies the generated local worker, calls registration update, accepts the prompt and restores the worker afterward.

The cache contains the static shell and no `/api/` or `/sanctum/` requests. No private query persistence, runtime API caching or offline creation is claimed. The install event is synthetic; native OS installation and deployed HTTPS updates still require device verification.

## Remaining release work and limits

1. Agree/implement the proposed Laravel endpoints, Sanctum CSRF bootstrap, cookies/CORS, permissions, tenant authorization, server validation, atomic availability locking and persistence. Mocked HTTP checks do not test a server. [API boundary](API_INTEGRATION.md).
2. Native Dari review, real screen readers, physical Safari/iOS/Android, native install and HTTPS deployment update tests.
3. Large workspaces may need paginated selectors/bounded calendar queries. TypeScript contracts do not exhaustively validate every returned domain field.
4. Demo auth/changes reset on reload. Overnight hours, date exceptions editor, offline queue, billing, drag scheduler and regulated healthcare features are outside this phase. Frontend checks are not authorization.

No known automated failures remain in the reported final results. Completion applies to this verified demo/API-boundary scope; external release checks remain unverified. **Backend implementation was not started.**

## Public landing page addition

Added on **13 October 2026**. Existing uncommitted frontend work was preserved. No dependencies, backend APIs, Laravel files or database changes were added.

### Delivered and changed files

- `src/features/public/landing-page.tsx`: public `/`, with navigation, hero, four core features, four business categories, setup steps, final CTA and footer.
- `product-preview.tsx`: semantic read-only calendar/contact illustration using translated sample records and the shared status badge. It never reads private workspace records or invents customer metrics.
- `public-layout.tsx` and `public.css`: reused brand, language switcher, buttons, fonts and tokens; responsive public hierarchy, logical RTL styling, keyboard/anchor focus, reduced-motion support and dashboard actions for signed-in visitors.
- `product-info-page.tsx`: public `/about` and `/about#data`, describing actual account/demo, data and offline limits. No invented legal policy or unavailable support links.
- `src/app/router.tsx` and `index.html`: public lazy routes and translated runtime document/description/Open Graph metadata. Protected routes and safe authentication return logic remain intact.
- Both locale JSON files: 69 additional translated keys, **315 total** in exactly English/Dari.
- `landing-page.test.tsx`, `e2e/landing.spec.ts`, `playwright.config.ts`, `e2e/pwa.spec.ts`: public/authenticated states, CTA destinations, metadata, anchors, keyboard skip/focus, responsive/axe and offline public-route coverage.
- `README.md`, `docs/DESIGN_SYSTEM.md`, this report: updated launch guidance, public design decisions and verification evidence. Eight landing screenshots and `docs/audits/landing-axe.json` added.

### Commands and results

| Command executed | Result |
| --- | --- |
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run lint` | Passed, no warnings |
| `npm.cmd run i18n:check` | Passed: 315 keys, interpolation/static JSX parity |
| `npm.cmd test` | Passed: 40 tests across 11 files |
| `npm.cmd run test:e2e -- landing.spec.ts` | Passed: 3 public-page scenarios after fixing initial-load focus |
| `npm.cmd run test:e2e` | Passed: 14 scenarios, including all 11 existing application checks |
| `npm.cmd run build:demo` | Passed: public routes included in demo/PWA output |
| `npm.cmd run test:pwa` | Passed: 5 scenarios, including offline homepage/information navigation in Dari |
| `npm.cmd run check` | Passed: final typecheck, lint, translation, 40 unit/component tests and live production build |
| `git -c core.autocrlf=false diff --check` | Passed |

The app was served with `npm.cmd run dev -- --port 5174 --strictPort`; the PWA suite managed preview on 4174. Existing Zod annotation warnings remain non-fatal. No test assertions or axe rules were disabled. The initial keyboard test found that forcing main focus on a cold public load skipped the first-tab skip link; public loads now preserve normal tab order while SPA/anchor navigation manages focus.

### Verified scope and remaining limits

- Homepage and product information render publicly; Sign in opens `/login`, Get started opens `/signup`, and signed-in visitors can open `/app/overview` while staying on `/` until they choose to navigate.
- **320, 390, 768 and 1440px**, both English LTR and Dari RTL: no document overflow; visible mobile navigation/CTAs; all four widths captured. Desktop English/Dari and mobile English/Dari screenshots were visually inspected. Evidence: `docs/screenshots/landing-{locale}-{width}.png`.
- **16 new rendered page/viewport/locale axe states, zero violations** ([evidence](audits/landing-axe.json)); the existing **68** app/auth/overlay states also passed. Keyboard skip, section/data-anchor focus, language focus, translated metadata and reduced-motion preference are covered.
- Existing manifest, worker update/install handling, safe cache and offline mutation checks pass. The public shell also reloads offline and navigates to the information route; this does not enable offline booking or real account creation.
- Titles/descriptions/Open Graph text are translated client-side in the existing Vite SPA. No server-rendered metadata or deployed SEO behavior was tested. The earlier Lighthouse result remains a login measurement, not a measurement of this new homepage.
- Native-speaker Dari review and physical-device/assistive-technology verification remain release checks. Real signup, login and persistence still require the separately developed backend. No known failures remain in the checks above.
