# Design system

Selected: IBM Carbon, applied as a documented design reference through shared React components and Tailwind CSS. The implementation is a Carbon-informed product design, not the official Carbon React component library and not a claim of Carbon certification.

## Selection and research

Selected on 12 October 2026 and reviewed again during the 13 October frontend audit:

- [Awesome Design Systems](https://github.com/alexpate/awesome-design-systems), which lists IBM Carbon with components and guidance.
- [Carbon React implementation](https://www.carbondesignsystem.com/getting-started/developing/carbon-core/react): the official `@carbon/react` package includes components, styles, and icons.
- [Carbon accessibility foundations](https://www.carbondesignsystem.com/building-blocks/foundations/accessibility/overview).
- [Carbon forms](https://www.carbondesignsystem.com/building-blocks/core/patterns/forms) and [form specifications](https://www.carbondesignsystem.com/building-blocks/core/components/form/specifications).

Carbon suits structured business workflows: compact, labeled forms; practical data tables; clear feedback; restrained surfaces; and keyboard-first interactions. Reproducing its principles lets this brief retain Tailwind, Lucide, a custom two-language menu, business terminology, and full logical-property RTL styling without bringing in a second Sass/token/icon system. No other UI design system is used.

## Product decisions

- Light canvas and white surfaces; forest green primary; semantic amber, green, blue-gray and red status colors. Every status also has text.
- Inter for English and self-hosted Vazirmatn for Dari, with Inter as the Latin fallback in the Dari stack. Fontsource assets are bundled locally; no font CDN requests. Vazirmatn covers the Dari text rendered in the audit; native-speaker typography/wording review remains necessary.
- A 4px spacing scale, 44px primary targets, small consistent radii, borders for grouping, and shadows only for overlays.
- Top-aligned labels, inline translated errors linked to inputs (including both working-hour controls), semantic tables, stacked records on mobile, native modal focus containment and opener-focus restoration, confirmation before cancellation.
- Persistent desktop sidebar, compact optional sidebar state, business context in the header; mobile navigation opens from the sticky top header.
- Shared native dialogs use a visible header/close control, an independently scrolling body, safe-area spacing and visual-viewport sizing when a keyboard appears. Mobile dialogs open near the top; desktop dialogs remain centered. Form actions stay visible while long content scrolls, and the account dialog pins sign-out in a separate footer. Opening a dialog locks background scrolling and closing restores it and the opener's focus. Inputs use at least 16px text on mobile to avoid iOS focus zoom. Working-hours break controls wrap within narrow dialogs.
- Business time-zone calendar arithmetic; day/week visual views with a list alternative that preserves the selected range. A 44px booking rail prevents event cards from obscuring slot links. Compact grid cards show contact/time; complete service, staff and status appear in their accessible name, title, list view and detail route. Availability is checked again when submitting a booking; list/mobile views expose available-time links.
- Short language-menu animation; reduced-motion support. No decorative charts or invented business metrics.

All tokens are in `src/styles.css`. Shared controls are in `src/components/ui/`. Navigation is in `src/config/navigation.ts`. Industry configuration determines display labels.

## Verification and limits

Automated responsive checks cover the eight required widths in English and Dari. Browser workflow tests cover modal actions, routes, forms, calendar, focus restoration, reduced motion and language direction. Sixteen screenshots captured by the responsive test are under `docs/screenshots/` and are visually reviewed separately.

The 13 October audit checks 68 rendered route/overlay states with axe WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tags. It waits for menus to settle before contrast measurement and disables no rules. Text/token contrast checks have a minimum ratio of 4.83:1; the control-boundary token measures 3.50:1 on white. Keyboard focus uses a visible 2px brand outline. Surface, navigation, inactive-state and control colors are centralized in CSS tokens. See [verification evidence and Lighthouse scope](VERIFICATION.md).

Native-speaker Dari review, real assistive-technology testing, and Safari/iOS device testing remain release requirements. Carbon principles and automated checks alone do not establish accessibility conformance.

## Public homepage

The public `/` and `/about` routes reuse the existing brand, button, language-switcher, status, font and color tokens. Marketing typography has a larger hierarchy, measured section spacing and defined feature/business card surfaces. Styles are scoped to `src/features/public/public.css` and loaded with public route chunks. The authenticated application keeps its existing visual tokens.

The product preview is a read-only semantic calendar table and contact list, composed in React/CSS with the shared status badge. It uses translated illustrative records, not private workspace data, and is explicitly labeled as a sample. No stock imagery, testimonials, customer metrics or performance promises were added. All navigation/CTA links have real destinations. Public information describes current frontend/demo, account, data and offline limits rather than inventing legal policies or support promises.

Logical properties mirror the page in Dari. Mobile navigation uses an accessible menu on narrow screens. Public anchor navigation focuses its target; initial direct loads preserve the normal first-tab skip link. Focus and reduced-motion styles reuse the application conventions. Page titles, description and Open Graph text update client-side with the selected locale; this Vite SPA does not add server-rendered metadata.

## Brand, motion and authentication refinement

The subsequent refinement preserves the user's original `public/brand/ACM_LOGO.png` artwork: an A, appointment calendar/check and customer symbol. The background-free derivative is `public/brand/acm-logo-transparent.png`. `scripts/generate-icons.mjs` trims transparent margins and exports a lightweight UI WebP plus transparent favicon/touch/app PNGs; the maskable variant retains an opaque padded canvas. Source PNGs are excluded from shell precaching. Public navbar/footer are logo-only; auth and dashboard retain their compact wordmarks with an 8px gap. The public brand/home link retains its translated accessible name. The footer uses a 44px icon link for Back to top and has no brand download link. The PWA brand name is Appointment & Customer Management and its start URL is `/`.

Motion uses the already-installed Framer Motion: zero-bounce 350ms springs, short text-group reveals, card hover lifts, button press feedback, page transitions and modal entry. Text remains visible while moving; glyphs/fonts are not distorted or hidden awaiting scroll. Native smooth anchor scrolling remains interruptible. Reduced motion removes displacement/hover effects and uses instant scrolling. References: [Motion scroll animation](https://motion.dev/docs/react-scroll-animations), [Motion reduced-motion configuration](https://motion.dev/docs/react-motion-config), and the local apple-design skill's motion guidance. The established colors and self-hosted fonts are retained.

Feature, business, setup and product-information cards now have defined surfaces, icon tiles, useful capability/terminology details and a shared radius/shadow. The footer has product/resource/workspace columns and a working `/about#data` link. Mobile public navigation uses the shared accessible native dialog, Escape/opener focus and real destinations. Signed-in headers show the user's name and dashboard action.

Auth pages use a single centered form, adapt to narrow screens, and add password visibility, remember preference and Google entry controls. Back to homepage includes a directional arrow that mirrors in Dari. Self-hosted Vazirmatn applies through the shared font token to all Dari headings, forms and controls. Google artwork is downloaded from the [official branding page](https://developers.google.com/identity/branding-guidelines); no Google SDK or tracking script is loaded. The button follows the application's font conventions and is not a claim of provider/app verification. OAuth and session duration remain backend responsibilities, as documented in the API contract.
