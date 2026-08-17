# Centralia specification compliance status — 2026-08-17

Centralia is implemented as an independent SaaS product. Its owned domain includes teacher identity, workspaces, plans, subscriptions, invoices, SaaS usage and reports, LMS-link references, support, roles, notifications, security, settings, and audit data. The application does not create, provision, run, copy, or directly read or modify an LMS database. LMS information is limited to teacher-supplied link metadata and explicitly bounded reachability operations.

## Completed public and policy surfaces

The required public discovery routes are now dedicated Next.js pages: `/features`, `/how-it-works`, `/pricing`, `/demo`, and `/contact`. The legal routes `/terms`, `/privacy`, `/refund-policy`, and `/acceptable-use` are also dedicated pages, linked from the landing footer, listed in the sitemap, and covered by the public discovery smoke suite. Robots rules exclude private and operational routes from indexing.

## Completed account and administration surfaces

The required account surfaces are available through dedicated routes: `/app/profile`, `/app/lms-connection`, `/app/subscription`, `/app/usage`, `/app/reports`, `/app/notifications`, `/app/security`, and `/app/settings`. Team management remains available through the authenticated dashboard workspace surface. The settings page uses role-gated workspace editing so ordinary members can update their own profile without attempting an unauthorized workspace mutation.

The administration surface includes `/admin` and bounded staff routes for `/admin/teachers`, `/admin/plans`, `/admin/subscriptions`, `/admin/billing`, and `/admin/lms-links`. These routes use SaaS-owned projections, require the existing staff guard, and do not expose LMS operational data.

## Contract and safety evidence

Required billing truth is preserved: payment webhook confirmation remains the source of truth, and subscription activation is SaaS-only. Link-only LMS mode stores URL, display name, status, and optional reachability metadata; reachability is not presented as full LMS health. Usage and reports label SaaS-owned source and freshness, while unsupported educational metrics remain explicitly unavailable. API responses are protected by global and route-local no-store policies, and authenticated client reads use `cache: 'no-store'`.

The complete regression matrix currently passes a 52-route production build, API smoke, public/policy discovery, degraded plans behavior, security, authentication, edge cases, tenant isolation, subscription lifecycle, account routes, admin guards, production configuration, final-window status, safe error-boundary, LMS-independence, collection-bounds, and dependency-audit checks.

## Residual production boundary

The canonical Vercel deployment has historically returned a controlled degraded `/api/plans` response when its configured PostgreSQL endpoint is unavailable. This is intentional fail-closed behavior: HTTP 200 with an empty catalog, `degraded: true`, `retry-after: 60`, `x-centralia-degraded`, and `cache-control: no-store`. Restoring the live catalog requires valid production database connectivity and must not involve an LMS database.

Vercel propagation is asynchronous. The latest observed production deployment before the most recent account-surface commits was associated with the reports commit, while the current GitHub branch contains the subsequent account and settings commits. Final verification must therefore check the canonical deployment’s commit association and route responses after the platform has built the latest pushed revision.
