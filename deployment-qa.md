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
