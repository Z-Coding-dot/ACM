# ACM deployment and operations

Production packaging is prepared for a Linux VPS with Docker Engine/Compose, public DNS and HTTPS. No VPS deployment, real domain, external SMTP delivery or live Google consent flow is claimed by this repository's local tests.

## Production topology

Caddy terminates HTTPS and forwards to Nginx. Nginx serves the built React/PWA and forwards API, CSRF, OAuth, verification and health paths to PHP-FPM. MySQL is private with persistent storage. The PHP runtime is 8.4; Laravel 12 is used to remain compatible with the local PHP 8.2 environment. Plan a framework upgrade before Laravel 12 security support ends on 24 February 2027 ([official release policy](https://laravel.com/docs/12.x/releases)).

Runtime credentials have SELECT/INSERT/UPDATE/DELETE on the ACM schema. A separate migration account has schema-level DDL privileges. Root and migration passwords are not present in the app environment. Initialization grants run only for a new MySQL volume. Never delete an existing data volume to reset passwords or replay initialization.

Storage and bootstrap/cache belong to www-data. The app runs without root privileges. The app image contains no environment secrets or browser test scripts. Caches are generated at startup from runtime environment values. Keep APP_KEY stable across releases; changing it invalidates encrypted cookies/sessions.

## First deployment — run on the VPS

1. Install Docker/Compose, clone the repository and check out a reviewed release. Point the real domain's DNS at the VPS. Allow inbound 80/443; do not expose MySQL or PHP-FPM.
2. Copy `deploy/.env.example` to `deploy/.env`; set mode 600. Fill the real ACM_DOMAIN and PUBLIC_ORIGIN (https://your-real-domain), SMTP relay and verified sender.
3. Generate three different database passwords with `openssl rand -hex 32`. Supply DB_PASSWORD, MYSQL_ROOT_PASSWORD and MIGRATION_DB_PASSWORD. The bootstrap requires hexadecimal database passwords of at least 32 characters. Generate APP_KEY using `openssl rand -base64 32` and prefix the value with `base64:`. Do not commit or paste these values into chat.
4. Optionally configure Google credentials and positive initial-plan limits. Blank limits mean no numeric cap. Keep all credentials server-side.

From the repository root:

```sh
chmod 600 deploy/.env
export ACM_VERSION="$(git rev-parse --short HEAD)"
docker compose --env-file deploy/.env -f compose.prod.yaml config --quiet
docker compose --env-file deploy/.env -f compose.prod.yaml build app web
docker compose --env-file deploy/.env -f compose.prod.yaml up -d --wait mysql
docker compose --env-file deploy/.env -f compose.prod.yaml run --rm migrate
docker compose --env-file deploy/.env -f compose.prod.yaml up -d --wait app web scheduler https
docker compose --env-file deploy/.env -f compose.prod.yaml exec app php artisan acm:production-check
docker compose --env-file deploy/.env -f compose.prod.yaml exec app php artisan acm:health
```

Caddy obtains certificates for the configured real domain. Verify the HTTPS homepage, /health/ready, signup, verification, logout, password reset and business persistence in a clean browser. Confirm secure/HttpOnly session cookies and perform a backup/restore drill before accepting customer data. These commands do not publish a site until run on your VPS with its real domain.

Production sends mail synchronously with a bounded timeout. There is no queue worker requirement. Delivery failure is surfaced; account creation can succeed while verification delivery is retried. The scheduler runs Laravel's expired password-reset cleanup daily. Do not add a second scheduler for the same deployment.

Nginx request access logs are disabled and error logging is restricted to critical errors because reset/OAuth/verification URLs contain sensitive values. Laravel reports database exceptions without SQL bindings and provider/SMTP failures without sensitive provider response text. Keep debug disabled and protect server logs and backups.

## Google Cloud manual configuration

Create a Web application OAuth client. In development register exactly:

- Callback: `http://127.0.0.1:8000/auth/google/callback`.
- Frontend: `http://127.0.0.1:5173`.
- Initiation: `http://127.0.0.1:8000/auth/google/redirect`.

The redirect-only Socialite flow does not require a JavaScript SDK. If you configure an authorized JavaScript origin for related use, use the actual frontend origin. Do not confuse it with the callback URI.

For production use a separate Google Cloud project and Web application client with the real HTTPS callback `https://your-real-domain/auth/google/callback`. Configure Google OAuth branding/audience/contact details and permitted testing users as applicable to your account/audience. Check publishing and verification requirements in [Google's current production guidance](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance). The application requests only identity scopes. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET on the backend and ensure GOOGLE_REDIRECT_URI matches exactly.

Mocked provider tests verify callback behavior and identity rules; they do not prove live Google sign-in. Test successful new/existing Google accounts, denied consent and logout in a real browser after configuration. Existing local accounts with matching email are deliberately not silently linked; use their email/password sign-in. Explicit account linking is not offered.

## Backups — run on the VPS

Protect the backup directory and encrypt copies before moving them to off-host storage. Retain the release identifier and a separately protected APP_KEY/environment backup. Database backups contain private contact/appointment data.

```sh
install -d -m 700 deploy/backups
docker compose --env-file deploy/.env -f compose.prod.yaml exec -T mysql sh -c 'MYSQL_PWD="$MIGRATION_DB_PASSWORD" exec mysqldump --user=acm_migrate --single-transaction --quick --no-tablespaces --set-gtid-purged=OFF --routines --triggers --events acm' | gzip > "deploy/backups/acm-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
chmod 600 deploy/backups/*.sql.gz
```

Use a shell with pipeline failure detection (`set -o pipefail`) and check the command exit status; verify the archive with `gzip -t`. Schedule backups outside the application scheduler, monitor failures and test restoration on an isolated instance. Back up app_storage too if future features place non-reconstructable files there; currently it contains runtime caches/logs, not customer uploads. This release has no file-upload feature.

## Restore, update and rollback

Restore is destructive to the target database: verify the target project/volume and take a fresh backup first. Stop app/web/scheduler/https or put the site in maintenance mode. On the intended target only:

```sh
gzip -dc deploy/backups/CHOSEN-VERIFIED-BACKUP.sql.gz | docker compose --env-file deploy/.env -f compose.prod.yaml exec -T mysql sh -c 'MYSQL_PWD="$MIGRATION_DB_PASSWORD" exec mysql --user=acm_migrate acm'
```

For updates: back up, retain the previous immutable image tags/digests, review migration compatibility, build the new ACM_VERSION, run the migrate service and recreate app/web/scheduler/https. Check health and real user workflows. Do not use `down -v` for updates.

For rollback, restore the previous reviewed application/frontend images only when they are compatible with the current schema. Otherwise restore the matched database backup in maintenance mode and deploy its matching release. Do not blindly run destructive migration rollbacks against customer data. Keep previous images and backups until the new release is verified.

## Local commands are different

Local development uses `compose.dev.yaml`, backend/.env, ports 3307/1025/8025 and Mailpit; it never needs production HTTPS or Google credentials. See the root README. Browser fixtures and MySQL test schemas must remain isolated from production.
