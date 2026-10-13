# Frontend implementation and verification

Verified on 12 October 2026, on Windows with Node 22.13.0. The initial repository contained only `Skills/Frontend.md`; the original brief has been preserved. No backend or database was implemented.

## Delivered

- All requested auth, app, detail, creation, offline and not-found routes.
- Carbon-informed shared controls, tokens, self-hosted fonts, desktop sidebar/collapse, business header, account menu and mobile bottom navigation/More.
- Connected contact creation/edit/search/pagination; service editing with currency, duration and status; staff profiles, assignments, hours and status; business and account settings.
- Booking: existing or inline-created contact → service → eligible staff → date/available time → review → submit. Rescheduling, status changes and cancellation with confirmation. Customer and staff conflicts, closures and inactive assignments are exercised through the mock API.
- Overview counts derived from the sample appointments, upcoming bookings, status summary, schedule and recent contacts; explicit demo labels throughout.
- Calendar day/week navigation, selectable future slots, existing-appointment links and a list alternative.
- Five separate demo business configurations: salon, clinic, education, consulting and other. Neutral shared domain models and independent tenant preferences.
- Exactly English and Dari, 242 matching translation keys, RTL switching, accessible keyboard language menu, translated document titles and validation errors.
- Environment-separated demo/live services and a proposed Laravel API contract. Demo state stays in memory; no fabricated signup/email/server-persistence responses.
- PWA manifest, regular/maskable/touch icons, static shell caching, update/install controls, iOS guidance and translated offline startup. Writes reject offline instead of entering a paused mutation queue.

## Checks run

| Check | Result |
| --- | --- |
| `npm run typecheck` / build TypeScript check | Passed |
| `npm run lint` | Passed, no warnings |
| `npm run i18n:check` | Passed: 242 keys, English/Dari parity, interpolation parity and static JSX/label checks |
| `npm test` | Passed: 21 tests across six files |
| `npm run test:e2e` | Passed: seven Chromium browser scenarios |
| `npm run build` | Passed: live production adapter; lazy route chunks and PWA output |
| `npm run build:demo` | Passed: explicit in-memory demo bundle |
| `npm run test:pwa` | Passed: manifest/icon verification and service-worker/offline startup scenarios |
| `node scripts/check-contrast.mjs` | Passed: eight primary text/token combinations, minimum 4.83:1 |
| Raster icon inspection | Correct 192/512 sizes; 512px maskable icon has an opaque padded background |

Unit/component coverage includes auth rendering, translated form validation and associations, date/time-zone arithmetic, nonexistent DST times, currency minor-unit conversion, keyboard language switching, dismissal/focus restoration, loading/empty/error feedback, explicit destructive confirmation, tenant-scoped mock resources and booking conflict/status behavior. The final regression checks also cover contact-only appointment edits and cleared numeric fields.

Browser workflows cover validated auth errors, complete booking with inline contact creation, review, rescheduling, confirmation/cancellation, contact search/pagination/editing, active routes, industry switching, services, staff profiles, calendar navigation/slot selection, missing records/pages, mobile More navigation and offline mutation rejection.

The responsive suite checks nine main/create pages at **320, 360, 390, 430, 768, 1024, 1280 and 1440px**, in **English LTR and Dari RTL**, with loaded content and no document horizontal overflow. Sixteen screenshots are saved in `docs/screenshots/`. Desktop English overview, mobile Dari overview, desktop Dari calendar, mobile English booking and mobile Dari settings were visually inspected. Viewport automation does not replace physical-device testing.

The PWA test verifies the installed worker controls the page, precaches the shell, contains no `/api/` or `/sanctum/` cached requests, reloads successfully offline and switches that offline screen to Dari RTL.

## Fixes found through verification

- Disabled TanStack's offline write pausing: services now reject disconnected writes without silently queueing them.
- Enabled first-install service-worker client control and verified actual offline reload.
- Separated ISO currency minor-unit scaling from browser display rounding for AFN.
- Rechecked conflicts when changing only an appointment's contact.
- Linked shared form hints/errors to their controls and ensured cleared numeric inputs return translation keys.
- Improved narrow schedule rows; split routes and restricted font bundles to the scripts used by the two supported locales.

## Remaining release work and limits

1. Connect and agree the Laravel contract, Sanctum CSRF bootstrap/session handling, permissions, tenant authorization, server-side validation, availability locking and real persistence. Production mode already selects HTTP services but no server exists in this phase.
2. Have a native Dari speaker review terminology, phrasing and business-specific guidance before production.
3. Test with real screen readers and physical Safari/iOS/Android devices. Native install prompts and a real deployed service-worker update cycle still need device verification. Production installation requires HTTPS.
4. Large workspaces may need paginated contact selectors and bounded calendar queries instead of loading entire resource directories for related labels/options.
5. There is no offline mutation queue, overnight hours, date-specific staff exceptions, drag-and-drop scheduler, billing or healthcare record functionality. Demo changes and sessions reset on reload.

The installed Zod version emits two harmless Rollup comment-annotation warnings during builds; both builds succeed. No compiler, lint, unit, workflow or PWA failures remain in the reported checks. Initial verification failures were corrected and their checks rerun.
