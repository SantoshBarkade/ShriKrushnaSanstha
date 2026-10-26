# PERMANENT PROJECT RULE — PRESERVE EVERY EXISTING PAGE CONNECTION

This rule applies to the entire Shrikrushna Sanstha website, every page, every component, and all future UI/UX improvements.

## Core requirement

The website was already functionally connected before the visual redesign work. The objective is to improve the visual experience without breaking, replacing, bypassing, or weakening any existing functionality or integration.

For EVERY page, preserve its original working:
- PHP REST API requests and response handling.
- MySQL-backed content and existing data relationships.
- SansthaContext and existing application state.
- Admin CMS content synchronization and publishing behavior.
- Existing form submissions, validation, loading states, success/error messages, and uploads.
- Authentication, authorization, session handling, and protected routes.
- Navigation, route parameters, language switching, and page-to-page links.
- Contact details, officials, reports, initiatives, schemes, and other existing data bindings.
- Existing security restrictions and environment configuration.

## Rules for every future page redesign

1. Inspect the existing page and its dependencies before changing its UI.
2. Identify and document the existing data sources, context properties, API calls, event handlers, and navigation behavior.
3. Prefer changing presentation, layout, CSS, animations, and responsive styling only.
4. Reuse existing live application state and backend data. Never replace live content with mock arrays, invented facts, hardcoded counts, or disconnected demo content.
5. Do not rename or remove existing props, state fields, functions, API parameters, routes, or event handlers unless explicitly approved.
6. Do not change PHP, SQL, database records, API contracts, authentication, environment files, Vite security configuration, or dependencies as part of a frontend redesign.
7. Never claim that a connection is preserved based only on a successful build or passing unit tests.
8. Verify the actual page in the browser, inspect network requests, and test its existing interactions before accepting the redesign.
9. Test the relevant CMS editing and publishing flow when possible, without modifying production data or performing destructive operations.
10. Check Marathi and English where supported, plus desktop, tablet, and mobile layouts.
11. If an existing integration is broken, do not hide the problem with fallback data. Report the exact issue and stop if fixing it would require backend or database changes.
12. If a frontend-only defect is found, make the smallest safe correction and rerun the relevant checks.
13. Keep a clear list of files changed and distinguish verified results from assumptions.

## Acceptance criteria for every page

A redesigned page is acceptable only when:
- The new UI/UX renders correctly.
- The page still consumes the same existing live data sources.
- Existing navigation and user interactions still work.
- CMS-managed content remains dynamic and synchronized.
- No unrelated page or integration has regressed.
- Browser, network, responsive, test, and build results are reported honestly.

Do not redesign unrelated pages while auditing the current page. Apply this permanent rule whenever another page is selected for work.
