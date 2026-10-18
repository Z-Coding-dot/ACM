# ACM API contract

Implemented Laravel API: `/api/v1`. The React services in `src/services/contracts.ts` use camelCase DTOs, string IDs and cookie credentials. There is one runtime HTTP adapter; unavailable APIs produce errors, never fixture fallbacks.

## Authentication

Call `GET /sanctum/csrf-cookie` before writes and send the decoded `XSRF-TOKEN` cookie as `X-XSRF-TOKEN`. Session cookies are HttpOnly and encrypted. Production cookies require HTTPS. Exact CORS origins and Sanctum hostnames are environment settings. Bearer tokens are unsupported.

| Method | Path | Payload/result |
| --- | --- | --- |
| POST | /auth/signup | name, email, password, password_confirmation, locale (en/fa-AF), optional returnTo; 201 Session |
| POST | /auth/login | email, password, remember, optional returnTo; 200 Session |
| GET | /auth/session or /me | 200 Session; 401 when signed out |
| POST | /auth/logout | 204; invalidates the server session |
| POST | /auth/forgot-password | email; neutral 204 for known/unknown addresses; delivery failure 503 |
| POST | /auth/reset-password | email, token, password, password_confirmation; 204; token consumed and existing sessions invalidated |
| POST | /auth/verification-notification | authenticated; resend verification; 204 or delivery failure 503 |
| PATCH | /auth/account | name, email, currentPassword when changing email; 200 Session |
| PUT | /auth/password | verified, enabled session; password, password_confirmation, currentPassword if a password already exists; 200 Session; 6 attempts/minute |
| POST | /auth/workspace | verified member; businessId; 200 Session |

Signup creates an unverified account with no business. `verificationEmailSent` records whether synchronous SMTP submission succeeded; a failure leaves the account available for retry. Email changes require the current password and clear verification. `user.hasPassword` indicates whether account settings should display Set password or Change password. A verified Google-only account can establish its first password in account settings without a current password; subsequent changes require the existing password. Passwords must be confirmed, at least 8 characters and at most 72 UTF-8 bytes. Password changes are serialized for the user, rotate the remember token, delete other database sessions, and regenerate the current session. Password login and the linked Google identity both remain usable. No business membership is required for this account-level operation.

Verification uses signed `GET /email/verify/{id}/{hash}` outside the API prefix. The current authenticated user, email hash, signature and expiry must match. Opening the message in another browser requires signing in and opening the link again.

Session example (illustrative structure, not a seeded account):

```json
{"user":{"id":"1","name":"Owner","email":"owner@example.test","emailVerified":false,"locale":"en","businessId":null},"businesses":[],"activeBusinessId":null,"verificationEmailSent":true}
```

An authorized business includes `id, name, industry, email, phone, timeZone, currency, locale, hours, appointmentSettings, role, permissions`. Active workspace selection persists on the user record. Safe `/app/*` return destinations survive authentication, verification and onboarding. Foreign origins, traversal, backslashes and control characters are rejected.

## Google OAuth

- `GET /auth/google/redirect?returnTo=...&locale=en|fa-AF`
- `GET /auth/google/callback`

Socialite owns the stateful authorization-code exchange with PKCE. Only openid/profile/email scopes are requested. A verified provider email and stable Google ID are required. Unique external identities prevent duplicate linking. Existing identities authenticate their linked local user; an unrelated local account with a matching email is rejected with `link_required`. Automatic email linking and provider-token storage are not implemented.

Errors redirect to the frontend login with a whitelisted `oauth` code: denied, state, identity, link_required, unavailable (missing configuration) or failed (callback/provider failure). Provider HTTP failures log only the exception class, HTTP status and an allowlisted OAuth error code; response bodies and credentials are excluded. Missing credentials never simulate success. See [Google's web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server) and [OAuth production readiness](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance).

## Business context and roles

Every business endpoint requires authentication, verified email and membership. Supply `X-Business-ID` or use the user's authorized active business. Header IDs are checked; tenant-owned lookups include the business constraint. Foreign resources return 404. Composite database foreign keys additionally reject cross-business appointment/staff relationships.

| Role | Read workspace | Contacts/bookings | Services/staff/settings | Membership access |
| --- | --- | --- | --- | --- |
| Owner | Yes | Write | Write | Write |
| Administrator | Yes | Write | Write | No |
| Receptionist | Yes | Write | No | No |
| Staff | Yes | No | No | No |

Staff profiles can exist without login accounts. A linked user must already belong to that business. Staff-role reads cover the workspace; there is no per-practitioner confidentiality model in this release.

| Method | Path | Behavior |
| --- | --- | --- |
| GET/POST | /businesses | List permitted businesses / create owned business |
| GET/PATCH | /business | Read/save active business configuration |
| GET/POST | /memberships | Owner lists/adds an existing verified account by email and role |
| POST | /memberships/accounts | Owner creates a new login with name, email, initial password and non-owner role; returns membership and verificationEmailSent |
| PATCH/DELETE | /memberships/{id} | Owner changes non-owner role/removes access |
| GET | /dashboard | Real daily schedule, upcoming appointments, status counts, contact total and recent contacts |

Owners cannot be demoted or removed through these membership endpoints. Owners can either add an existing verified/enabled account or create a new login and assign its workspace role atomically. New logins start unverified, inherit the business locale, have hashed initial passwords and require email verification before workspace access. The owner remains signed in. An existing email is rejected by account creation; this endpoint never changes another account's password, name or platform privileges. Verification delivery failure leaves the account available for sign-in and resend. Login accounts are separate from bookable team profiles. There is no invitation-acceptance or ownership-transfer workflow. Removing access preserves staff profiles and appointment history.

Business input: `name, industry, email, phone, timeZone, currency, locale, hours, appointmentSettings`. Industries: salon, clinic, education, consulting, other. Settings: `slotMinutes` 5–60, `allowUnassigned`, `requireConfirmation`. Seven hours entries use day 0 Sunday through 6 Saturday, local HH:mm, closed, and optional breaks `[{open,close}]`. Breaks must be ordered without overlaps and stay inside opening hours. Overnight hours/date-specific closures are not modeled.

## Directories

For each of `/customers`, `/services`, `/staff`:

- GET collection; POST create (201).
- GET/PATCH `/{id}` (200); DELETE `/{id}` archives (204).
- Details and writes return `{"data": {...}}`.
- Query: search, page, per_page (1–100), active=true/false/all, sort=name/createdAt, direction=asc/desc.
- Contacts default to active records; services/staff include inactive records so they can be managed.
- Search matches names and, for contacts/staff, email/phone. SQL wildcard characters are escaped.

```json
{"data":[],"meta":{"current_page":1,"per_page":20,"total":0,"last_page":1}}
```

| Resource | Fields |
| --- | --- |
| Customer | id, businessId, name, email, phone, notes, active, createdAt |
| Service | id, businessId, name, description, durationMinutes (5–480), priceMinor (integer, 0–1,000,000,000), currency, active |
| Staff | id, businessId, name, email, phone, serviceIds, hours, active, optional userId |

Contact email/notes are optional; phone is required. Exact normalized name/email/phone fingerprints prevent accidental duplicate contact creation without imposing uniqueness on a family's shared phone/email. Archives preserve history. Active appointments must be cancelled/rescheduled before a referenced record can be archived. Staff assignment/hour edits and business schedule edits cannot invalidate existing active appointments.

Money is stored as integer minor units; each service retains its own currency. Supported currencies: AFN, USD, EUR, GBP, AED, INR, PKR (two digits), JPY (zero). Changing business currency does not convert prices.

Contact selectors and directories fetch pages rather than downloading all contacts. Appointment responses include authorized display names, so calendar/history views do not require a complete contact directory.

## Appointments and availability

| Method | Path | Behavior |
| --- | --- | --- |
| GET/POST | /appointments | Paginated query / create (201) |
| GET/PATCH | /appointments/{id} | Read / reschedule or update |
| PATCH | /appointments/{id}/status | confirmed, completed, cancelled, no-show |
| DELETE | /appointments/{id} | Cancel while retaining history |
| GET | /calendar | Same range-query contract as appointments |
| GET | /availability | Available UTC start instants |

Booking input: customerId, serviceId, nullable staffId, startsAt, notes, optional scheduled/confirmed status. The server derives end time and stores duration, service-name and price/currency snapshots. The business confirmation setting determines initial status. References must be active, belong to the business and have the required staff/service assignment.

Timestamps require ISO 8601 with an explicit UTC offset or Z, minute precision and a real calendar date. Database values are UTC. Booking horizon is 365 days. A slot must fit business and staff hours, avoid breaks and align with the configured interval from the later opening time. DST gaps/folds are evaluated using actual elapsed UTC minutes.

Active scheduled/confirmed appointments reserve capacity. Overlaps are rejected for the same customer or staff member. Unassigned appointments share one unassigned capacity per business; other staff have independent capacity. A shared business-row lock serializes booking, cancellation, configuration and directory writes. Validation and insertion occur in a MySQL transaction with deadlock retries. Two independent PHP workers are tested against the same slot.

Completed/cancelled/no-show records cannot be rescheduled or resurrected. Completed/no-show transitions require the start time to have arrived.

Query: search, from/to (inclusive business-local dates), status, staffId, customerId, page, per_page. Default window: 30 days before today through 120 days after that start. Explicit ranges are limited to 367 days. Customer history without from/to spans history but remains database-paginated. Availability query: serviceId, date (local YYYY-MM-DD), optional staffId, customerId, excludeId; response `{"data":["...Z"]}`.

## Errors, caching and operations

Platform administration, CMS, analytics and authenticated business logo endpoints are documented in [Platform administration](PLATFORM_ADMINISTRATION.md#api-additions). Sessions now include `user.platformAdmin`; business profiles include `logoUrl` and `suspended`. Platform authorization is independent of business membership.

HTTP: 401 unauthenticated, 403 unauthorized/unverified, 404 absent/inaccessible, 409 conflict, 419 invalid CSRF/session, 422 validation, 429 throttled, 503 delivery/service unavailable. Field errors are translated through approved frontend keys; arbitrary backend text is not rendered. Whitelisted conflict codes distinguish plan limits, referenced active bookings and schedule changes.

Logout, expiry and workspace changes cancel and clear private query data. Pending workspace responses cannot restore a logged-out session. The service worker precaches static assets only and excludes API, CSRF, OAuth and verification routes. Mutations require connectivity.

Liveness: `/up`; database readiness: `/health/ready`; CLI health: `php artisan acm:health`; production preflight: `php artisan acm:production-check`. Initial limits are optional environment configuration, not subscription billing.
