# Namecheap shared-hosting deployment

ACM runs on Namecheap shared hosting without Docker, a Node server, Nginx configuration or a persistent PHP process. React is built locally; cPanel serves the static frontend and PHP handles Laravel requests. `compose.dev.yaml` remains only for local MySQL/Mailpit and existing local data
This prepares a deployment package; it does not publish your site. Namecheap account access, the real domain, SMTP, SSL and Google callbacks still require your configuration and live verification.

## Requirements and layout

Enable SSH/Terminal in cPanel. Select PHP 8.4 for the domain and verify that the CLI PHP used by Composer/Artisan is also 8.4 (8.2 minimum). Enable Laravel's required extensions, including PDO MySQL, mbstring, fileinfo, OpenSSL, ctype, curl, DOM/XML, session and tokenizer. Composer 2 is needed on the server. Node 22.12+ is needed only on the build computer.

Namecheap currently documents LiteSpeed, rewrite support, MariaDB and selectable PHP versions in its [software list](https://www.namecheap.com/support/knowledgebase/article.aspx/129/22/what-version-of-the-software-is-used-on-your-servers/). The MySQL-protocol connection in this template also connects to MariaDB. Our existing database tests run on MySQL 8.4; validate migrations, foreign keys and concurrent booking on your actual hosting database before launch.

Use one canonical HTTPS domain for both frontend and API. The prepared layout is:

```text
/home/CPANEL_USER/
  acm-backend/       Laravel source, vendor, .env and private storage
  public_html/      Built React files, .htaccess, .user.ini and backend.php
```

Only `public_html` is the document root. Never place the Laravel project, `.env`, credentials, SQL backups, logs or private uploads inside it. The public PHP bridge loads `../acm-backend/public/index.php`. For an addon/subdomain with a different document root, edit its `$backend` path to the absolute private Laravel directory before upload; do not move Laravel into the web root.

## Prepare the package locally

From the repository root (use npm.cmd on Windows):

```sh
npm ci
npm run check
npm run deploy:test
npm run deploy:prepare -- --origin https://your-real-domain.com
```

The command builds the frontend with `/api/v1` and the real Google initiation URL. A new ignored `release/namecheap-.../` directory contains `public_html/`, `acm-backend/`, this guide and a SHA-256 file manifest. It never copies the local `.env`, vendor, private storage, database dumps, tests or cached Laravel configuration. Runtime storage starts empty. **Do not upload the whole repository or local backend directory.**

For cPanel File Manager, zip only the generated release folders before upload and extract them into the private home and domain document root respectively; include hidden .htaccess/.user.ini files. Alternatively use SFTP. Never zip the whole workspace.

The package intentionally has no vendor directory: install production dependencies over SSH in the private backend after upload. This avoids uploading local development packages. Rebuild for a different canonical domain; changing the server .env does not rewrite the built frontend's Google URL.

## First installation in cPanel

1. Point the real domain at the hosting account, install its SSL certificate and enable Force HTTPS Redirect in cPanel. Use the same canonical host everywhere; if needed redirect www to the chosen host. Do this before accepting sign-ins.
2. In cPanel MySQL Databases, create the production database and database user, then assign that user to that database. Record the full cPanel-prefixed names. Grant the schema permissions needed for initial migrations; never use root credentials or the local development database. After setup, reduce runtime privileges to SELECT/INSERT/UPDATE/DELETE if your panel permits it. Temporarily restore migration privileges for future schema updates.
3. Upload `acm-backend/` to the private home directory. Copy its `.env.example` to `.env`, set mode 600 and fill database, SMTP and Google values privately. Quote passwords containing spaces, # or $ using dotenv-compatible quoting; keep secrets out of commands and chat. Keep APP_ENV=production, APP_DEBUG=false, HTTPS origins and secure encrypted sessions.
4. Set APP_URL and FRONTEND_URL to the canonical HTTPS origin, SANCTUM_STATEFUL_DOMAINS to its hostname, and CORS_ALLOWED_ORIGINS to its HTTPS origin. The package template already uses the origin supplied during preparation. For the database use the cPanel host (normally localhost), port and full prefixed names. Use your provider's verified SMTP sender and exact TLS settings. MAIL_SCHEME=smtp with port 587 uses STARTTLS; smtps with port 465 is another provider-dependent option.
5. In SSH, select the correct PHP binary. `/opt/alt/php84/usr/bin/php` is an example; verify its availability/version on your account. Use that same binary for Composer, Artisan and cron. If `php -v` already reports the selected version, plain php is fine. Follow [Namecheap's Composer setup](https://www.namecheap.com/support/knowledgebase/article.aspx/9977/29/how-to-install-composer-on-shared-servers/) if Composer is not installed.

```sh
cd /home/CPANEL_USER/acm-backend
mkdir -p bootstrap/cache storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs storage/app/private
PHP_BIN=/opt/alt/php84/usr/bin/php
"$PHP_BIN" -v
# composer.phar may have a different private location on your account.
"$PHP_BIN" /home/CPANEL_USER/composer.phar install --no-dev --prefer-dist --optimize-autoloader
# First installation only: never regenerate an existing production APP_KEY.
"$PHP_BIN" artisan key:generate --force
"$PHP_BIN" artisan acm:production-check
"$PHP_BIN" artisan migrate --force
"$PHP_BIN" artisan config:cache
"$PHP_BIN" artisan route:cache
"$PHP_BIN" artisan view:cache
"$PHP_BIN" artisan acm:health
```

6. Ensure storage and bootstrap/cache are writable by your hosting PHP user, without world-write permissions (start with directories 755, files 644, .env 600). Do not use chmod 777. Upload the package's `public_html` contents into the domain document root, including hidden `.htaccess` and `.user.ini`. Preserve cPanel-generated PHP-handler lines and SSL-validation files when merging an existing .htaccess. The supplied .user.ini sets safe error/upload limits; if it is not honored, set those values in cPanel PHP Options. A logo upload is limited to 2 MiB, with a 3 MiB POST limit.
7. Open `/health/ready` over HTTPS and verify JSON status ready. Then check the homepage, `/about`, `/login`, `/app/overview` and `/platform` route reloads. `/api/...` failures must return Laravel JSON, not React HTML. If PHP source is displayed or .htaccess fails, stop and correct the PHP/rewrite handler before continuing.
8. Create and verify your real owner through signup. From the private backend, grant platform access using `"$PHP_BIN" artisan acm:platform-admin YOUR_VERIFIED_EMAIL`. The production database has no automatically created owner, no test account and no default password. Do not copy the local credential file or use --create-local in production.

No `artisan serve`, Vite dev server, queue daemon or Docker service runs on the hosting account. Email delivery is synchronous with a bounded timeout. Business logos are served by authenticated Laravel routes; do not create a public storage symlink for them.

## Google sign-in and email

Register the exact production callback `https://your-real-domain.com/auth/google/callback` in the Google Web application client. Configure consent audience/publishing/test-user rules for the intended audience. Set both credentials only in the private production .env. Initiation is `/auth/google/redirect`; credentials are never VITE variables. After changing server settings, clear/rebuild Laravel configuration and start a fresh sign-in.

Test new and returning Google users, consent denial, logout and setting a password followed by email/password login. Existing unrelated local accounts are not silently linked to Google by matching email. Verify signup email and password-reset delivery to external addresses; local Mailpit delivery does not prove production SMTP delivery.

## Cron and maintenance

Namecheap disallows cron intervals shorter than five minutes: see its [cron documentation](https://www.namecheap.com/support/knowledgebase/article.aspx/9453/29/how-to-run-scripts-via-cron-jobs/). Configure one cron entry with `*/5 * * * *`, using the actual PHP binary:

```sh
/opt/alt/php84/usr/bin/php /home/CPANEL_USER/acm-backend/artisan schedule:run >> /home/CPANEL_USER/acm-cron.log 2>&1
```

Current scheduled tasks are daily reset-token and analytics/activity cleanup; their midnight minute is included in this five-minute interval. Laravel runs in UTC; cPanel cron uses server time. Do not change this to every minute on shared hosting or run schedule:work. Monitor and rotate the private cron/application logs; do not expose them in public_html. Configure an external uptime check for HTTPS `/health/ready` and review errors/SMTP failures. The hosting provider may retain access logs containing OAuth codes or signed verification URLs; restrict access and retention rather than assuming those logs are disabled.

## Backups, updates and rollback

Before accepting customer data, schedule private off-host backups and test restoration into a separate database/private storage directory. Use cPanel Backup/Backup Wizard or phpMyAdmin export for the production database and archive `acm-backend/storage/app/private/business-logos` for uploads. Keep a separately protected copy of production APP_KEY/.env and the release identifier. A database-only backup loses uploaded logos. Encrypt backups and keep them outside public_html; verify their contents and completion. Choose retention and monitoring appropriate to your business.

For an update, back up the database/uploads first and keep the previous matching release. Enter Laravel maintenance mode using `artisan down`, upload the new private source and public files, install Composer dependencies, clear old caches with `artisan optimize:clear`, run `artisan migrate --force`, rebuild config/route/view caches and run preflight/health before `artisan up`. Retain .env, APP_KEY, uploaded logos and runtime directories: do not replace the private backend wholesale with the package's empty storage. Keep content-hashed old frontend assets until active browsers have updated. A service-worker update may require users to reload.

Rollback to the previous application/frontend release only if it supports the current schema. Otherwise restore the matched database and uploads in maintenance mode. Never drop tables, delete storage or blindly roll back migrations on customer data. Test restore and rollback on a separate staging database, never your local or production database by accident.

## Release acceptance

On the actual Namecheap account verify HTTPS/cookie flags, private-file denial, SPA route reloads, signup/verification/reset, Google sign-in, workspace permissions, simultaneous booking conflicts, service/staff/contact CRUD, password changes, CMS publishing, logo upload/retrieval and mobile/RTL dialogs. Test backup/restore, cron and SMTP failures. Packaging and local Apache checks cannot establish the host's MariaDB behavior or resource capacity. Shared-hosting resource limits may become a constraint as businesses and concurrent traffic grow.
