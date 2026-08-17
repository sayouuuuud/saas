# Centralia specification compliance status — 2026-08-17

Centralia is implemented as an independent SaaS product. Its owned domain includes teacher identity, workspaces, plans, subscriptions, invoices, SaaS usage and reports, LMS-link references, support, roles, notifications, security, settings, onboarding, and audit data. The application does not create, provision, run, copy, or directly read or modify an LMS database. LMS information is limited to teacher-supplied link metadata and explicitly bounded reachability operations.

## Completed product surfaces

The public discovery and policy routes are dedicated pages: `/features`, `/how-it-works`, `/pricing`, `/demo`, `/contact`, `/terms`, `/privacy`, `/refund-policy`, and `/acceptable-use`. The public use-case and resource routes now contain specification-aligned guidance for independent teachers, academies, education businesses, billing, invitations, support, link-only LMS references, and incident handling. Robots rules exclude private and operational routes from indexing, while public discovery and resource routes are covered by smoke tests.

The account area includes overview, profile, subscription, usage, reports, team, notifications, security, settings, LMS connection, billing, and support. The team area now supports bounded SaaS workspace invitations with one-time hashed tokens, expiry, revoke, acceptance, role validation, and an authenticated acceptance endpoint. The security area supports encrypted TOTP enrollment, challenge-based login, active-session listing, and revoke-all. The account area also includes safe export, billing profile, payment-method references, coupon-aware local checkout, notification preferences, support conversation actions, and a dedicated `/onboarding` success route after a confirmed local checkout.

## Completed administration surfaces

The staff area includes the dashboard plus teachers, plans, subscriptions, billing, LMS-link references, integrations, usage, reports, support, staff, audit, notifications, coupons, webhooks, and settings. Detail routes exist for teachers, invoices, subscriptions, plans, and support tickets. `/admin/settings` now presents a concrete SaaS-only operational view with workspace, staff, plan, and open-ticket indicators, a documented retention-policy matrix, the latest audit timestamp, and explicit statements that no automatic destructive deletion is enabled in the current environment.

The retention surface is intentionally a governance and visibility layer rather than an unreviewed deletion worker. Account export is available; any permanent deletion must remain a documented, reviewed SaaS operation. The admin settings view also records the production database, webhook, backup-responsibility, and LMS link-only boundaries without exposing LMS data.

## Contract and safety evidence

Required billing truth is preserved: payment webhook confirmation remains the source of truth for real-provider activation, and local checkout is explicitly marked as test mode. Subscription activation is SaaS-only. Link-only LMS mode stores URL, display name, status, and optional reachability metadata; reachability is not presented as full LMS health. Usage and reports label SaaS-owned source and freshness, while unsupported educational metrics remain explicitly unavailable. API responses are protected by global and route-local no-store policies, and authenticated client reads use `cache: 'no-store'`.

The complete regression matrix passes the current 67-route production build, Prisma validation for SQLite and PostgreSQL schemas, API smoke, public and resource discovery, degraded plans behavior, security, authentication, edge cases, tenant isolation, subscription lifecycle, account routes including onboarding, admin guards, production configuration, final-window status, safe error-boundary, LMS-independence, collection-bounds, and dependency-audit checks.

## Remaining production boundaries

The canonical Vercel deployment has historically returned a controlled degraded `/api/plans` response when its configured PostgreSQL endpoint is unavailable. This is intentional fail-closed behavior: HTTP 200 with an empty catalog, `degraded: true`, `retry-after: 60`, `x-centralia-degraded`, and `cache-control: no-store`. Restoring the live catalog requires valid production database connectivity and must not involve an LMS database.

A real payment provider still requires production credentials and webhook configuration. Backup and restore remain responsibilities of the production hosting and database environment; the application now documents this boundary but does not claim to perform provider-level backups. Automated retention deletion, staff role granularity beyond the existing staff guard, advanced admin search/filters, delivery retries, and a formal LMS integration contract remain intentionally incomplete. The integration deferral is correct until an approved external LMS API contract exists.

## Current execution-window evidence

The required execution window is measured from the system clock: `started_at_epoch=1787000113`, `required_completion_epoch=1787043313`, and `required_duration_seconds=43200`. The latest checkpoint is recorded separately in `execution-window-current.json`. A successful local regression matrix is quality evidence, not evidence that production PostgreSQL or a real payment provider has been configured.
