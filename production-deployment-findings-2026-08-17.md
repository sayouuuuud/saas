# Centralia production deployment findings — 2026-08-17

## Sources

- Canonical URL: https://saas-gold-seven-80.vercel.app/api/plans
- READY deployment: `dpl_9BbJXtb4DvLz6dPhyxVZQaQ2Nj47`
- Deployment URL: `https://saas-nfhthz0k4-itz4kairo-5176s-projects.vercel.app`
- Vercel project: `prj_gkITRxYVuxcZvsutoPniiwm6EmSH`
- Vercel team: `team_F40tsLoaehRB08rTOy8APApv`

## Deployment evidence

Vercel deployment metadata shows the READY production build was created at 2026-08-17T15:16:21Z from GitHub commit `4ca1960260cd2d8bd8eb17886414a76d23170a0b` with message `fix: harden plans catalog and regression verification`. The build log confirms `scripts/generate-prisma-client.mjs` selected `prisma/postgresql/schema.prisma` and received a redacted PostgreSQL URL with host `169.58.172.222`, port `5432`, and database `saas`.

## Live verification

At 2026-08-17T15:18:05Z, the canonical `/api/plans` endpoint returned HTTP 200 with `cache-control: no-store`, header `x-centralia-degraded: plans-database-unavailable`, and body `{"plans":[],"degraded":true}`. The canonical home page returned HTTP 200. The deployment-specific hostname redirected to Vercel SSO when fetched without the authenticated deployment cookie, so canonical routing is the authoritative check.

## Runtime evidence

Vercel grouped runtime errors for route `/api/plans` on deployment `dpl_9BbJXtb4DvLz6dPhyxVZQaQ2Nj47` as one `PrismaClientInitializationError` at 2026-08-17T15:18:05Z. The runtime-log query did not expose a more detailed message. The build succeeded, so this is a runtime database connectivity/configuration issue rather than a schema-generation failure.


## Public-surface probe — 2026-08-17T16:10:53Z

The canonical production hostname returned HTTP 200 for `/features`, `/how-it-works`, and `/pricing`, with the expected route-specific titles (`المزايا | مركزية`, `كيف تعمل | مركزية`, and `الأسعار | مركزية`). However, `/robots.txt` and `/sitemap.xml` returned the existing landing-page HTML rather than their expected text/XML route payloads, confirming that the robots-and-sitemap commit had not reached the canonical deployment at this checkpoint. This is a deployment-propagation observation, not a source or local-build failure; the local build enumerated both routes and the complete regression matrix passed their smoke assertions. The canonical response headers for the fallback landing page were `cache-control: private, no-cache, no-store, max-age=0, must-revalidate` and `content-type: text/html; charset=utf-8`.

## Account-surface propagation probe — 2026-08-17T16:44–16:45Z

The canonical hostname returned HTTP 200 for the existing public and account route probes, `application/xml` for `/sitemap.xml`, `text/plain` for `/robots.txt`, and the expected controlled degraded contract for `/api/plans`: HTTP 200, `cache-control: no-store`, `retry-after: 60`, `x-centralia-degraded: plans-database-unavailable`. The current canonical response still does not prove that the latest account/settings commits are deployed; route body markers for the newest account surfaces were absent during the probe, so deployment commit association remains authoritative.

The latest observed READY production deployment remains `dpl_5ZE2e6kUSXwEU1NEUgH2ix8tWpZc`, created from reports commit `e237a0feb731e4d584aa3c04d94a87c55afe01ce`. A read-only fetch of its deployment-specific hostname redirected to Vercel SSO (HTTP 302), so authenticated canonical routing remains the reliable public check.

A non-destructive request to reuse the linked Vercel project and build the latest main branch was rejected by Vercel with `402 payment_required`, resource `api-deployments-free-per-day`, remaining `0`, reset epoch `1787071517428`. No source, production environment, or LMS resource was changed by that rejected request. Until the quota resets or a user-managed Vercel deployment is available, the latest commits remain published to GitHub and fully verified locally but pending canonical Vercel propagation.

## Canonical account-route diagnosis — 2026-08-17T16:50Z

Direct canonical probes returned HTTP 200 for `/app/settings`, `/app/security`, and `/app/notifications`, but each response was a 10.7 KB landing/not-found shell with the landing title and no route-specific marker. This confirms that the canonical alias is still serving an older deployment rather than the current GitHub source. Local production builds enumerate all three routes and the full regression matrix passes them; no source rollback or LMS access was performed.

## Runtime-error grouping — 2026-08-17T16:50Z

The Vercel project’s last-24-hour grouped runtime-error query returned exactly one error group: `/api/plans` with `PrismaClientInitializationError`, count 2, affecting 2 users, first seen 15:18:05Z and last seen 16:44:18Z on deployment `dpl_5ZE2e6kUSXwEU1NEUgH2ix8tWpZc`. No additional production runtime-error groups were reported.

## Vercel propagation checkpoint — 2026-08-17T17:04Z

The read-only Vercel deployment listing shows the newest READY production deployment is `dpl_8EMVV11D8zMzqkiBifV6N936Ykyx`, created at epoch `1786985549370`, associated with commit `b707cf7bc80701ea76d2eb80bcaefaf889a57851` (`test: add canonical production smoke gate`). The current GitHub branch has since advanced through the dedicated team surface, reserved-port/process cleanup, compliance-report refresh, and final regression documentation commits, so those later revisions are not yet represented by a newer READY deployment in the observed listing. No deployment trigger was forced because prior Vercel deployment quota behavior was already documented and the current verification remains non-destructive.

## Canonical smoke reconfirmation — 2026-08-17T17:05Z

The read-only `pnpm test:canonical-production` gate passed against `https://saas-gold-seven-80.vercel.app`, reconfirming public route availability, robots/sitemap response types, transport/security headers, and the controlled `/api/plans` degraded contract. This validates the live alias independently of the still-lagging latest-commit association in the Vercel deployment listing.
