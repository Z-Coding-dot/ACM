# Full Backend Implementation Prompt: Appointment and Customer Manager

You are the senior Laravel backend engineer responsible for turning my existing Appointment and Customer Manager frontend into a fully functional, production-ready web application.

Your job is to **inspect the existing project, implement the real Laravel backend, connect every frontend workflow to the backend, remove demo functionality, and verify the entire application**.

Do not just provide recommendations or a plan. Start inspecting the repository and implement the work step by step.

## 1. Inspect the Existing Project First

Before changing code, inspect the entire repository.

The project currently has an existing frontend built with React, TypeScript, Vite, and Tailwind CSS. It includes a Carbon-informed design system, English and Dari translations, RTL support, public authentication pages, a public landing page, and protected application pages.

Existing routes include:

- Public: `/`, `/login`, `/signup`, `/forgot-password`, `/offline`
- Protected: `/app/overview`
- Calendar and appointments: `/app/calendar`, `/app/appointments`, `/app/appointments/new`, `/app/appointments/:id`
- Customers: `/app/customers`, `/app/customers/new`, `/app/customers/:id`
- Management: `/app/services`, `/app/staff`, `/app/settings`

The repository structure may contain `frontend/` and `backend/` folders. Inspect the actual files and identify the correct locations before creating or modifying anything.

Your initial tasks:

1. Identify the existing frontend framework, routes, API abstractions, authentication adapters, mock data, and tests.
2. Inspect whether Laravel is already initialized inside the backend directory.
3. Identify existing database configuration, migrations, models, middleware, and API routes.
4. Inspect the frontend's current data models and workflows so the backend matches the actual UI.
5. Identify every demo button, mock authentication flow, fake API response, fixture, seeded demonstration record, and local-only persistence mechanism.
6. Write a short implementation plan based on the actual repository.

Do not replace working frontend components or redesign the UI. Preserve the existing design system and user experience.

If the Laravel backend is not initialized, create it in the correct backend directory. Do not create a second nested backend project accidentally.

## 2. Required Technology Stack

Use the following technologies unless the existing repository has a justified, documented constraint.

- Backend: Laravel, using the current stable release compatible with the installed PHP version.
- Authentication: Laravel Sanctum for first-party SPA authentication.
- Google authentication: Laravel Socialite with the Google provider.
- Database: MySQL.
- API: versioned REST API, beginning with `/api/v1`.
- Frontend: preserve the existing React, TypeScript, Vite, and Tailwind implementation.
- Validation: Laravel Form Requests.
- Authorization: Laravel Policies, Gates, and explicit business-level permissions.
- Automated tests: PHPUnit or Pest, following the existing backend setup.
- API documentation: document endpoints, request payloads, responses, and authentication requirements.

Use compatible, maintained package versions. Do not upgrade unrelated dependencies without a clear reason.

## 3. Phase One: Make Login and Signup Work

**Start implementation with the existing login and signup pages.** Do not begin with the calendar or dashboard while authentication is still simulated.

### Email and password signup

Implement real account registration with:

- Name.
- Email address.
- Password and password confirmation.
- Appropriate validation and useful error messages.
- Unique email enforcement.
- Secure password hashing.
- Account creation in MySQL.
- Authenticated session creation.
- Email verification support, with a clear configuration for development and production.
- Protection against mass assignment and unauthorized privilege assignment.

The frontend should display actual server validation errors and show loading, success, and failure states.

Do not automatically create an unverified business workspace without following a clearly defined onboarding process.

### Email and password login

Implement:

- Authentication using real stored credentials.
- Laravel Sanctum session authentication for the first-party SPA.
- CSRF initialization and verification.
- Secure logout and session invalidation.
- Rate limiting for login attempts.
- Generic authentication failure messages that do not reveal whether an email exists.
- Handling of expired sessions and unauthenticated API requests.
- A `/me` or equivalent endpoint returning the current authenticated user's permitted profile and workspace context.

Do not store authentication tokens in localStorage when cookie-based Sanctum authentication is being used.

### Password reset

Implement:

- Forgot-password request.
- Secure, time-limited password reset links.
- Password reset validation.
- Reset token invalidation after use.
- Rate limiting.
- Email delivery through configurable Laravel mail settings.

If SMTP credentials are not available, document the missing configuration and provide a local development mail setup. Do not pretend emails have been sent when they have not.

### Frontend integration

Connect the existing `/login`, `/signup`, and `/forgot-password` pages to the real backend.

Remove demo login credentials, fake successful authentication, and mock session creation.

After successful login:

- Fetch the real authenticated user.
- Resolve the user's authorized workspace.
- Redirect to the intended safe destination or the correct application overview.
- Preserve existing protected-route behavior.

After logout, invalidate the session and clear private frontend state and cached customer, appointment, and business data.

Unauthenticated users must not access protected API endpoints even if they manually enter an application URL.

## 4. Phase Two: Implement Google OAuth Properly

The frontend already contains a **Continue with Google** button. Make it functional through Laravel.

Use Laravel Socialite and the Google OAuth provider.

### Required flow

1. The user clicks Continue with Google on `/login` or `/signup`.
2. The browser navigates to the Laravel Google OAuth initiation endpoint.
3. Laravel redirects the user to Google.
4. Google authenticates the user and redirects to the registered Laravel callback URL.
5. Laravel validates the OAuth response and retrieves the user's verified identity information.
6. Laravel finds or creates the appropriate user account according to the account-linking rules.
7. Laravel establishes the application's normal authenticated session.
8. The user is redirected to the appropriate frontend route.

Support both login and signup through the same secure OAuth flow.

### Security requirements

- Request only the Google identity scopes required by the application.
- Verify the provider identity and rely on Google's verified-email information where available.
- Use the provider's stable account identifier, not email alone, as the external identity key.
- Store external identities in a suitable database table or equivalent model.
- Prevent duplicate Google identities from being linked to multiple local users.
- Never silently link accounts solely because email addresses match without a secure linking policy.
- Handle denied consent, invalid callbacks, expired state, duplicate accounts, and provider errors.
- Protect the OAuth flow against CSRF and login-CSRF attacks.
- Validate redirect destinations and prevent open redirects.
- Regenerate the session identifier when authentication succeeds.
- Apply the same workspace membership and authorization checks as ordinary login.
- Do not expose provider tokens, client secrets, or sensitive OAuth errors to the browser.

### Environment configuration

Create documented environment variable placeholders for:

- Google client ID.
- Google client secret.
- Google redirect URL.
- Frontend application URL.
- Laravel application URL.
- Sanctum stateful domains.
- Session cookie settings.
- CORS allowed origins.

Use the official Google Cloud OAuth client configuration and ensure the callback URL matches exactly.

Never hardcode OAuth secrets in PHP files, JavaScript, committed environment files, logs, or documentation. Commit only safe placeholders in `.env.example`.

The actual Google client secret must be supplied securely through server-side environment configuration. Do not ask me to paste it into source code or prompts.

Document the additional Google Cloud consent-screen configuration, test-user restrictions, production publishing requirements, and authorized redirect URLs.

### Google OAuth acceptance tests

Verify:

- Existing Google user can log in.
- New Google user can register.
- Existing local accounts are not accidentally duplicated or hijacked.
- Denied consent produces a useful error.
- Invalid or expired OAuth state is rejected.
- The session is authenticated after a valid callback.
- Unauthenticated users cannot access protected resources.
- Logout ends the session.

If real Google credentials or external connectivity are unavailable in the development environment, use mocked provider responses in automated tests and clearly report that live Google login still requires external configuration and verification.

## 5. Phase Three: Multi-Tenant Business Architecture

This product must support multiple independent businesses using the same application.

A business might be a salon, clinic, tutoring center, consulting office, or another appointment-based service provider.

Do not build separate applications or duplicate backend logic for each industry.

### Core models

Create suitable Laravel models, migrations, relationships, indexes, and factories for the following concepts:

- User
- Business or Workspace
- BusinessMembership
- Customer or Contact
- Service
- StaffMember
- Appointment
- BusinessHours
- BusinessSettings
- ExternalIdentity for Google OAuth, if needed
- Password reset and session-related tables as required

Add roles and permissions using a maintainable approach appropriate to the application's existing requirements.

### Multi-tenancy requirements

A user may eventually belong to more than one business.

Support a membership model with business-level roles, such as:

- Owner
- Administrator
- Staff member
- Receptionist or booking manager, where appropriate

The exact permission matrix must be documented and enforced by the backend.

Every business-owned record must be scoped to the correct business.

For every API request:

- Determine the active business from a validated membership or authorized context.
- Confirm the user has permission to access that business.
- Scope database queries to that business.
- Reject attempts to access records belonging to another business.
- Never trust a client-provided business ID without checking membership and permissions.

Implement automated tests that prove one business cannot read, update, delete, or book records belonging to another business.

Do not rely on hiding buttons in the frontend as a security control.

### Business onboarding

After registration, provide a real onboarding workflow that allows a user to:

1. Create a business.
2. Select its industry.
3. Set the business name, timezone, locale, and currency.
4. Configure working hours.
5. Add services.
6. Add staff.
7. Start creating appointments.

A user with an existing authorized workspace should be able to select it rather than creating duplicate businesses.

Do not require all settings to be completed before allowing users to access the application. Provide sensible incomplete-onboarding states.

## 6. Phase Four: Industry Configuration

The application must remain configurable rather than hardcoded to one industry.

Implement shared models and industry configuration for at least:

- Salon and barbershop.
- Clinic or health center.
- Education or tutoring.
- Consulting and other appointment-based businesses.

Use industry-specific terminology and UI labels where appropriate.

Examples:

- Salon: Customers, Stylists, Services.
- Clinic: Patients, Practitioners, Appointments.
- Education: Students, Instructors, Sessions.

Keep the underlying shared scheduling model consistent wherever possible. Use configuration or a documented extension mechanism for industry-specific behavior.

Do not create separate copies of appointment logic for each industry.

For the initial clinic implementation, support scheduling and basic contact information only. Do not build electronic medical records, diagnoses, prescriptions, insurance processing, or other regulated healthcare functionality.

## 7. Phase Five: Customers and Contacts

Implement real customer/contact management.

Required operations:

- List and paginate contacts.
- Search contacts.
- Filter and sort contacts.
- View contact details.
- Create contacts.
- Update contacts.
- Delete or archive contacts according to business rules.
- View appointment history.
- Prevent accidental duplicate records where feasible.
- Validate email addresses, phone numbers, and required fields.
- Support optional fields where the UI permits them.

Follow the existing frontend's terminology and field structure.

Use database pagination for large datasets. Do not load every contact into the browser.

Do not use fake customers or hardcoded demonstration records in production responses.

## 8. Phase Six: Services and Staff

### Services

Implement:

- Create, read, update, and archive services.
- Name and description.
- Duration.
- Price and currency.
- Active/inactive status.
- Business-specific service configuration.
- Appropriate validation.

Store money using a suitable fixed-precision database representation, not floating-point calculations. Do not assume every currency uses the same decimal precision.

### Staff

Implement:

- Staff profiles and contact details.
- Active/inactive status.
- Service assignments.
- Working hours and availability.
- Business membership or staff assignment rules.
- Permission checks for staff-management operations.

Do not assume every staff member must have an application login account. Support staff profiles independently, and link them to user accounts only when needed.

## 9. Phase Seven: Appointments and Calendar

Implement real scheduling and appointment management.

Required functionality:

- Appointment creation.
- Appointment details.
- Appointment updates.
- Appointment cancellation.
- Appointment status changes.
- Customer selection.
- Service selection.
- Staff assignment where applicable.
- Start and end time.
- Calendar range queries.
- Day, week, and month views supported by the frontend.
- Appointment search and filtering.
- Appointment history for a customer.
- Validation against business hours and staff availability.

### Critical booking integrity

Prevent double booking on the server, even when two users attempt to book the same slot simultaneously.

Use database transactions and an appropriate concurrency-control strategy. Depending on the schema, use row locking, unique constraints, or other reliable mechanisms.

The availability check and booking operation must be safe against concurrent requests. A frontend check alone is insufficient.

Account for:

- Service duration.
- Staff working hours.
- Business working hours.
- Existing appointments.
- Appointment status and cancellation.
- Business timezone.
- Daylight-saving transitions where relevant.
- Configured breaks and unavailable periods.

Store appointment timestamps consistently, preferably in UTC, while preserving the business timezone for scheduling and display.

Document how date ranges and timezone conversions work across the API.

Validate every request on the server. Reject impossible dates, invalid durations, unauthorized staff assignments, and appointments outside permitted working hours.

Do not silently overwrite another appointment when a conflict occurs. Return a clear conflict response that the frontend can display.

## 10. Phase Eight: Dashboard and Settings

Connect the overview/dashboard to real database-backed data.

Provide appropriate API endpoints for:

- Today's appointments.
- Upcoming appointments.
- Appointment status summaries.
- Customer totals.
- Recent activity, if supported.
- Relevant business-specific statistics.

All statistics must be calculated from real, authorized records.

Implement business settings for:

- Business profile.
- Industry.
- Timezone.
- Default language.
- Currency.
- Working hours.
- Appointment defaults.
- Relevant scheduling preferences.

Do not hardcode a specific country's currency, timezone, or phone format for every customer.

The frontend currently supports English and Dari. Preserve that language support and do not introduce additional languages without a requirement.

## 11. Phase Nine: Pricing and Subscription Readiness

The public landing page contains a pricing section.

Inspect its actual implementation and align the backend with the published offer once the pricing decision is confirmed.

Do not invent subscription prices or charge customers without explicit configuration and authorization.

For the first release:

- Keep pricing and plan limits configurable.
- Document which features are available under the initial plan.
- Avoid adding a payment gateway unless explicitly approved.
- If billing is deferred, do not display fake payment status or claim that subscriptions are active.
- Make it possible to introduce subscription plans later without redesigning the entire business model.

If the pricing card displays a real monthly price, ensure it corresponds to the actual intended offer and currency.

## 12. Phase Ten: API Contract and Frontend Integration

Inspect the frontend's existing API client and mock adapters.

Create a documented API contract that matches the actual frontend data models. Reuse existing request and response structures when sensible rather than forcing a needless frontend rewrite.

Use consistent response shapes and appropriate HTTP status codes.

Examples of endpoint groups:

- `/api/v1/auth/*`
- `/api/v1/me`
- `/api/v1/businesses/*`
- `/api/v1/customers/*`
- `/api/v1/services/*`
- `/api/v1/staff/*`
- `/api/v1/appointments/*`
- `/api/v1/calendar/*`
- `/api/v1/settings/*`

These are proposed endpoint groups. Adapt exact routes to the actual frontend requirements and document the final contract.

Use proper status codes, including:

- `200` for successful retrieval or updates.
- `201` for resource creation.
- `204` where an operation intentionally returns no content.
- `401` for unauthenticated requests.
- `403` for authenticated users without permission.
- `404` for missing or intentionally inaccessible resources.
- `409` for booking conflicts where appropriate.
- `422` for validation errors.
- `429` for rate limiting.

Ensure the frontend handles expired sessions, validation errors, network failures, server errors, and booking conflicts correctly.

Configure CORS, Sanctum, CSRF, cookies, and frontend/backend origins for local development and production.

Do not use wildcard credentialed CORS. Do not disable CSRF protection merely to make the integration work.

## 13. Phase Eleven: Remove Demo Functionality Completely

Audit the entire frontend and backend for demo behavior.

Remove or replace:

- Demo login buttons and demo credentials.
- Fake successful authentication.
- Hardcoded fake dashboard statistics.
- Mock appointment lists used as live application data.
- Fake customer, service, and staff records returned by production code.
- Simulated Google authentication.
- Local-only persistence presented as server persistence.
- Buttons that look functional but do nothing.
- Placeholder actions that claim success without making a real request.
- Mock fallback behavior that silently hides API failures.

Important distinction: test fixtures, factories, isolated unit-test mocks, and explicitly enabled development seeders are allowed. They must not be used as the production application's data source.

The production application must use the real API and database.

If the backend is unavailable, show a clear error and provide an appropriate retry action. Never silently fall back to fake data.

Preserve intentional UI-only interactions that do not require persistence, but make all data-changing actions perform their actual operations.

Search the entire repository, not just the login page. Report every demo component or data source removed or retained for testing.

## 14. Phase Twelve: Security and Production Readiness

Implement and test:

- Server-side validation for every write operation.
- Authorization policies for all business-owned resources.
- Business-level data isolation.
- CSRF protection.
- Login and password-reset rate limits.
- Secure session configuration.
- Safe OAuth state and callback handling.
- Protection against mass assignment.
- Safe file uploads if the existing product supports them.
- Appropriate database indexes and foreign keys.
- Transactional handling of multi-step operations.
- Safe logging without passwords, OAuth secrets, session IDs, or sensitive tokens.
- Consistent API error handling.
- Production-safe debug settings.
- Environment-based configuration.
- Database backup and restore documentation.

Use least-privilege database credentials and production HTTPS.

Do not add unnecessary packages, overly abstract service layers, or a microservices architecture. This is a maintainable Laravel application, not an invitation to construct a distributed system before the first customer arrives.

## 15. Phase Thirteen: Tests and Verification

Write real automated tests for authentication, authorization, data persistence, scheduling, and API behavior.

At minimum, verify:

**Authentication**
- Valid signup.
- Duplicate email rejection.
- Invalid credentials.
- Successful login.
- Logout and session invalidation.
- Password reset.
- Protected endpoint access.
- Google OAuth callback handling with mocked provider responses.

**Multi-tenancy**
- Users can access only authorized businesses.
- Users cannot access another business's customers, staff, services, appointments, or settings.
- Unauthorized operations are rejected.

**Business operations**
- Customer CRUD.
- Service CRUD.
- Staff management.
- Business onboarding and settings.
- Appointment CRUD and status transitions.

**Scheduling**
- Available appointment creation.
- Rejection of conflicting appointments.
- Concurrent booking conflict protection.
- Working-hour validation.
- Correct timezone handling.
- Cancellation and subsequent availability.

**Frontend integration**
- Signup and login work against Laravel.
- Google login follows the real OAuth flow.
- Protected routes use real authentication.
- Data survives page reloads because it is stored in MySQL.
- Customer, service, staff, calendar, appointment, and settings screens use actual API responses.
- English and Dari continue to work.
- Dari retains correct RTL behavior.
- No production route depends on demo authentication or fixture data.

Run all applicable commands for the actual repository:

- Backend automated tests.
- Database migration checks.
- Frontend typecheck.
- Frontend lint.
- Translation checks.
- Frontend unit tests.
- End-to-end tests.
- Production frontend build.
- Backend production configuration checks.

Do not claim a test passed unless you actually ran it and observed the result. If a command cannot run because of a missing service or credential, report the exact blocker.

## 16. Phase Fourteen: Deployment and Handover

Prepare the backend for deployment on a VPS using Docker.

Inspect the existing deployment files before creating new ones. If Docker configuration already exists, improve and reuse it instead of generating duplicate configurations.

Provide:

- Production-ready Docker configuration where needed.
- Laravel environment variable documentation.
- MySQL service and persistent volume configuration.
- Database migration instructions.
- Application key generation instructions.
- Storage and cache permission handling.
- Queue configuration if queues are used.
- Scheduled task configuration if scheduled jobs are implemented.
- HTTPS and reverse-proxy configuration guidance.
- Secure backup and restore instructions.
- Health-check endpoint or equivalent operational check.
- Deployment, update, and rollback instructions.

Never include real secrets in Dockerfiles, source control, sample environment files, or deployment documentation.

Explain which commands run on the local development machine and which run on the VPS.

## 17. Required Implementation Order

Work in this order and finish each phase before claiming it is complete:

1. Inspect the repository and produce a concise implementation plan.
2. Initialize or verify Laravel and MySQL configuration.
3. Implement real signup, login, logout, session handling, and password reset.
4. Implement Google OAuth using Laravel Socialite.
5. Connect the existing login and signup pages; remove demo authentication.
6. Implement business onboarding, workspace membership, and authorization.
7. Implement customers, services, and staff.
8. Implement appointments, calendar queries, availability checks, and concurrency protection.
9. Implement dashboard statistics and settings.
10. Connect all remaining frontend screens and remove demo data.
11. Implement security hardening and automated tests.
12. Prepare Docker deployment and write handover documentation.

Do not skip ahead while earlier phases are broken. You may identify later requirements during the initial audit, but the implementation must follow this order.

If a major requirement is blocked, complete the independent work that can safely proceed, document the blocker, and do not simulate success.

## 18. Final Report

When implementation is complete, provide:

1. Summary of backend architecture.
2. Files and directories created or modified.
3. Database tables and relationships.
4. API endpoints implemented.
5. Authentication and Google OAuth configuration instructions.
6. Environment variables required.
7. Demo functionality removed.
8. Tests executed, with actual pass/fail results.
9. Known issues and incomplete features.
10. Exact local commands to run the application.
11. Exact Docker deployment steps for the VPS.
12. Any manual actions still required in Google Cloud Console.

Separate completed work from work that remains. Clearly distinguish mocked OAuth tests from successful live Google sign-in.

**Final constraints:** Preserve the completed frontend design, use Laravel and MySQL, support English and Dari, enforce multi-tenant security, eliminate fake production behavior, and never hardcode credentials. Implement real functionality rather than merely generating files that look convincing in a repository.