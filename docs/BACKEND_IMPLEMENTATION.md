# Backend implementation and handover

Updated 15 October 2026. The frontend now uses Laravel/MySQL for authentication, onboarding, contacts, services, staff, appointments, dashboard and settings. Local database/browser workflows are verified. VPS deployment, external SMTP delivery and live Google sign-in require real operator configuration.

## Architecture

React/Vite stays at the repository root; Laravel lives once in backend/. The public homepage, existing design, brand assets, English and Dari/RTL remain. Laravel 12 supports local PHP 8.2; production Docker uses PHP 8.4. Plan a framework upgrade before Laravel 12 security support ends on 24 February 2027 ([support policy](https://laravel.com/docs/12.x/releases)).

Implementation followed the role brief: audit; Laravel/MySQL; email authentication; Google OAuth; onboarding/membership; directories; scheduling; dashboard/settings; demo removal; tests; deployment packaging. The initial audit found no backend and an in-browser mock adapter. That adapter is now confined to unit tests.

- Sanctum uses encrypted database sessions, HttpOnly cookies and CSRF protection. Signup, verification/resend, remembered login, logout, password reset and account updates use MySQL and configurable SMTP. Reset consumes the token and invalidates existing sessions.
- Socialite uses stateful authorization-code exchange with PKCE, verified Google email and unique provider identity. Matching email alone never silently links accounts. Provider tokens are not stored. Safe intended destinations survive verification/onboarding.
- Verified users create industry-configurable businesses with timezone, currency, locale, hours and booking defaults. Memberships support owner, administrator, receptionist and staff roles. Owners grant existing verified accounts access; independent staff profiles do not require login accounts.
- Policies and validated tenant context scope business requests. Composite foreign keys reject cross-business booking/staff relationships. Directories have database pagination, search, sorting, validation and archives preserving history.
- Scheduling derives end times and snapshots service name, duration and integer price/currency. A shared business-row lock serializes booking and related configuration writes. Transactions check UTC instants, business-local dates, business/staff hours, breaks, DST, customer/staff conflicts and unassigned capacity.
- Real records drive dashboard/calendar/history. Service prices use integer minor units, including zero-decimal JPY. Frontend validation rejects excess fractional digits instead of silently rounding.
- API failures do not fall back to fixtures. Logout/expiry/workspace changes clear private queries; late session responses cannot restore a logged-out session. A successful booking opens the returned appointment directly without refetching unrelated directories/availability first. PWA caching excludes private endpoints.

## Database tables and relationships

Eight migrations create the schema:

| Tables | Purpose and relationships |
| --- | --- |
| users | Memberships/external identities, optional active business, password hash, verification and locale |
| external_identities | Belongs to user; unique provider/provider ID |
| business_memberships | Unique business/user membership and explicit role |
| businesses | Shared configurable tenant, identified by ULID |
| business_settings, business_hours | One settings record and seven weekday hour records per business; optional breaks |
| customers | Tenant contacts, normalized exact-duplicate fingerprint, archive state |
| services | Tenant duration, integer price, currency and active state |
| staff_members, staff_services | Independent tenant profiles, optional user link, hours and service assignments |
| appointments | Tenant-scoped customer/service/staff references, UTC times, status and historical snapshots |
| sessions, password_reset_tokens | Server authentication and expiring reset state |
| cache, cache_locks | Database cache and locks |
| jobs, job_batches, failed_jobs, migrations | Framework infrastructure; delivery currently synchronous, no queue worker needed |

Range indexes cover business/date, staff/date and customer/date. There is no medical-record or billing schema.

## API and permissions

The [API contract](API_INTEGRATION.md) documents exact routes, payloads, responses, pagination, errors, roles and time semantics. Main groups:

- /sanctum/csrf-cookie, /api/v1/auth/*, /api/v1/me and signed /email/verify/*.
- /auth/google/redirect and /auth/google/callback.
- /api/v1/businesses, /business, /memberships and /dashboard.
- /api/v1/customers, /services, /staff, /appointments, /calendar and /availability.

Staff can read their workspace. Receptionists additionally write contacts/bookings. Administrators additionally write services/staff/settings. Owners additionally manage memberships. Staff reads are workspace-wide; this is not a per-practitioner confidentiality model.

## Local commands and environment

From the repository root, with Docker Desktop running:

~~~sh
npm ci
composer install --working-dir=backend
npm run backend:env
docker compose --env-file backend/.env -f compose.dev.yaml up -d --wait
npm run backend:migrate
npm run backend:prepare-tests
npm run backend:dev
~~~

Run npm run dev in a second terminal. Windows PowerShell may require npm.cmd/npx.cmd. Frontend: **http://127.0.0.1:5173/**; Laravel: **http://127.0.0.1:8000**; local Mailpit: **http://127.0.0.1:8025**. Create your own account; no production sample account is seeded. Keep the MySQL volume and matching private environment together.

Local environment generation creates random application/database secrets and preserves existing keys/Google credentials. It resets other local settings to the template and must not configure production. backend:prepare-tests prepares separate MySQL acm_test and acm_e2e_test schemas. Backend tests require a database ending in _test; browser fixtures require exactly acm_e2e_test.

| Configuration | Settings |
| --- | --- |
| Application | APP_ENV, APP_DEBUG, APP_KEY, APP_URL, FRONTEND_URL |
| Database | DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD; separate MYSQL_ROOT_PASSWORD and MIGRATION_DB_PASSWORD for production tools |
| Sessions/security | SESSION_DRIVER, SESSION_COOKIE, SESSION_LIFETIME, SESSION_ENCRYPT, SESSION_HTTP_ONLY, SESSION_SECURE_COOKIE, SESSION_SAME_SITE, SESSION_DOMAIN, SANCTUM_STATEFUL_DOMAINS, CORS_ALLOWED_ORIGINS |
| Mail | MAIL_MAILER, MAIL_HOST, MAIL_PORT, MAIL_SCHEME, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM_ADDRESS, MAIL_FROM_NAME, MAIL_TIMEOUT |
| Google | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI; public frontend VITE_GOOGLE_AUTH_URL |
| Frontend | VITE_API_BASE_URL; VITE_BACKEND_URL for development/preview proxy |
| Optional limits | ACM_BUSINESSES_PER_USER, ACM_CUSTOMERS_PER_BUSINESS, ACM_SERVICES_PER_BUSINESS, ACM_STAFF_PER_BUSINESS; blank means no numeric cap |

Use [backend/.env.example](../backend/.env.example) locally and [deploy/.env.example](../deploy/.env.example) for production. Production requires explicit HTTPS origins, secure cookies, debug off, restricted runtime credentials, stable APP_KEY and SMTP. Preflight rejects unsafe settings.

## Google Cloud manual setup

Create a Web application OAuth client. Register exactly:

~~~text
http://127.0.0.1:8000/auth/google/callback
~~~

Frontend origin: http://127.0.0.1:5173. Initiation: http://127.0.0.1:8000/auth/google/redirect. This redirect-only flow uses no Google JavaScript SDK. Put client ID/secret only in the ignored backend environment; never place the secret in React/Vite variables.

Configure OAuth branding, consent audience and test users as required by Google. Once the real domain is ready, register its exact HTTPS callback using a production client. Tests mock Google responses; live consent, new-account and repeat-account sign-in still need verification after configuration. See [deployment instructions](DEPLOYMENT.md#google-cloud-manual-configuration).

## Files and runtime demo removal

- backend/app, routes, database, config, bootstrap and tests: controllers, policies, middleware, resources, validation, schema, factories, mail, health/preflight and MySQL tests.
- src/services, src/app, src/features, src/lib, src/types and locales: HTTP integration, permissions, onboarding/verification/reset, error handling and persisted CRUD.
- scripts/setup-backend-local.mjs, scripts/prepare-backend-tests.mjs, package scripts and Playwright configs: repeatable local/test setup.
- compose.dev.yaml, compose.prod.yaml, deploy/*, .dockerignore and .gitattributes: services, production packaging and operational configuration.
- e2e, unit/backend tests and docs: regression tests, screenshots, API and operations handover.

Removed runtime src/services/mock imports, demo-mode/build/environment switching, demo credentials/buttons, simulated auth/signup/Google success, fake runtime dashboard/directories and in-browser business-record persistence and unused demo-banner/login styles. The public product preview remains illustrative marketing UI and is never returned as application data.

Retained only for tests: src/test/adapter.ts, src/test/fixtures.ts, Laravel factories and guarded backend/tests/Support/browser-fixture.php. The default database seeder creates no demonstration account.

## Verification and deployment

See [current verification results](VERIFICATION.md) for actual command outcomes. Real MySQL workflows, production images, restricted grants and an isolated backup/restore round trip were exercised. The [deployment guide](DEPLOYMENT.md) contains exact VPS build/migration/startup, key generation, Google/SMTP, health, backup/restore, update and rollback commands. No VPS has been deployed.

## Remaining configuration and boundaries

- Supply Google credentials and verify live OAuth. Supply production SMTP/sender, domain/DNS and VPS configuration, then deploy and verify HTTPS.
- No payment gateway, charges or active-subscription claims. Initial features are available subject to administrator-configured limits; future billing requires a confirmed offer.
- No invitation-acceptance, ownership-transfer or explicit Google-account-linking UI. Owners can add existing verified users or create login accounts with an initial password and email verification through Workspace access.
- Weekly hours support same-day schedules and breaks. Overnight schedules/date-specific closure editors are outside this release. Existing calendar offers day/week/list views; the range API supports a month, but there is no new month-grid UI.
- No offline writes, medical records, diagnoses, prescriptions, insurance or per-practitioner record privacy. Business logo uploads are supported through private authenticated storage. Native Dari wording, physical devices/screen readers, native install and deployed HTTPS updates still need manual review.
- Build succeeds with upstream Zod annotation warnings and a main-chunk size warning. Historical Lighthouse reports do not measure this backend deployment.
