# Industry configuration

`Business.industry`, working hours, currency, locale, time zone and appointment settings belong to the tenant. Shared components use neutral `Customer`, `StaffMember`, `Service` and `Appointment` models.

`src/config/industries.ts` maps a business category to:

- Translation keys for category name, directory terminology and service terminology.
- Enabled navigation IDs from `src/config/navigation.ts`.
- Configurable service-field visibility.
- Optional staff assignments and customer notes.
- Business-specific empty states and onboarding guidance.
- Default slot interval, unassigned booking policy and confirmation preference.

| Category | Contact directory | Staff directory |
| --- | --- | --- |
| Salon | Customers | Stylists |
| Clinic | Patients | Practitioners |
| Education | Students | Instructors |
| Consulting | Clients | Consultants |
| Other | Customers | Staff |

Five independent demo tenants exercise these configurations. Switching the active business derives its configuration anew, remounts forms and clears query state. It does not modify the other businesses. Settings edits update only the chosen tenant; industry changes alter labels and capabilities, while existing service and contact data stays intact. Defaults are used when creating fixture businesses; an existing tenant's appointment preferences are not silently overwritten when it changes category.

## Add an industry

1. Extend the `Industry` union in `src/types/domain.ts` and business form schema.
2. Add its `IndustryConfiguration` entry; reuse shared workflows and select navigation/features/fields deliberately.
3. Add every terminology, guidance and empty-state key to both locale JSON files. Run `npm run i18n:check`.
4. Optionally add a demonstration tenant and realistic fixture services.
5. Test booking, terminology, business switching and both layout directions. Agree the industry enum and tenant settings with Laravel.

Configurations must not introduce specialized fields into neutral shared components. An extension should use a typed optional feature boundary rather than duplicating pages. If staff assignment is disabled, configure `allowUnassigned: true` so its bookings remain valid.

Clinic support is limited to scheduling and basic contact details. Contact notes are disabled for clinics and the guidance asks users not to enter medical information. There are no records, diagnoses, prescriptions, insurance workflows or healthcare regulatory claims.
