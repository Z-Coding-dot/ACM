# Appointment & Customer Manager

A React + strict TypeScript frontend built from `Skills/Frontend.md`. Carbon-informed design, five tenant-specific industry configurations, English and Dari RTL, connected booking/customer/team workflows, and a PWA shell. Backend development is deliberately separate.

## Run locally

Requires Node 22.12+ (verified on Node 22.13). On Windows PowerShell use `npm.cmd` if script execution policy blocks `npm.ps1`.

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite and select **Explore demo workspace**, or sign in with `demo@acm.example` / `Demo1234!`. Demo authentication and data live in memory and reset on reload. Switch between five sample tenants using the sidebar selector or mobile More menu.

```sh
npm run typecheck
npm run lint
npm run i18n:check
npm test
npx playwright install chromium --only-shell
npm run test:e2e
npm run build
npm run build:demo
npm run test:pwa
```

The essential browser suite uses port 5174. `npm run build` produces the live API build. `npm run build:demo` is the explicit standalone demonstration build; use `npm run preview -- --port 4174` afterward. Production authentication is never inferred from localStorage.

## Architecture

- `src/app`: router, providers and authenticated workspace shell.
- `src/components`: reusable UI, modal sheets, navigation, language menu and PWA controls.
- `src/features`: appointments, calendar, contacts, services, team, settings and auth.
- `src/config`: navigation, currencies and tenant-specific industry configuration.
- `src/services`: API interfaces, centralized HTTP/error handling, independent resource services and development mock implementation.
- `src/i18n/locales`: exactly English and Dari. The translation check also detects unlocalized JSX text and literal accessible labels.
- `e2e`: complete booking/contact flows, routes, industry switching, offline behavior and the eight required widths in both directions.

Documentation: [design decisions](docs/DESIGN_SYSTEM.md), [Laravel contract](docs/API_INTEGRATION.md), [industry extension guide](docs/INDUSTRY_CONFIGURATION.md), [verification report](docs/VERIFICATION.md).

Remaining release work includes Laravel integration, native-speaker Dari review, permission/session handling agreed with Laravel, and real Safari/iOS and assistive-technology QA. See the verification report for checks actually run. Installation in production requires HTTPS; appointment mutations require connectivity.
