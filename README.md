# B2ME — Business to Me

An Iraq-first B2B discovery platform for businesses and freelance service providers. This repository is **separate from MIRA and VYRSIA**.

## Current status
- `index.html`: self-contained Arabic/English **UI prototype**, with the approved B2ME wordmark and updated ASAS 360° neon shield + wordmark on the first-screen footer.
- `provider-dashboard.html`: **separate web dashboard prototype** for supplier profiles, services and offers. Providers do not edit offers in the consumer app.
- `supabase/migrations/0001_initial_schema.sql`: B2ME-only PostgreSQL/Supabase draft, **uploaded but NOT executed**.
- `tests/test_schema_contract.py`: basic static security-policy checks.
- `docs/IMPLEMENTATION.md`: implementation and go-live checklist.
- No live Supabase connection, real authentication, contact-request emails, mobile push, or paid billing yet. Demo records and local-only interactions are not production features.

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
- JWT-bound inquiry emails, user-scoped private inquiries, favorites and notifications use database RLS. These policies must still be exercised against a real B2ME test database.
- Supabase project must be created **independently**; never run the migration against MIRA, VYRSIA or the existing unidentified project.
- GitHub Pages is not the intended production hosting for a commercial marketplace; use suitable hosting once the app is ready.

## Static tests
```bash
python tests/test_schema_contract.py
```
Browser rendering, live PostgreSQL RLS and email delivery tests remain **pending**.

## Next deployment step
Create a separate Supabase **organization** for B2ME or explicitly select an existing organization, check the project cost, then create a dedicated project and apply the migration **after user confirmation**.

No changes were made to MIRA or VYRSIA.
