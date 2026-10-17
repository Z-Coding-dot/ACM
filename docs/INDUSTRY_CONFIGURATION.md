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

Five isolated test tenants exercise these configurations through the real API; production businesses are created by verified users. Switching the active business derives its configuration anew, remounts forms and clears query state. It does not modify the other businesses. Settings edits update only the chosen tenant; industry changes alter labels and capabilities, while existing service and contact data stays intact. Defaults are used during onboarding and for test fixtures; an existing tenant's appointment preferences are not silently overwritten when it changes category.

## Add an industry

1. Extend the `Industry` union in `src/types/domain.ts` and business form schema.
2. Add its `IndustryConfiguration` entry; reuse shared workflows and select navigation/features/fields deliberately.
3. Add every terminology, guidance and empty-state key to both locale JSON files. Run `npm run i18n:check`.
4. Update the Laravel industry enum and validation; optionally add an isolated test fixture.
5. Test booking, terminology, business switching and both layout directions. Verify the Laravel industry enum, validation and tenant settings.

Configurations must not introduce specialized fields into neutral shared components. An extension should use a typed optional feature boundary rather than duplicating pages. If staff assignment is disabled, configure `allowUnassigned: true` so its bookings remain valid.

Clinic support is limited to scheduling and basic contact details. Contact notes are disabled for clinics and the guidance asks users not to enter medical information. There are no records, diagnoses, prescriptions, insurance workflows or healthcare regulatory claims.

## Verification and limitations (15 October 2026)

Playwright exercises salon, clinic and education through contact creation, complete service/staff/time booking, appointment history and calendar records, then checks all three categories' English and Dari navigation terminology. Tenant switching also verifies saved business names survive switching away and back. MySQL backend tests verify shared booking validation, conflicts, hours, tenant isolation and concurrent writes. The five categories share page implementations rather than duplicated workflows.

All current categories enable the same main navigation; clinic disables contact notes and education uses session terminology. The layer supports additional field/navigation/feature choices, but this phase does not provide separate specialist workflows or an industry configuration admin editor. Consulting and other are configured but were not subjected to the same full browser workflow matrix. Business preferences are separate from category defaults, and the backend validates membership and configuration values. Native-speaker Dari terminology review remains required.
