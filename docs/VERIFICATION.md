# Application verification

Deployment target updated on 18 October 2026: Namecheap shared hosting replaces the production Docker stack. Docker image/VPS instructions below are historical verification evidence, not the current deployment method. Local MySQL/Mailpit containers remain. Use [the current deployment guide](DEPLOYMENT.md).

## Namecheap deployment preparation - 18 October 2026

Production Docker/Compose, Nginx/Caddy and container initialization files were removed. Local compose.dev.yaml, private environment settings and existing local database volumes were retained. The new package builder copies application source explicitly, generates empty runtime storage and excludes local secrets, credentials, uploads, logs, vendor, tests and cached configuration.

- npm.cmd run check: passed TypeScript, ESLint, 517-key translation parity, all 58 frontend tests and production build. Existing upstream Zod annotation/main-chunk notices remain non-fatal.
- npm.cmd run deploy:test: 3 passed, including an isolated native Apache/PHP integration check. Verified SPA fallbacks, GET/POST/PUT backend routing, OAuth/verification query preservation, CSRF header forwarding, cache/security headers, private-file denial, missing-asset 404 and generic setup-incomplete 503 responses. Package tests verified origin validation, private-file exclusion and fresh empty runtime directories.
- npm.cmd run deploy:prepare -- --origin https://acm.example.test: completed with a generated ignored release and file hashes. The example.test origin is only a packaging verification placeholder, not a deployed domain. No local credentials or business uploads were included.
- PHP syntax/Pint and git diff whitespace checks passed for the new bridge and changes.

The optional Apache test uses Windows XAMPP modules when available and explicitly skips on machines without them. It uses a disposable PHP fixture for routing, not production database records. Current work did not rerun backend/browser database suites because local Docker/MySQL was stopped. Namecheap LiteSpeed/PHP/MariaDB, DNS/HTTPS, SMTP, live Google authentication, cron and production backup/restore still require account-level staging verification. This deployment change does not resolve previously reported development-tool dependency advisories.

## Backend integration - 15 October 2026

The application now uses Laravel, Sanctum, Socialite and MySQL. The frontend-only audits below are historical; their demo instructions, test counts and missing-backend items do not describe the current runtime. Use the [README](../README.md), [API contract](API_INTEGRATION.md), [backend handover](BACKEND_IMPLEMENTATION.md) and [deployment guide](DEPLOYMENT.md) for current behavior and commands.

Environment: Windows/PowerShell, local PHP 8.2.12, Node 22.13.0, MySQL 8.4 in Docker, Mailpit, Chromium/Playwright. Production images use PHP 8.4 and Nginx. Backend unit/feature tests use acm_test; browser workflows use acm_e2e_test. No production records or external Google account were used.

| Command/check | Observed result |
| --- | --- |
| php vendor/bin/pint; php vendor/bin/pint --test (backend directory) | Formatting applied; validation passed |
| php artisan test --compact (backend directory) | 52 passed, 404 assertions against MySQL |
| npm.cmd run backend:prepare-tests | Passed; isolated schemas ready and browser migrations current |
| npm.cmd run backend:test -- --compact | Passed after fixing the script's working directory: 52 tests, 404 assertions |
| npm.cmd run typecheck | Passed |
| npm.cmd run lint | Passed, no warnings |
| npm.cmd run i18n:check | Passed: 389 matching English/Dari keys, interpolation/static-text checks |
| npm.cmd test -- --maxWorkers=1 | 50 passed, 12 files |
| npx.cmd playwright test | Initial full run: 19 passed, 6.9 minutes. Follow-up full run: 17 passed; two test-infrastructure failures (report I/O and premature auth navigation) corrected and rerun below. |
| npm.cmd run build | Passed; lazy routes and static-shell PWA generated |
| npm.cmd run test:pwa | 5 passed, 1.7 minutes; production preview with real backend login |
| composer audit --locked --no-dev (backend directory) | No security advisories |
| npm.cmd audit --omit=dev | Zero vulnerabilities |
| docker build --quiet -f deploy/Dockerfile.backend -t acm-backend:verify . | Passed |
| docker build --quiet -f deploy/Dockerfile.frontend --build-arg VITE_GOOGLE_AUTH_URL=https://acm.example.test/auth/google/redirect -t acm-frontend:verify . | Passed; placeholder local verification origin only |
| Isolated acm-release-check production Compose validation/migration/startup | Configuration valid; eight migrations passed; preflight/config/route/view caches and CLI health passed; MySQL/app/web healthy |
| Restricted production grants and backup/restore drill | Runtime DML only, CREATE denied; migration-account dump/restore round trip passed in a separately created empty local database |
| Production image secret/test exclusion | Private environment files and browser test scripts absent |
| npx.cmd playwright test --grep "all routes and principal dialogs&#124;real Laravel signup&#124;booking validates&#124;services, staff, settings" | 4 passed, 3.9 minutes; all 68 axe states had zero violations; signup/reset, booking and management passed |
| git diff --check | Passed; Windows line-ending conversion notices only |

Security checks include CSRF, authentication/reset/verification, rate limits, stateful Google callbacks with mocked HTTP responses, account-linking rejection, verified-user onboarding, role policies, cross-tenant reads/writes and composite foreign keys. Scheduling tests cover hours/breaks, DST, conflicts, cancellation, immutable final states, archive/configuration integrity and independent concurrent PHP workers competing for one slot (one success, one conflict).

Browser coverage includes signup, Mailpit verification/reset, remembered login/logout, safe intended destinations, Dari email lang/dir and onboarding, persisted customer/service/staff/settings operations, contact history, booking/rescheduling/cancellation, industry switching, route reload/history, English/Dari and RTL. Responsive sweeps include 320, 390, 768 and 1440px, with additional application widths. The current [axe evidence](audits/axe.json) contains 68 settled states with 0 violations; [screenshots](screenshots/) were regenerated using real database fixtures. Automated checks do not establish complete WCAG conformance.

Visual review confirmed the regenerated mobile Dari settings and desktop English calendar retain the existing layout. Full-page captures place fixed navigation at the capture viewport position.

PWA checks exercise a synthetic pre-login install event, one-use prompt, actual waiting-worker update/reload, static-shell offline startup, Dari switching and offline public/information routes. Cache inspection found no API/CSRF entries. Native installation and deployed HTTPS updates remain manual checks.

Production checks used a separate Docker project, fresh private MySQL/storage volumes and generated ignored credentials. Neither the Caddy HTTPS service nor scheduler was started for this drill. The backup marker was removed after verification and the isolated release-check containers were stopped with their volumes preserved. No domain was published or public certificate requested. The localhost verification origin is not a real deployment or a production Google callback.

Build warnings: upstream Zod comment annotations and a roughly 555 kB main JavaScript chunk; build succeeds. A default-worker Vitest run encountered an IPC resource failure during Docker compilation; the single-worker run passed unchanged assertions. Follow-up browser verification exposed a transient Windows UNKNOWN file-open error while saving axe evidence and an auth assertion checking navigation before the real HTTP response. Report writes now retry only transient filesystem errors; login/signup tests explicitly await and assert successful HTTP responses. No accessibility rule or workflow assertion was removed. A post-booking refresh of unrelated directories/availability was also removed, and detail pages use the returned resource names.

Remaining manual work: real Google credentials/consent and live OAuth; production SMTP/sender, domain/DNS and VPS deployment; HTTPS/device/PWA verification; native Dari wording and assistive-technology review. Historical Lighthouse reports below were not rerun and do not measure the backend-integrated deployment.

---

## Historical frontend-only audit

Audit: **13 October 2026**, Windows, Node **22.13.0**, Chromium/Playwright. Initial tree clean at `b547986`. The frontend, Carbon-informed design and original role brief were preserved. No backend, database or migrations were created.

The earlier audits below are retained as historical evidence. See the [brand and authentication cleanup](#brand-and-authentication-cleanup) for the latest changes and verification.

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

## Brand and authentication cleanup

Updated **14 October 2026**, following the public-page, motion and authentication refinements. User-provided artwork and the existing Carbon-informed components were retained. No dependencies or backend implementation were added.

### Delivered and changed files

- `src/components/ui/brand.tsx`: configurable logo-only presentation and explicit mark sizing. Auth retains a compact wordmark; shared CSS tightens dashboard/auth logo-to-text spacing to 8px.
- `src/features/public/public-layout.tsx`, `public.css`: logo-only navbar/footer, removed brand download link, accessible 44px Back to top arrow link. Demo & data continues to navigate to the real `/about#data` section. Signed-in names and mobile menu behavior are preserved.
- `src/features/auth/auth-page.tsx`, `src/styles.css`: centered forms without a secondary column, mirrored Back to homepage arrow, shared Vazirmatn font token for Dari headings, controls and forms. Password visibility, remember preference and honest Google availability behavior remain intact.
- `public/brand/acm-logo-transparent.png`: background-free derivative generated with imagegen; the owner's original `ACM_LOGO.png` is unchanged. `scripts/generate-icons.mjs` trims transparent margins and exports the UI WebP and PNG icons. Regular favicon/app/touch icons preserve alpha; the maskable installation icon has a separate opaque safe canvas.
- `vite.config.ts`: both full-size source PNGs excluded from shell precaching; optimized runtime assets retain existing PWA behavior.
- `e2e/landing.spec.ts`, `e2e/pwa.spec.ts`: assertions for logo-only branding, removed download link, icon navigation/focus, centered forms, actual Dari font families and served favicon transparency. Existing workflows and axe rules are preserved.
- `README.md`, `docs/DESIGN_SYSTEM.md`, this report: current asset pipeline, visual decisions and verification scope; refreshed screenshots and axe evidence under `docs/`.

### Verification scope

The browser suite covers the homepage, information page, login and signup at **320, 390, 768 and 1440px** in English LTR and Dari RTL, including overflow, translated metadata, keyboard focus, mobile menus and reduced motion. The existing authenticated application checks cover all eight required widths. Font assertions inspect the computed family on Dari headings, email inputs and Google buttons.

### Commands and results

| Command executed | Result |
| --- | --- |
| `node scripts/generate-icons.mjs` | Exported trimmed UI mark and transparent icons; original unchanged |
| `npm.cmd run check` | Passed: typecheck, lint, 349 translation keys, 46 unit/component tests across 12 files, live production build |
| `npm.cmd run test:e2e` | Passed: all 16 scenarios, including existing application workflows |
| `npx.cmd eslint e2e/pwa.spec.ts scripts/generate-icons.mjs` | Passed after the final PWA/icon changes |
| `npm.cmd run build:demo` | Passed |
| `npm.cmd run test:pwa` | Passed: all 5 scenarios, including served icon alpha, install/update/cache and offline public routes |
| `npm.cmd run build` | Passed again after PWA verification; final output is the live API build with final icon assets |
| `git -c core.whitespace=cr-at-eol diff --check` | Passed; existing Windows line endings retained |

Recorded axe evidence contains **100 states with zero violations**: 68 existing app/auth/overlay states, 16 public states and 16 auth design states. No axe rules or existing workflow assertions were disabled. The mobile menu also passes its direct axe check. Refreshed desktop English/Dari dashboard, desktop landing, Dari mobile landing, desktop login and Dari mobile signup screenshots were visually inspected. The favicon corner pixel has alpha 0, the standard icons have transparency, and the padded maskable icon is opaque. Production builds retain the existing non-fatal Zod annotation notices.

Real Google authentication and server-managed remember duration still require the separate backend. Demo sessions remain in memory and reset on reload. Native-speaker Dari review, physical Safari/iOS installation and assistive-technology checks remain external release work. Historical Lighthouse scores above predate this cleanup and are not measurements of the new auth layout.
