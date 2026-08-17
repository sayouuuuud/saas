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
