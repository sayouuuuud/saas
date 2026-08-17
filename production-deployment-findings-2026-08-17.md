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
