# QA Notes

- The local Next.js app renders at `http://localhost:3000` with Arabic RTL metadata and layout.
- Browser inspection confirmed the landing page contains the announcement bar, navigation, hero, dashboard preview, feature cards, workflow, pricing, clarity section, FAQ, CTA, and footer.
- Pricing toggle interaction verified through the browser console: selecting monthly prices renders `$19`, `$39`, and `$79`.
- FAQ accordion interaction verified: the second question opens and renders its answer about post-payment activation.
- `pnpm lint` passes with no errors or warnings after removing the unused icon import.
- `pnpm build` passes and prerenders the `/` and `/_not-found` routes.
- The current implementation is a polished landing/product-preview experience; it does not yet include authenticated dashboard routes, database models, payment webhooks, or production SaaS backend flows because the repository started as a single-page starter.

## Product route verification

The `/login` route renders the Arabic signup form and successfully switches to the login mode; the full-name field disappears and the copy changes to «مرحبًا بعودتك». The `/dashboard` route renders the RTL authenticated shell with sidebar navigation, account metrics, activity chart, billing cards, and an LMS-link panel. Activating «إضافة رابط» changes the panel to the connected state with `academy.example.com`, status confirmation, and an external launch link.
