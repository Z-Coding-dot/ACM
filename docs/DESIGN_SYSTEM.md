# Design system

Selected: IBM Carbon, applied as a documented design reference through shared React components and Tailwind CSS. The implementation is a Carbon-informed product design, not the official Carbon React component library and not a claim of Carbon certification.

## Selection and research

Reviewed on 12 October 2026:

- [Awesome Design Systems](https://github.com/alexpate/awesome-design-systems), which lists IBM Carbon with components and guidance.
- [Carbon React implementation](https://www.carbondesignsystem.com/getting-started/developing/carbon-core/react): the official `@carbon/react` package includes components, styles, and icons.
- [Carbon accessibility foundations](https://www.carbondesignsystem.com/building-blocks/foundations/accessibility/overview).
- [Carbon forms](https://www.carbondesignsystem.com/building-blocks/core/patterns/forms) and [form specifications](https://www.carbondesignsystem.com/building-blocks/core/components/form/specifications).

Carbon suits structured business workflows: compact, labeled forms; practical data tables; clear feedback; restrained surfaces; and keyboard-first interactions. Reproducing its principles lets this brief retain Tailwind, Lucide, a custom two-language menu, business terminology, and full logical-property RTL styling without bringing in a second Sass/token/icon system. No other UI design system is used.

## Product decisions

- Light canvas and white surfaces; forest green primary; semantic amber, green, blue-gray and red status colors. Every status also has text.
- Inter for English and self-hosted Vazirmatn for Dari. Fontsource assets are bundled locally; no font CDN requests.
- A 4px spacing scale, 44px primary targets, small consistent radii, borders for grouping, and shadows only for overlays.
- Top-aligned labels, inline translated errors linked to inputs, semantic tables, stacked records on mobile, native modal focus containment, confirmation before cancellation.
- Persistent desktop sidebar, compact optional sidebar state, business context in the header; bottom navigation and More on mobile.
- Business time-zone calendar arithmetic; day/week visual views with a list alternative. Availability is checked again when submitting a booking.
- Short language-menu animation; reduced-motion support. No decorative charts or invented business metrics.

All tokens are in `src/styles.css`. Shared controls are in `src/components/ui/`. Navigation is in `src/config/navigation.ts`. Industry configuration determines display labels.

## Verification and limits

Automated responsive checks cover the eight required widths in English and Dari. Browser workflow tests cover modal actions, routes, forms, calendar and language direction. Screenshots captured by the responsive test are under `docs/screenshots/` and are visually reviewed separately.

Native-speaker Dari review, real assistive-technology testing, and Safari/iOS device testing remain release requirements. Carbon principles and automated checks alone do not establish accessibility conformance.
