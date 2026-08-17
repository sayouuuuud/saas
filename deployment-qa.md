# Deployment QA

The Vercel project `saas` is linked to `sayouuuuud/saas` in team `itz4kairo-5176's projects` with project ID `prj_gkITRxYVuxcZvsutoPniiwm6EmSH` and framework `nextjs`.

The first full-stack deployment (`dpl_GXS4CgKPTUMX26BFyC8LuoEKJbDD`) failed because Vercel's frozen pnpm install detected an overrides mismatch. The fix moved the `hono` override from the obsolete package-level `pnpm` field into `pnpm-workspace.yaml`, regenerated `pnpm-lock.yaml`, and was pushed in commit `3ab1908`.

The corrected production deployment (`dpl_J8kXGLzUP18B39YwhK4kRQhPhnYC`) reached `READY` at the deployment URL `https://saas-9gcnx6mz5-itz4kairo-5176s-projects.vercel.app/`. The project domains include `https://saas-gold-seven-80.vercel.app`, `https://saas-itz4kairo-5176s-projects.vercel.app`, and `https://saas-git-main-itz4kairo-5176s-projects.vercel.app`.

A production URL fetch returned HTTP 302 to Vercel SSO, indicating deployment protection is enabled. The deployment itself is ready; application-level smoke tests were run locally because the protected production URL requires an authenticated or temporary shareable access path.

The subsequent application commit `adf876de903c207d8af525b7a7e51e098cad3a24` (`Complete SaaS product surfaces and auth security flows`) also reached `READY` as `dpl_G1SmME45ftmYAaLYFJdsNMSUNFqH`. A live fetch of `https://saas-cakvbtu5z-itz4kairo-5176s-projects.vercel.app/` returned HTTP 200 with `content-type: text/html`, `lang="ar"`, and `dir="rtl"`. The documentation-only follow-up commit is `32db101`.

Security-fix verification on 2026-08-17:

- Updated `@prisma/client` and `prisma` from 6.16.2 to 6.19.3 within Prisma major 6, updated PostCSS to 8.5.26, and added a workspace override forcing `nanoid` to patched 3.3.18.
- `pnpm audit --prod` now reports **No known vulnerabilities found**.
- `pnpm lint` and `pnpm build` both pass; the build generates all 33 application routes.
- Changes committed and pushed as `3e2a5a2` (`security: remove vulnerable dependency chain and patch transitive advisories`).
- Vercel production deployment `dpl_54jHacHnovSTFWMwCmxfFZba2o7c` for commit `3e2a5a2c294593130f7c6940727909525e60a7e3` is `READY`.
- Canonical domain `https://saas-gold-seven-80.vercel.app/` returns HTTP 200, `content-type: text/html`, `lang="ar"`, and `dir="rtl"`.

Production security-header verification for commit `b2a9447`:

- Vercel deployment `dpl_9qPnPz6oimgK4greuhArxEX43VmT` reached `READY` and aliases the canonical production domains.
- The canonical URL returned HTTP 200 and emitted all six configured headers: CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS.
- The new edge-case suite passed for duplicate registration, malformed JSON, unknown checkout plan, logout, and unauthenticated workspace access.

Performance verification for commit `7dd8cf9`:

- Added and applied migration `20260817094331_add_query_indexes`, indexing payment-to-invoice history, payment-method workspace lookup, and support-message ticket chronology.
- Prisma validation, migration status, all four smoke suites, lint, build, and `pnpm audit --prod` passed after the migration.
- Vercel deployment `dpl_32ebRoC8Q61FTQRifSKJDfYJoufE` reached `READY` and aliases the canonical production domains.
- Final canonical smoke check returned HTTP 200, six security headers, and the Arabic/RTL markers.

Session and runtime verification for commit `88ac057`:

- Removed the unused eager `lmsLinks` relation from `getCurrentUser()` session hydration to reduce per-request database payloads without changing route contracts.
- Lint, production build, API, security, authentication, and edge-case smoke suites all passed after the optimization.
- Vercel deployment `dpl_DtZHeStTUmrQEDn5VUDj9rmLR1xv` reached `READY` for commit `88ac057e4e13b78dd90d36d6cbf775f792946107`.
- Vercel reported no grouped runtime errors for the SaaS project in the selected 24-hour production window.

Public surface verification:

- The canonical production domain returned HTTP 200 with `dir="rtl"` for the landing page, authentication pages, billing, support, legal pages, use-case pages, and resource pages.
- The required real-time window remains active in `execution-window.json`; at 2026-08-17T09:53:13Z the measured elapsed duration was 3,970 seconds and the required completion epoch remained 1786999623 (2026-08-17T20:47:03Z).

Regression and tenant-isolation verification for commit `056907d` and the follow-up QA additions:

- After removing eager LMS-link loading from generic sessions, `/api/auth/me` was corrected to fetch the minimal five-link projection explicitly, preserving the dashboard's connected-link state while keeping other session queries lean.
- The API smoke suite now asserts that an existing `Demo Academy` link is present in the authenticated user payload; the full API, security, authentication, edge-case, and tenant-isolation suites passed.
- The tenant-isolation suite confirmed that a second workspace receives HTTP 404 when attempting to delete or check the first workspace's LMS link.
- Direct canonical production smoke verification continued to return HTTP 200 with six security headers and Arabic RTL markers after the fix was pushed.

Webhook robustness and regression coverage:

- The billing webhook now catches malformed or non-object JSON after signature verification, marks the event as rejected with `invalid_json`, and returns HTTP 400 instead of throwing an unhandled exception.
- `security-smoke.sh` now signs and exercises malformed JSON, and the complete local suite passed: lint, production build, API smoke, security smoke, authentication security, edge cases, and tenant isolation.
- The tenant-isolation test continues to confirm that cross-workspace LMS-link delete and check requests return HTTP 404.

Final local verification timestamp: 2026-08-17T10:10:00Z (recorded during the active real-time execution window).


The canonical Vercel domain was rechecked after the webhook-hardening push at approximately 2026-08-17T10:11:49Z. It returned HTTP 200, one CSP header, six configured security-header matches, and an Arabic RTL marker.


Accessibility refinement verification:

The dashboard, login, and billing surfaces now use explicit non-submit button types for interactive controls and Arabic `aria-label` values for icon-only actions such as sidebar, notification, settings, and payment controls. After these changes, lint, production build, API smoke, security smoke, authentication security, edge-case, and tenant-isolation suites all passed at 2026-08-17T11:17:50Z.


Shared authentication-form hardening:

The verification, forgot-password, and reset-password flows now provide browser autocomplete hints, explicit submit semantics, accessible live status and alert roles, and a user-safe network failure message. The complete lint, build, API, security, authentication, edge-case, and tenant-isolation suite passed at 2026-08-17T11:20:56Z.


Support-page accessibility hardening:

The support flow now uses explicit button types, names form controls, exposes success and error feedback to assistive technology, and labels ticket/filter controls. Lint, production build, API, security, authentication, edge-case, and tenant-isolation smoke tests all passed at 2026-08-17T11:21:58Z.


Landing-page accessibility hardening:

The high-traffic landing page now exposes mobile-menu state and controls, gives pricing-cycle buttons explicit pressed semantics, labels the preview action, and adds keyboard-friendly FAQ accordion relationships. Lint, production build, API, security, authentication, edge-case, and tenant-isolation smoke tests all passed at 2026-08-17T11:22:53Z.


Profile API input hardening:

The authenticated profile PATCH endpoint now rejects malformed JSON and non-object payloads deterministically with HTTP 400 instead of falling through to a generic server error. The edge-case smoke suite now covers this regression and passed at 2026-08-17T11:24:05Z; the preceding full lint/build/API/security/auth/edge/tenant suite also passed.


Live verification after profile hardening:

The canonical Vercel domain returned HTTP 200 with Arabic RTL markers and the configured CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy headers at 2026-08-17T11:24:31Z. The repository working tree was clean after the pushed commit.


Workspace API input hardening:

The workspace rename endpoint now rejects malformed JSON and non-object payloads with HTTP 400, and the edge-case smoke test covers both profile and workspace malformed PATCH requests. The expanded edge test, lint, and production build passed at 2026-08-17T11:25:14Z.


Support-ticket action validation:

Ticket close/reopen/message actions now use a bounded Zod schema that rejects unsupported actions, malformed payloads, and oversized messages before database mutation. API smoke coverage now asserts an unsupported action returns HTTP 400. After correcting the smoke test to extract the top-level ticket ID, the full lint, production build, API, security, authentication, edge-case, and tenant-isolation suite passed at 2026-08-17T11:27:21Z.


SSRF hardening:

LMS URL safety now normalizes IP addresses and rejects IPv4-mapped IPv6 private addresses, IPv6 unspecified/loopback addresses, and existing private/link-local ranges. Security smoke coverage now explicitly rejects an HTTPS localhost LMS URL. Security, lint, production build, API, authentication, edge-case, and tenant-isolation tests passed at 2026-08-17T11:28:52Z.


Integrity and dependency audit:

At 2026-08-17T11:29:15Z, Prisma validation passed, all three local migrations were applied with the database schema up to date, and `pnpm audit --prod` reported no known vulnerabilities.


Performance footprint audit:

At 2026-08-17T11:30:08Z, the deploy-relevant `.next/server` output measured 15 MB and `.next/static` measured 820 KB. The larger 604 MB aggregate `.next` size was dominated by local Turbopack development/cache artifacts (`.next/dev` and `.next/cache`), not production runtime assets. The largest client JavaScript chunk was approximately 229 KB before compression; no code change was required from this audit.


Latest production deployment verification:

Vercel reported deployment `dpl_5dtoLm7iZAr1SkAZLcxi13CBsWW3` for commit `87e98d6` as READY and production-targeted. The deployment-specific URL is protected by Vercel Authentication and therefore redirects unauthenticated requests to Vercel SSO; this is platform protection, not an application response. The canonical production alias was independently checked at 2026-08-17T11:31:48Z and returned HTTP 200 with the Centralia Arabic RTL marker plus CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict referrer policy headers.


Production observability:

The Vercel grouped runtime-error query for the SaaS project returned no runtime errors in the selected 24-hour window at 2026-08-17T11:34:16Z.


Authentication abuse-resistance hardening:

Added a bounded route-scoped burst limiter for login, registration, password recovery, password reset, and email verification. Production requests use the platform client address; explicit test identities are honored only outside production to keep local smoke suites deterministic. The security suite now proves login returns HTTP 429 after the configured threshold, and the complete lint, production build, API, authentication, edge-case, and tenant-isolation suites passed at 2026-08-17T11:38:04Z.


Deployment propagation note:

At 2026-08-17T11:39:28Z, GitHub reported the Vercel status for commit `ce58cd5` as `failure` with target `upgradeToPro=build-rate-limit`. No new deployment was listed for the commit. This is an external Vercel build-quota/platform limitation, distinct from the passing local lint/build/smoke suite and the still-healthy previous canonical READY deployment. The latest commit must not be described as live until Vercel accepts a new build or an alternative deployment path is explicitly used.

Subscription lifecycle hardening verification:

At 2026-08-17T11:45:25Z, cancellation, reactivation, and plan-change routes were hardened. Subscription mutations now require OWNER or BILLING_MANAGER membership, execute state changes and audit/event records atomically, reject terminal `CANCELLED` transitions with HTTP 409, reject inactive plans, and return idempotent `unchanged` responses for repeated cancel/reactivate requests. The new `scripts/subscription-lifecycle-smoke.sh` passed, as did the complete API, security, authentication, edge-case, and tenant-isolation smoke matrix, `pnpm lint`, and `pnpm build`.

Vercel status for the pushed follow-up commit `db7f3e6` was checked at 2026-08-17T11:45:59Z and again returned `failure` with `upgradeToPro=build-rate-limit`; no new production deployment was accepted. The canonical live result therefore remains the previously verified READY deployment, while `db7f3e6` is verified locally and present on GitHub but not claimed as live.

Checkout consistency hardening:

At 2026-08-17T11:46:44Z, the mock checkout mutation was aligned with the subscription lifecycle policy: only OWNER and BILLING_MANAGER members may manage billing, request fields are bounded, terminal subscriptions can only be reactivated through an explicit checkout, and invoice/payment identifiers use UUIDs rather than millisecond timestamps to avoid collision under concurrent requests. Lint, production build, and all six smoke suites passed after the change.

Webhook audit and test determinism follow-up:

At 2026-08-17T11:49:33Z, successful payment webhooks were extended to write a transactional `PAYMENT` audit record containing the provider event and invoice metadata. During retesting, the security smoke suite was corrected to generate a unique per-run test client identity, and the lifecycle suite was corrected to generate a unique webhook event ID; this prevents stale in-memory limiter buckets and prior event payloads from contaminating later local runs. The security and subscription lifecycle suites both passed after the fixes.

Session query optimization:

At 2026-08-17T11:51:35Z, generic session hydration was reduced to the user and workspace identity projection (`id`, `name`) only. `/api/auth/me` now retrieves the plan/subscription presentation fields and the five LMS-link summaries in parallel, preserving its response contract while avoiding unnecessary relation payloads on every authenticated request. Lint, production build, API, security, authentication, edge-case, tenant-isolation, and subscription lifecycle suites all passed.

Usage-history aggregation optimization:

At 2026-08-17T11:53:25Z, `/api/usage/history` was changed from fetching every 30-day audit row and grouping in JavaScript to a workspace-scoped SQLite `GROUP BY DATE(createdAt)` query that returns only daily aggregates. The existing composite `AuditLog(workspaceId, createdAt)` index remains aligned with the filter. Lint, production build, and the complete API, security, authentication, edge-case, tenant-isolation, and subscription lifecycle suites passed.

Support-ticket list performance:

At 2026-08-17T11:54:31Z, `GET /api/tickets` was bounded to a default maximum of 25 and an absolute maximum of 50 records, with scalar field projection, message count, and only the latest message metadata. The detail endpoint remains responsible for the complete non-internal conversation. This prevents a growing workspace from loading every ticket and every message into a single list response. Lint, production build, and all six smoke suites passed.

Smoke-test repeatability hardening:

At 2026-08-17T11:56:38Z, the API, authentication, edge-case, and subscription smoke suites were updated to generate unique per-run test client identities, matching the earlier security-suite fix. This prevents local in-memory auth rate-limit buckets from causing false failures during repeated verification while preserving the security suite’s intentional same-identity burst test. The complete six-suite matrix passed after the changes.

