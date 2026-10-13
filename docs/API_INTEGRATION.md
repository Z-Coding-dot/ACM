# Laravel integration contract (proposed)

This repository implements the frontend only. There are no Laravel files, database migrations, real authentication credentials, or database persistence. `src/services/contracts.ts` is the adapter boundary; React components use feature services through TanStack Query and never fetch URLs themselves.

## Modes

- `npm run dev` uses `.env.development` and the in-memory demo adapter. Only the displayed demo credentials work. Reloading resets authentication and demo changes.
- `npm run build:demo` explicitly produces a public-data demonstration build. Do not use it with private or real customer records.
- `npm run build` uses the live HTTP adapter; mock authentication is disabled in production mode even if someone sets `VITE_API_MODE=demo`.
- Copy `.env.example` to `.env.production.local` and set `VITE_API_BASE_URL` to the Laravel API. Vite environment values are public; never put secrets there.

The mock implements the same interfaces as the live services. Mock tenant checks help exercise the UI, but cannot establish server authorization. All five demo workspaces belong to a single demo account. Query keys start with the business ID; switching businesses clears the query cache and remounts workspace content.

## Authentication and tenancy

Proposed session-cookie authentication with Laravel Sanctum: HttpOnly session cookies, credentials included, exact allowed CORS origins, CSRF protection, and XSRF token headers. The HTTP client reads Laravel's `XSRF-TOKEN` cookie and supplies `X-XSRF-TOKEN`. The server must establish CSRF cookies before login; integrate a bootstrap endpoint or Sanctum `/sanctum/csrf-cookie` call appropriate to the chosen deployment topology. That external bootstrap is not invented here.

All workspace requests send `X-Business-ID`; Laravel must verify membership for that workspace and scope every lookup and mutation server-side. This header and frontend filtering are not security boundaries. No authentication token, session assertion, or customer data is persisted to localStorage.

Auth endpoints are relative to `VITE_API_BASE_URL`:

| Method | Endpoint | Input / response |
| --- | --- | --- |
| GET | `/auth/session` | Session below; 401 for signed-out |
| POST | `/auth/login` | `{ "email": "…", "password": "…" }` → Session |
| POST | `/auth/signup` | `{ "name": "…", "email": "…", "password": "…" }` → 204 after real server acceptance |
| POST | `/auth/forgot-password` | `{ "email": "…" }` → 204, neutral anti-enumeration response |
| POST | `/auth/logout` | 204, invalidate server session |
| PATCH | `/auth/account` | `{ "name": "…", "email": "…" }` → 204 |

```json
{
  "user": { "id": "u_1", "name": "Workspace owner", "email": "owner@example.com", "businessId": "b_1" },
  "businesses": [{ "id": "b_1", "name": "Example business", "industry": "other", "email": "hello@example.com", "phone": "+93700123456", "timeZone": "Asia/Kabul", "currency": "AFN", "locale": "en", "hours": [{ "day": 0, "open": "09:00", "close": "18:00", "closed": false }], "appointmentSettings": { "slotMinutes": 30, "allowUnassigned": true, "requireConfirmation": false } }],
  "activeBusinessId": "b_1"
}
```

The UI submits real signup/reset requests only in live mode. The demo returns translated "unavailable" errors rather than claiming an email was sent or an account was created. Production user/email verification and permission models must be agreed with the backend team.

## Resources and pagination

`/appointments`, `/customers`, `/services`, `/staff`: GET collection, GET `/{id}`, POST create, PATCH `/{id}`. Details and mutations return `{ "data": DomainObject }`. Lists return Laravel-style metadata:

```json
{ "data": [], "meta": { "current_page": 1, "per_page": 6, "total": 0, "last_page": 1 } }
```

Customer directory query: `search`, `page`, `per_page`; the adapter converts snake-case pagination metadata into TypeScript's camel-case model. Appointment filters: `search`, `from`, `to`, `status`, `staffId`, `page`. Date ranges are inclusive business-local ISO dates. Resource directory queries consume all pages for select options. Large-scale server-side selectors and bounded calendar queries are a future optimization.

Laravel API Resources should serialize domain properties in camelCase consistently (or add conversion in the services). IDs are strings. `businessId` comes from validated tenant context; the server must ignore or reject attempts to assign another tenant.

Appointment create / update body:

```json
{
  "customerId": "c_1", "serviceId": "s_1", "staffId": "t_1",
  "startsAt": "2026-10-13T04:30:00.000Z", "status": "scheduled", "notes": "Scheduling note"
}
```

Appointment response:

```json
{
  "data": {
    "id": "a_1", "businessId": "b_1", "customerId": "c_1", "serviceId": "s_1", "staffId": "t_1",
    "startsAt": "2026-10-13T04:30:00.000Z", "endsAt": "2026-10-13T05:15:00.000Z",
    "status": "scheduled", "notes": "Scheduling note"
  }
}
```

Related customers/services/staff are normalized by ID and resolved from resource queries. Optional staff is `null`. The server calculates `endsAt` from the selected service, checks future date, permitted status transitions, active services/staff, assignments, hours, and customer/staff conflicts atomically. Statuses: `scheduled`, `confirmed`, `completed`, `cancelled`, `no-show`.

- `GET /availability?serviceId=s_1&staffId=t_1&date=2026-10-13&excludeId=a_1` → `{ "data": ["2026-10-13T04:30:00.000Z"] }`. `staffId` and editing `excludeId` are optional.
- `PATCH /appointments/{id}/status` with `{ "status": "cancelled" }` → `{ "data": Appointment }`.
- `PATCH /business` with editable Business values → `{ "data": Business }`.

Customer input: `{ name, email, phone, notes }`; server response adds `id`, `businessId`, ISO `createdAt`. Staff input: `{ name, email, phone, serviceIds, hours, active }`. Service input: `{ name, description, durationMinutes, priceMinor, currency, active }`; price is an integer in currency minor units. Currency uses ISO codes and the currency's fraction digits (JPY has zero); changing business currency does not convert existing service prices.

Minor-unit conversion is explicitly defined for the eight currently supported currencies. AFN uses two minor-unit digits, independently of the browser's default display rounding. The AFN/JPY/PKR definitions were verified against the [official SIX ISO 4217 list](https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml). Add and verify a currency's minor-unit exponent when extending the currency options.

Hours are seven entries, `day: 0` Sunday through `6` Saturday; `open`/`close` use business-local `HH:mm`. Overnight hours and date-specific exceptions are outside this first UI phase. All API timestamps are ISO 8601 with an explicit offset; the UI formats in business time zone and locale, using Gregorian calendar dates for consistent booking input.

## Errors

```json
{ "message": "Validation failed", "errors": { "email": ["Invalid email"], "startsAt": ["Unavailable time"] } }
```

422 field errors map to translated frontend messages for booking and contact forms; other forms show a translated request error. Arbitrary backend text is not rendered as interface copy. Central errors cover network/offline, 401, 403, 404, 409 conflicts, 419 CSRF/session expiration, 422, and 429. Auth provider checks `/auth/session` at startup. Full session-expiry interception and backend permissions should be wired during Laravel integration.

## PWA and deployment

Static shell assets are precached. There is no runtime API caching, mutation queue, or claim of offline booking. Offline startup routes to the translated offline screen; online data queries and writes reject while disconnected. Query data lives in memory, is cleared on logout/workspace switch, and is not a service-worker cache.

Production installation requires HTTPS, a history fallback to `index.html`, appropriate CORS/CSRF/session settings and CSP. `/api/` and `/sanctum/` are excluded from navigation fallback. The manifest includes regular 192px/512px icons, a separately padded maskable icon, and an Apple touch icon. Update prompts request reloading after saving work. iOS guidance appears only on relevant devices.
