# Backend implementation

## Initial audit — 14 October 2026

The React/Vite frontend lives at the repository root. There was no Laravel project or deployment configuration. Its API boundary is `src/services/contracts.ts`; resource services already expect `/api/v1`, camelCase resources, Laravel pagination, cookie credentials and a validated `X-Business-ID` tenant context. Development and the explicit demo build currently load `src/services/mock/adapter.ts`. Authentication, business switching, booking, customer directories, staff/service management and settings must be connected to real persistence. Existing uncommitted branding work is preserved.

Installed tools: PHP 8.2.12 with PDO MySQL/SQLite, Composer 2.10.2, XAMPP's MariaDB client, and Docker Desktop. No database server was listening during the initial probe. The backend is being initialized once in `backend/`, using Laravel 12 because Laravel 13 requires PHP 8.3+. Laravel 12 receives security fixes through 24 February 2027; production must use a patched PHP runtime and plan a framework upgrade before that date. See [Laravel support policy](https://laravel.com/docs/12.x/releases).

## Implementation order

1. Initialize Laravel, configure MySQL and session/CSRF/CORS boundaries; verify migrations.
2. Implement signup, login, logout, session profile, verification and password reset with tests.
3. Implement stateful Socialite Google redirects/callbacks and safe account identity rules; mock provider tests until credentials are configured.
4. Connect existing auth forms to Laravel, then implement verified-user business onboarding and membership authorization.
5. Implement tenant-scoped customer/service/staff operations, then transactional scheduling, calendar/availability, dashboard and settings.
6. Remove runtime demo adapters/UI, migrate browser checks to real database workflows, and run all quality checks.
7. Prepare Docker deployment and document operations, backups, updates and remaining external verification.

## Google configuration contract

- Frontend development origin: `http://127.0.0.1:5173` (Vite will use a fixed port with `strictPort`; inspect the startup output).
- Laravel development origin: `http://127.0.0.1:8000`.
- Google initiation route: `GET /auth/google/redirect`.
- Google callback route: `GET /auth/google/callback`.
- Local authorized redirect URI: **`http://127.0.0.1:8000/auth/google/callback`**.
- Public frontend entry setting: `VITE_GOOGLE_AUTH_URL=http://127.0.0.1:8000/auth/google/redirect`.
- Backend-only settings: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL`, `APP_URL`, `SANCTUM_STATEFUL_DOMAINS`, session cookie settings and explicit CORS origins.

The secret belongs only in the backend's ignored environment file or deployment secret store. No real credentials should be pasted into prompts, committed files, Vite variables or browser code. Live Google sign-in remains unverified until external credentials and consent-screen settings are supplied. Production origins/redirect URIs will use the actual HTTPS domains once chosen; do not register placeholder production domains.

This document records implementation progress, not a claim that the backend is complete or deployed.
