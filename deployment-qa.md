# Deployment QA

The Vercel project `saas` is linked to `sayouuuuud/saas` in team `itz4kairo-5176's projects` with project ID `prj_gkITRxYVuxcZvsutoPniiwm6EmSH` and framework `nextjs`.

The first full-stack deployment (`dpl_GXS4CgKPTUMX26BFyC8LuoEKJbDD`) failed because Vercel's frozen pnpm install detected an overrides mismatch. The fix moved the `hono` override from the obsolete package-level `pnpm` field into `pnpm-workspace.yaml`, regenerated `pnpm-lock.yaml`, and was pushed in commit `3ab1908`.

The corrected production deployment (`dpl_J8kXGLzUP18B39YwhK4kRQhPhnYC`) reached `READY` at the deployment URL `https://saas-9gcnx6mz5-itz4kairo-5176s-projects.vercel.app/`. The project domains include `https://saas-gold-seven-80.vercel.app`, `https://saas-itz4kairo-5176s-projects.vercel.app`, and `https://saas-git-main-itz4kairo-5176s-projects.vercel.app`.

A production URL fetch returned HTTP 302 to Vercel SSO, indicating deployment protection is enabled. The deployment itself is ready; application-level smoke tests were run locally because the protected production URL requires an authenticated or temporary shareable access path.
