# Platform administration

The business workspace remains at `/app`. Platform administration is a separate application area at `/platform`; it requires a verified, enabled user with the server-managed `is_platform_admin` flag. Owning or administering a business does not grant platform access. Platform administrators do not automatically gain business membership or access to tenant APIs.

## Getting access

Run migrations first. Grant access to an existing verified account from the backend server:

```powershell
php backend/artisan migrate
php backend/artisan acm:platform-admin owner@example.com
```

Use `--revoke` to remove access. The last platform administrator cannot be revoked. The public registration/account endpoints and platform user editor cannot set platform privileges.

For local development only, a temporary owner can be created with:

```powershell
php backend/artisan acm:platform-admin platform.owner@example.test --create-local
```

This requires `APP_ENV=local` and an address ending in `.test`. It generates a random password and writes credentials to the ignored `backend/storage/app/private/platform-owner-credentials.txt`. Rerunning the command does not reset an existing account's password. Sign in at `/login`; platform administrators land at `/platform` by default. Create and verify the real owner account before using this in production, grant it access through the server command, then revoke the temporary account's access.

## Features and boundaries

- Overview: real counts of businesses, accounts, appointments, contacts, recent recorded page views and write operations.
- Businesses: search/paginate, create with an existing verified owner, edit contact details, suspend/reactivate, or permanently delete with exact-name confirmation. Deleting a business cascades its business records. Scheduling-sensitive configuration stays in the existing business settings workflow; platform access does not impersonate owners.
- Users: search/paginate, create accounts with email verification, edit display names, disable/reactivate, or delete with exact-email confirmation. Disabling ends sessions and blocks password/Google login. Business owners must cease ownership before deletion. Platform administrators cannot be disabled or deleted from this UI. Account email changes remain in the password-protected verification workflow.
- Analytics: homepage and About page views, aggregated by UTC date/path/locale; repeated views count, hash navigation does not. No unique-visitor estimate, IP address, device identifier or URL query is stored. Requests are throttled; analytics are best effort and are not bot-proof. No historical data is invented. Aggregates are retained for 400 days and the dashboard displays the last 30 days.
- Activity: successful POST/PATCH/PUT/DELETE operations on authenticated business/platform APIs, plus CLI platform-access changes. Records contain actor ID, optional business ID, method, route template, record ID and time. Passwords, request bodies, OAuth values and query parameters are excluded. Records are retained for 365 days.
- CMS: plain-text overrides for allowlisted strings on the existing homepage and About page, separately for English and Dari. Save draft, publish, or restore the shipped default. Drafts are never public. Placeholder names must match the original; HTML is rendered as text. This edits the existing page content, not the page layout. Published content is fetched when public pages mount and is excluded from service-worker runtime caching.

Keep the scheduler running in production so retention jobs execute. The existing shared application storage volume persists business logos.

## Business settings and branding

Settings are divided into business details, working hours, appointment preferences, personal account details and workspace access. Unsaved business form values survive section changes; Save changes commits the current business settings, while Discard changes resets them. Business mutation controls respect workspace permissions; personal account details remain editable by their owner.

In **Settings → Workspace access**, a business owner can choose **Create login account** and enter a person's name, email, initial password and workspace role, then use **Create account and add member**. The new account can sign in with those credentials, verify its email, and enter the assigned business. Share the initial password privately; the person can set their own through password reset. **Add existing account** grants access to an existing verified/enabled account without changing its password or profile. Receptionists manage contacts/bookings; staff have read access; administrators manage business settings and directories. Only owners manage login access. Create a separate team profile and link the account when the person should be bookable for appointments.

Business owners/administrators can upload, replace or remove a business logo. The backend accepts JPEG, PNG and WebP up to 2 MB and 4096 × 4096 pixels. Files have generated names in private application storage. Authorized workspace members or platform administrators can read them through the authenticated image endpoint; no storage symlink is needed. Replacing/removing a logo removes the old file. Production PHP/Nginx limits allow the multipart request. Logos appear in the business sidebar and settings summary.

Motion uses `LazyMotion` with a dynamically imported `domAnimation` feature bundle and lightweight `m` components. Route, dialog and sidebar interactions respect reduced-motion preferences. Pages are loaded with React lazy routes.

## API additions

All paths below are relative to `/api/v1`.

| Endpoint | Purpose |
| --- | --- |
| `GET /platform/overview` | Counts and 30-day page aggregates |
| `GET, POST /platform/businesses` | Search/list and create businesses |
| `PATCH, DELETE /platform/businesses/{id}` | Update/suspend or delete business |
| `GET, POST /platform/users` | Search/list and create accounts |
| `PATCH, DELETE /platform/users/{id}` | Update/disable or delete account |
| `GET /platform/activity` | Paginated write activity |
| `GET /platform/content?locale=en` | Drafts and allowed CMS keys |
| `PUT, DELETE /platform/content/{key}` | Save/publish or restore default text |
| `GET /public/content?locale=en` | Published text only |
| `POST /public/page-views` | Increment known-page aggregate |
| `POST, DELETE /business/logo` | Upload/remove active business logo |
| `POST /memberships/accounts` | Owner creates a new account and business membership |
| `GET /businesses/{id}/logo` | Authenticated image response |

Platform lists use 20 records per page with camel-case pagination metadata. CMS writes accept `locale`, `value` and boolean `publish`; deleting an override accepts `locale`. Business/user deletion requires a `confirmation` value matching the business name/account email. Logo writes use the existing `X-Business-ID`, authentication and CSRF controls; upload uses multipart field `logo`.
- Account settings: `/platform/account` provides personal profile and password changes, including Set password for Google-only accounts. The same account settings are available in the business dashboard under Settings → Account settings. Changing a password keeps this browser signed in and ends other sessions. Mobile navigation opens from the sticky top header.
