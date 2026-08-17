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

## Vercel propagation success — 2026-08-17T17:09Z

The deployment listing now shows READY production deployment `dpl_CB2LTcaiRDhgxJA5enV7rzNVSqfP`, created at epoch `1786986486628`, associated with GitHub commit `f8376381085c65f98edf39968396bf7845985c25` (`security: audit client fetch caching`). This confirms the client-fetch cache hardening reached a READY Vercel build. The subsequent documentation-only regression commit `069acc5` is newer than this deployment and remains pending in the observed list; canonical live behavior continues to be covered by the read-only production smoke gate.

## Canonical smoke after READY cache deployment — 2026-08-17T17:10Z

The read-only `pnpm test:canonical-production` gate passed after deployment `dpl_CB2LTcaiRDhgxJA5enV7rzNVSqfP` reached READY, reconfirming the canonical public routes, response security headers, robots/sitemap content types, and controlled `/api/plans` degradation behavior.

## Runtime-error check after cache deployment — 2026-08-17T17:10Z

The read-only grouped runtime-error query for the recent one-hour window returned exactly one group: `/api/plans` database-backed catalog unavailable (`PrismaClientInitializationError`), count 6 across 4 users, first seen 15:18:05Z and last seen 17:10:13Z, with last deployment `dpl_CB2LTcaiRDhgxJA5enV7rzNVSqfP`. No new runtime-error group was observed for the cache-hardening deployment or any other route.

## Propagation checkpoint after private admin noindex — 2026-08-17T17:17Z

The Vercel deployment listing remains capped at READY commit `f8376381085c65f98edf39968396bf7845985c25` (`security: audit client fetch caching`, deployment `dpl_CB2LTcaiRDhgxJA5enV7rzNVSqfP`). The local repository has since advanced through the private-admin noindex implementation and subsequent QA commits, including `7148025`; no READY deployment for that revision was present in this read-only listing. Local source and regression evidence are therefore current, while live verification must continue to distinguish the deployed cutoff from unpropagated source changes.

## Repeated propagation checkpoint — 2026-08-17T17:19Z

A second read-only Vercel deployment listing returned the same newest READY production deployment `dpl_CB2LTcaiRDhgxJA5enV7rzNVSqfP` at commit `f8376381085c65f98edf39968396bf7845985c25`. No deployment for the private-admin noindex or exact-duration commits was visible yet; local source verification remains green and the live cutoff is explicitly retained.

## Live propagation transition — 2026-08-17T17:23Z

Vercel now reports a production deployment for commit `142ef260842c3ca52f665ff9ba2760a5a5a5452b` (`test: document final repository cleanliness recheck`) in `BUILDING` state (`dpl_HcqgwTCFe3Z8kynRfdPd9sf1P1F5`). The strengthened canonical smoke was run read-only during this transition and exited nonzero only because the current alias lacked the newly required `/admin` noindex metadata; no source or local-regression failure was observed. The final verifier must continue waiting for a READY deployment before its strict canonical gate can pass.

## Deployment rate-limit checkpoint — 2026-08-17T17:35Z

GitHub reports the Vercel status for commit `9735af8` as `failure` with the provider message `Deployment rate limited — retry in 24 hours`. The canonical alias remains independently green under `pnpm test:canonical-production`, and all local production/regression gates pass on the latest source. This is an external Vercel propagation constraint, not an application build or test failure; the exact final gate records both facts.
