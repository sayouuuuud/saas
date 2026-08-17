# Browser QA — Dashboard

- Opened `http://localhost:3000/dashboard` at 2026-08-17 09:03 UTC.
- Arabic RTL layout rendered with sidebar, metrics, activity chart, LMS-link panel, and SaaS-only isolation note.
- Dashboard without a browser session correctly rendered the unauthenticated empty state rather than exposing account data.
- Clicking «إضافة رابط» opened the inline form with required platform name and HTTPS URL fields, save, and cancel controls.
- The page visually preserved the responsive card layout and did not show a runtime error.

## Billing QA

Opened `/billing` and verified that the live plan catalog loads from `/api/plans`, the page renders Growth pricing, the payment-reference disclaimer, and an empty invoice state without fabricating invoices. Clicking «تغيير الباقة» expanded the monthly/yearly controls and displayed Starter, Growth, and Academy cards. The billing surface explicitly warns that local mock checkout must not be used in production.

## Support QA

Opened `/support` and verified the Arabic support layout, request category selector, subject field, detailed description field, safety note, FAQ links, and empty ticket history. A non-sensitive sample subject and description were accepted by the browser form without layout or runtime errors. API-level authenticated submission is covered by `scripts/api-smoke.sh`.

## Extended route verification — 2026-08-17

- `/features` rendered the Arabic public page with navigation, feature cards, CTA links, trust strip, and footer.
- `/app/overview` correctly returned the protected signed-out state and did not expose workspace metrics.
- Visual inspection showed the new route family reuses the existing RTL palette, orange accent, dark CTA, and responsive card layout.

## Account-security verification — 2026-08-17

The `/forgot-password` route rendered a real email recovery form backed by the privacy-preserving recovery API. The `/reset-password` route rendered token and new-password inputs backed by the reset API. Both routes displayed the Arabic RTL layout, loading-capable action button, and navigation to login and support without runtime errors.
