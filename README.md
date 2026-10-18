# Appointment & Customer Management

ACM combines a React/TypeScript frontend with Laravel, Sanctum, Socialite and MySQL. It supports appointment scheduling, contacts, independent staff profiles, services, workspace roles and business settings. English and Dari/RTL share the existing Carbon-informed design.

## Local development

Requirements: Node 22.12+, PHP 8.2+ with PDO MySQL and mbstring, Composer, Docker Desktop for local MySQL/Mailpit, and Chromium for browser tests. Production targets Namecheap shared hosting with PHP 8.4 and no Docker. On Windows use `npm.cmd`/`npx.cmd` if PowerShell blocks npm scripts.

From the repository root:

```sh
npm ci
composer install --working-dir=backend
npm run backend:env
docker compose --env-file backend/.env -f compose.dev.yaml up -d --wait
npm run backend:migrate
npm run backend:prepare-tests
npm run backend:dev
```

In a second terminal run `npm run dev`. Open **http://127.0.0.1:5173/**. Laravel runs at **http://127.0.0.1:8000**. Create an account; open its verification message in **http://127.0.0.1:8025** (Mailpit), then configure a business. Application records persist in MySQL on port 3307. There are no demo credentials or production sample records.

`backend:env` creates private local environment files and random application/database keys. It preserves existing keys and Google credentials, but resets other local settings to the template. Use it only for this local Docker setup. Never use it to configure a production server. Keep Docker's data volume and its matching database passwords together.

## Verification

```sh
npm run check
npm run backend:test
npx playwright install chromium
npm run test:e2e
npm run test:pwa
```

Run browser suites sequentially: they own backend port 8001 and use the dedicated `acm_e2e_test` schema. Backend tests require MySQL and a database ending in `_test`; they never substitute SQLite. `backend:prepare-tests` creates local test schemas and applies browser migrations. PWA tests require the production build from `npm run check` or `npm run build`.

Browser fixtures are explicitly inserted into the isolated browser database and accessed through real login/API requests. Unit fixtures live in `src/test`. Neither is a production data source. No auth token or private business record is saved in localStorage or the service-worker cache.

## Google sign-in

Register a Google **Web application** OAuth client with this exact local callback:

```text
http://127.0.0.1:8000/auth/google/callback
```

Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` only in the ignored `backend/.env`. The public frontend entry is `http://127.0.0.1:8000/auth/google/redirect`. Production requires the real HTTPS domain and its matching callback. Automated OAuth tests mock Google's responses; successful live Google sign-in still requires your external configuration.

Completing Google Console setup does not configure the local application. Copy the client ID and client secret from that **Web application** OAuth client into their matching entries in `backend/.env`, and keep `GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/auth/google/callback`. Then run `php backend/artisan config:clear` and restart `npm run backend:dev`. Never put the client secret in a `VITE_` variable.

If sign-in returns to `/login?oauth=unavailable` before opening Google, check that both backend credentials are nonempty. Google requires the registered redirect URI to match exactly, including host, port and path; `localhost` and `127.0.0.1` are different hosts. See [Google's web-server OAuth documentation](https://developers.google.com/identity/protocols/oauth2/web-server).

If Google consent succeeds but the callback returns `oauth=failed`, check the sanitized `Google authentication failed` entry in `backend/storage/logs/laravel.log`. `http_status=401` with `provider_error=invalid_client` means Google rejected the client credentials: copy the full client secret from the same OAuth client as the configured client ID, clear Laravel's configuration cache and start a fresh sign-in. Do not reuse an old callback URL.

If the callback returns `oauth=link_required`, an email/password account already uses that email. Sign in with its password. Automatic linking is intentionally blocked, and an explicit Google-account-linking workflow is not implemented yet.

## Namecheap shared hosting

Docker is only for local development. Hosting uses PHP 8.4, cPanel MariaDB/MySQL, HTTPS, SMTP and a five-minute cron entry; no Node or PHP background server is needed.

```sh
npm run deploy:test
npm run deploy:prepare -- --origin https://your-real-domain.com
```

Upload only the prepared release: `public_html` contains the frontend and PHP bridge; `acm-backend` goes outside the public document root. The package excludes local secrets, credential files, uploads and caches. Install Composer production dependencies and configure the private server `.env` after upload. Follow the [Namecheap deployment guide](docs/DEPLOYMENT.md); package preparation does not publish the site.

## Architecture and handover

Platform administration is at **/platform** with separate server-managed access. See [platform access, business/user management, analytics, CMS and logo uploads](docs/PLATFORM_ADMINISTRATION.md). Business roles alone do not grant platform access.

- `src/`: existing public pages, application UI, two locales and real HTTP services.
- `backend/`: validation, policies, tenant-scoped models/APIs, migrations and MySQL tests.
- `compose.dev.yaml`: local MySQL and Mailpit.
- `deploy/` and `npm run deploy:prepare -- --origin https://your-domain.com`: Namecheap/cPanel package with a static React document root and private Laravel backend. Production Docker files have been removed; local database containers remain unchanged.
- [API contract](docs/API_INTEGRATION.md), [deployment and backups](docs/DEPLOYMENT.md), [backend implementation](docs/BACKEND_IMPLEMENTATION.md), [verification history](docs/VERIFICATION.md).
- [Design system](docs/DESIGN_SYSTEM.md), [industry configuration](docs/INDUSTRY_CONFIGURATION.md).

The initial release has no payment gateway, subscription charges or fabricated plan status. Optional numeric limits are administrator configuration. Clinics support basic contacts and scheduling; there are no medical-record, diagnosis or prescription features.

The original artwork remains in `public/brand/ACM_LOGO.png`; its background-free derivative is `public/brand/acm-logo-transparent.png`. Run `node scripts/generate-icons.mjs` after changing the derivative. Public assets use `/brand/` and `/icons/` URLs.
