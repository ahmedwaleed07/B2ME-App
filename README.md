# B2ME — Business to Me

An Iraq-first B2B discovery platform for businesses and freelance service providers. This repository is **separate from MIRA and VYRSIA**.

## Current status
- `index.html`: self-contained Arabic/English **UI prototype**, with the approved B2ME wordmark and updated ASAS 360° neon shield + wordmark on the first-screen footer.
- `provider-dashboard.html`: **separate web dashboard prototype** for supplier profiles, services and offers. Providers do not edit offers in the consumer app.
- `docs/LIVE_SUPABASE_STATUS.md`: live Supabase project details, schema/security status and integration tasks.\n- `supabase/migrations/0001_initial_schema.sql`: **obsolete draft, do not execute**; live schema was provisioned separately and differs.
- `tests/test_schema_contract.py`: basic static security-policy checks.
- `docs/IMPLEMENTATION.md`: implementation and go-live checklist.
- Live B2ME-only Supabase project **exists** with 12 RLS-protected tables, signup/trial/inquiry-notification triggers, indexes, and scoped image storage. However the web UI is **not connected** to this database yet; auth, email delivery, mobile push, and paid billing are not active. Demo data remain local only.

## Product decisions
- **Iraq first**, extendable to new countries later.
- **Email-only** signup/signin and a Remember Me option.
- First-screen-only slogan: "كل الحلول اليحتاجها عملك بمكان واحد" / "All the solutions your business needs in one place".
- First-screen-only footer: "Powered by" + approved ASAS 360° logo with pink/purple gradient, single line.
- Browse companies, products and services; categories, favorites, search, recent listings, relevant suggestions, sponsored offers and notifications.
- Providers can be **companies or freelancers**, but manage all published information from the separate web dashboard.
- Contact requests are delivered by email **after** implementing a protected backend with rate limiting; providers deal with customers outside the app.
- Subscriptions, promotional placement, and campaign emails require admin approval and appropriate opt-in.

## Security and operations
- Public GitHub repo means code is publicly readable. **Never commit secret keys, customer data, real emails or passwords**.
- Provider status and paid placements are admin-only; changes to live listings/offers require review.
- User-scoped private inquiries, favorites and notifications now have live RLS policies. Structural and permission checks have passed, but multi-account end-to-end signup and inquiry-email delivery tests are still pending.
- Supabase project must be created **independently**; never run the migration against MIRA, VYRSIA or the existing unidentified project.
- GitHub Pages is not the intended production hosting for a commercial marketplace; use suitable hosting once the app is ready.

## Static tests
```bash
python tests/test_schema_contract.py
```
Browser rendering, live PostgreSQL RLS and email delivery tests remain **pending**.

## Next deployment step
Connect the existing app and provider dashboard to the live B2ME Supabase backend using a browser-safe **publishable** key; then configure Auth email verification and redirect URLs, perform multi-user RLS tests, build protected admin approvals, and implement rate-limited transactional emails. **Do not run the old `0001_initial_schema.sql` draft against the live project.**\n\nSee [Live Supabase backend status](docs/LIVE_SUPABASE_STATUS.md).

No changes were made to MIRA or VYRSIA.
