# Project: Appointment & Customer Manager

## Role

Act as a senior frontend engineer and product designer. Build a production-quality frontend for a multi-tenant appointment scheduling and customer management SaaS for small service businesses worldwide.

The product is intended for barbershops, salons, tutors, consultants, and other appointment-based businesses.

**This phase is frontend only. Do not implement the backend or database.** The backend will be built separately using Laravel, with MySQL as the database.

Before making changes, inspect the existing repository, package.json, project structure, and available scripts. Reuse working infrastructure where reasonable. Do not overwrite existing work without understanding it.

## 1. Technology stack

Use:
- React
- TypeScript with strict mode
- Vite
- Tailwind CSS
- React Router
- TanStack Query for server-state management
- React Hook Form and Zod for forms and validation
- i18next and react-i18next for localization
- Lucide React for consistent icons
- Framer Motion for restrained, purposeful animation
- Vitest and React Testing Library for frontend tests
- Playwright for essential end-to-end tests

Choose compatible, stable package versions. Do not install unnecessary libraries.

## 2. Design system: mandatory

Reference: https://github.com/alexpate/awesome-design-systems

Before designing, inspect the repository and select one established design system suitable for a professional scheduling and business-management product. Prefer a system with documented interaction patterns, accessibility guidance, consistent typography, spacing, forms, tables, navigation, and feedback components.

Use Carbon Design System as the initial reference candidate. Verify its current documentation and React implementation before deciding whether to adopt its components directly or reproduce its documented principles with the selected stack.

Document the selected system and the reasoning in `docs/DESIGN_SYSTEM.md`.

Do not mix unrelated design systems or copy random components from multiple UI libraries.

### Visual direction

The product must look like professionally designed business software, not a generic AI-generated dashboard.

Use:
- A restrained, light-first visual theme.
- Warm neutral or clean white surfaces.
- Dark, readable text.
- One restrained primary brand color and a consistent semantic color palette.
- Clear hierarchy, disciplined spacing, precise alignment, and consistent component sizing.
- Practical data tables, calendars, compact forms, and useful empty states.
- Subtle borders and shadows only where they improve hierarchy.
- Consistent radii, typography, icon sizing, and interaction states.

Avoid:
- Purple or blue-pink AI gradients.
- Glassmorphism and excessive blur.
- Glowing cards, decorative blobs, oversized headings, and meaningless illustrations.
- Excessive rounded cards and nested containers.
- Fake analytics, decorative charts, arbitrary statistics, and unnecessary animations.
- Emoji as interface icons.

Create reusable design tokens for colors, typography, spacing, radii, shadows, borders, and focus states. Do not scatter arbitrary styling values throughout the application.

## 3. Product structure and navigation

Build a real business application, not a landing page.

Desktop navigation should include:
- Overview
- Calendar
- Appointments
- Customers
- Services
- Staff
- Settings

Use a professional sidebar with an appropriate compact/collapsed state. The header should contain the current page title, business context, language switcher, and account menu.

On mobile, use a compact top header and an accessible bottom navigation bar with the most important destinations. Place secondary destinations in a More menu.

Define navigation in `src/config/navigation.ts`. Every navigation item must have its own meaningful route and page content.

## 4. Required routes and pages

Implement these routes with distinct content:

- `/login`
- `/signup`
- `/forgot-password`
- `/app/overview`
- `/app/calendar`
- `/app/appointments`
- `/app/appointments/new`
- `/app/appointments/:id`
- `/app/customers`
- `/app/customers/new`
- `/app/customers/:id`
- `/app/services`
- `/app/staff`
- `/app/settings`
- `/offline`
- A proper not-found page

### Overview

Show useful operational information:
- Today's appointments.
- Upcoming appointments.
- Appointment status summary.
- Recently added customers.
- Quick actions for booking an appointment and adding a customer.
- A concise daily schedule.

Use realistic, internally consistent demonstration data. Label demo data appropriately. Never imply that fake statistics are real business results.

### Calendar

Build a functional calendar with day and week views, date navigation, and clear appointment status indicators.

Appointments should display their time, service, customer, and assigned staff member when space allows.

Support selecting an available time slot to start creating an appointment. Clicking an existing appointment should open its details.

Include an accessible list-based alternative to the visual calendar for smaller screens and assistive technologies.

Do not build a complex drag-and-drop scheduler unless the basic calendar and booking workflows are already complete.

### Appointments

Provide:
- Search and filters.
- Date-range filtering.
- Status filters.
- Staff filters.
- A responsive appointment list.
- Appointment creation and editing.
- Appointment details.
- Rescheduling and cancellation actions.
- Clear loading, error, empty, and success states.

Use explicit statuses: scheduled, confirmed, completed, cancelled, and no-show.

### Customers

Provide:
- Searchable customer directory.
- Pagination or a sensible loading strategy.
- Add and edit customer forms.
- Customer detail page.
- Contact information.
- Appointment history.
- Relevant notes.
- A clear empty state.

### Services

Allow the user to manage services with:
- Name.
- Description.
- Duration.
- Price.
- Active/inactive status.

### Staff

Provide a staff directory, staff profiles, service assignments, working hours, and active/inactive status.

### Settings

Provide frontend settings interfaces for:
- Business name and contact details.
- Time zone.
- Business working hours.
- Appointment preferences.
- Language.
- Account settings.

These are UI capabilities in this phase. Do not pretend settings are permanently saved to a server.

## 5. Authentication and business isolation

Implement login, signup, and forgot-password screens with validation, loading states, and clear errors.

Use a clean, compact authentication layout consistent with the chosen design system. Do not use a giant stock-photo panel just to fill space.

The UI must be prepared for Laravel authentication. Do not invent a working backend or real authentication responses.

Use a clearly separated development-only mock authentication adapter. Do not use localStorage as proof of authentication or as a substitute for server-side authorization.

Assume every authenticated account belongs to a business workspace. Design the UI around the active business context.

The future Laravel backend must enforce tenant isolation. Frontend filtering is never a security boundary.

## 6. Booking workflow

Implement the following frontend workflow:

1. Select an existing customer or add a new one.
2. Select a service.
3. Select a staff member, where applicable.
4. Select a date and available time.
5. Review the appointment.
6. Submit and display the result.

Validate required fields and provide useful, translated validation messages.

Prevent obviously invalid dates and times in the frontend, but treat the Laravel backend as the ultimate authority for availability and booking conflicts.

Use a confirmation step before destructive actions such as cancellation.

## 7. Frontend architecture and Laravel readiness

Keep the frontend independent of backend implementation details.

Suggested structure:

`src/`
- `app/` - application setup, providers, router
- `components/ui/` - reusable design-system components
- `components/layout/` - sidebar, header, mobile navigation
- `features/appointments/`
- `features/calendar/`
- `features/customers/`
- `features/services/`
- `features/staff/`
- `features/settings/`
- `features/auth/`
- `hooks/`
- `i18n/`
- `lib/`
- `services/`
- `types/`
- `config/`
- `pages/`

Adjust the structure if the existing repository has a better established convention. Avoid redundant abstractions and unnecessary folders.

Create:
- Typed domain models.
- A centralized HTTP client interface prepared for Laravel.
- Separate API service modules for appointments, customers, services, staff, and authentication.
- A development mock adapter implementing the same interfaces.
- Environment-based API configuration using `VITE_API_BASE_URL`.
- Centralized error handling and request-state management.

Components must not directly fetch data or contain backend URLs.

Do not scatter mock arrays throughout components. Keep demo data in dedicated fixtures or mock service modules.

Document the proposed Laravel integration contract in `docs/API_INTEGRATION.md`, including example request and response shapes, pagination, validation errors, authentication assumptions, and tenant context.

Do not create Laravel files, database migrations, or backend business logic in this phase.

## 8. Database-aware frontend models

Design TypeScript types that can map cleanly to future Laravel models:

- Business
- User
- Customer
- StaffMember
- Service
- Appointment
- BusinessHours
- StaffAvailability

Appointments should include the customer, service, staff member where applicable, start/end timestamps, status, notes, and relevant identifiers.

Use ISO 8601 timestamps for API data. Format dates and times according to the active locale and business time zone.

Represent money with an explicit currency code. Do not hardcode dollars throughout the application.

Avoid inventing fields that have no clear product purpose.

## 9. Localization: English and Dari only

Implement exactly two supported locales:

- English: `en`
- Dari (Afghanistan): `fa-AF`

Do not implement Pashto in this project.

Use i18next with organized locale files. All user-visible strings must be translated, including:
- Navigation and page titles.
- Buttons, labels, and placeholders.
- Validation and API error messages.
- Notifications, tooltips, and accessible labels.
- Empty states, loading states, and confirmation dialogs.
- Authentication screens.
- Date, time, and number formatting.
- Document titles and not-found/offline screens.

No hardcoded user-facing strings inside React components.

Create an `npm run i18n:check` script that checks translation-key completeness and reports missing keys. Add suitable linting or static checks to reduce hardcoded strings.

Do not silently fall back to English for missing Dari translations during development.

Dari must use natural Dari phrasing, not transliteration or literal machine translation. Mark the translations as requiring native-speaker review before production.

### Custom language dropdown

Build an accessible custom dropdown, not a native select.

- Globe icon, current language label, and chevron.
- Two options: English and دری.
- Active-state check icon.
- Keyboard navigation with arrows, Enter, and Escape.
- Outside-click dismissal.
- Visible focus states and correct accessible semantics.
- A short fade/scale opening animation.
- A bottom-sheet presentation on mobile where appropriate.
- Correct positioning and alignment in RTL.

### RTL requirements

Switch the entire interface direction to RTL for Dari.

- Use logical CSS properties instead of left/right-specific styling.
- Mirror navigation, side panels, directional icons, and layouts where appropriate.
- Keep numerals, dates, phone numbers, and technical identifiers readable.
- Use a suitable self-hosted Arabic-script font such as Vazirmatn.
- Test Dari text wrapping, forms, calendar layouts, and tables.
- Set the correct `lang` and `dir` attributes.

English must render in LTR.

## 10. Responsive behavior and accessibility

Use a mobile-first approach. Verify layouts at:
- 320px
- 360px
- 390px
- 430px
- 768px
- 1024px
- 1280px
- 1440px

Test both English LTR and Dari RTL.

Requirements:
- No horizontal overflow.
- No clipped text or overlapping controls.
- Touch targets preferably at least 44px.
- Forms become single-column on narrow screens.
- Tables transform into readable stacked records when necessary.
- Filters use a drawer or sheet on mobile.
- Dialogs become mobile-friendly sheets where appropriate.
- Mobile navigation never obscures content.
- Respect safe-area insets.
- Use `100dvh` when viewport-height behavior matters.
- Support keyboard navigation, visible focus, and reduced motion.
- Provide appropriate labels, landmarks, and accessible status announcements.

Use semantic HTML and accessible design-system components. Test color contrast and form error associations.

## 11. PWA support

Prepare the frontend as an installable PWA using `vite-plugin-pwa`.

Include:
- A valid web app manifest.
- Appropriate app name and theme colors.
- 192px and 512px icons, including a maskable icon.
- Service worker registration and update handling.
- A translated offline fallback page.
- An install action where supported.
- iOS installation guidance where appropriate.
- Appropriate caching for static assets.

Do not cache authenticated API responses, private customer data, appointment records, or other user-specific responses in a shared service-worker cache.

Do not claim that appointment creation works offline unless a deliberate offline mutation queue and conflict-resolution strategy have been designed and tested. For this phase, preserve a clear offline state and avoid false success messages.

Document that production installation requires HTTPS.

## 12. Motion and interaction quality

Use restrained motion consistent with a professional business application.

- Short transitions for dropdowns, dialogs, tabs, and page changes.
- Subtle hover and focus feedback.
- No decorative animations that slow down daily work.
- No bouncing, glowing, or perpetual movement.
- Respect `prefers-reduced-motion`.

Prioritize responsive feedback and fast interaction over animation.

Every visible button, link, filter, and menu item must have a meaningful action. Do not leave decorative controls pretending to work.

## 13. Testing and quality checks

Add tests for:
- Navigation routes and active navigation states.
- Login, signup, and forgot-password screen rendering.
- Appointment creation and validation.
- Appointment status changes and cancellation confirmation.
- Customer search and form validation.
- Language switching and RTL direction.
- Translation-key completeness.
- Mobile navigation and responsive behavior.
- Loading, empty, and error states.
- Mock service integration.

Run and fix:
- `tsc --noEmit` or the equivalent TypeScript check.
- ESLint.
- Unit and component tests.
- `npm run i18n:check`.
- Production build.
- Essential Playwright end-to-end tests.

Inspect the actual rendered UI in a browser when browser tooling is available. Verify both LTR and RTL, not just the source code.

Do not claim tests passed unless you actually ran them.

## 14. Implementation process

Work in the following order:

1. Inspect the repository and report its current state.
2. Choose and document the design system.
3. Establish design tokens, typography, routing, and application layout.
4. Implement the main navigation and page shells.
5. Build customers, services, staff, and appointment workflows.
6. Implement the calendar and overview.
7. Add authentication screens and mock service adapters.
8. Implement English/Dari localization and RTL.
9. Add PWA support.
10. Add and run tests, fix defects, and verify the production build.

Do not build every page as a static screenshot. Implement realistic interactions and connected frontend workflows using the mock service layer.

Do not skip the core appointment workflow to spend time polishing secondary pages.

## 15. Definition of done

The frontend phase is complete only when:
- All required routes render distinct, usable pages.
- The main appointment workflow works against the development mock adapter.
- Customers, services, staff, and appointments have consistent frontend models.
- English and Dari translations are complete for implemented UI.
- RTL layouts work correctly.
- The responsive interface has been checked at the specified viewport sizes.
- The frontend is structured for a future Laravel API.
- No fake backend persistence or fabricated success messages remain.
- PWA configuration is valid.
- Automated checks have been run and results reported.
- `docs/DESIGN_SYSTEM.md` and `docs/API_INTEGRATION.md` exist.
- The final report lists completed work, tests actually run, known limitations, and remaining tasks.

Implement the project in the existing repository. Do not merely return a plan or a code sample.

### Multi-Industry Architecture (Mandatory)

Build the frontend as a configurable, multi-industry appointment management platform. Do not hardcode any industry-specific assumptions into shared components or core workflows.

Initially support these business categories:
- Salon / Barbershop
- Clinic / Health Center
- Tutoring / Education
- Consulting / Professional Services
- Other appointment-based businesses

Implement an industry configuration layer that controls:
- Business type and default terminology.
- Service terminology and labels.
- Staff role terminology.
- Enabled navigation items and optional features.
- Configurable service fields and appointment settings.
- Business-specific empty states and onboarding guidance.

Use neutral internal domain names such as `Customer`, `StaffMember`, `Service`, and `Appointment` where appropriate. Industry-specific display labels must come from configuration and localization files, not hardcoded strings in components.

For example:
- A salon may display “Customers” and “Stylists”.
- A clinic may display “Patients” and “Practitioners”.
- A tutoring center may display “Students” and “Instructors”.

Use shared components and workflows wherever possible. Avoid duplicating entire pages for each industry.

Keep the business type and settings associated with the business tenant, not global application state. Different businesses must be able to use different configurations simultaneously.

Design the configuration types and mock data so a new business category can be introduced without rewriting the calendar, customer management, service management, or appointment workflows.

Do not implement electronic medical records, diagnoses, prescriptions, insurance processing, or other regulated healthcare functionality in this phase. The clinic configuration initially supports appointment scheduling and basic contact information only.

Document the configuration architecture and explain how a new industry would be added in `docs/INDUSTRY_CONFIGURATION.md`.